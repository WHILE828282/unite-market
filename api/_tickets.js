/* Ticket catalog: the one place prices and limits live. The page reads it through /api/stock, and checkout
   charges these prices, so the browser can never change a price.
   Each ticket type uses up places from one or more pools: every ticket from "event" (people at the door),
   a VIP Table takes 5 places (and issues 5 tickets). */
export const EVENT = { id: "halloween-on-deck", name: "Halloween on Deck", when: "Saturday, 31 October 2026 · Boarding 7:00 PM, sails 8:00 PM", where: "Upper Deck DXB yacht, Dubai" };

export const POOLS = { event: 1000, early: 100 };

// Prices as on the organiser's page (Upper Deck DXB): released in phases, plus a 10% booking fee per order.
// Only the current phase is on sale. Move to the next one with TICKET_PHASE=2, 3, ... in Vercel (then redeploy).
export const PHASE = Math.max(1, Math.min(5, Math.floor(Number(process.env.TICKET_PHASE)) || 1));
export const FEE_RATE = 0.1;
export const fee = (amount) => Math.round(amount * FEE_RATE * 100) / 100;

export const GROUPS = [
  { name: "First Phase", phase: 1, types: [
    { id: "p1-female", name: "Female", price: 100, uses: { event: 1 } },
    { id: "p1-male", name: "Male", price: 100, uses: { event: 1 } },
  ] },
  { name: "Second Phase", phase: 2, types: [
    { id: "p2-female", name: "Female", price: 125, uses: { event: 1 } },
    { id: "p2-male", name: "Male", price: 125, uses: { event: 1 } },
  ] },
  { name: "Third Phase", phase: 3, types: [
    { id: "p3-female", name: "Female", price: 150, uses: { event: 1 } },
    { id: "p3-male", name: "Male", price: 150, uses: { event: 1 } },
  ] },
  { name: "Fourth Phase", phase: 4, types: [
    { id: "p4-female", name: "Female", price: 175, uses: { event: 1 } },
    { id: "p4-male", name: "Male", price: 175, uses: { event: 1 } },
  ] },
  { name: "Final Tickets", phase: 5, types: [
    { id: "final", name: "Final Tickets", price: 200, uses: { event: 1 } },
  ] },
  { name: "VIP Table", note: "VIP area, table for 5 guests, soft drinks", badge: "5 guests", types: [
    { id: "vip-table", name: "VIP Table", price: 700, uses: { event: 5 } },
  ] },
];

// "past" (sold out), "current" (on sale) or "upcoming"; groups without a phase are always on sale.
export const stage = (g) => (!g.phase || g.phase === PHASE ? "current" : g.phase < PHASE ? "past" : "upcoming");

export const MAX_PER_ORDER = 10;
export const HOLD_MINUTES = 15;

export const TYPES = Object.fromEntries(GROUPS.flatMap((g) => g.types.map((t) => [t.id, { ...t, group: g.name, stage: stage(g) }])));

// { "p1-male": 2, ... } -> clean cart with totals, or { error }.
export function readCart(items) {
  const cart = {};
  let count = 0, amount = 0;
  const uses = Object.fromEntries(Object.keys(POOLS).map((p) => [p, 0]));
  for (const [id, raw] of Object.entries(items && typeof items === "object" ? items : {})) {
    const qty = Math.floor(Number(raw));
    if (!qty) continue;
    const t = TYPES[id];
    if (!t || !(qty > 0)) return { error: "Unknown ticket." };
    if (t.stage !== "current") return { error: `${t.group} tickets aren't on sale right now.` };
    cart[id] = qty;
    count += qty;
    amount += qty * t.price;
    for (const [p, n] of Object.entries(t.uses)) uses[p] += qty * n;
  }
  if (!count) return { error: "Choose at least one ticket." };
  if (count > MAX_PER_ORDER) return { error: `Up to ${MAX_PER_ORDER} tickets per order.` };
  return { cart, count, amount, fee: fee(amount), total: Math.round((amount + fee(amount)) * 100) / 100, uses };
}

// Remaining places per pool -> how many of each type can still be bought.
export function typesLeft(poolLeft) {
  return Object.fromEntries(Object.values(TYPES).map((t) => [t.id, t.stage !== "current" ? 0
    : Math.max(0, Math.min(...Object.entries(t.uses).map(([p, n]) => Math.floor(poolLeft[p] / n))))]));
}

export const lineName = (id) => (TYPES[id].group === TYPES[id].name ? TYPES[id].group : `${TYPES[id].group} · ${TYPES[id].name}`);
