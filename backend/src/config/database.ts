import mongoose from 'mongoose';
import { env } from './env';
import logger from './logger';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);

  try {
    const connection = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
