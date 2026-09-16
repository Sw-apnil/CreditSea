import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

export const createApp = () => {
  const app = express();

  // credentials:true is required for the httpOnly auth cookie to survive cross-origin calls.
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
  });

  app.use('/api', apiRouter);

  // Note: the uploads directory is deliberately NOT served statically.
  // Salary slips are streamed only through an authenticated, role-checked route.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
