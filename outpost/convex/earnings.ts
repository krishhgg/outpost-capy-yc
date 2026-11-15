import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { DAY_MS, livePosts, userFor } from "./lib";

// Estimated earnings and the taste score, from real rows only: live posts and their view counts, submissions and the
// statuses Whop gave them, and the user's swipes. Nothing here is stored, so every number traces back to a row.

type Status = Doc<"submissions">["status"];
type Verdict = "hit" | "solid" | "miss";

// A video beats its baseline by this much to be a Hit, and falls short of it below MISS.
const HIT = 1.5;
const MISS = 0.8;
// A post is scored once it has a view count, has been live this long, and has a baseline to compare with.
const MIN_AGE_MS = 2 * 60 * 60 * 1000;
// Earlier counted posts the baseline needs, when no account baseline is set.
const MIN_EARLIER = 2;
// Scored posts before the score stops being provisional.
const NEEDED = 5;
// Swipes before pickiness gives a provisional score.
const MIN_SWIPES = 3;
// Posts younger than this are graded "so far": views still climb for a day or two.
const SETTLE_MS = 2 * DAY_MS;

// Taste tiers, named as in src/ui (T14) so they don't collide with the village's Scout and Director.
const TIERS = [
  { name: "Settler", min: 0 },
  { name: "Curator", min: 40 },
  { name: "Showrunner", min: 60 },
  { name: "Tastemaker", min: 80 },
];

type Item = {
  videoId: Id<"videos">;
  bountyId: Id<"bounties"> | null;
  title: string;
  liveAt: number;
  views: number;
  counted: boolean;
  url: string | null;
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Each video against the median of the user's earlier counted videos, or the account baseline when a builder set one.
// Only videos live at `at` count, so the same function gives the score as it stood earlier. Views are today's counts.
function grade(items: Item[], at: number, accountBaseline: number | null) {
  const live = items.filter(i => i.liveAt <= at).sort((a, b) => a.liveAt - b.liveAt);
  return live.map((item, i) => {
    const earlier = live.slice(0, i).filter(e => e.counted).map(e => e.views);
    const baseline = accountBaseline ?? (earlier.length >= MIN_EARLIER ? median(earlier) : null);
    const scored = item.counted && baseline !== null && at - item.liveAt >= MIN_AGE_MS;
    // Plus one on both sides, so a baseline of 0 views still compares.
    const ratio = scored ? (item.views + 1) / (baseline! + 1) : null;
    const verdict: Verdict | null = ratio === null ? null : ratio >= HIT ? "hit" : ratio >= MISS ? "solid" : "miss";
    return { ...item, baseline, ratio, verdict, early: at - item.liveAt < SETTLE_MS };
  });
}

// Healthy pickiness approves 20-50% of clips. Approving everything or nothing scores low.
function pickScore(share: number) {
  const p = share * 100;
  if (p < 20) return 30 + 30 * (p / 20);
  if (p <= 50) return 70 - Math.abs(p - 35) * (10 / 15);
  return 60 - 30 * ((p - 50) / 50);
}

type Inputs = { items: Item[]; swipes: Doc<"swipes">[]; submissions: Doc<"submissions">[]; accountBaseline: number | null };

// The taste score as it stood at `at`: scaled(approval rate x performance). Performance is the median of the scored
// videos' views over their baselines; the approval rate is Whop-approved over settled submissions, left out until Whop
// settles one. Until NEEDED videos are scored the score is provisional: pickiness, blended with the videos scored so far.
function tasteAt({ items, swipes, submissions, accountBaseline }: Inputs, at: number) {
  const graded = grade(items, at, accountBaseline);
  const scored = graded.filter(g => g.ratio !== null);
  const hits = scored.filter(g => g.verdict === "hit").length;
  const settled = submissions.filter(s => (s.status === "approved" || s.status === "denied") && (s.resolvedAt ?? 0) <= at);
  const approvedSubs = settled.filter(s => s.status === "approved").length;
  const approvalRate = settled.length ? approvedSubs / settled.length : null;
  const seen = swipes.filter(s => s.at <= at);
  const approvedClips = seen.filter(s => s.dir === "right").length;
  const pickiness = seen.length ? approvedClips / seen.length : null;

  const perf = scored.length ? median(scored.map(g => g.ratio!)) * (approvalRate ?? 1) : null;
  const perfScore = perf === null ? null : (100 * perf) / (perf + 1);
  const pick = pickiness !== null && seen.length >= MIN_SWIPES ? pickScore(pickiness) : null;
  const n = scored.length;
  const raw = n >= NEEDED ? perfScore
    : perfScore !== null && pick !== null ? (pick * (NEEDED - n) + perfScore * n) / NEEDED
    : perfScore ?? pick;
  return {
    graded, score: raw === null ? null : Math.max(0, Math.min(100, Math.round(raw))), provisional: n < NEEDED, scored: n,
    hits, approvalRate, approvedSubs, settledSubs: settled.length, pickiness, approvedClips, seenClips: seen.length,
  };
}

function tierOf(score: number) {
  let i = 0;
  while (i + 1 < TIERS.length && score >= TIERS[i + 1].min) i++;
  const next = TIERS[i + 1] ?? null;
  return { name: TIERS[i].name, min: TIERS[i].min, rank: i, next, progress: next ? (score - TIERS[i].min) / (next.min - TIERS[i].min) : 1 };
}

// Content Rewards pays per 1K views above a minimum, up to a cap per clip. A per-submission bounty pays its reward.
function estimate(b: Doc<"bounties">, views: number) {
  if (b.rewardKind === "per_submission") return b.rewardCents ?? 0;
  if (!b.ratePer1kCents || views < (b.minViews ?? 0)) return 0;
  const cents = Math.floor((views * b.ratePer1kCents) / 1000);
  return b.maxPerClipCents !== undefined ? Math.min(cents, b.maxPerClipCents) : cents;
}

// A video's posts can carry several submissions; the one furthest along speaks for it.
const ORDER: Status[] = ["approved", "submitted", "pending", "manual", "denied", "failed"];

export const summary = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const now = Date.now();
    const live = await livePosts(ctx, user._id);
    const submissions = await ctx.db.query("submissions").withIndex("by_user", q => q.eq("userId", user._id)).collect();
    const swipes = await ctx.db.query("swipes").withIndex("by_user_day", q => q.eq("userId", user._id)).collect();
    const subByPost = new Map(submissions.map(s => [s.postId, s]));
    const bounties = new Map<Id<"bounties">, Doc<"bounties"> | null>();
    const bountyOf = async (id: Id<"bounties">) => {
      if (!bounties.has(id)) bounties.set(id, await ctx.db.get(id));
      return bounties.get(id)!;
    };

    // One item per video, its platforms' views summed.
    const items = new Map<Id<"videos">, Item>();
    for (const p of live) {
      let item = items.get(p.videoId);
      if (!item) {
        const video = await ctx.db.get(p.videoId);
        item = {
          videoId: p.videoId, bountyId: video?.bountyId ?? null, title: video?.script?.hook ?? "",
          liveAt: p.liveAt ?? p.slotAt, views: 0, counted: false, url: p.url ?? null,
        };
        items.set(p.videoId, item);
      }
      item.views += p.views;
      item.counted ||= p.viewsAt !== undefined || p.views > 0;
      item.liveAt = Math.min(item.liveAt, p.liveAt ?? p.slotAt);
      item.url ??= p.url ?? null;
    }

    // Earnings per submitted post: approved counts as approved, denied and failed as nothing, the rest as pending.
    let pendingCents = 0;
    let approvedCents = 0;
    const money = new Map<Id<"videos">, { estCents: number; statuses: Status[]; url: string | null }>();
    for (const p of live) {
      const item = items.get(p.videoId)!;
      if (!item.bountyId) continue;
      const row = money.get(p.videoId) ?? { estCents: 0, statuses: [], url: null };
      money.set(p.videoId, row);
      const sub = subByPost.get(p._id);
      if (!sub) continue;
      row.statuses.push(sub.status);
      row.url ??= sub.url;
      const bounty = await bountyOf(item.bountyId);
      if (!bounty || sub.status === "denied" || sub.status === "failed") continue;
      const cents = estimate(bounty, p.views);
      row.estCents += cents;
      if (sub.status === "approved") approvedCents += cents;
      else pendingCents += cents;
    }

    const inputs = { items: [...items.values()], swipes, submissions, accountBaseline: user.baselineViews ?? null };
    const taste = tasteAt(inputs, now);
    const dayAgo = tasteAt(inputs, now - DAY_MS);
    const seenAt = user.seen?.at ?? user.createdAt;
    const atSeen = tasteAt(inputs, seenAt);
    const graded = new Map(taste.graded.map(g => [g.videoId, g]));

    const perVideo = [];
    for (const [videoId, row] of money) {
      const item = items.get(videoId)!;
      const g = graded.get(videoId);
      perVideo.push({
        videoId, bountyId: item.bountyId!, brand: (await bountyOf(item.bountyId!))?.brand ?? "",
        url: row.url ?? item.url, views: item.views, estCents: row.estCents,
        status: ORDER.find(s => row.statuses.includes(s)) ?? null,
        title: item.title, liveAt: item.liveAt, verdict: g?.verdict ?? null, ratio: g?.ratio ?? null,
      });
    }
    perVideo.sort((a, b) => b.liveAt - a.liveAt);

    // Every live video, newest first, with its verdict. `early` means under two days old, so it is graded so far.
    const posts = taste.graded.slice().reverse().map(g => ({
      videoId: g.videoId, title: g.title, liveAt: g.liveAt, views: g.views, counted: g.counted, url: g.url,
      baseline: g.baseline, ratio: g.ratio, verdict: g.verdict, early: g.early,
    }));
    // The Away card's best and worst post: graded videos by ratio, or counted ones by views before any are graded.
    const gradedPosts = posts.filter(p => p.ratio !== null).sort((a, b) => b.ratio! - a.ratio!);
    const ranked = gradedPosts.length ? gradedPosts : posts.filter(p => p.counted).sort((a, b) => b.views - a.views);

    const score = taste.score;
    return {
      pendingCents,
      approvedCents,
      perVideo,
      tasteScore: score ?? 0,
      tasteTrend: score !== null && dayAgo.score !== null ? score - dayAgo.score : 0,
      // Videos scored against a baseline: what moves the score out of calibrating.
      settledCount: taste.scored,
      taste: {
        // empty: nothing to score yet. calibrating: a provisional score. scored: NEEDED videos scored.
        state: score === null ? ("empty" as const) : taste.provisional ? ("calibrating" as const) : ("scored" as const),
        score,
        tier: score === null ? null : tierOf(score),
        scored: taste.scored,
        needed: NEEDED,
        hits: taste.hits,
        hitRate: taste.scored ? taste.hits / taste.scored : null,
        approvalRate: taste.approvalRate,
        approvedSubmissions: taste.approvedSubs,
        settledSubmissions: taste.settledSubs,
        pickiness: taste.pickiness,
        approvedClips: taste.approvedClips,
        seenClips: taste.seenClips,
        baselineFrom: user.baselineViews !== undefined ? ("account" as const) : ("earlier posts" as const),
      },
      posts,
      away: {
        since: seenAt,
        scoreFrom: atSeen.score,
        scoreTo: score,
        best: ranked[0] ?? null,
        worst: ranked.length > 1 ? ranked[ranked.length - 1] : null,
      },
    };
  },
});
