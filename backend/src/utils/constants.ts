export const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  SANCTION: 'sanction',
  DISBURSEMENT: 'disbursement',
  COLLECTION: 'collection',
  BORROWER: 'borrower',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export const ROLE_VALUES = Object.values(ROLES) as Role[];
/** Every role except borrower can reach some part of the operations dashboard. */
export const STAFF_ROLES = ROLE_VALUES.filter((r) => r !== ROLES.BORROWER);

export const LOAN_STATUS = {
  APPLIED: 'APPLIED',
  SANCTIONED: 'SANCTIONED',
  REJECTED: 'REJECTED',
  DISBURSED: 'DISBURSED',
  CLOSED: 'CLOSED',
} as const;

export type LoanStatus = (typeof LOAN_STATUS)[keyof typeof LOAN_STATUS];
export const LOAN_STATUS_VALUES = Object.values(LOAN_STATUS) as LoanStatus[];

/** A borrower may hold only one loan in these states at a time. */
export const ACTIVE_LOAN_STATUSES: LoanStatus[] = [
  LOAN_STATUS.APPLIED,
  LOAN_STATUS.SANCTIONED,
  LOAN_STATUS.DISBURSED,
];

export const APPLICATION_STEP = {
  REGISTERED: 'registered',
  DETAILS_SUBMITTED: 'details_submitted',
  BRE_PASSED: 'bre_passed',
  SLIP_UPLOADED: 'slip_uploaded',
  APPLIED: 'applied',
} as const;

export type ApplicationStep = (typeof APPLICATION_STEP)[keyof typeof APPLICATION_STEP];
export const APPLICATION_STEP_VALUES = Object.values(APPLICATION_STEP) as ApplicationStep[];

export const BRE_STATUS = {
  PENDING: 'pending',
  PASSED: 'passed',
  REJECTED: 'rejected',
} as const;

export type BreStatus = (typeof BRE_STATUS)[keyof typeof BRE_STATUS];
export const BRE_STATUS_VALUES = Object.values(BRE_STATUS) as BreStatus[];

export const EMPLOYMENT_MODE = {
  SALARIED: 'salaried',
  SELF_EMPLOYED: 'self_employed',
  UNEMPLOYED: 'unemployed',
} as const;

export type EmploymentMode = (typeof EMPLOYMENT_MODE)[keyof typeof EMPLOYMENT_MODE];
export const EMPLOYMENT_MODE_VALUES = Object.values(EMPLOYMENT_MODE) as EmploymentMode[];

/** Business rule thresholds — single source of truth for the BRE. */
export const BRE_RULES = {
  MIN_AGE: 23,
  MAX_AGE: 50,
  MIN_MONTHLY_SALARY: 25_000,
  PAN_REGEX: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
} as const;

/** Loan configuration bounds — enforced on the server, mirrored by the sliders. */
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
  ALLOWED_MIME_TYPES: ['application/pdf', 'image/jpeg', 'image/png'] as const,
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png'] as const,
};

export const AUTH_COOKIE_NAME = 'token';
