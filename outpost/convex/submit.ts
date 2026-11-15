import { v } from "convex/values";
import { internalAction, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

// Scheduled from post.settle when a post on a bounty video goes live. Creates the submission (`manual` in v1), idempotently.
export const forPost = internalAction({
  args: { postId: v.id("posts") },
  handler: async (): Promise<null> => null,
});

// Cron, every 10 minutes: refreshes open submissions' statuses from Whop.
export const poll = internalAction({
  args: {},
  handler: async (): Promise<null> => null,
});

// The video's submission status and the "Submit on Whop" deep link, or null when it has none.
export const forVideo = query({
  args: { deviceId: v.string(), videoId: v.id("videos") },
  handler: async (): Promise<{
    status: Doc<"submissions">["status"];
    deepLink: string;
    denialReason: string | null;
  } | null> => null,
});
