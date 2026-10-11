/* Ticket codes (what the QR holds) and the ticket email (Resend, from uniteuow.com like the Unite app). */
import crypto from "node:crypto";
import { EVENT, TYPES, lineName } from "./_tickets.js";

const key = () => process.env.TICKET_SECRET || process.env.STRIPE_SECRET_KEY || "dev";
const sig = (id) => crypto.createHmac("sha256", key()).update(`ticket:${id}`).digest("base64url").slice(0, 12);
export const ticketCode = (orderId) => `PX.${orderId}.${sig(orderId)}`;
export const codeOk = (code) => { const m = /^PX\.([A-Za-z0-9]{16,40})\.([\w-]{12})$/.exec(String(code || "")); return !!m && m[2] === sig(m[1]) ? m[1] : null; };

export const newId = () => crypto.randomBytes(15).toString("base64url").replace(/[-_]/g, "x"); // 20 letters/digits

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const people = (items) => Object.entries(items).reduce((n, [id, q]) => n + q * (TYPES[id] ? TYPES[id].uses.event : 1), 0);

export async function sendTicket(order, origin) {
  if (!process.env.RESEND_API_KEY || !order.email) return false;
  const lines = Object.entries(order.items).map(([id, q]) => `${lineName(id)} × ${q}`);
  const admits = people(order.items);
  const qr = `${origin}/api/qr?c=${encodeURIComponent(order.ticket_code)}`;
  const link = `${origin}/success?order=${order.id}`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
  <p style="margin:0;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#741629">Your ticket</p>
  <h1 style="margin:6px 0 4px;font-size:26px">${esc(EVENT.name)}</h1>
  <p style="margin:0;color:#475569">${esc(EVENT.when)}<br>${esc(EVENT.where)}</p>
  <div style="margin:20px 0;padding:20px;border-radius:16px;background:#f8fafc;text-align:center">
    <img src="${qr}" width="220" height="220" alt="Ticket QR code" style="display:block;margin:0 auto;image-rendering:pixelated">
    <p style="margin:12px 0 0;font-weight:700">Admits ${admits}</p>
    <p style="margin:4px 0 0;color:#475569;font-size:14px">${lines.map(esc).join("<br>")}</p>
  </div>
  <p style="color:#475569;font-size:14px">Show this QR code at the door. The exact location is sent before the event. <a href="${link}" style="color:#741629">Open your ticket</a></p>
  <p style="color:#94a3b8;font-size:12px">Order ${esc(order.id)} · ${order.amount} AED · Unite, Dubai · support@uniteuow.com · WhatsApp +971 54 149 3969</p>
</div>`;
  const text = `Your ticket for ${EVENT.name}\n${EVENT.when}\n${EVENT.where}\n\n${lines.join("\n")}\nAdmits ${admits}\n\nOpen your ticket (QR code): ${link}\n\nOrder ${order.id} · ${order.amount} AED\nUnite · support@uniteuow.com`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.TICKET_FROM || "Unite Tickets <tickets@uniteuow.com>", to: [order.email], reply_to: "support@uniteuow.com", subject: `Your ticket: ${EVENT.name}`, html, text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) console.error("Ticket email failed:", r.status, await r.text().catch(() => ""));
  return r.ok;
}
