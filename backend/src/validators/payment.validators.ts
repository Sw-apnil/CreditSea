import { z } from 'zod';

/** End of the current UTC day. A date-only value like "2026-09-16" parses to UTC
 *  midnight, which is ahead of "now" for anyone east of UTC — comparing against the
 *  instant would reject a payment dated today for several hours each day. */
const endOfToday = (): number => {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999);
};

/** Rupee amounts may carry at most 2 decimals. Compared with a tolerance because
 *  0.07 * 100 is 7.000000000000001 in binary floating point, not 7. */
const hasAtMostTwoDecimals = (value: number): boolean =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

export const createPaymentSchema = z.object({
  utrNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(6, 'UTR number must be at least 6 characters')
    .max(32, 'UTR number must be at most 32 characters')
    .regex(/^[A-Z0-9-]+$/, 'UTR number may contain only letters, numbers and hyphens'),
  amount: z.coerce
    .number()
    .positive('Payment amount must be greater than zero')
    .refine(hasAtMostTwoDecimals, 'Amount may have at most 2 decimal places'),
  paymentDate: z.coerce.date().refine((d) => d.getTime() <= endOfToday(), 'Payment date cannot be in the future'),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
