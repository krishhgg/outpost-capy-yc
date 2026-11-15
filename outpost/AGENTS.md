# outpost/AGENTS.md

Start with the root [AGENTS.md](../AGENTS.md): what Outpost is, built vs planned, hard rules and commands. The
product direction is [BRIEF.md](../BRIEF.md). This file adds what is specific to the app, Convex and the studio.

## Expo app (`src/`)

Expo SDK 58, React Native 0.88, Expo Router, iOS only. **Expo changes every SDK; don't trust memory.** Check the
`expo` major in `package.json`, then read `https://docs.expo.dev/versions/v58.0.0/` or
https://docs.expo.dev/llms.txt before touching an Expo or RN API.

- Add packages with `npx expo install <pkg>`, never `npm install`, so versions match the SDK.
  `npx expo install --fix` and `npx expo-doctor` repair mismatches.
- `ios/` and `android/` are generated (CNG) and git-ignored. Never create or edit them; configure native
  behavior in `app.json` and config plugins.
- The app uses native modules (widgets, secure store, video), so it needs a dev build (`npx expo run:ios`), not
  Expo Go. Adding a native library means rebuilding.
- Routes are files in `src/app/` (`(tabs)/` holds Base, Feed and You; `hood.tsx` is the call log). Components
  live in `src/`, outside `app/`. Import `Link`, `router`, `useLocalSearchParams` from `expo-router`.
- The app reads only `EXPO_PUBLIC_CONVEX_URL`, fixed at build time. No other env or secret goes in the app.
- Keep the `testID`s on screens; device tests may rely on them.

## Convex (`convex/`)

- `convex/_generated/` is written by `npx convex dev`. Don't hand-edit it; commit it when functions change so CI
  typechecks.
- Typecheck separately: `npx tsc --noEmit -p convex` (own `tsconfig.json`).
- App-facing functions take `deviceId` and resolve the user with `userFor()`; worker functions live in
  `studio.ts` and take `key` (`requireWorker()`); everything builder-only is `internal` and run with
  `npx convex run admin:<name>`.
- Outside calls happen in actions and are logged to `calls` (`internal.post.call`); never log keys or webhook
  secrets.
- Posting mode is copied onto each `posts` row at swipe time, so changing a user's mode doesn't send held posts
  that were approved in `dryRun`.

## Studio (`studio/`)

- `worker.mjs` has hardcoded macOS paths (`PROJECT_DIR`, `COMPOUND`, `PY`) for one laptop. It cannot run in a
  cloud sandbox; verify edits with `node --check studio/worker.mjs` and say so in the PR.
- It reads `EXPO_PUBLIC_CONVEX_URL` from `.env.local` and `WORKER_SECRET` from `.env.worker` (shell vars win).
- It exits on purpose when Compound or the voice server dies; run it in the restart loop.
