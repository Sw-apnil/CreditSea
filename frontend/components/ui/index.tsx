'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { LOAN_STATUS, type LoanStatus } from '@/lib/constants';

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

export const BrandMark = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex items-center gap-3">
    <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-950/20">
      <span className="absolute h-4 w-4 -translate-x-1 -translate-y-1 rounded-[4px] border-2 border-white/90" />
      <span className="absolute h-4 w-4 translate-x-1 translate-y-1 rounded-[4px] border-2 border-white/45" />
    </span>
    {!compact && <span className="text-[15px] font-semibold leading-[1.1] tracking-[-0.02em] text-white">CreditSea<span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-blue-200/80">Loan operations</span></span>}
  </div>
);

type IconName = 'grid' | 'users' | 'file' | 'transfer' | 'wallet' | 'bell' | 'search' | 'calendar' | 'chevron' | 'logout' | 'settings' | 'chart';

export const Icon = ({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) => {
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
    transfer: <><path d="M7 7h13l-3-3M17 17H4l3 3" /><path d="M20 7l-3 3M4 17l3-3" /></>,
    wallet: <><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6" /><path d="M17 14h.01" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.41 1.41-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.41-1.41.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7.75v-2h.09A1.7 1.7 0 0 0 9.4 10a1.7 1.7 0 0 0-.34-1.88L9 8.06l1.41-1.41.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 13.38 5.5V5h2v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.41 1.41-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03H21v2h-.09A1.7 1.7 0 0 0 19.4 15Z" /></>,
    chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 3-4 3 2 5-7" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
};

// ---------- Button ----------

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
}

export const Button = ({ variant = 'primary', loading, children, className, disabled, ...rest }: ButtonProps) => {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-200',
    secondary: 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
};

// ---------- Form fields ----------

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Field = ({ label, error, hint, id, className, ...rest }: FieldProps) => {
  const inputId = id ?? rest.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cx(
          'w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400',
          'focus:border-brand-500 focus:ring-4 focus:ring-brand-100/70',
          error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300',
          className,
        )}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: readonly { value: string; label: string }[];
}

export const SelectField = ({ label, error, options, id, ...rest }: SelectFieldProps) => {
  const selectId = id ?? rest.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        {...rest}
        id={selectId}
        className={cx(
          'w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition',
          'focus:border-brand-500 focus:ring-4 focus:ring-brand-100/70',
          error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
};

// ---------- Layout helpers ----------

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx('rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.045)] ring-1 ring-slate-200/70', className)}>{children}</div>
);

export const PageHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 className="text-[28px] font-bold tracking-[-0.035em] text-slate-950 sm:text-[32px]">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Alert = ({
  tone = 'error',
  title,
  children,
}: {
  tone?: 'error' | 'success' | 'info' | 'warning';
  title?: string;
  children: ReactNode;
}) => {
  const tones = {
    error: 'bg-red-50 text-red-800 ring-red-200',
    success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    info: 'bg-brand-50 text-brand-700 ring-brand-200',
    warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  };
  return (
    <div className={cx('rounded-lg px-4 py-3 text-sm ring-1', tones[tone])} role="alert">
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
};

export const Toast = ({ message, onClose, tone = 'success' }: { message: string; onClose: () => void; tone?: 'success' | 'error' | 'info' }) => {
  const tones = { success: 'border-emerald-200 bg-emerald-50 text-emerald-800', error: 'border-red-200 bg-red-50 text-red-800', info: 'border-blue-200 bg-blue-50 text-blue-800' };
  return <div className={`fixed bottom-5 right-5 z-40 flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-[0_16px_40px_rgba(15,23,42,0.14)] ${tones[tone]}`} role="status"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-current" /><span className="flex-1">{message}</span><button onClick={onClose} aria-label="Dismiss notification" className="-mr-1 rounded-lg px-1 text-current/60 hover:bg-black/5 hover:text-current">×</button></div>;
};

export const StatusBadge = ({ status }: { status: LoanStatus | string }) => {
  const tones: Record<string, string> = {
    [LOAN_STATUS.APPLIED]: 'bg-amber-100 text-amber-800',
    [LOAN_STATUS.SANCTIONED]: 'bg-brand-100 text-brand-700',
    [LOAN_STATUS.REJECTED]: 'bg-red-100 text-red-700',
    [LOAN_STATUS.DISBURSED]: 'bg-violet-100 text-violet-700',
    [LOAN_STATUS.CLOSED]: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span
      className={cx(
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]',
        tones[status] ?? 'bg-slate-100 text-slate-600',
      )}
    >
      {status}
    </span>
  );
};

export const EmptyState = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
    <p className="text-sm font-medium text-slate-700">{title}</p>
    {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
  </div>
);

export const Spinner = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
    {label}
  </div>
);

export const QueueSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.045)] ring-1 ring-slate-200/70">
    <div className="space-y-4">{Array.from({ length: rows }).map((_, index) => <div key={index} className="flex items-center gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"><span className="h-9 w-9 animate-pulse rounded-xl bg-slate-200" /><span className="flex-1 space-y-2"><span className="block h-3 w-1/3 animate-pulse rounded bg-slate-200" /><span className="block h-2.5 w-1/2 animate-pulse rounded bg-slate-100" /></span><span className="hidden h-3 w-20 animate-pulse rounded bg-slate-100 sm:block" /><span className="h-8 w-24 animate-pulse rounded-xl bg-slate-100" /></div>)}</div>
  </div>
);

export const Modal = ({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-4 backdrop-blur-[2px] sm:items-center sm:justify-end sm:p-6 lg:p-8">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_20px_80px_rgba(15,23,42,0.2)] ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};
