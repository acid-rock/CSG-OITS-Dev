# System Architecture

## Overview

CSG-OITS is a two-application system: a React SPA (frontend) communicates with an Express REST API (backend) over HTTPS. The backend stores all content in Supabase (PostgreSQL), authenticates users through Supabase Auth, and persists files in Supabase Storage buckets. An in-memory TTL cache on the backend reduces repetitive database reads for frequently-requested resources. A separate Python microservice handles PDF redaction before documents are stored.

---

## Architecture diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser                               │
│   React 19 SPA (Vite 7)                                      │
│   • Public pages — no auth required                          │
│   • Admin panel — protected by httpOnly cookie               │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS + Axios (withCredentials)
                            │ credentials: httpOnly cookies
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              Express 5 Backend (Node.js ESM)                 │
│   • Helmet CSP + CORS + Morgan + rate limiters               │
│   • requireAuth — JWT verification from sb_access_token      │
│   • validate(schema) — Zod request validation                │
│   • auditLogger — fire-and-forget audit log writes           │
│   • In-memory cache (officers, committees, dashboard)        │
│   Routes: /api/v1/{announcements, documents, events,         │
│     officers, committees, organizations, equipment,          │
│     dashboard, settings, analytics, auditlog, borrowing,     │
│     changelog, user}                                         │
└──────────────┬───────────────────────────┬───────────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────┐  ┌────────────────────────────────┐
│         Supabase          │  │   PDF Redaction Microservice   │
│  PostgreSQL (10 tables)   │  │   (Python — PDF_REDACT_URL)    │
│  Supabase Auth (JWT)      │  │   POST /api/v1/redact          │
│  Storage (7 buckets)      │  │   POST /api/v1/thumbnail/create│
│  RLS on all tables        │  └────────────────────────────────┘
└──────────────────────────┘
```

---

## Request flow — public page load

When a student opens the homepage, Root-layout.tsx drives a parallel data fetch before any child route renders:

1. Browser loads `https://<frontend>/` — React Router renders `<RootLayout>`.
2. `Root-layout.tsx` fires `Promise.allSettled([...])` with six parallel requests:
   - `GET /api/v1/settings/term` — active academic term
   - `GET /api/v1/announcements/` — bulletin entries
   - `GET /api/v1/documents/` — public documents
   - `GET /api/v1/events/` — events
   - `GET /api/v1/officers/` — officer roster (optionally filtered by term)
   - `GET /api/v1/organizations/` — student organizations
3. Express applies the `publicLimiter` (100 req/15 min) to each route.
4. Route handlers query Supabase with `anonSupabase` (RLS enforced). Officers and committees responses may be served from the in-memory cache.
5. Supabase generates signed/public URLs for storage assets and returns them in the query result.
6. `Root-layout.tsx` collects results; partial failures are tolerated (settled, not thrown).
7. Resolved data is passed via React Router's `<Outlet context={...}>` to every child route.
8. Child routes consume data with `useOutletContext<OutletContextType>()` — no additional fetches.

---

## Request flow — admin write operation

When an admin submits a form (e.g., "Add Announcement"):

1. Admin fills `Form.tsx` and clicks Save.
2. `Form.tsx` builds a `FormData` payload and calls `axios.post('/api/v1/announcements/add', formData, { withCredentials: true })`.
3. The browser attaches the `sb_access_token` httpOnly cookie automatically (same-domain request).
4. Express routes the request through:
   - `adminLimiter` (500 req/15 min)
   - `requireAuth` — verifies JWT from cookie; refreshes token if expired
   - `validate(addAnnouncementSchema)` — Zod validates body fields
   - `auditLogger` — queues an audit log INSERT
5. Route handler runs the operation:
   - If file upload: Multer parses the file into `req.file` (memory storage)
   - `validateImageUpload(req.file)` — checks MIME type and size
   - Supabase storage upload via `supabase` service client
   - `supabase.from('bulletin').insert(...)` via service client
6. Cache invalidation: `invalidateCachePrefix('officers:')` (or equivalent for the resource)
7. Backend returns `{ message: 'Created', data: {...} }` — status 201.
8. Frontend panel calls `onSuccess()` → `fetchData()` re-fetches the list.

---

## Request flow — admin authentication

1. Admin submits email + password in `Login.tsx`.
2. `axios.post('/api/v1/user/login', { email, password }, { withCredentials: true })`
3. Backend calls `supabase.auth.signInWithPassword({ email, password })`.
4. On success, backend sets two httpOnly cookies:
   - `sb_access_token` (JWT, 1-hour TTL)
   - `sb_refresh_token` (7-day TTL)
5. Backend returns `{ message: 'Login successful' }`.
6. Frontend sets `localStorage.setItem('admin_authenticated', '1')` (UI flag only).
7. React Router navigates to `/admin`.
8. Subsequent requests include cookies automatically (`withCredentials: true`).
9. `requireAuth` verifies the JWT on every protected endpoint. If the access token is expired but a valid refresh token exists, it calls `supabase.auth.refreshSession()` and sets new cookies in the same response.

---

## Outlet context data flow

```
Root-layout.tsx
  │
  ├── Promise.allSettled([
  │     fetchSettings,          → activeTerm
  │     fetchBulletinData,      → bulletin[]
  │     fetchDocuments,         → documents[]
  │     fetchEvents,            → events[]
  │     fetchOfficers(term),    → officers[]
  │     fetchOrganizations,     → organizations[]
  │   ])
  │
  └── <Outlet context={{
          bulletin,
          documents,
          events,
          officers,
          organizations
        }} />
           │
           ├── App.tsx (homepage)          → useOutletContext()
           ├── Bulletin.tsx                → useOutletContext().bulletin
           ├── Documents.tsx               → useOutletContext().documents
           ├── Events.tsx                  → useOutletContext().events
           ├── Officers.tsx                → useOutletContext().officers
           └── AboutPage.tsx              → useOutletContext().officers, .documents, .organizations
```

Child routes that need additional data (e.g., Officers.tsx fetching committees) make their own direct API calls inside `useEffect`.

---

## Rate limiting strategy

Defined in `backend/src/app.js`. Two limiters with the same 15-minute window:

| Limiter | Max requests | Applied to |
|---|---|---|
| `publicLimiter` | 100 / 15 min | `announcements`, `documents`, `events`, `officers`, `committees`, `equipment`, `changelog`, `organizations` |
| `adminLimiter` | 500 / 15 min | `user`, `dashboard`, `settings`, `analytics`, `auditlog`, `borrowing` |

The higher admin limit accommodates the dashboard's multi-chart fetches and bulk content operations. Both limiters use standard headers (`RateLimit-*`) and return `{ error: "Too many requests. Please try again later." }` on breach.

---

## Caching layer

The in-memory cache in `backend/src/lib/cache.js` is a simple `Map` with TTL timestamps. It is per-process (not shared across horizontally-scaled instances).

| Cache key | TTL | Invalidated by |
|---|---|---|
| `officers:active` | 60 s | Any write to officers table |
| `officers:archived` | 60 s | Any write to officers table |
| `committees:active` | 60 s | Any write to committees table |
| `committees:archived` | 60 s | Any write to committees table |
| `equipment:all` | 60 s | Any write to inventory table |
| `dashboard:summary` | 60 s | Self-expiring only |
| `dashboard:storage` | 300 s | Self-expiring only |

Cache functions:
```js
getCached(key)                  // returns value or null if expired
setCache(key, value, ttlMs)     // store with TTL
invalidateCache(key)            // delete one key
invalidateCachePrefix(prefix)   // delete all keys starting with prefix
```

---

## External dependencies

| Service | Purpose | Config |
|---|---|---|
| Supabase | PostgreSQL database, Auth (JWT), Storage buckets | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET` |
| PDF Redaction Microservice | Accepts PDF + bounding boxes → returns redacted PDF + thumbnail PNG | `PDF_REDACT_URL` |
| GitHub Releases API | Admin Settings changelog modal fetches release notes | `VITE_GITHUB_OWNER`, `VITE_GITHUB_REPO` (frontend env vars) |
| Google Fonts | Plus Jakarta Sans, Instrument Serif, JetBrains Mono — loaded in `index.css` | No config — CDN |
