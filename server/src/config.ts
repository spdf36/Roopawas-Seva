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
  /** Database inside the cluster (Atlas connection strings often name none). */
  mongoDb: env.MONGODB_DB?.trim() || 'roopawas-seva',
  /** Where uploaded photos are stored. Must be on a persistent disk in production. */
  uploadsDir: path.resolve(import.meta.dirname, '..', env.UPLOADS_DIR ?? 'uploads'),
  /** Website origins allowed to call the API (comma-separated). */
  webOrigins: (env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()).filter(Boolean),
  /**
   * How many reverse proxies (load balancer, Nginx…) sit in front of the server, so rate limits see the
   * visitor's real IP address instead of the proxy's. 0 when the server is reached directly.
   */
  trustProxy: Number(env.TRUST_PROXY ?? 0),
  /** Enables the demo logins and the reset endpoint. Never set in a real deployment. */
  demoMode: env.DEMO_MODE === 'true',
  /** The first super admin, created by `npm run setup` when the database has none. */
  superAdmin: () => ({
    loginId: required('SUPERADMIN_LOGIN'),
    pin: required('SUPERADMIN_PIN'),
    name: required('SUPERADMIN_NAME'),
    mobile: required('SUPERADMIN_MOBILE'),
  }),
};

if (!Number.isInteger(config.port) || config.port <= 0) throw new Error(`PORT must be a positive whole number, got "${env.PORT}".`);
