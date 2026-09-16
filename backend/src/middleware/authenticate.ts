import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { AUTH_COOKIE_NAME, ROLE_VALUES, type Role } from '../utils/constants';
import type { AppRequest } from '../types/request';

export interface JwtPayload {
  sub: string;
  role: Role;
}

export const signToken = (userId: string, role: Role): string =>
  jwt.sign({ sub: userId, role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

/** Reads the httpOnly cookie first; the Bearer header is a convenience for curl and Postman. */
const extractToken = (req: Request): string | undefined => {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);

  return undefined;
};

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  if (!token) {
    next(ApiError.unauthorized('You must be logged in to do that'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (!payload.sub || !ROLE_VALUES.includes(payload.role)) {
      next(ApiError.unauthorized('Malformed session token'));
      return;
    }
    (req as AppRequest).user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized('Your session has expired, please log in again'));
  }
};
