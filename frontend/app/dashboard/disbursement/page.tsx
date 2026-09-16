'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable, type Column } from '@/components/dashboard/DataTable';
import { Alert, Button, EmptyState, Icon, PageHeader, QueueSkeleton, StatusBadge, Toast } from '@/components/ui';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  const visibleLoans = useMemo(() => loans.filter((loan) => {
    const application = typeof loan.applicationId === 'object' ? (loan.applicationId as Application) : null;
    const user = typeof loan.userId === 'object' ? (loan.userId as User) : null;
    const haystack = `${application?.fullName ?? ''} ${user?.name ?? ''} ${user?.email ?? ''}`.toLowerCase();
    return (!search.trim() || haystack.includes(search.trim().toLowerCase())) && (statusFilter === 'ALL' || loan.status === statusFilter);
  }), [loans, search, statusFilter]);

  return (
    <div>
      <PageHeader title="Disbursement — payouts" subtitle="Release funds for sanctioned loans." />

      {notice && <Toast message={notice} onClose={() => setNotice('')} />}
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {!loading && loans.length > 0 && <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:flex-row"><div className="relative min-w-0 flex-1"><Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search disbursement queue" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by borrower name or email" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100/70" /></div><select aria-label="Filter disbursement queue" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100/70"><option value="ALL">All statuses</option><option value={LOAN_STATUS.SANCTIONED}>Sanctioned</option><option value={LOAN_STATUS.DISBURSED}>Disbursed</option></select></div>}

      {loading ? (
        <QueueSkeleton />
      ) : loans.length === 0 ? (
        <EmptyState title="Nothing awaiting disbursement" hint="Sanctioned loans will appear here." />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">Showing {visibleLoans.length} of {meta?.total ?? loans.length} loans</p>
          <DataTable
            columns={columns}
            rows={visibleLoans}
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
