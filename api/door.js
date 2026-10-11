/* Door check-in, like the Unite host scanner. Staff open /door and enter DOOR_KEY.
   GET  ?key=DOOR_KEY                     -> every ticket with its check-in state, plus totals
   POST { key, code } or { key, id }      -> ok (checked in now) | used (already in) | invalid */
import { dbConfigured, ensureSchema, getTicket, checkIn, allTickets, getOrder } from "./_db.js";
import { parseTicketCode, isTicketId, same } from "./_ticket.js";
import { body, methodOk } from "./_http.js";

const keyOk = (k) => !!process.env.DOOR_KEY && same(String(process.env.DOOR_KEY).trim(), String(k || "").trim());
const view = (t, o) => ({ id: t.id, label: t.label, name: t.name || (o && o.name) || "", email: t.email || "", checkedIn: t.checked_in_at, refunded: t.status !== "valid" });

export default async function handler(req, res) {
  if (!methodOk(req, res, ["GET", "POST"])) return;
  res.setHeader("Cache-Control", "no-store");
  const b = req.method === "POST" ? body(req) : req.query || {};
  if (!String(process.env.DOOR_KEY || "").trim()) return res.status(503).json({ ok: false, error: "DOOR_KEY isn't set for this deployment. Add it in Vercel (Production) and redeploy." });
  if (!keyOk(b.key)) return res.status(403).json({ ok: false, error: "Wrong door key." });
  if (!dbConfigured()) return res.status(503).json({ ok: false, error: "The database isn't connected." });
  await ensureSchema();

  if (req.method === "GET") {
    const list = (await allTickets()).map((t) => view(t));
    return res.status(200).json({ ok: true, tickets: list, stats: { sold: list.filter((t) => !t.refunded).length, checkedIn: list.filter((t) => t.checkedIn).length } });
  }

  const id = b.code ? parseTicketCode(b.code) : isTicketId(b.id) ? String(b.id) : null;
  if (!id) return res.status(200).json({ ok: true, result: "invalid", reason: "Not a Project X ticket." });
  const t = await getTicket(id);
  if (!t) return res.status(200).json({ ok: true, result: "invalid", reason: "Ticket not found." });
  if (t.status !== "valid") return res.status(200).json({ ok: true, result: "invalid", reason: "This ticket was refunded.", attendee: view(t) });
  const o = await getOrder(t.order_id);
  if (!o || o.status !== "paid") return res.status(200).json({ ok: true, result: "invalid", reason: "This order isn't paid.", attendee: view(t, o) });
  const r = await checkIn(id);
  return res.status(200).json({ ok: true, result: r.first ? "ok" : "used", attendee: view(r.ticket, o) });
}
