'use client';

import { BrandMark, Button, Icon } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-4"><div className="rounded-xl bg-[#101d33] p-2"><BrandMark compact /></div><div><p className="text-sm font-semibold text-slate-900">Borrower portal</p><p className="text-xs text-slate-500">Complete your application securely</p></div></div>
          <div className="flex items-center gap-3">
            {user && <span className="hidden text-sm text-slate-600 sm:block">{user.email}</span>}
            <Button variant="secondary" onClick={() => void logout()} className="px-3 py-2 text-xs">
              <Icon name="logout" size={15} /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
