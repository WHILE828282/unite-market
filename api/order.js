/* GET /api/order?id=ORDER -> status of one order for the success page (the id is the secret). */
import { dbConfigured, ensureSchema, getOrder } from "./_db.js";
import { lineName } from "./_tickets.js";
import { people } from "./_ticket.js";
import { methodOk } from "./_http.js";

export default async function handler(req, res) {
  if (!methodOk(req, res, ["GET"])) return;
  res.setHeader("Cache-Control", "no-store");
  const id = String((req.query && req.query.id) || "");
  if (!dbConfigured() || !/^[A-Za-z0-9]{16,40}$/.test(id)) return res.status(404).json({ ok: false });
  await ensureSchema();
  const o = await getOrder(id);
  if (!o) return res.status(404).json({ ok: false });
  const held = o.status === "held" && new Date(o.expires_at) > new Date();
  return res.status(200).json({
    ok: true,
    status: o.status === "held" && !held ? "expired" : o.status,
    amount: o.amount,
    lines: Object.entries(o.items).map(([tid, q]) => `${lineName(tid)} × ${q}`),
    admits: people(o.items),
    email: o.status === "paid" ? o.email : null,
    code: o.status === "paid" ? o.ticket_code : null,
  });
}
