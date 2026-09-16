'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Field } from '@/components/ui';
import { ApiRequestError } from '@/lib/api';
import { homePathFor, useAuth } from '@/lib/auth-context';

const DEMO_ACCOUNTS = [
  { label: 'Borrower', email: 'borrower@lms.test', password: 'Borrower@123' },
  { label: 'Sales', email: 'sales@lms.test', password: 'Sales@123' },
  { label: 'Sanction', email: 'sanction@lms.test', password: 'Sanction@123' },
  { label: 'Disbursement', email: 'disbursement@lms.test', password: 'Disburse@123' },
  { label: 'Collection', email: 'collection@lms.test', password: 'Collect@123' },
  { label: 'Admin', email: 'admin@lms.test', password: 'Admin@123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      const user = await login(form.email, form.password);
      router.push(homePathFor(user));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setError('Could not reach the server');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
      <p className="mt-1 text-sm text-slate-500">Use your account, or pick a demo role below.</p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          error={fieldErrors.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          error={fieldErrors.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        New borrower?{' '}
        <Link href="/signup" className="font-medium text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Demo accounts</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => setForm({ email: account.email, password: account.password })}
              className="rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
