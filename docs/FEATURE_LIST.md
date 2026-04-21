# Karijeeva — Feature List

> **Karijeeva** is a premium D2C e-commerce platform for non-adulterated cold-pressed coconut oil by **Kadle Global Pvt Ltd** — built on a FastAPI + React + MongoDB stack, dressed in the **Liquid Gold Noir** design language, with a fully self-serve admin operations panel.

This document is a comprehensive inventory of every feature shipped in the MVP. It is the single source of truth a marketing or QA colleague can scan to know exactly what works and what does not.

---

## 1. Storefront features

### Navigation & discovery
- Glass-morphism transparent navbar over the dark Home film; converts to a sticky parchment bar with a gold hairline border on scroll.
- Fixed nav links: Home · Products · Recipes · Journal · About · Contact.
- Cart, wishlist (with live count badge for logged-in users) and account icons in the right cluster.
- Mobile slide-over menu with the same nav.
- Skip-to-content link at the top of every page (keyboard accessible).

### Home — the cinematic film
- Six-act pinned scroll-film built with **GSAP ScrollTrigger** on desktop, ~600vh of scroll length.
- Mobile fallback: full-viewport `scroll-snap-type: y mandatory` sections, no pin.
- `prefers-reduced-motion: reduce`: static stacked sections, no animation.
- Each beat: full-bleed cinematic image, Fraunces display headline with letter-bloom reveal, Instrument Serif italic sub-line, gold dust-particle ambient overlay.
- Beat-to-pillar mapping: Premium · Handpicked · Transparency · Cold-Pressed · No Adulteration · Reveal (CTA).
- Below the film: bestsellers grid, vision pull-quote, five non-negotiables, customer reviews, journal preview, newsletter.

### Product detail
- Photo gallery with thumbnail strip, hero image lazy loading, alt text on every image.
- Variant picker (250 ml / 500 ml / 1 L / 2 L family pack), live price update.
- Quantity stepper.
- Tabbed sections: Description · Benefits · How to use · Ingredients · Reviews.
- "Add to cart" + "Wishlist" CTAs; sticky bottom action bar appears below the fold.
- Related recipes block.
- Breadcrumb + JSON-LD breadcrumb structured data.
- Product JSON-LD with name, description, image, brand, offers, aggregateRating.

### Cart & coupons
- Slide-over cart drawer with line-item quantity stepper.
- Cart state persisted to `localStorage` — survives tab close.
- Coupon banner pre-fills `WELCOME10` with a 24-hour countdown after newsletter subscribe.
- Live discount + GST + shipping totals; free shipping over ₹999.
- Soft-validation messages for below-min coupons (HTTP 200 with `valid: false`).
- Distinct empty-cart state with a "Discover oils" CTA.

### Checkout
- Three-step flow at `/checkout`: Address → Review → Payment.
- India Post pincode auto-fill (city + state) via `/api/geo/pincode/{pin}` proxy.
- Guest or authenticated checkout from the same form.
- Razorpay checkout.js loaded **lazily** (only on `/checkout` and `/razorpay-poc`).
- Server-side total recomputation prevents tampering.
- Razorpay signature verified on `POST /api/orders/verify`; tampered signatures keep the order at `pending_payment` (retryable) and log to `payment_attempts`.

### Order tracking
- Branded confirmation page at `/orders/<id>/confirmed`.
- Live tracking page `/orders/<id>/track` with a six-step gold timeline (Ordered → Paid → Packed → Shipped → Out for delivery → Delivered).
- Confetti animation on `delivered` state.
- Carrier AWB + tracking URL surfaced in the timeline once admin enters them.
- Print-styled HTML invoice at `/api/orders/{id}/invoice.html` (Ctrl+P → PDF).
- "Request cancellation" / "Request return" dialog with reason dropdown.

### Account
- Register, login, logout via JWT (`httpOnly` cookie + `Authorization: Bearer` accepted).
- Bcrypt hashing, 7-day sessions.
- `/account` profile page; `/account/orders` order history.
- Brute-force limiter: 5 failed logins per minute per IP → HTTP 429.

### Reviews
- Verified-buyer gating — only customers who purchased the product can submit.
- PDP review block: average rating, total count, 5-bar histogram, filter chips (All / 5★ / 4★ / Verified / *Photos coming soon*), sort dropdown.
- Reviewer initials avatar, "First L." display name, gold "Verified buyer" badge, date.
- Submission form with validation (title 4–80, body 20–1500, rating 1–5).
- Moderation queue server-side; reviews appear after admin approval.
- 120 seeded approved reviews across 3 products (40 each, deterministic IDs, idempotent re-seed).

### Wishlist
- Auth-gated `/wishlist` page; guest click on PDP heart redirects to `/login`.
- Live count badge in the navbar heart icon.
- Server-of-truth (not localStorage); unique index on `(user_id, variant_id)`.
- Move-to-cart in one click.
- Empty-state with gold-bordered illustration and "Discover our oils" CTA.

### Content pages
- `/recipes` — 6 South Indian recipes with cards, time, serves, difficulty.
- `/recipes/<slug>` — full recipe with ingredients, steps, related products.
- `/blog` — 5 long-form journal posts (filterable by category).
- `/blog/<slug>` — markdown-rendered article with branded prose styles.
- `/about` — brand story with the hero image as a cinematic backdrop.
- `/contact` — form (POST `/api/contact`) + address/phone/hours block + map embed.

### AEO pillar page
- `/cold-pressed-coconut-oil-benefits` — 3,499-word reference article on cold-pressed coconut oil.
- Sticky table of contents with **IntersectionObserver scroll-spy** highlighting the active section.
- JSON-LD `FAQPage` block for the inline FAQ section.

### Newsletter
- Subscribe via footer, post-checkout, or exit-intent (planned).
- Issues `WELCOME10` with 24-hour validity.
- Persisted in `newsletter_subscribers` with source attribution.

### Legal & footer
- Footer with vision quote excerpt, four content columns, social links, address, gold hairlines.
- Razorpay POC page at `/razorpay-poc` (Phase 0 untouched, on-brand).
- Design system page at `/design-system` documenting tokens for marketing/dev hand-off.
- Branded 404 page (`NotFound.jsx`) on any unmatched route.

---

## 2. Admin features

### Auth & RBAC
- Shared `/login` for customers and admins; admins auto-redirect to `/admin`.
- Role claim in JWT, plus DB re-fetch on every privileged request — tampered tokens are rejected.
- `AdminRoute` guard on every `/admin/*` route (unauth → `/login?next=`, customer → `/account`).
- Brute-force limiter on `/api/auth/login`.

### Dashboard `/admin`
- Eight KPI cards: Revenue all-time, Revenue today, Total orders, AOV, Low stock, Reviews pending, Open requests, Subscribers.
- 30-day revenue area chart (recharts) from server-side aggregation.
- Latest orders + Reviews-awaiting-moderation lists.

### Orders `/admin/orders`
- Paginated list with filters (status, free-text, from/to date).
- Bulk **CSV export** (`/api/admin/orders/export.csv`).
- Detail page with full order, customer, address, totals, **payment_attempts audit**, **linked requests**.
- Status transition dropdown with confirm modal + optional internal note.
- Shipping dialog (AWB / carrier / URL / note) — auto-transitions to `shipped`.
- Print invoice button.
- **Refund button** (full or partial) that calls Razorpay's refund API live and records into the `refunds` collection.

### Products & variants `/admin/products`
- Search + category filter, inline variant matrix.
- Create dialog with name, slug (auto-generated, immutable after create), descriptions, category, tags, gallery, ingredients, flags (`is_featured`, `is_new_launch`, `is_active`).
- Edit dialog with the same fields (slug read-only).
- Soft delete (toggle `is_active`); restore by toggling back. No hard delete.
- Add/edit/delete individual variants (size, SKU, price, MRP, stock).

### Inventory `/admin/inventory`
- Flat table of all variants with stock, price, MRP, SKU.
- Color thresholds: ≤10 red, ≤25 amber, otherwise green.
- "Low stock only" filter.
- Inline adjust dialog with reason dropdown (Restock / Adjustment / Damaged / Audit) + note.
- Every change writes to `inventory_logs`.
- `/admin/inventory/logs` audit page filterable by reason and variant.

### Customers `/admin/customers`
- Paginated list with name, email, orders count, total spent, last order date, joined date.
- Search by email or name.
- Customer detail (`/admin/customers/<id>`) with profile, orders, reviews, wishlist snapshot.
- CSV export.

### Reviews moderation `/admin/reviews`
- Tabs: Pending · Approved · Rejected.
- Per-row Approve / Reject (with reason) / Delete.
- Bulk select + Approve all / Reject all.
- Recomputes `product.avg_rating` and `product.review_count` on every action.

### Coupons `/admin/coupons`
- CRUD with type (Percent/Flat), value, min order, max uses, expiry, active flag, customer description.
- Status chips (Active / Inactive / Expired / Used up).
- Per-coupon **stats dialog**: uses, total discount given, last-used timestamp.

### Newsletter / Requests / Contact / Settings / Audit
- `/admin/newsletter` — subscribers list, search, CSV export.
- `/admin/requests` — cancellation/return queue with status workflow (Open → In review → Resolved/Declined) + admin internal notes.
- `/admin/contact` — contact form inbox with tabs (New / Read / Resolved); mailto reply for now.
- `/admin/settings` — edits the `site_settings` singleton (hero, vision, contact); reflects live on the storefront.
- `/admin/audit` — read-only audit trail with filters (action substring, admin email, target type). Captures admin email, action, target, diff, IP, timestamp.

---

## 3. Platform & infra features

### Auth & sessions
- JWT with `role` claim, 7-day expiry, `httpOnly` `SameSite=Lax` cookie + `Authorization: Bearer` fallback.
- Bcrypt password hashing (cost 12).
- `auth_attempts` collection with 1-hour TTL index for the brute-force limiter.

### Security headers
- HSTS, CSP (Razorpay + Google Fonts + India Post + cdn.razorpay.com allow-listed), X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy applied to every API response.
- `<meta http-equiv="Content-Security-Policy">` and `<meta name="referrer">` on the SPA HTML.
- Edge config required for SPA HTML headers (HSTS / X-Frame / X-Content-Type / Permissions-Policy) — documented in `LAUNCH_CHECKLIST.md`.

### Rate limiting
- Login: 5 failed attempts per minute per IP → HTTP 429.
- Architecture is in place to extend to newsletter / contact / reviews / coupons.

### Error boundary & fallback pages
- Global React `ErrorBoundary` with branded "Something's brewing" page; auto-reports to `/api/errors/client` (capped at last 1000 entries).
- Branded 404 catch-all (`NotFound.jsx`) at `/*`.
- FastAPI global exception handler returns a unified `{ detail, error: { code, message, detail } }` envelope (backward compatible with `detail`).

### SEO
- Dynamic per-page `<title>`, `<meta description>`, OG, Twitter card via `react-helmet-async`.
- JSON-LD: Organization, WebSite, Breadcrumb, Product (with aggregateRating), FAQPage on the AEO pillar.
- `GET /api/sitemap.xml` and `GET /api/robots.txt` served by FastAPI.
- Branded OG image and theme-color meta.

### Accessibility
- Skip-to-content link, visible gold `:focus-visible` ring, semantic landmarks (`<main>`, `<nav>`, `<footer>`).
- Alt text on every image, labelled inputs.
- Reduced-motion fallback for the Home film.
- WCAG AA contrast on all body text on parchment and on obsidian.

### Performance choices
- Admin pages **code-split** with `React.lazy` + Suspense.
- Razorpay checkout.js loaded only when needed.
- Hero image preloaded; below-fold images `loading="lazy"` and `decoding="async"`.
- GSAP ScrollTrigger uses `scrub` for GPU-accelerated transforms.
- MongoDB indexes on hot paths: orders by `created_at`/`status`, reviews by `(product_id, is_approved)`, wishlists unique on `(user_id, variant_id)`, etc.

### Responsive
- Breakpoints: 375 / 640 / 768 / 1024 / 1440.
- Admin sidebar collapses to a horizontal scroll-tabs nav on mobile.

---

## 4. Design & experience — Liquid Gold Noir

### Palette tokens
| Token | Hex | Role |
|---|---|---|
| `--brand-obsidian` | `#0B0806` | Primary dark surface |
| `--brand-obsidian-soft` | `#141009` | Secondary dark surface |
| `--brand-parchment` | `#F4ECDB` | Primary light surface |
| `--brand-parchment-soft` | `#EBE1CC` | Secondary light surface |
| `--brand-gold` | `#E8A84A` | Single accent |
| `--brand-gold-deep` | `#B3802F` | Hover / emphasis variant |
| `--brand-bone` | `#ECE6D6` | Type on dark |
| `--brand-husk` | `#3A2418` | Deep muted brown for depth |
| `--brand-ink` | `#14100B` | Type on light |

### Typography
| Family | Use | Weights / axes |
|---|---|---|
| **Fraunces** | Display headlines (H1–H4) | Variable axes `opsz 144 / SOFT 100 / WONK 0` for the editorial cut |
| **Inter Tight** | Body, UI, table | 300–800 |
| **Instrument Serif** | Italic accents, pull-quotes | Italic |

### Token architecture
- Single source of truth: `/app/frontend/src/styles/tokens.css`.
- Tailwind `theme.extend.colors.brand` re-exposes the tokens (obsidian / parchment / gold / bone / husk / ink).
- Spacing scale, radii, shadows all variable-driven.

### Six-beat scroll film mapping
| Beat | Pillar | Headline |
|---|---|---|
| 1 | Premium | "Where wellness begins." |
| 2 | Handpicked | "Handpicked." |
| 3 | Transparency | "Broken open." |
| 4 | Cold-Pressed | "Pressed cold. Pressed patient." |
| 5 | No Adulteration | "Clean. Sealed. Unadulterated." |
| 6 | Reveal | "Pure. Liquid gold." → CTA |

### Micro-interactions
- Letter-bloom on display headlines (25 ms stagger).
- Gold dust-particle ambient drift over the film.
- Glass-morphism navbar with backdrop blur 18 px.
- Card hover lift + gold glow shadow.
- Page transitions via Framer Motion.
- Skip-intro link on first Tab keystroke.
- Confetti on `delivered` order state.

---

## 5. Integrations

| Integration | Purpose | State |
|---|---|---|
| **Razorpay** (Python SDK + checkout.js) | Order creation, signature verify, refund API, webhook ingestion | Live in **test mode**; flip keys per `LAUNCH_CHECKLIST.md` |
| **India Post pincode API** | City + state auto-fill on checkout | Live (proxied via `/api/geo/pincode/{pin}`) |
| **Google Fonts** | Fraunces, Inter Tight, Instrument Serif | Live |
| **MongoDB Motor** | Async DB driver | Live |

---

## 6. Data model — MongoDB collections

| Collection | Purpose |
|---|---|
| `users` | Customer + admin accounts (email, name, password_hash, role, addresses) |
| `products` | Catalog products with slug, descriptions, gallery, flags, avg_rating, review_count |
| `product_variants` | Variants per product (size, SKU, price, MRP, stock) |
| `orders` | Every order with items, totals, status, payment IDs, address snapshot, tracking, refund metadata |
| `payment_orders` | Razorpay POC order log (Phase 0) |
| `payment_attempts` | Audit log for failed / tampered Razorpay signature verifications |
| `refunds` | Razorpay refund records (success and failure) with full raw response |
| `razorpay_webhook_events` | Every inbound Razorpay webhook with HMAC validity flag |
| `coupons` | Promo codes (type, value, min_order, max_uses, used_count, expires_at) |
| `reviews` | Customer reviews with verified-buyer flag, approval flag, ratings |
| `wishlists` | User wishlist entries (unique on `user_id + variant_id`) |
| `order_requests` | Cancellation and return intent queue |
| `inventory_logs` | Every stock change with reason, note, admin who made the change |
| `admin_audit_logs` | Every privileged admin action with diff and IP |
| `auth_attempts` | Brute-force limiter store (TTL 1 hour) |
| `client_errors` | React `ErrorBoundary` reports (capped at 1000) |
| `newsletter_subscribers` | Email list with source attribution |
| `contact_messages` | Contact form submissions with status |
| `recipes` | Recipe content for `/recipes` |
| `blog_posts` | Journal articles |
| `testimonials` | Curated short customer quotes for the Home page |
| `faqs` | FAQ entries used on the AEO pillar and Contact page |
| `site_settings` | Singleton document for hero, vision, contact, press logos, trust stats |
| `pincode_cache` | Cached India Post lookups |
| `status_checks` | Initial template artifact (kept for backward compat, unused) |

---

## 7. Out of MVP scope (explicitly deferred)

- **Email integrations**: SendGrid / Resend / MSG91 — abandoned-cart nudge, order shipped/delivered transactional emails, admin reply, daily admin digest, password-reset flow.
- **Image hosting**: Cloudinary or S3 + signed URLs (currently Unsplash + external CDN URLs).
- **Search**: Algolia / Meilisearch — current `/products` filter is server-side only.
- **Analytics**: GA4 / Hotjar / PostHog — none wired in code.
- **Carrier tracking**: Real Shiprocket / Delhivery / Bluedart webhook feed (currently static AWB / URL).
- **Review enhancements**: Photo uploads (chip shows "coming soon"), helpfulness votes.
- **Coupons**: Bulk-generate from CSV, stackable codes, per-user single-use enforcement.
- **Marketing**: Exit-intent coupon modal, Instagram Story shareable film-still frame.
- **Auth**: Self-serve password reset, Google social login, account deletion UI.
- **Admin**: Structured before/after diffs in `admin_audit_logs` (currently `{fields: [...]}`).

---

## 8. Known constraints

- **Razorpay** is in **test mode** (`rzp_test_SffqJVx1aXnkTg`). Flip to live per `LAUNCH_CHECKLIST.md` § 2.
- **SPA-route security headers** must be configured at the edge / reverse proxy. The application sets them on `/api/*` and a partial set via `<meta>` on the SPA HTML; the rest (HSTS, X-Frame-Options, X-Content-Type, Permissions-Policy) need a Vercel / Nginx / CloudFront config — see `LAUNCH_CHECKLIST.md` § 1.
- **Lighthouse Performance** is measured against the CRA dev bundle on the preview environment; production builds will improve the score by 15–25 points.
- **Stock decrement** on order paid is intentionally manual (so admins keep direct control) — switch is one-line if you want auto.
- **Refunds** are real Razorpay API calls but in test mode they always succeed instantly. Live mode follows the bank's settlement window (5–7 business days).

---

_Last updated: 2026-02-20_
