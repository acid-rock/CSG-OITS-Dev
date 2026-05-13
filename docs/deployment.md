# Deployment Guide

---

## Recommended architecture

```
Students / Admins
       │
       ▼
 Cloudflare (DNS + DDoS + CDN)
       │
  ┌────┴────────────────────┐
  │                         │
  ▼                         ▼
Frontend                  Backend
(Vercel / Netlify /       (Railway / Render /
 Cloudflare Pages)         Fly.io / VPS)
  React SPA                 Express 5 (Node.js)
                                 │
                                 ▼
                          Supabase (PostgreSQL
                           + Auth + Storage)
                                 │
                          PDF Redaction Microservice
                          (separate Python service)
```

Cloudflare sits in front of both the frontend and backend to provide:
- DDoS protection
- CDN caching for the frontend SPA
- Automatic HTTPS
- Free tier is sufficient for this project's scale

---

## Environment variables for production

### Backend (production `.env`)

```env
# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_MANAGEMENT_TOKEN=sbp_...

# PDF Redaction microservice — deployed URL
PDF_REDACT_URL=https://your-redact-service.example.com

# Your actual frontend domain
FRONTEND_URL=https://oits.cvsu-imus-csg.ph

# Port (check your hosting platform's expected port)
PORT=3000

# Must be set for production error handling
NODE_ENV=production
```

**Production-specific notes:**
- `FRONTEND_URL` must match exactly — CORS blocks requests from any other origin
- `NODE_ENV=production` suppresses stack traces in error responses (security)
- `SUPABASE_SERVICE_KEY` — keep this secret; never expose in frontend code or git history
- `SUPABASE_MANAGEMENT_TOKEN` — needed for storage analytics endpoint

### Frontend (production `.env`)

```env
# Point to your production backend
VITE_API_URL=https://api.oits.cvsu-imus-csg.ph/api/v1

# For the Settings changelog modal
VITE_GITHUB_OWNER=your-github-org
VITE_GITHUB_REPO=CSG-OITS-Dev
```

---

## Step 1 — Set up Cloudflare

1. Create a Cloudflare account at [cloudflare.com](https://cloudflare.com).
2. Add your domain → Cloudflare will scan existing DNS records.
3. Change your domain registrar's nameservers to Cloudflare's.
4. Once active, all traffic passes through Cloudflare automatically.
5. Enable **Full (strict)** SSL mode so traffic is encrypted all the way to your server.
6. Enable **"Always Use HTTPS"** rule.

---

## Step 2 — Deploy the backend

The backend is a standard Node.js ESM Express app. Any Node.js hosting platform works.

### Option A — Railway (recommended)

1. Push code to GitHub.
2. Create a Railway project → Deploy from GitHub repo → select `backend/` as root.
3. Set all environment variables in Railway's variable panel.
4. Set start command: `node src/server.js`
5. Railway auto-deploys on every push to the connected branch.

### Option B — Render

1. New Web Service → connect GitHub → root directory: `backend`
2. Build command: `npm install`
3. Start command: `node src/server.js`
4. Set all environment variables.

### Option C — Fly.io

```bash
cd backend
fly launch
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_KEY=... # etc.
fly deploy
```

### After backend deployment

Verify the health check endpoint returns 200:
```
GET https://your-backend-url/health
```

---

## Step 3 — Deploy the frontend

The frontend is a Vite React SPA. It builds to a static `dist/` folder.

### Option A — Vercel (recommended)

1. Import GitHub repo on Vercel.
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `dist`.
5. Add environment variables: `VITE_API_URL`, `VITE_GITHUB_OWNER`, `VITE_GITHUB_REPO`.
6. Add a rewrite rule for React Router (SPA routing):
   - Source: `/(.*)`
   - Destination: `/index.html`

### Option B — Netlify

1. Connect GitHub repo.
2. Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `frontend/dist`
5. Add a `_redirects` file in `frontend/public/`:
   ```
   /*  /index.html  200
   ```

### Option C — Cloudflare Pages

1. Create Pages project → connect GitHub.
2. Framework: Vite
3. Build command: `npm run build`
4. Build output: `dist`
5. Add environment variables.

---

## Step 4 — Deploy the PDF Redaction Microservice

The redaction service is a Python application located at `frontend/src/admin/components/pdf-selector-components/main.py`. It should be moved to a standalone service directory before production deployment.

### What it does

- `POST /api/v1/redact` — accepts a PDF + bounding boxes, returns redacted PDF
- `POST /api/v1/thumbnail/create` — accepts a PDF, returns PNG thumbnail

### Deployment options

- **Railway Python** — deploy as a separate Railway service
- **Fly.io** — `fly launch` from the service directory
- **Any VPS** — run with `uvicorn` or `gunicorn` behind nginx

### What happens if the microservice is unavailable

`POST /api/v1/documents/add` will fail with a 500 error. Admins cannot upload documents until the microservice is reachable. Ensure the service is deployed before documents can be managed.

---

## Step 5 — Configure Supabase for production

In Supabase dashboard:

1. **Auth settings:**
   - Set **Site URL** to your production frontend URL (e.g., `https://oits.cvsu-imus-csg.ph`)
   - Add redirect URLs: `https://oits.cvsu-imus-csg.ph/admin/reset-password`
   - Enable email confirmation
   - Disable "Confirm email" only if you want instant access (not recommended)

2. **Storage bucket policies:**
   - Confirm all 7 buckets (`bulletin`, `documents`, `thumbnails`, `events`, `officers`, `organizations`, `equipment`) are **public read**
   - Write access should require the service role key (backend handles this)

3. **Run all migrations** (see `docs/local-setup.md` Step 5b for the full SQL)

4. **RLS:** Confirm RLS is enabled on all tables

---

## Pre-launch checklist

### Security

```
[ ] All migrations run in production Supabase
[ ] Supabase Auth configured (site URL, redirect URLs, email confirmation)
[ ] RLS enabled on all tables
[ ] All 7 storage buckets created and set to public
[ ] SUPABASE_SERVICE_KEY is not in any frontend code or git history
[ ] NODE_ENV=production set on backend server
[ ] CORS is restricted to the production frontend URL (FRONTEND_URL env var)
[ ] Cloudflare SSL is set to "Full (strict)"
```

### Performance

```
[ ] Backend rate limiters active (publicLimiter + adminLimiter)
[ ] In-memory cache active (verify with GET /api/v1/dashboard/summary twice)
[ ] Dashboard storage endpoint responds within 2 s
[ ] Cloudflare CDN caching the frontend SPA
```

### Functionality

```
[ ] GET /health returns 200
[ ] Admin login works end-to-end (cookies set, panel loads)
[ ] Announcements appear on public homepage
[ ] PDF upload + redaction succeeds
[ ] Images upload and appear correctly
[ ] Equipment borrow form submits successfully
[ ] Audit log captures admin actions
[ ] Settings → active term saves and filters officers
```

### Monitoring

```
[ ] Error alerts configured (Railway/Render/Fly.io have built-in alerting)
[ ] Supabase usage limits reviewed (free tier has 500 MB DB, 1 GB storage)
[ ] Log streaming configured to catch 500 errors
```
