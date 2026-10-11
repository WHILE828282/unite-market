# unite.market: launch guide for the CTO

The site is static HTML (Tailwind via CDN) plus Vercel functions in `api/` for tickets and payments:

| Path | File |
|---|---|
| `/` | `index.html`: Project X page, ticket picker, checkout sheet |
| `/success` | `success.html`: after payment, shows the QR ticket |
| `/api/*` | stock, checkout, Stripe webhook, order, QR, guest list (`api/`) |
| `/terms` | `terms.html` |
| `/refunds` | `refunds.html` |
| `/privacy` | `privacy.html` |
| shared styles, theme | `site.css`, `theme.js` |
| headers, clean URLs | `vercel.json` |

The footer and Terms name the operator as "Unite, Dubai, United Arab Emirates". Keep the business name and statement descriptor in Stripe as "Unite" so they match the site. Once Unite has a trade licence, add the legal name and licence number to the footer and to section 1 of the Terms.

---

## 0. Blockers to clear before launch

These are not code. Each one can stop the event or freeze the money, so settle them first, with a Dubai events lawyer or licensed event-management company. This is not legal advice.

1. **Event permit.** In Dubai, a ticketed event sold online to the public needs a permit from the Department of Economy and Tourism (DET), with Dubai Police and Dubai Civil Defence sign-off for a 500-person crowd. Calling it "private" in the T&Cs does not change that: 500 tickets sold to students of several universities is a public, commercial event. Get the permit, or run it through a licensed promoter who holds one.
2. **The venue.** Commercial parties in residential villas are a known enforcement target in Dubai. JVC community rules and holiday-home/short-let permits usually forbid commercial events, and a villa built for a family is rarely approved for 500 people. Get the owner's written consent, and confirm the venue can be licensed for this capacity. Otherwise move to a licensed venue.
3. **Who receives the money.** Stripe requires the account holder to be the business actually selling. A co-founder's individual Stripe account selling for "Unite", paid out to a Liv. student account, is a mismatch Stripe and Emirates NBD can act on: payouts held for up to 120 days, the account closed, or the bank account frozen. Open the account under Unite's trade licence (a freezone e-commerce or event-management licence is enough) with a business bank account, and describe the event to Stripe accurately (21+, drinks included, alcohol served by the licensed partner Cover Page Agency). If the reviewer finds a mismatch between the application and the site, the account is closed.
4. **Under-21 buyers.** Many first- and second-year students are under 21. Every one who buys, gets refused at the door and then disputes the charge counts against your Stripe dispute rate (Stripe expects it under ~0.75%). The 21+ checkbox in the checkout sheet helps.

---

## 1. DNS for unite.market (Vercel)

Same host as uniteuow.com.

1. Vercel → **Add New → Project** → import `while828282/unite-market`. Framework preset: **Other**. No build command, output directory `.` (root). Vercel installs `package.json` and deploys `api/` as functions. Add the environment variables from section 2, then deploy.
2. Project → **Settings → Domains** → add `unite.market` and `www.unite.market`. Set `unite.market` as primary and `www` to redirect to it (308).
3. At the registrar where you bought `unite.market`, open DNS and set:

   | Type | Host / Name | Value | TTL |
   |---|---|---|---|
   | A | `@` | `76.76.21.21` | 3600 |
   | CNAME | `www` | `cname.vercel-dns.com.` | 3600 |

   If Vercel's Domains page shows different, project-specific values, use those. Delete any existing A/AAAA records on `@` and any parking/forwarding the registrar added, or the domain will flap between hosts.
4. Wait for Vercel to show **Valid Configuration**. It issues the HTTPS certificate itself. Check: `dig +short unite.market A` → `76.76.21.21`, and `curl -I https://unite.market` → `200`.
5. **Email, so support@uniteuow.com works and ticket mail isn't spam.** In Google Workspace, Zoho or another provider, add their MX records, then:

   | Type | Host | Value |
   |---|---|---|
   | TXT | `@` | `v=spf1 include:<your provider's SPF> ~all` |
   | TXT / CNAME | (provider's DKIM selector) | (provider's DKIM key) |
   | TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:support@uniteuow.com` |

   Ticket emails are sent from `tickets@uniteuow.com` through Resend, the domain uniteuow.com already uses. Stripe checks that the support address on the site receives mail.
6. Optional: a CAA record `0 issue "letsencrypt.org"` so only Vercel's CA can issue certificates for the domain.

---

## 2. Payments, stock and tickets (Stripe + Neon + Resend)

How it works:
1. `/api/stock` returns the ticket types from `api/_tickets.js` with how many are left. The page refreshes it every 30 seconds.
2. **Continue to payment** calls `/api/checkout`: it holds the tickets for **15 minutes** (they disappear from stock for everyone else), then opens Stripe Checkout (Apple Pay, Google Pay, cards).
3. Only the Stripe webhook marks an order **paid**. Opening the payment page and leaving never counts as a sale.
4. If the buyer doesn't pay within 15 minutes, the hold ends, the tickets go back on sale and the Stripe page is closed. Coming back with the Back button frees them at once.
5. A payment that arrives after the hold ended still gets its tickets if places are free; if they were sold meanwhile, it is refunded automatically.
6. Every person gets their own ticket (`UNT-2026-XXXXX`, QR `U1.<id>.<signature>`, the same format as uniteuow.com). Group of 4 = 4 tickets. They arrive by email (Resend) and on `/success`, drawn like the Unite app ticket.
7. **At the door** staff open `https://unite.market/door`, enter the door key and scan with the phone camera, like the Unite host scanner: green **Checked in** with the guest's name and ticket type, red **Already used** with the time they came in, or red **Invalid**. Each check-in is saved with its time; the guest list can be searched and checked in by hand. Several phones can scan at once.

Setup:
1. **Neon:** Vercel → project → **Storage → Create → Neon Postgres** (or connect the Unite database). This sets `DATABASE_URL`. The `orders` table is created on the first request.
2. **Stripe keys:** Stripe → Developers → API keys → copy the **Secret key** into `STRIPE_SECRET_KEY`. Start with the test key (`sk_test_…`), switch to live (`sk_live_…`) when testing is done.
3. **Stripe webhook:** Stripe → Developers → Webhooks → **Add endpoint** → `https://unite.market/api/stripe-webhook`, events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`. Test and live mode each have their own webhook and secret.
4. **Ticket email:** `RESEND_API_KEY` (the same key as uniteuow.com). Optional `TICKET_FROM`, default `Unite Tickets <tickets@uniteuow.com>`.
5. **Ticket signing:** set `TICKET_SECRET` to a long random string (`openssl rand -hex 32`). It signs every QR code; don't change it after sales start or old QR codes stop scanning. Ticket sales stay closed until it is set.
6. **Door:** set `DOOR_KEY` to a password for the door staff (they type it on `/door`).
7. **Guest list:** set `ADMIN_KEY` to a long random string. `https://unite.market/api/orders?key=…` downloads every ticket as CSV (name, email, phone, type, price, check-in time, order).
8. Optional: `SITE_URL=https://unite.market`.
9. Redeploy after adding the variables.

Changing tickets: edit `api/_tickets.js`: prices, the pools (`event: 1000` places at the door, `early: 100` Early Bird tickets) and the ticket types. Changes apply to new orders only.

Test before the drop: in test mode buy tickets with card `4242 4242 4242 4242`; check stock goes down, the email arrives and the order is in the CSV. Then open checkout and close the tab: after 15 minutes the tickets are back in stock.

**Production note:** the Tailwind Play CDN is fine for a launch page but adds ~100 KB of JS and a flash of unstyled content on slow phones. After launch, swap it for a compiled stylesheet (`npx tailwindcss -o styles.css --minify`) and remove `cdn.tailwindcss.com` from the CSP.

---

## 3. Locking the 50% UOWD discount on uniteuow.com

uniteuow.com already verifies emails with a one-time code (`api/otp.js`) and signs the session on the server. Build the discount on top of that. Never trust an email the browser simply sends.

Rules:
- **Prove ownership, not just format.** The discount is unlocked only by a server session created after the student entered the 6-digit code sent to the address.
- **Exact, anchored domain match** on the normalised address: lower-case, trimmed, exactly one `@`, domain equal to `uowdubai.ac.ae`. This rejects `x@uowdubai.ac.ae.evil.com`, `x@evil-uowdubai.ac.ae`, `x@sub.uowdubai.ac.ae` and look-alike Unicode.
- **Price on the server.** The browser never sends the price or the discount.
- **One discounted ticket per verified email per event**, so one student can't buy 20 half-price tickets for friends.
- **Name on the ticket = the student's name**, checked against the ID at the door.

> `api/otp.js` and `src/lib/auth.js` currently accept `@uowdubai.ac.ae`, `@uowmail.edu.au`, `@uow.edu.au` and `@uniteuow.com` for sign-in. If the discount is strictly `@uowdubai.ac.ae`, use the separate check below for the discount and leave sign-in as it is.

```js
// api/discount.js (pseudo-code, Vercel function on uniteuow.com)
const UOWD = "uowdubai.ac.ae";

function isUowdEmail(raw) {
  const email = String(raw || "").trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+$/.test(email)) return false;    // ASCII only, no look-alikes
  const parts = email.split("@");
  return parts.length === 2 && parts[1] === UOWD;                   // exact domain, no subdomains
}

export default async function handler(req, res) {
  const email = sessionEmail(req.body.s);            // from the signed session created by api/otp.js verify
  if (!email) return res.status(401).json({ error: "Sign in with your university email." });
  if (!isUowdEmail(email)) return res.status(403).json({ error: "The 50% student price is for @uowdubai.ac.ae emails." });

  const event = await getEvent(req.body.ref);        // price comes from the database, never from the client
  if (await store.hasDiscountTicket(event.ref, email))
    return res.status(409).json({ error: "You've already used your student discount for this event." });

  // Reserve a single-use 50% Stripe promotion code (one row per code), atomically:
  //   UPDATE promo_codes SET email = $email, reserved_at = now()
  //   WHERE event_ref = $ref AND email IS NULL
  //   RETURNING code  LIMIT 1
  const code = await store.claimPromoCode(event.ref, email);
  if (!code) return res.status(410).json({ error: "Student-price tickets are sold out." });

  return res.json({ ok: true, checkoutUrl: await createCheckout(event, { promotionCode: code, email }) });
}
```

Flow:
1. Student signs in on uniteuow.com with their @uowdubai.ac.ae email → OTP → signed session (exists today).
2. They tap **Buy** → front end calls `POST /api/discount { s: session, ref }`.
3. Server checks the session, the exact domain and the one-per-student limit, then hands out one **single-use** 50% promotion code from a pool you created in Stripe (Products → Coupons → 50% off → promotion codes, 1 redemption each).
4. Server creates the Stripe Checkout session with `discounts[0][promotion_code]` and `customer_email` set, and the front end opens it.
5. Codes left unpaid after 30 minutes are released back to the pool by a sweep (the same pattern as the existing trip sweeps in `api/_lib.js`).
6. If a code leaks, it still works only once, and every code maps to one verified student.

Stripe can also create the promotion code on the fly in step 3 (`POST /v1/promotion_codes` with `max_redemptions=1`) instead of a pre-made pool. The checks before it stay the same.
