/* GET /api/qr?c=CODE -> QR image (GIF) of a valid ticket code, for the ticket email and success page. */
import qrcode from "qrcode-generator";
import { codeOk } from "./_ticket.js";

export default function handler(req, res) {
  const c = String((req.query && req.query.c) || "");
  if (!codeOk(c)) return res.status(404).end();
  const q = qrcode(0, "M");
  q.addData(c);
  q.make();
  const gif = Buffer.from(q.createDataURL(8, 4).split(",")[1], "base64");
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.status(200).send(gif);
}
