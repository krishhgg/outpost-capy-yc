import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { DAY_MS } from "./lib";

// Views for live posts, read from Zernio. Zernio refreshes each account from the platform about once an hour,
// so a cron every 20 minutes is enough. Posts older than two weeks keep their last count.
const ZERNIO = "https://zernio.com/api/v1";
const WINDOW_MS = 14 * DAY_MS;
const BATCH = 40; // reads a minute. Zernio allows 60 with two accounts, and posting needs some of them.

export const recentLive = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("posts")
      .withIndex("by_status_slot", q => q.eq("status", "live").gt("slotAt", Date.now() - WINDOW_MS)).order("desc").collect();
    return rows.filter(p => p.providerId)
      .map(p => ({ id: p._id, userId: p.userId, platform: p.platform, providerId: p.providerId!, views: p.views, counted: p.viewsAt !== undefined }));
  },
});

// Newest posts first, one batch a minute until every post in the window has been read.
export const sync = internalAction({
  args: { offset: v.optional(v.number()) },
  handler: async (ctx, { offset = 0 }): Promise<void> => {
    const key = process.env.ZERNIO_API_KEY;
    if (!key) return;
    const all = await ctx.runQuery(internal.views.recentLive, {});
    const posts = all.slice(offset, offset + BATCH);
    const users = new Map<string, { userId: (typeof posts)[number]["userId"]; posts: number; gained: number; ms: number; errors: string[] }>();
    const updates: { id: (typeof posts)[number]["id"]; views: number }[] = [];
    for (const p of posts) {
      const u = users.get(p.userId) ?? { userId: p.userId, posts: 0, gained: 0, ms: 0, errors: [] };
      users.set(p.userId, u);
      u.posts++;
      const t0 = Date.now();
      try {
        const r = await fetch(`${ZERNIO}/analytics?postId=${encodeURIComponent(p.providerId)}`, { headers: { Authorization: `Bearer ${key}` } });
        const j: any = await r.json().catch(() => null);
        // 202 means Zernio is still syncing. Its platform entry has no analytics yet, so nothing is read.
        const n = (j?.platformAnalytics ?? []).find((x: any) => x.platform === p.platform)?.analytics?.views;
        if (!r.ok) u.errors.push(`${p.platform} ${r.status}`);
        // Platforms recount now and then. Keep the higher number so the total never drops on screen. The first count
        // is saved even at 0, so the app can tell a real 0 from a platform that hasn't counted yet.
        else if (typeof n === "number" && (n > p.views || !p.counted)) {
          updates.push({ id: p.id, views: Math.max(n, p.views) });
          u.gained += Math.max(0, n - p.views);
        }
      } catch (e) {
        u.errors.push(String(e).slice(0, 80));
      }
      u.ms += Date.now() - t0;
    }
    if (updates.length) await ctx.runMutation(internal.views.save, { updates });
    // One line per user on the hood, only when views moved or a read failed, so a quiet hour adds nothing.
    for (const u of users.values()) {
      if (!u.gained && !u.errors.length) continue;
      await ctx.runMutation(internal.post.call, {
        userId: u.userId, service: "zernio", op: "read views", status: u.errors.length ? "error" : "ok", ms: u.ms,
        detail: `GET /analytics for ${u.posts} post${u.posts === 1 ? "" : "s"} · +${u.gained} views${u.errors.length ? ` · failed: ${u.errors.join(", ")}` : ""}`,
      });
    }
    if (offset + BATCH < all.length) await ctx.scheduler.runAfter(60_000, internal.views.sync, { offset: offset + BATCH });
  },
});

export const save = internalMutation({
  args: { updates: v.array(v.object({ id: v.id("posts"), views: v.number() })) },
  handler: async (ctx, { updates }) => {
    for (const { id, views } of updates) await ctx.db.patch(id, { views, viewsAt: Date.now() });
  },
});
