import { LOAN_RULES } from '../utils/constants';
import { round2 } from '../utils/money';

export interface LoanQuote {
  principal: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
}

/**
 * Simple interest: SI = (P x R x T) / (365 x 100), T in days.
 * The rate is taken from the server constant, never from the request.
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

export const calculateDueDate = (disbursedAt: Date, tenureDays: number): Date => {
  const due = new Date(disbursedAt);
  due.setDate(due.getDate() + tenureDays);
  return due;
};
