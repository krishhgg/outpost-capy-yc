import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { DAY_MS } from "./lib";

const BURST = 2;
const REFILL_MS = 20 * 60 * 1000;
type Platform = Doc<"posts">["platform"];

async function reservedSlots(ctx: MutationCtx, user: Doc<"users">, platform: Platform, now: number) {
  const rows = await ctx.db.query("posts")
    .withIndex("by_user_platform_slot", q => q.eq("userId", user._id).eq("platform", platform).gt("slotAt", now - DAY_MS))
    .collect();
  // While the queue is paused, held rows give up their slots.
  return rows
    .filter(r => r.status === "queued" || r.status === "publishing" || r.status === "live" || (r.status === "held" && !user.drainPaused))
    .map(r => r.slotAt)
    .sort((a, b) => a - b);
}

// Earliest time at or after the last reservation that keeps the platform under
// `pacePerDay` posts in any 24 hours and inside a 2-post burst that refills one per 20 minutes.
export function nextSlot(slots: number[], perDay: number, now: number) {
  let t = Math.max(now, slots.at(-1) ?? 0);
  for (let guard = 0; guard < 200; guard++) {
    const inDay = slots.filter(s => s > t - DAY_MS && s <= t);
    if (inDay.length >= perDay) { t = inDay[inDay.length - perDay] + DAY_MS + 1; continue; }
    let tokens = BURST;
    let prev: number | null = null;
    for (const s of slots) {
      if (prev !== null) tokens = Math.min(BURST, tokens + (s - prev) / REFILL_MS);
      tokens -= 1;
      prev = s;
    }
    if (prev !== null && Math.min(BURST, tokens + (t - prev) / REFILL_MS) < 1 - 1e-9) {
      t = Math.ceil(prev + (1 - tokens) * REFILL_MS);
      continue;
    }
    return t;
  }
  return t;
}

export async function slotFor(ctx: MutationCtx, user: Doc<"users">, platform: Platform, now: number) {
  return nextSlot(await reservedSlots(ctx, user, platform, now), user.pacePerDay, now);
}

// Give every held row a new time under the current pace, oldest approval first.
export const reslot = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.drainPaused) return;
    const now = Date.now();
    const held = (await ctx.db.query("posts").withIndex("by_status_slot", q => q.eq("status", "held")).collect())
      .filter(p => p.userId === userId)
      .sort((a, b) => a._creationTime - b._creationTime);
    // Start from the slots that aren't held, then lay the held rows back in one by one.
    const asPaused = { ...user, drainPaused: true };
    const slots = {
      youtube: await reservedSlots(ctx, asPaused, "youtube", now),
      instagram: await reservedSlots(ctx, asPaused, "instagram", now),
    };
    for (const p of held) {
      const slotAt = nextSlot(slots[p.platform], user.pacePerDay, now);
      slots[p.platform].push(slotAt);
      await place(ctx, p._id, slotAt, now);
    }
  },
});

export async function place(ctx: MutationCtx, postId: Id<"posts">, slotAt: number, now: number) {
  const due = slotAt <= now + 1000;
  await ctx.db.patch(postId, { slotAt, status: due ? "queued" : "held" });
  await ctx.scheduler.runAt(Math.max(slotAt, now), internal.post.publish, { postId });
}
