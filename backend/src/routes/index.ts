import { Router } from 'express';
import { applicationRouter } from './application.routes';
import { authRouter } from './auth.routes';
import { collectionRouter, disbursementRouter, salesRouter, sanctionRouter } from './dashboard.routes';
import { loanRouter } from './loan.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/applications', applicationRouter);
apiRouter.use('/loans', loanRouter);
apiRouter.use('/sales', salesRouter);
apiRouter.use('/sanction', sanctionRouter);
apiRouter.use('/disbursement', disbursementRouter);
apiRouter.use('/collection', collectionRouter);
