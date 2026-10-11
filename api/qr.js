/* GET /api/qr?c=CODE[&f=svg] -> QR image of a valid ticket code: GIF for emails, SVG for the ticket page. */
import { parseTicketCode, qrSvg, qrGif } from "./_ticket.js";

export default function handler(req, res) {
  const c = String((req.query && req.query.c) || "");
  if (!parseTicketCode(c)) return res.status(404).end();
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  if (req.query.f === "svg") { res.setHeader("Content-Type", "image/svg+xml"); return res.status(200).send(qrSvg(c)); }
  res.setHeader("Content-Type", "image/gif");
  return res.status(200).send(qrGif(c));
}
