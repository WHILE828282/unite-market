# unite.market

Ticketing site for Unite events outside UOWD (AUD, Middlesex, Heriot-Watt and more). Current event: **Halloween on Deck**, the Upper Deck DXB yacht party, 31 Oct 2026.

Static HTML + Tailwind CDN in the uniteuow.com style (navy/crimson palette, Unite header, event page with ticket picker and checkout sheet, light/dark theme), hosted on Vercel. Checkout is Stripe Checkout with our own stock and 15-minute holds (Vercel functions in `api/`, orders in Neon Postgres, ticket emails via Resend).

- `index.html`: landing page
- `terms.html`, `refunds.html`, `privacy.html`: legal pages (`/terms`, `/refunds`, `/privacy`)
- `theme.js`, `site.css`: shared Tailwind config (Unite palette), theme toggle and base styles
- `icons/`: Unite Market logo (`market-icon.jpg`, 1024 px original) and favicons
- `success.html`: page after payment with one Unite-style QR ticket per person
- `door.html`: door check-in (camera scanner, guest list), behind `DOOR_KEY`
- `vendor/jsQR.js`: QR reader for phones without a built-in one
- `api/`: stock, checkout (15-minute hold), Stripe webhook, order status, QR image, door check-in, guest list CSV; catalog and prices in `api/_tickets.js`
- `vercel.json`: clean URLs and security headers
- `docs/CTO-GUIDE.md`: launch blockers, DNS, Stripe/Neon/Resend setup, UOWD discount logic

Local preview: `npx vercel dev` (needs the env vars from docs/CTO-GUIDE.md section 2).
