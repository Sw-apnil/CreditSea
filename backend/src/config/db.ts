import mongoose from 'mongoose';
import { env } from './env';

let connectionPromise: Promise<void> | null = null;

export const connectDatabase = async (): Promise<void> => {
  mongoose.set('strictQuery', true);

  if (mongoose.connection.readyState === 1) return;

  connectionPromise ??= mongoose
    .connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME })
    .then(() => {
      console.log(`MongoDB connected: ${mongoose.connection.name}`);
    })
    .catch((error: unknown) => {
      connectionPromise = null;
      throw error;
    });

  await connectionPromise;
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
