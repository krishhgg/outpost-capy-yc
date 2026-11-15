import { v } from "convex/values";
import { httpAction, internalQuery, query } from "./_generated/server";

// Seams for real Whop accounts later. v1 has no Whop OAuth and no token: submissions are one-tap "Submit on Whop".

// The Whop access token to act for this user. Always null in v1.
// Only Convex actions may use a token. Never return it from a public function or write it to `calls`.
export const tokenFor = internalQuery({
  args: { userId: v.id("users") },
  handler: async (): Promise<string | null> => null,
});

// Whether a Whop account is connected, and its username. Never the token.
export const status = query({
  args: { deviceId: v.string() },
  handler: async (): Promise<{ connected: boolean; username: string | null }> => ({ connected: false, username: null }),
});

// GET /whop/oauth/callback. Unused in v1.
export const callback = httpAction(async () => new Response("Whop connect is not set up", { status: 404 }));
