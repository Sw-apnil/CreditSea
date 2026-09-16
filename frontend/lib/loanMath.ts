import { LOAN_RULES } from './constants';

export interface LoanQuote {
  principal: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
}

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Same formula as the server, used only to keep the slider panel responsive.
 * The figures that get stored are always the ones the server recomputes.
 */
export const calculateLoan = (principal: number, tenureDays: number): LoanQuote => {
  const simpleInterest = round2(
    (principal * LOAN_RULES.INTEREST_RATE * tenureDays) / (LOAN_RULES.DAYS_IN_YEAR * 100),
  );
  return {
    principal: round2(principal),
    tenureDays,
    interestRate: LOAN_RULES.INTEREST_RATE,
    simpleInterest,
    totalRepayment: round2(principal + simpleInterest),
  };
};

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

export const formatDate = (value: string | Date | null | undefined): string =>
  value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value)) : '—';
