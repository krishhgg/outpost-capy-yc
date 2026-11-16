import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import schema from "../convex/schema";

// Taste tiers gate which bounties a user can take, and approved bounty videos forecast earnings at the user's usual views.

const modules = import.meta.glob("../convex/**/*.*s");
type T = ReturnType<typeof convexTest>;

const user = (t: T, postingMode: "dryRun" | "public" = "dryRun", baselineViews?: number) => t.run(ctx => ctx.db.insert("users", {
  deviceId: "dev-1", niche: "test", tz: "America/Los_Angeles", freezesLeft: 0, postingMode, pacePerDay: 3, drainPaused: true,
  createdAt: 0, baselineViews,
}));

const bounty = (t: T, externalId: string, ratePer1kCents: number) => t.run(ctx => ctx.db.insert("bounties", {
  source: "content_rewards", externalId, title: externalId, brand: externalId, description: "", goalType: "clipping",
  mode: "original", rewardKind: "per_view", ratePer1kCents, rules: "", sourceUrls: [], url: "https://example.com/" + externalId,
  status: "open", syncedAt: 0,
}));

// Swipes the taste score reads: with three or more and nothing scored yet, the score is pickiness alone.
async function swipes(t: T, userId: Id<"users">, dirs: ("right" | "left")[]) {
  await t.run(async ctx => {
    for (const dir of dirs) {
      const videoId = await ctx.db.insert("videos", { userId, status: dir, rank: 0, attempts: 0, createdAt: 0 });
      await ctx.db.insert("swipes", { userId, videoId, dir, dwellMs: 1000, day: "2026-11-15", at: 0 });
    }
  });
}

async function approved(t: T, userId: Id<"users">, bountyId: Id<"bounties">, mode: "dryRun" | "public", post: Partial<{ status: "held" | "live"; views: number; viewsAt: number }> = {}) {
  return t.run(async ctx => {
    const videoId = await ctx.db.insert("videos", { userId, status: "right", rank: 0, attempts: 0, createdAt: 0, bountyId });
    await ctx.db.insert("posts", { userId, videoId, platform: "youtube", status: "held", mode, views: 0, slotAt: 0, checks: 0, ...post });
    return videoId;
  });
}

describe("tier-locked bounties", () => {
  test("a bounty's tier follows its rate, and Take refuses one above the user's tier", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t);
    const cheap = await bounty(t, "cheap", 100);
    const mid = await bounty(t, "mid", 250);
    const top = await bounty(t, "top", 400);
    await swipes(t, userId, ["left", "left", "left"]); // approves nothing: score 30, Settler

    const list = await t.query(api.bounties.list, { deviceId: "dev-1" });
    const byId = new Map(list.map(b => [b.id, b]));
    expect(byId.get(cheap)).toMatchObject({ tier: { key: "settler" }, locked: false });
    expect(byId.get(mid)).toMatchObject({ tier: { key: "curator", min: 40 }, locked: true });
    expect(byId.get(top)).toMatchObject({ tier: { key: "showrunner", name: "Showrunner", min: 60 }, locked: true });
    await expect(t.mutation(api.bounties.take, { deviceId: "dev-1", bountyId: top })).rejects.toThrow("Reach Showrunner");
    await t.mutation(api.bounties.take, { deviceId: "dev-1", bountyId: cheap });
  });

  test("crossing into a tier unlocks its bounties", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t);
    const top = await bounty(t, "top", 400);
    await swipes(t, userId, ["left", "left"]);
    await swipes(t, userId, ["right"]); // one in three approved: score 69, Showrunner
    const [card] = await t.query(api.bounties.list, { deviceId: "dev-1" });
    expect(card).toMatchObject({ id: top, locked: false });
    await t.mutation(api.bounties.take, { deviceId: "dev-1", bountyId: top });
    expect((await t.query(api.bounties.list, { deviceId: "dev-1" }))[0].taken).toBe(true);
  });
});

describe("score effects", () => {
  test("a Hit lifts the score and a Miss costs it", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t, "public", 1000);
    await swipes(t, userId, ["right", "left", "left"]);
    const b = await bounty(t, "b", 100);
    const hit = await approved(t, userId, b, "public", { status: "live", views: 3000, viewsAt: 1 });
    const miss = await approved(t, userId, b, "public", { status: "live", views: 100, viewsAt: 1 });
    const { posts } = await t.query(api.earnings.summary, { deviceId: "dev-1" });
    const byId = new Map(posts.map(p => [p.videoId, p]));
    expect(byId.get(hit)).toMatchObject({ verdict: "hit" });
    expect(byId.get(miss)).toMatchObject({ verdict: "miss" });
    expect(byId.get(hit)!.scoreDelta!).toBeGreaterThan(0);
    expect(byId.get(miss)!.scoreDelta!).toBeLessThan(0);
  });
});

describe("forecast for approved bounty videos", () => {
  test("a public approval forecasts at the user's usual views until a platform counts it", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t, "public", 2000);
    const b = await bounty(t, "b", 200);
    const videoId = await approved(t, userId, b, "public");
    expect((await t.query(api.earnings.summary, { deviceId: "dev-1" })).forecastCents).toBe(400);

    await t.run(async ctx => {
      const [p] = await ctx.db.query("posts").withIndex("by_video", q => q.eq("videoId", videoId)).collect();
      await ctx.db.patch(p._id, { status: "live", liveAt: 1, views: 900, viewsAt: 2 });
    });
    expect((await t.query(api.earnings.summary, { deviceId: "dev-1" })).forecastCents).toBe(0);
  });

  test("a dry run forecasts nothing", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t, "dryRun", 2000);
    await approved(t, userId, await bounty(t, "b", 200), "dryRun");
    expect((await t.query(api.earnings.summary, { deviceId: "dev-1" })).forecastCents).toBe(0);
  });
});
