/* Stripe over plain HTTPS (no SDK): Checkout Sessions, refunds and webhook signatures. Needs STRIPE_SECRET_KEY
   and, for the webhook, STRIPE_WEBHOOK_SECRET. */
import crypto from "node:crypto";

export const stripeOn = () => !!process.env.STRIPE_SECRET_KEY;

// Nested objects -> Stripe's form encoding: line_items[0][price_data][currency]=aed
function form(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

export async function stripe(path, params, method = "POST") {
  const r = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "GET" ? undefined : form(params || {}),
    signal: AbortSignal.timeout(15000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || `Stripe ${r.status}`);
  return j;
}

// Closes an unpaid Checkout page so it can't be paid after the hold ran out. Already closed/paid: ignored.
export const expireSession = (id) => stripe(`/checkout/sessions/${encodeURIComponent(id)}/expire`, {}).catch(() => null);

export const refund = (paymentIntent, orderId) => stripe("/refunds", { payment_intent: paymentIntent, reason: "requested_by_customer", metadata: { order_id: orderId, why: "sold_out_after_hold_expired" } });

// Verifies the Stripe-Signature header against the raw body (5-minute tolerance). Returns the event or null.
export function verifyWebhook(raw, header) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return null;
  const parts = Object.fromEntries(String(header).split(",").map((p) => p.split("=")).filter((p) => p.length === 2).map(([k, v]) => [k, v]));
  const sigs = String(header).split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return null;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const ok = sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
  if (!ok) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}
