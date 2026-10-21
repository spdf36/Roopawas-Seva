import fs from 'node:fs';
import path from 'node:path';

// Settings come from the environment; for local development, from server/.env (see .env.example).
const envFile = path.resolve(import.meta.dirname, '../.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const env = process.env;

function required(name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}: set it in server/.env (see .env.example) or in the environment.`);
  return value;
}

export const config = {
  port: Number(env.PORT ?? 4000),
  /** MongoDB Atlas connection string. */
  mongoUri: () => required('MONGODB_URI'),
  /** Where uploaded photos are stored. Must be on a persistent disk in production. */
  uploadsDir: path.resolve(import.meta.dirname, '..', env.UPLOADS_DIR ?? 'uploads'),
  /** Website origins allowed to call the API (comma-separated). */
  webOrigins: (env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()).filter(Boolean),
  /** Enables the demo logins and the reset endpoint. Never set in a real deployment. */
  demoMode: env.DEMO_MODE === 'true',
};

if (!Number.isInteger(config.port) || config.port <= 0) throw new Error(`PORT must be a positive whole number, got "${env.PORT}".`);
