/* GET /api/orders?key=ADMIN_KEY -> guest list as CSV, one row per ticket (person), with check-in times. */
import crypto from "node:crypto";
import { dbConfigured, ensureSchema, paidOrders, allTickets } from "./_db.js";

const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const cell = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;

export default async function handler(req, res) {
  const key = String((req.query && req.query.key) || "");
  if (!process.env.ADMIN_KEY || !same(key, process.env.ADMIN_KEY)) return res.status(403).send("Forbidden");
  if (!dbConfigured()) return res.status(503).send("No database");
  await ensureSchema();
  const orders = Object.fromEntries((await paidOrders()).map((o) => [o.id, o]));
  const rows = (await allTickets()).filter((t) => orders[t.order_id]);
  const csv = [["ticket", "type", "name", "email", "phone", "price_aed", "status", "checked_in_at", "order", "paid_at"].join(","),
    ...rows.map((t) => { const o = orders[t.order_id]; return [t.id, t.label, t.name, t.email, o.phone, t.price, t.status,
      t.checked_in_at ? new Date(t.checked_in_at).toISOString() : "", o.id, new Date(o.paid_at).toISOString()].map(cell).join(","); })].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="project-x-guests.csv"');
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(csv);
}
