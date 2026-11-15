# Outpost

Outpost is an iOS app where AI agents run a small content business for you. A studio on a laptop writes, voices and renders short vertical videos. You swipe through them in the Feed: right posts a video to YouTube and Instagram, left sends it back with a reason and the studio remakes it. The Base shows the agents at work in a pixel-art village and runs a shop "raid" that sells a $9 Notion invoice template through Whop. The You tab tracks your daily streak, milestones and views.

It was built for the YC Consumer Mobile Hackathon, with the demo on Sunday, November 15, 2026.

## Demo flow

1. Open the app. A "While you were away" card counts what the agents did since you last looked: videos made, posts live, views and sales. Tap Collect.
2. On the Base, tap an agent to hear what it is doing, then tap REVIEW.
3. In the Feed, swipe right on a video. It goes out to YouTube and Instagram, and the first approval of the day keeps your streak.
4. Swipe left on another and pick "Hook too slow". A few cards later it comes back with a new hook.
5. Every few swipes, the Scout shows a paid product from the Whop marketplace. Tap MAKE IT and the next video is about the problem it solves.
6. Back on the Base, start the shop raid. Outpost creates the product and checkout on Whop's sandbox. A test payment lights the first-sale star and raises the Shop.
7. Tap the gear to see every outside call as it happens.

The full runbook is in [outpost/docs/demo-runbook.md](outpost/docs/demo-runbook.md).

## How it works

| Part | What it does | Code |
|---|---|---|
| App | Expo SDK 58, React Native, Expo Router. Talks only to Convex | `outpost/src/` |
| Backend | Convex: data, video files, the Feed, posting, payments, crons | `outpost/convex/` |
| Studio | A Node worker on the laptop. Claude writes the script, Kokoro voices it, Compound renders it, and the MP4 goes to Convex | `outpost/studio/` |

Outside services:

| Service | Used for | Status |
|---|---|---|
| Convex | Backend | Live |
| Claude (`claude -p`) | Scripts | Live |
| Kokoro | Voice, run locally | Live |
| Compound | Video rendering | Live |
| Zernio | Posting to YouTube and Instagram, view counts | Live |
| Whop | Marketplace search, and the shop raid's product, checkout and payments | Search live, shop in sandbox only |
| Supermemory | Remembering why you send videos back | Live |
| Revyl, Capy | Device tests and pull request proof | Planned, not integrated |

## Repo map

| Path | What it is |
|---|---|
| `outpost/` | The app, backend and studio. Everything that runs is here |
| `outpost/src/` | App screens and components. Routes are in `outpost/src/app/` |
| `outpost/convex/` | Convex schema and functions |
| `outpost/studio/` | The laptop studio worker and its Compound template |
| `outpost/art/` | Python scripts that draw the pixel art |
| `outpost/assets/` | Images, village art, icons and sounds |
| `outpost/docs/` | Architecture, app, backend, integrations and demo docs |
| `.github/workflows/typecheck.yml` | CI: type-checks the app and Convex, syntax-checks the worker |
| `engagement-research.md` | Research on why short-video feeds hold attention |
| `research/` | UX research (`ux/`) and the trend research behind the video batch (`trends/`) |
| `visuals/` | Static HTML mockups and pitch visuals |

The research notes and `visuals/` are background material. The code in `outpost/` is the source of truth.

## Quick start

You need macOS with Xcode, Node 22 and a Convex account.

```sh
cd outpost
npm ci
npx convex dev                         # log in, pick a project, push functions, write .env.local
npx convex env set WORKER_SECRET <a long random string>
npx expo run:ios                       # build the dev client and run it on the simulator
```

The Feed stays empty until the studio worker runs. It needs the `claude` CLI, Compound Beta, Kokoro and `ffmpeg` on the laptop:

```sh
cd outpost
while true; do node studio/worker.mjs; sleep 3; done
```

Posting, the shop raid and taste memory each need a key on Convex. New users start in dry run, which posts nothing. See [outpost/README.md](outpost/README.md) for the full setup.

## Docs

- [outpost/README.md](outpost/README.md): running the app, the backend and the studio, and the environment variables each needs
- [Architecture](outpost/docs/architecture.md): the system end to end, the life of a video, and the data model
- [App](outpost/docs/app.md): each screen and what you can do on it
- [Backend](outpost/docs/backend.md): Convex modules, crons, scheduled jobs, posting modes and admin commands
- [Integrations](outpost/docs/integrations.md): each service, where it is used, and its status
- [Demo runbook](outpost/docs/demo-runbook.md): running the live demo
- [Studio](outpost/studio/README.md): the studio worker and its video template
