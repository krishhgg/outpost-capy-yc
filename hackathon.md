# Hackathon log

- **Project:** Outpost
- **Event:** YC Consumer Mobile Hackathon
- **What it does:** An iOS app where AI agents run a small content business: a laptop studio writes, voices and renders short vertical videos, and you swipe to post them to YouTube and Instagram or send them back for a remake.
- **Live app:** not deployed
- **Repo:** https://github.com/krishhgg/outpost-capy-yc
- **Frontend:** not deployed
- **Convex deployment:** https://patient-flamingo-104.convex.cloud
- **Components:** none
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions, crons, scheduled functions, file storage, realtime queries
- **Auth:** none
- **AI models:** Claude `sonnet` through the `claude` CLI (overridable with `WRITER_MODEL`), Kokoro text to speech run locally
- **Started:** 2026-11-15T18:59:47Z
- **Last updated:** 2026-11-15T18:59:47Z

## Log

### 2026-11-15 - 4fd5747
Imported the whole app in one commit, so earlier build sessions are not in Git.
TODO (team): add the build history before this commit if you want it logged.
Shipped the Expo iOS app (Base, Feed and You tabs, plus the Under the hood call
log) on live Convex queries, and a Convex backend that runs the Feed, paced
posting through Zernio, the Whop Scout and sandbox shop raid, and Supermemory
taste notes. Convex features: schema with 16 tables and indexes, queries,
mutations, actions, scheduled functions, MP4 file storage, two crons, and a
signed `POST /whop/webhook` HTTP action (`outpost/convex/schema.ts`,
`outpost/convex/crons.ts`, `outpost/convex/http.ts`). A laptop studio worker
writes scripts with `claude -p`, voices them with Kokoro and renders them with
Compound (`outpost/studio/worker.mjs`).
