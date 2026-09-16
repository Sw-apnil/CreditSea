'use client';

import { useCallback, useEffect, useState } from 'react';
import { DataTable, type Column } from '@/components/dashboard/DataTable';
import { Alert, Button, EmptyState, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api, ApiRequestError } from '@/lib/api';
import { LOAN_STATUS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/loanMath';
import type { Application, Loan, PaginationMeta, User } from '@/lib/types';

export default function DisbursementPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ loans: Loan[]; pagination: PaginationMeta }>('/disbursement/loans?limit=50');
      setLoans(data.loans);
      setMeta(data.pagination);
      setError('');
    } catch {
      setError('Could not load the disbursement queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const disburse = async (loan: Loan) => {
    setBusyId(loan.id);
    setError('');
    try {
      await api.patch(`/disbursement/loans/${loan.id}/disburse`);
      setNotice(`Disbursed ${formatCurrency(loan.principal)}.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not mark the loan as disbursed');
    } finally {
      setBusyId(null);
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
    { key: 'principal', header: 'To disburse', render: (loan) => formatCurrency(loan.principal) },
    { key: 'total', header: 'Repayment', render: (loan) => formatCurrency(loan.totalRepayment), hideOnMobile: true },
    { key: 'tenure', header: 'Tenure', render: (loan) => `${loan.tenureDays} days`, hideOnMobile: true },
    { key: 'sanctioned', header: 'Sanctioned', render: (loan) => formatDate(loan.sanctionedAt) },
    { key: 'status', header: 'Status', render: (loan) => <StatusBadge status={loan.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Disbursement — payouts" subtitle="Release funds for sanctioned loans." />

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
        <EmptyState title="Nothing awaiting disbursement" hint="Sanctioned loans will appear here." />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">{meta?.total ?? loans.length} loans</p>
          <DataTable
            columns={columns}
            rows={loans}
            rowKey={(loan) => loan.id}
            actions={(loan) =>
              loan.status === LOAN_STATUS.SANCTIONED ? (
                <Button
                  className="px-3 py-1.5 text-xs"
                  loading={busyId === loan.id}
                  onClick={() => void disburse(loan)}
                >
                  Mark disbursed
                </Button>
              ) : (
                <span className="text-xs text-slate-400">Disbursed {formatDate(loan.disbursedAt)}</span>
              )
            }
          />
        </>
      )}
    </div>
  );
}
