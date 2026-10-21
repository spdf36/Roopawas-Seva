import { fail } from './http';

// Fixed-window counters kept in memory. Enough for a single server process; if the API ever runs as
// several instances, these would move to MongoDB or Redis so the instances share them.

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

const current = (key: string, now: number) => {
  const w = windows.get(key);
  return w && w.resetAt > now ? w : undefined;
};

/** Rejects with 429 rate_limited once `key` has been counted `limit` times in the current window. */
export function checkLimit(key: string, limit: number) {
  if ((current(key, Date.now())?.count ?? 0) >= limit) fail(429, 'rate_limited');
}

/** Counts one attempt against `key`; the window starts at the first attempt. */
export function countAttempt(key: string, windowMs: number) {
  const now = Date.now();
  const w = current(key, now);
  if (w) w.count += 1;
  else windows.set(key, { count: 1, resetAt: now + windowMs });
}

export const resetLimit = (key: string) => windows.delete(key);

/** Checks the limit and counts this attempt in one go (for actions limited whether or not they succeed). */
export function limit(key: string, max: number, windowMs: number) {
  checkLimit(key, max);
  countAttempt(key, windowMs);
}

// Forget finished windows now and then so the map does not grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, w] of windows) if (w.resetAt <= now) windows.delete(key);
}, 10 * 60_000).unref();
