import { ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export const BUFFER = 10; // videos ready or in progress per user
export const PLATFORMS = ["youtube", "instagram"] as const;
export const DAY_MS = 24 * 60 * 60 * 1000;

export async function userFor(ctx: QueryCtx, deviceId: string): Promise<Doc<"users">> {
  const u = await ctx.db.query("users").withIndex("by_device", q => q.eq("deviceId", deviceId)).unique();
  if (!u) throw new ConvexError("unknown device");
  return u;
}

// A user's live posts, newest first.
export async function livePosts(ctx: QueryCtx, userId: Id<"users">) {
  const rows: Doc<"posts">[] = [];
  for (const platform of PLATFORMS) {
    const all = await ctx.db.query("posts")
      .withIndex("by_user_platform_slot", q => q.eq("userId", userId).eq("platform", platform)).collect();
    rows.push(...all.filter(p => p.status === "live"));
  }
  return rows.sort((a, b) => (b.liveAt ?? b.slotAt) - (a.liveAt ?? a.slotAt));
}

export async function ownVideo(ctx: QueryCtx, user: Doc<"users">, videoId: Id<"videos">) {
  const v = await ctx.db.get(videoId);
  if (!v || v.userId !== user._id) throw new ConvexError("not your video");
  return v;
}

export function requireWorker(key: string) {
  const want = process.env.WORKER_SECRET;
  if (!want || key !== want) throw new ConvexError("bad worker key");
}

export function dayOf(at: number, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

// Date math on YYYY-MM-DD strings, so a daylight saving change never skips or repeats a day.
export function shiftDay(day: string, by: number) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + by)).toISOString().slice(0, 10);
}
export const weekdayOf = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 is Sunday

// Walk back from today, which can still be empty. A missed day uses a freeze while any are left,
// and only counts as frozen once an earlier active day carries the streak past it.
// The allowance is per streak: a streak can absorb `freezes` missed days in total, and the next streak starts fresh.
export function streakOf(today: string, active: (day: string) => boolean, freezes: number) {
  let streak = 0;
  let pending: string[] = [];
  const frozen: string[] = [];
  for (let i = 0; i < 3650; i++) {
    const day = shiftDay(today, -i);
    if (active(day)) {
      streak++;
      frozen.push(...pending);
      pending = [];
    } else if (i > 0) {
      if (frozen.length + pending.length >= freezes) break;
      pending.push(day);
    }
  }
  return { streak, frozen, freezesLeft: freezes - frozen.length };
}

type DayCount = "made" | "approved" | "remakes" | "skipped";
export async function bumpDay(ctx: MutationCtx, userId: Id<"users">, day: string, field: DayCount) {
  const row = await ctx.db.query("days").withIndex("by_user_day", q => q.eq("userId", userId).eq("day", day)).unique();
  if (row) await ctx.db.patch(row._id, { [field]: row[field] + 1 });
  else await ctx.db.insert("days", { userId, day, made: 0, approved: 0, remakes: 0, skipped: 0, [field]: 1 });
}

// Keep BUFFER videos queued, in progress or ready.
export async function refill(ctx: MutationCtx, userId: Id<"users">) {
  let have = 0;
  for (const status of ["queued", "making", "ready"] as const) {
    const rows = await ctx.db.query("videos")
      .withIndex("by_user_status_rank", q => q.eq("userId", userId).eq("status", status)).take(BUFFER);
    have += rows.length;
  }
  const now = Date.now();
  for (let i = have; i < BUFFER; i++) {
    await ctx.db.insert("videos", { userId, status: "queued", rank: now + i, attempts: 0, createdAt: now });
  }
}

export async function logCall(ctx: MutationCtx, row: Omit<Doc<"calls">, "_id" | "_creationTime" | "at"> & { at?: number }) {
  await ctx.db.insert("calls", { ...row, detail: row.detail?.slice(0, 400), at: row.at ?? Date.now() });
}
