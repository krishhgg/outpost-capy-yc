import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { livePosts, userFor } from "./lib";

// The "While you were away" screen: what the agents did since the user last tapped Collect.
export const summary = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const seen = user.seen ?? { at: user.createdAt, views: 0 };
    let made = 0;
    for (const status of ["ready", "right", "left"] as const) {
      const rows = await ctx.db.query("videos")
        .withIndex("by_user_status_rank", q => q.eq("userId", user._id).eq("status", status)).collect();
      made += rows.filter(r => (r.readyAt ?? 0) > seen.at).length;
    }
    const live = await livePosts(ctx, user._id);
    const sales = (await ctx.db.query("ledger").withIndex("by_user", q => q.eq("userId", user._id)).collect())
      .filter(l => l.at > seen.at);
    return {
      at: Date.now(),
      since: seen.at,
      made,
      posted: live.filter(p => (p.liveAt ?? 0) > seen.at).length,
      views: { from: seen.views, to: live.reduce((n, p) => n + p.views, 0) },
      sales: { count: sales.length, netCents: sales.reduce((n, l) => n + l.netCents, 0), test: sales.every(l => l.test) },
    };
  },
});

// Saves what the screen showed. Anything that arrived after it was read, while the sheet stayed open, stays for next time.
export const collect = mutation({
  args: { deviceId: v.string(), at: v.number(), views: v.number() },
  handler: async (ctx, { deviceId, at, views }) => {
    const user = await userFor(ctx, deviceId);
    const total = (await livePosts(ctx, user._id)).reduce((n, p) => n + p.views, 0);
    await ctx.db.patch(user._id, { seen: { at: Math.min(at, Date.now()), views: Math.min(views, total) } });
  },
});
