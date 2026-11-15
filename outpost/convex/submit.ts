import { v } from "convex/values";
import { internalAction, internalMutation, mutation, query, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { ownVideo, userFor } from "./lib";

// Scheduled from post.settle when a public post on a bounty video goes live. Content Rewards has no submit API, so
// v1 records a `manual` submission: the user taps "Submit on Whop", pastes the post URL there, then confirms with
// markSubmitted.
// TODO(Whop Bounties API): for `whop_bounty` bounties, POST /bounty_submissions here with whopAuth.tokenFor(userId)
// and an Idempotency-Key of the postId, log it to calls as `whop`, and save externalId with status `submitted`.
// Keep `manual` when there is no token or the API refuses (one accepted submission per Whop account by default).
export const forPost = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }): Promise<null> => {
    await ctx.runMutation(internal.submit.record, { postId });
    return null;
  },
});

// One submission per post, created once. dryRun and private posts never submit.
export const record = internalMutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post || post.status !== "live" || post.mode !== "public" || !post.url) return;
    if (await ctx.db.query("submissions").withIndex("by_post", q => q.eq("postId", postId)).first()) return;
    const video = await ctx.db.get(post.videoId);
    if (!video?.bountyId || !(await ctx.db.get(video.bountyId))) return;
    await ctx.db.insert("submissions", {
      userId: post.userId, bountyId: video.bountyId, videoId: video._id, postId, url: post.url, status: "manual", checks: 0,
    });
  },
});

// Cron, every 10 minutes. A no-op in v1: `manual` rows have no status API to read.
// TODO(Whop Bounties API): for rows with externalId in `pending` or `submitted`, GET /bounty_submissions?bounty_id=
// with the user's token, map in_progress|submitted|approved|denied and denial_reason onto the row, set resolvedAt
// when it settles, and bump checks.
export const poll = internalAction({
  args: {},
  handler: async (): Promise<null> => null,
});

// A video posted to several platforms has one submission per post. Show the oldest one still waiting on the user,
// else the newest.
async function current(ctx: QueryCtx, videoId: Id<"videos">) {
  const rows: Doc<"submissions">[] = [];
  for (const p of await ctx.db.query("posts").withIndex("by_video", q => q.eq("videoId", videoId)).collect()) {
    const s = await ctx.db.query("submissions").withIndex("by_post", q => q.eq("postId", p._id)).first();
    if (s) rows.push(s);
  }
  rows.sort((a, b) => a._creationTime - b._creationTime);
  return rows.find(s => s.status === "manual") ?? rows[rows.length - 1] ?? null;
}

// The video's submission status and the "Submit on Whop" deep link (the campaign page), or null when it has none.
// postUrl is what the user pastes on Whop. selfReported marks a `submitted` the user confirmed, which v1 can't check.
export const forVideo = query({
  args: { deviceId: v.string(), videoId: v.id("videos") },
  handler: async (ctx, { deviceId, videoId }): Promise<{
    status: Doc<"submissions">["status"];
    deepLink: string;
    denialReason: string | null;
    postUrl: string;
    brand: string;
    selfReported: boolean;
  } | null> => {
    await ownVideo(ctx, await userFor(ctx, deviceId), videoId);
    const s = await current(ctx, videoId);
    const bounty = s && await ctx.db.get(s.bountyId);
    if (!s || !bounty) return null;
    return {
      status: s.status, deepLink: bounty.url, denialReason: s.denialReason ?? null,
      postUrl: s.url, brand: bounty.brand, selfReported: s.status === "submitted" && !s.externalId,
    };
  },
});

// The user says they submitted the post on Whop: the `manual` row forVideo shows becomes `submitted`.
export const markSubmitted = mutation({
  args: { deviceId: v.string(), videoId: v.id("videos") },
  handler: async (ctx, { deviceId, videoId }) => {
    await ownVideo(ctx, await userFor(ctx, deviceId), videoId);
    const s = await current(ctx, videoId);
    if (s?.status === "manual") await ctx.db.patch(s._id, { status: "submitted", submittedAt: Date.now() });
    return null;
  },
});
