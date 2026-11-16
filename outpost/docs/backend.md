# Backend

The backend is a Convex deployment. Its code is in `outpost/convex/`. This page lists every module and its main functions. For how the pieces fit together, see [architecture.md](architecture.md).

Three kinds of caller reach these functions:

| Caller | Can call | Auth |
|---|---|---|
| The app | Public queries and mutations that take `deviceId` | The device id must belong to a user (`userFor()` in `lib.ts`) |
| The studio worker | Public functions in `studio.ts` | Every call passes `key`, checked against `WORKER_SECRET` by `requireWorker()` |
| The builder | Internal functions, including everything in `admin.ts` | Convex dashboard or `npx convex run`. Not reachable from a phone |

## Environment variables

Set these on the Convex deployment with `npx convex env set NAME value` or in the dashboard. None of them go in the app.

| Variable | Read in | What it does | If unset |
|---|---|---|---|
| `WORKER_SECRET` | `lib.ts` | Shared secret for the studio worker | Every `studio.*` call fails with "bad worker key" |
| `MAX_USERS` | `feed.ts` | Most users the deployment accepts | 5 |
| `ZERNIO_API_KEY` | `post.ts`, `views.ts`, `admin.ts`, `hood.ts` | Posting and view counts | Real posts fail with "Posting key missing". Views are not read |
| `WHOP_API_KEY` | `whop.ts`, `hood.ts` | Shop raid setup and payment polling | Setup stops at the first step with "Waiting on the Whop key" |
| `WHOP_ENV` | `raids.ts` | `production` would use the live Whop API | Sandbox. Setup refuses to run in production |
| `WHOP_WEBHOOK_SECRET` | `whop.ts` | Overrides the webhook signing secret stored in `kv` | The secret saved when setup made the webhook |
| `PUBLIC_SITE_URL` | `whop.ts` | Public base URL of the deployment's HTTP actions, for the Whop webhook | No webhook. Payments arrive only by polling |
| `SUPERMEMORY_API_KEY` | `memory.ts`, `hood.ts` | Taste memory | Notes stay in Convex. The call is logged as skipped |
| `WHOP_CLIENT_ID`, `WHOP_CLIENT_SECRET`, `WHOP_OAUTH_REDIRECT` (or `WHOP_CALLBACK_URL`) | `whopAuth.ts` | The production Whop OAuth app (confidential, PKCE, `oauth:token_exchange`) and its exact redirect URI, `<site>/whop/oauth/callback` | `authorizeUrl` and the callback refuse. Whop Bounty rows wait as `pending` |

The Under the hood screen shows "Waiting on its key" for Zernio, Whop and Supermemory when their key is missing.

## Modules

### feed.ts

The Feed and the user record.

| Function | Kind | What it does |
|---|---|---|
| `ensureUser` | mutation | Finds or creates the user for a device id, follows the phone's time zone, refills the video buffer and starts a Scout search if finds are low. Rejects new users past `MAX_USERS` |
| `next` | query | Up to 12 ready videos with their playback URL, hook, length, remake label and Scout price |
| `status` | query | Studio counts (`queued`, `making`, `ready`), the steps in progress, the worker's last heartbeat, total views, the three newest posted videos for the post tray, and posts going out now |
| `swipe` | mutation | Records a right or left swipe. Right adds a `posts` row per platform and schedules it. Left with a reason saves a taste note, syncs it to Supermemory and queues a remake. Left without one deletes the file |

`REASONS` maps the remake keys to labels: `hook` (Hook too slow), `visuals` (Boring visuals), `voice` (Voice), `long` (Too long), `topic` (Wrong topic), `more` (Say more).

### studio.ts

The studio worker's API. Every function takes `key`.

| Function | Kind | What it does |
|---|---|---|
| `queue` | query | Up to 12 queued jobs, remakes first, then by rank |
| `claim` | mutation | Moves a queued video to `making` and returns everything the writer needs |
| `stage` | mutation | Sets the current step and renews the claim |
| `uploadUrl` | mutation | A Convex storage upload URL |
| `finish` | mutation | Saves a finished video as `ready`, or records a failure. Two failures mark it `failed` |
| `beat` | mutation | Heartbeat for the `laptop` worker row |
| `log` | mutation | Writes a `calls` row for the worker's Claude, Kokoro, Compound and upload steps |
| `recentCalls` | query | The 60 newest calls across all users |
| `sweep` | internal mutation | Returns claims older than 3 minutes to the queue. Run by cron |

### post.ts

Posting through Zernio.

| Function | Kind | What it does |
|---|---|---|
| `publish` | internal action | Sends one `posts` row according to its mode |
| `begin` | internal mutation | Checks the row is due, the queue isn't paused and the file exists, then marks it `publishing` |
| `settle` | internal mutation | Writes the result: `live`, `failed`, `dry_run`, `skipped` or still `publishing` |
| `check` | internal action | Asks Zernio for the post's status until the platform gives a URL |
| `retry` | internal mutation | Requeues a post after a network error, 429 or 5xx, up to 3 times, 15 seconds apart |
| `savePublicUrl` | internal mutation | Keeps Zernio's media URL on the video for 6 days so the second platform reuses the upload |
| `call` | internal mutation | Writes a `calls` row. Other modules use it too |

How `publish` handles each mode:

| Mode | YouTube | Instagram |
|---|---|---|
| `dryRun` | No request. Logged as skipped, row becomes `dry_run` | Same |
| `private` | `visibility: "private"` | Skipped with "Instagram has no private mode" |
| `public` | `visibility: "public"` | Posted to the feed |
| `demo` | No request. Logged as skipped ("simulated for the demo"), Posting for 2.5 s, then `live` with no URL | Same |

Demo mode exists for the staged demo and is set only with `admin:setMode`. A simulated post on a bounty video gets a `manual` submission row marked `demo`. "Submit on Whop" marks it submitted in one tap, opens nothing, and logs a skipped `whop` call. Demo posts forecast earnings like public ones. Nothing reaches Zernio or Whop.

A real post:

1. `POST /media/presign`, then `PUT` the MP4 to the returned URL. Skipped when the video already has a recent public URL.
2. `POST /posts` with the caption plus "Made with AI.", `publishNow: true`, and `Idempotency-Key` set to the row id. YouTube gets `containsSyntheticMedia: true` and the title. Instagram gets `isAiGenerated: true`.
3. If the response has a platform URL, the row goes `live`. Otherwise `check` runs every 15 seconds for the first 10 checks, every minute until 40, then every 30 minutes. After 88 checks (about a day) the row fails with "Zernio gave no answer for a day".

### pace.ts

Spreads posts out.

| Function | Kind | What it does |
|---|---|---|
| `nextSlot` | helper | The earliest time that keeps a platform under `pacePerDay` posts in any 24 hours and inside a burst of 2 that refills one every 20 minutes |
| `slotFor` | helper | `nextSlot` over the user's reserved slots for one platform |
| `place` | helper | Sets the slot, marks the row `queued` if due or `held` if not, and schedules `post.publish` at the slot |
| `reslot` | internal mutation | Gives every held row a new slot, oldest approval first. Runs after the pace changes or the queue resumes |

While `drainPaused` is true, nothing sends. Held rows give up their slots and `reslot` places them again on resume.

### views.ts

| Function | Kind | What it does |
|---|---|---|
| `sync` | internal action | Reads views from Zernio's `/analytics` for live posts from the last 14 days, 40 posts a minute. Keeps the higher count. Logs one line per user only when views moved or a read failed. Run by cron |
| `recentLive` | internal query | The live posts in the window |
| `save` | internal mutation | Writes new counts and `viewsAt` |

### scout.ts

The Scout searches the public Whop marketplace. No key is needed.

| Function | Kind | What it does |
|---|---|---|
| `scoutIfLow` | helper | Starts a search when the user has fewer than 2 unswiped finds and the last search is at least 6 hours old. Called from `ensureUser` and both swipe mutations |
| `search` | internal action | Runs each query for the niche against `GET /products`. For the default niche the queries are `invoice`, `freelancer`, `client management` and `notion freelance`. Keeps paid USD products, ranked by members then rating |
| `save` | internal mutation | Saves up to 8 new finds the user hasn't seen |
| `next` | query | The best unswiped find |
| `swipe` | mutation | Right queues a video about the find, ranked just after the third ready card. Left drops it |

### memory.ts

Taste memory in Supermemory. Convex keeps the notes, so a remake never waits on Supermemory.

| Function | Kind | What it does |
|---|---|---|
| `syncNote` | internal action | Sends one note to `POST /v3/documents` with container tag `outpost_<userId>` and the note id as `customId`, then starts a refresh round |
| `kick` | internal mutation | Starts a new refresh round. A newer round stops older ones |
| `refresh` | internal action | Reads `/v3/documents/documents` and `/v4/profile` every 20 seconds, up to 15 tries, and caches what was learned in `taste` |
| `syncPending` | internal mutation | Resends notes that never synced. With `all: true` it resends every note |
| `save` | internal mutation | Writes the cache if the round is still current |

### raids.ts

The shop raid. The product is fixed in `SHOP_PRODUCT`: "Notion Client Invoice Template" at $9.

| Function | Kind | What it does |
|---|---|---|
| `start` | mutation | Creates a raid and its offer and schedules `whop.setup`. Returns the existing raid unless it failed |
| `retry` | mutation | Clears steps in error and runs setup again |
| `watch` | mutation | Keeps payment polling on for 10 more minutes. The Base calls it while on screen |
| `mine` | query | The latest raid with its steps, stars, offer and 5 newest sales, plus the vault: real earnings, real sales and test sales |
| `recordPayment` | internal mutation | Records one payment from the webhook or the poll. The payment id dedupes both paths. Updates sales, net and stars |
| `setStep` | internal mutation | Marks a setup step. When all three are done the raid goes `live` and polling starts |
| `forSetup`, `saveOffer`, `pollNext` | internal | Helpers for `whop.ts` |

Goal and stars: `GOAL_CENTS` is 2500. `starsFor()` lights star 1 at half the goal, star 2 at the first sale, star 3 at the goal. Test sales count toward the raid, never toward the vault's real earnings.

### whop.ts

| Function | Kind | What it does |
|---|---|---|
| `setup` | internal action | Creates the product (`POST /products`), the $9 one-time checkout (`POST /checkout_configurations`), and a `payment.succeeded` webhook (`POST /webhooks`) when `PUBLIC_SITE_URL` is set. The product and checkout requests carry idempotency keys. Refuses to run unless Whop is in sandbox |
| `poll` | internal action | Reads up to 10 pages of `GET /payments` for the product and records each paid one. Reschedules itself every 4 seconds while the raid is watched |
| `verifyWebhook` | helper | Checks the Standard Webhooks signature and a 5 minute timestamp window |
| `fromPayment` | helper | Pulls the payment id, product, checkout and amounts out of a Whop payment |
| `kvGet`, `kvSet`, `webhookSecret` | internal | Store and read the webhook URL and signing secret |

Whop calls are logged with a summary chosen per call, so the signing secret never reaches the `calls` table.

### http.ts

Two routes. `POST /whop/webhook` verifies the signature, parses the body, and passes `payment.succeeded` events to `raids.recordPayment`. A bad signature gets 401. `GET /whop/oauth/callback` is `whopAuth.callback`.

### whopAuth.ts

One demo Whop login (Charlie's) that every user's Whop Bounty submissions go out as. Tokens live only in the single `whopAuth` row; no public function, log or `calls` row carries one.

| Function | Kind | What it does |
|---|---|---|
| `importDemoToken` | internal mutation | Builder-only, run once. Imports a demo token minted outside Convex (`accessToken`, `refreshToken`, `expiresAt` in epoch ms or s, `scope`). From then on only Convex refreshes it. Returns no token |
| `authorizeUrl` | internal action | Builder-only recovery when the login is gone. Stores a one-time `state` with an OIDC nonce and a PKCE verifier (15 minutes) and returns the `https://api.whop.com/oauth/authorize` link for scopes `openid profile bounty:basic:read bounty:submission:create` |
| `callback` | HTTP action | Takes the state once, exchanges the code at `/oauth/token` with the client secret and the verifier, checks the ID token's nonce, reads `/oauth/userinfo`, and replaces the stored login. Then runs `submit.poll` so waiting rows go out |
| `tokenFor` | internal action | The demo access token for any user. Refreshes it 5 minutes before expiry and stores the rotated refresh token; a lease keeps two refreshes from spending the same refresh token. `invalid_grant` drops the login (mint a new link); other failures throw and keep it |
| `status` | query | `{connected, username}` of the demo login, never a token |

### submit.ts

| Function | Kind | What it does |
|---|---|---|
| `forPost` | internal action | Scheduled by `post.settle` when a public post on a bounty video goes live. Content Rewards: one `manual` row. Whop Bounty: a `pending` row, then `POST /api/v1/bounty_submissions {bounty_id, deliverable: {urls: [post url]}}` with the demo token and the post id as `Idempotency-Key` |
| `poll` | internal action | Cron, every 10 minutes. Retries `pending` Whop Bounty rows, then reads `GET /bounty_submissions?bounty_id=` once per bounty and settles `approved` or `denied` (with `denialReason`) |
| `forVideo` | query | Status, the "Submit on Whop" link, `auto` (Whop Bounty) and `note` (why an auto row waits or fell back) |
| `markSubmitted` | mutation | The user confirms a `manual` row was submitted by hand |
| `retry` | internal mutation | Builder-only. Sends a `manual` or `failed` Whop Bounty row back to `pending` |

A Whop Bounty row with no demo login, or whose call failed with a network error, 401, 408, 429 or 5xx, stays `pending` with a short `error` the You tab shows, and the next poll retries it. Any other refusal (for example one open submission per Whop account) turns it `manual` with Whop's message, so the user can still submit by hand. dryRun and private posts never create a row and never reach Whop.

`bounties.addWhopBounty` (internal mutation) puts one real `bnty_` bounty on the board with `source: whop_bounty` and a flat `rewardCents` per accepted submission, upserting by its id. For an original-mode bounty it also tops the library up to `videos` (default 3, 0 to 5) queued library videos (a clip bounty queues none until the studio's clip mode lands), ranked after the library already queued and before every user's videos, so the laptop studio renders them next; Take and `bounties.sync` clone them into Feeds like the seeded bounties' videos. They carry no per-video brief: the studio writes each from the bounty and its brief.

### you.ts

`summary` (query) feeds the You tab, the Feed's streak line and the widget. It returns the streak, the streak on each of the next few days if nothing more is approved, freezes left, whether today is kept, a 5-week calendar, totals, the top 8 live videos with per-platform views, and the platforms still waiting on a first count. The phone passes its local date as `phoneDay` only so the query reruns at midnight.

A day counts toward the streak when at least one video was approved that day. `streakOf()` in `lib.ts` walks back from today. A missed day uses one of the user's freezes, and each streak gets its own allowance.

### away.ts

| Function | Kind | What it does |
|---|---|---|
| `summary` | query | Videos made, posts gone live, views gained and sales since the last Collect |
| `collect` | mutation | Saves the time and view total the card showed, so the next card starts from there |

### hood.ts

`calls` (query) feeds the Under the hood screen: one row per service with its role, last call and whether its key is missing, the 60 newest calls, the 20 newest taste notes with their sync state, and the Supermemory cache.

### generate.ts

Staged on-stage generation over the pregenerated library. Each generation row is one user and one library video.

| Function | Kind | What it does |
|---|---|---|
| `suggestions` | query | Up to 6 prompts (`{id, prompt, hook, brand}`), one per ready library video of an open bounty the user has neither in the Feed nor generated, one per bounty first |
| `start({deviceId, suggestionId, prompt?})` | mutation | Records a generation and schedules `finish` after `TOTAL_MS` (the sum of `STAGES`, 12 s). Idempotent per user and library video |
| `finish` | internal mutation | Clones that one library video to the front of the Feed with `bounties.cloneInto` (same storage file, `pregenerated`, `sourceVideoId`) and marks the row done |
| `list` | query | The stage timeline, the user's 20 newest generations with their clone's status, and their queued and making videos with the worker's `stage` |

### admin.ts

Builder-only switches. Run them with `npx convex run admin:<name> '<json args>'` or from the dashboard.

| Function | What it does |
|---|---|
| `users` | Lists users with id, mode, pace and pause state |
| `setMode` | Sets `postingMode` to `dryRun`, `private`, `public` or `demo` |
| `setPace` | Sets posts per day per platform, 1 to 24, and reslots held posts |
| `setPaused` | Pauses or resumes sending. Resume reslots held posts |
| `linkZernio` | Reads the Zernio-connected YouTube and Instagram accounts and saves them as the user's `connections` |
| `requeueFailed` | Puts every `failed` and `making` video back in the queue |
| `requeueReady` | Deletes a user's unwatched videos and remakes them in the current studio format |
| `requeueVideos` | The same for chosen unwatched videos, by id. Each keeps its place in the queue and the Feed |
| `demoPrep` | Demo prep. Clones chosen library videos to the front of a user's Feed in the given order (`videoIds`), labeled pregenerated. `bountyIds` also clones those bounties' other library videos behind them, so a Take on stage adds nothing in front. Idempotent; refuses a video the user already swiped |
| `seedDemo` | Staged demo. Puts a seeded demo user (`demo: true`, mode `demo`, account baseline 2,400 views) on a device: a Hit and a Miss posted from two library videos, seven skipped clips, score 59. A real user on that device is parked as `parked:<deviceId>`. Running it again resets the demo user |
| `unseedDemo` | Moves the demo user to `demo:<deviceId>` and brings the parked user back |
| `wipeVideos` | Development reset. Deletes all videos, swipes, posts, notes, taste and day counts, then refills |
| `rebuildDays` | Rebuilds the daily counts from swipes and finished videos |

Example:

```sh
npx convex run admin:users
npx convex run admin:setMode '{"userId": "<id>", "mode": "private"}'
npx convex run admin:linkZernio '{"userId": "<id>"}'
```

### lib.ts

Shared helpers: `userFor`, `ownVideo`, `requireWorker`, `livePosts`, `refill` (keeps `BUFFER` = 10 videos), `bumpDay`, `dayOf`, `shiftDay`, `streakOf`, `logCall`.

## Crons

From `convex/crons.ts`:

| Name | Every | Runs |
|---|---|---|
| `studio sweep` | 1 minute | `studio.sweep` |
| `read views` | 20 minutes | `views.sync` |
| `sync bounties` | 15 minutes | `bounties.sync` |
| `poll submissions` | 10 minutes | `submit.poll` |

## Scheduled jobs

Everything else is scheduled by the code that needs it:

| Job | Scheduled by | When |
|---|---|---|
| `post.publish` | `pace.place` | At the post's slot |
| `post.publish` (retry) | `post.retry` | 15 seconds after a retryable error |
| `post.check` | `post.publish`, itself | 15 s, then 1 min, then 30 min apart |
| `pace.reslot` | `admin.setPace`, `admin.setPaused` | At once |
| `memory.syncNote` | `feed.swipe`, `memory.syncPending` | At once |
| `memory.refresh` | `memory.kick`, itself | Every 20 seconds, up to 15 times |
| `scout.search` | `scoutIfLow` | At once |
| `whop.setup` | `raids.start`, `raids.retry` | At once |
| `whop.poll` | `raids.setStep`, `raids.watch`, `raids.pollNext` | Every 4 seconds while the raid is watched |
| `views.sync` (next batch) | `views.sync` | 1 minute later, while posts remain |
| `generate.finish` | `generate.start` | 12 s later, when the staged steps end |

## Typecheck

CI (`.github/workflows/typecheck.yml`) runs on pull requests that touch `outpost/`. It type-checks the app with `npx tsc --noEmit`, the Convex functions with `npx tsc --noEmit -p convex`, and checks the worker's syntax with `node --check studio/worker.mjs`.

`npm test` runs the convex-test suite in `tests/` (Whop OAuth, refresh rotation, auto-submit and poll, posting modes) against a mocked `fetch`. It never reaches Whop. CI doesn't run it yet.
