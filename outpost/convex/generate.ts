import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { LIBRARY_DEVICE_ID, cloneInto, libraryVideos } from "./bounties";
import { userFor } from "./lib";

// The staged sequence a suggestion plays before its pregenerated library video lands in the Feed. The app draws these
// steps from list; finish runs when they add up, so the Feed and the progress page agree.
export const STAGES = [
  { label: "Writing script", ms: 3000 },
  { label: "Voicing", ms: 2500 },
  { label: "Rendering", ms: 5000 },
  { label: "Adding to your Feed", ms: 1500 },
];
export const TOTAL_MS = STAGES.reduce((n, s) => n + s.ms, 0);
const SUGGESTIONS = 6;

// A prompt-like line from the video's brief: 'Dialogue skit for Nilo: "Stop buying games, make one"'. A hook that
// repeats the format ("POV: ...") drops it: 'POV for Nilo: "you have had the same game idea for years"'.
function promptFor(video: Doc<"videos">, bounty: Doc<"bounties"> | null) {
  const format = video.brief?.format ?? "Short video";
  const hook = hookOf(video);
  const what = format.charAt(0).toUpperCase() + format.slice(1) + (bounty ? " for " + bounty.brand : "");
  return hook ? what + ': "' + hook + '"' : what;
}

// The video's hook without a format prefix it repeats ("POV: ").
function hookOf(video: Doc<"videos">) {
  const format = video.brief?.format ?? "";
  const raw = video.brief?.hook ?? video.script?.hook ?? "";
  return format && raw.toLowerCase().startsWith(format.toLowerCase() + ":") ? raw.slice(format.length + 1).trim() : raw;
}

// Library videos this user already has in the Feed or has already generated.
async function usedSources(ctx: QueryCtx, userId: Id<"users">) {
  const mine = await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", userId)).collect();
  const gens = await ctx.db.query("generations").withIndex("by_user", q => q.eq("userId", userId)).collect();
  return new Set<Id<"videos">>([...mine.flatMap(v => v.sourceVideoId ? [v.sourceVideoId] : []), ...gens.map(g => g.sourceVideoId)]);
}

// Up to six prompts, each backed by a ready library video of an open bounty the user doesn't have yet. One per bounty
// first, so the chips cover different brands.
export const suggestions = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const used = await usedSources(ctx, user._id);
    const ready = (await libraryVideos(ctx))
      .filter(v => v.status === "ready" && v.storageId && v.script && !used.has(v._id))
      .sort((a, b) => a.rank - b.rank);
    const bounties = new Map<string, Doc<"bounties"> | null>();
    const seen = new Set<string>();
    const first: Doc<"videos">[] = [];
    const rest: Doc<"videos">[] = [];
    for (const v of ready) {
      const key = v.bountyId ?? "";
      if (!bounties.has(key)) bounties.set(key, v.bountyId ? await ctx.db.get(v.bountyId) : null);
      if (v.bountyId && bounties.get(key)?.status !== "open") continue;
      if (seen.has(key)) rest.push(v);
      else { seen.add(key); first.push(v); }
    }
    return [...first, ...rest].slice(0, SUGGESTIONS).map(v => {
      const bounty = bounties.get(v.bountyId ?? "") ?? null;
      const hook = hookOf(v);
      return { id: v._id, prompt: promptFor(v, bounty), hook: hook.charAt(0).toUpperCase() + hook.slice(1), brand: bounty?.brand ?? null };
    });
  },
});

// Records a staged generation for one suggestion and schedules its landing. Starting the same suggestion twice
// returns the first generation.
export const start = mutation({
  args: { deviceId: v.string(), suggestionId: v.id("videos"), prompt: v.optional(v.string()) },
  handler: async (ctx, { deviceId, suggestionId, prompt }): Promise<Id<"generations">> => {
    const user = await userFor(ctx, deviceId);
    if (user.deviceId === LIBRARY_DEVICE_ID) throw new ConvexError("the library can't generate");
    const existing = await ctx.db.query("generations")
      .withIndex("by_user_source", q => q.eq("userId", user._id).eq("sourceVideoId", suggestionId)).first();
    if (existing) return existing._id;
    const source = await ctx.db.get(suggestionId);
    const library = await ctx.db.query("users").withIndex("by_device", q => q.eq("deviceId", LIBRARY_DEVICE_ID)).unique();
    if (!source || !library || source.userId !== library._id || source.status !== "ready" || !source.storageId || !source.script) {
      throw new ConvexError("That suggestion isn't ready.");
    }
    const bounty = source.bountyId ? await ctx.db.get(source.bountyId) : null;
    const id = await ctx.db.insert("generations", {
      userId: user._id, sourceVideoId: suggestionId, bountyId: source.bountyId,
      prompt: prompt?.trim().slice(0, 200) || promptFor(source, bounty), startedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(TOTAL_MS, internal.generate.finish, { generationId: id });
    return id;
  },
});

// The end of the staged sequence: clones the library video to the front of the user's Feed (or finds the clone a
// Take already made) and marks the generation done.
export const finish = internalMutation({
  args: { generationId: v.id("generations") },
  handler: async (ctx, { generationId }): Promise<null> => {
    const gen = await ctx.db.get(generationId);
    if (!gen || gen.doneAt) return null;
    const source = await ctx.db.get(gen.sourceVideoId);
    if (source) await cloneInto(ctx, gen.userId, [source]);
    const mine = await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", gen.userId)).collect();
    const clone = mine.find(v => v.sourceVideoId === gen.sourceVideoId);
    await ctx.db.patch(generationId, { doneAt: Date.now(), videoId: clone?._id });
    return null;
  },
});

// The progress page: the user's staged generations, newest first, and their real studio jobs with the worker's stage.
export const list = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const gens = await ctx.db.query("generations").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(20);
    const staged = [];
    for (const g of gens) {
      const clone = g.videoId ? await ctx.db.get(g.videoId) : null;
      const bounty = g.bountyId ? await ctx.db.get(g.bountyId) : null;
      staged.push({
        id: g._id, prompt: g.prompt, brand: bounty?.brand ?? null, startedAt: g.startedAt, doneAt: g.doneAt ?? null,
        // ready: waiting in the Feed; right or left: already swiped; null: nothing landed.
        video: clone ? { id: clone._id, status: clone.status } : null,
      });
    }
    const studio = [];
    for (const status of ["making", "queued"] as const) {
      const rows = await ctx.db.query("videos")
        .withIndex("by_user_status_rank", q => q.eq("userId", user._id).eq("status", status)).take(10);
      for (const r of rows) {
        studio.push({
          id: r._id, status, stage: r.stage ?? null, createdAt: r.createdAt,
          title: r.brief?.hook ?? r.script?.hook ?? (r.parentId ? "Remake" : "New video"),
        });
      }
    }
    return { stages: STAGES, staged, studio };
  },
});
