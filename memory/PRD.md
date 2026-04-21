# Karijeeva — Product Requirements (MVP, Feb 2026)

A premium D2C e-commerce storefront + full admin ops panel for **Karijeeva**, the cold-pressed coconut oil brand by **Kadle Global Pvt Ltd**. Stack: **FastAPI + React + MongoDB**.

## Core value
Non-adulterated, cold/wood-pressed coconut oil, sold direct-to-consumer with a culinary-first narrative (dosa drizzle, champi ritual, tempering) — Aesop / Diptyque / Le Labo aesthetic, Organic Luxe tokens.

## Personas
- **The conscious home cook** — buys 500 ml – 1 L, cooks every day, cares about aroma and smoke point.
- **The heritage nostalgic** — grew up on chekku oil, wants the premium wood-pressed variant, orders for festivals.
- **The gifting buyer** — wants the branded bottle as a house-warming/Diwali gift.

## Core requirements (delivered)
### Storefront
- Home, Products list, PDP with variants, Recipes, Blog, About, Contact, AEO Pillar Page (3,499 words w/ TOC scroll-spy), Razorpay POC page.
- Dynamic SEO via `react-helmet-async`; JSON-LD Breadcrumb + Product; `/api/sitemap.xml` + `/api/robots.txt`.
- Cart drawer (localStorage) with coupon banner (WELCOME10, 24h countdown).
- JWT auth with bcrypt + httpOnly cookies; `/login`, `/register`, `/account`, `/account/orders`.
- Checkout 3-step (Address → Review → Payment) with India Post pincode auto-fill, Razorpay checkout.js (lazy-loaded).
- Wishlist (auth-required, live count badge, Move to cart), Reviews (verified-buyer gated, histogram + filters + sort).
- Order tracking `/orders/:id/track` with gold 6-step timeline + AWB details + confetti-on-delivered.
- Cancellation/return request dialog → `order_requests` queue.
- HTML invoice at `/api/orders/{id}/invoice.html` (print-styled A4).

### Admin `/admin`
- Role-gated (JWT claim + DB re-check). Seeded admin `admin@karijeeva.in` / `KarijeevaAdmin@2025`.
- Dashboard (8 KPIs + 30-day revenue recharts + latest orders/reviews).
- Orders (filters + CSV + status + shipping dialogs + refunds).
- Products/Variants CRUD (soft delete).
- Inventory (inline edit + reason + `inventory_logs` + audit page).
- Customers (list + detail + CSV).
- Reviews (tabs + bulk approve/reject — recomputes avg + count).
- Coupons CRUD + per-coupon stats.
- Newsletter, Requests queue, Contact messages, Settings (live on storefront), Audit log.

### Payments
- Razorpay test mode live. Create-order + verify-signature + webhook (`/api/payments/webhook`, HMAC via `RAZORPAY_WEBHOOK_SECRET`). `payment_attempts` audits tampered sigs. Real refund API via `POST /api/admin/orders/{id}/refund` → `refunds` collection.

## UI/UX rules (Phase 7 — Liquid Gold Noir)
- **Tokens (single source of truth in `/app/frontend/src/styles/tokens.css`):**
  - Obsidian `#0B0806` · Obsidian-soft `#141009` (primary dark surfaces)
  - Parchment `#F4ECDB` · Parchment-soft `#EBE1CC` (secondary light surfaces)
  - Gold `#E8A84A` · Gold-deep `#B3802F` (the single accent)
  - Bone `#ECE6D6` (type on dark) · Husk `#3A2418` (deep muted brown) · Ink `#14100B` (type on light)
- **Fonts:** **Fraunces** (display, variable axes opsz 144 / SOFT 100 / WONK 0), **Inter Tight** (body), **Instrument Serif** (accent italic).
- Retired in Phase 7: `brand-green*`, `brand-ivory`, `brand-mint`, `brand-brown`. Grep is clean across `/frontend/src`.
- **Home `/`** is a **6-beat GSAP ScrollTrigger cinematic film** (Premium → Handpicked → Transparency → Cold-Pressed → No Adulteration → Reveal), pinned for ~600vh on desktop, scroll-snap fallback on mobile, static stack under `prefers-reduced-motion`. Skip-intro link at top. Dust-particle ambient overlay + letter-bloom on display headlines.
- Editorial magazine rhythm after the film: obsidian/parchment alternating spreads (bestsellers → vision → 5 non-negotiables → reviews → blog → newsletter).
- `/design-system` showcases the full palette (9 swatches), 3 font samples, 4 button variants, the 5-non-negotiable pattern, and a live film-beat preview.

## Integrations
- **Razorpay** (test key_id `rzp_test_SffqJVx1aXnkTg`; webhook secret from `RAZORPAY_WEBHOOK_SECRET`).
- **India Post Pincode API** (public, no key) proxied via `/api/geo/pincode/{pin}`.
- **MongoDB** (local for dev via `MONGO_URL`).
- Deferred: SendGrid/Resend (abandoned-cart, admin reply), Razorpay webhook events in production, real carrier tracking feed, review photo uploads, helpfulness votes.

## Edge cases covered
- Below-min coupon → HTTP 200 `{valid:false, message}` (not 400).
- Unknown coupon → HTTP 404 with `{valid:false, ...}` body for consistency.
- Tampered signature → stays `pending_payment` (retryable) + `payment_attempts` audit.
- Guest order tracking via `?email=` signed access (404 on mismatch, no PII leak).
- Admin refund of non-captured order rejected; amount > order total rejected.
- Brute-force login limiter: 5 failed / IP / min → HTTP 429.

## Seed data
- 3 products (Virgin Cold-Pressed 250ml/500ml/1L, Wood-Pressed 500ml/1L, Family Pack 1L/2L).
- 120 seeded verified-buyer approved reviews (40 per product, avg ≈ 4.6, deterministic IDs → idempotent).
- 1 coupon (`WELCOME10`, 10% off, ₹499 min).
- 5 blog posts, 6 recipes, 10 FAQs, 6 testimonials, 1 admin.
- Re-run: `python /app/backend/seed.py`.

## Credentials (test)
- Admin: `admin@karijeeva.in` / `KarijeevaAdmin@2025` (see `/app/memory/test_credentials.md`).
- Razorpay: `rzp_test_SffqJVx1aXnkTg` · card `4111 1111 1111 1111` · UPI `success@razorpay`.

## Security
- HSTS, CSP (allows checkout.razorpay.com, Google Fonts, India Post via `https:`), X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy strict-origin, Permissions-Policy (camera/mic/geo off; payment limited to self + Razorpay).
- Global exception handler with consistent `{detail, error:{code,message,detail}}` envelope.
- Frontend `ErrorBoundary` with branded fallback + `POST /api/errors/client` logger (capped 1000).

## Deferred (post-MVP backlog)
- SendGrid integration: abandoned-cart email + daily admin activity digest + admin reply actual sending.
- Bulk-generate coupon CSV.
- Real carrier tracking webhook feed.
- Photo uploads on reviews + helpfulness votes.
- Structured before/after diff in `admin_audit_logs`.

## Success criteria (MVP)
- All Phase 0–6 acceptance criteria green.
- `/api/docs` healthy; all admin routes tagged `admin`.
- Seeded admin can complete: place order → track → refund → moderate review → adjust stock → edit settings → see audit.
- Lighthouse (preview): reviewed by testing agent after Phase 6.
