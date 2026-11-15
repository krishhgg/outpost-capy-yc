import { v } from "convex/values";
import { query } from "./_generated/server";
import { userFor } from "./lib";

// Each outside service, in the order a video moves through them. `env` names the key a service waits on.
const SERVICES = [
  { key: "claude", name: "Claude", role: "Writes each script", env: null },
  { key: "kokoro", name: "Kokoro", role: "Reads it aloud", env: null },
  { key: "compound", name: "Compound", role: "Renders the video", env: null },
  { key: "convex", name: "Convex", role: "Stores videos, runs the feed", env: null },
  { key: "zernio", name: "Zernio", role: "Posts videos, reads views", env: "ZERNIO_API_KEY" },
  { key: "whop", name: "Whop", role: "Store and checkout", env: "WHOP_API_KEY" },
  { key: "supermemory", name: "Supermemory", role: "Remembers why you skip", env: "SUPERMEMORY_API_KEY" },
] as const;

// The under-the-hood page: this user's calls to outside services, live.
export const calls = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await userFor(ctx, deviceId);
    const services = [];
    for (const s of SERVICES) {
      const last = await ctx.db.query("calls")
        .withIndex("by_user_service_at", q => q.eq("userId", user._id).eq("service", s.key)).order("desc").first();
      services.push({
        key: s.key, name: s.name, role: s.role,
        needsKey: s.env !== null && !process.env[s.env],
        last: last && { op: last.op, status: last.status, ms: last.ms, at: last.at },
      });
    }
    const log = await ctx.db.query("calls").withIndex("by_user_at", q => q.eq("userId", user._id)).order("desc").take(60);
    const notes = await ctx.db.query("tasteNotes").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(20);
    const taste = await ctx.db.query("taste").withIndex("by_user", q => q.eq("userId", user._id)).unique();
    const shown = new Set(notes.filter(n => !n.deleted).map(n => n._id as string));
    return {
      services,
      log: log.map(c => ({ id: c._id, service: c.service, op: c.op, status: c.status, ms: c.ms, detail: c.detail ?? "", at: c.at })),
      notes: notes.filter(n => !n.deleted).map(n => ({ id: n._id, text: n.text, sync: n.sync })),
      taste: {
        learned: (taste?.learned ?? []).slice(0, 6),
        busy: taste?.busy ?? false,
        at: taste?.at || null,
        // Only memories from notes still on this page, so every graph edge has both ends on screen.
        memories: (taste?.memories ?? []).filter(m => shown.has(m.noteId)),
      },
    };
  },
});
