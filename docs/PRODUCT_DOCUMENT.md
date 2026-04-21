# Karijeeva — Product Document

> **Karijeeva** by **Kadle Global Pvt Ltd** — a premium D2C e-commerce experience for non-adulterated, cold-pressed and wood-pressed coconut oil.
> Stack: **FastAPI + React + MongoDB**. Design language: **Liquid Gold Noir**. Status: **MVP launch-ready (Phases 0 → 7 shipped, Phase 8 = handoff documentation).**

This document is the canonical product reference for the executive team, design partners, engineering, QA, ops and marketing. It is written to be readable on its own — no need to dig into the codebase to understand what the product is, what it does, who it is for, and how it is built.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Vision, mission and brand promise](#2-vision-mission-and-brand-promise)
3. [Target personas](#3-target-personas)
4. [Market positioning and value proposition](#4-market-positioning-and-value-proposition)
5. [Product scope (MVP)](#5-product-scope-mvp)
6. [Information architecture and sitemap](#6-information-architecture-and-sitemap)
7. [Core user journeys](#7-core-user-journeys)
8. [Functional requirements](#8-functional-requirements)
9. [Non-functional requirements](#9-non-functional-requirements)
10. [Technology architecture](#10-technology-architecture)
11. [Data model](#11-data-model)
12. [API surface](#12-api-surface)
13. [Third-party integrations](#13-third-party-integrations)
14. [Design system — Liquid Gold Noir](#14-design-system--liquid-gold-noir)
15. [Analytics, KPIs and success metrics](#15-analytics-kpis-and-success-metrics)
16. [Roadmap, deferred items and out of scope](#16-roadmap-deferred-items-and-out-of-scope)

---

## 1. Executive summary

Karijeeva is a single-SKU-family direct-to-consumer brand that sells one thing extraordinarily well: **honest coconut oil.** Two presses (cold-pressed and wood-pressed), three sizes (250 ml, 500 ml, 1 L) and one family pack (2 L) — built for the Indian home cook who notices the smoke point, the heritage nostalgic who grew up on chekku oil, and the gifting buyer who wants a beautiful bottle for Diwali.

The MVP is **complete and launch-ready.** It comprises:

- A cinematic storefront (`/`) built around a six-act GSAP scroll film, an editorial product catalogue, a magazine-style journal, and a recipes hub.
- Full e-commerce machinery: cart, coupons, three-step checkout, Razorpay payments (test-mode live, production toggle is a single env flip), order tracking, invoices, wishlist, reviews, cancellations and returns.
- A self-serve admin panel at `/admin` with role-based access control, orders ops, products and inventory, reviews moderation, coupons, customer CRM, settings (live on the storefront), and a complete audit trail.
- An authentic content scaffold: 3 products / 9 variants, 120 verified-buyer reviews, 6 recipes, 5 journal posts, 10 FAQs, 6 testimonials.
- Production-grade safety: HSTS, CSP, signed JWT sessions in httpOnly cookies, brute-force limiter, signed Razorpay webhooks, a tampered-signature audit trail, a global FastAPI exception envelope, a React `ErrorBoundary` with a client-error logger.

What is *deliberately not* in the MVP is enumerated in section 16. Everything in this document that is described in present tense exists in the codebase today and is covered by automated test coverage (latest report: `/app/test_reports/iteration_9.json`, all critical green).

---

## 2. Vision, mission and brand promise

**Vision.** Restore the place coconut oil holds in the Indian kitchen — pure, aromatic, ritual — and present it the way a perfumery presents its serums.

**Mission.** Build the shortest possible path between a coconut grove on the Karnataka coast and a customer's tempering pan. No middlemen, no adulteration, no synthetic clarification, no grey-market dilution.

**Brand promise — five non-negotiables.** These are visible to the customer on the home page and on every product detail page:

1. **Cold or wood-pressed only** — never solvent-extracted, never RBD-refined.
2. **Single-origin coconuts** — handpicked from named grove partners on the Konkan and Karnataka coast.
3. **Lab-tested every batch** — moisture, FFA, peroxide, smoke point.
4. **Glass bottle, no plastic in contact with oil** — recyclable, returnable.
5. **Direct from press to door** — no warehousing months, no third-party blending.

**Voice.** Confident, specific, sensory. Names the dish ("dosa drizzle," "champi", "tadka"). Avoids superlatives ("best," "world-class") in favour of evidence ("smoke point: 177°C," "FFA < 0.1%"). Uses Indian-English idioms naturally; never anglicises ingredient names.

---

## 3. Target personas

### Persona 1 — Reema, the conscious home cook

- 33, Bengaluru, marketing manager, cooks dinner 5 nights a week.
- Cares about: aroma, smoke point, ingredient list (one ingredient, please).
- Buys: 500 ml bottles, every 5–6 weeks.
- Decision triggers: a friend's recommendation, an Instagram recipe video, a clear "what makes this different" page.
- Pain points: store-bought oils that taste flat or smell rancid; opaque "natural"/"pure" claims with no certificates.
- What Karijeeva gives her: a transparent ingredient story, a recipe library that reuses the bottle she already owns, a wishlist, a frictionless re-order.

### Persona 2 — Krishnaprasad, the heritage nostalgic

- 56, Mysuru, recently retired, grew up on his grandmother's chekku oil.
- Cares about: wood-pressed authenticity, larger sizes, Sanskrit/Kannada provenance.
- Buys: 1 L wood-pressed, plus a family pack 2 L for festivals.
- Decision triggers: provenance language, family origin story, video of the grove.
- Pain points: city supermarkets only stock industrial oil; he distrusts most online "wood-pressed" claims.
- What Karijeeva gives him: the wood-pressed line with a clear name and process explanation, family-pack sizing, a long-form journal post on the press.

### Persona 3 — Aditi, the gifting buyer

- 29, Mumbai, gifting for her sister's housewarming and her parents' Diwali.
- Cares about: how the bottle looks on a counter, whether it will arrive on time, whether the recipient will know what to do with it.
- Buys: family pack 2 L + a 500 ml, once or twice a year.
- Decision triggers: the look of the bottle, ETA confidence, a card or note.
- Pain points: most gourmet pantry brands feel either too rustic or too generic.
- What Karijeeva gives her: a Liquid Gold Noir bottle that photographs beautifully, accurate delivery promise on PDP, recipe inserts in the journal she can share.

---

## 4. Market positioning and value proposition

**Where we play.** Premium edible oils, India D2C. Specifically the slice between two existing categories:

| Category | Examples | Price band | Why we don't slot here |
|---|---|---|---|
| Mass cooking oil | Parachute, Saffola, KLF | ₹200–₹450 / L | Industrial, refined, no story. |
| Boutique gourmet | Conscious Food, Pure & Sure, Two Brothers | ₹600–₹1,200 / L | Adjacent, but most are co-packed and treat coconut oil as one of many SKUs. |
| **Karijeeva** | — | **₹650–₹1,400 / L** | Single-category specialist. Owns press → bottle. Editorial brand. |

**How we win.**

1. **Single-category obsession.** We sell one product family, not a pantry catalogue. Every pixel and every paragraph is about coconut oil.
2. **Press transparency.** Cold-pressed vs wood-pressed is named, explained, photographed. Most competitors use the words but never differentiate them.
3. **Culinary, not just wellness.** Most premium coconut oil brands lean wellness/skin-care. We lead with the kitchen — dosa drizzle, tadka, chutney finish — and keep the wellness use-case as a secondary chapter.
4. **Liquid Gold Noir aesthetic.** A Le Labo / Aesop-grade visual identity in a category dominated by green-leaf-and-coconut clip art.
5. **Self-serve operations.** A fully built admin panel means the team can run promos, refunds, inventory and content without engineering tickets.

---

## 5. Product scope (MVP)

The MVP is what is **shipped, tested, and ready to deploy**. It maps to seven build phases (Phase 0 was Razorpay POC, Phase 7 was the creative rebrand). Phase 8 is this documentation pack; it does not change application code.

### In scope (shipped)

**Catalogue.**
- 2 products (Virgin Cold-Pressed, Wood-Pressed) and a Family Pack bundle.
- 9 variants across 250 ml / 500 ml / 1 L / 2 L.
- Per-variant pricing, MRP, stock, weight, dimensions.
- Soft-delete on products and variants (no destructive admin actions).

**Discovery.**
- Cinematic Home (`/`) with 6-beat GSAP film + editorial spreads.
- Products list (`/products`) with grid, filters and sort.
- PDP (`/products/{slug}`) with variant picker, gallery, tabbed sections, related recipes, JSON-LD product + breadcrumb structured data, dynamic SEO via `react-helmet-async`.
- Recipes (`/recipes`, `/recipes/{slug}`).
- Journal (`/journal`, `/journal/{slug}`).
- About, Contact, FAQ, Design System showcase.
- AEO Pillar Page (3,499 words with TOC scroll-spy) for long-tail organic search.
- `/api/sitemap.xml` and `/api/robots.txt`.

**Conversion.**
- Cart drawer (localStorage), live totals, free-shipping threshold (₹999).
- Coupons: `WELCOME10` (10% off, ₹499 minimum), 24-hour countdown banner after newsletter signup.
- Wishlist (auth-required, live count badge, "move to cart").
- Newsletter (drip-friendly subscriber list).
- Three-step checkout (Address → Review → Payment).
- India Post pincode auto-fill (city + state).
- Razorpay payments (live POC at `/razorpay-poc`, full checkout at `/checkout`).

**Post-purchase.**
- Order confirmation, tracking page (`/orders/{id}/track`) with a six-step gold timeline, AWB display, confetti on `delivered`.
- HTML invoice at `/api/orders/{id}/invoice.html` (print-styled A4).
- Cancellation/return request flow → `order_requests` queue.
- Verified-buyer-gated reviews with histogram, filters, sort.
- Account dashboard (`/account`, `/account/orders`).

**Admin (`/admin`).**
- Role-gated login (JWT claim + DB re-check).
- Dashboard: 8 KPIs, 30-day revenue chart, latest orders + reviews.
- Orders: filters, CSV export, status changes, shipping dialogs, real Razorpay refunds.
- Products & variants CRUD (with soft delete).
- Inventory: inline stock edit + reason note, full `inventory_logs` history.
- Customers list + detail + CSV export.
- Reviews: tabbed moderation, bulk approve/reject (recomputes product avg + count).
- Coupons CRUD + per-coupon usage stats.
- Newsletter subscribers list + CSV export.
- Order request queue (cancel/return triage).
- Contact messages inbox.
- Site settings live on the storefront.
- Audit log of every privileged mutation.

**Trust & safety.**
- HSTS, CSP (allows `checkout.razorpay.com`, Google Fonts, India Post via `https:`), X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy.
- JWT in httpOnly cookies, bcrypt password hashing, 5-failures/IP/min brute-force limiter (HTTP 429).
- Razorpay HMAC signature verification on `verify` and webhook; tampered signatures keep order at `pending_payment` and log to `payment_attempts`.
- Global exception envelope `{detail, error:{code,message,detail}}`.
- React `ErrorBoundary` with branded fallback + `POST /api/errors/client` capped logger.

### Out of MVP scope (see section 16 for reasoning)

Email automation (SendGrid/Resend), photo uploads on reviews, helpfulness votes, bulk coupon CSV, exit-intent modals, real carrier tracking webhook, before/after diffs in audit logs, Algolia-style search, multi-language UI.

---

## 6. Information architecture and sitemap

### Public routes

```
/                          Home (6-beat GSAP film + editorial)
/products                  Catalogue grid
/products/{slug}           Product detail
/recipes                   Recipes list
/recipes/{slug}            Recipe detail
/journal                   Blog list
/journal/{slug}            Blog post
/about                     About / brand story
/contact                   Contact form
/faq                       FAQ accordion
/cart                      Cart page (drawer mirror)
/checkout                  3-step checkout
/orders/{id}               Order confirmation + tracking gateway
/orders/{id}/track         Tracking timeline + confetti
/login   /register         Auth
/account                   Profile
/account/orders            Order history
/wishlist                  Wishlist (auth-required)
/design-system             Liquid Gold Noir reference
/cold-pressed-vs-wood-pressed   AEO pillar page
/razorpay-poc              Razorpay sandbox demo
```

### Admin routes (role-gated)

```
/admin                     Dashboard
/admin/orders              Orders list
/admin/orders/{id}         Order detail (status, shipping, refunds)
/admin/products            Catalogue
/admin/products/{id}       Product editor (variants)
/admin/inventory           Stock board
/admin/customers           CRM
/admin/reviews             Moderation
/admin/coupons             Coupons
/admin/newsletter          Subscribers
/admin/requests            Cancel/return queue
/admin/contact             Inbox
/admin/settings            Site settings
/admin/audit               Audit log
```

### Public API surface (`/api/*`)

See section 12 for the full enumeration.

---

## 7. Core user journeys

### J1 — Anonymous browse → first purchase (the headline funnel)

1. Lands on `/` from organic / Instagram. Six-beat GSAP film primes the brand promise.
2. Clicks **Shop** in the navbar → `/products`.
3. Picks Virgin Cold-Pressed 500 ml → `/products/virgin-cold-pressed-coconut-oil`.
4. Reads the Description / Benefits / How-to-use tabs. Skims 3–4 reviews.
5. Picks 500 ml variant, clicks **Add to cart**. Cart drawer opens with line total + free-shipping nudge.
6. Subscribes to newsletter on the cart drawer → 10% coupon banner appears with 24h countdown.
7. Clicks **Checkout** → `/checkout`.
8. Fills address, pincode auto-fills city/state. Reviews order, applies coupon, picks COD or Razorpay.
9. Razorpay modal opens, pays. Returns to `/orders/{id}` confirmation.
10. Receives an order ID, can immediately go to `/orders/{id}/track`.

### J2 — Returning customer reorders

1. Logs in at `/login`.
2. `/account/orders` → re-orders prior items in one tap.
3. Cart pre-fills, address pre-fills, payment in <60 seconds.

### J3 — Customer requests a return

1. From `/orders/{id}/track`, opens **Cancel / Return** dialog.
2. Picks reason from the dropdown, adds an optional note.
3. Backend writes to `order_requests` with status `pending`.
4. Admin sees the new row at `/admin/requests`, approves or rejects, attaches a comment.

### J4 — Admin runs the morning shift

1. Logs in at `/admin/login` (`admin@karijeeva.in` / `KarijeevaAdmin@2025`).
2. Reads dashboard: today's orders, revenue, top variant, low-stock alerts.
3. `/admin/orders` → filters to `paid` & `pending shipment` → opens each, attaches AWB and carrier, status moves to `shipped`.
4. `/admin/inventory` → adjusts low-stock variants, leaves a reason note.
5. `/admin/reviews` → moderates the new pending reviews, bulk-approves the four 5-star ones.
6. `/admin/coupons` → checks `WELCOME10` usage stats.
7. `/admin/audit` → confirms her morning's mutations are all logged.

### J5 — Admin issues a refund

1. `/admin/orders/{id}` for a `paid` order.
2. Clicks **Refund** → enters amount (≤ order total) and optional notes.
3. Backend calls Razorpay refund API → on success, writes to `refunds`, sets order status to `refunded`, audit log entry created.
4. Refund webhook (`refund.processed`) confirms async.

---

## 8. Functional requirements

This section is the formal "what must the product do" list, written so QA can convert each line into a test case.

### FR-A — Catalogue

- A1. The system must list all `is_active` products at `GET /api/products` with pagination metadata.
- A2. PDP must return product + variants + breadcrumb + JSON-LD payload at `GET /api/products/{slug}`.
- A3. `avg_rating` and `review_count` on the product must be **computed from approved reviews only.**
- A4. Soft-deleting a product (admin) must hide it from the storefront in <1s; soft-deleted products remain visible in `/admin/products` with a "deleted" badge.

### FR-B — Cart and coupons

- B1. Cart state must persist to `localStorage` (key `karijeeva_cart_v1`) and survive tab close.
- B2. `POST /api/coupons/validate` must return HTTP 200 with `{valid: false, message}` for below-minimum subtotal (not 4xx).
- B3. Unknown coupon codes must return HTTP 404 with `{valid: false, ...}` (consistent envelope; no PII leak).
- B4. Free-shipping threshold (₹999) must be applied server-side at order create.

### FR-C — Auth

- C1. Registration must hash the password with `bcrypt` (cost 12) and reject duplicate emails.
- C2. Login must rate-limit at 5 failures / IP / minute (HTTP 429).
- C3. JWT must be set as an httpOnly, Secure, SameSite=Lax cookie.
- C4. `GET /api/auth/me` must return the current user or 401.

### FR-D — Checkout and payments

- D1. Order totals must be **recomputed on the server** at `POST /api/orders/create`; the client total is informational only.
- D2. Razorpay order must be created with amount in paise, currency `INR`.
- D3. `POST /api/orders/verify` must verify HMAC signature; on failure, the order must remain `pending_payment` and a row must be appended to `payment_attempts`.
- D4. `POST /api/payments/webhook` must verify the X-Razorpay-Signature header against `RAZORPAY_WEBHOOK_SECRET`; events (`payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`) must be dedup'd via the `razorpay_webhook_events` collection.

### FR-E — Order lifecycle

- E1. Statuses: `pending_payment → paid → packed → shipped → out_for_delivery → delivered`. Plus terminal: `cancelled`, `refunded`.
- E2. `/orders/{id}/track` must show a 6-step timeline with the current step highlighted.
- E3. `confetti` must only fire when status is `delivered`.
- E4. Guests can track orders by email-signed access (`?email=`); mismatched email returns 404.

### FR-F — Wishlist

- F1. Wishlist requires auth.
- F2. Cap: 100 items per user.
- F3. "Move to cart" must add the variant to the cart and remove it from the wishlist atomically.

### FR-G — Reviews

- G1. Only **verified buyers** (the user has at least one `paid`/`delivered` order containing the variant) can post a review.
- G2. New reviews are `pending` by default; admin must approve before they appear publicly.
- G3. On approve / reject, the product's `avg_rating` and `review_count` must be **recomputed from the approved set**, not incremented.

### FR-H — Admin

- H1. All `/api/admin/*` routes must require a valid JWT **and** a DB re-check that `users.role == 'admin'`.
- H2. Every privileged mutation must append to `admin_audit_logs` with `{actor_id, action, target_type, target_id, metadata, created_at}`.
- H3. Refunds must reject `> order_total` and orders that are not yet `paid`.

### FR-I — Settings

- I1. `PATCH /api/admin/settings` must update `site_settings` and the storefront must reflect the change without a deploy.

---

## 9. Non-functional requirements

### Performance

- Lighthouse Performance ≥ 85 on `/` mobile (after Phase 6 lazy-loading pass).
- Razorpay `checkout.js` is loaded lazily — only on `/checkout` and `/razorpay-poc`.
- Pages `/admin/*`, `/checkout`, `/journal/*`, `/recipes/*` are `React.lazy`-split.
- All product hero images carry `alt` text and `loading="lazy"` below the fold.

### Accessibility

- Skip-to-content link on every page.
- Focus-visible ring on all interactive elements.
- All form fields have `<label>` + `aria-describedby` for help text.
- Cart drawer and dialogs trap focus and respect `Esc`.
- Color contrast: gold-on-obsidian and ink-on-parchment combinations all pass WCAG AA (verified in `/design-system`).
- `prefers-reduced-motion: reduce` disables the GSAP film and replaces it with a static stack.

### Security

- HSTS (`max-age=63072000; includeSubDomains; preload`), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (camera/mic/geo off; payment limited to `self` + Razorpay), Content-Security-Policy (allows Razorpay, Google Fonts, India Post via `https:`).
- All headers also live in `<meta>` tags in `/app/frontend/public/index.html` as a fallback for SPAs served by static hosts that ignore backend headers.
- All admin mutations go through the audit log.
- Brute-force limiter on `/api/auth/login`.
- Razorpay signatures verified on both client `verify` and server `webhook`.

### Reliability

- Global FastAPI exception handler emits `{detail, error:{code,message,detail}}` for every error path.
- React `ErrorBoundary` catches render-tree failures and ships them to `POST /api/errors/client` (capped at 1000 most recent).
- Idempotent seed (`python /app/backend/seed.py`) — re-running creates no duplicates.

### Observability

- `/admin/audit` — every privileged mutation.
- `/admin/orders/{id}` → `payment_attempts` panel — every tampered Razorpay signature.
- `client_errors` collection — every React render crash.
- Recommended post-launch wiring: Sentry on both client and server (one env var + one import).

### Internationalisation

- Currency: INR (₹), formatted with `Intl.NumberFormat('en-IN')`.
- Date: `Asia/Kolkata` timezone, `en-IN` formatting.
- Language: English only in the MVP; Hindi/Kannada copy is a Phase 9+ candidate.

---

## 10. Technology architecture

### High-level diagram (textual)

```
┌────────────────┐        ┌─────────────────────┐        ┌──────────────┐
│  Browser (SPA) │ HTTPS  │  CDN / Static host  │        │  MongoDB     │
│  React 18      │◀──────▶│  (Vercel / Nginx)   │        │  (Atlas)     │
│  GSAP, Tailwind│        │  serves /index.html │        └──────┬───────┘
└────────┬───────┘        │  + static bundles   │               │
         │                └──────────┬──────────┘               │
         │  /api/*                   │                          │
         ▼                           ▼                          │
┌─────────────────────────────────────────────┐                 │
│  FastAPI (uvicorn, Python 3.11)             │◀────────────────┘
│  Routers: /api/* + /api/admin/*             │
│  Motor (async MongoDB driver)               │
│  Razorpay SDK · bcrypt · python-jose        │
└──────────┬──────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│  Razorpay (Orders, Payments, Refunds)       │
│  India Post (pincode lookup)                │
└─────────────────────────────────────────────┘
```

### Frontend

- **React 18** with Create React App build.
- **Tailwind CSS** + a `tokens.css` layer for the Liquid Gold Noir palette.
- **GSAP + ScrollTrigger** + `@gsap/react` for the homepage cinematic film.
- **react-helmet-async** for dynamic SEO + JSON-LD injection.
- **shadcn/ui** primitives (Dialog, Drawer, Popover, Toast, Tabs, Accordion).
- **Sonner** for toasts.
- **lucide-react** for iconography.
- Code-split at the route level using `React.lazy` + `Suspense`.

### Backend

- **FastAPI** with `APIRouter` mounted at `/api`; admin routes mounted at `/api/admin`.
- **Motor** for async MongoDB.
- **bcrypt** (cost 12) for passwords; **python-jose** for JWT.
- **razorpay** Python SDK.
- **httpx** for the India Post pincode proxy (with a `pincode_cache` collection for hot lookups).
- Global exception handler for consistent error envelope.
- Static seed at `/app/backend/seed.py`.
- Admin module `/app/backend/admin_api.py` mounted lazily so the public surface stays minimal.

### Database

- **MongoDB** (single deployment in dev; Atlas in production).
- **No `_id` ever leaks to the frontend** — every read excludes `_id` from the projection or uses Pydantic response models.
- Collections enumerated in section 11.

### Configuration

- `MONGO_URL`, `DB_NAME`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `JWT_SECRET`, `SITE_PUBLIC_URL`, `CORS_ORIGINS` in `backend/.env`.
- `REACT_APP_BACKEND_URL`, `REACT_APP_RAZORPAY_KEY_ID` in `frontend/.env`.
- Supervisor manages both processes (`sudo supervisorctl restart backend|frontend`). Hot reload is on for code; restart only after env changes.

### Deploy targets

- Frontend: any static host (Vercel, Netlify, S3+CloudFront).
- Backend: any container host (Fly.io, Render, ECS, Railway).
- Database: MongoDB Atlas (M10+ recommended for production).

---

## 11. Data model

All collections in `DB_NAME` (default: `karijeeva`). The document shapes below are the contract; ObjectIds are never returned over the wire.

### Customer-facing

| Collection | Purpose | Notable fields |
|---|---|---|
| `users` | Customer + admin accounts. | `email` (unique), `password_hash`, `full_name`, `role` ('customer' \| 'admin'), `created_at` |
| `products` | Catalogue parents. | `slug` (unique), `name`, `description`, `benefits[]`, `how_to_use[]`, `images[]`, `is_active`, `avg_rating`, `review_count` |
| `product_variants` | Sellable SKUs. | `product_id`, `sku`, `size`, `price`, `mrp`, `stock`, `weight_g`, `is_active` |
| `orders` | Order header. | `id`, `user_id?`, `email`, `items[]`, `subtotal`, `discount`, `shipping`, `gst`, `total`, `coupon_code?`, `address`, `status`, `razorpay_order_id?`, `razorpay_payment_id?`, `awb?`, `carrier?`, `created_at` |
| `wishlists` | Per-user list. | `user_id`, `variant_id`, `created_at` |
| `reviews` | Product reviews. | `product_id`, `variant_id?`, `user_id`, `rating` (1-5), `title`, `body`, `is_verified_buyer`, `status` ('pending'\|'approved'\|'rejected'), `created_at` |
| `coupons` | Promo codes. | `code` (unique), `kind` ('percent'\|'flat'), `value`, `min_subtotal`, `max_discount?`, `valid_from`, `valid_to`, `usage_limit?`, `used_count` |
| `order_requests` | Cancel/return queue. | `order_id`, `kind`, `reason`, `note`, `status`, `created_at` |
| `newsletter_subscribers` | Email list. | `email` (unique), `source`, `created_at` |
| `contact_messages` | Inbox. | `name`, `email`, `subject`, `body`, `is_read`, `created_at` |

### Content

| Collection | Purpose |
|---|---|
| `recipes` | Recipe library (Markdown body, hero image, related products). |
| `blog_posts` | Journal posts (long-form editorial). |
| `faqs` | FAQ accordion entries. |
| `testimonials` | Pull-quote testimonials on the home page. |
| `site_settings` | Live storefront knobs (announcement bar, free-shipping threshold, etc.). |

### Operations

| Collection | Purpose |
|---|---|
| `inventory_logs` | Append-only stock change history. `{variant_id, delta, reason, actor_id, created_at}` |
| `admin_audit_logs` | Append-only admin mutations. |
| `auth_attempts` | Brute-force limiter buffer. |
| `client_errors` | Capped at 1000; React render crashes shipped from the browser. |

### Payments

| Collection | Purpose |
|---|---|
| `payment_orders` | Phase-0 POC orders (kept for backwards compatibility on `/razorpay-poc`). |
| `payment_attempts` | Tampered-signature audit. Every `verify` failure logs here. |
| `razorpay_webhook_events` | Dedup'd webhook events (`payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`). |
| `refunds` | Refund lifecycle (`requested → processed`). |

### Geo

| Collection | Purpose |
|---|---|
| `pincode_cache` | TTL-style cache of India Post pincode lookups (city + state). |

---

## 12. API surface

All routes are prefixed with `/api`. OpenAPI spec is live at `/api/docs`.

### Public storefront

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness probe |
| GET | `/api/products` | Catalogue list |
| GET | `/api/products/{slug}` | PDP payload |
| GET | `/api/recipes`, `/api/recipes/{slug}` | Recipes |
| GET | `/api/blog`, `/api/blog/{slug}` | Journal |
| GET | `/api/testimonials` | Home pull-quotes |
| GET | `/api/faqs` | FAQ |
| GET | `/api/site-settings` | Live storefront knobs |
| GET | `/api/sitemap.xml` | SEO |
| GET | `/api/robots.txt` | SEO |
| GET | `/api/geo/pincode/{pin}` | India Post proxy |

### Auth & account

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Sign up |
| POST | `/api/auth/login` | Sign in (rate-limited) |
| POST | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/me` | Current user |
| GET | `/api/orders/mine` | My orders |
| GET | `/api/orders/{order_id}` | Order detail |
| GET | `/api/orders/{order_id}/invoice.html` | Print invoice |
| POST | `/api/orders/{order_id}/cancel` | Customer cancel |
| POST | `/api/orders/{order_id}/request` | Cancel / return request |
| GET / POST / DELETE | `/api/wishlist*` | Wishlist CRUD |
| POST | `/api/wishlist/{variant_id}/move-to-cart` | Move-to-cart |
| GET / POST | `/api/reviews` | Reviews CRUD (post is verified-buyer-gated) |

### Commerce

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/coupons/validate` | Soft-validate at cart |
| POST | `/api/orders/create` | Create order + Razorpay order |
| POST | `/api/orders/verify` | Verify HMAC signature |
| POST | `/api/payments/create-order` | Phase-0 POC create |
| POST | `/api/payments/verify` | Phase-0 POC verify |
| GET | `/api/payments/order/{razorpay_order_id}` | POC fetch |
| POST | `/api/payments/webhook` | Razorpay webhook |

### Marketing & support

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/newsletter/subscribe` | Subscribe |
| POST | `/api/contact` | Contact form |
| POST | `/api/errors/client` | React error logger |

### Admin (`/api/admin/*`, all role-gated)

Dashboard: `dashboard/stats`, `dashboard/trend`, `dashboard/latest`.
Orders: list, `export.csv`, detail, `PATCH status`, `PATCH shipping`, `POST refund`.
Catalogue: products list, get, create, patch, delete; variants create / patch / delete.
Inventory: list, `PATCH /inventory/{variant_id}`, `inventory/logs`.
Customers: list, `export.csv`, detail.
Reviews: list, `PATCH /reviews/{review_id}`.
Coupons: list, create, patch, delete, `coupons/{code}/stats`.
Newsletter: list, `export.csv`.
Requests: list, patch.
Contact: list, patch.
Settings: get, patch.
Audit: list.

---

## 13. Third-party integrations

### Razorpay (payments + refunds + webhooks)

- SDK: `razorpay` (Python).
- Modes: **test** (`rzp_test_SffqJVx1aXnkTg`) live in dev; production toggle is a single env flip — see `LAUNCH_CHECKLIST.md` §2.
- Surfaces:
  - `POST /api/orders/create` → creates Razorpay order in paise.
  - `POST /api/orders/verify` → HMAC-SHA256 signature check via `razorpay.utility.verify_payment_signature`.
  - `POST /api/payments/webhook` → events `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`; dedup via `razorpay_webhook_events`.
  - `POST /api/admin/orders/{id}/refund` → real refund via `client.payment.refund()`.
- Keys live only in `backend/.env`. Frontend gets `key_id` only via the create-order response.

### India Post pincode API

- Public endpoint (`https://api.postalpincode.in/pincode/{pin}`), no key required.
- Proxied via `/api/geo/pincode/{pin}` and cached in `pincode_cache`.

### Google Fonts

- **Fraunces** (display, opsz/SOFT/WONK axes), **Inter Tight** (body), **Instrument Serif** (accent italic).
- Loaded with `font-display: swap`.
- Allowed in CSP under `font-src https://fonts.gstatic.com` and `style-src https://fonts.googleapis.com`.

### Deferred (post-launch)

- SendGrid / Resend (transactional + marketing email).
- Real carrier tracking webhook (Delhivery / Bluedart / Shiprocket).
- Cloudinary or S3 image CDN.
- Algolia search.
- Sentry observability.

---

## 14. Design system — Liquid Gold Noir

The full reference page is live at `/design-system`. The single source of truth for tokens is `/app/frontend/src/styles/tokens.css`.

### Palette

| Token | Hex | Use |
|---|---|---|
| `--obsidian` | `#0B0806` | Primary dark background |
| `--obsidian-soft` | `#141009` | Cards, modals on dark spreads |
| `--parchment` | `#F4ECDB` | Primary light background |
| `--parchment-soft` | `#EBE1CC` | Cards on light spreads |
| `--gold` | `#E8A84A` | The single accent (CTAs, hairlines, focus rings) |
| `--gold-deep` | `#B3802F` | Hover state, darker emphasis |
| `--bone` | `#ECE6D6` | Type on dark surfaces |
| `--husk` | `#3A2418` | Deep muted brown (long-form body) |
| `--ink` | `#14100B` | Type on light surfaces |

**Retired in Phase 7 (no longer in use anywhere in `/frontend/src`):** `brand-green*`, `brand-ivory`, `brand-mint`, `brand-brown`.

### Typography

- **Fraunces** — display headlines. Variable axes: opsz 144, SOFT 100, WONK 0. Used for the H1 letter-bloom on the GSAP film and for editorial spread headings.
- **Inter Tight** — body. Tight tracking, weight 400/500/600.
- **Instrument Serif** — italic accents (sub-headlines under display H1s, pull quotes).

### Type scale (Tailwind classes)

- H1: `text-4xl sm:text-5xl lg:text-6xl` (Fraunces).
- H2: `text-base md:text-lg` (Inter Tight, weight 600).
- Body: `text-sm md:text-base` (Inter Tight 400).
- Small/accent: `text-xs` (Inter Tight 500, all-caps tracking-widest).

### Components

- **shadcn/ui primitives**: Dialog, Drawer, Popover, Toast, Tabs, Accordion, Tooltip, Dropdown-Menu, Sheet.
- **Sonner** for toasts (gold accent on success, husk on error).
- **lucide-react** icons only — no emoji.
- **Buttons**: pill-shaped with gold on obsidian, parchment on obsidian outline, ghost gold-on-parchment. All buttons animate on hover with a subtle background-color and transform-Y transition (animated specific properties only — never `transition: all`).

### Motion

- Page transitions: 220ms opacity + 8px translateY, eased.
- Home film: GSAP ScrollTrigger pinned spreads with letter-bloom, dust-particle ambient overlay.
- `prefers-reduced-motion`: all film animation disabled, replaced with a static stack.

### Imagery direction

- Cinematic, low-key, high-contrast.
- Kitchen-led (dosa, tadka, chutney) ahead of wellness imagery.
- Glass bottles photographed against obsidian or parchment, never against white.
- All hero images carry meaningful `alt` text and are lazy-loaded below the fold.

### Layout principles

- Asymmetric editorial spreads — left-aligned 2/3 columns with generous negative space (2–3× what feels comfortable).
- Alternating obsidian and parchment spreads on the home page rhythm (film → bestsellers → vision → five non-negotiables → reviews → journal → newsletter).
- Hairline gold dividers (`1px solid var(--gold) / 30%`) instead of solid section breaks.

---

## 15. Analytics, KPIs and success metrics

### What we instrument today

- **Admin dashboard KPIs (live):** orders today, revenue today, AOV (30-day), pending payments, pending shipments, low-stock alerts, new reviews to moderate, new contact messages.
- **30-day revenue trend** (admin): bar + line chart at `/admin`.
- **Per-coupon stats** (admin): orders using the coupon, GMV, avg discount.
- **Audit log** (admin): every privileged mutation.
- **Client error log:** capped at 1000 most recent React render crashes.
- **Payment attempts log:** every tampered signature.

### What we should instrument post-launch

- Server access logs → CloudWatch / Logflare.
- GA4 (or Plausible, recommended for privacy-first) on the storefront.
- Sentry on both client and server.
- A/B testing framework (PostHog) for headline / CTA experiments.

### Success metrics for the first 90 days

| Pillar | Metric | Target |
|---|---|---|
| Acquisition | Unique visitors / month | 15,000 |
| Acquisition | Newsletter conversion (visit → subscribe) | 3% |
| Conversion | Visit → first purchase | 1.5% |
| Conversion | Cart abandonment | < 65% |
| Retention | Repeat purchase rate (60-day) | 25% |
| Trust | Verified-buyer review submission rate | 12% of paid orders |
| Ops | Average ship-out time (paid → shipped) | < 36 hours |
| Ops | Refund rate | < 2% of paid orders |
| Brand | Average order value | ₹950 |

### What "great" looks like at 6 months

- 10,000 paid orders cumulative.
- 1,500+ approved reviews across the catalogue.
- 30% of orders coming from returning customers.
- Top of organic search for "wood-pressed coconut oil online India".
- A second product line opened (we recommend cold-pressed sesame).

---

## 16. Roadmap, deferred items and out of scope

### Phase 9 — Email automation (priority: P0 post-launch)

- SendGrid / Resend wired to the existing `newsletter_subscribers` and `orders` collections.
- Transactional templates: order confirmation, shipping update, delivered.
- Marketing: abandoned-cart drip (3-touch), 30-day re-order nudge.
- Admin daily digest (orders, revenue, low stock, new reviews, new contact messages).

### Phase 10 — Reviews 2.0 (P1)

- Photo uploads on reviews (Cloudinary or S3).
- Helpfulness votes (`useful`, `not useful`).
- Reply-from-brand on flagged reviews (not visible publicly until moderated).

### Phase 11 — Carrier integration (P1)

- Real Delhivery / Bluedart / Shiprocket webhook → auto-update tracking timeline.
- Branded tracking page that survives without the customer hitting the site (email-driven).

### Phase 12 — Growth surfaces (P2)

- Exit-intent WELCOME10 modal on `/products` (reuses the existing newsletter + coupon — pure frontend work).
- Bulk-generate coupon CSV (admin tool).
- Referral / affiliate scheme.
- A second product family (cold-pressed sesame; cold-pressed groundnut).

### Phase 13 — Operational depth (P2)

- Structured before/after diffs in `admin_audit_logs` (currently free-form metadata).
- Inventory low-stock email alerts.
- Multi-warehouse stock split.

### Explicitly out of scope (we will not build these)

- Native mobile apps. (The PWA is sufficient.)
- A marketplace where third-party sellers list their oil under the Karijeeva brand.
- A subscription service, until repeat-purchase rate proves it is worth the complexity.
- Crypto payments, BNPL, gift cards. (None of these match the persona.)

---

## Appendix A — Test credentials and seed inventory

- Admin: `admin@karijeeva.in` / `KarijeevaAdmin@2025` (mirrored in `/app/memory/test_credentials.md`).
- Razorpay test mode: key `rzp_test_SffqJVx1aXnkTg`, card `4111 1111 1111 1111`, UPI `success@razorpay`.
- Seed: 3 products / 9 variants, 120 verified-buyer approved reviews (40 per product, deterministic IDs → idempotent), 1 coupon (`WELCOME10`), 5 blog posts, 6 recipes, 10 FAQs, 6 testimonials, 1 admin.
- Re-run safely: `python /app/backend/seed.py`.

## Appendix B — Companion documents

- `/app/docs/USER_MANUAL.md` — practical handbook for customers and admins.
- `/app/docs/FEATURE_LIST.md` — exhaustive inventory of every shipped feature.
- `/app/LAUNCH_CHECKLIST.md` — deploy-time configuration outside the codebase.
- `/app/memory/PRD.md` — short-form product requirements (single page).

---

*Document version 1.0 — Phase 8 handoff, February 2026. Owner: Product. Reviewers: Engineering, Design, Operations, Marketing.*
