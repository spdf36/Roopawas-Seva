import { ApiError } from '@shared/api';
import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';
import { config } from './config';
import { dbReady } from './db';

/** The Express app, without starting a server, so it can also be used in tests. */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: config.webOrigins }));
  // Photos arrive as compressed data: URLs inside JSON (at most MAX_PHOTO_BYTES), so allow a bit more than that.
  app.use(express.json({ limit: '1mb' }));

  // For uptime checks: 503 while the database connection is down.
  app.get('/health', (_req, res) => {
    const db = dbReady();
    res.status(db ? 200 : 503).json({ ok: db, db: db ? 'connected' : 'disconnected', demoMode: config.demoMode });
  });

  // Unknown routes answer like any other API error.
  app.use(() => {
    throw new ApiError(404, 'not_found');
  });

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ApiError) {
      res.status(err.status).json({ code: err.code });
      return;
    }
    // Body too large or not valid JSON, reported by express.json().
    if (err?.type === 'entity.too.large') {
      res.status(413).json({ code: 'too_large' });
      return;
    }
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ code: 'invalid' });
      return;
    }
    console.error(err);
    res.status(500).json({ code: 'server_error' });
  };
  app.use(onError);

  return app;
}
