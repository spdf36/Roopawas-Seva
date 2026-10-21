import { createApp } from './app';
import { config } from './config';

const server = createApp().listen(config.port, () => {
  console.log(`Roopawas Seva API on http://localhost:${config.port}${config.demoMode ? ' (demo mode)' : ''}`);
});

// Finish in-flight requests before exiting (deploys and Ctrl+C).
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
