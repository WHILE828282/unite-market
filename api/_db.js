/* Orders in Neon Postgres. An order is "held" for HOLD_MINUTES while the buyer pays, then "paid", "expired",
   "cancelled" or "refunded". Held (not yet expired) and paid orders count against the pools. */
import { neon } from "@neondatabase/serverless";
import { POOLS, HOLD_MINUTES } from "./_tickets.js";

const NAMES = ["DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL"];
const url = () => NAMES.map((n) => process.env[n]).find(Boolean);
export const dbConfigured = () => !!url();

let client, ready;
export const sql = () => (client ||= neon(url()));

export function ensureSchema() {
  return (ready ||= sql()`
    create table if not exists orders (
      id text primary key,
      status text not null,
      items jsonb not null,
      c_event int not null default 0,
      c_early int not null default 0,
      amount int not null,
      email text, name text, phone text,
      stripe_session text, payment_intent text,
      ticket_code text, emailed_at timestamptz, checked_in_at timestamptz,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null,
      paid_at timestamptz
    )`.then(() => sql()`create index if not exists orders_status on orders (status, expires_at)`).catch((e) => { ready = null; throw e; }));
}

const LOCK = 770125; // one at a time while places are counted and taken

// Places still free per pool (paid + live holds are taken).
export async function poolsLeft() {
  const [r] = await sql()`
    select coalesce(sum(c_event), 0)::int as event, coalesce(sum(c_early), 0)::int as early
    from orders where status = 'paid' or (status = 'held' and expires_at > now())`;
  return { event: POOLS.event - r.event, early: POOLS.early - r.early };
}

// Takes the places for a new order if they are free. Returns { id, expires_at } or null when sold out.
export async function holdOrder(id, cart, uses, amount) {
  const res = await sql().transaction((q) => [
    q`select pg_advisory_xact_lock(${LOCK})`,
    q`insert into orders (id, status, items, c_event, c_early, amount, expires_at)
      select ${id}, 'held', ${JSON.stringify(cart)}::jsonb, ${uses.event}, ${uses.early}, ${amount},
             now() + make_interval(mins => ${HOLD_MINUTES})
      where (select coalesce(sum(c_event), 0) from orders where status = 'paid' or (status = 'held' and expires_at > now())) + ${uses.event} <= ${POOLS.event}
        and (select coalesce(sum(c_early), 0) from orders where status = 'paid' or (status = 'held' and expires_at > now())) + ${uses.early} <= ${POOLS.early}
      returning id, expires_at`,
  ]);
  return res[1][0] || null;
}

// Payment confirmed. A live hold always becomes paid; a lapsed one only if its places are still free.
// Returns the order when it is (now) paid, or null when there was no room (caller refunds).
export async function markPaid(id, { email, name, phone, paymentIntent, ticketCode }) {
  const res = await sql().transaction((q) => [
    q`select pg_advisory_xact_lock(${LOCK})`,
    q`update orders o set status = 'paid', paid_at = now(), email = ${email}, name = ${name}, phone = ${phone},
             payment_intent = ${paymentIntent}, ticket_code = ${ticketCode}
      where o.id = ${id} and (
        (o.status = 'held' and o.expires_at > now())
        or (o.status in ('held', 'expired', 'cancelled')
            and (select coalesce(sum(c_event), 0) from orders x where x.id <> o.id and (x.status = 'paid' or (x.status = 'held' and x.expires_at > now()))) + o.c_event <= ${POOLS.event}
            and (select coalesce(sum(c_early), 0) from orders x where x.id <> o.id and (x.status = 'paid' or (x.status = 'held' and x.expires_at > now()))) + o.c_early <= ${POOLS.early}))
      returning *`,
  ]);
  return res[1][0] || null;
}

export const getOrder = async (id) => (await sql()`select * from orders where id = ${id}`)[0] || null;
export const setSession = (id, session) => sql()`update orders set stripe_session = ${session} where id = ${id}`;
export const setStatus = (id, status, from = ["held"]) => sql()`update orders set status = ${status} where id = ${id} and status = any(${from}) returning *`;
export const markEmailed = (id) => sql()`update orders set emailed_at = now() where id = ${id}`;

// Holds past their 15 minutes: mark expired and return their Stripe sessions so they can be closed.
export const sweepHolds = async () => (await sql()`
  update orders set status = 'expired' where status = 'held' and expires_at <= now() returning stripe_session`).map((r) => r.stripe_session).filter(Boolean);

export const paidOrders = () => sql()`select * from orders where status = 'paid' order by paid_at`;
