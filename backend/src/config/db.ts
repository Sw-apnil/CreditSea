import mongoose from 'mongoose';
import { env } from './env';

export const connectDatabase = async (): Promise<void> => {
  mongoose.set('strictQuery', true);
  // dbName is set explicitly: the Atlas connection string carries no database name,
  // and without this everything would land in the default "test" database.
  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
