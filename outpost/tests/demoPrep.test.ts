import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import schema from "../convex/schema";
import { LIBRARY_DEVICE_ID } from "../convex/bounties";

// admin:demoPrep orders a user's Feed for the demo from the pregenerated library.

const modules = import.meta.glob("../convex/**/*.*s");
type T = ReturnType<typeof convexTest>;

const person = (t: T, deviceId: string) => t.run(ctx => ctx.db.insert("users", {
  deviceId, niche: "test", tz: "America/Los_Angeles", freezesLeft: 0, postingMode: "dryRun", pacePerDay: 3, drainPaused: true, createdAt: 0,
}));

const bounty = (t: T, externalId: string) => t.run(ctx => ctx.db.insert("bounties", {
  source: "content_rewards", externalId, title: externalId, brand: externalId, description: "", goalType: "clipping",
  mode: "original", rewardKind: "per_view", ratePer1kCents: 100, rules: "", sourceUrls: [], url: "https://example.com/" + externalId,
  status: "open", syncedAt: 0,
}));

async function setup(t: T) {
  const library = await person(t, LIBRARY_DEVICE_ID);
  const userId = await person(t, "dev-1");
  const a = await bounty(t, "a");
  const b = await bounty(t, "b");
  const lib = await t.run(async ctx => {
    const ids: Record<string, Id<"videos">> = {};
    for (const [i, [name, bountyId]] of ([["a1", a], ["a2", a], ["a3", a], ["b1", b], ["b2", b]] as const).entries()) {
      const storageId = await ctx.storage.store(new Blob([name]));
      ids[name] = await ctx.db.insert("videos", {
        userId: library, status: "ready", rank: i, attempts: 0, createdAt: 0, bountyId, pregenerated: true, storageId,
        script: script(name),
      });
    }
    // The user's own studio video, already waiting in the Feed.
    const storageId = await ctx.storage.store(new Blob(["own"]));
    await ctx.db.insert("videos", { userId, status: "ready", rank: 1, attempts: 0, createdAt: 0, storageId, script: script("own") });
    return ids;
  });
  return { userId, a, b, lib };
}

function script(hook: string) {
  return { hook, lines: [], cta: "", caption: "", title: hook, angle: "" };
}

const hooks = async (t: T) => (await t.query(api.feed.next, { deviceId: "dev-1" })).map(c => c.hook);

describe("admin:demoPrep", () => {
  test("puts the chosen library videos first, in order, labeled pregenerated", async () => {
    const t = convexTest(schema, modules);
    const { userId, lib } = await setup(t);
    await t.mutation(internal.admin.demoPrep, { userId, videoIds: [lib.a2, lib.b1, lib.a1] });
    expect(await hooks(t)).toEqual(["a2", "b1", "a1", "own"]);
    const cards = await t.query(api.feed.next, { deviceId: "dev-1" });
    expect(cards.slice(0, 3).every(c => c.pregenerated)).toBe(true);
    expect(cards[0].bounty?.brand).toBe("a");
    expect(cards[1].bounty?.brand).toBe("b");
  });

  test("is idempotent, and a later Take on a prepped bounty adds nothing in front", async () => {
    const t = convexTest(schema, modules);
    const { userId, a, lib } = await setup(t);
    await t.mutation(internal.admin.demoPrep, { userId, videoIds: [lib.b1, lib.a1], bountyIds: [a] });
    await t.mutation(internal.admin.demoPrep, { userId, videoIds: [lib.b1, lib.a1], bountyIds: [a] });
    await t.mutation(api.bounties.take, { deviceId: "dev-1", bountyId: a });
    const order = await hooks(t);
    expect(order.slice(0, 2)).toEqual(["b1", "a1"]);
    expect(order.filter(h => h === "a1")).toHaveLength(1);
    expect(order.sort()).toEqual(["a1", "a2", "a3", "b1", "own"]);
  });

  test("refuses a video that isn't a ready library video", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await setup(t);
    const own = (await t.query(api.feed.next, { deviceId: "dev-1" }))[0].id;
    await expect(t.mutation(internal.admin.demoPrep, { userId, videoIds: [own] })).rejects.toThrow("not a ready library video");
  });
});
