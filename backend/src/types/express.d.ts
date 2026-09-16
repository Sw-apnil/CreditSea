import type { Role } from '../utils/constants';

declare global {
  namespace Express {
    interface Request {
      /** Set by the authenticate middleware once the JWT is verified. */
      user?: { id: string; role: Role };
      /** Set by validate(): Express 5 exposes req.query as a read-only getter. */
      validatedQuery?: Record<string, unknown>;
    }
  }
}

export {};
