/** Mirrors the backend constants so the UI can label and bound things without a round trip. */
export const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  SANCTION: 'sanction',
  DISBURSEMENT: 'disbursement',
  COLLECTION: 'collection',
  BORROWER: 'borrower',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const LOAN_STATUS = {
  APPLIED: 'APPLIED',
  SANCTIONED: 'SANCTIONED',
  REJECTED: 'REJECTED',
  DISBURSED: 'DISBURSED',
  CLOSED: 'CLOSED',
} as const;

export type LoanStatus = (typeof LOAN_STATUS)[keyof typeof LOAN_STATUS];

export const APPLICATION_STEP = {
  REGISTERED: 'registered',
  DETAILS_SUBMITTED: 'details_submitted',
  BRE_PASSED: 'bre_passed',
  SLIP_UPLOADED: 'slip_uploaded',
  APPLIED: 'applied',
} as const;

export type ApplicationStep = (typeof APPLICATION_STEP)[keyof typeof APPLICATION_STEP];

export const EMPLOYMENT_MODES = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'unemployed', label: 'Unemployed' },
] as const;

export const BRE_RULES = {
  MIN_AGE: 23,
  MAX_AGE: 50,
  MIN_MONTHLY_SALARY: 25_000,
  PAN_REGEX: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
} as const;

export const LOAN_RULES = {
  MIN_PRINCIPAL: 50_000,
  MAX_PRINCIPAL: 500_000,
  MIN_TENURE_DAYS: 30,
  MAX_TENURE_DAYS: 365,
  INTEREST_RATE: 12,
  DAYS_IN_YEAR: 365,
} as const;

export const UPLOAD_RULES = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ACCEPT: '.pdf,.jpg,.jpeg,.png',
  ALLOWED_MIME_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

/** Which dashboard modules each role may open. Admin sees all four. */
export const ROLE_MODULES: Record<Role, string[]> = {
  admin: ['sales', 'sanction', 'disbursement', 'collection'],
  sales: ['sales'],
  sanction: ['sanction'],
  disbursement: ['disbursement'],
  collection: ['collection'],
  borrower: [],
};
