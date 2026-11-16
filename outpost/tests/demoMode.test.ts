import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import schema from "../convex/schema";
import { LIBRARY_DEVICE_ID } from "../convex/bounties";

// Demo mode simulates posting end to end without an outside call, and the seeded demo user crosses into Showrunner
// on the script's swipes: one rejection, then one approval.

const modules = import.meta.glob("../convex/**/*.*s");
type T = ReturnType<typeof convexTest>;

let fetched: string[] = [];
beforeEach(() => {
  fetched = [];
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => { fetched.push(String(input)); throw new Error("no network in tests"); }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

const script = (hook: string) => ({ hook, lines: [], cta: "", caption: "", title: hook, angle: "" });

const user = (t: T, deviceId: string, extra: Record<string, unknown> = {}) => t.run(ctx => ctx.db.insert("users", {
  deviceId, niche: "test", tz: "America/Los_Angeles", freezesLeft: 0, postingMode: "dryRun", pacePerDay: 12, drainPaused: false,
  createdAt: 0, scoutAt: Date.now(), ...extra,
}));

const bounty = (t: T, brand: string, ratePer1kCents: number, minViews = 1000) => t.run(ctx => ctx.db.insert("bounties", {
  source: "content_rewards", externalId: brand, title: brand, brand, description: "", goalType: "clipping", mode: "original",
  rewardKind: "per_view", ratePer1kCents, minViews, rules: "", sourceUrls: [], url: "https://whop.com/" + brand, status: "open", syncedAt: 0,
}));

const video = (t: T, userId: Id<"users">, bountyId: Id<"bounties">, hook: string, library = false) => t.run(async ctx => ctx.db.insert("videos", {
  userId, status: "ready", rank: 0, attempts: 0, createdAt: 0, bountyId, script: script(hook),
  storageId: await ctx.storage.store(new Blob([hook])), ...(library ? { pregenerated: true } : {}),
}));

const outside = () => fetched.filter(u => u.includes("zernio.com") || u.includes("whop.com"));

describe("demo posting mode", () => {
  test("a right swipe posts, goes live, forecasts and submits without any Zernio or Whop call", async () => {
    vi.useFakeTimers();
    const t = convexTest(schema, modules);
    const userId = await user(t, "dev-1", { postingMode: "demo", baselineViews: 2400 });
    const b = await bounty(t, "relay.fast", 100, 2000);
    const videoId = await video(t, userId, b, "Your boss asks");

    await t.mutation(api.feed.swipe, { deviceId: "dev-1", videoId, dir: "right", dwellMs: 1000 });
    expect((await t.query(api.earnings.summary, { deviceId: "dev-1" })).forecastCents).toBe(240);
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const posts = await t.run(ctx => ctx.db.query("posts").collect());
    expect(posts).toHaveLength(2);
    for (const p of posts) {
      expect(p).toMatchObject({ status: "live", mode: "demo", demo: true });
      expect(p.url).toBeUndefined();
    }

    const sub = await t.query(api.submit.forVideo, { deviceId: "dev-1", videoId });
    expect(sub).toMatchObject({ status: "manual", demo: true, auto: false });
    await t.mutation(api.submit.markSubmitted, { deviceId: "dev-1", videoId });
    expect((await t.query(api.submit.forVideo, { deviceId: "dev-1", videoId }))?.status).toBe("submitted");
    expect((await t.query(api.earnings.summary, { deviceId: "dev-1" })).forecastCents).toBe(240);

    const calls = await t.run(ctx => ctx.db.query("calls").collect());
    const simulated = calls.filter(c => c.detail?.startsWith("simulated for the demo"));
    expect(simulated.map(c => c.service).sort()).toEqual(["whop", "zernio", "zernio"]);
    expect(simulated.every(c => c.status === "skipped")).toBe(true);
    expect(calls.filter(c => c.status === "ok")).toHaveLength(0);
    expect(outside()).toEqual([]);
  });
});

describe("seeded demo user", () => {
  async function stage(t: T) {
    const lib = await user(t, LIBRARY_DEVICE_ID, { drainPaused: true });
    const eneba = await bounty(t, "Eneba", 250);
    const nilo = await bounty(t, "Nilo", 75);
    const ppc = await bounty(t, "PPCleaner", 400);
    const agent = await bounty(t, "Agentplace", 100);
    const relay = await bounty(t, "relay.fast", 100, 2000);
    const binge = await bounty(t, "BingePlay", 200);
    const ids = {
      hit: await video(t, lib, eneba, "Wait, you really paid full price?", true),
      miss: await video(t, lib, nilo, "Your friend says you can't make a game.", true),
      weak: await video(t, lib, agent, "Three AI agents any small business can build", true),
      relay: await video(t, lib, relay, "Your boss asks why there are so many AI subscriptions.", true),
      binge: await video(t, lib, binge, "No signal on the way home.", true),
    };
    // The phone's real user, with a real public post that must stay where it is.
    const real = await user(t, "phone", { postingMode: "public" });
    await t.run(async ctx => {
      const vid = await ctx.db.insert("videos", { userId: real, status: "right", rank: 0, attempts: 0, createdAt: 0 });
      await ctx.db.insert("posts", { userId: real, videoId: vid, platform: "instagram", status: "live", mode: "public", views: 120, viewsAt: 1, slotAt: 0, liveAt: 0, checks: 0, url: "https://instagram.com/reel/x" });
    });
    return { ids, ppc, relay, real };
  }

  const summary = (t: T) => t.query(api.earnings.summary, { deviceId: "phone" });
  const locked = async (t: T, id: Id<"bounties">) => (await t.query(api.bounties.list, { deviceId: "phone" })).find(b => b.id === id)!.locked;

  test("sits just under Showrunner, then one rejection and one approval cross it and unlock PPCleaner", async () => {
    const t = convexTest(schema, modules);
    const { ids, ppc, relay, real } = await stage(t);
    const seeded = await t.mutation(internal.admin.seedDemo, { deviceId: "phone", hitVideoId: ids.hit, missVideoId: ids.miss });
    expect(seeded).toMatchObject({ parked: real, score: 59 });

    const before = await summary(t);
    expect(before.tasteScore).toBe(59);
    const hit = before.posts.find(p => p.verdict === "hit")!;
    const miss = before.posts.find(p => p.verdict === "miss")!;
    expect(hit.scoreDelta).toBeGreaterThan(0);
    expect(miss.scoreDelta).toBeLessThan(0);
    expect(before.pendingCents).toBeGreaterThan(0);
    expect(await locked(t, ppc)).toBe(true);

    await t.mutation(internal.admin.demoPrep, { userId: seeded.userId, videoIds: [ids.weak, ids.relay, ids.binge], bountyIds: [relay] });
    const feed = await t.query(api.feed.next, { deviceId: "phone" });
    expect(feed.slice(0, 3).map(c => c.bounty?.brand)).toEqual(["Agentplace", "relay.fast", "BingePlay"]);
    expect(feed.slice(0, 3).every(c => c.pregenerated)).toBe(true);

    await t.mutation(api.feed.swipe, { deviceId: "phone", videoId: feed[0].id, dir: "left", reason: "hook", dwellMs: 3000 });
    expect((await summary(t)).tasteScore).toBeLessThan(60);
    await t.mutation(api.bounties.take, { deviceId: "phone", bountyId: relay }).catch(() => {});
    await t.mutation(api.feed.swipe, { deviceId: "phone", videoId: feed[1].id, dir: "right", dwellMs: 3000 });
    const after = await summary(t);
    expect(after.tasteScore).toBeGreaterThanOrEqual(60);
    expect(after.forecastCents).toBe(240);
    expect(await locked(t, ppc)).toBe(false);

    await t.mutation(api.feed.swipe, { deviceId: "phone", videoId: feed[2].id, dir: "right", dwellMs: 1000 });
    expect((await summary(t)).tasteScore).toBeGreaterThanOrEqual(60);
  });

  test("reseeding resets a rehearsal, and unseedDemo brings the real user back untouched", async () => {
    const t = convexTest(schema, modules);
    const { ids, real } = await stage(t);
    const { userId } = await t.mutation(internal.admin.seedDemo, { deviceId: "phone", hitVideoId: ids.hit, missVideoId: ids.miss });
    await t.mutation(internal.admin.demoPrep, { userId, videoIds: [ids.weak] });
    const [card] = await t.query(api.feed.next, { deviceId: "phone" });
    await t.mutation(api.feed.swipe, { deviceId: "phone", videoId: card.id, dir: "right", dwellMs: 1000 });

    const again = await t.mutation(internal.admin.seedDemo, { deviceId: "phone", hitVideoId: ids.hit, missVideoId: ids.miss });
    expect(again).toMatchObject({ userId, parked: null, score: 59 });
    expect(await t.mutation(internal.admin.demoPrep, { userId, videoIds: [ids.weak] })).toBe(1);

    expect(await t.mutation(internal.admin.unseedDemo, { deviceId: "phone" })).toBe(real);
    const back = await summary(t);
    expect(back.posts).toHaveLength(1);
    expect(back.posts[0].views).toBe(120);
  });
});
