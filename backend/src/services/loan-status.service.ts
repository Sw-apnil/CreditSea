import { LOAN_STATUS, ROLES, type LoanStatus, type Role } from '../utils/constants';

export interface Transition {
  from: LoanStatus;
  to: LoanStatus;
  roles: Role[];
}

/**
 * The whole lifecycle in one table: who may move a loan from where to where.
 * CLOSED is absent on purpose — only the payment service triggers it.
 */
export const ALLOWED_TRANSITIONS: Transition[] = [
  { from: LOAN_STATUS.APPLIED, to: LOAN_STATUS.SANCTIONED, roles: [ROLES.SANCTION, ROLES.ADMIN] },
  { from: LOAN_STATUS.APPLIED, to: LOAN_STATUS.REJECTED, roles: [ROLES.SANCTION, ROLES.ADMIN] },
  { from: LOAN_STATUS.SANCTIONED, to: LOAN_STATUS.DISBURSED, roles: [ROLES.DISBURSEMENT, ROLES.ADMIN] },
];

export const findTransition = (from: LoanStatus, to: LoanStatus): Transition | undefined =>
  ALLOWED_TRANSITIONS.find((t) => t.from === from && t.to === to);

export const canTransition = (from: LoanStatus, to: LoanStatus, role: Role): boolean =>
  findTransition(from, to)?.roles.includes(role) ?? false;
