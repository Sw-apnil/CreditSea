import { z } from 'zod';
import { LOAN_RULES, LOAN_STATUS } from '../utils/constants';
import { paginationSchema } from './common.validators';

export const createLoanSchema = z.object({
  principal: z.coerce
    .number()
    .int('Loan amount must be a whole rupee value')
    .min(LOAN_RULES.MIN_PRINCIPAL, `Loan amount must be at least Rs. ${LOAN_RULES.MIN_PRINCIPAL}`)
    .max(LOAN_RULES.MAX_PRINCIPAL, `Loan amount must be at most Rs. ${LOAN_RULES.MAX_PRINCIPAL}`),
  tenureDays: z.coerce
    .number()
    .int('Tenure must be a whole number of days')
    .min(LOAN_RULES.MIN_TENURE_DAYS, `Tenure must be at least ${LOAN_RULES.MIN_TENURE_DAYS} days`)
    .max(LOAN_RULES.MAX_TENURE_DAYS, `Tenure must be at most ${LOAN_RULES.MAX_TENURE_DAYS} days`),
  // interestRate is never accepted from the client — the server uses its own constant.
});
export type CreateLoanInput = z.infer<typeof createLoanSchema>;

export const loanListQuerySchema = paginationSchema.extend({
  status: z.enum(LOAN_STATUS).optional(),
});
export type LoanListQuery = z.infer<typeof loanListQuerySchema>;

export const sanctionDecisionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({
    action: z.literal('reject'),
    reason: z.string().trim().min(5, 'Give a rejection reason of at least 5 characters').max(500),
  }),
]);
export type SanctionDecisionInput = z.infer<typeof sanctionDecisionSchema>;
