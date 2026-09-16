import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { ROLES, type Role } from '../utils/constants';

/**
 * Authorisation, kept separate from authentication so the status codes stay honest:
 * no session is a 401, wrong role is a 403. Admin passes every staff gate.
 */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    const allowed = roles.includes(req.user.role) || (req.user.role === ROLES.ADMIN && !roles.includes(ROLES.BORROWER));
    if (!allowed) {
      next(ApiError.forbidden(`This action requires one of: ${roles.join(', ')}`));
      return;
    }

    next();
  };
