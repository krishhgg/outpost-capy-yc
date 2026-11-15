import { ConvexError, v, type ObjectType } from "convex/values";
import { httpAction, internalAction, internalMutation, query, type ActionCtx, type MutationCtx, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Whop OAuth for the Bounties API (production, api.whop.com), with ONE demo Whop login: every Outpost user's Whop
// Bounty submissions go out as the demo account (Charlie's). A builder mints a one-time authorize link with
// authorizeUrl; Charlie approves it in a browser; the callback exchanges the code with the app's client secret (plus
// PKCE) and keeps the tokens in the single `whopAuth` row. Access tokens last an hour and refresh tokens rotate on
// every use, so tokens live only in that row, refreshes are serialized by a short lease, and no public function, log
// or `calls` row ever carries one. Only public posts reach Whop (submit.ts), so dryRun users never submit as Charlie.

export const WHOP_API = "https://api.whop.com";
export const SCOPES = ["openid", "profile", "bounty:basic:read", "bounty:submission:create"];
const STATE_TTL_MS = 15 * 60 * 1000;
const REFRESH_EARLY_MS = 5 * 60 * 1000;
const LEASE_MS = 30 * 1000;

function config() {
  const clientId = process.env.WHOP_CLIENT_ID;
  const clientSecret = process.env.WHOP_CLIENT_SECRET;
  const redirectUri = process.env.WHOP_OAUTH_REDIRECT ?? process.env.WHOP_CALLBACK_URL;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new ConvexError("Set WHOP_CLIENT_ID, WHOP_CLIENT_SECRET and WHOP_OAUTH_REDIRECT (or WHOP_CALLBACK_URL) on Convex first");
  }
  return { clientId, clientSecret, redirectUri };
}

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const random = (n: number) => base64url(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async (s: string) =>
  base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))));

// The demo login: the one whopAuth row.
const demo = (ctx: QueryCtx | MutationCtx) => ctx.db.query("whopAuth").first();

// A failed Whop OAuth call. `code` is Whop's `error` field, such as invalid_grant.
export class WhopOAuthError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

// POST /oauth/token as the confidential app. Logs the call without any token.
async function tokenCall(ctx: ActionCtx, op: string, body: Record<string, string>) {
  const { clientId, clientSecret } = config();
  const t0 = Date.now();
  let status = 0;
  let json: any = null;
  try {
    const r = await fetch(`${WHOP_API}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...body, client_id: clientId, client_secret: clientSecret }),
    });
    status = r.status;
    json = await r.json().catch(() => null);
  } catch (e) {
    json = { error: "network", error_description: String(e) };
  }
  const ok = status >= 200 && status < 300 && typeof json?.access_token === "string";
  const code = ok ? "" : String(json?.error ?? "error");
  const message = ok ? "" : String(json?.error_description ?? json?.message ?? `HTTP ${status}`).slice(0, 200);
  await ctx.runMutation(internal.post.call, {
    service: "whop", op, status: ok ? "ok" : "error", ms: Date.now() - t0,
    detail: ok ? `expires_in ${json.expires_in ?? "?"}s` : `${status} ${code}: ${message}`,
  });
  if (!ok) throw new WhopOAuthError(status, code, message);
  return json as { access_token: string; refresh_token?: string; expires_in?: number; id_token?: string; scope?: string };
}

const expiry = (expiresIn: number | undefined) => Date.now() + (expiresIn ?? 3600) * 1000;

// Builder-only. Mints the one-time authorize link for the demo Whop login and prints it; the link holds no secret.
// Open it signed in to the demo Whop account and approve. A new approval replaces the stored login.
//   npx convex run whopAuth:authorizeUrl
export const authorizeUrl = internalAction({
  args: {},
  handler: async (ctx): Promise<{ url: string; expiresInMinutes: number }> => {
    const { clientId, redirectUri } = config();
    const state = random(24);
    const nonce = random(16);
    const verifier = random(32);
    await ctx.runMutation(internal.whopAuth.saveState, { state, nonce, verifier });
    const params = new URLSearchParams({
      response_type: "code", client_id: clientId, redirect_uri: redirectUri, scope: SCOPES.join(" "),
      state, nonce, code_challenge: await sha256(verifier), code_challenge_method: "S256",
    });
    return { url: `${WHOP_API}/oauth/authorize?${params}`, expiresInMinutes: STATE_TTL_MS / 60000 };
  },
});

export const saveState = internalMutation({
  args: { state: v.string(), nonce: v.string(), verifier: v.string() },
  handler: async (ctx, row) => {
    for (const old of await ctx.db.query("oauthStates").collect()) {
      if (Date.now() - old.at > STATE_TTL_MS) await ctx.db.delete(old._id);
    }
    await ctx.db.insert("oauthStates", { ...row, at: Date.now() });
  },
});

// Single use: the state row is deleted whether or not it is still fresh.
export const takeState = internalMutation({
  args: { state: v.string() },
  handler: async (ctx, { state }) => {
    const row = await ctx.db.query("oauthStates").withIndex("by_state", q => q.eq("state", state)).unique();
    if (!row) return null;
    await ctx.db.delete(row._id);
    if (Date.now() - row.at > STATE_TTL_MS) return null;
    return { nonce: row.nonce ?? null, verifier: row.verifier ?? null };
  },
});

const login = {
  whopUserId: v.optional(v.string()), username: v.optional(v.string()),
  accessToken: v.string(), refreshToken: v.optional(v.string()), expiresAt: v.number(), scopes: v.array(v.string()),
};

// Stores the demo login, replacing any earlier one.
async function store(ctx: MutationCtx, row: ObjectType<typeof login>) {
  for (const old of await ctx.db.query("whopAuth").collect()) await ctx.db.delete(old._id);
  await ctx.db.insert("whopAuth", row);
}

export const saveTokens = internalMutation({ args: login, handler: store });

// Builder-only, run once: imports a demo token minted outside Convex. From then on only Convex refreshes it, so the
// refresh token must not be used anywhere else afterwards. expiresAt is epoch milliseconds (epoch seconds also work).
//   npx convex run whopAuth:importDemoToken '{"accessToken":"...","refreshToken":"...","expiresAt":1763300000000,
//     "scope":"openid profile bounty:basic:read bounty:submission:create"}'
export const importDemoToken = internalMutation({
  args: {
    accessToken: v.string(), refreshToken: v.string(), expiresAt: v.number(), scope: v.optional(v.string()),
    whopUserId: v.optional(v.string()), username: v.optional(v.string()),
  },
  handler: async (ctx, { scope, expiresAt, ...row }): Promise<{ connected: true; expiresAt: string }> => {
    const ms = expiresAt < 1e12 ? expiresAt * 1000 : expiresAt;
    await store(ctx, { ...row, expiresAt: ms, scopes: scope ? scope.split(" ") : SCOPES });
    return { connected: true, expiresAt: new Date(ms).toISOString() };
  },
});

// The token if it is fresh; else, for exactly one caller at a time, the refresh token to rotate.
export const lease = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ token: string } | { refresh: string; id: Id<"whopAuth"> } | { wait: true } | null> => {
    const row = await demo(ctx);
    if (!row) return null;
    const now = Date.now();
    if (row.expiresAt - REFRESH_EARLY_MS > now) return { token: row.accessToken };
    if (!row.refreshToken) return null;
    if ((row.refreshingUntil ?? 0) > now) return { wait: true };
    await ctx.db.patch(row._id, { refreshingUntil: now + LEASE_MS });
    return { refresh: row.refreshToken, id: row._id };
  },
});

// Both refresh outcomes apply only to the login that took the lease: a login replaced meanwhile is left alone.
export const rotated = internalMutation({
  args: { id: v.id("whopAuth"), accessToken: v.string(), refreshToken: v.optional(v.string()), expiresAt: v.number() },
  handler: async (ctx, { id, ...tokens }) => {
    const row = await ctx.db.get(id);
    if (row) await ctx.db.patch(id, { ...tokens, refreshToken: tokens.refreshToken ?? row.refreshToken, refreshingUntil: undefined });
  },
});

// After a failed refresh: a revoked grant is dropped (a builder mints a new authorizeUrl); any other failure only
// releases the lease so the next caller retries.
export const afterFailedRefresh = internalMutation({
  args: { id: v.id("whopAuth"), revoked: v.boolean() },
  handler: async (ctx, { id, revoked }) => {
    const row = await ctx.db.get(id);
    if (!row) return;
    if (revoked) await ctx.db.delete(row._id);
    else await ctx.db.patch(row._id, { refreshingUntil: undefined });
  },
});

// The demo Whop access token, refreshed first when it is within five minutes of expiry. Null when nobody approved
// the link yet or Whop revoked the grant. Throws on a transient failure, so callers keep their work to retry.
export async function accessToken(ctx: ActionCtx): Promise<string | null> {
  for (let i = 0; i < 20; i++) {
    const l = await ctx.runMutation(internal.whopAuth.lease, {});
    if (!l) return null;
    if ("token" in l) return l.token;
    if ("wait" in l) {
      await new Promise(r => setTimeout(r, 1500));
      continue;
    }
    try {
      const t = await tokenCall(ctx, "oauth.refresh", { grant_type: "refresh_token", refresh_token: l.refresh });
      await ctx.runMutation(internal.whopAuth.rotated, {
        id: l.id, accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt: expiry(t.expires_in),
      });
      return t.access_token;
    } catch (e) {
      const revoked = e instanceof WhopOAuthError && (e.code === "invalid_grant" || e.status === 401);
      await ctx.runMutation(internal.whopAuth.afterFailedRefresh, { id: l.id, revoked });
      if (revoked) return null;
      throw e;
    }
  }
  throw new Error("Whop token refresh is still running elsewhere");
}

// The Whop token to act for this user: the demo login for every user. Never return it from a public function.
export const tokenFor = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx): Promise<string | null> => accessToken(ctx),
});

// Whether the demo Whop login is connected, and its username. Never the token.
export const status = query({
  args: { deviceId: v.string() },
  handler: async (ctx): Promise<{ connected: boolean; username: string | null }> => {
    const row = await demo(ctx);
    return { connected: !!row, username: row?.username ?? null };
  },
});

const escape = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const page = (status: number, title: string, body: string) => new Response(
  `<!doctype html><meta name="viewport" content="width=device-width"><title>${escape(title)}</title>`
  + `<body style="font:18px system-ui;max-width:28em;margin:3em auto;padding:0 1em"><h1>${escape(title)}</h1><p>${escape(body)}</p>`,
  { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
);

// The ID token came straight from Whop's token endpoint over TLS, so its claims are read without a signature check.
function idTokenClaims(idToken: string | undefined): Record<string, unknown> | null {
  const part = idToken?.split(".")[1];
  if (!part) return null;
  try {
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=")));
  } catch {
    return null;
  }
}

// GET /whop/oauth/callback?code=&state=. The state must be one authorizeUrl stored in the last 15 minutes, used once.
export const callback = httpAction(async (ctx, req) => {
  const params = new URL(req.url).searchParams;
  const state = params.get("state");
  const saved = state ? await ctx.runMutation(internal.whopAuth.takeState, { state }) : null;
  if (!saved) return page(400, "Link expired", "This Whop link is unknown, expired or already used. Ask for a new one.");
  const denied = params.get("error");
  const code = params.get("code");
  if (denied || !code) {
    await ctx.runMutation(internal.post.call, {
      service: "whop", op: "oauth.authorize", status: "error", ms: 0,
      detail: `${denied ?? "no code"}: ${params.get("error_description") ?? ""}`,
    });
    return page(400, "Not connected", "Whop did not approve the connection.");
  }
  try {
    const { redirectUri } = config();
    const t = await tokenCall(ctx, "oauth.exchange", {
      grant_type: "authorization_code", code, redirect_uri: redirectUri, ...(saved.verifier ? { code_verifier: saved.verifier } : {}),
    });
    const claims = idTokenClaims(t.id_token);
    if (claims && saved.nonce && claims.nonce !== saved.nonce) throw new Error("the ID token's nonce does not match");
    const t0 = Date.now();
    const r = await fetch(`${WHOP_API}/oauth/userinfo`, { headers: { Authorization: `Bearer ${t.access_token}` } });
    const me: any = await r.json().catch(() => null);
    await ctx.runMutation(internal.post.call, {
      service: "whop", op: "oauth.userinfo", status: r.ok ? "ok" : "error", ms: Date.now() - t0,
      detail: r.ok ? `user ${me?.sub ?? "?"}` : `${r.status}`,
    });
    const whopUserId = String(me?.sub ?? claims?.sub ?? "");
    if (!whopUserId) throw new Error("Whop did not say which user approved");
    const name = me?.preferred_username ?? me?.username ?? claims?.preferred_username;
    const username = typeof name === "string" ? name : undefined;
    await ctx.runMutation(internal.whopAuth.saveTokens, {
      whopUserId, username,
      accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt: expiry(t.expires_in),
      scopes: t.scope ? t.scope.split(" ") : SCOPES,
    });
    await ctx.scheduler.runAfter(0, internal.submit.poll, {});
    return page(200, "Connected", `Outpost now submits bounty posts as ${username ? "@" + username : "this Whop account"}.`);
  } catch (e) {
    return page(502, "Not connected", `Whop connect failed: ${e instanceof Error ? e.message : String(e)}`);
  }
});
