import { Schema, model, type HydratedDocument, type Types } from 'mongoose';
import { ACTIVE_LOAN_STATUSES, LOAN_STATUS, LOAN_STATUS_VALUES, type LoanStatus } from '../utils/constants';
import { round2 } from '../utils/money';

export interface ILoan {
  userId: Types.ObjectId;
  applicationId: Types.ObjectId;
  principal: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  /** The only stored balance figure; outstanding is derived from it so the two cannot drift. */
  amountPaid: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: Types.ObjectId;
  sanctionedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  disbursedBy?: Types.ObjectId;
  disbursedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoanVirtuals {
  outstandingAmount: number;
}

export type LoanDocument = HydratedDocument<ILoan, ILoanVirtuals>;

const loanSchema = new Schema<ILoan, {}, {}, {}, LoanDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    principal: { type: Number, required: true },
    tenureDays: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    simpleInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    amountPaid: { type: Number, required: true, default: 0, min: 0 },
    status: { type: String, enum: LOAN_STATUS_VALUES, required: true, default: LOAN_STATUS.APPLIED, index: true },
    rejectionReason: { type: String, trim: true },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, ret: Record<string, unknown>) => { delete ret.__v; return ret; } },
    toObject: { virtuals: true },
  },
);

loanSchema.virtual('outstandingAmount').get(function (this: ILoan) {
  return round2(this.totalRepayment - this.amountPaid);
});

// The database itself refuses a second active loan for the same borrower,
// so two concurrent "Apply" clicks cannot both succeed.
loanSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ACTIVE_LOAN_STATUSES } }, name: 'one_active_loan_per_user' },
);

export const Loan = model<ILoan>('Loan', loanSchema);
