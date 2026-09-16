import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { UPLOAD_RULES } from '../utils/constants';

interface MongoDuplicateKeyError extends Error {
  code: number;
  keyPattern?: Record<string, unknown>;
}

const isDuplicateKeyError = (error: unknown): error is MongoDuplicateKeyError =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
};

/** Single exit point for every failure, so the client always sees the same error envelope. */
export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong on our side';
  let details: unknown;

  if (error instanceof ApiError) {
    ({ statusCode, code, message, details } = error);
  } else if (error instanceof ZodError) {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'Some fields are invalid';
    details = error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  } else if (error instanceof MulterError) {
    statusCode = 400;
    code = error.code;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? `File is too large — the limit is ${UPLOAD_RULES.MAX_SIZE_BYTES / (1024 * 1024)} MB`
        : `Upload failed: ${error.message}`;
  } else if (isDuplicateKeyError(error)) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(error.keyPattern ?? {})[0];
    message =
      field === 'utrNumber'
        ? 'This UTR number has already been recorded'
        : `A record with that ${field ?? 'value'} already exists`;
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'Some fields are invalid';
    details = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = `Invalid value for ${error.path}`;
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      ...(!env.isProduction && statusCode >= 500 && error instanceof Error ? { stack: error.stack } : {}),
    },
  });
};
