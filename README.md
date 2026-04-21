# Karijeeva — Premium D2C Cold-Pressed Coconut Oil

**Karijeeva** is a premium direct-to-consumer e-commerce experience for authentic, non-adulterated cold-pressed and wood-pressed coconut oil by **Kadle Global Pvt Ltd** — built on a FastAPI + React + MongoDB stack, dressed in the **Liquid Gold Noir** design language, with a fully self-serve admin operations panel.

**Preview:** <https://karijeeva-oils.preview.emergentagent.com>

---

## Tech stack

- **Frontend:** React 18 (Create React App), Tailwind CSS, shadcn/ui, GSAP + ScrollTrigger, Fraunces / Inter Tight / Instrument Serif.
- **Backend:** FastAPI (Python 3.11), Motor async MongoDB driver, Razorpay Python SDK, bcrypt + python-jose JWT.
- **Database:** MongoDB 7.x (self-hosted or Atlas).
- **Payments:** Razorpay (Orders, Refunds, Webhooks).

---

## Brand narrative

Karijeeva sells **one** thing extraordinarily well — honest coconut oil — around **five non-negotiables** that the homepage opens with:

1. **Cold or wood-pressed only** — never solvent-extracted, never RBD-refined.
2. **Single-origin coconuts** — handpicked from named grove partners on the Konkan and Karnataka coast.
3. **Lab-tested every batch** — moisture, FFA, peroxide, smoke point.
4. **Glass bottle, no plastic in contact with oil** — recyclable, returnable.
5. **Direct from press to door** — no warehousing months, no third-party blending.

The `/` route is a **six-beat GSAP scroll-film** (Premium → Handpicked → Transparency → Cold-Pressed → No Adulteration → Reveal), pinned for ~600vh on desktop with a scroll-snap fallback on mobile and a static stack under `prefers-reduced-motion`.

---

## Repo structure

```
.
├── backend/                 FastAPI app
│   ├── server.py            Storefront + payments + auth + webhooks
│   ├── admin_api.py         /admin endpoints (role-gated)
│   ├── seed.py              Idempotent seeder (3 products, 120 reviews, etc.)
│   ├── requirements.txt
│   └── .env.example
├── frontend/                React CRA storefront
│   ├── public/
│   ├── src/
│   │   ├── components/      ui/, admin/, cart/, layout/, marketing/
│   │   ├── pages/           Home.jsx (GSAP), PDP, checkout, admin, …
│   │   └── styles/tokens.css  Liquid Gold Noir palette
│   ├── package.json
│   └── .env.example
├── docs/
│   ├── USER_MANUAL.md       Customer + admin handbook
│   ├── FEATURE_LIST.md      Exhaustive shipped-feature inventory
│   ├── PRODUCT_DOCUMENT.md  16-section product reference
│   └── VPS_DEPLOYMENT_GUIDE.md  Copy-pasteable Ubuntu 22.04 deploy
├── memory/PRD.md            One-page product requirements
├── LAUNCH_CHECKLIST.md      Deploy-time configuration outside the codebase
├── README.md                You are here
└── LICENSE                  All rights reserved · Kadle Global Pvt Ltd
```

---

## Quickstart (local dev)

Prerequisites: Python 3.11, Node.js 20.x, Yarn, MongoDB 7.x running locally.

```bash
# Backend
cd backend
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env && $EDITOR .env         # fill in real values
python seed.py                                # one-time idempotent seed
uvicorn server:app --reload --port 8001

# Frontend (separate terminal)
cd frontend
yarn install
cp .env.example .env && $EDITOR .env         # set REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

Open <http://localhost:3000>.

---

## Documentation

| File | Purpose |
|---|---|
| [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md) | Practical handbook for customers and admins. |
| [`docs/FEATURE_LIST.md`](docs/FEATURE_LIST.md) | Exhaustive inventory of every shipped feature. |
| [`docs/PRODUCT_DOCUMENT.md`](docs/PRODUCT_DOCUMENT.md) | 16-section product reference — vision, personas, architecture, roadmap. |
| [`docs/VPS_DEPLOYMENT_GUIDE.md`](docs/VPS_DEPLOYMENT_GUIDE.md) | Copy-pasteable Ubuntu 22.04 production deploy guide. |
| [`memory/PRD.md`](memory/PRD.md) | One-page product requirements (canonical). |
| [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) | Deploy-time configuration (Razorpay live keys, TLS headers at edge, JWT rotation, Mongo backups). |

---

## Admin credentials (seeded)

The seeder creates an admin user:

- **Email:** `admin@karijeeva.in`
- **Password:** `KarijeevaAdmin@2025`

> ⚠️ **Rotate this password immediately** on any environment that is reachable by a real user. See `LAUNCH_CHECKLIST.md` §4 and `docs/VPS_DEPLOYMENT_GUIDE.md` §12 for the exact Mongo one-liner.

---

## Razorpay

The repo ships with Razorpay in **TEST mode** (`rzp_test_*`). Use the test card `4111 1111 1111 1111` (any future expiry, any CVV) or UPI `success@razorpay` to complete a checkout flow end-to-end.

Swap to live keys at go-live — full instructions in [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) §2 and [`docs/VPS_DEPLOYMENT_GUIDE.md`](docs/VPS_DEPLOYMENT_GUIDE.md) §11.

---

## License

All rights reserved. © Kadle Global Pvt Ltd.

See [`LICENSE`](LICENSE) for full terms. Unauthorized copying, distribution, modification, or use of this code is strictly prohibited without express written permission.
