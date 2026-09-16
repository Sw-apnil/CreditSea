import type { Request } from 'express';
import type { Role } from '../utils/constants';

/** Request shape used after authentication/validation middleware has enriched it. */
export type AppRequest = Request & {
  user?: { id: string; role: Role };
  validatedQuery?: Record<string, unknown>;
};
