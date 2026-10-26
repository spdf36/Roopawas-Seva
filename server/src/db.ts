import mongoose from 'mongoose';
import { config } from './config';

/** Connects to MongoDB (MONGODB_URI, database MONGODB_DB). Fails fast instead of queueing queries. */
export async function connectDb(dbName = config.mongoDb) {
  mongoose.set('strictQuery', true);
  // Without this, queries made while disconnected wait silently instead of failing.
  mongoose.set('bufferCommands', false);
  await mongoose.connect(config.mongoUri(), { dbName, serverSelectionTimeoutMS: 10_000 });
  return mongoose.connection;
}

export const disconnectDb = () => mongoose.disconnect();

export const dbReady = () => mongoose.connection.readyState === 1;
