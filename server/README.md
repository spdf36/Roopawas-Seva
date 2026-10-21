# Roopawas Seva – backend API

Express 5 + TypeScript (run directly with `tsx`, no build step) + MongoDB Atlas. It implements the API
contract in `../shared/api.ts`, which the website also uses; types and rules come from `../shared`.

**Status:** being built in stages. Stage 1 (this) is the project setup: configuration, the health check
and the error format. The endpoints follow in the next stages.

## Run it

```bash
cp .env.example .env     # then fill it in (Windows: copy .env.example .env)
npm install
npm run dev              # http://localhost:4000, restarts on changes
npm start                # without watching, for production
npm run typecheck
```

Requires Node.js 22 or newer.

## Configuration (`.env`)

| Variable | What |
| --- | --- |
| `PORT` | Port to listen on (default 4000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `WEB_ORIGIN` | Website address(es) allowed to call the API, comma-separated |
| `UPLOADS_DIR` | Folder for uploaded photos; must be on a persistent disk in production |
| `DEMO_MODE` | `true` enables demo logins and the reset endpoint; keep `false` for real use |

`.env` is never committed.

## Errors

Every error is JSON `{ "code": "..." }` with a matching HTTP status, using the codes in
`ErrorCode` (`../shared/api.ts`), e.g. `401 unauthorized`, `404 not_found`, `413 too_large`,
`500 server_error`.

## Where things are

| Path | What |
| --- | --- |
| `src/index.ts` | Starts the server |
| `src/app.ts` | The Express app: middleware, routes, error handling |
| `src/config.ts` | Settings from the environment / `.env` |
