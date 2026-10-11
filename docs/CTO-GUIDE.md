# unite.market: launch guide for the CTO

The site is static HTML (Tailwind via CDN) in this repo:

| Path | File |
|---|---|
| `/` | `index.html`: Project X landing, countdown, pricing, Blend checkout slot |
| `/terms` | `terms.html` |
| `/refunds` | `refunds.html` |
| `/privacy` | `privacy.html` |
| shared styles, theme | `site.css`, `theme.js` |
| headers, clean URLs | `vercel.json` |

The footer and Terms name the operator as "Unite, Dubai, United Arab Emirates". Keep the business name and statement descriptor in Stripe/Blend as "Unite" so they match the site. Once Unite has a trade licence, add the legal name and licence number to the footer and to section 1 of the Terms.

---

## 0. Blockers to clear before launch

These are not code. Each one can stop the event or freeze the money, so settle them first, with a Dubai events lawyer or licensed event-management company. This is not legal advice.

1. **Event permit.** In Dubai, a ticketed event sold online to the public needs a permit from the Department of Economy and Tourism (DET), with Dubai Police and Dubai Civil Defence sign-off for a 500-person crowd. Calling it "private" in the T&Cs does not change that: 500 tickets sold to students of several universities is a public, commercial event. Get the permit, or run it through a licensed promoter who holds one.
2. **The venue.** Commercial parties in residential villas are a known enforcement target in Dubai. JVC community rules and holiday-home/short-let permits usually forbid commercial events, and a villa built for a family is rarely approved for 500 people. Get the owner's written consent, and confirm the venue can be licensed for this capacity. Otherwise move to a licensed venue.
3. **Who receives the money.** Stripe requires the account holder to be the business actually selling. A co-founder's individual Stripe account selling for "Unite", paid out to a Liv. student account, is a mismatch Stripe and Emirates NBD can act on: payouts held for up to 120 days, the account closed, or the bank account frozen. Open the account under Unite's trade licence (a freezone e-commerce or event-management licence is enough) with a business bank account, and describe the event to Blend/Stripe accurately (21+, BYOB, no alcohol sold). If the reviewer finds a mismatch between the application and the site, the account is closed.
4. **Under-21 buyers.** Many first- and second-year students are under 21. Every one who buys, gets refused at the door and then disputes the charge counts against your Stripe dispute rate (Stripe expects it under ~0.75%). The 21+ checkbox in the checkout slot helps. If Blend supports it, also collect date of birth at checkout and block under-21s there.

---

## 1. DNS for unite.market (Vercel)

Same host as uniteuow.com.

1. Vercel → **Add New → Project** → import `while828282/unite-market`. Framework preset: **Other**. No build command, output directory `.` (root). Deploy.
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

   If Blend sends tickets "from" @unite.market, add its sending domain records too. Stripe checks that the support address on the site receives mail.
6. Optional: a CAA record `0 issue "letsencrypt.org"` so only Vercel's CA can issue certificates for the domain.

---

## 2. Embedding the Blend checkout safely

The landing page already has the ticket picker, the checkout sheet and the loader (`index.html`, `#blend-checkout` in the sheet and the `<script>` at the end).

1. In the Blend dashboard, create the event "Project X" with the same ticket types and prices as the site (`GROUPS` in `index.html`): **Early Bird** Male 80 / Female 40 (first 100), **General Admission** Male 100 / Female 50, **Group of 4** 300 per group (any mix), **VIP** Male 200 / Female 150 AED. When Early Bird sells out, set `soldOut: true` on it in `GROUPS`. Copy the event's **embed / checkout URL**.
2. In `index.html`, paste it into:
   ```js
   var BLEND_URL = "https://…blendapp.ai/…";
   ```
   The page's ticket picker shows the order summary; the buyer confirms the tickets inside the Blend widget. If Blend can pre-select ticket types and quantities through URL parameters, add them in `blendUrl()` (the `cart` object holds the quantity of each ticket type, e.g. `early-male`).
3. What the loader already does:
   - It only accepts `https://` URLs on `blendapp.ai` or its subdomains. Anything else is ignored.
   - It loads the iframe only after the buyer has picked tickets and ticked "I confirm I am 21 or older and agree to the Terms and Refund Policy".
   - The iframe gets `allow="payment *"` (Apple Pay / Google Pay inside the frame), a `sandbox` with only what a checkout needs, and `referrerpolicy="strict-origin-when-cross-origin"`.
4. **Match the CSP to Blend's real domains.** `vercel.json` sends a Content-Security-Policy that allows frames, scripts and requests from `*.blendapp.ai` and Stripe only. Open Blend's embed code. If the widget is served from another domain (a CDN, `checkout.<something>`, a white-label subdomain like `tickets.unite.market`), add it to `frame-src`, and to `script-src`/`connect-src` if it uses a script. Otherwise the browser blocks it silently; check DevTools → Console for "Refused to frame".
5. **If Blend gives a `<script>` snippet instead of a URL:** load the snippet into `<div id="blend-checkout">` from the Continue to payment handler instead of the iframe, and add its script domain to `script-src`. Never paste a snippet that loads from a domain you don't recognise.
6. **Apple Pay:** Apple Pay inside an iframe only works if Blend/Stripe has verified the domain. Ask Blend to register `unite.market` for Apple Pay. With Stripe, that means hosting `/.well-known/apple-developer-merchantid-domain-association`; if Blend gives you that file, put it in this repo at that exact path.
7. **Test before the drop:** run one real 1 AED (or test-mode) purchase in Safari on an iPhone and in Chrome on Android, check the ticket email arrives, then refund it.
8. **Production note:** the Tailwind Play CDN is fine for a launch page but adds ~100 KB of JS and a flash of unstyled content on slow phones. After launch, swap it for a compiled stylesheet (`npx tailwindcss -o styles.css --minify`) and remove `cdn.tailwindcss.com` from the CSP.

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

  // Reserve a single-use 50% code pre-generated in Blend (one row per code), atomically:
  //   UPDATE promo_codes SET email = $email, reserved_at = now()
  //   WHERE event_ref = $ref AND email IS NULL
  //   RETURNING code  LIMIT 1
  const code = await store.claimPromoCode(event.ref, email);
  if (!code) return res.status(410).json({ error: "Student-price tickets are sold out." });

  return res.json({ ok: true, checkoutUrl: `${event.blendUrl}?promo=${code}&email=${encodeURIComponent(email)}` });
}
```

Flow:
1. Student signs in on uniteuow.com with their @uowdubai.ac.ae email → OTP → signed session (exists today).
2. They tap **Buy** → front end calls `POST /api/discount { s: session, ref }`.
3. Server checks the session, the exact domain and the one-per-student limit, then hands out one **single-use** 50% promo code from a pool you generated in Blend (Blend dashboard → Discounts, 1 use each, valid for Project X only).
4. Front end opens the Blend checkout with that code (and the email pre-filled, if Blend supports it).
5. Codes left unpaid after 30 minutes are released back to the pool by a sweep (the same pattern as the existing trip sweeps in `api/_lib.js`).
6. If a code leaks, it still works only once, and every code maps to one verified student.

If Blend offers an API to create single-use codes or "access-restricted" ticket types, use it in step 3 instead of a pre-made pool. The checks before it stay the same.
