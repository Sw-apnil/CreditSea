import { Router } from 'express';
import { login, logout, me, signup } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { loginSchema, signupSchema } from '../validators/auth.validators';

export const authRouter = Router();

authRouter.post('/signup', validate({ body: signupSchema }), signup);
authRouter.post('/login', validate({ body: loginSchema }), login);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);
