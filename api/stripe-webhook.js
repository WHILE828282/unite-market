/* Stripe webhook (Dashboard → Developers → Webhooks → https://unite.market/api/stripe-webhook).
   Events: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired.
   A ticket counts as sold only here, when Stripe confirms the money. If the hold ran out and the places are
   gone by then, the payment is refunded automatically. */
import { dbConfigured, ensureSchema, getOrder, markPaid, setStatus, markEmailed, addTickets } from "./_db.js";
import { verifyWebhook, refund } from "./_stripe.js";
import { makeTickets, newTicketId, ticketCode, sendTicket } from "./_ticket.js";
import { origin } from "./_http.js";

// Raw body is needed for the signature; Vercel only parses req.body when it is read, so read the stream instead.
const rawBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  req.on("error", reject);
});

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end(); }
  const event = verifyWebhook(await rawBody(req), req.headers["stripe-signature"]);
  if (!event) return res.status(400).json({ ok: false, error: "Bad signature" });
  if (!dbConfigured()) return res.status(500).json({ ok: false });

  const s = event.data && event.data.object;
  const id = s && ((s.metadata && s.metadata.order_id) || s.client_reference_id);
  if (!id) return res.status(200).json({ ok: true, ignored: true });

  try {
    await ensureSchema();
    const order = await getOrder(id);
    if (!order) return res.status(200).json({ ok: true, ignored: "unknown order" });

    if (event.type === "checkout.session.expired") {
      await setStatus(id, "expired");
      return res.status(200).json({ ok: true });
    }

    const paid = (event.type === "checkout.session.completed" && s.payment_status === "paid") || event.type === "checkout.session.async_payment_succeeded";
    if (!paid) return res.status(200).json({ ok: true, ignored: event.type });
    if (order.status === "paid" || order.status === "refunded") return res.status(200).json({ ok: true, already: order.status });

    const d = s.customer_details || {};
    const done = await markPaid(id, { email: d.email || null, name: d.name || null, phone: d.phone || null, paymentIntent: s.payment_intent || null });
    if (!done) {
      // Hold lapsed and the places were sold to someone else meanwhile.
      if (s.payment_intent) await refund(s.payment_intent, id);
      await setStatus(id, "refunded", ["held", "expired", "cancelled"]);
      return res.status(200).json({ ok: true, refunded: true });
    }
    const tickets = await addTickets(done, makeTickets(done.items), newTicketId, ticketCode); // one per person
    if (await sendTicket(done, tickets, origin(req)).catch((e) => { console.error("Ticket email failed:", e && e.message); return false; })) await markEmailed(id);
    return res.status(200).json({ ok: true, paid: true });
  } catch (e) {
    console.error("Webhook failed:", e && e.message);
    return res.status(500).json({ ok: false }); // Stripe retries
  }
}
