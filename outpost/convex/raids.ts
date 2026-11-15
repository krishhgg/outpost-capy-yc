import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { logCall, userFor } from "./lib";

const GOAL_CENTS = 2500;
const WATCH_MS = 10 * 60 * 1000;
export const POLL_MS = 4000;

export const whopIsTest = () => process.env.WHOP_ENV !== "production";

// The shop raid's product, for the demo only.
export const SHOP_PRODUCT = {
  title: "Notion Client Invoice Template",
  headline: "Send clean invoices and see who paid, all in one Notion page.",
  description: "A Notion template for freelancers: an invoice page you duplicate per client, a payments tracker, and a reminder list for late invoices.",
  priceCents: 900,
};

const STEPS = [
  { key: "product", label: "Product made on Whop" },
  { key: "checkout", label: "Checkout link live" },
  { key: "alerts", label: "Sale alerts on" },
];

// Star 1 is halfway to the goal, star 2 the first sale, star 3 the full goal. Each lights on its own.
export function starsFor(netCents: number, sales: number, goalCents: number) {
  return [netCents >= goalCents / 2, sales >= 1, netCents >= goalCents];
}

async function latestRaid(ctx: { db: any }, userId: Id<"users">): Promise<Doc<"raids"> | null> {
  return await ctx.db.query("raids").withIndex("by_user", (q: any) => q.eq("userId", userId)).order("desc").first();
}

export const start = mutation({
  args: { deviceId: v.string(), kind: v.literal("shop") },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const have = await latestRaid(ctx, user._id);
    if (have && have.status !== "failed") return have._id;
    const now = Date.now();
    const raidId = await ctx.db.insert("raids", {
      userId: user._id, kind: "shop", status: "setting_up", test: whopIsTest(),
      goalCents: GOAL_CENTS, netCents: 0, sales: 0, stars: [false, false, false],
      steps: STEPS.map(s => ({ ...s, state: "todo" as const })),
      watchUntil: 0, pollGen: 0, startedAt: now,
    });
    const offerId = await ctx.db.insert("offers", {
      userId: user._id, raidId, title: SHOP_PRODUCT.title, priceCents: SHOP_PRODUCT.priceCents,
    });
    await ctx.db.patch(raidId, { offerId });
    await ctx.scheduler.runAfter(0, internal.whop.setup, { raidId });
    return raidId;
  },
});

// Runs setup again after a failed step, for example once the Whop key is in.
export const retry = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const raid = await latestRaid(ctx, user._id);
    // Only a step in error can be retried. This call clears the errors, so a repeat tap or a call during setup does nothing.
    if (!raid || raid.status === "live" || !raid.steps.some(s => s.state === "error")) return;
    await ctx.db.patch(raid._id, { status: "setting_up", steps: raid.steps.map(s => s.state === "error" ? { ...s, state: "todo" as const, note: undefined } : s) });
    await ctx.scheduler.runAfter(0, internal.whop.setup, { raidId: raid._id });
  },
});

// The Base calls this while it is on screen, so payments show within seconds even without a webhook.
export const watch = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const raid = await latestRaid(ctx, user._id);
    if (!raid || raid.status !== "live") return;
    const now = Date.now();
    if (raid.watchUntil > now) {
      await ctx.db.patch(raid._id, { watchUntil: now + WATCH_MS });
      return;
    }
    const pollGen = raid.pollGen + 1;
    await ctx.db.patch(raid._id, { watchUntil: now + WATCH_MS, pollGen });
    await ctx.scheduler.runAfter(0, internal.whop.poll, { raidId: raid._id, gen: pollGen });
  },
});

export const mine = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const raid = await latestRaid(ctx, user._id);
    const ledger = await ctx.db.query("ledger").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").collect();
    const vault = {
      earnedCents: ledger.filter(l => !l.test).reduce((n, l) => n + l.netCents, 0), // test sales never count
      sales: ledger.filter(l => !l.test).length,
      testSales: ledger.filter(l => l.test).length,
    };
    if (!raid) return { raid: null, vault };
    const offer = raid.offerId ? await ctx.db.get(raid.offerId) : null;
    return {
      vault,
      raid: {
        id: raid._id, kind: raid.kind, status: raid.status, test: raid.test,
        goalCents: raid.goalCents, netCents: raid.netCents, sales: raid.sales, stars: raid.stars,
        steps: raid.steps, firstSaleAt: raid.firstSaleAt ?? null,
        offer: offer ? { title: offer.title, priceCents: offer.priceCents, purchaseUrl: offer.purchaseUrl ?? null } : null,
        recent: ledger.filter(l => l.raidId === raid._id).slice(0, 5).map(l => ({ netCents: l.netCents, grossCents: l.grossCents, at: l.at, via: l.via, test: l.test })),
      },
    };
  },
});

// ---- internal, used by whop.ts and http.ts ----

export const forSetup = internalQuery({
  args: { raidId: v.id("raids") },
  handler: async (ctx, { raidId }) => {
    const raid = await ctx.db.get(raidId);
    const offer = raid?.offerId ? await ctx.db.get(raid.offerId) : null;
    return raid && offer ? { raid, offer } : null;
  },
});

export const setStep = internalMutation({
  args: { raidId: v.id("raids"), key: v.string(), state: v.union(v.literal("todo"), v.literal("done"), v.literal("error")), note: v.optional(v.string()) },
  handler: async (ctx, { raidId, key, state, note }) => {
    const raid = await ctx.db.get(raidId);
    if (!raid) return;
    const steps = raid.steps.map(s => s.key === key ? { ...s, state, note: note?.slice(0, 120) } : s);
    const live = steps.every(s => s.state === "done");
    await ctx.db.patch(raidId, { steps, ...(live ? { status: "live" as const } : {}) });
    if (live && raid.status !== "live") {
      // Start watching for payments right away.
      await ctx.db.patch(raidId, { watchUntil: Date.now() + WATCH_MS, pollGen: raid.pollGen + 1 });
      await ctx.scheduler.runAfter(0, internal.whop.poll, { raidId, gen: raid.pollGen + 1 });
    }
  },
});

export const saveOffer = internalMutation({
  args: { offerId: v.id("offers"), whopProductId: v.optional(v.string()), checkoutId: v.optional(v.string()), purchaseUrl: v.optional(v.string()) },
  handler: async (ctx, { offerId, ...patch }) => ctx.db.patch(offerId, patch),
});

export const pollNext = internalMutation({
  args: { raidId: v.id("raids"), gen: v.number() },
  handler: async (ctx, { raidId, gen }) => {
    const raid = await ctx.db.get(raidId);
    if (!raid || raid.pollGen !== gen || raid.watchUntil < Date.now()) return;
    await ctx.scheduler.runAfter(POLL_MS, internal.whop.poll, { raidId, gen });
  },
});

const cents = (amount?: string | null) => amount ? Math.round(parseFloat(amount) * 100) : 0;

// One payment, from the webhook or the poll. The payment id dedupes both paths.
export const recordPayment = internalMutation({
  args: {
    paymentId: v.string(), productId: v.optional(v.string()), checkoutId: v.optional(v.string()),
    total: v.optional(v.string()), net: v.optional(v.string()), via: v.union(v.literal("webhook"), v.literal("poll")),
  },
  handler: async (ctx, a) => {
    if (await ctx.db.query("ledger").withIndex("by_external", q => q.eq("externalId", a.paymentId)).unique()) return { dup: true };
    const offer =
      (a.checkoutId ? await ctx.db.query("offers").withIndex("by_checkout", q => q.eq("checkoutId", a.checkoutId)).first() : null) ??
      (a.productId ? await ctx.db.query("offers").withIndex("by_product", q => q.eq("whopProductId", a.productId)).first() : null);
    if (!offer) return { unknown: true };
    const raid = await ctx.db.get(offer.raidId);
    if (!raid) return { unknown: true };
    const grossCents = cents(a.total);
    const netCents = a.net ? cents(a.net) : grossCents;
    const now = Date.now();
    await ctx.db.insert("ledger", {
      userId: offer.userId, raidId: raid._id, offerId: offer._id, source: "whop",
      externalId: a.paymentId, grossCents, netCents, test: raid.test, via: a.via, at: now,
    });
    const sales = raid.sales + 1;
    const net = raid.netCents + netCents;
    await ctx.db.patch(raid._id, {
      sales, netCents: net, stars: starsFor(net, sales, raid.goalCents), firstSaleAt: raid.firstSaleAt ?? now,
    });
    await logCall(ctx, {
      userId: offer.userId, service: "whop", op: `payment.succeeded via ${a.via}`, status: "ok", ms: 0,
      detail: `${a.paymentId} · $${(grossCents / 100).toFixed(2)} paid · $${(netCents / 100).toFixed(2)} after fees${raid.test ? " · test mode" : ""}`,
    });
    return { ok: true };
  },
});
