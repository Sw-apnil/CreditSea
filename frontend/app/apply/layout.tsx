'use client';

import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Loan Management System</p>
            <p className="text-xs text-slate-500">Borrower portal</p>
          </div>
          <div className="flex items-center gap-3">
            {user && <span className="hidden text-sm text-slate-600 sm:block">{user.email}</span>}
            <Button variant="secondary" onClick={() => void logout()} className="px-3 py-1.5 text-xs">
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
