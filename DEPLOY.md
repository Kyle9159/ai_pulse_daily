# AIPulse – Deployment Guide (Railway + GoDaddy)

## Overview

Deploy two Railway services:
1. **Backend** – FastAPI + Uvicorn
2. **Frontend** – Next.js (static export or Node server)

Plus a Railway-managed **PostgreSQL** database (or Supabase).

---

## Step 1 – Supabase Postgres (Recommended Free Tier)

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Copy the **Connection String** (Session mode, port 5432) from Settings → Database → URI.
3. You'll get two URLs:
   - **Async** (asyncpg): `postgresql+asyncpg://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
   - **Sync** (psycopg): `postgresql+psycopg://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres`

---

## Step 2 – xAI API Key

1. Visit [x.ai/api](https://x.ai/api) and sign in with your X (Twitter) account.
2. Navigate to **API Keys** → Create new key.
3. Current recommended model: **`grok-3-mini-fast`** (fast + cheap, great for JSON output)
   - For highest quality: **`grok-3`** (more expensive)
4. Copy the key — it starts with `xai-`.

---

## Step 3 – Railway Setup

### Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Create project

```bash
cd /path/to/ai_pulse
railway init   # creates a new Railway project
```

---

## Step 4 – Deploy Backend

```bash
cd backend
```

Create a `Procfile` (already included):
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Push to Railway:
```bash
railway up --service backend
```

Set environment variables in Railway dashboard → Backend service → Variables:
```
DATABASE_URL=postgresql+asyncpg://...    ← Supabase async URL
SYNC_DATABASE_URL=postgresql+psycopg://... ← Supabase sync URL
XAI_API_KEY=xai-...
ADMIN_PASSWORD=your_strong_password
FRONTEND_ORIGIN=https://your-frontend.up.railway.app
SCHEDULER_TIMEZONE=America/Boise
```

Run migrations via Railway shell:
```bash
railway run alembic upgrade head
```

---

## Step 5 – Deploy Frontend

```bash
cd frontend
```

Set environment variable:
```bash
railway variables --set "NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app"
```

Push:
```bash
railway up --service frontend
```

Railway auto-detects Next.js and runs `npm run build && npm start`.

---

## Step 6 – Custom Domain from GoDaddy

### In Railway:
1. Open Frontend service → Settings → Domains → **Add Custom Domain**.
2. Enter `aipulse.dev` (or your domain).
3. Railway shows you a CNAME target like: `your-app.up.railway.app`.

### In GoDaddy:
1. Go to **DNS** for your domain.
2. Add/edit **CNAME** record:
   - **Host**: `@` (or `www`)
   - **Points to**: `your-app.up.railway.app`
   - **TTL**: 600
3. For apex (`@`) domains, GoDaddy may require you to use **ALIAS/ANAME** or a redirect. Create a `www` CNAME pointing to Railway, then:
   - Settings → Forwarding → Forward `aipulse.dev` → `https://www.aipulse.dev` (301 Redirect)

SSL is automatic via Railway's TLS termination.

---

## Step 7 – Daily Cron (APScheduler)

The backend already runs APScheduler internally — no external cron needed. The daily job fires at **06:00 MT** and calls `run_refresh()`.

To verify it's running, check Railway logs:
```bash
railway logs --service backend
```

You should see:
```
APScheduler started – daily refresh at 06:00 America/Boise
```

If you prefer Railway's built-in cron (alternative):
1. Create a separate **Cron** service in Railway.
2. Command: `curl -X POST https://your-backend.up.railway.app/api/admin/refresh -H "x-admin-password: YOUR_PASSWORD"`
3. Schedule: `0 6 * * *` (6 AM daily UTC — adjust for timezone).

---

## Step 8 – One-click Deploy Buttons

After your initial deployment, Railway generates shareable deploy links.

In your Railway project → Settings → **Deploy Button** → copy the badge URL.

It will look like:
```
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/xxx)
```

---

## Environment Summary

| Service | Key Variables |
|---|---|
| Backend | `DATABASE_URL`, `SYNC_DATABASE_URL`, `XAI_API_KEY`, `ADMIN_PASSWORD`, `FRONTEND_ORIGIN` |
| Frontend | `NEXT_PUBLIC_API_URL` |

---

## Cost Estimate (Railway Hobby Plan – $5/month)

- Backend: ~$1–3/month (low traffic)
- Frontend: ~$1–3/month
- Supabase Free: 500 MB storage, 2 GB transfer/month (free)
- xAI API: ~$0.01–0.05 per post summarised (Grok-3-mini-fast)

Total approx: **$5–10/month** for a production deployment.
