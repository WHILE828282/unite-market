/* Tickets: one per person ("Admit one"), like Unite. The QR carries "U1.<ticket id>.<signature>" with ids like
   UNT-2026-K7M2Q, the same format as uniteuow.com, signed with this site's own TICKET_SECRET so a code can't be
   made up or altered. The door page (/door) checks them in. */
import crypto from "node:crypto";
import qrcode from "qrcode-generator";
import { EVENT, TYPES, lineName } from "./_tickets.js";

const secret = () => String(process.env.TICKET_SECRET || "").trim();
export const ticketsReady = () => !!secret();
const hmac = (label, v) => crypto.createHmac("sha256", `${label}:${secret()}`).update(String(v)).digest("base64url");
export const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b || "")); return x.length === y.length && crypto.timingSafeEqual(x, y); };
export const ticketSig = (id) => hmac("unite-ticket", id).slice(0, 12);
export const ticketCode = (id) => `U1.${id}.${ticketSig(id)}`;
export const isTicketId = (v) => /^UNT-\d{4}-[A-Z0-9]{5}$/.test(String(v || ""));
export const parseTicketCode = (code) => {
  const m = /^U1\.(UNT-\d{4}-[A-Z0-9]{5})\.([A-Za-z0-9_-]{12})$/.exec(String(code || "").trim());
  return m && same(ticketSig(m[1]), m[2]) ? m[1] : null;
};
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // same as Unite's ids
export const newTicketId = () => "UNT-2026-" + Array.from(crypto.randomBytes(5), (b) => ALPHABET[b % 32]).join("");

// Order ids (the secret part of the success link).
export const newId = () => crypto.randomBytes(15).toString("base64url").replace(/[-_]/g, "x"); // 20 letters/digits

export const people = (items) => Object.entries(items).reduce((n, [id, q]) => n + q * (TYPES[id] ? TYPES[id].uses.event : 1), 0);

// One ticket per person. Group of 4 -> 4 tickets at a quarter of the price each.
export function makeTickets(items) {
  const out = [];
  for (const [id, qty] of Object.entries(items)) {
    const t = TYPES[id];
    if (!t) continue;
    const each = t.uses.event;
    for (let i = 0; i < qty * each; i++) {
      const tid = newTicketId();
      out.push({ id: tid, code: ticketCode(tid), label: lineName(id), price: Math.round((t.price / each) * 100) / 100 });
    }
  }
  return out;
}

// QR like Unite's QRCode component: error correction M, 3-module quiet zone, navy modules.
const matrix = (text) => { const q = qrcode(0, "M"); q.addData(String(text)); q.make(); return q; };
export function qrSvg(text) {
  const q = matrix(text), n = q.getModuleCount();
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 ${n + 6} ${n + 6}" shape-rendering="crispEdges"><rect x="-3" y="-3" width="${n + 6}" height="${n + 6}" fill="#ffffff"/><path fill="#0f172a" d="${d}"/></svg>`;
}
export const qrGif = (text) => Buffer.from(matrix(text).createDataURL(8, 24).split(",")[1], "base64"); // for email (no SVG in Gmail)

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Email with one Unite-style ticket per person.
export async function sendTicket(order, tickets, origin) {
  if (!process.env.RESEND_API_KEY || !order.email || !tickets.length) return false;
  const link = `${origin}/success?order=${order.id}`;
  const cards = tickets.map((t, i) => `
  <div style="margin:16px 0;border-radius:20px;overflow:hidden;background:#ffffff;border:1px solid #e2e8f0">
    <div style="background:#0f172a;color:#fff;padding:12px 18px;font-size:13px"><b>unite</b> <span style="color:#94a3b8;letter-spacing:.12em;text-transform:uppercase;font-size:11px">· Admit one</span><span style="float:right;background:#10b981;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600">Confirmed</span></div>
    <div style="padding:18px;text-align:center">
      <p style="margin:0;font-weight:700;color:#0f172a">${esc(EVENT.name)} · ${esc(t.label)}</p>
      <p style="margin:4px 0 14px;color:#64748b;font-size:13px">Ticket ${i + 1} of ${tickets.length}</p>
      <img src="${origin}/api/qr?c=${encodeURIComponent(t.code)}" width="200" height="200" alt="Ticket QR code" style="display:block;margin:0 auto">
      <p style="margin:12px 0 0;color:#94a3b8;font-size:11px;letter-spacing:.14em;text-transform:uppercase">Booking ID</p>
      <p style="margin:2px 0 0;font-family:ui-monospace,Menlo,monospace;font-size:18px;font-weight:700;letter-spacing:.06em;color:#0f172a">${esc(t.id)}</p>
    </div>
  </div>`).join("");
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:440px;margin:0 auto;padding:24px;color:#0f172a;background:#f2f2f7">
  <p style="margin:0;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#741629">You're in</p>
  <h1 style="margin:6px 0 4px;font-size:26px">${esc(EVENT.name)}</h1>
  <p style="margin:0;color:#475569">${esc(EVENT.when)}<br>${esc(EVENT.where)}</p>
  ${cards}
  <p style="color:#475569;font-size:14px">Each person shows their own QR code at the door. The exact location is sent before the event. <a href="${link}" style="color:#741629">Open your tickets</a></p>
  <p style="color:#94a3b8;font-size:12px">Order ${esc(order.id)} · ${order.amount} AED · Unite, Dubai · support@uniteuow.com · WhatsApp +971 54 149 3969</p>
</div>`;
  const text = `You're in: ${EVENT.name}\n${EVENT.when}\n${EVENT.where}\n\n${tickets.map((t) => `${t.label} · ${t.id}`).join("\n")}\n\nOpen your tickets (QR codes): ${link}\n\nOrder ${order.id} · ${order.amount} AED\nUnite · support@uniteuow.com`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.TICKET_FROM || "Unite Tickets <tickets@uniteuow.com>", to: [order.email], reply_to: "support@uniteuow.com", subject: `Your tickets: ${EVENT.name}`, html, text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) console.error("Ticket email failed:", r.status, await r.text().catch(() => ""));
  return r.ok;
}
