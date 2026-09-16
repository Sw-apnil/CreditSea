'use client';

import { Alert, Card, StatusBadge } from '@/components/ui';
import { LOAN_STATUS, type LoanStatus } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/loanMath';
import type { Loan } from '@/lib/types';

const TIMELINE: { status: LoanStatus; label: string; description: string }[] = [
  { status: LOAN_STATUS.APPLIED, label: 'Applied', description: 'Waiting for the sanction team to review' },
  { status: LOAN_STATUS.SANCTIONED, label: 'Sanctioned', description: 'Approved, waiting for funds to be released' },
  { status: LOAN_STATUS.DISBURSED, label: 'Disbursed', description: 'Funds released, repayment in progress' },
  { status: LOAN_STATUS.CLOSED, label: 'Closed', description: 'Fully repaid' },
];

const reachedIndex = (status: LoanStatus): number => {
  const index = TIMELINE.findIndex((t) => t.status === status);
  return index === -1 ? 0 : index;
};

export const LoanStatusView = ({ loans }: { loans: Loan[] }) => {
  if (loans.length === 0) return null;
  const [latest, ...history] = loans;
  if (!latest) return null;

  const rejected = latest.status === LOAN_STATUS.REJECTED;
  const current = reachedIndex(latest.status);
  const progress = latest.totalRepayment > 0 ? (latest.amountPaid / latest.totalRepayment) * 100 : 0;

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Your loan</h2>
            <p className="mt-1 text-sm text-slate-500">Applied {formatDate(latest.createdAt)}</p>
          </div>
          <StatusBadge status={latest.status} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Principal', value: formatCurrency(latest.principal) },
            { label: 'Interest', value: formatCurrency(latest.simpleInterest) },
            { label: 'Total repayment', value: formatCurrency(latest.totalRepayment) },
            { label: 'Outstanding', value: formatCurrency(latest.outstandingAmount) },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-xs uppercase tracking-wide text-slate-400">{item.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{item.value}</dd>
            </div>
          ))}
        </dl>

        {latest.status === LOAN_STATUS.DISBURSED && (
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs text-slate-500">
              <span>Repaid {formatCurrency(latest.amountPaid)}</span>
              <span>Due {formatDate(latest.dueDate)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {rejected && (
          <div className="mt-5">
            <Alert title="Your application was rejected">
              {latest.rejectionReason ?? 'No reason was recorded.'}
              <p className="mt-2 text-xs">You can start a fresh application from the first step.</p>
            </Alert>
          </div>
        )}

        {latest.status === LOAN_STATUS.CLOSED && (
          <div className="mt-5">
            <Alert tone="success" title="Loan fully repaid">
              Closed on {formatDate(latest.closedAt)}. You can apply for a new loan whenever you need one.
            </Alert>
          </div>
        )}
      </Card>

      {!rejected && (
        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Progress</h3>
          <ol className="mt-4 space-y-4">
            {TIMELINE.map((stage, index) => {
              const done = index < current;
              const active = index === current;
              return (
                <li key={stage.status} className="flex gap-3">
                  <span
                    className={[
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      done
                        ? 'bg-emerald-100 text-emerald-700'
                        : active
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-400',
                    ].join(' ')}
                  >
                    {done ? '✓' : index + 1}
                  </span>
                  <div>
                    <p className={active ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-600'}>
                      {stage.label}
                    </p>
                    <p className="text-xs text-slate-500">{stage.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Earlier applications</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {history.map((loan) => (
              <li key={loan.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-600">
                  {formatCurrency(loan.principal)} · {loan.tenureDays} days · {formatDate(loan.createdAt)}
                </span>
                <StatusBadge status={loan.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
