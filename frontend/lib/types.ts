import type { ApplicationStep, LoanStatus, Role } from './constants';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface SalarySlip {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface Application {
  id: string;
  userId: string;
  fullName?: string;
  pan?: string;
  dob?: string;
  monthlySalary?: number;
  employmentMode?: string;
  breStatus: 'pending' | 'passed' | 'rejected';
  breFailures: string[];
  salarySlip?: SalarySlip;
  step: ApplicationStep;
}

export interface Loan {
  id: string;
  userId: User | string;
  applicationId: Application | string;
  principal: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  amountPaid: number;
  outstandingAmount: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  dueDate?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  loanId: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  recordedBy: User | string;
  createdAt: string;
}

export interface Lead {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  step: ApplicationStep;
  breStatus: string;
  breFailures: string[];
  fullName?: string;
  pan?: string;
  monthlySalary?: number;
  employmentMode?: string;
  hasSalarySlip: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
