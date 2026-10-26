# Roopawas Seva – website (React)

The web portal, built with React + Vite + TypeScript. The mobile app is a separate React
Native project in `../app`.

Pages talk to a typed API (`src/api`, contract in `../shared/api.ts`) that is served either by the real
backend in `../server` or by a mock that runs in the browser:

- **With the server:** set `VITE_API_URL` in `web/.env` (copy `.env.example`) to the server's address,
  e.g. `http://localhost:4000`, and start the server (`cd ../server && npm run dev`). The server's
  `WEB_ORIGIN` must include this website's address (`http://localhost:5173` by default).
- **Without it:** leave `VITE_API_URL` empty and the website runs on its mock: sample data kept in the
  browser (localStorage), nothing shared between browsers. Handy for working on the UI offline.

Demo logins, the "any 4 digits" OTP hint and **Reset demo** only appear when the server is in demo mode
(the mock always is). Village Yojnas need the server; on the mock their pages say so.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build -> dist/ (VITE_API_URL is baked in at build time)
npm run preview    # serve the production build locally
```

`dist/` is a static site and can be hosted anywhere. It is a single-page app, so the host must
serve `index.html` for unknown paths (`public/_redirects` already does this on Netlify).

## Demo script

Information pages are public. Complaints, applications and the admin panel need a login; the
single **लॉगिन** button in the header serves every role. Demo accounts are listed on the login
page; see the main README for the full list.

1. **Home** – overview, services, complaint flow; switch language with हिंदी / English.
2. **लॉगिन → पंजीकरण करें** – register (any valid 10-digit mobile, any 4-digit OTP), then choose a
   PIN. You are logged in as the new citizen.
3. **शिकायत दर्ज करें** – raise a complaint; you get a number like `RP-2026-00128`.
4. **मेरी आवेदनें** – track it through the six steps.
5. Log in as `superadmin` / `0000` → **एडमिन प्रबंधन** to create an admin.
6. Log in as that admin (or `sarpanch` / `1234`), open the complaint, change its status and
   add a note.
7. Log back in as the citizen: the status, note, who made the change and the **गाँव की प्रगति**
   totals have updated.
8. **डेमो रीसेट करें** in the footer restores the sample data and accounts.

## Where things are

| Path | What |
| --- | --- |
| `src/App.tsx` | Routes |
| `src/pages/` | One file per page; `Admin.tsx` holds the Sarpanch panel, `AdminContent.tsx` its content pages (notices, schemes, figures), `Yojnas.tsx` / `AdminYojnas.tsx` the village Yojnas (public / staff) |
| `src/components/` | Navbar/footer layout, shared UI, placeholder logo/banner (`Art.tsx`) |
| `src/styles.css` | All styling; colours are CSS variables at the top |
| `src/api/mock.ts` | In-browser mock server (enforces roles, ownership and status rules) |
| `src/api/hooks.ts` | TanStack Query hooks the pages use for loading and saving data |
| `src/store.ts` | Client state only: language and login session |
| `../shared/` | Imported as `@shared/...`: types, catalogue and rules (`data.ts`), the API contract (`api.ts`), sample data (`seed.ts`) – shared with the server |

To replace the placeholder logo and banner, swap the `Logo` and `Banner` components in
`src/components/Art.tsx` for `<img>` tags and replace `public/favicon.png`.
