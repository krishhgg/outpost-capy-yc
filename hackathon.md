# Hackathon log

- **Project:** Outpost
- **Event:** YC Consumer Mobile Hackathon
- **What it does:** An iOS app where a laptop studio makes short videos for Whop brand bounties, you swipe to post them to YouTube and Instagram or send them back, and a taste score from view counts unlocks higher-paying bounties.
- **Live app:** not deployed
- **Repo:** https://github.com/krishhgg/outpost-capy-yc
- **Frontend:** not deployed
- **Convex deployment:** https://patient-flamingo-104.convex.cloud
- **Components:** none
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions, crons, scheduled functions, file storage, realtime queries
- **Auth:** none
- **AI models:** Claude `sonnet` through the `claude` CLI (overridable with `WRITER_MODEL`), Kokoro text to speech run locally
- **Started:** 2026-11-15T18:59:47Z
- **Last updated:** 2026-11-16T01:50:29Z

## Log

### 2026-11-15 - 4fd5747
Imported the whole app in one commit, so earlier build sessions are not in Git.
TODO (team): add the build history before this commit if you want it logged.
Shipped the Expo iOS app (Base, Feed and You tabs, plus the Under the hood call
log) on live Convex queries, and a Convex backend that runs the Feed, paced
posting through Zernio, the Whop Scout and sandbox shop raid, and Supermemory
taste notes. Convex features: schema with 15 tables and indexes, queries,
mutations, actions, scheduled functions, MP4 file storage, two crons, and a
signed `POST /whop/webhook` HTTP action (`outpost/convex/schema.ts`,
`outpost/convex/crons.ts`, `outpost/convex/http.ts`). A laptop studio worker
writes scripts with `claude -p`, voices them with Kokoro and renders them with
Compound (`outpost/studio/worker.mjs`).

### 2026-11-16 - 055cc68
The Bounties tab lists Whop campaigns. Take saves one on the user and copies its ready library videos into the Feed. A 15-minute cron syncs the list (`outpost/convex/bounties.ts`, `outpost/convex/crons.ts`). The studio writes a bounty brief and a forecast with `claude -p` (`outpost/studio/worker.mjs`). A public bounty post becomes a Whop submission through one demo OAuth login, and a 10-minute cron polls review status. Demo mode marks the post live and sends nothing (`outpost/convex/whopAuth.ts`, `outpost/convex/submit.ts`, `outpost/convex/post.ts`). Taste score gates Take. Curator opens at 40, Showrunner at 60, and Tastemaker at 80 (`outpost/convex/tiers.ts`). The schema adds bounties, userBounties, submissions, whopAuth, oauthStates, messages, generations and sources. The README adds the app screens, the sponsor map and the Supermemory graph (`README.md`). Convex features: schema, indexes, queries, mutations, actions, crons, HTTP actions, scheduled functions.
