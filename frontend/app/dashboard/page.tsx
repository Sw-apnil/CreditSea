'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Card, EmptyState, Icon, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { ROLE_MODULES, type Role } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/loanMath';
import { useAuth } from '@/lib/auth-context';
import type { Application, Lead, Loan, PaginationMeta, User } from '@/lib/types';

type ModuleKey = 'sales' | 'sanction' | 'disbursement' | 'collection';
type QueueItem = { module: ModuleKey; name: string; detail: string; amount?: number; status: string; createdAt?: string };

const MODULE_META: Record<ModuleKey, { label: string; description: string; icon: 'users' | 'file' | 'transfer' | 'wallet'; href: string; accent: string }> = {
  sales: { label: 'Sales', description: 'Track borrowers before they apply.', icon: 'users', href: '/dashboard/sales', accent: 'bg-blue-50 text-blue-700' },
  sanction: { label: 'Sanction', description: 'Review and decide applied loans.', icon: 'file', href: '/dashboard/sanction', accent: 'bg-violet-50 text-violet-700' },
  disbursement: { label: 'Disbursement', description: 'Release approved loan amounts.', icon: 'transfer', href: '/dashboard/disbursement', accent: 'bg-amber-50 text-amber-700' },
  collection: { label: 'Collection', description: 'Record repayments and close loans.', icon: 'wallet', href: '/dashboard/collection', accent: 'bg-emerald-50 text-emerald-700' },
};

const getBorrower = (loan: Loan) => {
  const application = typeof loan.applicationId === 'object' ? (loan.applicationId as Application) : null;
  const user = typeof loan.userId === 'object' ? (loan.userId as User) : null;
  return { name: application?.fullName ?? user?.name ?? 'Borrower', detail: user?.email ?? 'Loan application' };
};

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Partial<Record<ModuleKey, number>>>({});
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const allowed = useMemo(() => (user ? (ROLE_MODULES[user.role] as ModuleKey[]) : []), [user]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const results = await Promise.all(allowed.map(async (module): Promise<{ module: ModuleKey; total: number; items: QueueItem[] }> => {
        if (module === 'sales') {
          const data = await api.get<{ leads: Lead[]; pagination: PaginationMeta }>('/sales/leads?limit=5');
          return { module, total: data.pagination.total, items: data.leads.map((lead) => ({ module, name: lead.fullName ?? lead.name, detail: lead.email, status: lead.step })) };
        }
        const data = await api.get<{ loans: Loan[]; pagination: PaginationMeta }>(`/${module}/loans?limit=5`);
        return { module, total: data.pagination.total, items: data.loans.map((loan) => { const borrower = getBorrower(loan); return { module, name: borrower.name, detail: borrower.detail, amount: loan.totalRepayment, status: loan.status, createdAt: loan.createdAt }; }) };
      }));
      setCounts(Object.fromEntries(results.map((result) => [result.module, result.total])));
      setQueue(results.flatMap((result) => result.items).slice(0, 8));
      setError('');
    } catch {
      setError('Some workspace data could not be loaded. Open a module to retry.');
    } finally {
      setLoading(false);
    }
  }, [allowed, user]);

  useEffect(() => { void load(); }, [load]);

  return <div>
    <PageHeader title="Workspace overview" subtitle="A focused view of the work waiting for your team." />
    {error && <div className="mb-5"><Alert>{error}</Alert></div>}
    {loading ? <Spinner label="Loading your workspace" /> : allowed.length === 0 ? <EmptyState title="No workspace modules available" hint="Your borrower application is available from the application portal." /> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {allowed.map((module) => { const meta = MODULE_META[module]; return <Link key={module} href={meta.href} className="group"><Card className="h-full p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.09)]"><div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${meta.accent}`}><Icon name={meta.icon} size={20} /></span><span className="text-xs font-semibold text-slate-400 transition group-hover:translate-x-0.5">Open <span aria-hidden="true">→</span></span></div><p className="mt-5 text-sm font-semibold text-slate-900">{meta.label}</p><p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{meta.description}</p><p className="mt-4 text-2xl font-bold tracking-[-0.04em] text-slate-950">{counts[module] ?? 0}</p><p className="mt-0.5 text-xs font-medium text-slate-400">items in queue</p></Card></Link>; })}
      </div>
      <Card className="mt-6 overflow-hidden p-0"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6"><div><h2 className="text-base font-semibold text-slate-950">Recent queue activity</h2><p className="mt-1 text-sm text-slate-500">The latest items across the modules you can access.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{queue.length} shown</span></div>{queue.length === 0 ? <div className="p-8"><EmptyState title="Your queues are clear" hint="New work will appear here as borrowers move through the process." /></div> : <div className="divide-y divide-slate-100">{queue.map((item, index) => { const meta = MODULE_META[item.module]; return <Link key={`${item.module}-${item.name}-${index}`} href={meta.href} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"><span className={`hidden h-9 w-9 place-items-center rounded-xl sm:grid ${meta.accent}`}><Icon name={meta.icon} size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{item.name}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{meta.label} · {item.detail}</span></span>{item.amount !== undefined && <span className="hidden text-sm font-semibold text-slate-700 sm:block">{formatCurrency(item.amount)}</span>}<span className="hidden min-w-28 text-right text-xs text-slate-400 md:block">{item.createdAt ? formatDate(item.createdAt) : ''}</span>{item.module === 'sales' ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{item.status.replaceAll('_', ' ')}</span> : <StatusBadge status={item.status} />}</Link>; })}</div>}</Card>
    </>}
  </div>;
}
