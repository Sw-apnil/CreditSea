import { Router } from 'express';
import {
  getMyApplication,
  submitPersonalDetails,
  uploadSalarySlipHandler,
} from '../controllers/application.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { uploadSalarySlip } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { ROLES } from '../utils/constants';
import { personalDetailsSchema } from '../validators/application.validators';

export const applicationRouter = Router();

// The borrower portal is for borrowers only — staff have no application of their own.
applicationRouter.use(authenticate, requireRole(ROLES.BORROWER));

applicationRouter.get('/me', getMyApplication);
applicationRouter.put('/me/personal-details', validate({ body: personalDetailsSchema }), submitPersonalDetails);
applicationRouter.post('/me/salary-slip', uploadSalarySlip, uploadSalarySlipHandler);
