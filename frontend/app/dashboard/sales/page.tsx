'use client';

import { useCallback, useEffect, useState } from 'react';
import { DataTable, type Column } from '@/components/dashboard/DataTable';
import { Alert, Card, EmptyState, Field, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/loanMath';
import type { Lead, PaginationMeta } from '@/lib/types';

const STEP_LABELS: Record<string, string> = {
  registered: 'Registered only',
  details_submitted: 'Details submitted',
  bre_passed: 'Eligibility passed',
  slip_uploaded: 'Salary slip uploaded',
  applied: 'Applied',
};

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const data = await api.get<{ leads: Lead[]; pagination: PaginationMeta }>(
        `/sales/leads?limit=50${term ? `&search=${encodeURIComponent(term)}` : ''}`,
      );
      setLeads(data.leads);
      setMeta(data.pagination);
      setError('');
    } catch {
      setError('Could not load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(search), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Lead',
      render: (lead) => (
        <div>
          <p className="font-medium text-slate-900">{lead.fullName ?? lead.name}</p>
          <p className="text-xs text-slate-500">{lead.email}</p>
        </div>
      ),
    },
    {
      key: 'step',
      header: 'Reached',
      render: (lead) => (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {STEP_LABELS[lead.step] ?? lead.step}
        </span>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      render: (lead) => (lead.monthlySalary ? formatCurrency(lead.monthlySalary) : '—'),
    },
    { key: 'pan', header: 'PAN', render: (lead) => lead.pan ?? '—', hideOnMobile: true },
    {
      key: 'bre',
      header: 'Eligibility',
      render: (lead) =>
        lead.breStatus === 'rejected' ? (
          <span className="text-xs font-medium text-red-600" title={lead.breFailures.join(' ')}>
            Rejected
          </span>
        ) : lead.breStatus === 'passed' ? (
          <span className="text-xs font-medium text-emerald-600">Passed</span>
        ) : (
          <span className="text-xs text-slate-400">Not checked</span>
        ),
    },
    { key: 'created', header: 'Registered', render: (lead) => formatDate(lead.createdAt), hideOnMobile: true },
  ];

  return (
    <div>
      <PageHeader
        title="Sales — leads"
        subtitle="Borrowers who registered but have not applied for a loan yet."
      />

      <Card className="mb-4">
        <Field
          label="Search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : leads.length === 0 ? (
        <EmptyState title="No open leads" hint="Every registered borrower has already applied." />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">{meta?.total ?? leads.length} leads</p>
          <DataTable columns={columns} rows={leads} rowKey={(lead) => lead._id} />
        </>
      )}
    </div>
  );
}
