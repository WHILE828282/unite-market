/* GET /api/test-email?key=ADMIN_KEY&to=EMAIL -> sends a sample ticket email (not a real ticket: it isn't saved,
   so it shows "Invalid" at the door). To check that ticket emails arrive and look right before sales open. */
import { same, sendTicket, newTicketId, ticketCode, ticketsReady } from "./_ticket.js";
import { origin } from "./_http.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const q = req.query || {};
  if (!process.env.ADMIN_KEY || !same(String(process.env.ADMIN_KEY).trim(), String(q.key || "").trim())) return res.status(403).json({ ok: false, error: "Wrong admin key." });
  const to = String(q.to || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ ok: false, error: "Add &to=your@email" });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ ok: false, error: "RESEND_API_KEY isn't set for this deployment." });
  if (!ticketsReady()) return res.status(503).json({ ok: false, error: "TICKET_SECRET isn't set for this deployment." });
  const id = newTicketId();
  const order = { id: "TEST" + Date.now(), email: to, amount: 100 };
  const sent = await sendTicket(order, [{ id, code: ticketCode(id), label: "General Admission · Male (test)" }], origin(req));
  return res.status(sent ? 200 : 502).json(sent ? { ok: true, sentTo: to, note: "Sample only: this QR isn't a real ticket." } : { ok: false, error: "Resend refused the email. Check the Resend dashboard → Logs." });
}
