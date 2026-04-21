# Karijeeva — Production Launch Checklist

This checklist covers everything that needs to be configured **outside the codebase** before flipping the site to live. The application code is MVP-complete and tested (see `/app/test_reports/iteration_8.json`). What's below is **deploy-time configuration** that cannot be baked into the repo.

---

## 1. Security headers at the edge

FastAPI sets the full header set on every `/api/*` response. **SPA HTML routes** (`/`, `/products`, `/checkout`, `/razorpay-poc`, `/admin`, etc.) are served by the static host / CDN and need these headers configured there.

A `<meta http-equiv="Content-Security-Policy">` and `<meta name="referrer">` are already embedded in `/app/frontend/public/index.html` as a belt-and-braces fallback. The headers below **cannot** be set via `<meta>` (browsers ignore them) and **must** be configured at the edge:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(self "https://api.razorpay.com")` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` *(redundant with meta but preferred at edge)* |
| `Content-Security-Policy` | *(same policy as the `<meta>` fallback; preferred at edge so it also applies to non-HTML static assets)* |

### Vercel (`vercel.json`)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(self \"https://api.razorpay.com\")" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://fonts.googleapis.com https://api.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self' https://api.razorpay.com;" }
      ]
    }
  ]
}
```

### Nginx
```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy 'camera=(), microphone=(), geolocation=(), payment=(self "https://api.razorpay.com")' always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://fonts.googleapis.com https://api.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self' https://api.razorpay.com;" always;
```

### CloudFront
Use a **Response Headers Policy** with the same six headers and attach it to the SPA distribution.

> **Note on CSP for prod:** drop `'unsafe-eval'` for production bundles (the dev policy keeps it only for CRA's dev server). PostHog/Emergent assets are allowed only in the dev preview; remove those CDN entries before going live.

---

## 2. Razorpay — flip to live

Current state: **test mode** (`rzp_test_SffqJVx1aXnkTg`).

Before launch:
1. Replace in `backend/.env`:
   ```
   RAZORPAY_KEY_ID="rzp_live_XXXXXXXXXXXXXX"
   RAZORPAY_KEY_SECRET="XXXXXXXXXXXXXXXXXXXXXXXX"
   ```
2. Replace `RAZORPAY_WEBHOOK_SECRET` with the real secret shown in the Razorpay dashboard (Settings → Webhooks → your webhook → Show Secret).
3. In Razorpay dashboard, configure the webhook:
   - URL: `{SITE_PUBLIC_URL}/api/payments/webhook`
   - Active events: `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`
4. `sudo supervisorctl restart backend`.
5. Do a ₹1 live transaction end-to-end with a real card to confirm capture + webhook arrival.

---

## 3. Domain & public URL

In `backend/.env`:
```
SITE_PUBLIC_URL="https://www.karijeeva.in"
CORS_ORIGINS="https://www.karijeeva.in,https://karijeeva.in"
```

In `frontend/.env`:
```
REACT_APP_BACKEND_URL="https://www.karijeeva.in"
```

After editing: `sudo supervisorctl restart backend frontend`.

---

## 4. Database

1. Point `MONGO_URL` at the production MongoDB cluster (Atlas connection string).
2. Run the seed **once** on production:
   ```
   python /app/backend/seed.py
   ```
   This creates the 3 products, 9 variants, 120 reviews, 6 recipes, 5 blog posts, 10 FAQs, 6 testimonials, WELCOME10 coupon, and the admin user (`admin@karijeeva.in` / `KarijeevaAdmin@2025`).
3. **Immediately change the admin password** after first login — no UI yet, so patch via the Mongo shell:
   ```python
   python -c "
   import bcrypt, asyncio, os
   from motor.motor_asyncio import AsyncIOMotorClient
   async def run():
       c = AsyncIOMotorClient(os.environ['MONGO_URL']); db = c[os.environ['DB_NAME']]
       pw = bcrypt.hashpw(b'YOUR_NEW_STRONG_PASSWORD', bcrypt.gensalt(12)).decode()
       await db.users.update_one({'email': 'admin@karijeeva.in'}, {'\$set': {'password_hash': pw}})
   asyncio.run(run())
   "
   ```
4. Turn on MongoDB daily backups (Atlas → Backup) and verify point-in-time recovery is enabled.

---

## 5. JWT secret

The current `JWT_SECRET` in `backend/.env` is fine for a new install, but regenerate for production:
```
python -c "import secrets; print(secrets.token_hex(64))"
```
Paste into `JWT_SECRET=` in production `.env`. Restart backend. All current sessions will invalidate (acceptable pre-launch).

---

## 6. Observability — minimum viable

- Keep `/api/errors/client` live — it captures unhandled React crashes (cap 1000).
- Keep `/admin/audit` — captures every privileged admin mutation.
- Keep `/admin/orders/:id` → `payment_attempts` section — captures tampered Razorpay signatures.
- Recommended upgrade post-launch: wire the same errors to Sentry (one env var + one import).

---

## 7. Post-launch backlog (from PRD, priority order)

1. SendGrid / Resend: abandoned-cart nudge, admin reply, daily admin digest.
2. Photo uploads on reviews + helpfulness votes.
3. Real carrier tracking webhook (Delhivery/Bluedart/Shiprocket).
4. Exit-intent WELCOME10 modal on `/products` (no backend work needed — reuses existing newsletter + coupon).
5. Bulk-generate coupon CSV.
6. Structured before/after diffs in `admin_audit_logs`.

---

## 8. Smoke test after deploy

Run these in order against the production domain. Any failure → roll back.

```
# Health
curl https://www.karijeeva.in/api/health

# Security headers (SPA)
curl -I https://www.karijeeva.in/ | grep -iE 'strict|frame|content-type|referrer|permissions|content-security'

# Security headers (API)
curl -I https://www.karijeeva.in/api/health | grep -iE 'strict|frame|content-type|referrer|permissions|content-security'

# Storefront renders
curl -s https://www.karijeeva.in/ | grep -i 'Karijeeva'

# Product detail OK
curl -s https://www.karijeeva.in/api/products/virgin-cold-pressed-coconut-oil | python -c "import sys,json;p=json.load(sys.stdin);print(p['name'], p['avg_rating'], p['review_count'])"

# Create a test order (₹1) → complete live payment → verify order reaches status='paid'.
```

---

**Confirmed ready to deploy** — after completing sections 2, 3, 4, and 5 above.
