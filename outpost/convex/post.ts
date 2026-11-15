import { v } from "convex/values";
import { internalAction, internalMutation, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { DAY_MS, logCall } from "./lib";

const ZERNIO = "https://zernio.com/api/v1";

export const begin = internalMutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const p = await ctx.db.get(postId);
    if (!p || (p.status !== "queued" && p.status !== "held")) return null;
    const user = await ctx.db.get(p.userId);
    if (!user) return null;
    // Nothing sends while the queue is paused. A queued row (a retry, say) goes back to held so resume can slot it.
    if (user.drainPaused) {
      if (p.status === "queued") await ctx.db.patch(postId, { status: "held" });
      return null;
    }
    // A held row runs only at its own time.
    if (p.status === "held" && p.slotAt > Date.now() + 5000) return null;
    const video = await ctx.db.get(p.videoId);
    if (!video?.script || !video.storageId) {
      await ctx.db.patch(postId, { status: "failed", error: "Video file missing" });
      return null;
    }
    const conn = (await ctx.db.query("connections").withIndex("by_user", q => q.eq("userId", p.userId)).collect())
      .find(c => c.platform === p.platform);
    await ctx.db.patch(postId, { status: "publishing" });
    return {
      userId: p.userId, videoId: p.videoId, platform: p.platform, mode: p.mode,
      accountId: conn?.accountId ?? null, script: video.script, storageId: video.storageId,
      publicUrl: video.publicUrl && Date.now() - video.publicUrl.at < 6 * DAY_MS ? video.publicUrl.url : null,
    };
  },
});

export const settle = internalMutation({
  args: {
    postId: v.id("posts"),
    status: v.union(v.literal("publishing"), v.literal("live"), v.literal("failed"), v.literal("dry_run"), v.literal("skipped")),
    providerId: v.optional(v.string()),
    url: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { postId, ...patch }) => {
    const p = await ctx.db.get(postId);
    if (!p) return;
    await ctx.db.patch(postId, {
      ...patch,
      error: patch.error?.slice(0, 200),
      checks: p.checks + (patch.status === "publishing" ? 1 : 0),
      ...(patch.status === "live" ? { liveAt: Date.now() } : {}),
    });
    // A public post on a bounty video going live becomes a submission. dryRun and private posts never submit.
    if (patch.status === "live" && p.status !== "live" && p.mode === "public" && (await ctx.db.get(p.videoId))?.bountyId) {
      await ctx.scheduler.runAfter(0, internal.submit.forPost, { postId });
    }
  },
});

export const call = internalMutation({
  args: {
    userId: v.optional(v.id("users")), videoId: v.optional(v.id("videos")),
    service: v.string(), op: v.string(),
    status: v.union(v.literal("ok"), v.literal("error"), v.literal("skipped")),
    ms: v.number(), detail: v.optional(v.string()),
  },
  handler: async (ctx, row) => logCall(ctx, row),
});

export const savePublicUrl = internalMutation({
  args: { videoId: v.id("videos"), url: v.string() },
  handler: async (ctx, { videoId, url }) => ctx.db.patch(videoId, { publicUrl: { url, at: Date.now() } }),
});

async function zernio(ctx: ActionCtx, ids: { userId: any; videoId: any }, op: string, path: string, init: RequestInit) {
  const t0 = Date.now();
  const r = await fetch(`${ZERNIO}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.ZERNIO_API_KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await r.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  await ctx.runMutation(internal.post.call, {
    ...ids, service: "zernio", op, status: r.ok ? "ok" : "error", ms: Date.now() - t0,
    detail: `${init.method ?? "GET"} ${path} -> ${r.status} ${text.slice(0, 240)}`,
  });
  // Rate limits and server errors are worth another try. Callers retry with the same Idempotency-Key.
  if (r.status === 429 || r.status >= 500) throw new Error(`Zernio ${r.status}`);
  return { status: r.status, ok: r.ok, json };
}

function platformEntry(post: any, platform: string) {
  const list: any[] = post?.platforms ?? [];
  return list.find(x => x.platform === platform) ?? list[0];
}

export const publish = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }): Promise<unknown> => {
    const job = await ctx.runMutation(internal.post.begin, { postId });
    if (!job) return;
    const ids = { userId: job.userId, videoId: job.videoId };
    const done = (status: "live" | "failed" | "dry_run" | "skipped" | "publishing", extra: { url?: string; error?: string; providerId?: string } = {}): Promise<unknown> =>
      ctx.runMutation(internal.post.settle, { postId, status, ...extra });
    const skip = (detail: string) =>
      ctx.runMutation(internal.post.call, { ...ids, service: "zernio", op: `post ${job.platform}`, status: "skipped", ms: 0, detail });

    if (job.mode === "dryRun") { await skip("dry run: nothing sent"); return done("dry_run"); }
    if (job.mode === "private" && job.platform === "instagram") {
      await skip("Instagram has no private mode");
      return done("skipped", { error: "Instagram has no private mode" });
    }
    if (!process.env.ZERNIO_API_KEY) { await skip("ZERNIO_API_KEY not set"); return done("failed", { error: "Posting key missing" }); }
    if (!job.accountId) { await skip(`no ${job.platform} account linked`); return done("failed", { error: `No ${job.platform} account linked` }); }

    try {
      let mediaUrl = job.publicUrl;
      if (!mediaUrl) {
        const blob = await ctx.storage.get(job.storageId);
        if (!blob) return done("failed", { error: "Video file missing" });
        const pre = await zernio(ctx, ids, "media presign", "/media/presign", {
          method: "POST", body: JSON.stringify({ filename: `${job.videoId}.mp4`, contentType: "video/mp4", size: blob.size }),
        });
        if (!pre.ok || !pre.json?.uploadUrl) return done("failed", { error: `Upload link failed (${pre.status})` });
        const t0 = Date.now();
        const put = await fetch(pre.json.uploadUrl, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: blob });
        await ctx.runMutation(internal.post.call, {
          ...ids, service: "zernio", op: "media upload", status: put.ok ? "ok" : "error", ms: Date.now() - t0,
          detail: `PUT ${(blob.size / 1e6).toFixed(1)} MB -> ${put.status}`,
        });
        if (put.status === 429 || put.status >= 500) throw new Error(`Upload ${put.status}`);
        if (!put.ok) return done("failed", { error: `Upload failed (${put.status})` });
        mediaUrl = pre.json.publicUrl as string;
        await ctx.runMutation(internal.post.savePublicUrl, { videoId: job.videoId, url: mediaUrl });
      }

      const s = job.script;
      const platformSpecificData = job.platform === "youtube"
        ? { title: s.title.slice(0, 95), visibility: job.mode === "private" ? "private" : "public", containsSyntheticMedia: true, madeForKids: false }
        : { isAiGenerated: true, shareToFeed: true };
      const res = await zernio(ctx, ids, `post ${job.platform}`, "/posts", {
        method: "POST",
        headers: { "Idempotency-Key": postId },
        body: JSON.stringify({
          content: `${s.caption}\n\nMade with AI.`,
          mediaItems: [{ type: "video", url: mediaUrl }],
          platforms: [{ platform: job.platform, accountId: job.accountId, platformSpecificData }],
          publishNow: true,
          metadata: { postId, videoId: job.videoId },
        }),
      });
      const post = res.json?.post;
      const entry = platformEntry(post, job.platform);
      const providerId: string | undefined = post?._id ?? post?.id;
      if (!res.ok && res.status !== 207) {
        return done("failed", { error: res.json?.error?.message ?? res.json?.message ?? res.json?.error ?? `Zernio ${res.status}` });
      }
      if (entry?.platformPostUrl && entry.status !== "failed") return done("live", { url: entry.platformPostUrl, providerId });
      if (entry?.status === "failed" || post?.status === "failed") {
        return done("failed", { error: entry?.errorMessage ?? "Platform rejected the post", providerId });
      }
      await done("publishing", { providerId });
      await ctx.scheduler.runAfter(15_000, internal.post.check, { postId });
    } catch (e: any) {
      await ctx.runMutation(internal.post.call, { ...ids, service: "zernio", op: `post ${job.platform}`, status: "error", ms: 0, detail: String(e?.message ?? e) });
      // Zernio keys the post on Idempotency-Key, so sending again can't post twice.
      await ctx.runMutation(internal.post.retry, { postId, error: String(e?.message ?? e) });
    }
  },
});

export const retry = internalMutation({
  args: { postId: v.id("posts"), error: v.string() },
  handler: async (ctx, { postId, error }) => {
    const p = await ctx.db.get(postId);
    if (!p || p.status !== "publishing") return;
    if (p.checks >= 3) return ctx.db.patch(postId, { status: "failed", error: error.slice(0, 200) });
    await ctx.db.patch(postId, { status: "queued", checks: p.checks + 1, error: error.slice(0, 200) });
    await ctx.scheduler.runAfter(15_000, internal.post.publish, { postId });
  },
});

export const getForCheck = internalMutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const p = await ctx.db.get(postId);
    return p && p.status === "publishing" ? p : null;
  },
});

// Poll Zernio until the platform reports a URL. Webhooks replace this on the cloud deployment.
export const check = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }): Promise<unknown> => {
    const p = await ctx.runMutation(internal.post.getForCheck, { postId });
    if (!p || !process.env.ZERNIO_API_KEY) return;
    const ids = { userId: p.userId, videoId: p.videoId };
    if (!p.providerId) return;
    let res: Awaited<ReturnType<typeof zernio>> | null = null;
    try {
      res = await zernio(ctx, ids, `status ${p.platform}`, `/posts/${p.providerId}`, { method: "GET" });
    } catch { /* network error, 429 or 5xx: the next check tries again */ }
    const post = res?.json?.post ?? res?.json;
    const entry = platformEntry(post, p.platform);
    if (entry?.platformPostUrl && entry.status !== "failed") {
      return ctx.runMutation(internal.post.settle, { postId, status: "live", url: entry.platformPostUrl });
    }
    if (entry?.status === "failed") {
      return ctx.runMutation(internal.post.settle, { postId, status: "failed", error: entry.errorMessage ?? "Platform rejected the post" });
    }
    // 15 s at first, then every minute, then every 30 minutes for the rest of a day.
    if (p.checks >= 88) {
      return ctx.runMutation(internal.post.settle, { postId, status: "failed", error: "Zernio gave no answer for a day. Check the platform." });
    }
    await ctx.scheduler.runAfter(p.checks < 10 ? 15_000 : p.checks < 40 ? 60_000 : 30 * 60_000, internal.post.check, { postId });
    await ctx.runMutation(internal.post.settle, { postId, status: "publishing" });
  },
});
