# Roopawas Seva – mobile app (React Native)

The citizen + Sarpanch mobile app, built with Expo / React Native. It has the same features as the
website (`../web`) and uses the same API contract (`../shared/api.ts`) and backend (`../server`).

## Where the data comes from

| `EXPO_PUBLIC_API_URL` when the app is started or built | The app uses |
| --- | --- |
| Set, e.g. `http://192.168.1.20:4000` | The backend. Logins, requests, photos… are real and shared with the website |
| Not set | Built-in sample data saved on the phone (AsyncStorage): a self-contained demo. Village Yojnas need the server and say so |

A phone cannot reach `localhost` on the computer: use the computer's address on the Wi-Fi (`ipconfig`),
and allow port 4000 through the Windows firewall. The server's `WEB_ORIGIN` only matters for browsers, not
for the app.

## Run it

```bash
npm install
npm start            # dev server (Expo Go or a dev build)
npm run typecheck
npm run lint
```

## Build the demo APK

```bash
npm run build:apk                                              # sample data on the phone
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000 npm run build:apk  # uses that backend (PowerShell: $env:EXPO_PUBLIC_API_URL='…'; npm run build:apk)
# -> builds/roopawas-seva-<version>.apk
```

After adding a native package or a config plugin, build once with `npm run build:apk -- --clean`.

or directly with Gradle, after `android/` has been generated once:

```powershell
cd android
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
# -> android\app\build\outputs\apk\release\app-release.apk
```

- Built locally (`expo prebuild` + Gradle), signed with the debug key: fine for installing on
  demo phones, not for the Play Store. Needs JDK 17 and the Android SDK (`ANDROID_HOME`).
- `arm64-v8a` only, which covers practically every current Android phone. For old 32-bit
  phones use `-PreactNativeArchitectures=armeabi-v7a,arm64-v8a`.
- **Windows: keep this folder's path short.** The native build embeds the path twice in
  object-file names and fails with `build.ninja still dirty after 100 tries` once they pass
  260 characters. `subst` drives and junctions do not help.
- `react-native-gesture-handler`, `react-native-reanimated` and `react-native-worklets` are in
  `package.json` only to pin them to the Expo SDK's versions (Expo Router pulls them in);
  newer versions break the Windows build. Add packages with `npx expo install`.
- The build script stops leftover Gradle and Kotlin daemons before and after building.

## Demo script

Village information is open to everyone; the **लॉगिन करें** button (home screen or **अन्य** tab)
serves every role. Demo accounts are listed on the login screen (tap one to fill it in); see the main
README for the full list.

1. As a visitor: home, **ग्राम विकास योजनाएँ** (Village Yojnas), notices, village dashboard, help.
2. **पंजीकरण करें** – details, any 4-digit OTP, then choose a PIN. You are logged in as the new citizen.
3. **मेरी समस्या** – raise a complaint with a photo and your GPS location; you get a number like
   `RP-2026-00129`. Track it under **मेरी आवेदनें**. Apply for a scheme under **योजनाएँ**.
4. Log in as `superadmin` / `0000` → **एडमिन प्रबंधन** to create an admin.
5. Log in as that admin (or `sarpanch` / `1234`): search **सभी आवेदन देखें**, open the complaint, move it
   forward with a note. Publish a notice, manage schemes, record a yojna expense with its bill.
6. Log back in as the citizen: the status, the note and who made the change are shown. A resolved
   complaint can be confirmed, or reopened within 30 days.
7. **अन्य → डेमो रीसेट करें** restores the sample data (on a demo server, or on the phone).

## Where things are

| Path | What |
| --- | --- |
| `src/app/` | Screens (Expo Router). `(tabs)/` = bottom tabs, `admin/` = staff area, `yojnas/` = public Village Yojnas |
| `src/api/` | `hooks.ts` (TanStack Query hooks used by screens), `http.ts` (the backend), `mock.ts` (sample data on the phone) – the website's `web/src/api` adapted for React Native |
| `src/store.ts` | Language and login session only |
| `src/components/` | UI kit (`ui.tsx`), request timeline, Village Yojna views and forms, **placeholder** logo and banner (`Art.tsx`) |
| `src/photo.ts` | Picks a photo and shrinks it below the API's size limit |
| `../shared/` | Types, catalogue, rules, API contract and sample data shared with the website and server (`@shared/...`) |

### Replacing the placeholder logo and banner

- In-app: replace the `Logo` and `Banner` components in `src/components/Art.tsx` with `<Image>`s.
- App icon / splash: replace the PNGs in `assets/` (same file names and sizes), then rebuild
  with `npm run build:apk -- --clean`.
