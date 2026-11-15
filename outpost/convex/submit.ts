import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, query, type ActionCtx, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { ownVideo, userFor } from "./lib";
import { WHOP_API, accessToken } from "./whopAuth";

// Scheduled from post.settle when a public post on a bounty video goes live; dryRun and private posts never get here.
// A Content Rewards campaign has no submit API, so its row is `manual`: the user taps "Submit on Whop", pastes the
// post URL there, then confirms with markSubmitted. A Whop Bounty row starts `pending` and Outpost submits it itself
// with POST /bounty_submissions and the user's Whop OAuth token; the poll cron then reads its review status.
//
// A pending row with no token, or whose call failed in a way worth retrying (network, 401, 429, 5xx), stays pending
// with a short `error` the You tab shows, and every poll retries it. Whop refusing the submission (any other 4xx,
// such as one open submission per Whop account) turns it `manual` with Whop's message, so the user can still
// submit by hand.
export const forPost = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }): Promise<null> => {
    const id = await ctx.runMutation(internal.submit.record, { postId });
    if (id) await send(ctx, id);
    return null;
  },
});

// One submission per post, created once. dryRun and private posts never submit. Returns the row to auto-submit.
export const record = internalMutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }): Promise<Id<"submissions"> | null> => {
    const post = await ctx.db.get(postId);
    if (!post || post.status !== "live" || post.mode !== "public" || !post.url) return null;
    if (await ctx.db.query("submissions").withIndex("by_post", q => q.eq("postId", postId)).first()) return null;
    const video = await ctx.db.get(post.videoId);
    const bounty = video?.bountyId && await ctx.db.get(video.bountyId);
    if (!video || !bounty) return null;
    const auto = bounty.source === "whop_bounty";
    const id = await ctx.db.insert("submissions", {
      userId: post.userId, bountyId: bounty._id, videoId: video._id, postId, url: post.url, status: auto ? "pending" : "manual", checks: 0,
    });
    return auto ? id : null;
  },
});

// What send needs for a pending Whop Bounty row, or null when there is nothing to send.
export const job = internalQuery({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, { submissionId }) => {
    const s = await ctx.db.get(submissionId);
    if (!s || s.status !== "pending" || s.externalId) return null;
    const [bounty, post] = await Promise.all([ctx.db.get(s.bountyId), ctx.db.get(s.postId)]);
    if (bounty?.source !== "whop_bounty" || post?.mode !== "public" || post.status !== "live") return null;
    return { userId: s.userId, videoId: s.videoId, postId: s.postId, url: s.url, bountyId: bounty.externalId };
  },
});

const STATUS = { in_progress: "submitted", submitted: "submitted", approved: "approved", denied: "denied" } as const;
const statusOf = (whop: unknown): (typeof STATUS)[keyof typeof STATUS] | undefined => STATUS[whop as keyof typeof STATUS];

export const NOT_CONNECTED = "Submits once Whop is connected";
const RETRYING = "Whop didn't answer. Retrying";

// Moves a row and counts the check. A null error clears it.
export const apply = internalMutation({
  args: {
    submissionId: v.id("submissions"),
    status: v.optional(v.union(v.literal("pending"), v.literal("submitted"), v.literal("approved"), v.literal("denied"), v.literal("manual"))),
    externalId: v.optional(v.string()),
    error: v.optional(v.union(v.string(), v.null())),
    denialReason: v.optional(v.string()),
  },
  handler: async (ctx, { submissionId, status, externalId, error, denialReason }) => {
    const s = await ctx.db.get(submissionId);
    if (!s) return;
    const now = Date.now();
    await ctx.db.patch(submissionId, {
      checks: s.checks + 1,
      ...(status ? { status } : {}),
      ...(externalId ? { externalId } : {}),
      ...(error !== undefined ? { error: error?.slice(0, 200) ?? undefined } : {}),
      ...(denialReason ? { denialReason: denialReason.slice(0, 300) } : {}),
      ...(status === "submitted" && !s.submittedAt ? { submittedAt: now } : {}),
      ...((status === "approved" || status === "denied") && !s.resolvedAt ? { resolvedAt: now, submittedAt: s.submittedAt ?? now } : {}),
    });
  },
});

async function whop(ctx: ActionCtx, ids: { userId: Id<"users">; videoId?: Id<"videos"> }, op: string, path: string, init: RequestInit & { token: string }) {
  const { token, ...rest } = init;
  const t0 = Date.now();
  let status = 0;
  let json: any = null;
  try {
    const r = await fetch(`${WHOP_API}/api/v1${path}`, {
      ...rest, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(rest.headers ?? {}) },
    });
    status = r.status;
    json = await r.json().catch(() => null);
  } catch (e) {
    json = { error: { message: String(e) } };
  }
  const ok = status >= 200 && status < 300;
  const message = ok ? "" : String(json?.error?.message ?? json?.message ?? json?.error ?? `HTTP ${status}`);
  await ctx.runMutation(internal.post.call, {
    ...ids, service: "whop", op, status: ok ? "ok" : "error", ms: Date.now() - t0,
    detail: ok ? (json?.id ? `${json.id} ${json.status ?? ""}` : undefined) : `${status} ${message}`,
  });
  return { ok, status, json, message };
}

const transient = (status: number) => status === 0 || status === 401 || status === 408 || status === 429 || status >= 500;

// Submits one pending Whop Bounty row. The post id is the Idempotency-Key, so a retry never submits twice.
async function send(ctx: ActionCtx, submissionId: Id<"submissions">) {
  const j = await ctx.runQuery(internal.submit.job, { submissionId });
  if (!j) return;
  let token: string | null;
  try {
    token = await accessToken(ctx);
  } catch {
    await ctx.runMutation(internal.submit.apply, { submissionId, error: RETRYING });
    return;
  }
  if (!token) {
    await ctx.runMutation(internal.submit.apply, { submissionId, error: NOT_CONNECTED });
    return;
  }
  const r = await whop(ctx, { userId: j.userId, videoId: j.videoId }, "bounty_submissions.create", "/bounty_submissions", {
    token, method: "POST", headers: { "Idempotency-Key": j.postId },
    body: JSON.stringify({ bounty_id: j.bountyId, deliverable: { urls: [j.url] } }),
  });
  if (r.ok && typeof r.json?.id === "string") {
    await ctx.runMutation(internal.submit.apply, {
      submissionId, status: statusOf(r.json.status) ?? "submitted", externalId: r.json.id, error: null,
      denialReason: r.json.denial_reason ?? undefined,
    });
  } else if (!r.ok && !transient(r.status)) {
    await ctx.runMutation(internal.submit.apply, { submissionId, status: "manual", error: `Whop refused: ${r.message}` });
  } else {
    await ctx.runMutation(internal.submit.apply, { submissionId, error: RETRYING });
  }
}

// Rows the poll works on: pending Whop Bounty rows to (re)send, and submitted rows Whop is reviewing.
export const open = internalQuery({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db.query("submissions").withIndex("by_status", q => q.eq("status", "pending")).take(25);
    const submitted = (await ctx.db.query("submissions").withIndex("by_status", q => q.eq("status", "submitted")).take(100))
      .filter(s => s.externalId);
    const reviewing = [];
    for (const s of submitted) {
      const bounty = await ctx.db.get(s.bountyId);
      if (bounty?.source === "whop_bounty") reviewing.push({ id: s._id, userId: s.userId, externalId: s.externalId!, bountyId: bounty.externalId });
    }
    return { pending: pending.map(s => s._id), reviewing };
  },
});

// Cron, every 10 minutes, and right after the demo Whop login connects. Sends pending rows, then reads each reviewed
// row's status from GET /bounty_submissions?bounty_id=, one call per bounty, and settles approved or denied.
export const poll = internalAction({
  args: {},
  handler: async (ctx): Promise<null> => {
    const { pending, reviewing } = await ctx.runQuery(internal.submit.open, {});
    for (const id of pending) await send(ctx, id);
    const groups = new Map<string, typeof reviewing>();
    for (const r of reviewing) {
      groups.set(r.bountyId, [...(groups.get(r.bountyId) ?? []), r]);
    }
    const token = groups.size ? await accessToken(ctx).catch(() => null) : null;
    if (!token) return null;
    for (const [bountyId, rows] of groups) {
      const r = await whop(ctx, { userId: rows[0].userId }, "bounty_submissions.list", `/bounty_submissions?${new URLSearchParams({ bounty_id: bountyId, first: "100" })}`, { token });
      if (!r.ok) continue;
      const byId = new Map<string, any>((r.json?.data ?? []).map((d: any) => [d.id, d]));
      for (const row of rows) {
        const d = byId.get(row.externalId);
        const status = d && statusOf(d.status);
        await ctx.runMutation(internal.submit.apply, {
          submissionId: row.id, ...(status && status !== "submitted" ? { status } : {}),
          denialReason: typeof d?.denial_reason === "string" ? d.denial_reason : undefined,
        });
      }
    }
    return null;
  },
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

// The video's submission status and the "Submit on Whop" deep link (the campaign or bounty page), or null when it has
// none. postUrl is what the user pastes on Whop. selfReported marks a `submitted` the user confirmed, which Outpost
// can't check. auto marks a Whop Bounty, which Outpost submits itself; note is why it is waiting or fell back to manual.
export const forVideo = query({
  args: { deviceId: v.string(), videoId: v.id("videos") },
  handler: async (ctx, { deviceId, videoId }): Promise<{
    status: Doc<"submissions">["status"];
    deepLink: string;
    denialReason: string | null;
    postUrl: string;
    brand: string;
    selfReported: boolean;
    auto: boolean;
    note: string | null;
  } | null> => {
    await ownVideo(ctx, await userFor(ctx, deviceId), videoId);
    const s = await current(ctx, videoId);
    const bounty = s && await ctx.db.get(s.bountyId);
    if (!s || !bounty) return null;
    return {
      status: s.status, deepLink: bounty.url, denialReason: s.denialReason ?? null,
      postUrl: s.url, brand: bounty.brand, selfReported: s.status === "submitted" && !s.externalId,
      auto: bounty.source === "whop_bounty", note: s.error ?? null,
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

// Builder-only: sends a Whop Bounty row back to pending, for example after the user's open submission on that
// bounty was resolved. The next poll submits it.
//   npx convex run submit:retry '{"submissionId":"<submissions id>"}'
export const retry = internalMutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, { submissionId }) => {
    const s = await ctx.db.get(submissionId);
    if (!s || s.externalId || (s.status !== "manual" && s.status !== "failed")) return null;
    await ctx.db.patch(submissionId, { status: "pending", error: undefined });
    await ctx.scheduler.runAfter(0, internal.submit.poll, {});
    return null;
  },
});
