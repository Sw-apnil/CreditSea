'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Card } from '@/components/ui';
import { api, ApiRequestError } from '@/lib/api';
import { LOAN_RULES } from '@/lib/constants';
import { calculateLoan, formatCurrency } from '@/lib/loanMath';
import type { Loan } from '@/lib/types';

interface Props {
  onApplied: (loan: Loan) => void;
  onBack: () => void;
}

const Slider = ({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) => (
  <div>
    <div className="mb-2 flex items-baseline justify-between">
      <label htmlFor={label} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <span className="text-base font-semibold text-brand-700">{display}</span>
    </div>
    <input
      id={label}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full"
    />
    <div className="mt-1 flex justify-between text-xs text-slate-400">
      <span>{min.toLocaleString('en-IN')}</span>
      <span>{max.toLocaleString('en-IN')}</span>
    </div>
  </div>
);

export const LoanConfigStep = ({ onApplied, onBack }: Props) => {
  const [principal, setPrincipal] = useState<number>(LOAN_RULES.MIN_PRINCIPAL);
  const [tenureDays, setTenureDays] = useState<number>(90);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Recomputed on every slider move; the server recalculates this before storing anything.
  const quote = useMemo(() => calculateLoan(principal, tenureDays), [principal, tenureDays]);

  const apply = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{ loan: Loan }>('/loans', { principal, tenureDays });
      onApplied(data.loan);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not submit your application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <h2 className="text-lg font-semibold text-slate-900">Configure your loan</h2>
        <p className="mt-1 text-sm text-slate-500">
          Interest is fixed at {LOAN_RULES.INTEREST_RATE}% per year, calculated as simple interest.
        </p>

        <div className="mt-6 space-y-7">
          <Slider
            label="Loan amount"
            value={principal}
            min={LOAN_RULES.MIN_PRINCIPAL}
            max={LOAN_RULES.MAX_PRINCIPAL}
            step={5000}
            display={formatCurrency(principal)}
            onChange={setPrincipal}
          />
          <Slider
            label="Tenure"
            value={tenureDays}
            min={LOAN_RULES.MIN_TENURE_DAYS}
            max={LOAN_RULES.MAX_TENURE_DAYS}
            step={1}
            display={`${tenureDays} days`}
            onChange={setTenureDays}
          />
        </div>

        {error && (
          <div className="mt-5">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button onClick={apply} loading={loading}>
            Apply for this loan
          </Button>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Your repayment</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Principal</dt>
            <dd className="font-medium text-slate-900">{formatCurrency(quote.principal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Interest rate</dt>
            <dd className="font-medium text-slate-900">{quote.interestRate}% p.a.</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Tenure</dt>
            <dd className="font-medium text-slate-900">{quote.tenureDays} days</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3">
            <dt className="text-slate-500">Simple interest</dt>
            <dd className="font-medium text-slate-900">{formatCurrency(quote.simpleInterest)}</dd>
          </div>
          <div className="flex justify-between rounded-lg bg-brand-50 px-3 py-2.5">
            <dt className="font-semibold text-brand-700">Total repayment</dt>
            <dd className="font-bold text-brand-700">{formatCurrency(quote.totalRepayment)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          SI = (P × R × T) ÷ (365 × 100), where T is the tenure in days.
        </p>
      </Card>
    </div>
  );
};
