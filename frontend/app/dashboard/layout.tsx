'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { ROLE_MODULES } from '@/lib/constants';

const MODULES = [
  { key: 'sales', label: 'Sales', hint: 'Leads' },
  { key: 'sanction', label: 'Sanction', hint: 'Approvals' },
  { key: 'disbursement', label: 'Disbursement', hint: 'Payouts' },
  { key: 'collection', label: 'Collection', hint: 'Repayments' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  if (loading) return <Spinner />;
  if (!user) return null;

  // The nav only renders what this role may open — the API enforces the same rule again.
  const allowed = MODULES.filter((module) => ROLE_MODULES[user.role].includes(module.key));

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Operations Dashboard</p>
              <p className="text-xs capitalize text-slate-500">
                {user.name} · {user.role}
              </p>
            </div>
            <Button variant="secondary" onClick={() => void logout()} className="px-3 py-1.5 text-xs">
              Sign out
            </Button>
          </div>
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {allowed.map((module) => {
              const href = `/dashboard/${module.key}`;
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={module.key}
                  href={href}
                  className={[
                    'whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition',
                    active
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800',
                  ].join(' ')}
                >
                  {module.label}
                  <span className="ml-1.5 hidden text-xs text-slate-400 sm:inline">{module.hint}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
