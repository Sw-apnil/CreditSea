'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { LOAN_STATUS, type LoanStatus } from '@/lib/constants';

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

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
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition',
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
          'w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
          error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white',
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
          'w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
          error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white',
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
  <div className={cx('rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70', className)}>{children}</div>
);

export const PageHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
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
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};
