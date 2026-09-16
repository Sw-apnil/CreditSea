import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ApiError } from '../utils/ApiError';

interface Schemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/**
 * Parses request input up front so controllers receive typed, coerced values.
 * Query results land on req.validatedQuery because Express 5 makes req.query read-only.
 */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) Object.assign(req.params, schemas.params.parse(req.params));
      if (schemas.query) req.validatedQuery = schemas.query.parse(req.query) as Record<string, unknown>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          ApiError.badRequest(
            'Some fields are invalid',
            error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
          ),
        );
        return;
      }
      next(error);
    }
  };

/** Typed accessor for the parsed query string. */
export const getQuery = <T>(req: Request): T => (req.validatedQuery ?? {}) as T;
