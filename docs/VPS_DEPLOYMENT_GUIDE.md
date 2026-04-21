# Karijeeva — VPS Deployment Guide

> Audience: a reasonably experienced Linux/DevOps engineer with **root on a fresh Ubuntu 22.04 LTS** VPS.
> Goal: take the Karijeeva codebase from `git clone` to a hardened, TLS-terminated, production-grade single-server deployment that can do real Razorpay live transactions.

This document is **deployment configuration only** — no application code is modified. Every command is copy-pasteable. Every env var name is the real one the codebase reads. Every file path matches the real repo layout.

---

## Table of contents

1. [Overview](#1-overview)
2. [Pre-requisites](#2-pre-requisites)
3. [Server provisioning & hardening](#3-server-provisioning--hardening)
4. [Install system dependencies](#4-install-system-dependencies)
5. [Clone the repo & directory layout](#5-clone-the-repo--directory-layout)
6. [MongoDB setup](#6-mongodb-setup)
7. [Backend deploy (FastAPI + Uvicorn)](#7-backend-deploy-fastapi--uvicorn)
8. [Frontend build & static hosting](#8-frontend-build--static-hosting)
9. [Nginx configuration](#9-nginx-configuration)
10. [TLS with Let's Encrypt](#10-tls-with-lets-encrypt)
11. [Razorpay production wiring](#11-razorpay-production-wiring)
12. [Admin account rotation](#12-admin-account-rotation)
13. [Observability & maintenance](#13-observability--maintenance)
14. [Zero-downtime deploy workflow](#14-zero-downtime-deploy-workflow)
15. [Smoke tests after deploy](#15-smoke-tests-after-deploy)
16. [Troubleshooting cheat sheet](#16-troubleshooting-cheat-sheet)
17. [Security hygiene checklist](#17-security-hygiene-checklist)
18. [Appendix — env-var reference](#18-appendix--env-var-reference)

---

## 1. Overview

We are deploying **Karijeeva**, a FastAPI + React (Create React App static build) + MongoDB stack, onto a single Ubuntu 22.04 LTS VPS. Nginx terminates TLS on `:443`, serves the React static bundle from disk, and reverse-proxies `/api/*` to a Uvicorn worker pool bound to `127.0.0.1:8001`. MongoDB runs either locally (bound to `127.0.0.1:27017`) or — recommended for real launches — on **MongoDB Atlas**. Razorpay is reached as an outbound HTTPS dependency for orders, refunds and webhook callbacks.

**Final topology:**

```
                                 ┌──────────────────────────────────┐
                                 │   External                       │
                                 │   - Razorpay API + webhook       │
                                 │   - India Post pincode API       │
                                 │   - MongoDB Atlas (optional)     │
                                 └────────────┬─────────────────────┘
                                              │ HTTPS
                                              │
        ┌──────────┐    HTTPS 443     ┌───────▼─────────────────────────────┐
        │  Client  │◀────────────────▶│   Nginx (TLS, gzip, sec headers)   │
        │ Browser  │                  │   - serves /opt/karijeeva/         │
        └──────────┘                  │            frontend/build/         │
                                      │   - reverse-proxies /api/* →       │
                                      │     http://127.0.0.1:8001          │
                                      └─────┬───────────────────────┬──────┘
                                            │                       │
                                            │ /api/*                │ static
                                            ▼                       ▼
                                ┌──────────────────────┐   (CSS/JS/img/woff2)
                                │  Uvicorn workers     │
                                │  FastAPI server.py   │
                                │  127.0.0.1:8001      │
                                └──────────┬───────────┘
                                           │
                                           ▼
                                ┌──────────────────────┐
                                │  MongoDB             │
                                │  127.0.0.1:27017     │
                                │  OR Atlas SRV string │
                                └──────────────────────┘
```

---

## 2. Pre-requisites

Before you start, confirm you have all of the following:

- A registered domain (e.g. `karijeeva.in`).
  - **A** record `your-domain.com` → VPS IPv4
  - Optional **AAAA** record → VPS IPv6
  - Optional **CNAME** `www` → `your-domain.com`
- SSH access to the VPS as `root` or a sudo-capable user.
- **Razorpay LIVE credentials** from the Razorpay Dashboard:
  - `key_id` (starts with `rzp_live_`)
  - `key_secret`
  - `webhook_secret` (you will create the webhook in section 11)
- **Minimum VPS specs (starter launch):** 2 vCPU · 4 GB RAM · 40 GB SSD (NVMe preferred).
  - If you self-host MongoDB on the same box and expect heavy traffic, bump to **8 GB RAM** (Mongo's WiredTiger cache wants ~50% of RAM minus 1 GB).
  - For the editorial launch budget we recommend: **DigitalOcean Premium AMD 4 GB / 2 vCPU / 80 GB NVMe** (Bangalore region for sub-30 ms India latency) or **Hetzner CPX21 (Helsinki/Falkenstein)** if you want the cheapest credible box.
- **Optional but recommended for production:** a **MongoDB Atlas** account (free M0 to start, M10 minimum for real traffic). Both self-hosted and Atlas paths are documented in section 6.

> ⚠️ **Opinionated default:** for any real launch use **Atlas** for MongoDB. Self-hosting is documented for completeness but it puts the burden of backups, replication, point-in-time recovery and patching on you.

---

## 3. Server provisioning & hardening

SSH in as `root` (the rest of the guide assumes the working user is `karijeeva`, a sudo-capable non-root user).

### 3.1 Create a non-root sudo user

```bash
adduser karijeeva
usermod -aG sudo karijeeva
mkdir -p /home/karijeeva/.ssh
cp /root/.ssh/authorized_keys /home/karijeeva/.ssh/
chown -R karijeeva:karijeeva /home/karijeeva/.ssh
chmod 700 /home/karijeeva/.ssh
chmod 600 /home/karijeeva/.ssh/authorized_keys
```

Open a **second terminal** and confirm SSH-key login works as `karijeeva` **before** locking root out:

```bash
ssh karijeeva@your-domain.com
```

### 3.2 Lock down SSH

Edit `/etc/ssh/sshd_config`:

```bash
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
# Optional: change SSH port from 22 to e.g. 2222 — update ufw rule below if you do.
# sudo sed -i 's/^#\?Port .*/Port 2222/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

> ⚠️ **Do not log out of your original SSH session until you've confirmed your second session reconnects after the restart.**

### 3.3 Firewall (ufw)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH          # or 'sudo ufw allow 2222/tcp' if you changed the port
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

If you self-host MongoDB on the same box, do **not** open 27017. It will be bound to `127.0.0.1` only.

### 3.4 fail2ban for sshd

```bash
sudo apt update
sudo apt install -y fail2ban
sudo tee /etc/fail2ban/jail.d/sshd.local > /dev/null <<'EOF'
[sshd]
enabled  = true
port     = ssh
logpath  = %(sshd_log)s
backend  = systemd
maxretry = 5
findtime = 10m
bantime  = 1h
EOF
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

### 3.5 Unattended security upgrades

```bash
sudo apt install -y unattended-upgrades apt-listchanges
sudo dpkg-reconfigure -plow unattended-upgrades
```

Confirm `/etc/apt/apt.conf.d/50unattended-upgrades` enables `${distro_id}:${distro_codename}-security` and that `/etc/apt/apt.conf.d/20auto-upgrades` reads:

```ini
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

### 3.6 Timezone & NTP

```bash
sudo timedatectl set-timezone Asia/Kolkata
sudo apt install -y chrony
sudo systemctl enable --now chrony
timedatectl status
```

Accurate time is **mandatory** — Razorpay webhook signature verification will fail if your clock drifts.

---

## 4. Install system dependencies

```bash
sudo apt update && sudo apt -y upgrade
sudo apt install -y \
  curl wget git build-essential ca-certificates lsb-release gnupg \
  nginx supervisor logrotate \
  certbot python3-certbot-nginx
```

### 4.1 Python 3.11 (via deadsnakes)

Ubuntu 22.04 ships Python 3.10. Karijeeva targets 3.11.

```bash
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev
python3.11 --version
```

### 4.2 Node.js 20.x and Yarn

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
corepack prepare yarn@1.22.22 --activate
node -v && yarn -v
```

> ⚠️ Use **yarn**, not npm. The repo's lockfile is `yarn.lock`.

### 4.3 (Optional) MongoDB 7.x community

Skip this subsection if you are using Atlas.

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
mongod --version
```

---

## 5. Clone the repo & directory layout

```bash
sudo mkdir -p /opt/karijeeva
sudo chown karijeeva:karijeeva /opt/karijeeva
cd /opt
git clone https://github.com/<your-org>/karijeeva.git karijeeva
cd /opt/karijeeva
```

Expected layout (`tree -L 2`):

```
/opt/karijeeva
├── backend
│   ├── admin_api.py
│   ├── requirements.txt
│   ├── seed.py
│   ├── server.py
│   └── .env                ← you will create this
├── docs
│   ├── FEATURE_LIST.md
│   ├── PRODUCT_DOCUMENT.md
│   ├── USER_MANUAL.md
│   └── VPS_DEPLOYMENT_GUIDE.md
├── frontend
│   ├── build               ← created by `yarn build`
│   ├── package.json
│   ├── public
│   ├── src
│   ├── tailwind.config.js
│   ├── yarn.lock
│   └── .env                ← you will create this
├── LAUNCH_CHECKLIST.md
└── memory
    └── PRD.md
```

### 5.1 Backend `.env` template

Create `/opt/karijeeva/backend/.env`:

```env
# ── MongoDB ───────────────────────────────────────────────
MONGO_URL=mongodb://karijeeva_app:STRONG_DB_PASSWORD@127.0.0.1:27017/karijeeva?authSource=karijeeva
DB_NAME=karijeeva

# ── Auth ──────────────────────────────────────────────────
JWT_SECRET=REPLACE_WITH_64_BYTE_HEX
JWT_TTL_DAYS=7

# ── Razorpay (LIVE) ───────────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXX

# ── Public URLs / CORS ────────────────────────────────────
SITE_PUBLIC_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

| Key | What it does |
|---|---|
| `MONGO_URL` | Mongo connection string. Self-hosted form shown above; Atlas users paste their SRV URI (see §6b). |
| `DB_NAME` | Database name (`karijeeva`). Must match the database in `MONGO_URL`. |
| `JWT_SECRET` | HMAC secret for signing session JWTs. Rotate any time; all sessions invalidate. |
| `JWT_TTL_DAYS` | Session lifetime in days. Default 7. |
| `RAZORPAY_KEY_ID` / `_SECRET` | Live API keys from Razorpay Dashboard → Account & Settings → API Keys. |
| `RAZORPAY_WEBHOOK_SECRET` | The secret you set when creating the webhook in §11. Used to verify `X-Razorpay-Signature`. |
| `SITE_PUBLIC_URL` | The canonical https URL of your storefront. Used for absolute URLs in invoices, emails, sitemaps. |
| `CORS_ORIGINS` | Comma-separated list of origins allowed to hit `/api/*` from a browser. |

### 5.2 Frontend `.env` template

Create `/opt/karijeeva/frontend/.env`:

```env
REACT_APP_BACKEND_URL=https://your-domain.com
```

Because Nginx serves the SPA and reverse-proxies `/api/*` on the same origin, `REACT_APP_BACKEND_URL` is just your public site URL — **no port, no `/api` suffix**. The frontend code prefixes `/api` itself.

> ⚠️ Anything in `frontend/.env` is **baked into the static bundle at build time**. To change it, you must re-run `yarn build`.

---

## 6. MongoDB setup

Pick **6a** OR **6b**. Do not do both.

### 6a. Self-hosted MongoDB on the same VPS

Edit `/etc/mongod.conf`:

```yaml
storage:
  dbPath: /var/lib/mongodb
net:
  port: 27017
  bindIp: 127.0.0.1
security:
  authorization: enabled
```

Restart and create the application user:

```bash
sudo systemctl restart mongod

mongosh --eval '
use admin
db.createUser({
  user: "root",
  pwd:  "STRONG_ROOT_PASSWORD",
  roles: [ "root" ]
})
'

mongosh -u root -p STRONG_ROOT_PASSWORD --authenticationDatabase admin --eval '
use karijeeva
db.createUser({
  user: "karijeeva_app",
  pwd:  "STRONG_DB_PASSWORD",
  roles: [ { role: "readWrite", db: "karijeeva" } ]
})
'
```

Connection string for `MONGO_URL`:

```
mongodb://karijeeva_app:STRONG_DB_PASSWORD@127.0.0.1:27017/karijeeva?authSource=karijeeva
```

### 6b. MongoDB Atlas (recommended for production)

1. Create an Atlas project and a **dedicated cluster** (M10 minimum for production traffic; M0 free tier is OK for staging).
2. **Network Access** → add the VPS public IPv4 to the IP allow-list. Avoid `0.0.0.0/0`.
3. **Database Access** → create a user `karijeeva_app` with **readWrite on `karijeeva`** only.
4. **Database** → **Connect** → **Drivers** → copy the SRV URI. It looks like:
   ```
   mongodb+srv://karijeeva_app:STRONG_DB_PASSWORD@cluster0.abcd.mongodb.net/karijeeva?retryWrites=true&w=majority&appName=karijeeva
   ```
5. Paste it into `MONGO_URL`. Keep `DB_NAME=karijeeva`.
6. **Backup → Cloud Backup → Continuous** for point-in-time restore. Default retention is fine (1 day PITR + scheduled snapshots).

---

## 7. Backend deploy (FastAPI + Uvicorn)

### 7.1 Create the venv and install dependencies

```bash
cd /opt/karijeeva/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip wheel
pip install -r requirements.txt
deactivate
```

### 7.2 Generate JWT secret

```bash
python3.11 -c 'import secrets; print(secrets.token_hex(64))'
```

Paste the output into `JWT_SECRET=` inside `backend/.env`.

### 7.3 Seed the database (one-time)

```bash
cd /opt/karijeeva/backend
source venv/bin/activate
python seed.py
deactivate
```

This creates:
- 3 products / 9 variants
- 120 verified-buyer reviews (40 per product, deterministic IDs → idempotent)
- 6 recipes, 5 blog posts, 10 FAQs, 6 testimonials
- `WELCOME10` coupon (10% off, ₹499 minimum)
- Admin user `admin@karijeeva.in / KarijeevaAdmin@2025`

> ⚠️ **You will rotate the admin password in §12.** Do it the moment you finish this guide.

### 7.4 Run Uvicorn under Supervisor

Create `/etc/supervisor/conf.d/karijeeva-backend.conf`:

```ini
[program:karijeeva-backend]
command=/opt/karijeeva/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001 --workers 2 --proxy-headers --forwarded-allow-ips="127.0.0.1"
directory=/opt/karijeeva/backend
user=karijeeva
autostart=true
autorestart=true
startsecs=5
stopasgroup=true
killasgroup=true
stdout_logfile=/var/log/supervisor/karijeeva-backend.out.log
stderr_logfile=/var/log/supervisor/karijeeva-backend.err.log
stdout_logfile_maxbytes=20MB
stderr_logfile_maxbytes=20MB
stdout_logfile_backups=5
stderr_logfile_backups=5
environment=PYTHONUNBUFFERED="1"
```

Reload supervisor and bring the service up:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status karijeeva-backend
```

### 7.5 Alternative — systemd unit (skip if using supervisor)

`/etc/systemd/system/karijeeva-backend.service`:

```ini
[Unit]
Description=Karijeeva FastAPI backend (Uvicorn)
After=network.target mongod.service

[Service]
User=karijeeva
Group=karijeeva
WorkingDirectory=/opt/karijeeva/backend
EnvironmentFile=/opt/karijeeva/backend/.env
ExecStart=/opt/karijeeva/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001 --workers 2 --proxy-headers --forwarded-allow-ips=127.0.0.1
Restart=always
RestartSec=5
KillMode=mixed
TimeoutStopSec=20
StandardOutput=append:/var/log/karijeeva/backend.out.log
StandardError=append:/var/log/karijeeva/backend.err.log

[Install]
WantedBy=multi-user.target
```

Enable + start:

```bash
sudo mkdir -p /var/log/karijeeva && sudo chown karijeeva:karijeeva /var/log/karijeeva
sudo systemctl daemon-reload
sudo systemctl enable --now karijeeva-backend
sudo systemctl status karijeeva-backend
```

### 7.6 Verify

```bash
curl -s http://127.0.0.1:8001/api/health
# → {"status":"ok"}
```

---

## 8. Frontend build & static hosting

```bash
cd /opt/karijeeva/frontend
yarn install --frozen-lockfile
yarn build
ls -lh build/index.html
```

The output of `yarn build` is the production-ready static site at `/opt/karijeeva/frontend/build/`. Nginx serves this directory directly. There is no Node process running in production for the frontend.

> ⚠️ Re-run `yarn build` **every time** you change `frontend/.env` or any frontend source file.

Make the build directory readable by Nginx (it runs as `www-data`):

```bash
sudo chgrp -R www-data /opt/karijeeva/frontend/build
sudo chmod -R g+rX     /opt/karijeeva/frontend/build
sudo chmod g+x /opt/karijeeva /opt/karijeeva/frontend
```

---

## 9. Nginx configuration

Create `/etc/nginx/sites-available/karijeeva.conf`:

```nginx
# ── HTTP → HTTPS redirect ────────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # ACME http-01 challenge (Let's Encrypt) is served from the default webroot
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# ── HTTPS — main site ────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # ── TLS (Let's Encrypt — populated by certbot in §10) ────────────────────
    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers   ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    # ── Security headers (cannot be set via <meta>) ──────────────────────────
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options    "nosniff" always;
    add_header X-Frame-Options           "DENY" always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy        "camera=(), microphone=(), geolocation=(), payment=(self \"https://api.razorpay.com\")" always;
    # CSP also lives in /opt/karijeeva/frontend/public/index.html as a meta fallback,
    # but the edge header takes precedence for assets served by Nginx.
    add_header Content-Security-Policy   "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://fonts.googleapis.com https://api.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self' https://api.razorpay.com;" always;

    # ── Compression ──────────────────────────────────────────────────────────
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types
        text/plain text/css text/xml application/json application/javascript
        application/xml+rss application/atom+xml image/svg+xml font/ttf font/otf;

    # If the brotli module is installed, uncomment:
    # brotli on;
    # brotli_comp_level 5;
    # brotli_types text/plain text/css application/javascript application/json image/svg+xml font/ttf font/otf;

    # ── Static SPA root ──────────────────────────────────────────────────────
    root /opt/karijeeva/frontend/build;
    index index.html;

    client_max_body_size 10M;

    # ── Reverse-proxy /api/* to FastAPI ─────────────────────────────────────
    location /api/ {
        proxy_pass         http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Connection        "";
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        proxy_buffering    off;
    }

    # ── Long-cache hashed static assets ──────────────────────────────────────
    location ~* \.(?:css|js|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|ico)$ {
        expires 30d;
        access_log off;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # ── HTML — never cache, always revalidate ────────────────────────────────
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # ── SPA fallback — every unknown route serves index.html ────────────────
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ── Hide hidden files ────────────────────────────────────────────────────
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

Enable, test, reload:

```bash
sudo ln -s /etc/nginx/sites-available/karijeeva.conf /etc/nginx/sites-enabled/karijeeva.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

> ⚠️ The first `nginx -t` will fail because the TLS cert files do not exist yet. That's OK — finish §10 first, then come back.

**Workaround for the first run:** temporarily comment out the `listen 443 ssl` server block, run `nginx -t && systemctl reload nginx`, run certbot, then uncomment and reload again. Certbot's `--nginx` flag will actually do this for you automatically (next section).

---

## 10. TLS with Let's Encrypt

Certbot will obtain the cert, edit your Nginx config to point at the right paths, and set up an auto-renew timer.

```bash
sudo certbot --nginx \
  -d your-domain.com \
  -d www.your-domain.com \
  --agree-tos \
  --no-eff-email \
  -m you@your-domain.com \
  --redirect
```

Confirm the auto-renewal timer is active:

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

Reload nginx after any cert change:

```bash
sudo systemctl reload nginx
```

---

## 11. Razorpay production wiring

### 11.1 Switch `.env` to LIVE keys

In `/opt/karijeeva/backend/.env`:

```env
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 11.2 Configure the webhook in the Razorpay Dashboard

1. Razorpay Dashboard → **Settings** → **Webhooks** → **Add new webhook**.
2. **URL:** `https://your-domain.com/api/payments/webhook`
3. **Secret:** generate a strong random string (e.g. `openssl rand -hex 32`) and paste it both into the dashboard form **and** into `RAZORPAY_WEBHOOK_SECRET` in `backend/.env`.
4. **Active events:** subscribe to
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
   - `refund.failed`
5. **Save.**

### 11.3 Restart and verify

```bash
sudo supervisorctl restart karijeeva-backend
# OR if you used systemd:
# sudo systemctl restart karijeeva-backend

curl -s https://your-domain.com/api/health
```

Do **one ₹1 live transaction** end-to-end with a real card or UPI ID:
- Open `https://your-domain.com/razorpay-poc`, pay ₹1, confirm the success screen.
- In Razorpay Dashboard → Payments, confirm the payment is captured.
- In Razorpay Dashboard → Webhooks → Recent Deliveries, confirm `payment.captured` returned **HTTP 200** from your server.
- In MongoDB, confirm a document landed in `razorpay_webhook_events` and the order in `payment_orders` (POC) or `orders` flipped to `paid`.

---

## 12. Admin account rotation

The seeded admin is `admin@karijeeva.in / KarijeevaAdmin@2025`. **Rotate it immediately.**

### 12.1 Self-hosted Mongo path

```bash
cd /opt/karijeeva/backend
source venv/bin/activate

python - <<'PY'
import bcrypt, asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv()

NEW_PASSWORD = "PASTE-A-VERY-STRONG-PASSWORD-HERE"

async def run():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    pw_hash = bcrypt.hashpw(NEW_PASSWORD.encode(), bcrypt.gensalt(12)).decode()
    res = await db.users.update_one(
        {"email": "admin@karijeeva.in"},
        {"$set": {"password_hash": pw_hash}},
    )
    print("matched:", res.matched_count, "modified:", res.modified_count)

asyncio.run(run())
PY

deactivate
```

### 12.2 Atlas path

Identical command — just make sure `MONGO_URL` in `backend/.env` is the Atlas SRV string and that the VPS IP is in the Atlas IP allow-list.

### 12.3 Confirm the new password works

```
curl -s -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@karijeeva.in","password":"PASTE-A-VERY-STRONG-PASSWORD-HERE"}'
```

You should get a JSON response with the user object and a `Set-Cookie` for the session. Then log into `/admin` from a browser and verify the dashboard loads.

> ⚠️ If you ever lose the admin password, repeat §12 — there is no UI password reset for admin in the MVP.

---

## 13. Observability & maintenance

### 13.1 Where the logs live

| Source | Path / collection |
|---|---|
| Nginx access | `/var/log/nginx/access.log` |
| Nginx error | `/var/log/nginx/error.log` |
| Backend stdout | `/var/log/supervisor/karijeeva-backend.out.log` (or `/var/log/karijeeva/backend.out.log` for systemd) |
| Backend stderr | `/var/log/supervisor/karijeeva-backend.err.log` |
| React render crashes | MongoDB collection `client_errors` (capped at 1000) |
| Admin mutations | MongoDB collection `admin_audit_logs` |
| Razorpay tampered signatures | MongoDB collection `payment_attempts` |
| Razorpay webhook events | MongoDB collection `razorpay_webhook_events` |

### 13.2 logrotate for supervisor logs

Supervisor itself rotates within the file size cap above, but you can also add:

`/etc/logrotate.d/karijeeva`:

```
/var/log/supervisor/karijeeva-backend.*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
```

### 13.3 Uptime monitoring

Use **UptimeRobot** (free tier, 5-minute interval) or **Better Stack** to ping `https://your-domain.com/api/health` and email/SMS on a non-200. Do not skip this — Razorpay webhooks fail silently if the backend is down.

A poor-man's alternative is a cron on a second machine:

```bash
*/5 * * * * curl -fsS https://your-domain.com/api/health > /dev/null || \
  echo "Karijeeva down at $(date)" | mail -s "ALERT" you@your-domain.com
```

### 13.4 MongoDB backups

#### Self-hosted

`/etc/cron.daily/karijeeva-mongo-backup`:

```bash
#!/bin/bash
set -euo pipefail
TS=$(date +%F-%H%M)
DEST=/var/backups/mongo
mkdir -p "$DEST"
mongodump \
  --uri="mongodb://karijeeva_app:STRONG_DB_PASSWORD@127.0.0.1:27017/karijeeva?authSource=karijeeva" \
  --gzip --archive="$DEST/karijeeva-$TS.gz"
# 7-day rotation
find "$DEST" -name 'karijeeva-*.gz' -mtime +7 -delete
# Optional: copy off-box
# rclone copy "$DEST/karijeeva-$TS.gz" b2:karijeeva-backups/
```

```bash
sudo chmod +x /etc/cron.daily/karijeeva-mongo-backup
sudo /etc/cron.daily/karijeeva-mongo-backup
ls -lh /var/backups/mongo/
```

#### Atlas

Atlas → Cluster → **Backup → Cloud Backup**. Enable **Continuous Cloud Backup** for point-in-time recovery, and define a **Snapshot Schedule** (default 6 hourly + 7 daily + 4 weekly + 12 monthly is appropriate for a launch). Test a restore into a separate cluster every quarter.

### 13.5 OS update cadence

`unattended-upgrades` (§3.5) will keep security patches current automatically. Schedule a **manual reboot every 30 days** to pick up kernel updates:

```bash
sudo apt update && sudo apt -y upgrade
sudo reboot
```

---

## 14. Zero-downtime deploy workflow

Subsequent updates after go-live:

```bash
cd /opt/karijeeva
git pull --ff-only

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
sudo supervisorctl restart karijeeva-backend
# (or: sudo systemctl restart karijeeva-backend)

# Frontend
cd ../frontend
yarn install --frozen-lockfile
yarn build

# Nginx serves the new build instantly. Reload only if config changed.
sudo nginx -t && sudo nginx -s reload
```

### 14.1 Optional deploy script

`/opt/karijeeva/scripts/deploy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/karijeeva
git pull --ff-only

cd backend
./venv/bin/pip install -r requirements.txt --quiet

cd ../frontend
yarn install --frozen-lockfile --silent
yarn build --silent

sudo supervisorctl restart karijeeva-backend
sudo nginx -t && sudo nginx -s reload
echo "Karijeeva deploy complete at $(date -Iseconds)"
```

```bash
chmod +x /opt/karijeeva/scripts/deploy.sh
```

> ⚠️ The frontend build takes 30–90 seconds. During that window the **old** build is still being served. As soon as `yarn build` writes the new `index.html`, the next request gets the new bundle. There is no Nginx reload required for code-only frontend changes.

---

## 15. Smoke tests after deploy

Run these in order. Any failure → **stop, investigate, do not declare go-live**.

### 15.1 HTTPS + security headers (SPA)

```bash
curl -I https://your-domain.com | grep -iE 'strict|frame|content-type|referrer|permissions|content-security'
```

Expect to see all six `add_header` values from §9.

### 15.2 API health

```bash
curl -s https://your-domain.com/api/health
# → {"status":"ok"}
```

### 15.3 Static asset cache headers

Pick any hashed asset out of `frontend/build/static/` and:

```bash
curl -I https://your-domain.com/static/js/main.<hash>.js | grep -i cache-control
# → Cache-Control: public, immutable
```

### 15.4 Storefront renders

```bash
curl -s https://your-domain.com/ | grep -o '<title>[^<]*</title>'
```

### 15.5 PDP API

```bash
curl -s https://your-domain.com/api/products/virgin-cold-pressed-coconut-oil \
  | python3 -c "import sys,json; p=json.load(sys.stdin); print(p['name'], p['avg_rating'], p['review_count'])"
```

### 15.6 Browser walk-through

In a real browser:

1. Open `https://your-domain.com/` — confirm the 6-beat GSAP scroll film plays, the navbar turns to a parchment bar on scroll.
2. Open `/products`, click into a product, switch variants, **Add to cart**.
3. Open the cart drawer, click **Checkout**, fill an address, pincode auto-fills.
4. Reach the Razorpay modal — close it (don't pay yet).
5. Open `/admin`, log in with the **rotated** admin password, confirm the dashboard renders.

### 15.7 One ₹1 live Razorpay transaction

Place a real ₹1 order (yourself), pay with a real card or UPI. Confirm:
- Order status flips to `paid` in `/admin/orders`.
- Razorpay Dashboard → Payments shows the captured payment.
- Razorpay Dashboard → Webhooks shows a `payment.captured` delivery returning **HTTP 200**.

You're live.

---

## 16. Troubleshooting cheat sheet

| Symptom | Likely cause | Fix |
|---|---|---|
| **502 Bad Gateway** on `/api/*` | Backend not running or crashed | `sudo supervisorctl status karijeeva-backend`; tail `/var/log/supervisor/karijeeva-backend.err.log`; usually a missing env var or failed Mongo connection. |
| **CORS error** in browser console | `CORS_ORIGINS` does not include your origin | Add the origin (with scheme, no trailing slash) to `CORS_ORIGINS`, restart backend. |
| **Razorpay webhook returns 400 "invalid signature"** | `RAZORPAY_WEBHOOK_SECRET` mismatch, or server clock drift | Re-paste the secret from the Razorpay dashboard; confirm `chronyc tracking` shows offset < 1s. |
| **MongoDB connection error** at startup | Atlas IP allow-list blocks the VPS, or self-hosted auth string wrong | Atlas → Network Access; or `mongosh "$MONGO_URL"` to debug locally. |
| **Certificate fails to renew** | Nginx not reloading, or port 80 blocked | `sudo certbot renew --dry-run`; ensure `ufw allow 80` is in place. |
| **`/products/anything-here` returns 404 on browser refresh** | Nginx missing SPA fallback | Confirm `try_files $uri $uri/ /index.html;` is in the `location /` block. |
| **CSP blocks Razorpay or Google Fonts** | Edge CSP and `<meta>` CSP disagree | Make the Nginx `Content-Security-Policy` exactly match the policy in `/opt/karijeeva/frontend/public/index.html`. |
| **SPA loads but shows white screen, console: chunk load failed** | Stale `index.html` cached at the edge while the static chunks already rotated | Set `Cache-Control: no-store` on `index.html` (already in §9 config); clear CDN cache for `/index.html`. |
| **Admin login returns 429** | Brute-force limiter tripped | Wait 60 s; or restart backend to flush the in-memory rate limiter. |
| **`yarn build` runs out of memory** | Tiny VPS (1 GB) | `NODE_OPTIONS=--max_old_space_size=2048 yarn build` — or build on a beefier box and `rsync` the `build/` dir. |
| **Mongo seeding errors "duplicate key"** | Seed already ran | The seed is idempotent — it's safe to re-run; ignore duplicate-key warnings from `insert_one` on existing rows. |
| **Razorpay test cards work in dev but fail on live** | You're still using `rzp_test_*` keys in production `.env` | Swap to `rzp_live_*` keys; restart backend. |

---

## 17. Security hygiene checklist

Tick all of these before you tell stakeholders the site is live:

- [ ] SSH password authentication disabled, root login disabled, key-only.
- [ ] `ufw` enabled with only ports 22/80/443 open.
- [ ] `fail2ban` running with the sshd jail active.
- [ ] `unattended-upgrades` enabled.
- [ ] Timezone set to `Asia/Kolkata`, `chrony` running, clock drift < 1s.
- [ ] TLS 1.2+ only, A+ on `ssllabs.com/ssltest`.
- [ ] HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP headers all visible on `curl -I https://your-domain.com`.
- [ ] `JWT_SECRET` is freshly generated 64-byte hex (not the dev default).
- [ ] MongoDB has authentication enabled (self-hosted) or strict IP allow-list (Atlas).
- [ ] Admin password rotated (§12) — no `KarijeevaAdmin@2025` left anywhere.
- [ ] `RAZORPAY_KEY_ID` is `rzp_live_*` (not test).
- [ ] Razorpay webhook secret set, webhook URL configured, deliveries returning 200.
- [ ] Backups taking nightly (self-hosted) or Continuous Cloud Backup on (Atlas), and one restore drill executed.
- [ ] Uptime monitor pinging `/api/health` every 5 min with on-call alerts.
- [ ] Logrotate active for supervisor logs.
- [ ] One ₹1 live transaction completed end-to-end.

---

## 18. Appendix — env-var reference

### 18.1 Backend (`/opt/karijeeva/backend/.env`)

| Key | Required? | Example | Notes |
|---|---|---|---|
| `MONGO_URL` | yes | `mongodb://karijeeva_app:pwd@127.0.0.1:27017/karijeeva?authSource=karijeeva` | Self-hosted form. Atlas users paste the SRV URI here. |
| `DB_NAME` | yes | `karijeeva` | Must match the database segment in `MONGO_URL`. |
| `JWT_SECRET` | yes | `<64-byte hex from secrets.token_hex(64)>` | HMAC secret for signing session tokens. Rotating invalidates all sessions. |
| `JWT_TTL_DAYS` | no (default `7`) | `7` | Session lifetime. |
| `RAZORPAY_KEY_ID` | yes | `rzp_live_XXXXXXXXXXXXXX` | Razorpay public API key. Use `rzp_test_*` for staging. |
| `RAZORPAY_KEY_SECRET` | yes | `XXXXXXXXXXXXXXXXXXXXXXXXXXXX` | Razorpay private API key. **Never expose to frontend.** |
| `RAZORPAY_WEBHOOK_SECRET` | yes (for webhooks) | `XXXXXXXXXXXXXXXXXXXXXXXXXX` | Verifies `X-Razorpay-Signature` on `/api/payments/webhook`. |
| `SITE_PUBLIC_URL` | yes | `https://your-domain.com` | Used in absolute URLs (sitemap, invoices, OAuth-style redirects). Default `http://localhost:3000`. |
| `CORS_ORIGINS` | yes | `https://your-domain.com,https://www.your-domain.com` | Comma-separated; default `*`. **Tighten in production.** |

### 18.2 Frontend (`/opt/karijeeva/frontend/.env`)

| Key | Required? | Example | Notes |
|---|---|---|---|
| `REACT_APP_BACKEND_URL` | yes | `https://your-domain.com` | Same origin as the SPA — Nginx reverse-proxies `/api`. **No port, no `/api` suffix.** Baked into the bundle at build time. |

### 18.3 Variables you should **not** see in production

- `WDS_SOCKET_PORT` — only meaningful for the CRA dev server.
- `ENABLE_HEALTH_CHECK` — dev-environment flag, ignored by the production build.

---

*Document version 1.0 — Phase 8.1 deployment handoff, February 2026. Owner: DevOps. Reviewers: Engineering, Security.*
