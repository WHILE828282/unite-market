/* GET /api/stock -> the ticket catalog with how many of each type can still be bought.
   Also closes holds older than 15 minutes, so places come back on their own. */
import { GROUPS, POOLS, MAX_PER_ORDER, HOLD_MINUTES, FEE_RATE, REFERRAL_URL, typesLeft, stage } from "./_tickets.js";
import { dbConfigured, ensureSchema, poolsLeft, sweepHolds } from "./_db.js";
import { ticketsReady } from "./_ticket.js";
import { stripeOn, expireSession } from "./_stripe.js";
import { methodOk } from "./_http.js";

export default async function handler(req, res) {
  if (!methodOk(req, res, ["GET"])) return;
  res.setHeader("Cache-Control", "no-store");
  const live = dbConfigured() && stripeOn() && ticketsReady();
  let left = null, pools = null;
  if (live) {
    try {
      await ensureSchema();
      const stale = await sweepHolds();
      await Promise.allSettled(stale.map(expireSession));
      pools = await poolsLeft();
      left = typesLeft(pools);
    } catch (e) {
      console.error("Stock lookup failed:", e && e.message);
      return res.status(200).json({ ok: false, live: false, error: "Tickets are unavailable right now. Please try again in a minute." });
    }
  }
  // Referral link to the organiser's checkout (Ticket Tailor): every "Get tickets" button opens it.
  // TICKETS_URL in Vercel overrides the link we were given.
  const envUrl = String(process.env.TICKETS_URL || "").trim();
  const ticketsUrl = /^https:\/\/\S+$/.test(envUrl) ? envUrl : REFERRAL_URL;
  const groups = GROUPS.map((g) => ({ name: g.name, note: g.note || "", badge: g.badge || "", stage: stage(g),
    types: g.types.map((t) => ({ id: t.id, name: t.name, price: t.price, left: left ? left[t.id] : 0 })) }));
  // Places at the door: for the availability bar.
  const places = { total: POOLS.event, left: pools ? Math.max(0, pools.event) : POOLS.event };
  return res.status(200).json({ ok: true, live, groups, places, maxPerOrder: MAX_PER_ORDER, holdMinutes: HOLD_MINUTES, feeRate: FEE_RATE, ticketsUrl });
}
