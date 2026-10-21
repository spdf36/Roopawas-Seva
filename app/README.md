# Roopawas Seva – mobile app (React Native)

The citizen + Sarpanch mobile app, built with Expo / React Native. The website is a separate
React project in `../web`.

Demo MVP: there is no backend yet. All data is sample data stored on the phone (AsyncStorage),
so each phone has its own copy and nothing syncs with the website.

## Run it

```bash
npm install
npm start            # dev server (Expo Go or a dev build)
npm run typecheck
```

## Build the demo APK

```bash
npm run build:apk    # -> builds/roopawas-seva-<version>.apk
```

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

## Demo script

1. **Home** – six tiles; switch language with the हिंदी / English toggle.
2. **मेरी जानकारी** – register (any valid 10-digit mobile, any 4-digit OTP).
3. **मेरी समस्या** – raise a complaint; you get a number like `RP-2026-00128`.
4. **मेरी आवेदनें** – track it through the six steps.
5. **अन्य → मुखिया / प्रशासक लॉगिन** – log in with `sarpanch` / `1234`, open the complaint,
   change its status and add a note.
6. Back on the citizen side the status, note and **गाँव की प्रगति** totals have updated.
7. **अन्य → डेमो रीसेट करें** restores the sample data before the next demo.

## Where things are

| Path | What |
| --- | --- |
| `src/app/` | Screens (Expo Router). `(tabs)/` = bottom tabs, `admin/` = Sarpanch side |
| `src/data.ts` | All sample content, bilingual (`{ hi, en }`) |
| `src/store.ts` | App state + persistence; swap this for API calls when a backend exists |
| `src/theme.ts` | Colours and fonts |
| `src/components/Art.tsx` | **Placeholder** logo and banner drawn in SVG |

`data.ts`, `store.ts`, `filters.ts` and `stats.ts` are mirrored in `../web/src`; change both
when the sample data or rules change.

### Replacing the placeholder logo and banner

- In-app: replace the `Logo` and `Banner` components in `src/components/Art.tsx` with `<Image>`s.
- App icon / splash: replace the PNGs in `assets/` (same file names and sizes), then rebuild
  with `npm run build:apk -- --clean`.
