import mongoose, { type ClientSession, type Types } from 'mongoose';
import { Loan } from '../models/loan.model';
import { Payment } from '../models/payment.model';
import { ApiError } from '../utils/ApiError';
import { LOAN_STATUS } from '../utils/constants';
import { paiseEqual, round2 } from '../utils/money';

export interface RecordPaymentInput {
  loanId: string;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  recordedBy: string;
}

/** Float addition can land a hair above the total; a half-paisa tolerance keeps the last payment payable. */
const TOLERANCE = 0.005;

/** Midnight UTC on the day of the given instant. */
const startOfUtcDay = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const isTransactionUnsupported = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set') ||
    message.includes('Transactions are not supported')
  );
};

/**
 * Applies the payment to the loan balance atomically.
 * The guard inside the filter is what actually prevents an overpayment when two
 * collection executives record a payment at the same instant — a plain read-then-write cannot.
 */
const applyPayment = async (input: RecordPaymentInput, session?: ClientSession) => {
  const updated = await Loan.findOneAndUpdate(
    {
      _id: input.loanId,
      status: LOAN_STATUS.DISBURSED,
      $expr: { $lte: [{ $add: ['$amountPaid', input.amount] }, { $add: ['$totalRepayment', TOLERANCE] }] },
    },
    { $inc: { amountPaid: input.amount } },
    { returnDocument: 'after', session },
  );

  if (!updated) {
    throw ApiError.conflict('This payment would exceed the outstanding balance, or the loan is no longer active');
  }

  // Guard against float drift creeping into the stored balance over many payments.
  updated.amountPaid = round2(updated.amountPaid);

  const payment = await Payment.create(
    [
      {
        loanId: new mongoose.Types.ObjectId(input.loanId) as Types.ObjectId,
        utrNumber: input.utrNumber,
        amount: input.amount,
        paymentDate: input.paymentDate,
        recordedBy: new mongoose.Types.ObjectId(input.recordedBy) as Types.ObjectId,
      },
    ],
    { session, ordered: true },
  );

  // Auto-close: the system decides this, there is no manual "close loan" action anywhere.
  if (paiseEqual(updated.amountPaid, updated.totalRepayment)) {
    updated.status = LOAN_STATUS.CLOSED;
    updated.closedAt = new Date();
  }
  await updated.save({ session });

  return { loan: updated, payment: payment[0]! };
};

export const recordPayment = async (input: RecordPaymentInput) => {
  const loan = await Loan.findById(input.loanId);
  if (!loan) throw ApiError.notFound('Loan not found');

  if (loan.status !== LOAN_STATUS.DISBURSED) {
    throw ApiError.conflict(
      loan.status === LOAN_STATUS.CLOSED
        ? 'This loan is already fully repaid'
        : `Payments can only be recorded against a disbursed loan (this one is ${loan.status})`,
    );
  }
  // Compare on day granularity: paymentDate comes from a date input and parses to UTC
  // midnight, while disbursedAt is an instant. Comparing them directly would reject a
  // payment legitimately recorded on the same day the loan was disbursed.
  if (loan.disbursedAt && input.paymentDate.getTime() < startOfUtcDay(loan.disbursedAt)) {
    throw ApiError.badRequest('Payment date cannot be earlier than the disbursement date');
  }

  const outstanding = round2(loan.totalRepayment - loan.amountPaid);
  if (input.amount > outstanding + TOLERANCE) {
    // Rejected rather than capped: a capped figure would no longer match the amount the UTR represents.
    throw ApiError.unprocessable(
      'OVERPAYMENT',
      `Payment exceeds the outstanding balance of Rs. ${outstanding.toLocaleString('en-IN')}`,
      { outstanding, attempted: input.amount },
    );
  }

  const session = await mongoose.startSession();
  try {
    let result: Awaited<ReturnType<typeof applyPayment>> | undefined;
    await session.withTransaction(async () => {
      result = await applyPayment(input, session);
    });
    return result!;
  } catch (error) {
    if (!isTransactionUnsupported(error)) throw error;
    // Standalone MongoDB has no transactions; the guarded $inc still makes the balance safe.
    return applyPayment(input);
  } finally {
    await session.endSession();
  }
};
