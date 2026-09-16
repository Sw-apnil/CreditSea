import { BrandMark } from '@/components/ui';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f7f8fc] lg:grid lg:grid-cols-[42%_58%]">
    <aside className="relative hidden overflow-hidden bg-[#101d33] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
      <div><BrandMark /><div className="mt-28 max-w-md"><p className="text-sm font-semibold text-blue-300">A clearer way to manage lending</p><h1 className="mt-5 text-5xl font-bold leading-[1.08] tracking-[-0.05em]">Make every loan journey feel effortless.</h1><p className="mt-6 max-w-sm text-[15px] leading-7 text-slate-300">From a borrower’s first application to the final repayment, keep every decision, document and payment in one trusted workspace.</p></div></div>
      <div className="relative z-10 flex items-center gap-8 text-xs text-slate-400"><span>Secure by design</span><span>•</span><span>Role-based access</span><span>•</span><span>Built for teams</span></div>
      <div className="pointer-events-none absolute -bottom-32 -right-28 h-96 w-96 rounded-full border-[70px] border-blue-500/10" /><div className="pointer-events-none absolute right-10 top-1/3 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
    </aside>
    <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10"><div className="w-full max-w-[430px]"><div className="mb-8 lg:hidden"><BrandMark compact /></div><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Loan operations platform</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">Welcome back</h2><p className="mt-2 text-sm text-slate-500">Sign in to continue to your workspace.</p></div>{children}</div></main>
  </div>;
}
