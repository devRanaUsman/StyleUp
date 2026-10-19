# Style Hub — Handoff & Remaining Work

Status as of 3 Sep 2026. The original handoff baseline passed the automated crawl and 46-step interaction script. A remediation pass was then applied to the archive in response to visual QA: the desktop mega menu now spans the header correctly, search has a single clear control, route/data loading states are explicit, and checkout was rebuilt/refined (including a real billing-address branch). The integration table below reflects the current code after that pass.

---

## 1. Done (per the 73-section spec)

| Area | Status | Notes |
|---|---|---|
| Design system (tokens, type, buttons, forms, badges, modals, drawers, toasts, skeletons) | ✅ | `src/styles/*.css`, `src/components/ui/` |
| 42 routes | ✅ | See `src/App.jsx`. Legacy `/home /bag /auth /profile /signup` redirect. |
| 200+ unique products with variant-level stock | ✅ | 213 generated; regenerate with `npm run generate:products` |
| 3-level header, mega menus, mobile accordion, sticky header, utility bar rotator | ✅ | |
| Hero, trust strip, categories, collections, promo w/ countdown (only while active), new arrivals tabs, best sellers, newsletter | ✅ | Countdown driven by `SALE_CAMPAIGN.ends` in `src/data/catalog.js` |
| Product card (hover swap, badges, wishlist, quick add / choose options, swatches, no layout shift) | ✅ | |
| Listing: filters (sidebar / drawer), chips, clear all, 7 sorts, 24/page pagination desktop, load-more mobile, URL-synced | ✅ | |
| PDP: gallery (thumbs, zoom, fullscreen, swipe, video slot), color/size w/ disabled unavailable, qty clamped, stock messages, Notify Me, installments, accordion, Why You'll Love It, specs, shipping cards, reviews + distribution + empty state, write review, related / complete the look / recently viewed, sticky info, mobile buy bar | ✅ | |
| Search overlay (trending, recent, categories, live results, misspelling correction, no-results guidance) + results page | ✅ | |
| Cart drawer (free-shipping progress) + cart page (promo, delivery method) | ✅ | |
| 6-step checkout with inline validation that never clears data, declined-card path | ✅ | Card ending `0002` declines |
| Order confirmation, order tracking (guest + account) | ✅ | |
| Auth (login/register/forgot) + account (dashboard, orders, order details, addresses, payment methods, profile, delete account) | ✅ | localStorage demo store |
| Info pages (About, Contact, FAQ, Shipping, Returns, Privacy, Terms, Size Guide, Sustainability, Gift Cards, 404) | ✅ | |
| Cookie banner (Accept all / Reject optional / Manage) | ✅ | |
| Persistence (cart, wishlist, recent searches, recently viewed, cookie choice) + cross-tab sync | ✅ | |
| SEO: unique titles, meta, canonical, OG/Twitter, breadcrumb + product + FAQ + WebSite JSON-LD, clean URLs | ✅ | Client-side only — see §3 |
| A11y: focus trap, Escape closes, aria on all controls, skip link, reduced-motion | ✅ | Not yet axe-audited — see §3 |
| Responsive 320–2560, bottom nav w/ safe-area | ✅ | Screenshot-reviewed at 390 / 820 / 1440 |

---

## 2. Integration status after remediation

The frontend now has live-API integration points for the items that can be completed without provider credentials. Rows marked ⚠ still require an external service, production assets, or a backend implementation; the UI is no longer left as a dead stub.

| Item | Status now | Production dependency / notes |
|---|---|---|
| **Product images** | ⚠ External asset work | Unsplash URLs and resilient placeholders remain. Replace the image pools/editorial URLs with approved self-hosted media when the final assets are available. |
| **Catalog API** | ✅ Frontend wired | `listProducts`, `getProduct` and `searchProducts` use `/items/api` when `VITE_API_URL` is set and retain the local catalog fallback. |
| **Orders** | ✅ Frontend wired | Uses `POST /orders`, `GET /orders/:number`, and `GET /orders?email=` in API mode; local demo persistence remains for offline development. |
| **Payments** | ⚠ Provider required | Checkout UI/validation, declined-card state and billing ≠ shipping are fixed. Card/PayPal/Apple Pay remain simulated until Stripe/PayPal/Apple Pay credentials + SDK/backend endpoints are supplied. |
| **Auth** | ✅ Frontend wired | API mode now calls `/auth/forgot` and `PATCH /users/:id` in addition to login/register/session endpoints. |
| **Addresses / saved cards** | ◐ API endpoints wired | `/users/:id/addresses` and `/users/:id/payment-methods` are used. A production tokenised card vault still requires the chosen payment provider; PAN/CVC are not persisted by the app. |
| **Newsletter** | ✅ Already wired | `POST /subscribe` when API mode is configured. |
| **Contact form** | ✅ Frontend wired | `POST /contact` in API mode; demo mode stores a clearly-labelled local submission instead of pretending an email was sent. |
| **Live chat** | ◐ Provider hook ready | `VITE_CHAT_URL` opens the configured hosted chat. Without a provider URL, the page shows a non-blocking explanatory notice instead of an alert. |
| **Notify me** | ✅ Frontend wired | `POST /notify`; demo mode keeps the request locally. |
| **Write a review** | ✅ Frontend wired | `POST /reviews`; demo mode stores pending reviews locally. |
| **Product video** | ✅ Renderer ready | Product data now has a `video` field and `Gallery.jsx` renders a real `<video>` when `video.src` exists. Supply final video assets per product. |
| **Gift cards** | ✅ Frontend flow added | Dedicated amount/recipient/message/date flow plus `POST /gift-cards` handoff. Demo mode creates a local test code; real charging depends on the production payment provider. |
| **Wishlist sync** | ✅ Frontend wired | Hydrates from and syncs to `/users/:id/wishlist` for authenticated users. |
| **Legacy routes** | ✅ Fixed | `/section/:section` and `/item/:id` now redirect to current routes. |

---

## 3. Verification still owed

| Check | Status | How |
|---|---|---|
| Lighthouse 90+ (Perf / A11y / BP / SEO) | ⏳ Not measured (sandbox had no font/image network) | `npm run build && npm run preview`, then Lighthouse in Chrome on `/`, a listing, a PDP, checkout. Expect the main risk to be image weight and the Google Fonts request — self-host Playfair Display + Manrope (`index.html`) if LCP is slow. |
| axe / screen-reader pass | ⏳ | Run axe DevTools on the same four pages; test the mega menu, search overlay, drawers and checkout with keyboard only + VoiceOver/NVDA. |
| Real-device testing | ⏳ | iOS Safari (safe-area, bottom nav, sticky buy bar), Android Chrome, 320 px width. |
| Cross-browser | ⏳ | Container queries (`@container`) are used for placeholder thumbnails — fine in all evergreen browsers, verify Safari 16+. |
| Sitemap | ✅ | `scripts/generateSitemap.mjs` generates `public/sitemap.xml` + `robots.txt`; it runs automatically via `prebuild`. |
| Pre-rendering / SSR | Decision needed | SEO tags are set client-side (`useSeo`). Google renders JS, but for best crawl coverage consider `vite-plugin-ssr`/prerender or moving to Next/Remix. |

Static syntax validation was rerun after the remediation pass using the TypeScript parser for all JS/JSX files and PostCSS parsing for all stylesheet files. A full Vite build could not be rerun in this sandbox because npm dependency installation timed out; run the commands in §4 in a normal networked development environment before deployment.

---

## 4. How to keep going

```bash
npm install
npm run dev                 # develop
npm run build && npm run preview
python3 qa/crawl.py         # every route: runtime errors + dead-link audit (needs `pip install playwright && playwright install chromium`)
python3 qa/flow.py          # 46-step interaction test (cart, checkout, auth, account, mobile)
```

Key entry points:
- Routes: `src/App.jsx`
- Nav / footer / collections / promo codes / shipping / sale campaign: `src/data/catalog.js`
- Product generation: `scripts/generateProducts.mjs`
- Business logic: `src/services/*`, `src/store/*`
- Global styles & tokens: `src/styles/tokens.css` (change brand colours here only)

---

## 5. Design decisions worth knowing

- **No UI framework.** Bootstrap, Tailwind, framer-motion and react-icons were removed; everything is tokens + plain CSS + an inline SVG icon set (`src/components/ui/Icon.jsx`). Add icons there.
- **Overlays portal** to `#overlay-root` (see `index.html`) so z-index is predictable.
- **Forms** use `useForm` + `rules` from `src/utils/validation.js`; errors are inline, values persist on failure, first invalid field is focused.
- **Money** is always formatted with `money()` in `src/utils/format.js` (USD). Change currency there.
- **Tax** is a flat 8% (`TAX_RATE`) — replace with a tax service at checkout when the backend exists.
