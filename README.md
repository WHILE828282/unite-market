# unite.market

Ticketing site for Unite events outside UOWD (AUD, Middlesex, Heriot-Watt and more). First event: **Project X: Interuniversity Student Rave**, 25 Oct 2026.

Static HTML + Tailwind CDN in the uniteuow.com style (navy/crimson palette, Unite header, event page with ticket picker and checkout sheet, light/dark theme), hosted on Vercel. Checkout is Blend (Stripe).

- `index.html`: landing page
- `terms.html`, `refunds.html`, `privacy.html`: legal pages (`/terms`, `/refunds`, `/privacy`)
- `theme.js`, `site.css`: shared Tailwind config (Unite palette), theme toggle and base styles
- `icons/`: Unite Market logo (`market-icon.jpg`, 1024 px original) and favicons
- `vercel.json`: clean URLs and security headers (CSP allows Blend + Stripe only)
- `docs/CTO-GUIDE.md`: launch blockers, DNS, Blend embed, UOWD discount logic

Local preview: `npx serve .`
