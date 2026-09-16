import type { Request, Response } from 'express';
import { Application } from '../models/application.model';
import { Loan } from '../models/loan.model';
import { calculateDueDate, calculateLoan } from '../services/loan-math.service';
import { ApiError } from '../utils/ApiError';
import { ACTIVE_LOAN_STATUSES, APPLICATION_STEP, BRE_STATUS, LOAN_RULES, ROLES } from '../utils/constants';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/sendResponse';
import type { CreateLoanInput } from '../validators/loan.validators';

const withDerived = (loan: InstanceType<typeof Loan>) => {
  const json = loan.toJSON() as unknown as Record<string, unknown>;
  json.dueDate = loan.disbursedAt ? calculateDueDate(loan.disbursedAt, loan.tenureDays) : null;
  return json;
};

/** A quote the borrower can preview without committing — same maths the apply route uses. */
export const quote = asyncHandler(async (req: Request, res: Response) => {
  const { principal, tenureDays } = req.body as CreateLoanInput;
  sendSuccess(res, { quote: calculateLoan(principal, tenureDays), rules: LOAN_RULES });
});

export const applyForLoan = asyncHandler(async (req: Request, res: Response) => {
  const { principal, tenureDays } = req.body as CreateLoanInput;
  const userId = req.user!.id;

  const application = await Application.findOne({ userId });
  if (!application) throw ApiError.badRequest('Start your application before applying for a loan');

  // Server-side step gating — the client cannot skip ahead by calling this route directly.
  if (application.breStatus !== BRE_STATUS.PASSED) {
    throw ApiError.conflict('Your eligibility check must pass before you can apply');
  }
  if (!application.salarySlip) {
    throw ApiError.conflict('Upload your salary slip before you can apply');
  }
  if (await Loan.exists({ userId, status: { $in: ACTIVE_LOAN_STATUSES } })) {
    throw ApiError.conflict('You already have a loan in progress');
  }

  // Amount, tenure and rate are all recomputed here; nothing money-related is trusted from the client.
  const math = calculateLoan(principal, tenureDays);

  try {
    const loan = await Loan.create({
      userId,
      applicationId: application._id,
      ...math,
      amountPaid: 0,
    });

    application.step = APPLICATION_STEP.APPLIED;
    await application.save();

    sendSuccess(res, { loan: withDerived(loan) }, 201);
  } catch (error) {
    // The partial unique index is the real guard against two simultaneous "Apply" clicks.
    if (typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000) {
      throw ApiError.conflict('You already have a loan in progress');
    }
    throw error;
  }
});

export const getMyLoans = asyncHandler(async (req: Request, res: Response) => {
  const loans = await Loan.find({ userId: req.user!.id }).sort({ createdAt: -1 });
  sendSuccess(res, { loans: loans.map(withDerived) });
});

export const getLoanById = asyncHandler(async (req: Request, res: Response) => {
  const loan = await Loan.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('applicationId');
  if (!loan) throw ApiError.notFound('Loan not found');

  // A borrower may only read their own loan; a stranger's loan reads as 404, not 403,
  // so the response does not confirm that the id exists.
  if (req.user!.role === ROLES.BORROWER) {
    const ownerId = (loan.userId as unknown as { _id: { toString(): string } })._id.toString();
    if (ownerId !== req.user!.id) throw ApiError.notFound('Loan not found');
  }

  sendSuccess(res, { loan: withDerived(loan) });
});
