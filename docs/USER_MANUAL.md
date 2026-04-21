# Karijeeva — User Manual

A practical handbook for the two people who use this site every day: the **customer** buying coconut oil, and the **admin** running the shop.

## Table of contents

- [Part A — Customer manual](#part-a--customer-manual)
  - [Getting started](#getting-started)
  - [Browsing the storefront](#browsing-the-storefront)
  - [Cart, coupons and totals](#cart-coupons-and-totals)
  - [Checkout in three steps](#checkout-in-three-steps)
  - [Order tracking and invoices](#order-tracking-and-invoices)
  - [Wishlist](#wishlist)
  - [Reviews](#reviews)
  - [Cancellations and returns](#cancellations-and-returns)
  - [Newsletter](#newsletter)
  - [Accessibility features](#accessibility-features)
  - [Support and contact](#support-and-contact)
  - [Customer troubleshooting FAQ](#customer-troubleshooting-faq)
- [Part B — Admin operations manual](#part-b--admin-operations-manual)
  - [Logging in](#logging-in)
  - [Dashboard](#dashboard)
  - [Orders](#orders)
  - [Shipping](#shipping)
  - [Refunds](#refunds)
  - [Products and variants](#products-and-variants)
  - [Inventory](#inventory)
  - [Reviews moderation](#reviews-moderation)
  - [Coupons](#coupons)
  - [Newsletter subscribers](#newsletter-subscribers)
  - [Cancellation and return requests](#cancellation-and-return-requests)
  - [Site settings](#site-settings)
  - [Audit log](#audit-log)
  - [Admin security hygiene](#admin-security-hygiene)
  - [Razorpay webhook configuration](#razorpay-webhook-configuration)

---

# Part A — Customer manual

## Getting started

Karijeeva supports both **guest checkout** and **registered accounts**. You do not need an account to place an order — just provide a contact email at step 1 of checkout.

- **Create an account** at `/register` if you want order history, a saved wishlist, the ability to write reviews, and faster reorders. Your password is hashed with bcrypt; we never see it.
- **Log in** at `/login`. Sessions last seven days via an `httpOnly` cookie. Logout from `/account`.
- Forgot your password? See [Customer troubleshooting FAQ](#customer-troubleshooting-faq).

> Reviews can only be submitted by registered customers who have purchased the product they are reviewing — see [Reviews](#reviews).

## Browsing the storefront

The site has six public spaces:

| Page | Route | What you'll find |
|---|---|---|
| Home | `/` | A six-act cinematic scroll-film, then the bestseller grid, the brand vision, the five non-negotiables, customer reviews and the journal. |
| Products | `/products` | All three oils with filters (category, price, size). |
| Product detail | `/products/<slug>` | Photo gallery, description, variant picker, ingredients, "How to use" steps, ratings, reviews, related recipes. |
| Recipes | `/recipes` | Six South Indian recipes that pair with our oils. |
| Journal (blog) | `/blog` | Long-form articles on chekku tradition, dosa technique, oil pulling, etc. |
| AEO pillar page | `/cold-pressed-coconut-oil-benefits` | A 3,500-word reference on cold-pressed coconut oil with a sticky table of contents that follows your scroll. |

A glass-morphism navbar floats over the dark Home film and turns parchment with a gold hairline once you scroll past it. Use the `Skip introduction` link at the very top to jump past the film straight to the product grid — useful for keyboard or returning visitors.

## Cart, coupons and totals

Click the bag icon (top right) to open the cart drawer at any time. Cart contents persist in your browser's `localStorage`, so closing the tab does not lose them.

**Discounts and shipping are computed client-side and re-validated server-side at checkout:**

| Component | Rule |
|---|---|
| Subtotal | Sum of `unit_price × quantity` for every line item |
| Coupon | Validated against `/api/coupons/validate`. The seeded `WELCOME10` gives **10 % off** on orders **≥ ₹499**. |
| GST | A flat **5 %** is added on the post-discount subtotal. |
| Shipping | **Free over ₹999**, otherwise a flat ₹49 is added. |
| Total | `subtotal − discount + GST + shipping` |

If you subscribe to the newsletter, a **24-hour `WELCOME10`** banner appears in the cart with a live countdown — type the code or click *Apply* and the cart updates instantly.

> If you try to apply `WELCOME10` on a sub-₹499 cart, the cart shows a friendly _"Minimum order ₹499 required (add ₹X more)"_ — it isn't an error, just a nudge.

## Checkout in three steps

Hitting **Checkout** opens `/checkout`, a clean three-step flow.

1. **Address.** Provide name, email (used for guest tracking), phone, line 1, optional line 2, city, state, pincode. Type any valid 6-digit Indian pincode and the **city + state auto-fill** within a second — that is the India Post API hooked up via our `/api/geo/pincode/{pin}` proxy.
2. **Review.** A condensed view of the cart and address. Last chance to apply or remove a coupon. The grand total shown is the exact amount Razorpay will charge.
3. **Payment.** Click *Pay now*. The Razorpay checkout modal opens with all standard Indian payment methods enabled:
   - **UPI** (GPay, PhonePe, Paytm, BHIM)
   - **Cards** (credit/debit, including international Visa and Mastercard)
   - **Netbanking** (all major Indian banks)
   - **Wallets** (Paytm, Mobikwik, Freecharge)
   - **EMI** for orders eligible by amount

In **test mode** (current preview), use card `4111 1111 1111 1111`, any future expiry, any CVV, OTP `1234` — or UPI VPA `success@razorpay`.

After payment, the modal closes and you are redirected to `/orders/<id>/confirmed`. From there, *Track order* takes you to the live tracking page.

## Order tracking and invoices

The tracking page lives at `/orders/<order_id>/track`. Logged-in customers see their orders automatically. Guest buyers reach it through `/orders/<order_id>/track?email=<their_email>` — the link is in the order confirmation email and in the bottom-of-page receipt. A wrong email returns a clean 404 — no PII is leaked.

The tracking page renders a **six-step gold timeline**:

| Step | Trigger |
|---|---|
| Ordered | Order created |
| Paid | Razorpay signature verified |
| Packed | Admin moves status to `processing` |
| Shipped | Admin enters AWB / carrier (auto-transitions) |
| Out for delivery | Admin or carrier webhook flips status |
| Delivered | Admin marks delivered — confetti fires once |

Below the timeline you can:

- **Download invoice** — opens `/api/orders/<id>/invoice.html`, a print-styled A4 page with the brand header, line items, GST breakdown and totals. Use your browser's *Print → Save as PDF* if you want a file copy.
- **Request cancellation** — visible while the order is `pending_payment`, `paid` or `processing`.
- **Request return** — visible only after the order is `delivered`.

Both requests open a dialog with a reason dropdown (six reasons) and an optional note. Submission is non-binding — we respond within 24 hours.

## Wishlist

The heart icon in the navbar shows your wishlist count. Adding from any product detail page requires you to be **logged in**; clicking the heart as a guest sends you to `/login` with a friendly toast.

The `/wishlist` page is auth-gated. Each saved item card shows the live price and stock status. *Move to cart* removes the item from the wishlist and pops it into the cart in one click; *Remove* deletes it from the wishlist without adding to cart.

Wishlist entries are unique per `(user_id, variant_id)` — adding the same variant twice is a no-op. The wishlist is **never shared** between accounts; it is bound to your login.

## Reviews

We only show reviews from **verified buyers** — people who actually purchased the product. The PDP review block has:

- A large average rating, the total review count, a **5-bar histogram** with percentages.
- **Filter chips**: All · 5★ · 4★ · With photos *(coming soon)* · Verified only.
- **Sort** by Most helpful (default), Newest, Highest, Lowest.
- A submit form that requires a **headline (4–80 chars)** and **body (20–1500 chars)** with a 1–5 star rating.

After submission you'll see _"Thank you — your review is being moderated."_ Reviews typically appear within 24 hours after admin approval.

> If you write a review and don't see it on the product page, give us a working day. If you need to edit or delete what you submitted, email us — admin tools cover that.

## Cancellations and returns

There is a single dialog from the order detail or tracking page:

- **Cancellation** — available before the order is shipped. We process the refund manually within 24 working hours and notify you by email.
- **Return** — available after the order is delivered. Within seven days of delivery you can ask us to pick up the bottle (if unopened) or refund a quality-affected item.

Both flows write to our internal queue and land in the admin's *Requests* dashboard. We respond on email within one working day.

## Newsletter

Submit your email through any of the three subscribe forms (footer, post-checkout, exit-intent). You will receive a **`WELCOME10`** code with a **24-hour expiry** — the cart banner counts down so you don't miss it.

We do not share your email. You can unsubscribe by emailing `hello@karijeeva.in`. (A self-serve unsubscribe page is on the roadmap.)

## Accessibility features

- **Skip introduction** link at the top of every page jumps to the main content (or past the Home scroll-film).
- **Visible gold focus ring** on every interactive element (button, link, input). Tab navigation is fully supported.
- All `<img>` carry meaningful `alt` text, not filenames.
- All form inputs have associated `<label>` elements; placeholders are decorative only.
- The Home scroll-film respects **`prefers-reduced-motion: reduce`**: instead of pinning, it renders six stacked static sections — readable in order, no animation, no parallax.
- On mobile (< 768 px), the film falls back to **scroll-snap** sections — no pin jank on iOS Safari.
- Color contrast for body text on parchment and on obsidian both pass WCAG AA.

## Support and contact

| Channel | Detail |
|---|---|
| Email | `hello@karijeeva.in` |
| Phone | `+91 80 4567 2890` |
| Hours | Mon–Sat · 10 AM – 6 PM IST |
| Address | Kadle Global Pvt Ltd, 42 Indiranagar 6th Main, Bengaluru 560038 |
| Web form | `/contact` |

The contact form on `/contact` writes a record into our admin inbox; we reply within one working day.

## Customer troubleshooting FAQ

**Payment failed mid-checkout.**
The Razorpay modal closed without success but money was deducted? Wait 5–10 minutes — most banks auto-reverse failed authorisations. Your order will sit at `pending_payment` and you can retry payment from the order tracking link without losing the cart. If money is not refunded within 5 working days, email us with your Razorpay payment ID.

**My coupon is not applying.**
Check the cart subtotal — `WELCOME10` requires ₹499 minimum. The cart will tell you exactly how much more to add. Codes are case-insensitive but otherwise exact: `WELCOME10` works, `welcome 10` will fail. Each coupon also has an expiry and total-uses cap, both of which the validator surfaces inline.

**I can't see my order.**
Logged-in customers see *all* their orders at `/account/orders`. Guest customers must use the tracking link in their confirmation email (or recall the order email and visit `/orders/<order_id>/track?email=<email>`). Lost the link? Email us and we'll resend it.

**The address is wrong.**
If the order is still `pending_payment` or `paid`, request cancellation and reorder. If it has shipped, contact us immediately — we'll try to redirect with the courier (no guarantees).

**I forgot my password.**
Self-serve password reset is on the post-launch roadmap. For now, email `hello@karijeeva.in` and we'll reset it within a working day.

**Can I delete my account?**
Yes — email us with the request and we'll permanently remove your user record, addresses, wishlist, reviews, and order history (subject to GST retention requirements for billed orders).

**The site looks weird in my browser.**
We support the latest two versions of Chrome, Edge, Firefox and Safari. The cinematic Home film uses GSAP ScrollTrigger; if it stutters, your browser is likely older. Hit *Skip introduction* to jump past it.

---

# Part B — Admin operations manual

## Logging in

- URL: `/login` (same login as customers — the admin role is detected from the JWT and the user is redirected to `/admin` automatically).
- Default credentials: **`admin@karijeeva.in` / `KarijeevaAdmin@2025`**. Change this immediately after first login (see [Admin security hygiene](#admin-security-hygiene)).
- The session is a 7-day `httpOnly` JWT. The role claim is **re-checked against the database on every privileged request** — a tampered token cannot grant admin access.
- A **brute-force limiter** rejects login from any IP that fails five attempts within a single minute (HTTP 429). The window is one minute; wait it out and retry.

## Dashboard

The dashboard at `/admin` opens with eight KPI cards and a 30-day revenue chart.

| KPI | What it means |
|---|---|
| Revenue (all time) | Sum of `total` for orders in `paid`, `processing`, `shipped`, `out_for_delivery`, `delivered` |
| Today's revenue | Same calculation, filtered to `created_at` starting today (UTC) |
| Total orders | Every order document, regardless of status |
| Paid / pending | Counts to spot abandoned-pay sessions |
| AOV | Total revenue ÷ paid order count |
| Paid rate | Paid orders ÷ total orders × 100 |
| Low stock | Variants with stock ≤ 10 — your restock signal |
| Reviews pending | Awaiting moderation |
| Open requests | Cancellation / return queue |
| New messages | Contact form submissions still in `new` state |
| Subscribers | Newsletter list size |

The chart is built from server-side aggregation — daily revenue for the last 30 days. Underneath, the *Latest orders* and *Reviews awaiting moderation* lists give you one-click access to the next thing that needs you.

## Orders

`/admin/orders` is the operational nerve centre.

- **Filters**: status, free-text search (order number, email, phone, name), from-date and to-date.
- **Bulk export**: *Export CSV* respects the current filter state.
- **Click any row** to open the order detail page.

The detail page shows items, totals, full address, customer email, payment information, the **payment_attempts audit** (every tampered or failed verify attempt) and any cancellation/return requests linked to the order.

### Status transitions

Use the *Change status* dropdown and confirm. Every transition writes to `admin_audit_logs`.

| From → To | Triggers |
|---|---|
| `pending_payment` → `paid` | Manual override (rare; usually Razorpay does this) |
| `paid` → `processing` | You're packing the order |
| `processing` → `shipped` | Use *Add shipping* (sets AWB and auto-transitions) |
| `shipped` → `out_for_delivery` | Optional, for live tracking accuracy |
| any → `delivered` | Marks completion; customer sees confetti |
| any → `cancelled` | Use the cancel reason field; refund is separate |
| `paid` / `processing` → `refunded` | Use the *Refund* button — see [Refunds](#refunds) |

> Stock decrement is **not automatic** in the MVP — it is intentional, so you keep manual control. When confident, you can switch to auto-decrement on `paid` (one-line change).

## Shipping

From the order detail, click *Add shipping*. Enter:

- **AWB / tracking number** (required)
- **Carrier name** (required — e.g. Delhivery, Bluedart, ST Courier)
- **Tracking URL** (optional — pasted into the customer-facing tracking page)
- **Internal note** (optional)

Saving auto-transitions the order to `shipped` and the customer's `/orders/<id>/track` page reflects the new step on the next page load.

## Refunds

From the order detail, the *Refund via Razorpay* button is visible only on orders with a captured `razorpay_payment_id`.

- **Full refund**: leave the amount at the default (the order total).
- **Partial refund**: enter a smaller amount in rupees.
- **Reason**: pick from Damaged in transit / Wrong product / Quality issue / Customer request / Duplicate charge / Other.
- **Notes**: free text, stored in the `refunds` collection and the audit log.

The button calls Razorpay's refund API in real time. On success a Razorpay refund ID is shown in a toast; the order moves to `refunded` (full) or `partial_refund` (partial) and a row is appended to `refunds`. The `refunded_amount_paise` field on the order is incremented.

> Currently in **test mode** — refunds against test payments succeed instantly. For live mode, the refund follows your Razorpay settlement schedule (usually 5–7 business days to the cardholder).

If Razorpay rejects the refund, you'll see HTTP 502 with the Razorpay error message; the failed attempt still lands in `refunds` with `status="failed"` for traceability.

## Products and variants

`/admin/products` lists every product, active and inactive. Search is over name, slug and tags.

### Creating a product

Click *New product*. The dialog covers everything: name, short description, long description, category, tags, gallery image URLs (one per line), benefits, ingredients, "how to use" steps, and feature flags (`is_featured`, `is_new_launch`, `is_active`). The **slug auto-generates** from the name and is **immutable after create**.

Image guidelines: host images on a CDN (Unsplash for now, Cloudinary or S3 later); recommended size **1200 × 1200** for the main gallery, JPEG quality 80–85.

In the same dialog, add **variants** (size, SKU, price, MRP, stock). Each variant has a unique ID; SKUs should be unique by convention.

### Editing or deleting

The pencil icon opens the same dialog with the product preloaded. Slug is shown read-only.

The eye icon **soft-deactivates** the product (sets `is_active=false`, hides it from the public catalog without losing data). Click again to restore. There is no hard delete — by design, so historical orders never break.

## Inventory

`/admin/inventory` is a flat table of every variant across products with current stock, price, MRP and SKU.

- **Inline adjust** opens a dialog with: new stock value, **reason** (Restock / Adjustment / Damaged / Audit correction), optional internal note. Saving writes to `inventory_logs` so the *what changed and why* trail is preserved.
- **Color thresholds**: stock ≤ 10 → red chip with warning icon; stock ≤ 25 → amber chip; otherwise green.
- **Low stock only** filter to focus on what needs you.

The full audit log lives at `/admin/inventory/logs` and is filterable by reason and by variant.

## Reviews moderation

`/admin/reviews` is a tabbed queue: **Pending · Approved · Rejected**.

Per review you can: **Approve · Reject (with optional reason) · Delete**. After every action the product's `avg_rating` and `review_count` are recomputed from the surviving approved reviews — the storefront updates within seconds.

Bulk select multiple pending reviews and click *Approve all* or *Reject all*.

## Coupons

`/admin/coupons` lists all coupons with their status (Active / Inactive / Expired / Used up).

Create a new one with: **code** (uppercased automatically), **type** (Percent or Flat ₹), **value**, **min order** (₹), **max uses**, **expires at** (optional), **active** toggle, and a **customer-facing description**.

Click the chart icon for **per-coupon stats**: total uses, total discount given (sum across paid orders), last-used timestamp.

## Newsletter subscribers

`/admin/newsletter` lists every subscriber with the source (footer, exit-intent, post-checkout). Search by email. *Export CSV* downloads the entire list.

The seeded `WELCOME10` is automatically issued to every new subscriber via the welcome email template (currently a client-side modal — when SendGrid is wired in, it will become a real email).

## Cancellation and return requests

`/admin/requests` is the queue of customer-submitted requests. Tabs: **Open · In review · Resolved · Declined**.

Click *Manage* to set the status and add an internal note. The customer is **not** automatically emailed (SendGrid post-launch); contact them via email or phone using the customer record.

## Site settings

`/admin/settings` lets you edit:

- **Hero headline** and **hero sub-copy** (above the fold on Home — currently hidden under the film, but used by SEO and the OG share image)
- **Hero image URL**
- **Tagline** (short brand line)
- **Vision statement** (long form, shown on the Home vision spread)
- **Contact** block (address, email, phone, hours — used by the Contact page and the invoice footer)

Changes save immediately and the public `/api/site-settings` endpoint reflects the new values within seconds. Use this to tweak copy without a deploy.

## Audit log

`/admin/audit` records every privileged admin action. Each row captures: timestamp, admin email, action (e.g. `order.refund`, `product.update`, `review.approve`), target type and ID, the diff payload, and the originating IP.

Filter by action substring, admin email, or target type. The collection is uncapped and meant to be your forever record of admin operations.

## Admin security hygiene

- **Rotate the seeded password** the moment you log in for the first time. There is no UI yet — use the Mongo one-liner in `/app/LAUNCH_CHECKLIST.md` § 4.
- **Never share your JWT cookie**. If you suspect compromise, the easiest revoke is to change `JWT_SECRET` in `backend/.env` and restart — every existing token invalidates immediately.
- **Always log out** when stepping away, especially on shared devices.
- **The audit log is your forensic trail** — review it weekly. Anything unusual (out-of-hours admin actions, unknown IPs) deserves a second look.
- The application sets HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy and Permissions-Policy on every API response. The same headers must be replicated at the edge for HTML routes — see `/app/LAUNCH_CHECKLIST.md` § 1.

## Razorpay webhook configuration

The webhook endpoint at `POST /api/payments/webhook` listens for live events from Razorpay and keeps order/refund status in sync.

For live launch:

1. Replace `RAZORPAY_WEBHOOK_SECRET` in `backend/.env` with the real secret from the Razorpay dashboard.
2. In the Razorpay dashboard (Settings → Webhooks → Create), set:
   - **URL**: `{SITE_PUBLIC_URL}/api/payments/webhook`
   - **Active events**: `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`
3. Restart the backend (`sudo supervisorctl restart backend`).
4. Run a ₹1 live transaction to confirm the webhook arrives — it should land in the `razorpay_webhook_events` collection with `signature_valid: true`.

Every webhook event (valid or invalid) is logged in `razorpay_webhook_events` for full traceability.

---

_Last updated: 2026-02-20_
