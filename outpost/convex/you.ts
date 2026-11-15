import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { dayOf, livePosts, PLATFORMS, shiftDay, streakOf, userFor, weekdayOf } from "./lib";

// The You tab: streak, the last five weeks and totals.
// "Today" is in user.tz, the same zone the daily counts use. ensureUser moves user.tz to the phone's zone
// at each launch. Convex doesn't rerun a query as time passes, so the phone sends its local date only to
// make the query run again when that date turns over.
export const summary = query({
  args: { deviceId: v.string(), phoneDay: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const today = dayOf(Date.now(), user.tz);
    const rows = await ctx.db.query("days").withIndex("by_user_day", q => q.eq("userId", user._id)).collect();
    const byDay = new Map(rows.map(r => [r.day, r]));
    const approved = (day: string) => byDay.get(day)?.approved ?? 0;
    const { streak, frozen, freezesLeft } = streakOf(today, d => approved(d) > 0, user.freezesLeft);
    // The streak on each of the next days if nothing more is approved, out to the first day it is gone once every freeze
    // is used (a kept today holds through one more day than a missed one). The home-screen widget shows them from each
    // midnight, when the app may not be open to ask.
    const nextStreaks = Array.from({ length: user.freezesLeft + 2 },
      (_, i) => streakOf(shiftDay(today, i + 1), d => approved(d) > 0, user.freezesLeft).streak);

    // Five weeks, Sunday first, ending with the week that holds today.
    const start = shiftDay(today, -(weekdayOf(today) + 28));
    const calendar = Array.from({ length: 35 }, (_, i) => {
      const day = shiftDay(start, i);
      return { day, approved: approved(day), frozen: frozen.includes(day), future: day > today };
    });

    // One row per video with its platforms side by side, most viewed first. `counted` is false until the platform
    // gives a first count, so a 0 there means "not counted yet", not "nobody watched".
    const live = await livePosts(ctx, user._id);
    const byVideo = new Map<Id<"videos">, { id: Id<"videos">; title: string; at: number; views: number;
      platforms: { id: Id<"posts">; platform: (typeof PLATFORMS)[number]; views: number; counted: boolean; url: string | null }[] }>();
    for (const p of live) {
      let row = byVideo.get(p.videoId);
      if (!row) {
        const video = await ctx.db.get(p.videoId);
        row = { id: p.videoId, title: video?.script?.hook ?? "", at: p.liveAt ?? p.slotAt, views: 0, platforms: [] };
        byVideo.set(p.videoId, row);
      }
      row.views += p.views;
      row.platforms.push({ id: p._id, platform: p.platform, views: p.views, counted: p.viewsAt !== undefined || p.views > 0, url: p.url ?? null });
    }
    const posts = [...byVideo.values()].sort((a, b) => b.views - a.views || b.at - a.at).slice(0, 8);
    for (const r of posts) r.platforms.sort((a, b) => PLATFORMS.indexOf(a.platform) - PLATFORMS.indexOf(b.platform));
    // Platforms with live posts but not one count yet, from every live post rather than the eight shown.
    // Approved videos that never went out because the account was in dry run then, so You can say where they went.
    const liveIds = new Set(live.map(p => p.videoId));
    const dryIds = new Set<Id<"videos">>();
    for (const platform of PLATFORMS) {
      const all = await ctx.db.query("posts")
        .withIndex("by_user_platform_slot", q => q.eq("userId", user._id).eq("platform", platform)).collect();
      for (const p of all) if (p.status === "dry_run" && !liveIds.has(p.videoId)) dryIds.add(p.videoId);
    }
    const waiting = PLATFORMS.filter(pl => live.some(p => p.platform === pl) &&
      !live.some(p => p.platform === pl && (p.viewsAt !== undefined || p.views > 0)));
    const sum = (k: "made" | "approved" | "remakes" | "skipped") => rows.reduce((n, r) => n + r[k], 0);
    return {
      today, streak, nextStreaks, freezesLeft, todayDone: approved(today) > 0, calendar, mode: user.postingMode,
      // Today's swipes, for the Feed's "All caught up" card.
      todayCounts: { approved: approved(today), remakes: byDay.get(today)?.remakes ?? 0 },
      totals: {
        made: sum("made"), approved: sum("approved"), remakes: sum("remakes"), skipped: sum("skipped"),
        live: live.length, videos: liveIds.size, dryRun: dryIds.size, views: live.reduce((n, p) => n + p.views, 0),
      },
      posts, waiting,
    };
  },
});
