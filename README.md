# unite.market

Ticketing site for Unite events outside UOWD (AUD, Middlesex, Heriot-Watt and more). First event: **Project X: Interuniversity Student Rave**, 25 Oct 2026.

Static HTML + Tailwind CDN, hosted on Vercel. Checkout is Blend (Stripe).

- `index.html`: landing page
- `terms.html`, `refunds.html`, `privacy.html`: legal pages (`/terms`, `/refunds`, `/privacy`)
- `vercel.json`: clean URLs and security headers (CSP allows Blend + Stripe only)
- `docs/CTO-GUIDE.md`: launch blockers, DNS, Blend embed, UOWD discount logic

Local preview: `npx serve .`
