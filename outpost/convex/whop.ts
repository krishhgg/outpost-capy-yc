import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { SHOP_PRODUCT, whopIsTest } from "./raids";

const VERSION = "2026-11-12";
const base = () => (whopIsTest() ? "https://sandbox-api.whop.com/api/v1" : "https://api.whop.com/api/v1");
const WEBHOOK_URL = "whop.webhook.url";
const WEBHOOK_SECRET = "whop.webhook.secret";

type Res = { ok: boolean; status: number; json: any; text: string };

// Every Whop call is logged for the under-the-hood page. `summary` decides what the log shows, so secrets never land there.
async function whop(
  ctx: ActionCtx, userId: Id<"users">, op: string, path: string,
  opts: { method: "GET" | "POST"; body?: unknown; idem?: string; quiet?: boolean; summary?: (json: any) => string },
): Promise<Res> {
  const t0 = Date.now();
  const r = await fetch(`${base()}${path}`, {
    method: opts.method,
    headers: {
      Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
      "Api-Version-Date": VERSION,
      "Content-Type": "application/json",
      ...(opts.idem ? { "Idempotency-Key": opts.idem } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await r.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  if (!opts.quiet || !r.ok) {
    const shown = r.ok && opts.summary ? opts.summary(json) : text.slice(0, 240);
    await ctx.runMutation(internal.post.call, {
      userId, service: "whop", op, status: r.ok ? "ok" : "error", ms: Date.now() - t0,
      detail: `${opts.method} ${path.split("?")[0]} -> ${r.status} ${shown}`,
    });
  }
  return { ok: r.ok, status: r.status, json, text };
}

const errText = (r: Res) => r.json?.error?.message ?? r.json?.message ?? `Whop answered ${r.status}`;

export const setup = internalAction({
  args: { raidId: v.id("raids") },
  handler: async (ctx, { raidId }): Promise<void> => {
    const s = await ctx.runQuery(internal.raids.forSetup, { raidId });
    if (!s) return;
    const { raid, offer } = s;
    const uid = raid.userId;
    const fail = (key: string, note: string) => ctx.runMutation(internal.raids.setStep, { raidId, key, state: "error", note });

    // Real checkouts stay off: nothing delivers the template yet, and this project takes no real payments.
    if (!whopIsTest()) {
      await fail("product", "Real Whop checkouts are off");
      return;
    }
    if (!process.env.WHOP_API_KEY) {
      await ctx.runMutation(internal.post.call, { userId: uid, service: "whop", op: "setup", status: "skipped", ms: 0, detail: "WHOP_API_KEY is not set" });
      await fail("product", "Waiting on the Whop key");
      return;
    }

    // A dropped connection still leaves the step in error, so the app shows Try again.
    let step = "product";
    try {
      let productId = offer.whopProductId;
      if (!productId) {
        const r = await whop(ctx, uid, "create product", "/products", {
          method: "POST", idem: `${raidId}-product`,
          body: {
            title: SHOP_PRODUCT.title, headline: SHOP_PRODUCT.headline, description: SHOP_PRODUCT.description,
            visibility: "visible", global_affiliate_status: "disabled", send_welcome_message: false,
            metadata: { raidId, offerId: offer._id },
          },
          summary: j => `${j?.id} "${j?.title}"`,
        });
        if (!r.ok || !r.json?.id) return void (await fail("product", errText(r)));
        productId = r.json.id as string;
        await ctx.runMutation(internal.raids.saveOffer, { offerId: offer._id, whopProductId: productId });
      }
      await ctx.runMutation(internal.raids.setStep, { raidId, key: "product", state: "done", note: productId });

      step = "checkout";
      if (!offer.purchaseUrl) {
        const r = await whop(ctx, uid, "create checkout", "/checkout_configurations", {
          method: "POST", idem: `${raidId}-checkout`,
          body: {
            mode: "payment",
            variant: { product_id: productId, billing_type: "one_time", initial_price: offer.priceCents / 100, currency: "usd", title: "Template" },
            metadata: { raidId, offerId: offer._id, userId: uid },
          },
          summary: j => `${j?.id} ${j?.purchase_url}`,
        });
        if (!r.ok || !r.json?.purchase_url) return void (await fail("checkout", errText(r)));
        await ctx.runMutation(internal.raids.saveOffer, { offerId: offer._id, checkoutId: r.json.id, purchaseUrl: r.json.purchase_url });
      }
      await ctx.runMutation(internal.raids.setStep, { raidId, key: "checkout", state: "done", note: `$${(offer.priceCents / 100).toFixed(2)} one time` });

      step = "alerts";
      // A webhook needs a public URL. Without one, the poll alone watches for sales.
      const site = process.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
      let note = `Checking Whop every 4 s`;
      if (site) {
        const url = `${site}/whop/webhook`;
        if ((await ctx.runQuery(internal.whop.kvGet, { key: WEBHOOK_URL })) !== url) {
          const r = await whop(ctx, uid, "create webhook", "/webhooks", {
            method: "POST",
            body: { url, events: ["payment.succeeded"], api_version_date: VERSION, enabled: true, title: "Outpost" },
            summary: j => `${j?.id} ${j?.url}`, // never the signing secret
          });
          if (!r.ok || !r.json?.webhook_secret) return void (await fail("alerts", errText(r)));
          await ctx.runMutation(internal.whop.kvSet, { key: WEBHOOK_SECRET, value: r.json.webhook_secret });
          await ctx.runMutation(internal.whop.kvSet, { key: WEBHOOK_URL, value: url });
        }
        note = "Webhook, plus a check every 4 s";
      }
      await ctx.runMutation(internal.raids.setStep, { raidId, key: "alerts", state: "done", note });
    } catch {
      await fail(step, "Couldn't reach Whop");
    }
  },
});

export const poll = internalAction({
  args: { raidId: v.id("raids"), gen: v.number() },
  handler: async (ctx, { raidId, gen }): Promise<void> => {
    try {
      const s = await ctx.runQuery(internal.raids.forSetup, { raidId });
      if (!s || !process.env.WHOP_API_KEY || !s.offer.whopProductId) return;
      // Read every page so sales made while polling was off still count. recordPayment skips ones already saved.
      let after: string | undefined;
      for (let page = 0; page < 10; page++) {
        const q = new URLSearchParams({ product_id: s.offer.whopProductId, first: "50", order: "created_at", direction: "desc", ...(after ? { after } : {}) });
        const r = await whop(ctx, s.raid.userId, "list payments", `/payments?${q}`, { method: "GET", quiet: true });
        if (!r.ok) break;
        for (const p of r.json?.data ?? []) {
          if (p?.status === "paid") await ctx.runMutation(internal.raids.recordPayment, { ...fromPayment(p), via: "poll" });
        }
        after = r.json?.page_info?.has_next_page ? r.json.page_info.end_cursor : undefined;
        if (!after) break;
      }
    } finally {
      await ctx.runMutation(internal.raids.pollNext, { raidId, gen });
    }
  },
});

export function fromPayment(p: any) {
  const opt = (x: unknown) => (typeof x === "string" && x ? x : undefined);
  return {
    paymentId: String(p.id),
    productId: opt(p.product_id),
    checkoutId: opt(p.checkout_configuration_id),
    total: opt(p.total?.amount) ?? opt(p.usd_total?.amount),
    net: opt(p.amount_after_fees?.amount),
  };
}

// Standard Webhooks, signed with the literal bytes of Whop's secret (see @whop/sdk helpers/verifyWebhook).
export async function verifyWebhook(body: string, headers: Headers, secret: string) {
  const id = headers.get("webhook-id"), ts = headers.get("webhook-timestamp"), sig = headers.get("webhook-signature");
  if (!id || !ts || !sig) return false;
  if (!Number.isFinite(Number(ts)) || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${id}.${ts}.${body}`)));
  let bin = "";
  for (const b of mac) bin += String.fromCharCode(b);
  const want = btoa(bin);
  return sig.split(" ").some(part => {
    const [ver, got] = part.split(",");
    if (ver !== "v1" || !got || got.length !== want.length) return false;
    let diff = 0;
    for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ got.charCodeAt(i);
    return diff === 0;
  });
}

export const kvGet = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => (await ctx.db.query("kv").withIndex("by_key", q => q.eq("key", key)).unique())?.value ?? null,
});

export const kvSet = internalMutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const row = await ctx.db.query("kv").withIndex("by_key", q => q.eq("key", key)).unique();
    if (row) await ctx.db.patch(row._id, { value });
    else await ctx.db.insert("kv", { key, value });
  },
});

export const webhookSecret = internalQuery({
  args: {},
  handler: async (ctx): Promise<string | null> =>
    process.env.WHOP_WEBHOOK_SECRET ?? (await ctx.db.query("kv").withIndex("by_key", q => q.eq("key", WEBHOOK_SECRET)).unique())?.value ?? null,
});
