# CLAUDE.md

Roopawas Seva (रूपावास की डिजिटल सेवा) is the digital service of Gram Panchayat Roopawas: government scheme
information, citizen complaints and resolution tracking, for citizens, Panchayat admins and a super admin.
See `README.md` for features, demo accounts and the walkthrough.

## Git: never commit or push

**Claude never runs `git commit`, `git push`, or anything else that changes git history or the remote**
(including `git add`, `git commit --amend`, `git rebase`, `git reset`, `git tag`, `gh pr create`).
Read-only commands like `git status`, `git diff` and `git log` are fine.

When a feature or bug fix is finished, Claude tells the user exactly which commands to run: a `git add` of
the changed files, a `git commit` with a suggested message, and `git push`. The user runs them.

## Layout

| Folder | What | Stack |
| --- | --- | --- |
| `web/` | Website | React 19, Vite, React Router, TanStack Query, Zustand |
| `app/` | Mobile app (Android APK) | Expo SDK 57, React Native, Expo Router, Zustand (AsyncStorage) |
| `docs/` | Concept board, walkthrough video, screenshots | |

**Plan:** finish the website → build the backend → rebuild the app on top of the backend.
The backend will be **MERN with TypeScript**: Express + MongoDB Atlas (Mongoose), run with `tsx`. The
Atlas connection string goes in the server's `.env` (never committed).

**Website data flow:** pages → hooks in `web/src/api/hooks.ts` (TanStack Query) → the `Api` interface in
`web/src/api/types.ts`. Until the backend exists, `web/src/api/mock.ts` implements that interface in the
browser (localStorage). `types.ts` is the contract the backend must implement: each method lists its REST
route and error codes. `web/src/store.ts` only holds the language and the session (token + user).

The mobile app still has the old all-in-the-store model and is frozen until it is rebuilt on the backend;
don't port website changes to it.

## Commands

```bash
# Website
cd web && npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + production build

# Mobile app
cd app && npm install
npm start            # Expo dev server
npm run typecheck
```

Before calling a task done, run `npm run build` in `web/` and `npm run typecheck` in `app/` for whichever
side changed. For app work, also follow `app/AGENTS.md` (Expo-specific rules, e.g. `npx expo install`).

## Rules

- **Bilingual:** every user-facing string is Hindi + English. Use `t('हिंदी', 'English')` inline and
  `{ hi, en }` objects (`L`) in data. Hindi is the default language.
- **Rules live behind the API:** permissions, ownership, validation and the status flow are enforced in
  the API implementation (`mock.ts` now, the backend later), never only in the UI. The API never returns
  PINs. When adding a feature, add the method to `types.ts` (with its route), implement it in `mock.ts`,
  and add a hook in `hooks.ts`; pages never call `api` directly.
- **Loading and errors:** render query data through `<Loaded q={…}>` and show mutation errors with
  `useErrorText()` (both in `web/src/components/ui.tsx`).
- **Request status** only moves forward along `FLOW` (or to `rejected`); see `nextStatuses` in `data.ts`.
- Match the surrounding code style: function components, small helpers, short comments that explain why.
