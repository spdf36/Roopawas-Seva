# Roopawas Seva – backend API

Express 5 + TypeScript (run directly with `tsx`, no build step) + MongoDB Atlas via Mongoose. It
implements the API contract in `../shared/api.ts`, which the website also uses; types and rules come from
`../shared`.

**Status:** being built in stages. Done: project setup (stage 1), database models, demo seed and setup
(stage 2), auth and accounts (stage 3: `/auth/*`, `/accounts/*`). Requests, content and photos follow.

## Logins and security

- A login returns a random token (sent back as `Authorization: Bearer <token>`); sessions last 30 days.
  Logout, deactivation and removal end sessions at once.
- Failed logins are limited to 5 per login ID and 30 per address in 15 minutes, OTPs to 3 per number in
  10 minutes and 10 per address per hour (`429 rate_limited`). The counters live in memory, which is fine
  for one server process. Behind a proxy, set `TRUST_PROXY` so the limits see visitors' real addresses.
- **OTP:** in demo mode any 4 digits are accepted. Otherwise the server creates a code (valid 10 minutes,
  5 tries, stored hashed). **No SMS provider is connected yet:** the code is written to the server log
  (`src/otp.ts`). Connect a provider there before citizens register for real.

## Run it

```bash
cp .env.example .env     # then fill it in (Windows: copy .env.example .env)
npm install
npm run seed             # demo: load the sample data (needs DEMO_MODE=true)
npm run setup            # real use: indexes + first super admin from SUPERADMIN_* (instead of seed)
npm run dev              # http://localhost:4000, restarts on changes
npm start                # without watching, for production
npm run typecheck
```

Requires Node.js 22 or newer. In Atlas, allow the server's IP address under **Network Access**, or the
connection is refused.

### Demo or real data

- **Demo** (`DEMO_MODE=true`): `npm run seed` loads the same sample data the website's mock uses – demo
  logins `9876543210` / `1111` (citizen), `sarpanch` / `1234` (admin), `superadmin` / `0000`. It refuses
  to run on a database that already has data; `npm run seed -- --reset` deletes everything and reloads.
- **Real** (`DEMO_MODE=false`): `npm run setup` creates the indexes and, if there is no super admin yet,
  one from `SUPERADMIN_LOGIN`, `SUPERADMIN_PIN`, `SUPERADMIN_NAME` and `SUPERADMIN_MOBILE`. It never
  deletes or overwrites anything, so it is safe to run on every deploy.

## Configuration (`.env`)

| Variable | What |
| --- | --- |
| `PORT` | Port to listen on (default 4000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB` | Database name inside the cluster (default `roopawas-seva`) |
| `TRUST_PROXY` | Number of reverse proxies in front of the server (0 when reached directly) |
| `WEB_ORIGIN` | Website address(es) allowed to call the API, comma-separated |
| `UPLOADS_DIR` | Folder for uploaded photos; must be on a persistent disk in production |
| `DEMO_MODE` | `true` enables demo logins, the reset endpoint and `npm run seed`; keep `false` for real use |
| `SUPERADMIN_*` | The first super admin, used by `npm run setup` only |

`.env` is never committed.

## Data

| Collection | What |
| --- | --- |
| `accounts` | Citizens and staff. Login IDs are unique; one citizen account per mobile number. PINs are stored as bcrypt hashes only. |
| `sessions` | Login sessions, keyed by a SHA-256 hash of the token (never the token itself); MongoDB deletes them when they expire. |
| `otps` | Pending registration codes (hashed), one per mobile number; deleted when used or expired. |
| `requests` | Complaints and scheme applications, keyed by their request number (`RP-2026-00128`). Photos are files in `UPLOADS_DIR`; only the file name is stored. |
| `counters` | The sequence request numbers are taken from. |
| `notices`, `schemes`, `works`, `baselines` | Content managed by the Panchayat (schemes keyed by their short ID). |

## Errors

Every error is JSON `{ "code": "..." }` with a matching HTTP status, using the codes in
`ErrorCode` (`../shared/api.ts`), e.g. `401 unauthorized`, `404 not_found`, `413 too_large`,
`500 server_error`. `GET /health` answers 503 while the database is unreachable.

## Where things are

| Path | What |
| --- | --- |
| `src/index.ts` | Connects to MongoDB, then starts the server |
| `src/app.ts` | The Express app: middleware, routes, error handling |
| `src/config.ts` | Settings from the environment / `.env` |
| `src/db.ts` | MongoDB connection |
| `src/models.ts` | Mongoose models (one per collection) |
| `src/serialize.ts` | Turns documents into the shared API types – the only way data leaves the server |
| `src/routes/` | The endpoints, one file per area (`auth.ts`, `accounts.ts`) |
| `src/auth.ts` | Sessions: start, end, and `authenticate(req, roles)` for routes |
| `src/otp.ts` | Registration codes, and where an SMS provider plugs in |
| `src/rateLimit.ts` | Attempt counters for logins and OTPs |
| `src/http.ts` | Reading request bodies safely; `fail(status, code)` |
| `src/pins.ts` | PIN hashing |
| `src/sampleData.ts`, `src/scripts/` | Demo seed and the setup script |
