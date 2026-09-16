import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env';
import { connectDatabase } from './config/db';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

export const createApp = (beforeRoutes?: RequestHandler) => {
  const app = express();

  // credentials:true is required for the httpOnly auth cookie to survive cross-origin calls.
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
  });

  if (beforeRoutes) app.use(beforeRoutes);

  app.use('/api', apiRouter);

  // Note: the uploads directory is deliberately NOT served statically.
  // Salary slips are streamed only through an authenticated, role-checked route.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const ensureDatabase = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
};

// Vercel detects src/app.ts automatically. Export the actual Express handler
// as the default export so the function runtime can invoke it directly.
const app = createApp(ensureDatabase);
export default app;
