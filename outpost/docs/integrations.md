# Integrations

Each outside service Outpost uses: what it does for the app, where the code is, what it needs, and its status.

## Summary

| Service | Used for | Runs from | Status |
|---|---|---|---|
| Convex | Database, file storage, functions, crons, the Whop webhook | Cloud | Live |
| Claude | Writes each video script | Laptop, `claude -p` | Live |
| Kokoro | Reads the script aloud with word timings | Laptop, local Python | Live |
| Compound | Renders the video | Laptop, Compound Beta app | Live |
| Zernio | Posts to YouTube and Instagram, reads views | Convex | Live. Each user's posting mode decides what goes out |
| Whop marketplace | The Scout's product search | Convex | Live. Public API, no key |
| Whop shop | Product, checkout and payments for the shop raid | Convex | Sandbox only. Production is refused in code |
| Supermemory | Remembers why the user sends videos back | Convex | Live when `SUPERMEMORY_API_KEY` is set |
| Revyl | Device tests | | Planned. Not integrated |
| Capy | Proof of changes on pull requests | | Planned. Not integrated |

The `/hood` screen in the app lists the first seven with their role ("Writes each script", "Reads it aloud", "Renders the video", "Stores videos, runs the feed", "Posts videos, reads views", "Store and checkout", "Remembers why you skip"). The list lives in `SERVICES` in `convex/hood.ts`.

## Convex

The whole backend. The app and the studio worker both talk to it, and nothing else.

- **Code.** `outpost/convex/`. See [backend.md](backend.md).
- **What it holds.** Users, video jobs and their MP4 files (Convex storage), swipes, posts, raids, payments, and a log of every outside call.
- **What it runs.** The Feed, the post scheduler (`pace.ts`), the posting and view-reading actions, the Scout, Supermemory sync, Whop setup and polling, two crons, and one HTTP route (`POST /whop/webhook`).
- **Needs.** A deployment. The app reads its URL from `EXPO_PUBLIC_CONVEX_URL`. Server variables are listed in [backend.md](backend.md#environment-variables).

## Claude

Writes the script for every video.

- **Code.** `claude()` and `draft()` in `studio/worker.mjs`. The prompt and JSON schema are `system()` and `SCRIPT_SCHEMA` in `studio/reel.mjs`.
- **How.** The worker spawns the `claude` CLI with `-p --model sonnet --output-format json --json-schema ...`, no tools, no MCP servers and no saved session. It runs from `/tmp/outpost/claude-cwd`. Up to 3 run at once, each with a 60 second limit. `WRITER_MODEL` changes the model.
- **Needs.** The `claude` CLI on the laptop, signed in. There is no Anthropic API key in the project. The planning notes say Claude runs on the builder's subscription.
- **Inputs.** The niche, the 5 newest taste notes, up to 6 lines Supermemory learned, recent hooks to avoid, and for a remake the old script and the reason.
- **Rules in the prompt.** Second person or how-to only. No personal claims, results, income or invented statistics. The account sells one product, the $9 Notion client-invoice template.

## Kokoro

Local text to speech.

- **Code.** `studio/voice.py`, started by `voice` in `studio/worker.mjs`.
- **How.** One Python process that loads `KPipeline` once and answers JSON requests on stdin. It returns a 24 kHz WAV and per-word start and end times, which drive the on-screen words. The worker then runs an `ffmpeg` pass to deepen the voice and normalize loudness.
- **Voices.** `am_onyx`, `am_fenrir`, `am_michael`. A "Voice" remake moves to the next one.
- **Needs.** A Python environment with `kokoro`, `numpy` and `soundfile` at the path in `PY` in `worker.mjs`, and `ffmpeg` on the `PATH`. `studio/sfx.py` uses the same Python to make the sound effects once.

## Compound

Renders each video from a code template.

- **Code.** `compound` and `render()` in `studio/worker.mjs`, the template in `studio/template/`, and the event layout in `layout()` in `studio/reel.mjs`.
- **How.** The worker starts `compound mcp` from the Compound Beta app bundle and calls the `open` and `export` tools over JSON-RPC. At start it copies `template/index.tsx` and `template/jobs.ts` into a Compound project folder (`PROJECT_DIR`). Each job is written into that project's `jobs.ts`, keeping the last 8, and exported to an MP4. Exports run one at a time.
- **Needs.** The Compound Beta app in `/Applications` and the project folder at `PROJECT_DIR`. The worker exits if Compound exits or stops answering for 3 minutes.
- **More.** [`outpost/studio/README.md`](../studio/README.md) covers the template.

## Zernio

Posts the approved videos and reads their views. Zernio holds the connected YouTube and Instagram accounts.

- **Code.** `convex/post.ts` (posting), `convex/views.ts` (views), `admin.linkZernio` in `convex/admin.ts` (accounts).
- **Calls.**

  | Call | Where | Why |
  |---|---|---|
  | `GET /accounts` | `admin.linkZernio` | Copy the connected accounts onto a user |
  | `POST /media/presign`, then `PUT` | `post.publish` | Upload the MP4 |
  | `POST /posts` | `post.publish` | Publish now, with `Idempotency-Key` set to the post row id |
  | `GET /posts/{id}` | `post.check` | Wait for the platform URL |
  | `GET /analytics?postId=` | `views.sync` | Views, every 20 minutes for posts up to 14 days old |

- **Disclosure.** Every caption ends with "Made with AI." YouTube posts set `containsSyntheticMedia: true` and Instagram posts set `isAiGenerated: true`.
- **Needs.** `ZERNIO_API_KEY` on Convex, and `admin:linkZernio` run once per user.
- **Status.** Live. New users start in `dryRun`, which sends nothing. The builder switches a user to `private` or `public` with `admin:setMode`. See [backend.md](backend.md#postts).

## Whop

Two separate uses.

### Marketplace search (the Scout)

- **Code.** `convex/scout.ts`.
- **How.** `GET https://api.whop.com/api/v1/products?query=...` with no key. For the default niche it searches `invoice`, `freelancer`, `client management` and `notion freelance`, keeps paid USD products, and saves the 8 best new ones by member count and rating.
- **When.** When a user has fewer than 2 unswiped finds and the last search is at least 6 hours old.
- **Status.** Live.

### The shop raid

- **Code.** `convex/raids.ts`, `convex/whop.ts`, `convex/http.ts`.
- **How.** Against `https://sandbox-api.whop.com/api/v1`:

  | Step | Call |
  |---|---|
  | Product | `POST /products` for "Notion Client Invoice Template" |
  | Checkout | `POST /checkout_configurations`, $9 one time, which returns the `purchase_url` |
  | Sale alerts | `POST /webhooks` for `payment.succeeded`, only if `PUBLIC_SITE_URL` is set |
  | Watching | `GET /payments?product_id=...` every 4 seconds while the raid is watched |

  The webhook arrives at `POST /whop/webhook` and is checked with the Standard Webhooks signature. A payment from either path is saved once, keyed on its payment id.
- **Needs.** `WHOP_API_KEY` (a sandbox key) on Convex. Optional: `PUBLIC_SITE_URL`, `WHOP_WEBHOOK_SECRET`.
- **Status.** Sandbox only. `whopIsTest()` is true unless `WHOP_ENV` is `production`, and `whop.setup` refuses to run outside sandbox with "Real Whop checkouts are off", because nothing delivers the template yet. Test sales are marked `test` in the ledger, light the raid's stars, and never count as real earnings.

## Supermemory

Learns the user's taste from the reasons they give for sending videos back.

- **Code.** `convex/memory.ts`.
- **Calls.**

  | Call | Why |
  |---|---|
  | `POST /v3/documents` | Save a note, in container `outpost_<userId>`, with the Convex note id as `customId` so a resend updates it |
  | `POST /v3/documents/documents` | Read the user's notes and the memories made from them |
  | `POST /v4/profile` | Read what Supermemory has learned about the user |

- **How it is used.** What Supermemory learned is cached in the `taste` table. `studio.claim` passes up to 6 learned lines to the script writer. The `/hood` screen shows the notes, the learned lines and a graph of notes to memories.
- **Needs.** `SUPERMEMORY_API_KEY` on Convex. Without it, notes still drive remakes and the call is logged as skipped.
- **Status.** Live when the key is set.

## Revyl

- **Status.** Planned, not integrated. The app has no Revyl config and CI does not run Revyl.
- **Intended use.** YAML tests on cloud iPhones with a report video.

## Capy

- **Status.** Planned, not integrated. Nothing in the repo uses it.
- **Intended use.** Revyl hands each pull request to Capy, which checks the change on a Revyl device and posts a write-up on the pull request.
