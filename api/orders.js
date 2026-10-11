/* GET /api/orders?key=ADMIN_KEY -> guest list of paid orders as CSV (for the door and accounting). */
import crypto from "node:crypto";
import { dbConfigured, ensureSchema, paidOrders } from "./_db.js";
import { lineName } from "./_tickets.js";
import { people } from "./_ticket.js";

const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const cell = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;

export default async function handler(req, res) {
  const key = String((req.query && req.query.key) || "");
  if (!process.env.ADMIN_KEY || !same(key, process.env.ADMIN_KEY)) return res.status(403).send("Forbidden");
  if (!dbConfigured()) return res.status(503).send("No database");
  await ensureSchema();
  const rows = await paidOrders();
  const csv = [["order", "paid_at", "name", "email", "phone", "tickets", "admits", "amount_aed", "code"].join(","),
    ...rows.map((o) => [o.id, new Date(o.paid_at).toISOString(), o.name, o.email, o.phone,
      Object.entries(o.items).map(([t, q]) => `${lineName(t)} x${q}`).join("; "), people(o.items), o.amount, o.ticket_code].map(cell).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="project-x-guests.csv"');
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(csv);
}
