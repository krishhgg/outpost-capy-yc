# Contracts

The shared shapes every Wave 2 thread codes against: tables, function signatures, HTTP routes, crons, `calls`
service keys and env vars. T1 landed the schema and no-op stubs; each owner fills in its own file. The plan and
file ownership are in [BUILD_PLAN.md](../../BUILD_PLAN.md).

Rules:

- Keep every name, argument and return field here. An owner may add return fields; removing or renaming one, or
  any schema change, goes through the Captain as a small dedicated PR.
- v1 uses demo accounts. Nobody signs in or connects an account in the app. Every user posts to Outpost's demo
  Instagram and YouTube through Zernio and submits from the one demo Whop account.
- Tokens stay server-side: never in a public function's result, a `calls` row or a log line.

## Schema (`convex/schema.ts`)

`platform` is now `"youtube" | "instagram" | "tiktok"`. `PLATFORMS` in `lib.ts` stays `["youtube", "instagram"]`,
so nothing posts to TikTok. `livePosts()` and `feed.status` narrow their rows to `PLATFORMS`, and `pace.reslot`
keeps a slot list for `tiktok`, so the wider union typechecks without app changes.

New optional fields on existing tables:

| Table | Field | Type |
|---|---|---|
| `users` | `phone` | `string` |
| | `tasteScore` | `number` |
| | `baselineViews` | `number` |
| `videos` | `bountyId` | `Id<"bounties">` |
| | `mode` | `"original" \| "clip"` |
| | `clip` | `{ sourceUrl: string, startS: number, endS: number, hook: string, captionStyle: string }` |
| | `predicted` | `{ score: number, reason: string }`: the studio's 0-100 forecast against the bounty brief |

New tables (`?` marks optional fields):

| Table | Fields | Indexes |
|---|---|---|
| `bounties` | `source: "whop_bounty" \| "content_rewards"`, `externalId` (`bnty_...` or campaign id), `title`, `brand`, `description`, `goalType`, `mode: "original" \| "clip"`, `rewardKind: "per_submission" \| "per_view"`, `rewardCents?` (net, per accepted submission), `ratePer1kCents?`, `minViews?`, `maxPerClipCents?`, `budgetCents?`, `paidOutCents?`, `spotsRemaining?`, `rules`, `checklist?: any`, `sourceUrls: string[]`, `url`, `status: "open" \| "closed"`, `syncedAt`, `brief?: any` (the generation brief: the studio writes it with `claude -p`; seeded bounties carry a hand-written one) | `by_source_external` [`source`, `externalId`], `by_status` [`status`] |
| `userBounties` | `userId`, `bountyId`, `status: "active" \| "dropped"`, `takenAt` | `by_user` [`userId`], `by_user_bounty` [`userId`, `bountyId`] |
| `submissions` | `userId`, `bountyId`, `videoId`, `postId`, `url`, `externalId?` (`btys_...`), `status: "pending" \| "submitted" \| "approved" \| "denied" \| "manual" \| "failed"`, `denialReason?`, `error?`, `submittedAt?`, `resolvedAt?`, `checks` | `by_post` [`postId`], `by_status` [`status`], `by_user` [`userId`] |
| `whopAuth` | Server-only. `userId`, `whopUserId`, `username?`, `accessToken`, `refreshToken?`, `expiresAt`, `scopes: string[]` | `by_user` [`userId`], `by_whop_user` [`whopUserId`] |
| `oauthStates` | `state`, `userId`, `at` (kept as a seam for real accounts later) | `by_state` [`state`] |
| `messages` | `userId`, `direction: "out" \| "in"`, `kind`, `body`, `providerId?`, `at` | `by_user_at` [`userId`, `at`] |
| `sources` | `bountyId`, `url`, `kind: "youtube" \| "drive" \| "direct" \| "other"`, `status: "pending" \| "downloading" \| "ready" \| "blocked" \| "failed"`, `durationS?`, `width?`, `height?`, `localKey?` (the file on the laptop; never returned to the app), `error?`, `updatedAt` | `by_bounty` [`bountyId`], `by_status` [`status`] |

`bounties.brief` is `v.any()` so it can change shape without a schema PR. The laptop studio writes it with
`claude -p` (T6), `seedBounties` writes a hand-written one (T2), and `studio.claim` passes it to the worker.
Proposed shape:

```ts
{
  format: string;            // what to make
  angle: string;
  lengthS: { min: number; max: number };
  mode: "original" | "clip";
  mustMention: string[];
  hashtags: string[];
  cta: string | null;
  banned: string[];
  platforms: ("youtube" | "instagram" | "tiktok")[];
  sourceUrls: string[];      // footage links pulled from the description and rules
  checklist: string[];       // what the finished video must satisfy
}
```

## Functions

`deviceId` functions are public and resolve the user with `userFor()`. `internal` functions are server-only.

### `bounties.ts` (T2)

| Function | Kind | Args | Returns |
|---|---|---|---|
| `list` | query | `{ deviceId: string }` | `{ id: Id<"bounties">, title: string, brand: string, mode: "original" \| "clip", rewardLabel: string, budgetLabel: string \| null, spotsLabel: string \| null, taken: boolean, source: "whop_bounty" \| "content_rewards" }[]`: open bounties, taken first |
| `take` | mutation | `{ deviceId: string, bountyId: Id<"bounties"> }` | `null`. Upserts `userBounties` as active, refills with bounty videos, and for clip bounties schedules `internal.sources.enqueue` |
| `drop` | mutation | `{ deviceId: string, bountyId: Id<"bounties"> }` | `null`. Marks `userBounties` dropped |
| `sync` | internal action | `{}` | `null`. Cron, 15 min |

T2 also adds, with signatures of its choosing: `seedBounties` (each seeded bounty carries a hand-written `brief`)
and `setBountySources` (internal, in `bounties.ts`), and the bounty-aware branch of `refill` in `lib.ts`.

### `whopAuth.ts` (T3)

| Function | Kind | Args | Returns |
|---|---|---|---|
| `tokenFor` | internal query | `{ userId: Id<"users"> }` | `string \| null`: the demo Whop account's token for every user in v1 |
| `status` | query | `{ deviceId: string }` | `{ connected: boolean, username: string \| null }` for the demo account. Never the token |
| `callback` | HTTP action | `GET /whop/oauth/callback` | Builders use it once to mint the demo token. No in-app connect and no `startUrl` |

`tokenFor` is a query, so it can't call Whop. Refreshing the token happens in a T3 action, for example one that
reschedules itself with `ctx.scheduler`.

### `demo.ts` (T3)

| Function | Kind | Signature |
|---|---|---|
| `attachDemoAccounts` | helper | `attachDemoAccounts(ctx: MutationCtx, userId: Id<"users">): Promise<void>` |

`feed.ensureUser` calls it for every user on every call, before `refill`, so it must be idempotent. It gives the
user the demo `connections` rows read from `DEMO_CONNECTIONS`, replacing running `admin.linkZernio` by hand.

### `submit.ts` (T4)

| Function | Kind | Args | Returns |
|---|---|---|---|
| `forPost` | internal action | `{ postId: Id<"posts"> }` | `null`. Creates the submission, idempotent (`Idempotency-Key` = post id) |
| `poll` | internal action | `{}` | `null`. Cron, 10 min |
| `forVideo` | query | `{ deviceId: string, videoId: Id<"videos"> }` | `{ status: submissions status, deepLink: string, denialReason: string \| null } \| null` |

T4 adds one hook in `post.settle`: when a post goes `live` and its video has `bountyId`, schedule
`internal.submit.forPost({ postId })`. Only `public` posts submit.

### `earnings.ts` (T9)

| Function | Kind | Args | Returns |
|---|---|---|---|
| `summary` | query | `{ deviceId: string }` | `{ pendingCents: number, approvedCents: number, perVideo: { videoId, bountyId, brand: string, url: string \| null, views: number, estCents: number, status: submissions status \| null }[], tasteScore: number, tasteTrend: number, settledCount: number }` |

T9 adds the COORDINATOR 2.4 fields (tier, calibrating count, hit rate, approval rate, pickiness, verdicts) as new
return fields.

### `agent.ts` and `notify.ts` (T10)

| Function | Kind | Args | Returns |
|---|---|---|---|
| `agent.tick` | internal action | `{}` | `null`. Cron, 5 min |
| `agent.inbound` | HTTP action | `POST /kakai/webhook` | `200 ok` |
| `notify.send` | internal action | `{ userId: Id<"users">, kind: string, body: string }` | `null`. Kakai when its keys are set, else log-only. Writes `messages` and `calls` |

### `sources.ts` (T15)

| Function | Kind | Args | Returns |
|---|---|---|---|
| `list` | query | `{ deviceId: string, bountyId: Id<"bounties"> }` | The bounty's `sources` rows as `{ id, bountyId, url, kind, status, durationS?, width?, height?, error?, updatedAt }[]`, without `localKey` |
| `enqueue` | internal mutation | `{ bountyId: Id<"bounties"> }` | `null`. Creates a `pending` row for each of the bounty's `sourceUrls` that has none |

### Changes owners make to existing functions

| Function (owner) | Change |
|---|---|
| `studio.claim` (T6) | Return adds `bounty: { title, brand, mode, rules, checklist, sourceUrls, brief } \| null` and `clip` (the video's `clip`, for remakes) |
| `studio.finish` (T6) | Accepts an optional `predicted: { score, reason }` and saves it on the video |
| `studio.*` brief writer (T6) | A worker function that saves the studio's `claude -p` brief on `bounties.brief` for bounties that have none |
| `studio.*` source functions (T6, on T15's request) | Proposed: `sourcesQueue({ key })` query of pending sources with `localKey`, and `sourceUpdate({ key, sourceId, status, durationS?, width?, height?, localKey?, error? })` mutation. The worker only calls `studio.ts` |
| `feed.next` (T8) | Each card adds `bounty: { brand, rewardLabel } \| null` and `predicted: { score, reason } \| null` |
| `refill` in `lib.ts` (T2) | Optional bounty-aware branch that sets `bountyId` and `mode` on queued videos |

## Queue order

`refill` ranks a user's new queued videos at `Date.now() + i`. Users whose `deviceId` starts with `revyl-proof-`
(Revyl's test devices) get `+ 1e12` on top, so the studio, which claims the lowest rank first, renders every real
user's videos before theirs. Remakes still jump the queue for everyone, as before.

## HTTP routes (`convex/http.ts`)

| Method | Path | Handler |
|---|---|---|
| `POST` | `/whop/webhook` | Existing: shop raid payments |
| `GET` | `/whop/oauth/callback` | `whopAuth.callback` |
| `POST` | `/kakai/webhook` | `agent.inbound` |

## Crons (`convex/crons.ts`)

| Name | Every | Function |
|---|---|---|
| `studio sweep` | 1 min | `internal.studio.sweep` (existing) |
| `read views` | 20 min | `internal.views.sync` (existing) |
| `sync bounties` | 15 min | `internal.bounties.sync` |
| `poll submissions` | 10 min | `internal.submit.poll` |
| `agent tick` | 5 min | `internal.agent.tick` |

## `calls` service keys

Log every outside call to `calls` with these `service` values; the Under the hood screen groups by them.

| Key | Service | Logged by | Hood shows "waiting on its key" without |
|---|---|---|---|
| `bounties` | Whop Bounties API | T2, T4 | `WHOP_CLIENT_ID` |
| `kakai` | Kakai iMessage | T10 | `KAKAI_API_KEY` |

Existing keys: `claude`, `kokoro`, `compound`, `convex`, `zernio`, `whop` (shop raid), `supermemory`.

## Env vars (Convex, server-only)

New:

| Variable | Used by | What |
|---|---|---|
| `DEMO_CONNECTIONS` | T3 `demo.ts` | JSON array of `{ platform, accountId, handle }`: the demo Instagram and YouTube accounts in Zernio |
| `WHOP_CLIENT_ID`, `WHOP_CLIENT_SECRET` | T3 | Whop OAuth app, to mint and refresh the demo token |
| `WHOP_OAUTH_REDIRECT` | T3 | `<PUBLIC_SITE_URL>/whop/oauth/callback` |
| `WHOP_BOUNTY_ENV` | T2, T4 | `sandbox` (default) or `production`. Only builders change it |
| `KAKAI_API_KEY`, `KAKAI_FROM` | T10 | iMessage |

Existing: `WORKER_SECRET`, `MAX_USERS`, `ZERNIO_API_KEY`, `WHOP_API_KEY`, `WHOP_ENV`, `WHOP_WEBHOOK_SECRET`,
`PUBLIC_SITE_URL`, `SUPERMEMORY_API_KEY` (see [backend.md](backend.md)). There is no `ANTHROPIC_API_KEY`: LLM work,
generation briefs included, runs in the studio with `claude -p`. The app reads only
`EXPO_PUBLIC_CONVEX_URL`, plus `EXPO_PUBLIC_DEVICE_ID` in Revyl builds.
