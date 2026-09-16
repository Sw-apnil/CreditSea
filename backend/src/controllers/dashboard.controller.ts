import fs from 'node:fs';
import type { Response } from 'express';
import { Application } from '../models/application.model';
import { Loan } from '../models/loan.model';
import { Payment } from '../models/payment.model';
import { canTransition } from '../services/loan-status.service';
import { calculateDueDate } from '../services/loan-math.service';
import { recordPayment } from '../services/payment.service';
import { ApiError } from '../utils/ApiError';
import { LOAN_STATUS, type LoanStatus } from '../utils/constants';
import { round2 } from '../utils/money';
import { asyncHandler } from '../utils/asyncHandler';
import { getQuery } from '../middleware/validate';
import { sendSuccess } from '../utils/sendResponse';
import type { LoanListQuery } from '../validators/loan.validators';
import type { CreatePaymentInput } from '../validators/payment.validators';
import type { AppRequest } from '../types/request';

/** Shared list builder for the sanction, disbursement and collection queues. */
const listLoans = async (req: AppRequest, allowed: LoanStatus[]) => {
  const { page, limit, status, search } = getQuery<LoanListQuery>(req);
  const filter: Record<string, unknown> = {
    status: status && allowed.includes(status as LoanStatus) ? status : { $in: allowed },
  };

  if (search) {
    const applications = await Application.find({
      $or: [{ fullName: { $regex: search, $options: 'i' } }, { pan: { $regex: search, $options: 'i' } }],
    }).select('_id');
    filter.applicationId = { $in: applications.map((a) => a._id) };
  }

  const [loans, total] = await Promise.all([
    Loan.find(filter)
      .populate('userId', 'name email')
      .populate('applicationId', 'fullName pan dob monthlySalary employmentMode breStatus salarySlip')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Loan.countDocuments(filter),
  ]);

  return {
    loans: loans.map((loan) => {
      const json = loan.toJSON() as unknown as Record<string, unknown>;
      json.dueDate = loan.disbursedAt ? calculateDueDate(loan.disbursedAt, loan.tenureDays) : null;
      return json;
    }),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

/**
 * Performs a lifecycle move. The transition table decides what is legal, and the status is
 * re-checked inside the update filter so two executives cannot both act on the same loan.
 */
const transitionLoan = async (req: AppRequest, to: LoanStatus, extra: Record<string, unknown>) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) throw ApiError.notFound('Loan not found');

  if (!canTransition(loan.status, to, req.user!.role)) {
    throw ApiError.conflict(`A loan with status ${loan.status} cannot be moved to ${to}`, {
      currentStatus: loan.status,
      attempted: to,
    });
  }

  const updated = await Loan.findOneAndUpdate(
    { _id: loan._id, status: loan.status },
    { $set: { status: to, ...extra } },
    { returnDocument: 'after' },
  );
  if (!updated) throw ApiError.conflict('This loan was updated by someone else, refresh and try again');

  return updated;
};

// ---------- Sanction ----------

export const getSanctionQueue = asyncHandler(async (req: AppRequest, res: Response) => {
  sendSuccess(res, await listLoans(req, [LOAN_STATUS.APPLIED, LOAN_STATUS.SANCTIONED, LOAN_STATUS.REJECTED]));
});

export const decideSanction = asyncHandler(async (req: AppRequest, res: Response) => {
  const body = req.body as { action: 'approve' | 'reject'; reason?: string };
  const now = new Date();

  const loan =
    body.action === 'approve'
      ? await transitionLoan(req, LOAN_STATUS.SANCTIONED, { sanctionedBy: req.user!.id, sanctionedAt: now })
      : await transitionLoan(req, LOAN_STATUS.REJECTED, {
          rejectedBy: req.user!.id,
          rejectedAt: now,
          rejectionReason: body.reason,
        });

  sendSuccess(res, { loan: loan.toJSON() });
});

/** Salary slips are streamed through this authenticated route; the uploads folder is not public. */
export const streamSalarySlip = asyncHandler(async (req: AppRequest, res: Response) => {
  const loan = await Loan.findById(req.params.id).populate('applicationId');
  if (!loan) throw ApiError.notFound('Loan not found');

  const application = loan.applicationId as unknown as { salarySlip?: { path: string; mimeType: string; originalName: string } };
  const slip = application?.salarySlip;
  if (!slip || !fs.existsSync(slip.path)) throw ApiError.notFound('No salary slip on file for this application');

  res.setHeader('Content-Type', slip.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${slip.originalName.replace(/"/g, '')}"`);
  fs.createReadStream(slip.path).pipe(res);
});

// ---------- Disbursement ----------

export const getDisbursementQueue = asyncHandler(async (req: AppRequest, res: Response) => {
  sendSuccess(res, await listLoans(req, [LOAN_STATUS.SANCTIONED, LOAN_STATUS.DISBURSED]));
});

export const disburseLoan = asyncHandler(async (req: AppRequest, res: Response) => {
  const loan = await transitionLoan(req, LOAN_STATUS.DISBURSED, {
    disbursedBy: req.user!.id,
    disbursedAt: new Date(),
  });
  sendSuccess(res, { loan: loan.toJSON() });
});

// ---------- Collection ----------

export const getCollectionQueue = asyncHandler(async (req: AppRequest, res: Response) => {
  sendSuccess(res, await listLoans(req, [LOAN_STATUS.DISBURSED, LOAN_STATUS.CLOSED]));
});

export const getLoanPayments = asyncHandler(async (req: AppRequest, res: Response) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) throw ApiError.notFound('Loan not found');

  const payments = await Payment.find({ loanId: loan._id })
    .populate('recordedBy', 'name email')
    .sort({ paymentDate: -1, createdAt: -1 });

  sendSuccess(res, {
    payments: payments.map((p) => p.toJSON()),
    summary: {
      totalRepayment: loan.totalRepayment,
      amountPaid: loan.amountPaid,
      outstandingAmount: round2(loan.totalRepayment - loan.amountPaid),
      status: loan.status,
    },
  });
});

export const addPayment = asyncHandler(async (req: AppRequest, res: Response) => {
  const input = req.body as CreatePaymentInput;
  const { loan, payment } = await recordPayment({
    loanId: String(req.params.id),
    utrNumber: input.utrNumber,
    amount: input.amount,
    paymentDate: input.paymentDate,
    recordedBy: req.user!.id,
  });

  sendSuccess(
    res,
    {
      payment: payment.toJSON(),
      loan: loan.toJSON(),
      closed: loan.status === LOAN_STATUS.CLOSED,
    },
    201,
  );
});
