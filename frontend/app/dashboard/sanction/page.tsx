'use client';

import { useCallback, useEffect, useState } from 'react';
import { DataTable, type Column } from '@/components/dashboard/DataTable';
import { Alert, Button, EmptyState, Modal, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api, API_URL, ApiRequestError } from '@/lib/api';
import { LOAN_STATUS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/loanMath';
import type { Application, Loan, PaginationMeta, User } from '@/lib/types';

const borrowerOf = (loan: Loan) => (typeof loan.userId === 'object' ? (loan.userId as User) : null);
const applicationOf = (loan: Loan) =>
  typeof loan.applicationId === 'object' ? (loan.applicationId as Application) : null;

export default function SanctionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [selected, setSelected] = useState<Loan | null>(null);
  const [rejecting, setRejecting] = useState<Loan | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ loans: Loan[]; pagination: PaginationMeta }>('/sanction/loans?limit=50');
      setLoans(data.loans);
      setMeta(data.pagination);
      setError('');
    } catch {
      setError('Could not load the sanction queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (loan: Loan, action: 'approve' | 'reject', rejectionReason?: string) => {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/sanction/loans/${loan.id}`, action === 'approve' ? { action } : { action, reason: rejectionReason });
      setNotice(action === 'approve' ? 'Loan sanctioned.' : 'Loan rejected.');
      setSelected(null);
      setRejecting(null);
      setReason('');
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not update the loan');
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Loan>[] = [
    {
      key: 'borrower',
      header: 'Borrower',
      render: (loan) => (
        <div>
          <p className="font-medium text-slate-900">{applicationOf(loan)?.fullName ?? borrowerOf(loan)?.name}</p>
          <p className="text-xs text-slate-500">{applicationOf(loan)?.pan ?? borrowerOf(loan)?.email}</p>
        </div>
      ),
    },
    { key: 'principal', header: 'Amount', render: (loan) => formatCurrency(loan.principal) },
    { key: 'tenure', header: 'Tenure', render: (loan) => `${loan.tenureDays} days`, hideOnMobile: true },
    { key: 'total', header: 'Repayment', render: (loan) => formatCurrency(loan.totalRepayment) },
    { key: 'applied', header: 'Applied', render: (loan) => formatDate(loan.createdAt), hideOnMobile: true },
    { key: 'status', header: 'Status', render: (loan) => <StatusBadge status={loan.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Sanction — approvals" subtitle="Review applied loans and approve or reject them." />

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
        <EmptyState title="Nothing to review" hint="New applications will appear here." />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">{meta?.total ?? loans.length} loans</p>
          <DataTable
            columns={columns}
            rows={loans}
            rowKey={(loan) => loan.id}
            actions={(loan) => (
              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setSelected(loan)}>
                Review
              </Button>
            )}
          />
        </>
      )}

      <Modal open={Boolean(selected)} title="Review application" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Applicant', applicationOf(selected)?.fullName ?? '—'],
                ['Email', borrowerOf(selected)?.email ?? '—'],
                ['PAN', applicationOf(selected)?.pan ?? '—'],
                ['Monthly salary', applicationOf(selected)?.monthlySalary ? formatCurrency(applicationOf(selected)!.monthlySalary!) : '—'],
                ['Employment', applicationOf(selected)?.employmentMode ?? '—'],
                ['Date of birth', formatDate(applicationOf(selected)?.dob)],
                ['Principal', formatCurrency(selected.principal)],
                ['Tenure', `${selected.tenureDays} days`],
                ['Interest', formatCurrency(selected.simpleInterest)],
                ['Total repayment', formatCurrency(selected.totalRepayment)],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
                  <dd className="mt-0.5 font-medium capitalize text-slate-800">{value as string}</dd>
                </div>
              ))}
            </dl>

            <a
              href={`${API_URL}/sanction/loans/${selected.id}/salary-slip`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-medium text-brand-600 hover:underline"
            >
              View salary slip →
            </a>

            {selected.status === LOAN_STATUS.APPLIED ? (
              <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                <Button loading={busy} onClick={() => void decide(selected, 'approve')}>
                  Approve
                </Button>
                <Button variant="danger" onClick={() => setRejecting(selected)}>
                  Reject
                </Button>
              </div>
            ) : (
              <Alert tone="info">
                This loan is already {selected.status.toLowerCase()}
                {selected.rejectionReason ? `: ${selected.rejectionReason}` : '.'}
              </Alert>
            )}
          </div>
        )}
      </Modal>

      <Modal open={Boolean(rejecting)} title="Reject this application" onClose={() => setRejecting(null)}>
        <div className="space-y-4">
          <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
            Reason for rejection
          </label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="The borrower will see this."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={busy}
              disabled={reason.trim().length < 5}
              onClick={() => rejecting && void decide(rejecting, 'reject', reason)}
            >
              Confirm rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
