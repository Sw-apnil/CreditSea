'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark, Button, Icon, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { ROLE_MODULES } from '@/lib/constants';

const MODULES = [
  { key: 'sales', label: 'Sales', hint: 'Leads', icon: 'users' as const },
  { key: 'sanction', label: 'Sanction', hint: 'Approvals', icon: 'file' as const },
  { key: 'disbursement', label: 'Disbursement', hint: 'Payouts', icon: 'transfer' as const },
  { key: 'collection', label: 'Collection', hint: 'Repayments', icon: 'wallet' as const },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  if (loading) return <Spinner />;
  if (!user) return null;

  const allowed = MODULES.filter((module) => ROLE_MODULES[user.role].includes(module.key));
  const initials = user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f8fc] lg:flex">
      <aside className="hidden w-[252px] shrink-0 flex-col bg-[#101d33] text-white lg:flex">
        <div className="flex h-[84px] items-center border-b border-white/10 px-7"><BrandMark /></div>
        <div className="flex flex-1 flex-col px-4 py-7">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
          <nav className="mt-4 space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/7 hover:text-white"><Icon name="grid" size={18} /> Overview</Link>
            {allowed.map((module) => {
              const href = `/dashboard/${module.key}`;
              const active = pathname.startsWith(href);
              return <Link key={module.key} href={href} className={['relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition', active ? 'bg-[#285fc6] text-white shadow-lg shadow-blue-950/20' : 'text-slate-300 hover:bg-white/7 hover:text-white'].join(' ')}>
                {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-blue-300" />}
                <Icon name={module.icon} size={18} /><span>{module.label}</span><span className="ml-auto text-[11px] text-slate-500">{module.hint}</span>
              </Link>;
            })}
          </nav>
          <div className="mt-auto border-t border-white/10 pt-5">
            <div className="flex items-center gap-3 px-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{initials}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{user.name}</p><p className="truncate text-xs capitalize text-slate-400">{user.role} executive</p></div><button aria-label="Settings" className="ml-auto text-slate-500 transition hover:text-white"><Icon name="settings" size={17} /></button></div>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="flex min-h-[84px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden"><div className="rounded-lg bg-[#101d33] p-1.5"><BrandMark compact /></div><span className="text-sm font-semibold text-slate-800">Operations</span></div>
            <div className="hidden lg:block"><p className="text-xs font-medium text-slate-400">Workspace / <span className="text-slate-600">Operations dashboard</span></p><p className="mt-1 text-sm font-semibold text-slate-900">Good to see you, {user.name.split(' ')[0]}</p></div>
            <div className="flex items-center gap-3"><Button variant="secondary" onClick={() => void logout()} className="px-3 py-2 text-xs"><Icon name="logout" size={15} /><span className="hidden sm:inline">Sign out</span></Button></div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-5 py-2 lg:hidden">
            {allowed.map((module) => { const href = `/dashboard/${module.key}`; const active = pathname.startsWith(href); return <Link key={module.key} href={href} className={['whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold', active ? 'bg-brand-50 text-brand-700' : 'text-slate-500'].join(' ')}>{module.label}</Link>; })}
          </nav>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
