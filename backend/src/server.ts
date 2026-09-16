import type { NextFunction, Request, Response } from 'express';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env } from './config/env';

const ensureDatabase = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
};

// Vercel uses this default export as the Express serverless function.
const app = createApp(ensureDatabase);
// package.json uses CommonJS; export= compiles to module.exports, which is the
// most reliable form for Vercel's Express detector.
export = app;

// Keep the traditional listener for local development. Vercel invokes the
// exported app directly and must not start a second listener.
if (!process.env.VERCEL) {
  const start = async (): Promise<void> => {
    try {
      await connectDatabase();
      const server = app.listen(env.PORT, () => {
        console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
      });

      const shutdown = (signal: string) => {
        console.log(`\n${signal} received, shutting down.`);
        server.close(() => {
          void disconnectDatabase().then(() => process.exit(0));
        });
      };

      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  void start();
}
