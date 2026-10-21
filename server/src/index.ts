import { createApp } from './app';
import { config } from './config';
import { connectDb, disconnectDb } from './db';

async function main() {
  const conn = await connectDb();
  const server = createApp().listen(config.port, () => {
    console.log(`Roopawas Seva API on http://localhost:${config.port} – database "${conn.name}"${config.demoMode ? ' (demo mode)' : ''}`);
  });

  // Finish in-flight requests before exiting (deploys and Ctrl+C).
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => server.close(() => disconnectDb().finally(() => process.exit(0))));
  }
}

main().catch((e) => {
  console.error('Could not start:', e instanceof Error ? e.message : e);
  process.exit(1);
});
