import { Router } from 'express';
import { applyForLoan, getLoanById, getMyLoans, quote } from '../controllers/loan.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { ROLES } from '../utils/constants';
import { idParamSchema } from '../validators/common.validators';
import { createLoanSchema } from '../validators/loan.validators';

export const loanRouter = Router();

loanRouter.use(authenticate);

loanRouter.post('/quote', requireRole(ROLES.BORROWER), validate({ body: createLoanSchema }), quote);
loanRouter.post('/', requireRole(ROLES.BORROWER), validate({ body: createLoanSchema }), applyForLoan);
loanRouter.get('/me', requireRole(ROLES.BORROWER), getMyLoans);
// Any signed-in user may request a loan by id; the controller enforces ownership for borrowers.
loanRouter.get('/:id', validate({ params: idParamSchema }), getLoanById);
