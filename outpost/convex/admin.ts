import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { brief, platform, postingMode } from "./schema";
import { DAY_MS, bumpDay, dayOf, refill } from "./lib";
import { cloneInto, libraryVideos } from "./bounties";
import { tasteScoreOf } from "./earnings";

// Builder-only switches. Run them from the dashboard or `npx convex run admin:<name>`.
// No phone call can reach these, so no phone can turn on public posting.

export const users = internalQuery({
  args: {},
  handler: async (ctx) => (await ctx.db.query("users").take(50)).map(u => ({
    id: u._id, mode: u.postingMode, pacePerDay: u.pacePerDay, paused: u.drainPaused, createdAt: new Date(u.createdAt).toISOString(),
  })),
});

export const setMode = internalMutation({
  args: { userId: v.id("users"), mode: postingMode },
  handler: async (ctx, { userId, mode }) => ctx.db.patch(userId, { postingMode: mode }),
});

export const setPace = internalMutation({
  args: { userId: v.id("users"), perDay: v.number() },
  handler: async (ctx, { userId, perDay }) => {
    await ctx.db.patch(userId, { pacePerDay: Math.max(1, Math.min(Math.round(perDay), 24)) });
    await ctx.scheduler.runAfter(0, internal.pace.reslot, { userId });
  },
});

export const setPaused = internalMutation({
  args: { userId: v.id("users"), paused: v.boolean() },
  handler: async (ctx, { userId, paused }) => {
    await ctx.db.patch(userId, { drainPaused: paused });
    if (!paused) await ctx.scheduler.runAfter(0, internal.pace.reslot, { userId });
  },
});

export const saveConnections = internalMutation({
  args: { userId: v.id("users"), accounts: v.array(v.object({ platform, accountId: v.string(), handle: v.string() })) },
  handler: async (ctx, { userId, accounts }) => {
    for (const c of await ctx.db.query("connections").withIndex("by_user", q => q.eq("userId", userId)).collect()) await ctx.db.delete(c._id);
    for (const a of accounts) await ctx.db.insert("connections", { userId, ...a });
    return accounts;
  },
});

// Copies the Zernio-connected YouTube and Instagram accounts onto one user.
export const linkZernio = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }): Promise<unknown> => {
    const key = process.env.ZERNIO_API_KEY;
    if (!key) throw new Error("ZERNIO_API_KEY not set");
    const t0 = Date.now();
    const r = await fetch("https://zernio.com/api/v1/accounts", { headers: { Authorization: `Bearer ${key}` } });
    const json: any = await r.json().catch(() => null);
    await ctx.runMutation(internal.post.call, {
      userId, service: "zernio", op: "list accounts", status: r.ok ? "ok" : "error", ms: Date.now() - t0,
      detail: `GET /accounts -> ${r.status} ${JSON.stringify(json)?.slice(0, 200)}`,
    });
    if (!r.ok) throw new Error(`Zernio ${r.status}`);
    const accounts = (json?.accounts ?? [])
      .filter((a: any) => a.platform === "youtube" || a.platform === "instagram")
      .filter((a: any) => a.isActive !== false && a.status !== "disconnected")
      .map((a: any) => ({ platform: a.platform, accountId: String(a._id ?? a.id), handle: String(a.username ?? a.displayName ?? a.name ?? "") }));
    return ctx.runMutation(internal.admin.saveConnections, { userId, accounts });
  },
});

export const requeueFailed = internalMutation({
  args: {},
  handler: async (ctx) => {
    let n = 0;
    for (const s of ["failed", "making"] as const) {
      for (const r of await ctx.db.query("videos").withIndex("by_status", q => q.eq("status", s)).take(100)) {
        await ctx.db.patch(r._id, { status: "queued", attempts: 0, stage: undefined, error: undefined });
        n++;
      }
    }
    return n;
  },
});

// Remakes a user's unwatched videos in the current studio format. Each keeps its place, its remake reason and its
// Scout find; only the made video goes.
export const requeueReady = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const rows = await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", userId).eq("status", "ready")).take(50);
    for (const r of rows) await remakeInPlace(ctx, r);
    return rows.length;
  },
});

// The same for chosen unwatched videos, such as ones that failed a check. A briefed video is written again from its brief.
export const requeueVideos = internalMutation({
  args: { videoIds: v.array(v.id("videos")) },
  handler: async (ctx, { videoIds }) => {
    let n = 0;
    for (const id of videoIds) {
      const r = await ctx.db.get(id);
      if (r?.status === "ready") { await remakeInPlace(ctx, r); n++; }
    }
    return n;
  },
});

async function remakeInPlace(ctx: MutationCtx, r: Doc<"videos">) {
  // A demo library video's file is shared with its clones, so only a video's own file is deleted.
  if (r.storageId && !r.pregenerated && !r.sourceVideoId) await ctx.storage.delete(r.storageId);
  await ctx.db.patch(r._id, {
    status: "queued", attempts: 0, script: undefined, storageId: undefined, durationS: undefined, timings: undefined,
    voice: undefined, palette: undefined, model: undefined, readyAt: undefined, stage: undefined, error: undefined,
  });
}

// Queues one video per brief, ahead of the user's other videos in the studio queue and the Feed.
export const queueBriefs = internalMutation({
  args: { userId: v.id("users"), briefs: v.array(brief) },
  handler: async (ctx, { userId, briefs }) => {
    // Rank the batch ahead of everything still active, so the studio makes it first and the Feed shows it first.
    let low = Date.now();
    for (const status of ["queued", "making", "ready"] as const) {
      const first = await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", userId).eq("status", status)).first();
      if (first) low = Math.min(low, first.rank);
    }
    const now = Date.now(), top = low - briefs.length - 1;
    for (const [i, b] of briefs.entries()) {
      await ctx.db.insert("videos", { userId, status: "queued", rank: top + i, attempts: 0, createdAt: now, brief: b });
    }
    return briefs.length;
  },
});

// Demo prep: puts chosen library videos at the front of a user's Feed in the given order, as labeled pregenerated clones.
// bountyIds also clones the rest of those bounties' library videos behind them, so a Take on stage adds nothing in front.
export const demoPrep = internalMutation({
  args: { userId: v.id("users"), videoIds: v.array(v.id("videos")), bountyIds: v.optional(v.array(v.id("bounties"))) },
  handler: async (ctx, { userId, videoIds, bountyIds = [] }) => {
    const picked: Doc<"videos">[] = [];
    for (const id of videoIds) {
      const video = await ctx.db.get(id);
      if (!video?.pregenerated || video.sourceVideoId || video.status !== "ready") throw new Error(`${id} is not a ready library video`);
      picked.push(video);
    }
    const rest = (await libraryVideos(ctx)).filter(v => v.bountyId && bountyIds.includes(v.bountyId) && !videoIds.includes(v._id));
    await cloneInto(ctx, userId, [...picked, ...rest]);
    const ready = await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", userId).eq("status", "ready")).collect();
    const front = Math.min(Date.now(), ...ready.map(v => v.rank));
    for (const [i, source] of picked.entries()) {
      const clone = ready.find(v => v.sourceVideoId === source._id);
      if (!clone) throw new Error(`${source._id} was already swiped by this user`);
      await ctx.db.patch(clone._id, { rank: front - picked.length + i });
    }
    return picked.length;
  },
});

// The staged demo's history, all marked demo. Graded against an account baseline of 2,400 views, the Hit (5,200) and the
// Miss (900) leave the score at 59, Curator, still calibrating. Seven skipped clips put approvals at 2 of 9, so on stage
// one rejection then one approval moves pickiness to 3 of 11 and the score to 61, Showrunner. A 2,400 baseline also
// clears every bounty's 1,000-view minimum (relay.fast's is 2,000), so an approval forecasts a readable amount.
const DEMO = {
  baselineViews: 2400,
  hit: { daysAgo: 2.5, views: { youtube: 1300, instagram: 3900 } },
  miss: { daysAgo: 3.5, views: { youtube: 260, instagram: 640 } },
  skipped: 7,
};

// Seeds the staged demo user on a device. A real user already on that device is parked under "parked:<deviceId>" with
// every row it has, and comes back with unseedDemo. Running it again on a demo user resets it, so the demo can be
// rehearsed and reseeded. hitVideoId and missVideoId are library videos to show as the posted Hit and Miss.
export const seedDemo = internalMutation({
  args: { deviceId: v.string(), hitVideoId: v.id("videos"), missVideoId: v.id("videos") },
  handler: async (ctx, { deviceId, hitVideoId, missVideoId }) => {
    const now = Date.now();
    const existing = await ctx.db.query("users").withIndex("by_device", q => q.eq("deviceId", deviceId)).unique();
    if (existing && !existing.demo) await ctx.db.patch(existing._id, { deviceId: `parked:${deviceId}` });
    const fields = {
      deviceId, demo: true, postingMode: "demo" as const, baselineViews: DEMO.baselineViews, pacePerDay: 12, drainPaused: false,
      niche: "short videos for paid brand campaigns", tz: existing?.tz ?? "America/Los_Angeles", freezesLeft: 2, createdAt: now - 7 * DAY_MS,
      // No Scout search, so no Scout card lands between the demo's clips.
      scoutAt: now,
    };
    let userId = existing?.demo ? existing._id : null;
    if (userId) {
      await clearHistory(ctx, userId);
      await ctx.db.patch(userId, { ...fields, seen: undefined, tasteScore: undefined });
    } else {
      userId = await ctx.db.insert("users", fields);
    }

    let totalViews = 0;
    for (const [id, seed] of [[missVideoId, DEMO.miss], [hitVideoId, DEMO.hit]] as const) {
      const lib = await ctx.db.get(id);
      if (!lib?.pregenerated || lib.sourceVideoId || lib.status !== "ready" || !lib.bountyId) throw new Error(`${id} is not a ready library video`);
      const at = now - seed.daysAgo * DAY_MS;
      const videoId = await ctx.db.insert("videos", {
        userId, status: "right", rank: at, attempts: 0, createdAt: at, readyAt: at, bountyId: lib.bountyId, mode: lib.mode,
        script: lib.script, storageId: lib.storageId, durationS: lib.durationS, predicted: lib.predicted,
        pregenerated: true, sourceVideoId: lib._id, demo: true,
      });
      await swipe(ctx, userId, videoId, "right", at, fields.tz);
      await ctx.db.insert("userBounties", { userId, bountyId: lib.bountyId, status: "active", takenAt: at });
      for (const platform of ["youtube", "instagram"] as const) {
        const views = seed.views[platform];
        totalViews += views;
        const postId = await ctx.db.insert("posts", {
          userId, videoId, platform, status: "live", mode: "demo", views, viewsAt: now, slotAt: at, liveAt: at, checks: 0, demo: true,
        });
        await ctx.db.insert("submissions", {
          userId, bountyId: lib.bountyId, videoId, postId, url: "", status: "submitted", submittedAt: at, checks: 0, demo: true,
        });
      }
    }
    for (let i = 0; i < DEMO.skipped; i++) {
      const at = now - (4 - i / DEMO.skipped) * DAY_MS;
      const videoId = await ctx.db.insert("videos", { userId, status: "left", rank: at, attempts: 0, createdAt: at, demo: true });
      await swipe(ctx, userId, videoId, "left", at, fields.tz);
    }

    const user = (await ctx.db.get(userId))!;
    const score = await tasteScoreOf(ctx, user);
    // The score the user "last saw", and no Away card until something new happens.
    await ctx.db.patch(userId, { tasteScore: score ?? undefined, seen: { at: now, views: totalViews } });
    return { userId, parked: existing && !existing.demo ? existing._id : null, score };
  },
});

async function swipe(ctx: MutationCtx, userId: Id<"users">, videoId: Id<"videos">, dir: "right" | "left", at: number, tz: string) {
  const day = dayOf(at, tz);
  await ctx.db.insert("swipes", { userId, videoId, dir, dwellMs: 4000, day, at, demo: true });
  await bumpDay(ctx, userId, day, dir === "right" ? "approved" : "skipped");
}

// Deletes a demo user's videos, swipes, posts, submissions, taken bounties, daily counts, notes and generations. Clones
// share their library video's file, so only a demo user's own studio files are deleted.
async function clearHistory(ctx: MutationCtx, userId: Id<"users">) {
  for (const r of await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", userId)).collect()) {
    if (r.storageId && !r.pregenerated && !r.sourceVideoId) await ctx.storage.delete(r.storageId);
    await ctx.db.delete(r._id);
  }
  const byUser = [
    ctx.db.query("swipes").withIndex("by_user_day", q => q.eq("userId", userId)),
    ctx.db.query("days").withIndex("by_user_day", q => q.eq("userId", userId)),
    ctx.db.query("submissions").withIndex("by_user", q => q.eq("userId", userId)),
    ctx.db.query("userBounties").withIndex("by_user", q => q.eq("userId", userId)),
    ctx.db.query("tasteNotes").withIndex("by_user", q => q.eq("userId", userId)),
    ctx.db.query("generations").withIndex("by_user", q => q.eq("userId", userId)),
    ...(["youtube", "instagram", "tiktok"] as const).map(p => ctx.db.query("posts").withIndex("by_user_platform_slot", q => q.eq("userId", userId).eq("platform", p))),
  ];
  for (const q of byUser) for (const r of await q.collect()) await ctx.db.delete(r._id);
}

// Undoes seedDemo on a device: the demo user moves to "demo:<deviceId>" and the parked real user comes back.
export const unseedDemo = internalMutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const byDevice = (id: string) => ctx.db.query("users").withIndex("by_device", q => q.eq("deviceId", id)).unique();
    const demo = await byDevice(deviceId);
    const parked = await byDevice(`parked:${deviceId}`);
    if (!demo?.demo || !parked) throw new Error("no seeded demo user with a parked user on this device");
    await ctx.db.patch(demo._id, { deviceId: `demo:${deviceId}` });
    await ctx.db.patch(parked._id, { deviceId });
    return parked._id;
  },
});

// Frees storage on a dry-run test account: deletes its unwatched videos and their files, without refilling.
// For checking renders: the newest ready videos of a user with a link to each file.
export const readyUrls = internalQuery({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit }) => {
    const rows = await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", userId).eq("status", "ready")).take(limit ?? 120);
    return Promise.all(rows.map(async r => ({
      id: r._id, rank: r.rank, hook: r.script?.hook ?? "", durationS: r.durationS ?? 0, brief: r.brief?.format ?? null,
      url: r.storageId ? await ctx.storage.getUrl(r.storageId) : null,
    })));
  },
});

export const dropReady = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (user?.postingMode !== "dryRun") throw new Error("only for dry-run accounts");
    const rows = await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", userId).eq("status", "ready")).take(100);
    for (const r of rows) {
      if (r.storageId && !r.pregenerated && !r.sourceVideoId) await ctx.storage.delete(r.storageId);
      await ctx.db.delete(r._id);
    }
    return rows.length;
  },
});

// Development reset: deletes every video, swipe, post and stored file, then refills each user.
export const wipeVideos = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const t of ["videos", "swipes", "posts", "tasteNotes", "taste", "days"] as const) {
      for (const r of await ctx.db.query(t).take(1000)) {
        if (t === "videos" && (r as any).storageId) await ctx.storage.delete((r as any).storageId);
        await ctx.db.delete(r._id);
      }
    }
    for (const u of await ctx.db.query("users").take(50)) await refill(ctx, u._id);
  },
});

// Rebuild the daily counts from swipes and finished videos, for data made before the counts existed.
export const rebuildDays = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const u of await ctx.db.query("users").take(50)) {
      // Clear only the users rebuilt here, so a user past the first 50 keeps their counts.
      for (const r of await ctx.db.query("days").withIndex("by_user_day", q => q.eq("userId", u._id)).collect()) await ctx.db.delete(r._id);
      for (const s of await ctx.db.query("swipes").withIndex("by_user_day", q => q.eq("userId", u._id)).collect()) {
        await bumpDay(ctx, u._id, s.day, s.dir === "right" ? "approved" : s.reason ? "remakes" : "skipped");
      }
      for (const status of ["ready", "right", "left"] as const) {
        for (const vid of await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", u._id).eq("status", status)).collect()) {
          if (vid.readyAt) await bumpDay(ctx, u._id, dayOf(vid.readyAt, u.tz), "made");
        }
      }
    }
  },
});
