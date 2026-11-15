import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { script } from "./schema";
import { bumpDay, dayOf, logCall, refill, requireWorker } from "./lib";

// The laptop studio's API. Every call carries WORKER_SECRET.

export const queue = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    requireWorker(key);
    // The lowest ranks (a queued batch of briefs leads), plus every waiting remake however deep the batch is.
    const low = await ctx.db.query("videos").withIndex("by_status_rank", q => q.eq("status", "queued")).take(100);
    const remakes = await ctx.db.query("videos").withIndex("by_status_parent", q => q.eq("status", "queued").gt("parentId", "" as Id<"videos">)).take(20);
    const rows = [...new Map([...remakes, ...low].map(r => [r._id, r])).values()];
    // Remakes first, so a left swipe comes back within a few cards.
    rows.sort((a, b) => Number(!!b.parentId) - Number(!!a.parentId) || a.rank - b.rank);
    return rows.slice(0, 12).map(r => ({ id: r._id, remake: !!r.parentId }));
  },
});

export const claim = mutation({
  args: { key: v.string(), videoId: v.id("videos") },
  handler: async (ctx, { key, videoId }) => {
    requireWorker(key);
    const video = await ctx.db.get(videoId);
    if (!video || video.status !== "queued") return null;
    await ctx.db.patch(videoId, { status: "making", stage: "writing script", claimedAt: Date.now() });
    const user = (await ctx.db.get(video.userId))!;
    const parent = video.parentId ? await ctx.db.get(video.parentId) : null;
    // A remake keeps its parent's brief, stored on it so a remake of the remake keeps it too.
    const brief = video.brief ?? parent?.brief;
    if (brief && !video.brief) await ctx.db.patch(videoId, { brief });
    const find = video.findId ? await ctx.db.get(video.findId) : null;
    const notes = (await ctx.db.query("tasteNotes").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(20))
      .filter(n => !n.deleted).slice(0, 5).map(n => n.text);
    const taste = await ctx.db.query("taste").withIndex("by_user", q => q.eq("userId", user._id)).unique();
    const recent = await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", user._id).eq("status", "ready")).take(20);
    const shipped = await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", user._id).eq("status", "right")).order("desc").take(10);
    return {
      userId: user._id,
      niche: user.niche,
      notes,
      learned: taste?.learned.slice(0, 6) ?? [],
      recentHooks: [...recent, ...shipped].map(r => r.script?.hook).filter(Boolean) as string[],
      find: find ? { title: find.title, headline: find.headline } : null,
      brief: brief ?? null,
      remake: parent?.script ? {
        reason: video.remakeReason!, note: video.remakeNote ?? null, script: parent.script,
        voice: parent.voice ?? null, palette: parent.palette ?? null, durationS: parent.durationS ?? null,
      } : null,
    };
  },
});

export const stage = mutation({
  args: { key: v.string(), videoId: v.id("videos"), stage: v.string() },
  handler: async (ctx, { key, videoId, stage }) => {
    requireWorker(key);
    const video = await ctx.db.get(videoId);
    // Each stage renews the claim, so the sweep only takes back jobs the laptop has gone quiet on.
    if (video?.status === "making") await ctx.db.patch(videoId, { stage, claimedAt: Date.now() });
  },
});

export const uploadUrl = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    requireWorker(key);
    return ctx.storage.generateUploadUrl();
  },
});

export const finish = mutation({
  args: {
    key: v.string(),
    videoId: v.id("videos"),
    ok: v.optional(v.object({
      storageId: v.id("_storage"), script, voice: v.string(), palette: v.number(), model: v.string(), durationS: v.number(),
      timings: v.object({ writeMs: v.number(), voiceMs: v.number(), renderMs: v.number(), uploadMs: v.number() }),
    })),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { key, videoId, ok, error }) => {
    requireWorker(key);
    const video = await ctx.db.get(videoId);
    if (!video || video.status !== "making") {
      if (ok) await ctx.storage.delete(ok.storageId);
      return;
    }
    if (ok) {
      await ctx.db.patch(videoId, { ...ok, status: "ready", stage: undefined, readyAt: Date.now(), error: undefined });
      const user = await ctx.db.get(video.userId);
      if (user) await bumpDay(ctx, user._id, dayOf(Date.now(), user.tz), "made");
      // The rejected parent's file isn't needed once its remake is ready.
      const parent = video.parentId ? await ctx.db.get(video.parentId) : null;
      if (parent?.status === "left" && parent.storageId) {
        await ctx.storage.delete(parent.storageId);
        await ctx.db.patch(parent._id, { storageId: undefined });
      }
      return;
    }
    const attempts = video.attempts + 1;
    await ctx.db.patch(videoId, { status: attempts < 2 ? "queued" : "failed", stage: undefined, attempts, error: error?.slice(0, 300) });
    if (attempts >= 2) await refill(ctx, video.userId);
  },
});

export const beat = mutation({
  args: { key: v.string(), current: v.optional(v.string()) },
  handler: async (ctx, { key, current }) => {
    requireWorker(key);
    const w = await ctx.db.query("workers").withIndex("by_name", q => q.eq("name", "laptop")).unique();
    if (w) await ctx.db.patch(w._id, { lastSeen: Date.now(), current });
    else await ctx.db.insert("workers", { name: "laptop", lastSeen: Date.now(), current });
  },
});

export const log = mutation({
  args: {
    key: v.string(),
    userId: v.optional(v.id("users")), videoId: v.optional(v.id("videos")),
    service: v.string(), op: v.string(),
    status: v.union(v.literal("ok"), v.literal("error"), v.literal("skipped")),
    ms: v.number(), detail: v.optional(v.string()),
  },
  handler: async (ctx, { key, ...row }) => {
    requireWorker(key);
    await logCall(ctx, row);
  },
});

export const recentCalls = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    requireWorker(key);
    return ctx.db.query("calls").withIndex("by_at").order("desc").take(60);
  },
});

// A claim older than 3 minutes means the laptop dropped it.
export const sweep = internalMutation({
  args: {},
  handler: async (ctx) => {
    const stale = Date.now() - 180_000;
    for (const r of await ctx.db.query("videos").withIndex("by_status", q => q.eq("status", "making")).take(50)) {
      if ((r.claimedAt ?? 0) < stale) await ctx.db.patch(r._id, { status: "queued", stage: undefined });
    }
  },
});
