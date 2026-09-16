import fs from 'node:fs/promises';
import type { Response } from 'express';
import { Application } from '../models/application.model';
import { Loan } from '../models/loan.model';
import { runBre } from '../services/bre.service';
import { ApiError } from '../utils/ApiError';
import { ACTIVE_LOAN_STATUSES, APPLICATION_STEP, BRE_STATUS } from '../utils/constants';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/sendResponse';
import type { PersonalDetailsInput } from '../validators/application.validators';
import type { AppRequest } from '../types/request';

/** Fetches the caller's application, creating it lazily for accounts made before this step existed. */
const getOwnApplication = async (userId: string) => {
  const existing = await Application.findOne({ userId });
  if (existing) return existing;
  return Application.create({ userId, step: APPLICATION_STEP.REGISTERED });
};

export const getMyApplication = asyncHandler(async (req: AppRequest, res: Response) => {
  const application = await getOwnApplication(req.user!.id);
  const activeLoan = await Loan.findOne({ userId: req.user!.id, status: { $in: ACTIVE_LOAN_STATUSES } });

  sendSuccess(res, {
    application: application.toJSON(),
    hasActiveLoan: Boolean(activeLoan),
    activeLoanId: activeLoan?.id ?? null,
  });
});

export const submitPersonalDetails = asyncHandler(async (req: AppRequest, res: Response) => {
  const input = req.body as PersonalDetailsInput;
  const application = await getOwnApplication(req.user!.id);

  if (await Loan.exists({ userId: req.user!.id, status: { $in: ACTIVE_LOAN_STATUSES } })) {
    throw ApiError.conflict('You cannot edit your details while a loan is in progress');
  }

  const bre = runBre({
    pan: input.pan,
    dob: input.dob,
    monthlySalary: input.monthlySalary,
    employmentMode: input.employmentMode as PersonalDetailsInput['employmentMode'],
  });

  application.set({
    fullName: input.fullName,
    pan: input.pan,
    dob: input.dob,
    monthlySalary: input.monthlySalary,
    employmentMode: input.employmentMode,
    breStatus: bre.passed ? BRE_STATUS.PASSED : BRE_STATUS.REJECTED,
    breFailures: bre.failures.map((f) => f.message),
  });

  if (bre.passed) {
    // Never walk the step backwards if the borrower re-submits after uploading a slip.
    if (application.step === APPLICATION_STEP.REGISTERED || application.step === APPLICATION_STEP.DETAILS_SUBMITTED) {
      application.step = APPLICATION_STEP.BRE_PASSED;
    }
  } else {
    application.step = APPLICATION_STEP.DETAILS_SUBMITTED;
  }

  await application.save();

  if (!bre.passed) {
    // 422: the request was well-formed, the applicant simply is not eligible.
    throw ApiError.unprocessable('BRE_REJECTED', 'You are not eligible for a loan', {
      failures: bre.failures,
      age: bre.age,
    });
  }

  sendSuccess(res, { application: application.toJSON(), bre: { passed: true, age: bre.age } });
});

export const uploadSalarySlipHandler = asyncHandler(async (req: AppRequest, res: Response) => {
  if (!req.file) throw ApiError.badRequest('Attach a salary slip file under the field name "salarySlip"');

  const application = await getOwnApplication(req.user!.id);

  // Gate the step on the server: the BRE must have passed before a slip is accepted.
  if (application.breStatus !== BRE_STATUS.PASSED) {
    await fs.unlink(req.file.path).catch(() => undefined);
    throw ApiError.conflict('Complete the eligibility check before uploading your salary slip');
  }

  const previousPath = application.salarySlip?.path;

  application.set({
    salarySlip: {
      path: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    },
  });
  if (application.step === APPLICATION_STEP.BRE_PASSED) {
    application.step = APPLICATION_STEP.SLIP_UPLOADED;
  }
  await application.save();

  // Replacing a slip should not leave the old file behind.
  if (previousPath && previousPath !== req.file.path) {
    await fs.unlink(previousPath).catch(() => undefined);
  }

  sendSuccess(res, { application: application.toJSON() }, 201);
});
