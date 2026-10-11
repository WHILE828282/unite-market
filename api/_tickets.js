/* Ticket catalog: the one place prices and limits live. The page reads it through /api/stock, and checkout
   charges these prices, so the browser can never change a price.
   Each ticket type uses up places from one or more pools: every ticket from "event" (people at the door),
   Early Bird tickets also from "early". Group of 4 takes 4 places. */
export const EVENT = { id: "project-x", name: "Project X", when: "Sunday, 25 October 2026 · 8:00 PM – 2:00 AM", where: "Private villa, Dubai" };

export const POOLS = { event: 1000, early: 100 };

export const GROUPS = [
  { name: "Early Bird", note: "First 100 tickets only", badge: "Limited", types: [
    { id: "early-male", name: "Male", price: 80, uses: { event: 1, early: 1 } },
    { id: "early-female", name: "Female", price: 40, uses: { event: 1, early: 1 } },
  ] },
  { name: "General Admission", note: "Standard entry", types: [
    { id: "ga-male", name: "Male", price: 100, uses: { event: 1 } },
    { id: "ga-female", name: "Female", price: 50, uses: { event: 1 } },
  ] },
  { name: "Group of 4", note: "Entry for 4 people, any mix", badge: "Best value", types: [
    { id: "group-4", name: "4 people", price: 300, uses: { event: 4 } },
  ] },
  { name: "VIP", note: "VIP area and fast-track entry", types: [
    { id: "vip-male", name: "Male", price: 200, uses: { event: 1 } },
    { id: "vip-female", name: "Female", price: 150, uses: { event: 1 } },
  ] },
];

export const MAX_PER_ORDER = 10;
export const HOLD_MINUTES = 15;

export const TYPES = Object.fromEntries(GROUPS.flatMap((g) => g.types.map((t) => [t.id, { ...t, group: g.name }])));

// { "ga-male": 2, ... } -> clean cart with totals, or { error }.
export function readCart(items) {
  const cart = {};
  let count = 0, amount = 0;
  const uses = Object.fromEntries(Object.keys(POOLS).map((p) => [p, 0]));
  for (const [id, raw] of Object.entries(items && typeof items === "object" ? items : {})) {
    const qty = Math.floor(Number(raw));
    if (!qty) continue;
    const t = TYPES[id];
    if (!t || !(qty > 0)) return { error: "Unknown ticket." };
    cart[id] = qty;
    count += qty;
    amount += qty * t.price;
    for (const [p, n] of Object.entries(t.uses)) uses[p] += qty * n;
  }
  if (!count) return { error: "Choose at least one ticket." };
  if (count > MAX_PER_ORDER) return { error: `Up to ${MAX_PER_ORDER} tickets per order.` };
  return { cart, count, amount, uses };
}

// Remaining places per pool -> how many of each type can still be bought.
export function typesLeft(poolLeft) {
  return Object.fromEntries(Object.values(TYPES).map((t) => [t.id,
    Math.max(0, Math.min(...Object.entries(t.uses).map(([p, n]) => Math.floor(poolLeft[p] / n))))]));
}

export const lineName = (id) => (TYPES[id].group === TYPES[id].name ? TYPES[id].group : `${TYPES[id].group} · ${TYPES[id].name}`);
