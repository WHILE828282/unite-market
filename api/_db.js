/* Orders and tickets in Neon Postgres (tables market_orders and market_tickets, so they can share a database
   with uniteuow.com). An order is "held" for HOLD_MINUTES while the buyer pays, then "paid", "expired",
   "cancelled" or "refunded". Held (not yet expired) and paid orders count against the pools.
   A paid order gets one ticket per person; the door page checks them in. */
import { neon } from "@neondatabase/serverless";
import { POOLS, HOLD_MINUTES } from "./_tickets.js";

const NAMES = ["DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL"];
const url = () => NAMES.map((n) => process.env[n]).find(Boolean);
export const dbConfigured = () => !!url();

let client, ready;
export const sql = () => (client ||= neon(url()));

export function ensureSchema() {
  return (ready ||= sql()`
    create table if not exists market_orders (
      id text primary key,
      status text not null,
      items jsonb not null,
      c_event int not null default 0,
      c_early int not null default 0,
      amount int not null,
      email text, name text, phone text,
      stripe_session text, payment_intent text,
      emailed_at timestamptz,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null,
      paid_at timestamptz
    )`
    .then(() => sql()`create index if not exists market_orders_status on market_orders (status, expires_at)`)
    .then(() => sql()`
      create table if not exists market_tickets (
        id text primary key,
        order_id text not null references market_orders(id) on delete cascade,
        code text not null unique,
        label text not null,
        price numeric not null default 0,
        name text, email text,
        status text not null default 'valid',
        checked_in_at timestamptz,
        created_at timestamptz not null default now()
      )`)
    .then(() => sql()`create index if not exists market_tickets_order on market_tickets (order_id)`)
    .catch((e) => { ready = null; throw e; }));
}

const LOCK = 770125; // one at a time while places are counted and taken

// Places still free per pool (paid + live holds are taken).
export async function poolsLeft() {
  const [r] = await sql()`
    select coalesce(sum(c_event), 0)::int as event, coalesce(sum(c_early), 0)::int as early
    from market_orders where status = 'paid' or (status = 'held' and expires_at > now())`;
  return { event: POOLS.event - r.event, early: POOLS.early - r.early };
}

// Takes the places for a new order if they are free. Returns { id, expires_at } or null when sold out.
export async function holdOrder(id, cart, uses, amount) {
  const res = await sql().transaction((q) => [
    q`select pg_advisory_xact_lock(${LOCK})`,
    q`insert into market_orders (id, status, items, c_event, c_early, amount, expires_at)
      select ${id}, 'held', ${JSON.stringify(cart)}::jsonb, ${uses.event}, ${uses.early}, ${amount},
             now() + make_interval(mins => ${HOLD_MINUTES})
      where (select coalesce(sum(c_event), 0) from market_orders where status = 'paid' or (status = 'held' and expires_at > now())) + ${uses.event} <= ${POOLS.event}
        and (select coalesce(sum(c_early), 0) from market_orders where status = 'paid' or (status = 'held' and expires_at > now())) + ${uses.early} <= ${POOLS.early}
      returning id, expires_at`,
  ]);
  return res[1][0] || null;
}

// Payment confirmed. A live hold always becomes paid; a lapsed one only if its places are still free.
// Returns the order when it is (now) paid, or null when there was no room (caller refunds).
export async function markPaid(id, { email, name, phone, paymentIntent }) {
  const res = await sql().transaction((q) => [
    q`select pg_advisory_xact_lock(${LOCK})`,
    q`update market_orders o set status = 'paid', paid_at = now(), email = ${email}, name = ${name}, phone = ${phone},
             payment_intent = ${paymentIntent}
      where o.id = ${id} and (
        (o.status = 'held' and o.expires_at > now())
        or (o.status in ('held', 'expired', 'cancelled')
            and (select coalesce(sum(c_event), 0) from market_orders x where x.id <> o.id and (x.status = 'paid' or (x.status = 'held' and x.expires_at > now()))) + o.c_event <= ${POOLS.event}
            and (select coalesce(sum(c_early), 0) from market_orders x where x.id <> o.id and (x.status = 'paid' or (x.status = 'held' and x.expires_at > now()))) + o.c_early <= ${POOLS.early}))
      returning *`,
  ]);
  return res[1][0] || null;
}

export const getOrder = async (id) => (await sql()`select * from market_orders where id = ${id}`)[0] || null;
export const setSession = (id, session) => sql()`update market_orders set stripe_session = ${session} where id = ${id}`;
export const setStatus = (id, status, from = ["held"]) => sql()`update market_orders set status = ${status} where id = ${id} and status = any(${from}) returning *`;
export const markEmailed = (id) => sql()`update market_orders set emailed_at = now() where id = ${id}`;

// Holds past their 15 minutes: mark expired and return their Stripe sessions so they can be closed.
export const sweepHolds = async () => (await sql()`
  update market_orders set status = 'expired' where status = 'held' and expires_at <= now() returning stripe_session`).map((r) => r.stripe_session).filter(Boolean);

export const paidOrders = () => sql()`select * from market_orders where status = 'paid' order by paid_at`;

/* ---- Tickets ---- */
// Saves an order's tickets; an id that clashes with an existing one is retried with a fresh id.
export async function addTickets(order, tickets, freshId, codeFor) {
  const saved = [];
  for (let t of tickets) {
    for (let tries = 0; tries < 5; tries++) {
      const r = await sql()`
        insert into market_tickets (id, order_id, code, label, price, name, email)
        values (${t.id}, ${order.id}, ${t.code}, ${t.label}, ${t.price}, ${order.name}, ${order.email})
        on conflict do nothing returning id`;
      if (r.length) { saved.push(t); break; }
      const id = freshId(); t = { ...t, id, code: codeFor(id) };
    }
  }
  return saved;
}
export const orderTickets = (orderId) => sql()`select * from market_tickets where order_id = ${orderId} order by created_at, id`;
export const getTicket = async (id) => (await sql()`select * from market_tickets where id = ${id}`)[0] || null;
export const allTickets = () => sql()`select * from market_tickets order by created_at, id`;
// Marks a ticket as used. Returns the ticket and whether this scan was the first one.
export async function checkIn(id) {
  const r = await sql()`update market_tickets set checked_in_at = now() where id = ${id} and status = 'valid' and checked_in_at is null returning *`;
  if (r.length) return { first: true, ticket: r[0] };
  return { first: false, ticket: await getTicket(id) };
}
