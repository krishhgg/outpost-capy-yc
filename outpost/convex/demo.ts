import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { PLATFORMS } from "./lib";

// Gives the user the demo Instagram and YouTube connections from the DEMO_CONNECTIONS env var, a JSON array of
// { platform, accountId, handle }. Runs on every ensureUser, so it only adds platforms the user doesn't have yet.
// It never touches postingMode: new users still post in dryRun until a builder runs admin:setMode.
export async function attachDemoAccounts(ctx: MutationCtx, userId: Id<"users">) {
  let demo: unknown;
  try { demo = JSON.parse(process.env.DEMO_CONNECTIONS ?? "[]"); } catch { return; }
  if (!Array.isArray(demo) || !demo.length) return;
  const have = new Set((await ctx.db.query("connections").withIndex("by_user", q => q.eq("userId", userId)).collect()).map(c => c.platform));
  for (const c of demo) {
    if (!PLATFORMS.includes(c?.platform) || have.has(c.platform)) continue;
    if (typeof c.accountId !== "string" || typeof c.handle !== "string") continue;
    await ctx.db.insert("connections", { userId, platform: c.platform, accountId: c.accountId, handle: c.handle });
    have.add(c.platform);
  }
}
