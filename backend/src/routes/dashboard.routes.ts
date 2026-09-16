import { Router } from 'express';
import {
  addPayment,
  decideSanction,
  disburseLoan,
  getCollectionQueue,
  getDisbursementQueue,
  getLoanPayments,
  getSanctionQueue,
  streamSalarySlip,
} from '../controllers/dashboard.controller';
import { getLeads } from '../controllers/sales.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { ROLES } from '../utils/constants';
import { idParamSchema, paginationSchema } from '../validators/common.validators';
import { loanListQuerySchema, sanctionDecisionSchema } from '../validators/loan.validators';
import { createPaymentSchema } from '../validators/payment.validators';

export const salesRouter = Router();
salesRouter.use(authenticate, requireRole(ROLES.SALES));
salesRouter.get('/leads', validate({ query: paginationSchema }), getLeads);

export const sanctionRouter = Router();
sanctionRouter.use(authenticate, requireRole(ROLES.SANCTION));
sanctionRouter.get('/loans', validate({ query: loanListQuerySchema }), getSanctionQueue);
sanctionRouter.get('/loans/:id/salary-slip', validate({ params: idParamSchema }), streamSalarySlip);
sanctionRouter.patch(
  '/loans/:id',
  validate({ params: idParamSchema, body: sanctionDecisionSchema }),
  decideSanction,
);

export const disbursementRouter = Router();
disbursementRouter.use(authenticate, requireRole(ROLES.DISBURSEMENT));
disbursementRouter.get('/loans', validate({ query: loanListQuerySchema }), getDisbursementQueue);
disbursementRouter.patch('/loans/:id/disburse', validate({ params: idParamSchema }), disburseLoan);

export const collectionRouter = Router();
collectionRouter.use(authenticate, requireRole(ROLES.COLLECTION));
collectionRouter.get('/loans', validate({ query: loanListQuerySchema }), getCollectionQueue);
collectionRouter.get('/loans/:id/payments', validate({ params: idParamSchema }), getLoanPayments);
collectionRouter.post(
  '/loans/:id/payments',
  validate({ params: idParamSchema, body: createPaymentSchema }),
  addPayment,
);
