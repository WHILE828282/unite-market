// Small shared helpers for the API functions.
export const origin = (req) => process.env.SITE_URL || `https://${req.headers["x-forwarded-host"] || req.headers.host}`;
export function body(req) {
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}
export const methodOk = (req, res, allowed) => {
  if (allowed.includes(req.method)) return true;
  res.setHeader("Allow", allowed.join(", "));
  res.status(405).json({ ok: false });
  return false;
};
