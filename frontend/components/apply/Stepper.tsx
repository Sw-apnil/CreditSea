'use client';

import { APPLICATION_STEP, type ApplicationStep } from '@/lib/constants';

const STEPS = [
  { key: 'details', label: 'Personal details' },
  { key: 'slip', label: 'Salary slip' },
  { key: 'configure', label: 'Loan & apply' },
  { key: 'status', label: 'Status' },
] as const;

export type StepKey = (typeof STEPS)[number]['key'];

/** Translates the server's application step into the index the stepper should show. */
export const stepIndexFor = (step: ApplicationStep, hasLoan: boolean): number => {
  if (hasLoan || step === APPLICATION_STEP.APPLIED) return 3;
  if (step === APPLICATION_STEP.SLIP_UPLOADED) return 2;
  if (step === APPLICATION_STEP.BRE_PASSED) return 1;
  return 0;
};

export const Stepper = ({
  current,
  furthest,
  onSelect,
}: {
  current: number;
  furthest: number;
  onSelect: (index: number) => void;
}) => (
  <ol className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-3 sm:flex-nowrap">
    {STEPS.map((step, index) => {
      const state = index === current ? 'current' : index < furthest ? 'done' : 'todo';
      const reachable = index <= furthest;
      return (
        <li key={step.key} className="flex flex-1 items-center gap-2">
          <button
            type="button"
            disabled={!reachable}
            onClick={() => reachable && onSelect(index)}
            className="flex items-center gap-2 text-left disabled:cursor-not-allowed"
          >
            <span
              className={[
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition',
                state === 'current'
                  ? 'bg-brand-600 text-white'
                  : state === 'done'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500',
              ].join(' ')}
            >
              {state === 'done' ? '✓' : index + 1}
            </span>
            <span
              className={[
                'hidden text-sm font-medium sm:block',
                state === 'todo' ? 'text-slate-400' : 'text-slate-700',
              ].join(' ')}
            >
              {step.label}
            </span>
          </button>
          {index < STEPS.length - 1 && <span className="hidden h-px flex-1 bg-slate-200 sm:block" />}
        </li>
      );
    })}
  </ol>
);
