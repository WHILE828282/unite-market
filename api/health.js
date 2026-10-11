/* GET /api/health -> which settings this deployment can see (yes/no only, never the values), and whether the
   database answers. For setting up the site. */
import { dbConfigured, sql, ensureSchema } from "./_db.js";
import { stripeOn } from "./_stripe.js";
import { ticketsReady } from "./_ticket.js";

const has = (n) => !!String(process.env[n] || "").trim();

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const dbVars = Object.keys(process.env).filter((k) => /(DATABASE_URL|POSTGRES_URL)$/.test(k)).sort();
  let database = dbConfigured() ? "configured" : "missing";
  if (dbConfigured()) {
    try { await sql()`select 1`; await ensureSchema(); database = "connected"; } catch (e) { database = "error: " + String((e && e.message) || e).slice(0, 160); }
  }
  return res.status(200).json({
    deployment: process.env.VERCEL_ENV || "unknown",
    branch: process.env.VERCEL_GIT_COMMIT_REF || "",
    commit: String(process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7),
    database, databaseVariables: dbVars,
    stripeKey: stripeOn() ? (String(process.env.STRIPE_SECRET_KEY).startsWith("sk_live") ? "live" : "test") : "missing",
    stripeWebhookSecret: has("STRIPE_WEBHOOK_SECRET"),
    resend: has("RESEND_API_KEY"),
    ticketSecret: ticketsReady(),
    doorKey: has("DOOR_KEY"),
    adminKey: has("ADMIN_KEY"),
    salesOpen: dbConfigured() && database === "connected" && stripeOn() && ticketsReady(),
  });
}
