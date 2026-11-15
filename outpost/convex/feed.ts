import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { PLATFORMS, bumpDay, dayOf, livePosts, ownVideo, refill, userFor } from "./lib";
import { place, slotFor } from "./pace";
import { attachDemoAccounts } from "./demo";
import { scoutIfLow } from "./scout";
import { rewardLabel } from "./bounties";

export const REASONS: Record<string, string> = {
  hook: "Hook too slow",
  visuals: "Boring visuals",
  voice: "Voice",
  long: "Too long",
  topic: "Wrong topic",
  more: "Say more",
};

export const ensureUser = mutation({
  args: { deviceId: v.string(), tz: v.string() },
  handler: async (ctx, { deviceId, tz }) => {
    if (!/^[A-Za-z0-9_-]{43,}$/.test(deviceId)) throw new ConvexError("bad device id");
    try { dayOf(0, tz); } catch { throw new ConvexError("bad time zone"); }
    let user = await ctx.db.query("users").withIndex("by_device", q => q.eq("deviceId", deviceId)).unique();
    if (!user) {
      // Any device can sign up, so a cap on users bounds the studio jobs and Whop products new devices can start.
      const cap = Number(process.env.MAX_USERS) || 5;
      if ((await ctx.db.query("users").take(cap)).length >= cap) throw new ConvexError("Outpost is full right now.");
      const id = await ctx.db.insert("users", {
        deviceId, tz, niche: "Notion templates for freelancers", freezesLeft: 2,
        postingMode: "dryRun", pacePerDay: 12, drainPaused: false, createdAt: Date.now(),
      });
      user = (await ctx.db.get(id))!;
    } else if (user.tz !== tz) {
      // Follow the phone when it changes time zone, so days are counted in the zone the user sees.
      await ctx.db.patch(user._id, { tz });
    }
    await attachDemoAccounts(ctx, user._id);
    await refill(ctx, user._id);
    await scoutIfLow(ctx, user);
    return { mode: user.postingMode };
  },
});

export const next = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const rows = await ctx.db.query("videos")
      .withIndex("by_user_status_rank", q => q.eq("userId", user._id).eq("status", "ready")).take(12);
    const out = [];
    for (const r of rows) {
      const url = r.storageId ? await ctx.storage.getUrl(r.storageId) : null;
      if (!url || !r.script) continue;
      // A video made from a Scout find carries the find's price, so its tag can say which product it sells.
      const find = r.findId ? await ctx.db.get(r.findId) : null;
      const bounty = r.bountyId ? await ctx.db.get(r.bountyId) : null;
      out.push({
        id: r._id, url, hook: r.script.hook, durationS: r.durationS ?? 0,
        remade: r.remakeReason ? { reason: REASONS[r.remakeReason] ?? r.remakeReason, label: remadeLabel(r.remakeReason) } : null,
        scout: find ? { priceCents: find.priceCents } : null,
        bounty: bounty ? { brand: bounty.brand, title: bounty.title, rewardLabel: rewardLabel(bounty), url: bounty.url } : null,
        pregenerated: !!r.pregenerated,
        predicted: r.predicted ?? null,
      });
    }
    return out;
  },
});

// Named after the edit chip that asked for the remake, so the card that comes back reads "Remade: punchier hook".
function remadeLabel(reason: string) {
  return ({ hook: "punchier hook", visuals: "new look", voice: "new voice", long: "shorter", topic: "new topic", more: "your note" } as Record<string, string>)[reason] ?? "remade";
}


// Studio and posting state for the header and the "just posted" tray.
export const status = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const count = async (status: "queued" | "making" | "ready") =>
      (await ctx.db.query("videos").withIndex("by_user_status_rank", q => q.eq("userId", user._id).eq("status", status)).take(50)).length;
    const making = await ctx.db.query("videos")
      .withIndex("by_user_status_rank", q => q.eq("userId", user._id).eq("status", "making")).take(3);
    const worker = await ctx.db.query("workers").withIndex("by_name", q => q.eq("name", "laptop")).unique();

    const posts = [];
    for (const p of PLATFORMS) {
      posts.push(...(await ctx.db.query("posts")
        .withIndex("by_user_platform_slot", q => q.eq("userId", user._id).eq("platform", p)).order("desc").take(6))
        .map(r => ({ ...r, platform: p })));
    }
    const byVideo = new Map<string, typeof posts>();
    for (const p of posts.sort((a, b) => b._creationTime - a._creationTime)) {
      const k = p.videoId as string;
      if (!byVideo.has(k)) byVideo.set(k, []);
      byVideo.get(k)!.push(p);
    }
    const recent = [];
    for (const [videoId, rows] of [...byVideo].slice(0, 3)) {
      const video = await ctx.db.get(rows[0].videoId);
      // A bounty video's submission, once one of its posts is live: "manual" means it waits for one tap on Whop.
      let submission: Doc<"submissions">["status"] | null = null;
      for (const r of rows) {
        const s = await ctx.db.query("submissions").withIndex("by_post", q => q.eq("postId", r._id)).first();
        if (s && submission !== "manual") submission = s.status;
      }
      recent.push({
        videoId, hook: video?.script?.hook ?? "", submission,
        at: Math.max(...rows.map(r => r._creationTime)),
        posts: rows.sort((a, b) => PLATFORMS.indexOf(a.platform) - PLATFORMS.indexOf(b.platform)).map(r => ({
          platform: r.platform, status: r.status, url: r.url ?? null, slotAt: r.slotAt, error: r.error ?? null, mode: r.mode,
        })),
      });
    }
    // The courier on the Base walks while a post goes out. The tray above keeps only the three newest videos and can
    // miss an older post sending now, so this reads the posts themselves. A post can stay "publishing" for up to a
    // day while Zernio works, so queued and publishing ones count whatever their slot.
    const sending = [];
    for (const status of ["queued", "publishing"] as const) {
      const rows = await ctx.db.query("posts").withIndex("by_status_slot", q => q.eq("status", status)).take(100);
      sending.push(...rows.filter(r => r.userId === user._id).map(r => ({ status: r.status, slotAt: r.slotAt })));
    }
    // Held posts count only in the minute around their slot. The app applies that window with its own clock, since
    // this query's time only moves when its data changes, so this reads each platform's from ten minutes ago on.
    for (const p of PLATFORMS) {
      const rows = await ctx.db.query("posts")
        .withIndex("by_user_platform_slot", q => q.eq("userId", user._id).eq("platform", p).gte("slotAt", Date.now() - 10 * 60_000)).take(5);
      sending.push(...rows.filter(r => r.status === "held").map(r => ({ status: r.status, slotAt: r.slotAt })));
    }
    return {
      mode: user.postingMode,
      views: (await livePosts(ctx, user._id)).reduce((n, p) => n + p.views, 0),
      studio: {
        queued: await count("queued"), making: making.length, ready: await count("ready"),
        stages: making.map(m => m.stage ?? "starting"),
        lastSeen: worker?.lastSeen ?? 0,
      },
      recent: recent.sort((a, b) => b.at - a.at),
      sending,
    };
  },
});

export const swipe = mutation({
  args: {
    deviceId: v.string(),
    videoId: v.id("videos"),
    dir: v.union(v.literal("right"), v.literal("left")),
    reason: v.optional(v.string()),
    note: v.optional(v.string()),
    dwellMs: v.number(),
  },
  handler: async (ctx, { deviceId, videoId, dir, reason, note, dwellMs }) => {
    const user = await userFor(ctx, deviceId);
    const video = await ownVideo(ctx, user, videoId);
    if (video.status !== "ready") return { ok: false };
    const now = Date.now();
    await ctx.db.patch(videoId, { status: dir });
    const day = dayOf(now, user.tz);
    await ctx.db.insert("swipes", {
      userId: user._id, videoId, dir, reason, dwellMs: Math.max(0, Math.min(dwellMs, 600_000)), day, at: now,
    });
    await bumpDay(ctx, user._id, day, dir === "right" ? "approved" : reason ? "remakes" : "skipped");
    // Out of finds while the search was cooling down: the next video swipe after the cooldown searches again.
    await scoutIfLow(ctx, user);

    if (dir === "right") {
      for (const platform of PLATFORMS) {
        const slotAt = await slotFor(ctx, user, platform, now);
        const postId = await ctx.db.insert("posts", {
          userId: user._id, videoId, platform, status: "held", mode: user.postingMode, views: 0, slotAt, checks: 0,
        });
        // While paused the row stays held; `reslot` places it after the queue resumes.
        if (!user.drainPaused) await place(ctx, postId, slotAt, now);
      }
    } else if (reason) {
      const key = REASONS[reason] ? reason : "more";
      const text = (key === "more" && note?.trim() ? note.trim() : REASONS[key]).slice(0, 280);
      const noteId = await ctx.db.insert("tasteNotes", {
        userId: user._id, text, reasonKey: key, videoId, sync: "pending", deleted: false, updatedAt: now,
      });
      await ctx.scheduler.runAfter(0, internal.memory.syncNote, { noteId });
      // The remake lands just after the third card still waiting.
      const ready = await ctx.db.query("videos")
        .withIndex("by_user_status_rank", q => q.eq("userId", user._id).eq("status", "ready")).take(4);
      const rank = ready.length >= 4 ? (ready[2].rank + ready[3].rank) / 2 : (ready.at(-1)?.rank ?? now) + 0.5;
      // A remake stays on its bounty, so it comes back with the same tag and still submits there.
      await ctx.db.insert("videos", {
        userId: user._id, status: "queued", rank, parentId: videoId, findId: video.findId, remakeReason: key,
        remakeNote: key === "more" ? text : undefined, attempts: 0, createdAt: now,
        bountyId: video.bountyId, mode: video.mode, clip: video.clip,
      });
    } else if (video.storageId && !video.pregenerated && !video.sourceVideoId) {
      // A plain skip makes no remake, so nothing needs the file again. A demo library video's file is shared with
      // every clone of it, so the library keeps it.
      await ctx.storage.delete(video.storageId);
      await ctx.db.patch(videoId, { storageId: undefined });
    }
    await refill(ctx, user._id);
    return { ok: true };
  },
});
