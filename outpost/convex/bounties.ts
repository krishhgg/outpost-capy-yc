import { v } from "convex/values";
import { internalAction, mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

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

// Upserts the user's userBounties row as active, then refills with bounty videos.
export const take = mutation({
  args: { deviceId: v.string(), bountyId: v.id("bounties") },
  handler: async (): Promise<null> => null,
});

// Marks the user's userBounties row dropped.
export const drop = mutation({
  args: { deviceId: v.string(), bountyId: v.id("bounties") },
  handler: async (): Promise<null> => null,
});

// Cron, every 15 minutes: lists open bounties with the demo Whop token and the Content Rewards fallback.
export const sync = internalAction({
  args: {},
  handler: async (): Promise<null> => null,
});
