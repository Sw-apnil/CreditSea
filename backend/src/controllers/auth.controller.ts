import type { CookieOptions, Request, Response } from 'express';
import { env } from '../config/env';
import { Application } from '../models/application.model';
import { User, hashPassword } from '../models/user.model';
import { signToken } from '../middleware/authenticate';
import { ApiError } from '../utils/ApiError';
import { APPLICATION_STEP, AUTH_COOKIE_NAME, ROLES } from '../utils/constants';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/sendResponse';
import type { LoginInput, SignupInput } from '../validators/auth.validators';

/**
 * httpOnly keeps the token out of reach of JavaScript (so an XSS bug cannot steal it),
 * and lets Next.js middleware read it for route guarding — which localStorage cannot do.
 */
const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
});

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as SignupInput;

  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    // Hard-coded: a client cannot make itself staff by adding a role to the request body.
    role: ROLES.BORROWER,
  });

  // Every borrower starts with an empty application so the stepper always has state to resume.
  await Application.create({ userId: user._id, step: APPLICATION_STEP.REGISTERED });

  res.cookie(AUTH_COOKIE_NAME, signToken(user.id as string, user.role), cookieOptions());
  sendSuccess(res, { user: user.toJSON() }, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select('+passwordHash');
  // Same message either way, so the response cannot be used to enumerate accounts.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password');
  }

  res.cookie(AUTH_COOKIE_NAME, signToken(user.id as string, user.role), cookieOptions());
  sendSuccess(res, { user: user.toJSON() });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  sendSuccess(res, { message: 'Logged out' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.unauthorized('Your account no longer exists');
  sendSuccess(res, { user: user.toJSON() });
});
