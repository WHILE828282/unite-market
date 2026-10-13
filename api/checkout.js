/* POST { items: { "p1-male": 2, ... } } -> holds the tickets for 15 minutes and returns the Stripe Checkout URL.
   POST { a: "cancel", order }            -> buyer came back without paying: frees the places at once. */
import { EVENT, HOLD_MINUTES, TYPES, readCart, lineName } from "./_tickets.js";
import { dbConfigured, ensureSchema, holdOrder, setSession, setStatus, getOrder, sweepHolds } from "./_db.js";
import { stripeOn, stripe, expireSession } from "./_stripe.js";
import { newId, ticketsReady } from "./_ticket.js";
import { body, origin, methodOk } from "./_http.js";

export default async function handler(req, res) {
  if (!methodOk(req, res, ["POST"])) return;
  res.setHeader("Cache-Control", "no-store");
  const fail = (error, status = 400) => res.status(status).json({ ok: false, error });
  if (!dbConfigured() || !stripeOn() || !ticketsReady()) return fail("Ticket sales open soon.", 503);
  const b = body(req);

  try {
    await ensureSchema();

    if (b.a === "cancel") {
      const id = String(b.order || "");
      const o = /^[A-Za-z0-9]{16,40}$/.test(id) ? await getOrder(id) : null;
      if (o && o.status === "held") {
        await setStatus(id, "cancelled");
        if (o.stripe_session) await expireSession(o.stripe_session);
      }
      return res.status(200).json({ ok: true });
    }

    const c = readCart(b.items);
    if (c.error) return fail(c.error);
    await Promise.allSettled((await sweepHolds()).map(expireSession));

    const id = newId();
    const held = await holdOrder(id, c.cart, c.uses, c.total);
    if (!held) return fail("Sorry, not enough tickets left for this order. Check what's still available and try again.", 409);

    const site = origin(req);
    let session;
    try {
      session = await stripe("/checkout/sessions", {
        mode: "payment",
        client_reference_id: id,
        metadata: { order_id: id, event: EVENT.id },
        payment_intent_data: { metadata: { order_id: id, event: EVENT.id }, description: `${EVENT.name} tickets` },
        line_items: Object.entries(c.cart).map(([tid, qty]) => ({
          quantity: qty,
          price_data: { currency: "aed", unit_amount: TYPES[tid].price * 100, product_data: { name: `${EVENT.name} · ${lineName(tid)}` } },
        })).concat(c.fee > 0 ? [{ quantity: 1, price_data: { currency: "aed", unit_amount: Math.round(c.fee * 100), product_data: { name: "Booking fee (10%)" } } }] : []),
        phone_number_collection: { enabled: "true" },
        // Stripe's minimum is 30 minutes; our own 15-minute hold closes the page earlier (see sweepHolds).
        expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
        success_url: `${site}/success?order=${id}`,
        cancel_url: `${site}/?cancelled=${id}#tickets`,
      });
    } catch (e) {
      await setStatus(id, "cancelled");
      console.error("Stripe checkout failed:", e && e.message);
      return fail("Payments are unavailable right now. Please try again in a minute.", 502);
    }
    await setSession(id, session.id);
    return res.status(200).json({ ok: true, order: id, url: session.url, expiresAt: held.expires_at, holdMinutes: HOLD_MINUTES });
  } catch (e) {
    console.error("Checkout failed:", e && e.message);
    return fail("Something went wrong. Please try again.", 500);
  }
}
