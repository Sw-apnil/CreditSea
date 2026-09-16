import { z } from 'zod';
import { EMPLOYMENT_MODE } from '../utils/constants';

/**
 * Shape-only validation. The eligibility rules (PAN format, salary floor, age band,
 * employment) deliberately live in the BRE, not here — a malformed PAN must come back
 * as a BRE rejection the borrower can act on, not as a generic 400.
 */
export const personalDetailsSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(80),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'PAN is required')
    .max(20, 'PAN is too long'),
  dob: z.coerce
    .date()
    .refine((d) => d.getTime() < Date.now(), 'Date of birth must be in the past')
    .refine((d) => d.getFullYear() > 1900, 'Enter a valid date of birth'),
  monthlySalary: z.coerce
    .number()
    .min(0, 'Monthly salary cannot be negative')
    .max(100_000_000, 'Enter a realistic monthly salary'),
  employmentMode: z.enum(EMPLOYMENT_MODE),
});
export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;
