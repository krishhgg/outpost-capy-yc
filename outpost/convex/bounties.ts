import { ConvexError, v } from "convex/values";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { CATALOG_READ_AT, SEED_BOUNTIES, VIDEOS_PER_CAMPAIGN } from "./bountySeed";
import { userFor } from "./lib";

type BountyCard = {
  id: Id<"bounties">;
  title: string;
  brand: string;
  mode: Doc<"bounties">["mode"];
  rewardLabel: string;
  budgetLabel: string | null;
  spotsLabel: string | null;
  taken: boolean;
  source: Doc<"bounties">["source"];
  // The bounty has videos made ahead of time in the demo library; progress counts them (failed ones left out).
  pregenerated: boolean;
  progress: { ready: number; total: number };
  makes: string; // what Outpost makes for it, from the brief
  url: string; // the public campaign page
};

const usd = (cents: number, digits = 2) =>
  "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

function rewardLabel(b: Doc<"bounties">) {
  if (b.rewardKind === "per_view") return b.ratePer1kCents != null ? usd(b.ratePer1kCents) + " / 1K views" : "Paid per 1K views";
  return b.rewardCents != null ? usd(b.rewardCents) + " per approved post" : "Paid per approved post";
}

// Every video the library user owns, in any status.
async function libraryVideos(ctx: QueryCtx) {
  const library = await ctx.db.query("users").withIndex("by_device", q => q.eq("deviceId", LIBRARY_DEVICE_ID)).unique();
  if (!library) return [];
  return ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", library._id)).collect();
}

// Clones the bounty's ready library videos the user doesn't have yet to the front of their Feed, in library order.
// A clone shares its library video's storage file and never deletes it (contracts.md, storage rule).
async function cloneInto(ctx: MutationCtx, userId: Id<"users">, library: Doc<"videos">[]) {
  const mine = await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", userId)).collect();
  const have = new Set(mine.map(v => v.sourceVideoId));
  const fresh = library.filter(v => v.status === "ready" && v.storageId && v.script && !have.has(v._id)).sort((a, b) => a.rank - b.rank);
  const now = Date.now();
  const front = Math.min(now, ...mine.filter(v => v.status === "ready").map(v => v.rank));
  for (const [i, v] of fresh.entries()) {
    await ctx.db.insert("videos", {
      userId, status: "ready", rank: front - fresh.length + i, bountyId: v.bountyId, mode: v.mode, brief: v.brief, script: v.script,
      storageId: v.storageId, durationS: v.durationS, voice: v.voice, palette: v.palette, model: v.model, predicted: v.predicted,
      pregenerated: true, sourceVideoId: v._id, readyAt: now, attempts: 0, createdAt: now,
    });
  }
  return fresh.length;
}

// Open bounties, taken first.
export const list = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }): Promise<BountyCard[]> => {
    const user = await userFor(ctx, deviceId);
    const taken = new Set((await ctx.db.query("userBounties").withIndex("by_user", q => q.eq("userId", user._id)).collect())
      .filter(r => r.status === "active").map(r => r.bountyId));
    const library = (await libraryVideos(ctx)).filter(v => v.status !== "failed");
    const open = await ctx.db.query("bounties").withIndex("by_status", q => q.eq("status", "open")).collect();
    const cards = open.map(b => {
      const made = library.filter(v => v.bountyId === b._id);
      return {
        id: b._id, title: b.title, brand: b.brand, mode: b.mode, rewardLabel: rewardLabel(b),
        budgetLabel: b.budgetCents == null ? null : usd(Math.max(0, b.budgetCents - (b.paidOutCents ?? 0)), 0) + " left",
        spotsLabel: b.spotsRemaining == null ? null : b.spotsRemaining + (b.spotsRemaining === 1 ? " spot left" : " spots left"),
        taken: taken.has(b._id), source: b.source,
        pregenerated: made.length > 0,
        progress: { ready: made.filter(v => v.status === "ready").length, total: made.length },
        makes: typeof b.brief?.format === "string" ? b.brief.format : "",
        url: b.url,
      };
    });
    return cards.sort((a, b) => Number(b.taken) - Number(a.taken));
  },
});

// Upserts the user's userBounties row as active and clones the bounty's ready library videos into the Feed.
export const take = mutation({
  args: { deviceId: v.string(), bountyId: v.id("bounties") },
  handler: async (ctx, { deviceId, bountyId }): Promise<null> => {
    const user = await userFor(ctx, deviceId);
    if (user.deviceId === LIBRARY_DEVICE_ID) throw new ConvexError("the library can't take bounties");
    const bounty = await ctx.db.get(bountyId);
    if (!bounty || bounty.status !== "open") throw new ConvexError("This bounty is closed.");
    const row = await ctx.db.query("userBounties")
      .withIndex("by_user_bounty", q => q.eq("userId", user._id).eq("bountyId", bountyId)).unique();
    if (!row) await ctx.db.insert("userBounties", { userId: user._id, bountyId, status: "active", takenAt: Date.now() });
    else if (row.status !== "active") await ctx.db.patch(row._id, { status: "active", takenAt: Date.now() });
    const library = (await libraryVideos(ctx)).filter(v => v.bountyId === bountyId);
    if (bounty.mode === "clip" && library.length === 0) await ctx.scheduler.runAfter(0, internal.sources.enqueue, { bountyId });
    await cloneInto(ctx, user._id, library);
    return null;
  },
});

// Marks the user's userBounties row dropped. Clones already in the Feed stay until swiped.
export const drop = mutation({
  args: { deviceId: v.string(), bountyId: v.id("bounties") },
  handler: async (ctx, { deviceId, bountyId }): Promise<null> => {
    const user = await userFor(ctx, deviceId);
    const row = await ctx.db.query("userBounties")
      .withIndex("by_user_bounty", q => q.eq("userId", user._id).eq("bountyId", bountyId)).unique();
    if (row?.status === "active") await ctx.db.patch(row._id, { status: "dropped" });
    return null;
  },
});

// Cron, every 15 minutes. The demo bounties are hard-coded in bountySeed.ts, so this makes no outside calls: it only
// clones library videos that became ready after a Take into every active taker's Feed.
export const sync = internalAction({
  args: {},
  handler: async (ctx): Promise<null> => {
    await ctx.runMutation(internal.bounties.cloneNewlyReady, {});
    return null;
  },
});

export const cloneNewlyReady = internalMutation({
  args: {},
  handler: async (ctx): Promise<number> => {
    const active = (await ctx.db.query("userBounties").collect()).filter(r => r.status === "active");
    if (!active.length) return 0;
    const library = await libraryVideos(ctx);
    let cloned = 0;
    for (const r of active) {
      if ((await ctx.db.get(r.bountyId))?.status !== "open") continue;
      cloned += await cloneInto(ctx, r.userId, library.filter(v => v.bountyId === r.bountyId));
    }
    return cloned;
  },
});

export const LIBRARY_DEVICE_ID = "library-outpost-demo-pregenerated-videos-v1-000000";

// Builder-only: writes the demo bounties and queues the pregenerated library, VIDEOS_PER_CAMPAIGN per bounty, owned by one
// library user. Safe to run again: bounties upsert by (source, externalId), and a brief already queued for a bounty
// is never queued twice. Library ranks are tiny round-robin numbers (every bounty's first video, then every
// bounty's second...), so each bounty gets videos early and the studio, which claims the lowest rank first, renders
// the library before any user's videos, whose ranks are timestamps.
export const seedBounties = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const ids: Id<"bounties">[] = [];
    for (const { videos, ...seed } of SEED_BOUNTIES) {
      const row = await ctx.db.query("bounties")
        .withIndex("by_source_external", q => q.eq("source", "content_rewards").eq("externalId", seed.externalId)).unique();
      if (row) {
        // Budget, paid out, status and syncedAt belong to sync once the row exists.
        const { budgetCents: _b, paidOutCents: _p, ...fixed } = seed;
        await ctx.db.patch(row._id, { ...fixed, mode: "original", rewardKind: "per_view" });
        ids.push(row._id);
      } else {
        ids.push(await ctx.db.insert("bounties", {
          ...seed, source: "content_rewards", mode: "original", rewardKind: "per_view", status: "open", syncedAt: CATALOG_READ_AT,
        }));
      }
    }

    let library = await ctx.db.query("users").withIndex("by_device", q => q.eq("deviceId", LIBRARY_DEVICE_ID)).unique();
    if (!library) {
      const id = await ctx.db.insert("users", {
        deviceId: LIBRARY_DEVICE_ID, tz: "America/Los_Angeles", niche: "short videos for paid brand campaigns, each one made to its sponsor's brief",
        freezesLeft: 0, postingMode: "dryRun", pacePerDay: 0, drainPaused: true, createdAt: now,
      });
      library = (await ctx.db.get(id))!;
    }
    const have = await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", library._id)).collect();

    let queued = 0;
    for (const [b, bountyId] of ids.entries()) {
      const mine = have.filter(v => v.bountyId === bountyId);
      const stories = new Set(mine.map(v => v.brief?.story));
      let count = mine.length;
      for (const [k, brief] of SEED_BOUNTIES[b].videos.slice(0, VIDEOS_PER_CAMPAIGN).entries()) {
        if (stories.has(brief.story) || count >= VIDEOS_PER_CAMPAIGN) continue;
        await ctx.db.insert("videos", {
          userId: library._id, bountyId, brief, mode: "original", pregenerated: true,
          status: "queued", rank: k * ids.length + b, attempts: 0, createdAt: now,
        });
        count++;
        queued++;
      }
    }
    return { bounties: ids.length, libraryUserId: library._id, queued, libraryVideos: have.length + queued };
  },
});
