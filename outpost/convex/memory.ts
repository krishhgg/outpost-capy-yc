import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Supermemory keeps each user's taste notes and learns from them. Convex stays the source of truth for the
// notes themselves, so a remake never waits on Supermemory. What Supermemory learns is cached in `taste`.

const API = "https://api.supermemory.ai";
const REFRESH_MS = 20_000;
const MAX_TRIES = 15; // about 5 minutes of checks after the last note

export const containerOf = (userId: Id<"users">) => `outpost_${userId}`;

// What each preset reason says about the creator's taste. A note in their own words is sent as written.
const PREFER: Record<string, string> = {
  hook: "They want the hook to land in the first second.",
  long: "They want shorter videos with fewer words.",
  visuals: "They want livelier visuals.",
  voice: "They want a different voice.",
};

async function sm(ctx: ActionCtx, userId: Id<"users">, op: string, path: string, body: unknown, summary: (json: any) => string, quiet = false) {
  const t0 = Date.now();
  let status = 0, json: any = null, text = "";
  try {
    const r = await fetch(API + path, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SUPERMEMORY_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    status = r.status;
    text = await r.text();
    try { json = JSON.parse(text); } catch { /* not JSON */ }
  } catch (e) {
    text = String(e);
  }
  const ok = status >= 200 && status < 300;
  if (!quiet || !ok) {
    await ctx.runMutation(internal.post.call, {
      userId, service: "supermemory", op, status: ok ? "ok" : "error", ms: Date.now() - t0,
      detail: `POST ${path} -> ${status || "no answer"} ${ok ? summary(json) : text.slice(0, 200)}`,
    });
  }
  return { ok, json };
}

export const syncNote = internalAction({
  args: { noteId: v.id("tasteNotes") },
  handler: async (ctx, { noteId }): Promise<void> => {
    const n = await ctx.runQuery(internal.memory.noteFor, { noteId });
    if (!n || n.note.deleted) return;
    const userId = n.note.userId;
    if (!process.env.SUPERMEMORY_API_KEY) {
      await ctx.runMutation(internal.post.call, { userId, service: "supermemory", op: "save note", status: "skipped", ms: 0, detail: "SUPERMEMORY_API_KEY is not set" });
      return;
    }
    // No video title, so Supermemory learns the preference rather than a fact about one video.
    const prefer = n.note.reasonKey === "topic" ? `They don't want videos about ${n.angle ?? "that topic"}.` : PREFER[n.note.reasonKey ?? ""] ?? "";
    const content = `A creator skipped one of their own short videos. Their reason: ${n.note.text}. ${prefer}`.trim();
    // customId is the Convex note id, so sending the same note again updates it instead of adding a copy.
    const r = await sm(ctx, userId, "save note", "/v3/documents", {
      content, containerTag: containerOf(userId), customId: noteId,
      metadata: { kind: "taste_note", reason: n.note.reasonKey ?? "more" }, dreaming: "instant",
    }, j => `${j?.id} ${j?.status} "${n.note.text}"`);
    await ctx.runMutation(internal.memory.setSync, { noteId, sync: r.ok ? "synced" : "failed" });
    if (r.ok) await ctx.runMutation(internal.memory.kick, { userId });
  },
});

// Starts a fresh round of checks. A newer round makes any older one stop.
export const kick = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const row = await ctx.db.query("taste").withIndex("by_user", q => q.eq("userId", userId)).unique();
    const gen = (row?.gen ?? 0) + 1;
    if (row) await ctx.db.patch(row._id, { gen, busy: true });
    else await ctx.db.insert("taste", { userId, gen, busy: true, learned: [], memories: [], at: 0 });
    await ctx.scheduler.runAfter(REFRESH_MS, internal.memory.refresh, { userId, gen, tries: 0 });
  },
});

// Reads what Supermemory has learned: the profile in plain words and each note's memories, for the graph.
export const refresh = internalAction({
  args: { userId: v.id("users"), gen: v.number(), tries: v.number() },
  handler: async (ctx, { userId, gen, tries }): Promise<void> => {
    if ((await ctx.runQuery(internal.memory.genOf, { userId })) !== gen) return;
    const tag = containerOf(userId);
    const t0 = Date.now();
    const docs = await sm(ctx, userId, "read notes", "/v3/documents/documents",
      { containerTags: [tag], limit: 50, page: 1, sort: "createdAt", order: "desc" },
      j => `${j?.documents?.length ?? 0} notes`, true);
    const prof = await sm(ctx, userId, "read profile", "/v4/profile", { containerTag: tag }, () => "", true);
    if (!docs.ok || !prof.ok) {
      // A failed read tries again in the same round, so a brief outage doesn't leave the cache stale.
      const retry = tries + 1 < MAX_TRIES;
      await ctx.runMutation(internal.memory.save, { userId, gen, busy: retry });
      if (retry) await ctx.scheduler.runAfter(REFRESH_MS, internal.memory.refresh, { userId, gen, tries: tries + 1 });
      return;
    }
    const list: any[] = docs.json?.documents ?? [];
    const busy = list.some(d => d.status !== "done" || (d.dreamingStatus && d.dreamingStatus !== "done"));
    const memories = list.flatMap(d => (d.memoryEntries ?? [])
      .filter((m: any) => m.isLatest !== false && !m.isForgotten && typeof m.memory === "string")
      .map((m: any) => ({ id: String(m.id), text: m.memory.slice(0, 200), noteId: String(d.customId ?? ""), related: Object.keys(m.memoryRelations ?? {}).slice(0, 5) })))
      .slice(0, 40);
    const p = prof.json?.profile ?? {};
    const lines = [...(p.static ?? []), ...(p.dynamic ?? []), ...Object.values(p.buckets ?? {}).flat()]
      .filter((x: unknown): x is string => typeof x === "string")
      .map(x => x.replace(/^\[[^\]]*\]\s*/, "").trim()); // drop the "[2026-11-14]" date prefix
    const learned = [...new Set(lines)].filter(Boolean).slice(0, 12).map(x => x.slice(0, 200));
    const again = busy && tries + 1 < MAX_TRIES;
    const changed = await ctx.runMutation(internal.memory.save, { userId, gen, busy: again, learned, memories });
    // Log a read only when it found something new or the checks are over, so the hood isn't flooded.
    if (changed || !again) {
      await ctx.runMutation(internal.post.call, {
        userId, service: "supermemory", op: "read profile", status: "ok", ms: Date.now() - t0,
        detail: `${list.length} notes · ${memories.length} memories · ${learned.length} learned${again ? " · still learning" : ""}`,
      });
    }
    if (again) await ctx.scheduler.runAfter(REFRESH_MS, internal.memory.refresh, { userId, gen, tries: tries + 1 });
  },
});

// Sends every note that isn't in Supermemory yet, for notes made before this sync existed or after a failure.
// `all` sends synced notes again too, after a builder clears a user's Supermemory container.
export const syncPending = internalMutation({
  args: { all: v.optional(v.boolean()) },
  handler: async (ctx, { all }) => {
    let n = 0;
    for (const note of await ctx.db.query("tasteNotes").take(500)) {
      if (note.deleted || (note.sync === "synced" && !all)) continue;
      await ctx.scheduler.runAfter(n * 1500, internal.memory.syncNote, { noteId: note._id });
      n++;
    }
    return n;
  },
});

export const noteFor = internalQuery({
  args: { noteId: v.id("tasteNotes") },
  handler: async (ctx, { noteId }) => {
    const note = await ctx.db.get(noteId);
    if (!note) return null;
    const video = note.videoId ? await ctx.db.get(note.videoId) : null;
    return { note, angle: video?.script?.angle ?? null };
  },
});

export const setSync = internalMutation({
  args: { noteId: v.id("tasteNotes"), sync: v.union(v.literal("synced"), v.literal("failed")) },
  handler: async (ctx, { noteId, sync }) => ctx.db.patch(noteId, { sync }),
});

export const genOf = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => (await ctx.db.query("taste").withIndex("by_user", q => q.eq("userId", userId)).unique())?.gen ?? 0,
});

const memory = v.object({ id: v.string(), text: v.string(), noteId: v.string(), related: v.array(v.string()) });

export const save = internalMutation({
  args: { userId: v.id("users"), gen: v.number(), busy: v.boolean(), learned: v.optional(v.array(v.string())), memories: v.optional(v.array(memory)) },
  handler: async (ctx, { userId, gen, busy, learned, memories }) => {
    const row = await ctx.db.query("taste").withIndex("by_user", q => q.eq("userId", userId)).unique();
    if (!row || row.gen !== gen) return false;
    const changed = !!learned && !!memories &&
      (JSON.stringify(learned) !== JSON.stringify(row.learned) || JSON.stringify(memories) !== JSON.stringify(row.memories));
    await ctx.db.patch(row._id, { busy, ...(learned && memories ? { learned, memories, at: Date.now() } : {}) });
    return changed;
  },
});
