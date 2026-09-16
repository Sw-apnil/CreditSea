import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { ROLES, type Role } from '../utils/constants';
import type { AppRequest } from '../types/request';

/**
 * Authorisation, kept separate from authentication so the status codes stay honest:
 * no session is a 401, wrong role is a 403. Admin passes every staff gate.
 */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const appReq = req as AppRequest;
    if (!appReq.user) {
      next(ApiError.unauthorized());
      return;
    }

    const allowed = roles.includes(appReq.user.role) || (appReq.user.role === ROLES.ADMIN && !roles.includes(ROLES.BORROWER));
    if (!allowed) {
      next(ApiError.forbidden(`This action requires one of: ${roles.join(', ')}`));
      return;
    }

    next();
  };
