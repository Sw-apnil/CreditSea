import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Forwards rejected promises to the error handler so controllers can stay async/await. */
export const asyncHandler =
  <T extends Request = Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    void fn(req as T, res, next).catch(next);
  };
