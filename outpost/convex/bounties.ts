import { v } from "convex/values";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { CATALOG_READ_AT, SEED_BOUNTIES, VIDEOS_PER_CAMPAIGN } from "./bountySeed";

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
};

// Open bounties, taken first.
export const list = query({
  args: { deviceId: v.string() },
  handler: async (): Promise<BountyCard[]> => [],
});

// Upserts the user's userBounties row as active and clones the bounty's pregenerated library videos into the Feed.
export const take = mutation({
  args: { deviceId: v.string(), bountyId: v.id("bounties") },
  handler: async (): Promise<null> => null,
});

// Marks the user's userBounties row dropped.
export const drop = mutation({
  args: { deviceId: v.string(), bountyId: v.id("bounties") },
  handler: async (): Promise<null> => null,
});

// Cron, every 15 minutes: reads the Content Rewards public catalog.
export const sync = internalAction({
  args: {},
  handler: async (): Promise<null> => null,
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
