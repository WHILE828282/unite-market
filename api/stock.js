/* GET /api/stock -> the ticket catalog with how many of each type can still be bought.
   Also closes holds older than 15 minutes, so places come back on their own. */
import { GROUPS, MAX_PER_ORDER, HOLD_MINUTES, typesLeft } from "./_tickets.js";
import { dbConfigured, ensureSchema, poolsLeft, sweepHolds } from "./_db.js";
import { stripeOn, expireSession } from "./_stripe.js";
import { methodOk } from "./_http.js";

export default async function handler(req, res) {
  if (!methodOk(req, res, ["GET"])) return;
  res.setHeader("Cache-Control", "no-store");
  const live = dbConfigured() && stripeOn();
  let left = null;
  if (live) {
    try {
      await ensureSchema();
      const stale = await sweepHolds();
      await Promise.allSettled(stale.map(expireSession));
      left = typesLeft(await poolsLeft());
    } catch (e) {
      console.error("Stock lookup failed:", e && e.message);
      return res.status(200).json({ ok: false, live: false, error: "Tickets are unavailable right now. Please try again in a minute." });
    }
  }
  const groups = GROUPS.map((g) => ({ name: g.name, note: g.note, badge: g.badge || "",
    types: g.types.map((t) => ({ id: t.id, name: t.name, price: t.price, left: left ? left[t.id] : 0 })) }));
  return res.status(200).json({ ok: true, live, groups, maxPerOrder: MAX_PER_ORDER, holdMinutes: HOLD_MINUTES });
}
