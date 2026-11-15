import { ConvexError, v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, query, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { userFor } from "./lib";

// The Scout searches the public Whop marketplace (no key needed) for paid products in the user's niche. Each find
// becomes a card in the Feed. Swipe right and the studio makes the next video about that topic.

const WHOP = "https://api.whop.com/api/v1";
const SEARCHES: Record<string, string[]> = {
  "Notion templates for freelancers": ["invoice", "freelancer", "client management", "notion freelance"],
};
const EVERY_MS = 6 * 60 * 60_000; // a fresh search at most every 6 hours
const KEEP = 8; // new finds saved per search

// Starts a search when the user is down to their last find and the last search is old enough.
export async function scoutIfLow(ctx: MutationCtx, user: Doc<"users">) {
  const left = await ctx.db.query("finds").withIndex("by_user_status", q => q.eq("userId", user._id).eq("status", "new")).take(2);
  if (left.length >= 2 || Date.now() - (user.scoutAt ?? 0) < EVERY_MS) return;
  await ctx.db.patch(user._id, { scoutAt: Date.now() });
  await ctx.scheduler.runAfter(0, internal.scout.search, { userId: user._id });
}

type Hit = Omit<Doc<"finds">, "_id" | "_creationTime" | "userId" | "status" | "at">;

export const search = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }): Promise<void> => {
    const niche = await ctx.runQuery(internal.scout.nicheOf, { userId });
    const queries = SEARCHES[niche] ?? [niche];
    const t0 = Date.now();
    const hits = new Map<string, Hit>();
    let seen = 0;
    const errors: string[] = [];
    for (const q of queries) {
      try {
        const r = await fetch(`${WHOP}/products?query=${encodeURIComponent(q)}&first=50`, { headers: { "Api-Version-Date": "2026-11-12" } });
        if (!r.ok) { errors.push(`"${q}" ${r.status}`); continue; }
        const items: any[] = (await r.json())?.data ?? [];
        seen += items.length;
        for (const p of items) {
          const variant = p.default_variant ?? {};
          const price = Number(variant.initial_price?.amount ?? 0);
          const renewal = Number(variant.renewal_price?.amount ?? 0);
          // Only products people pay for, priced in dollars like the card shows. Free ones say nothing about what sells.
          const usd = (variant.renewal_price ?? variant.initial_price)?.currency === "usd";
          if (!(price > 0 || renewal > 0) || !usd || hits.has(p.id) || typeof p.title !== "string") continue;
          // A subscription shows what it costs each period, anything else what it costs once.
          const renews = variant.billing_type === "renewal";
          const days = Number(variant.billing_period);
          hits.set(p.id, {
            whopId: p.id, title: p.title.slice(0, 120), headline: String(p.headline ?? "").slice(0, 160),
            priceCents: Math.round((renews ? renewal || price : price || renewal) * 100), renews,
            everyDays: renews && days > 0 ? days : undefined,
            members: Number(p.member_count) || 0, rating: Number(p.average_review_rating) || 0, reviews: Number(p.published_reviews_count) || 0,
            image: (p.gallery_images ?? []).find((g: any) => String(g.content_type).startsWith("image/"))?.url, query: q,
          });
        }
      } catch (e) {
        errors.push(`"${q}" ${String(e).slice(0, 60)}`);
      }
    }
    // Most members first, then the better rated. The marketplace can't sort a search this way itself.
    const ranked = [...hits.values()].sort((a, b) => b.members - a.members || b.rating - a.rating || (b.image ? 1 : 0) - (a.image ? 1 : 0));
    const added = await ctx.runMutation(internal.scout.save, { userId, hits: ranked });
    await ctx.runMutation(internal.post.call, {
      userId, service: "whop", op: "marketplace search", status: errors.length && !seen ? "error" : "ok", ms: Date.now() - t0,
      detail: `GET /products for ${queries.map(q => `"${q}"`).join(", ")} · ${seen} results · ${hits.size} paid · ${added} new finds${errors.length ? ` · failed: ${errors.join(", ")}` : ""}`,
    });
  },
});

export const nicheOf = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => (await ctx.db.get(userId))?.niche ?? "",
});

const hit = v.object({
  whopId: v.string(), title: v.string(), headline: v.string(), priceCents: v.number(), renews: v.boolean(), everyDays: v.optional(v.number()),
  members: v.number(), rating: v.number(), reviews: v.number(), image: v.optional(v.string()), query: v.string(),
});

// Keeps the best few the user hasn't been shown yet.
export const save = internalMutation({
  args: { userId: v.id("users"), hits: v.array(hit) },
  handler: async (ctx, { userId, hits }) => {
    let added = 0;
    for (const h of hits) {
      if (added >= KEEP) break;
      const had = await ctx.db.query("finds").withIndex("by_user_whop", q => q.eq("userId", userId).eq("whopId", h.whopId)).first();
      if (had) continue;
      await ctx.db.insert("finds", { ...h, userId, status: "new", at: Date.now() });
      added++;
    }
    return added;
  },
});

// The best find the user hasn't swiped yet.
export const next = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const rows = await ctx.db.query("finds").withIndex("by_user_status", q => q.eq("userId", user._id).eq("status", "new")).take(50);
    const f = rows.sort((a, b) => b.members - a.members || b.rating - a.rating)[0];
    if (!f) return null;
    return {
      id: f._id, title: f.title, headline: f.headline, priceCents: f.priceCents, renews: f.renews, everyDays: f.everyDays ?? null,
      members: f.members, rating: f.rating, reviews: f.reviews, image: f.image ?? null, query: f.query,
    };
  },
});

export const swipe = mutation({
  args: { deviceId: v.string(), findId: v.id("finds"), dir: v.union(v.literal("right"), v.literal("left")) },
  handler: async (ctx, { deviceId, findId, dir }) => {
    const user = await userFor(ctx, deviceId);
    const find = await ctx.db.get(findId);
    if (!find || find.userId !== user._id) throw new ConvexError("not your find");
    if (find.status !== "new") return { ok: false };
    await ctx.db.patch(findId, { status: dir });
    if (dir === "right") {
      // Lands just after the third card still waiting, like a remake, so it shows up soon.
      const ready = await ctx.db.query("videos")
        .withIndex("by_user_status_rank", q => q.eq("userId", user._id).eq("status", "ready")).take(4);
      const now = Date.now();
      const rank = ready.length >= 4 ? (ready[2].rank + ready[3].rank) / 2 : (ready.at(-1)?.rank ?? now) + 0.5;
      await ctx.db.insert("videos", { userId: user._id, status: "queued", rank, findId, attempts: 0, createdAt: now });
    }
    await scoutIfLow(ctx, user);
    return { ok: true };
  },
});
