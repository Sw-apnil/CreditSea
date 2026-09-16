import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env } from './config/env';

const start = async (): Promise<void> => {
  try {
    await connectDatabase();
    const app = createApp();
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
