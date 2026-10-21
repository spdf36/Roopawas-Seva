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
| `web/` | Website | React 19, Vite, React Router, Zustand (localStorage) |
| `app/` | Mobile app (Android APK) | Expo SDK 57, React Native, Expo Router, Zustand (AsyncStorage) |
| `docs/` | Concept board, walkthrough video, screenshots | |

There is no backend yet: all data is sample data stored on the device or in the browser. The plan is to
finish the website, build a backend, then rebuild the app on top of that backend.

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

- **Mirrored files:** `data.ts`, `store.ts`, `stats.ts`, `filters.ts`, `theme.ts` and
  `components/CitizenFields.tsx` exist in both `app/src` and `web/src`. Change both copies together;
  they should differ only in platform details (storage engine, icon type, input handlers).
- **Bilingual:** every user-facing string is Hindi + English. Use `t('हिंदी', 'English')` inline and
  `{ hi, en }` objects (`L`) in data. Hindi is the default language.
- **Rules live in the store:** permission and business rules (who can change what, status flow) are
  enforced in `store.ts`, not only in the UI, so they carry over when the store is replaced by API calls.
- **Request status** only moves forward along `FLOW` (or to `rejected`); see `nextStatuses` in `data.ts`.
- Match the surrounding code style: function components, small helpers, short comments that explain why.
