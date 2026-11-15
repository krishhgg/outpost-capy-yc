/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import schema from "../convex/schema";
import { NOT_CONNECTED } from "../convex/submit";

// Whop OAuth (one demo login) and Whop Bounties auto-submit, against a mocked fetch. No test reaches Whop: fetch is
// stubbed for every test, unknown URLs fail the test, and fake timers keep scheduled functions from running unasked.

const modules = import.meta.glob("../convex/**/*.*s");
const REDIRECT = "https://example.convex.site/whop/oauth/callback";

type Seen = { url: URL; method: string; headers: Record<string, string>; body: any };
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function mockFetch(route: (s: Seen) => Response | undefined) {
  const seen: Seen[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL, init: RequestInit = {}) => {
    const s: Seen = {
      url: new URL(String(input)), method: init.method ?? "GET",
      headers: Object.fromEntries(new Headers(init.headers).entries()),
      body: init.body ? JSON.parse(String(init.body)) : null,
    };
    seen.push(s);
    const r = route(s);
    if (!r) throw new Error("unexpected fetch " + s.method + " " + s.url);
    return r;
  }));
  return seen;
}

const b64url = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const idToken = (claims: object) => b64url("{\"alg\":\"none\"}") + "." + b64url(JSON.stringify(claims)) + ".sig";
async function challengeOf(verifier: string) {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  return b64url(String.fromCharCode(...d));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("WHOP_CLIENT_ID", "app_test");
  vi.stubEnv("WHOP_CLIENT_SECRET", "secret-test");
  vi.stubEnv("WHOP_OAUTH_REDIRECT", REDIRECT);
  mockFetch(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

async function user(t: ReturnType<typeof convexTest>, postingMode: "dryRun" | "private" | "public", deviceId = "dev-" + postingMode) {
  return t.run(ctx => ctx.db.insert("users", {
    deviceId, niche: "test", tz: "America/Los_Angeles", freezesLeft: 0, postingMode, pacePerDay: 3, drainPaused: false, createdAt: 0,
  }));
}

async function connect(t: ReturnType<typeof convexTest>, expiresAt = Date.now() + 3600_000) {
  await t.mutation(internal.whopAuth.saveTokens, {
    whopUserId: "user_charlie", username: "charlie", accessToken: "acc-1", refreshToken: "ref-1", expiresAt, scopes: [],
  });
}

const whopBounty = (t: ReturnType<typeof convexTest>) => t.mutation(internal.bounties.addWhopBounty, {
  externalId: "bnty_test1", title: "Clip for Acme", brand: "Acme", description: "30-60 s vertical clip", rewardCents: 500,
  url: "https://whop.com/bounty/bnty_test1",
});

const contentRewards = (t: ReturnType<typeof convexTest>) => t.run(ctx => ctx.db.insert("bounties", {
  source: "content_rewards", externalId: "cc01", title: "Campaign", brand: "Reach", description: "", goalType: "clipping",
  mode: "original", rewardKind: "per_view", ratePer1kCents: 200, rules: "", sourceUrls: [],
  url: "https://contentrewards.com/c/campaigns/cc01", status: "open", syncedAt: 0,
}));

async function livePost(t: ReturnType<typeof convexTest>, userId: Id<"users">, bountyId: Id<"bounties">,
  mode: "dryRun" | "private" | "public", status: "live" | "dry_run" = "live") {
  return t.run(async ctx => {
    const videoId = await ctx.db.insert("videos", { userId, status: "right", rank: 0, attempts: 0, createdAt: 0, bountyId });
    const postId = await ctx.db.insert("posts", {
      userId, videoId, platform: "youtube", status, mode, views: 0, slotAt: 0, checks: 0,
      ...(status === "live" ? { url: "https://youtube.com/shorts/abc" } : {}),
    });
    return { videoId, postId };
  });
}

const submissions = (t: ReturnType<typeof convexTest>) => t.run(ctx => ctx.db.query("submissions").collect());
const whopCalls = (seen: Seen[]) => seen.filter(s => s.url.host === "api.whop.com");

describe("OAuth state", () => {
  test("authorizeUrl stores a one-time state and asks for the bounty scopes with PKCE", async () => {
    const t = convexTest(schema, modules);
    const { url } = await t.action(internal.whopAuth.authorizeUrl, {});
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://api.whop.com/oauth/authorize");
    const p = u.searchParams;
    expect(p.get("response_type")).toBe("code");
    expect(p.get("client_id")).toBe("app_test");
    expect(p.get("redirect_uri")).toBe(REDIRECT);
    expect(p.get("scope")).toBe("openid profile bounty:basic:read bounty:submission:create");
    expect(p.get("code_challenge_method")).toBe("S256");
    expect(p.get("nonce")).toBeTruthy();
    expect(p.has("company_id")).toBe(false);
    const rows = await t.run(ctx => ctx.db.query("oauthStates").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0].state).toBe(p.get("state"));
    expect(await challengeOf(rows[0].verifier!)).toBe(p.get("code_challenge"));
  });

  test("the callback refuses a missing, unknown or expired state without calling Whop", async () => {
    const t = convexTest(schema, modules);
    const seen = mockFetch(() => undefined);
    expect((await t.fetch("/whop/oauth/callback?code=c")).status).toBe(400);
    expect((await t.fetch("/whop/oauth/callback?code=c&state=nope")).status).toBe(400);
    const { url } = await t.action(internal.whopAuth.authorizeUrl, {});
    const state = new URL(url).searchParams.get("state")!;
    vi.advanceTimersByTime(16 * 60 * 1000);
    expect((await t.fetch("/whop/oauth/callback?code=c&state=" + state)).status).toBe(400);
    expect(await t.run(ctx => ctx.db.query("oauthStates").collect())).toHaveLength(0);
    expect(seen).toHaveLength(0);
    expect(await t.run(ctx => ctx.db.query("whopAuth").collect())).toHaveLength(0);
  });

  test("a denied consent is logged and stores nothing", async () => {
    const t = convexTest(schema, modules);
    const { url } = await t.action(internal.whopAuth.authorizeUrl, {});
    const state = new URL(url).searchParams.get("state")!;
    const res = await t.fetch("/whop/oauth/callback?error=access_denied&state=" + state);
    expect(res.status).toBe(400);
    const calls = await t.run(ctx => ctx.db.query("calls").collect());
    expect(calls.map(c => [c.op, c.status])).toEqual([["oauth.authorize", "error"]]);
    expect(await t.run(ctx => ctx.db.query("whopAuth").collect())).toHaveLength(0);
  });
});

describe("token exchange", () => {
  async function start(t: ReturnType<typeof convexTest>) {
    const { url } = await t.action(internal.whopAuth.authorizeUrl, {});
    const p = new URL(url).searchParams;
    return { state: p.get("state")!, nonce: p.get("nonce")!, challenge: p.get("code_challenge")! };
  }

  test("exchanges the code as the confidential app, stores the demo login and never leaks a token", async () => {
    const t = convexTest(schema, modules);
    const { state, nonce, challenge } = await start(t);
    const seen = mockFetch(s => {
      if (s.url.pathname === "/oauth/token") {
        return json(200, { access_token: "acc-1", refresh_token: "ref-1", expires_in: 3600, scope: "openid profile", id_token: idToken({ sub: "user_charlie", nonce }) });
      }
      if (s.url.pathname === "/oauth/userinfo") return json(200, { sub: "user_charlie", preferred_username: "charlie" });
    });
    const res = await t.fetch("/whop/oauth/callback?code=the-code&state=" + state);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("@charlie");

    const token = seen.find(s => s.url.pathname === "/oauth/token")!;
    expect(token.method).toBe("POST");
    expect(token.body).toMatchObject({
      grant_type: "authorization_code", code: "the-code", redirect_uri: REDIRECT, client_id: "app_test", client_secret: "secret-test",
    });
    expect(await challengeOf(token.body.code_verifier)).toBe(challenge);
    expect(seen.find(s => s.url.pathname === "/oauth/userinfo")!.headers.authorization).toBe("Bearer acc-1");

    const rows = await t.run(ctx => ctx.db.query("whopAuth").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ whopUserId: "user_charlie", username: "charlie", accessToken: "acc-1", refreshToken: "ref-1" });
    expect(rows[0].expiresAt).toBe(Date.now() + 3600_000);

    await user(t, "dryRun", "any-device");
    const status = await t.query(api.whopAuth.status, { deviceId: "any-device" });
    expect(status).toEqual({ connected: true, username: "charlie" });

    const logged = JSON.stringify(await t.run(ctx => ctx.db.query("calls").collect()));
    for (const secret of ["acc-1", "ref-1", "secret-test", "the-code"]) expect(logged).not.toContain(secret);

    expect((await t.fetch("/whop/oauth/callback?code=the-code&state=" + state)).status).toBe(400);
  });

  test("refuses an ID token whose nonce does not match", async () => {
    const t = convexTest(schema, modules);
    const { state } = await start(t);
    mockFetch(s => s.url.pathname === "/oauth/token"
      ? json(200, { access_token: "acc-1", refresh_token: "ref-1", expires_in: 3600, id_token: idToken({ sub: "u", nonce: "other" }) })
      : undefined);
    expect((await t.fetch("/whop/oauth/callback?code=c&state=" + state)).status).toBe(502);
    expect(await t.run(ctx => ctx.db.query("whopAuth").collect())).toHaveLength(0);
  });

  test("a failed exchange is logged and stores nothing", async () => {
    const t = convexTest(schema, modules);
    const { state } = await start(t);
    mockFetch(s => s.url.pathname === "/oauth/token" ? json(400, { error: "invalid_grant", error_description: "bad code" }) : undefined);
    expect((await t.fetch("/whop/oauth/callback?code=c&state=" + state)).status).toBe(502);
    const calls = await t.run(ctx => ctx.db.query("calls").collect());
    expect(calls[0]).toMatchObject({ service: "whop", op: "oauth.exchange", status: "error" });
    expect(await t.run(ctx => ctx.db.query("whopAuth").collect())).toHaveLength(0);
  });
});

describe("refresh rotation", () => {
  test("tokenFor returns the demo token for any user and only calls Whop once it is near expiry", async () => {
    const t = convexTest(schema, modules);
    const a = await user(t, "public", "a");
    const b = await user(t, "dryRun", "b");
    expect(await t.action(internal.whopAuth.tokenFor, { userId: a })).toBeNull();
    await connect(t);
    const seen = mockFetch(() => undefined);
    expect(await t.action(internal.whopAuth.tokenFor, { userId: a })).toBe("acc-1");
    expect(await t.action(internal.whopAuth.tokenFor, { userId: b })).toBe("acc-1");
    expect(seen).toHaveLength(0);
  });

  test("rotates the refresh token on every refresh and persists each new one", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t, "public");
    await connect(t, Date.now() + 60_000);
    let n = 1;
    const seen = mockFetch(s => {
      if (s.url.pathname !== "/oauth/token") return undefined;
      n++;
      return json(200, { access_token: "acc-" + n, refresh_token: "ref-" + n, expires_in: 3600 });
    });
    expect(await t.action(internal.whopAuth.tokenFor, { userId })).toBe("acc-2");
    expect(seen[0].body).toEqual({ grant_type: "refresh_token", refresh_token: "ref-1", client_id: "app_test", client_secret: "secret-test" });
    let row = (await t.run(ctx => ctx.db.query("whopAuth").first()))!;
    expect(row).toMatchObject({ accessToken: "acc-2", refreshToken: "ref-2", expiresAt: Date.now() + 3600_000 });
    expect(row.refreshingUntil).toBeUndefined();

    vi.advanceTimersByTime(3600_000);
    expect(await t.action(internal.whopAuth.tokenFor, { userId })).toBe("acc-3");
    expect(seen[1].body.refresh_token).toBe("ref-2");
    row = (await t.run(ctx => ctx.db.query("whopAuth").first()))!;
    expect(row.refreshToken).toBe("ref-3");
    const logged = JSON.stringify(await t.run(ctx => ctx.db.query("calls").collect()));
    expect(logged).not.toMatch(/acc-|ref-|secret-test/);
  });

  test("a revoked grant disconnects; a transient failure keeps the login and frees the lease", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t, "public");
    await connect(t, Date.now() - 1);
    mockFetch(s => s.url.pathname === "/oauth/token" ? json(503, { error: "unavailable" }) : undefined);
    await expect(t.action(internal.whopAuth.tokenFor, { userId })).rejects.toThrow();
    const row = (await t.run(ctx => ctx.db.query("whopAuth").first()))!;
    expect(row.refreshToken).toBe("ref-1");
    expect(row.refreshingUntil).toBeUndefined();

    mockFetch(s => s.url.pathname === "/oauth/token" ? json(400, { error: "invalid_grant" }) : undefined);
    expect(await t.action(internal.whopAuth.tokenFor, { userId })).toBeNull();
    expect(await t.run(ctx => ctx.db.query("whopAuth").collect())).toHaveLength(0);
  });

  test("a refresh already running makes others wait for the lease instead of spending the refresh token twice", async () => {
    const t = convexTest(schema, modules);
    await connect(t, Date.now() - 1);
    expect(await t.mutation(internal.whopAuth.lease, {})).toEqual({ refresh: "ref-1" });
    expect(await t.mutation(internal.whopAuth.lease, {})).toEqual({ wait: true });
  });
});

describe("Whop Bounty auto-submit", () => {
  function whopApi(handlers: { create?: (s: Seen) => Response; list?: (s: Seen) => Response }) {
    return mockFetch(s => {
      if (s.url.pathname === "/api/v1/bounty_submissions" && s.method === "POST") return handlers.create?.(s);
      if (s.url.pathname === "/api/v1/bounty_submissions" && s.method === "GET") return handlers.list?.(s);
    });
  }

  test("a live public post is submitted with the demo token, then the poll moves it to approved", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t, "public");
    const bountyId = await whopBounty(t);
    const { videoId, postId } = await livePost(t, userId, bountyId, "public");
    await connect(t);
    const seen = whopApi({ create: () => json(200, { id: "btys_1", status: "submitted" }) });

    await t.action(internal.submit.forPost, { postId });
    expect(seen).toHaveLength(1);
    expect(seen[0].headers.authorization).toBe("Bearer acc-1");
    expect(seen[0].headers["idempotency-key"]).toBe(postId);
    expect(seen[0].body).toEqual({ bounty_id: "bnty_test1", deliverable: { urls: ["https://youtube.com/shorts/abc"] } });
    let [s] = await submissions(t);
    expect(s).toMatchObject({ status: "submitted", externalId: "btys_1" });
    expect(s.submittedAt).toBeDefined();
    expect(s.error).toBeUndefined();
    expect(await t.query(api.submit.forVideo, { deviceId: "dev-public", videoId })).toMatchObject({
      status: "submitted", auto: true, selfReported: false, note: null, deepLink: "https://whop.com/bounty/bnty_test1",
    });

    await t.action(internal.submit.forPost, { postId });
    expect(await submissions(t)).toHaveLength(1);

    const list = whopApi({ list: () => json(200, { data: [{ id: "btys_1", status: "submitted" }], page_info: {} }) });
    await t.action(internal.submit.poll, {});
    expect(list[0].url.searchParams.get("bounty_id")).toBe("bnty_test1");
    expect((await submissions(t))[0].status).toBe("submitted");

    whopApi({ list: () => json(200, { data: [{ id: "btys_1", status: "approved" }], recommended_action: "ignore me" }) });
    await t.action(internal.submit.poll, {});
    [s] = await submissions(t);
    expect(s.status).toBe("approved");
    expect(s.resolvedAt).toBeDefined();

    const done = whopApi({});
    await t.action(internal.submit.poll, {});
    expect(done).toHaveLength(0);
    const calls = await t.run(ctx => ctx.db.query("calls").collect());
    expect(calls.map(c => c.op)).toEqual(["bounty_submissions.create", "bounty_submissions.list", "bounty_submissions.list"]);
    expect(JSON.stringify(calls)).not.toContain("acc-1");
  });

  test("a denied submission keeps Whop's reason", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t, "public");
    const { postId } = await livePost(t, userId, await whopBounty(t), "public");
    await connect(t);
    whopApi({ create: () => json(201, { id: "btys_2", status: "submitted" }) });
    await t.action(internal.submit.forPost, { postId });
    whopApi({ list: () => json(200, { data: [{ id: "btys_2", status: "denied", denial_reason: "Wrong format" }] }) });
    await t.action(internal.submit.poll, {});
    expect((await submissions(t))[0]).toMatchObject({ status: "denied", denialReason: "Wrong format" });
  });

  test("with no demo login the row waits as pending, visibly, and the poll submits it once connected", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t, "public");
    const { videoId, postId } = await livePost(t, userId, await whopBounty(t), "public");
    const none = whopApi({});
    await t.action(internal.submit.forPost, { postId });
    expect(none).toHaveLength(0);
    expect((await submissions(t))[0]).toMatchObject({ status: "pending", error: NOT_CONNECTED });
    expect(await t.query(api.submit.forVideo, { deviceId: "dev-public", videoId })).toMatchObject({ status: "pending", auto: true, note: NOT_CONNECTED });

    await connect(t);
    const seen = whopApi({ create: () => json(200, { id: "btys_3", status: "submitted" }) });
    await t.action(internal.submit.poll, {});
    expect(seen).toHaveLength(1);
    const [s] = await submissions(t);
    expect(s).toMatchObject({ status: "submitted", externalId: "btys_3" });
    expect(s.error).toBeUndefined();
  });

  test("a Whop outage keeps the row pending for the next poll; a refusal falls back to manual with Whop's message", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t, "public");
    const { videoId, postId } = await livePost(t, userId, await whopBounty(t), "public");
    await connect(t);
    whopApi({ create: () => json(503, { error: { message: "down" } }) });
    await t.action(internal.submit.forPost, { postId });
    expect((await submissions(t))[0]).toMatchObject({ status: "pending", checks: 1 });
    expect((await submissions(t))[0].error).toMatch(/Retrying/);

    whopApi({ create: () => json(422, { error: { message: "You already have a submission under review" } }) });
    await t.action(internal.submit.poll, {});
    const [s] = await submissions(t);
    expect(s).toMatchObject({ status: "manual", error: "Whop refused: You already have a submission under review" });
    expect(s.externalId).toBeUndefined();
    expect(await t.query(api.submit.forVideo, { deviceId: "dev-public", videoId })).toMatchObject({ status: "manual", auto: true });

    await t.mutation(internal.submit.retry, { submissionId: s._id });
    expect((await submissions(t))[0].status).toBe("pending");
  });

  test("settle schedules the submit for a public post going live", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t, "public");
    const bountyId = await whopBounty(t);
    const { postId } = await t.run(async ctx => {
      const videoId = await ctx.db.insert("videos", { userId, status: "right", rank: 0, attempts: 0, createdAt: 0, bountyId });
      return { postId: await ctx.db.insert("posts", { userId, videoId, platform: "youtube", status: "publishing", mode: "public", views: 0, slotAt: 0, checks: 0 }) };
    });
    await connect(t);
    const seen = whopApi({ create: () => json(200, { id: "btys_4", status: "submitted" }) });
    await t.mutation(internal.post.settle, { postId, status: "live", url: "https://youtube.com/shorts/xyz" });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(seen).toHaveLength(1);
    expect(seen[0].body.deliverable.urls).toEqual(["https://youtube.com/shorts/xyz"]);
  });
});

describe("posting modes", () => {
  test.each(["dryRun", "private"] as const)("a %s post never calls Whop and records no submission", async mode => {
    const t = convexTest(schema, modules);
    const userId = await user(t, mode);
    const bountyId = await whopBounty(t);
    await connect(t);
    const seen = mockFetch(() => undefined);
    const live = await livePost(t, userId, bountyId, mode);
    await t.mutation(internal.post.settle, { postId: live.postId, status: "live", url: "https://youtube.com/shorts/abc" });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    await t.action(internal.submit.forPost, { postId: live.postId });
    const dry = await livePost(t, userId, bountyId, mode, "dry_run");
    await t.action(internal.submit.forPost, { postId: dry.postId });
    await t.action(internal.submit.poll, {});
    expect(whopCalls(seen)).toHaveLength(0);
    expect(await submissions(t)).toHaveLength(0);
  });
});

describe("Content Rewards stays manual", () => {
  test("a public post makes a manual row, never calls Whop, and the user confirms it by hand", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t, "public");
    const { videoId, postId } = await livePost(t, userId, await contentRewards(t), "public");
    await connect(t);
    const seen = mockFetch(() => undefined);
    await t.action(internal.submit.forPost, { postId });
    await t.action(internal.submit.poll, {});
    expect(seen).toHaveLength(0);
    expect(await t.query(api.submit.forVideo, { deviceId: "dev-public", videoId })).toEqual({
      status: "manual", deepLink: "https://contentrewards.com/c/campaigns/cc01", denialReason: null,
      postUrl: "https://youtube.com/shorts/abc", brand: "Reach", selfReported: false, auto: false, note: null,
    });
    await t.mutation(api.submit.markSubmitted, { deviceId: "dev-public", videoId });
    expect(await t.query(api.submit.forVideo, { deviceId: "dev-public", videoId })).toMatchObject({ status: "submitted", selfReported: true });
    await t.action(internal.submit.poll, {});
    expect(seen).toHaveLength(0);
  });
});

describe("addWhopBounty", () => {
  test("upserts a whop_bounty row by its bnty_ id and rejects other ids", async () => {
    const t = convexTest(schema, modules);
    const id = await whopBounty(t);
    expect(await whopBounty(t)).toBe(id);
    const b = (await t.run(ctx => ctx.db.get(id)))!;
    expect(b).toMatchObject({ source: "whop_bounty", rewardKind: "per_submission", rewardCents: 500, mode: "original", status: "open", goalType: "clipping" });
    await expect(t.mutation(internal.bounties.addWhopBounty, {
      externalId: "cc01", title: "x", brand: "x", description: "", rewardCents: 1, url: "https://whop.com",
    })).rejects.toThrow(/bnty_/);
  });
});

describe("importDemoToken", () => {
  test("imports a minted token once; Convex then refreshes it and keeps the rotated refresh token", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t, "public");
    const res = await t.mutation(internal.whopAuth.importDemoToken, {
      accessToken: "acc-minted", refreshToken: "ref-minted", expiresAt: Math.floor(Date.now() / 1000) + 3600,
      scope: "openid profile bounty:basic:read bounty:submission:create",
    });
    expect(res).toEqual({ connected: true, expiresAt: new Date(Math.floor(Date.now() / 1000) * 1000 + 3600_000).toISOString() });
    expect(JSON.stringify(res)).not.toContain("minted");
    const row = (await t.run(ctx => ctx.db.query("whopAuth").first()))!;
    expect(row.scopes).toEqual(["openid", "profile", "bounty:basic:read", "bounty:submission:create"]);
    expect(await t.query(api.whopAuth.status, { deviceId: "dev-public" })).toEqual({ connected: true, username: null });

    const none = mockFetch(() => undefined);
    expect(await t.action(internal.whopAuth.tokenFor, { userId })).toBe("acc-minted");
    expect(none).toHaveLength(0);

    vi.advanceTimersByTime(3600_000);
    const seen = mockFetch(s => s.url.pathname === "/oauth/token" ? json(200, { access_token: "acc-new", refresh_token: "ref-new", expires_in: 3600 }) : undefined);
    expect(await t.action(internal.whopAuth.tokenFor, { userId })).toBe("acc-new");
    expect(seen[0].body.refresh_token).toBe("ref-minted");
    expect((await t.run(ctx => ctx.db.query("whopAuth").collect())).map(r => r.refreshToken)).toEqual(["ref-new"]);
  });

  test("the recovery link also works with only WHOP_CALLBACK_URL set", async () => {
    vi.stubEnv("WHOP_OAUTH_REDIRECT", undefined as unknown as string);
    vi.stubEnv("WHOP_CALLBACK_URL", "https://cb.example/whop/oauth/callback");
    const t = convexTest(schema, modules);
    const { url } = await t.action(internal.whopAuth.authorizeUrl, {});
    expect(new URL(url).searchParams.get("redirect_uri")).toBe("https://cb.example/whop/oauth/callback");
  });
});
