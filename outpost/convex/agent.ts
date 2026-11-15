import { internalAction, httpAction } from "./_generated/server";

// Cron, every 5 minutes: decides which texts to send (batch ready, view spike, approval).
export const tick = internalAction({
  args: {},
  handler: async (): Promise<null> => null,
});

// POST /kakai/webhook: inbound iMessage replies.
export const inbound = httpAction(async () => new Response("ok", { status: 200 }));
