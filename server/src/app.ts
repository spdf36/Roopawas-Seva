import { ApiError, ErrorCode } from '@shared/api';
import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { config } from './config';
import { dbReady } from './db';
import { accountsRouter } from './routes/accounts';
import { authRouter } from './routes/auth';

/** The Express app, without starting a server, so it can also be used in tests. */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Lets req.ip (used by the rate limits) be the visitor's address when behind a proxy.
  app.set('trust proxy', config.trustProxy);
  app.use(cors({ origin: config.webOrigins }));
  // Photos arrive as compressed data: URLs inside JSON (at most MAX_PHOTO_BYTES), so allow a bit more than that.
  app.use(express.json({ limit: '1mb' }));

  // For uptime checks: 503 while the database connection is down.
  app.get('/health', (_req, res) => {
    const db = dbReady();
    res.status(db ? 200 : 503).json({ ok: db, db: db ? 'connected' : 'disconnected', demoMode: config.demoMode });
  });

  app.use('/auth', authRouter);
  app.use('/accounts', accountsRouter);

  // Unknown routes answer like any other API error.
  app.use(() => {
    throw new ApiError(404, 'not_found');
  });

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    const send = (status: number, code: ErrorCode) => res.status(status).json({ code });
    if (err instanceof ApiError) return send(err.status, err.code);
    // Body too large or not valid JSON, reported by express.json().
    if (err?.type === 'entity.too.large') return send(413, 'too_large');
    if (err?.type === 'entity.parse.failed') return send(400, 'invalid');
    // A unique index refused a duplicate (login ID, citizen mobile…), e.g. when two requests race.
    if (err?.code === 11000) return send(409, 'exists');
    if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) return send(400, 'invalid');
    console.error(err);
    send(500, 'server_error');
  };
  app.use(onError);

  return app;
}
