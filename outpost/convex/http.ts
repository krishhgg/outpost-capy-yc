import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { fromPayment, verifyWebhook } from "./whop";
import { callback as whopOAuthCallback } from "./whopAuth";
import { inbound as kakaiInbound } from "./agent";

const http = httpRouter();

http.route({
  path: "/whop/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.text();
    const secret = await ctx.runQuery(internal.whop.webhookSecret, {});
    if (!secret || !(await verifyWebhook(body, req.headers, secret))) return new Response("bad signature", { status: 401 });
    let evt: any;
    try { evt = JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }
    if (evt?.type === "payment.succeeded" && evt.data?.id) {
      await ctx.runMutation(internal.raids.recordPayment, { ...fromPayment(evt.data), via: "webhook" });
    }
    return new Response("ok", { status: 200 });
  }),
});

http.route({ path: "/whop/oauth/callback", method: "GET", handler: whopOAuthCallback });
http.route({ path: "/kakai/webhook", method: "POST", handler: kakaiInbound });

export default http;
