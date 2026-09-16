export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Loan Management System</h1>
          <p className="mt-1 text-sm text-slate-500">Borrower portal and operations dashboard</p>
        </div>
        {children}
      </div>
    </div>
  );
}
