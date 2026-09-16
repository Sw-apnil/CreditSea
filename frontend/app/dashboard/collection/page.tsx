'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DataTable, type Column } from '@/components/dashboard/DataTable';
import { Alert, Button, EmptyState, Field, Modal, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api, ApiRequestError } from '@/lib/api';
import { LOAN_STATUS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/loanMath';
import type { Application, Loan, PaginationMeta, Payment, User } from '@/lib/types';

export default function CollectionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [selected, setSelected] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [form, setForm] = useState({ utrNumber: '', amount: '', paymentDate: new Date().toISOString().slice(0, 10) });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ loans: Loan[]; pagination: PaginationMeta }>('/collection/loans?limit=50');
      setLoans(data.loans);
      setMeta(data.pagination);
      setError('');
    } catch {
      setError('Could not load active loans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = async (loan: Loan) => {
    setSelected(loan);
    setModalError('');
    setForm({ utrNumber: '', amount: '', paymentDate: new Date().toISOString().slice(0, 10) });
    try {
      const data = await api.get<{ payments: Payment[] }>(`/collection/loans/${loan.id}/payments`);
      setPayments(data.payments);
    } catch {
      setPayments([]);
    }
  };

  const record = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setModalError('');
    try {
      const data = await api.post<{ loan: Loan; closed: boolean }>(`/collection/loans/${selected.id}/payments`, {
        utrNumber: form.utrNumber,
        amount: Number(form.amount),
        paymentDate: form.paymentDate,
      });
      setNotice(
        data.closed
          ? 'Payment recorded — the loan is fully repaid and now closed.'
          : `Payment recorded. Outstanding: ${formatCurrency(data.loan.outstandingAmount)}.`,
      );
      setSelected(null);
      await load();
    } catch (err) {
      setModalError(err instanceof ApiRequestError ? err.message : 'Could not record the payment');
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Loan>[] = [
    {
      key: 'borrower',
      header: 'Borrower',
      render: (loan) => {
        const application = typeof loan.applicationId === 'object' ? (loan.applicationId as Application) : null;
        const user = typeof loan.userId === 'object' ? (loan.userId as User) : null;
        return (
          <div>
            <p className="font-medium text-slate-900">{application?.fullName ?? user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        );
      },
    },
    { key: 'total', header: 'Repayment', render: (loan) => formatCurrency(loan.totalRepayment) },
    { key: 'paid', header: 'Paid', render: (loan) => formatCurrency(loan.amountPaid) },
    {
      key: 'outstanding',
      header: 'Outstanding',
      render: (loan) => (
        <span className={loan.outstandingAmount === 0 ? 'text-emerald-600' : 'font-semibold text-slate-900'}>
          {formatCurrency(loan.outstandingAmount)}
        </span>
      ),
    },
    { key: 'due', header: 'Due', render: (loan) => formatDate(loan.dueDate), hideOnMobile: true },
    { key: 'status', header: 'Status', render: (loan) => <StatusBadge status={loan.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Collection — repayments" subtitle="Record borrower payments against disbursed loans." />

      {notice && (
        <div className="mb-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : loans.length === 0 ? (
        <EmptyState title="No active loans" hint="Disbursed loans will appear here." />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">{meta?.total ?? loans.length} loans</p>
          <DataTable
            columns={columns}
            rows={loans}
            rowKey={(loan) => loan.id}
            actions={(loan) => (
              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => void open(loan)}>
                {loan.status === LOAN_STATUS.CLOSED ? 'View payments' : 'Record payment'}
              </Button>
            )}
          />
        </>
      )}

      <Modal open={Boolean(selected)} title="Payments" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Outstanding</span>
                <span className="font-semibold text-slate-900">{formatCurrency(selected.outstandingAmount)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${(selected.amountPaid / selected.totalRepayment) * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {formatCurrency(selected.amountPaid)} of {formatCurrency(selected.totalRepayment)} repaid
              </p>
            </div>

            {payments.length > 0 && (
              <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto text-sm">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-slate-800">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-slate-500">UTR {payment.utrNumber}</p>
                    </div>
                    <span className="text-xs text-slate-500">{formatDate(payment.paymentDate)}</span>
                  </li>
                ))}
              </ul>
            )}

            {selected.status === LOAN_STATUS.CLOSED ? (
              <Alert tone="success">This loan is fully repaid and closed.</Alert>
            ) : (
              <form onSubmit={record} className="space-y-3 border-t border-slate-200 pt-4">
                {modalError && <Alert>{modalError}</Alert>}
                <Field
                  label="UTR number"
                  required
                  value={form.utrNumber}
                  hint="Must be unique across all payments"
                  onChange={(e) => setForm({ ...form, utrNumber: e.target.value.toUpperCase() })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Amount (Rs.)"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selected.outstandingAmount}
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                  <Field
                    label="Payment date"
                    type="date"
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    value={form.paymentDate}
                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setForm({ ...form, amount: String(selected.outstandingAmount) })}
                  >
                    Pay in full
                  </Button>
                  <Button type="submit" loading={busy}>
                    Record payment
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
