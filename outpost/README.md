# Outpost app

This folder is the whole product: the iOS app, the Convex backend and the laptop studio worker. For what Outpost is, see the [top-level README](../README.md).

| Folder | What it is |
|---|---|
| `src/` | The Expo Router app. Routes are in `src/app/` |
| `convex/` | Convex backend: schema, queries, mutations, actions, crons and the Whop webhook |
| `studio/` | The studio worker that makes videos on the laptop, and its Compound template |
| `assets/` | Images, the village art, icons and sounds bundled with the app |
| `art/` | Python scripts that draw the pixel art in `assets/` |
| `docs/` | The docs listed below |

## Docs

- [Architecture](docs/architecture.md): how the parts connect, the life of a video, and the data model
- [App](docs/app.md): every screen and what you can do on it
- [Backend](docs/backend.md): every Convex module, the crons, posting modes and admin commands
- [Integrations](docs/integrations.md): each outside service and its status
- [Demo runbook](docs/demo-runbook.md): how to run the live demo
- [Studio](studio/README.md): the studio worker and its video template

## What you need

- macOS with Xcode, for the iOS simulator and device builds
- Node 22 (the version CI uses) and npm
- A Convex account
- For the studio: the `claude` CLI signed in, the Compound Beta app, a Python environment with Kokoro, and `ffmpeg`

Install dependencies once:

```sh
cd outpost
npm ci
```

## Environment variables

| Part | Variable | Where it is set | What it is |
|---|---|---|---|
| App | `EXPO_PUBLIC_CONVEX_URL` | `outpost/.env.local` | The Convex deployment URL. Built into the app |
| App | `EXPO_PUBLIC_DEVICE_ID` | Build env, optional | Pins the device id, so every install of the build is one user. Only the Revyl proof builds set it (`.revyl/config.yaml`). At least 43 letters, digits, `-` or `_` |
| Studio worker | `EXPO_PUBLIC_CONVEX_URL` or `CONVEX_URL` | `.env.local`, or the shell | Same URL. `CONVEX_URL` in the shell wins |
| Studio worker | `WORKER_SECRET` | `outpost/.env.worker`, or the shell | Must match the Convex variable of the same name |
| Studio worker | `WRITER_MODEL` | Shell, optional | The Claude model for scripts. Default `sonnet` |
| Convex | `WORKER_SECRET`, `MAX_USERS`, `ZERNIO_API_KEY`, `WHOP_API_KEY`, `WHOP_ENV`, `WHOP_WEBHOOK_SECRET`, `PUBLIC_SITE_URL`, `SUPERMEMORY_API_KEY`, `WHOP_CLIENT_ID`, `WHOP_CLIENT_SECRET`, `WHOP_OAUTH_REDIRECT` | `npx convex env set` | See [backend.md](docs/backend.md#environment-variables) |

Git ignores every `.env*` file except `.env.example`. The worker reads only `NAME=value` lines from both files.

## Convex backend

Push the functions and watch for changes:

```sh
cd outpost
npx convex dev
```

On first run this asks you to log in and pick a project, then writes the deployment URL to `.env.local`. The phone has to reach the deployment, so use a cloud deployment, not a local one.

Set the server variables. `WORKER_SECRET` is required for the studio. The rest turn on posting, the shop raid and taste memory:

```sh
npx convex env set WORKER_SECRET <a long random string>
npx convex env set ZERNIO_API_KEY <key>
npx convex env set WHOP_API_KEY <sandbox key>
npx convex env set SUPERMEMORY_API_KEY <key>
```

After the app has made a user, link the Zernio accounts and choose a posting mode:

```sh
npx convex run admin:users
npx convex run admin:linkZernio '{"userId": "<id>"}'
npx convex run admin:setMode '{"userId": "<id>", "mode": "private"}'
```

New users start in `dryRun`, which posts nothing. See [backend.md](docs/backend.md#admints) for every admin command.

## The app

The app uses native modules (widgets, secure store, video), so it runs in a development build, not Expo Go.

### iOS simulator

```sh
cd outpost
npx expo run:ios
```

This generates the native project, builds the dev client, installs it on a simulator and starts Metro. Later sessions only need `npx expo start` while the dev client is installed.

### Release build on a phone

```sh
cd outpost
npx expo run:ios --configuration Release --device
```

Pick the phone from the list. A Release build bundles the JavaScript, so it runs without Metro or the laptop. `EXPO_PUBLIC_CONVEX_URL` is fixed at build time, so rebuild after changing it. The phone needs Developer Mode on, and Xcode needs a signing team for the app and its widget.

The home-screen widget ("Outpost") is part of the build. Add it from the home screen's widget gallery.

### Checks

```sh
npx tsc --noEmit             # app
npx tsc --noEmit -p convex   # Convex functions
node --check studio/worker.mjs
```

CI runs the same three on every pull request that touches `outpost/`. Revyl also builds those pull requests for the iOS simulator (iPhone only), runs a proof-of-changes agent and the `outpost-regression` workflow on a cloud iPhone as a dry-run test user, and posts one verdict comment. Pull requests that touch only `convex/`, `studio/`, `docs/` or Markdown are skipped. To re-run, push a commit (an empty one works) or have a collaborator comment `@revyl rerun <guidance>`; Revyl ignores the comment from bots. See [docs/testing.md](docs/testing.md).

## The studio worker

The worker makes every video. Without it the Feed runs dry and the Base shows the studio asleep. Everything else, including posting, keeps running in Convex.

Before starting it, the laptop needs:

- the Compound Beta app open, with the project folder that `PROJECT_DIR` in `studio/worker.mjs` points to,
- the Python with Kokoro at the path in `PY`,
- `ffmpeg` and the `claude` CLI on the `PATH`.

Start it from `outpost/`, in a loop, because it exits on purpose when Compound or the voice server dies:

```sh
cd outpost
while true; do node studio/worker.mjs; sleep 3; done
```

It logs `studio ready` and then one line per finished video with its timings. The app shows the studio online within a few seconds.

For how the worker and its template work, see [studio/README.md](studio/README.md).
