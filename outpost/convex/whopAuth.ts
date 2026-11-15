import { v } from "convex/values";
import { httpAction, internalQuery, query } from "./_generated/server";

// v1 has no in-app Whop connect: every user acts through the one demo Whop account, whose token stays server-side.

// The Whop access token to act for this user: the demo account's token for every user in v1, or null.
// Only Convex actions may use it. Never return it from a public function or write it to `calls`.
export const tokenFor = internalQuery({
  args: { userId: v.id("users") },
  handler: async (): Promise<string | null> => null,
});

// Whether the demo Whop account is connected, and its username. Never the token.
export const status = query({
  args: { deviceId: v.string() },
  handler: async (): Promise<{ connected: boolean; username: string | null }> => ({ connected: false, username: null }),
});

// GET /whop/oauth/callback. Builders use it once to mint the demo account's token.
export const callback = httpAction(async () => new Response("Whop connect is not set up", { status: 404 }));
