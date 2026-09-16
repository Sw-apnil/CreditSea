import type { Response } from 'express';
import { User } from '../models/user.model';
import { ROLES } from '../utils/constants';
import { asyncHandler } from '../utils/asyncHandler';
import { getQuery } from '../middleware/validate';
import { sendSuccess } from '../utils/sendResponse';
import type { Pagination } from '../validators/common.validators';
import type { AppRequest } from '../types/request';

/**
 * Sales owns the pre-application stage: borrowers who registered but never applied.
 * One aggregation joins the application and any loans, then keeps only the leads with no loan.
 */
export const getLeads = asyncHandler(async (req: AppRequest, res: Response) => {
  const { page, limit, search } = getQuery<Pagination>(req);

  const match: Record<string, unknown> = { role: ROLES.BORROWER };
  if (search) {
    match.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [result] = await User.aggregate([
    { $match: match },
    { $lookup: { from: 'applications', localField: '_id', foreignField: 'userId', as: 'application' } },
    { $lookup: { from: 'loans', localField: '_id', foreignField: 'userId', as: 'loans' } },
    { $match: { loans: { $size: 0 } } },
    { $unwind: { path: '$application', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: 1,
        email: 1,
        createdAt: 1,
        step: { $ifNull: ['$application.step', 'registered'] },
        breStatus: { $ifNull: ['$application.breStatus', 'pending'] },
        breFailures: { $ifNull: ['$application.breFailures', []] },
        fullName: '$application.fullName',
        pan: '$application.pan',
        monthlySalary: '$application.monthlySalary',
        employmentMode: '$application.employmentMode',
        hasSalarySlip: { $cond: [{ $ifNull: ['$application.salarySlip', false] }, true, false] },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const items = (result?.items ?? []) as unknown[];
  const total = (result?.total?.[0]?.count ?? 0) as number;

  sendSuccess(res, { leads: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});
