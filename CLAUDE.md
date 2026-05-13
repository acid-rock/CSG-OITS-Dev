# CLAUDE.md — CSG-OITS Project Context for AI Assistants

This file is read automatically by Claude Code. Do not delete it.
It contains the authoritative context for all AI-assisted development on this project.

---

## Project identity

Name: CSG-OITS — Online Information Transparency System
Client: Central Student Government, Cavite State University – Imus Campus
Project lead: John Harold R. Magma (GAD Representative, 4th year CS)
Purpose: Public transparency site + protected admin panel for CSG content management

---

## Stack

Frontend: React 19.2.0, TypeScript 5, Vite 7, React Router DOM 7, Axios 1.13
Backend: Node.js ESM (never require()), Express 5.2
Database/Auth: Supabase (PostgreSQL + RLS + Auth + Storage)
Design tokens: frontend/src/styles/tokens.css

---

## Directory structure

```
backend/src/
  app.js                    — Express setup, middleware, rate limiters, route registration
  server.js                 — HTTP server entry point
  lib/apiError.js           — ApiError class — use for ALL operational errors
  lib/supabaseClient.js     — exports: anonSupabase, supabase (service key),
                              createUserClient(token)
  lib/cache.js              — in-memory TTL cache (getCached, setCache,
                              invalidateCache, invalidateCachePrefix)
  middlewares/auth.middleware.js  — requireAuth middleware
  middlewares/audit.middleware.js — audit logger
  routes/                   — one file per resource

frontend/src/
  styles/tokens.css         — design system tokens (ALWAYS use, never raw hex)
  main.tsx                  — router definition
  root-layout/Root-layout.tsx — fetches ALL public data via Promise.all,
                               passes via outlet context to all public pages
  route/                    — page-level route components
  layout/                   — homepage section layouts
  components/               — shared public UI components
  config/                   — axios fetch functions
  admin/                    — entire admin panel
```

---

## Supabase client rules — NEVER violate

```
anonSupabase            → public reads only (RLS enforced)
supabase                → service key: admin writes, auth.admin calls, whitelist,
                          officer archive, storage ops — bypasses RLS
createUserClient(token) → user JWT writes subject to RLS
```

NEVER use anonSupabase for writes.
NEVER use createUserClient for whitelist, archive, or storage operations.

---

## Database schema (current, including all migrations run to date)

```
bulletin: id(uuid), title, content, created_at, owner_id,
          is_pinned(bool DEFAULT false),
          is_archived(bool DEFAULT false),
          deleted_at(timestamptz),
          category(text DEFAULT 'CSG Updates'),
          term_year(text)

documents: id(uuid), file_path, description, created_at, owner_id,
           is_archived(bool DEFAULT false),
           deleted_at(timestamptz),
           term_year(text)

events: id(uuid), name, description, date_happened, created_at,
        ip_address, user_agent,
        is_archived(bool DEFAULT false),
        deleted_at(timestamptz),
        term_year(text)

officers: id(uuid), full_name, position, type(text), avatar, socials,
          year_serving, student_number,
          committee(INTEGER FK → committees.id),
          is_committee_official(bool),
          status('active'|'archived' DEFAULT 'active'),
          term_year(text),
          deleted_at(timestamptz)

committees: id(INTEGER — NOT uuid), name,
            status('active'|'archived' DEFAULT 'active'),
            deleted_at(timestamptz)

profiles: owner_id(uuid PRIMARY KEY — NO id column), role

equipment: id(uuid), name, quantity, max_quantity, is_available(bool),
           created_at

borrow_requests: (columns include requester name, student number,
                  student_email, equipment id, purpose, date needed)

organizations: id(uuid), name, description, logo_path, facebook_link,
               created_at, is_archived(bool DEFAULT false),
               deleted_at(timestamptz)

settings: key(text PRIMARY KEY), value(text)
  — current keys: 'active_term'

whitelist: (RLS protected — use service key for all operations)

Storage buckets: bulletin, documents, thumbnails, events, officers,
                 organizations
```

---

## CRITICAL data rules

- `committees.id` is INTEGER — always `parseInt()` before ANY Supabase query
- `officers.committee` is INTEGER FK — always `parseInt()` before queries
- `profiles` table has NO `id` column — primary key is `owner_id`
- Soft delete = set `deleted_at = new Date().toISOString()`
- Archive = set `is_archived = true` (`deleted_at` stays NULL)
- Hard delete = `.delete()` Supabase call — only from Bin view
- Active queries: `.eq('is_archived', false).is('deleted_at', null)`
- Archived queries: `.eq('is_archived', true).is('deleted_at', null)`
- Bin queries: `.not('deleted_at', 'is', null)`
- NEVER `window.location.reload()` — update local React state directly
- NEVER hardcode hex colors — use CSS token variables
- NEVER use TypeScript `any` type

---

## API structure

```
Base: /api/v1
Rate limits: publicLimiter 100/15min, adminLimiter 500/15min (split in app.js)

Standard route pattern per resource:
  GET    /api/v1/{resource}/           active list
  GET    /api/v1/{resource}/archived   archived list
  POST   /api/v1/{resource}/add        create (requireAuth)
  POST   /api/v1/{resource}/edit       update (requireAuth)
  POST   /api/v1/{resource}/archive    soft archive (requireAuth)
  POST   /api/v1/{resource}/restore    restore from archive (requireAuth)
  POST   /api/v1/{resource}/bin        move to bin (requireAuth)
  DELETE /api/v1/{resource}/delete     hard delete (requireAuth)

Special endpoints:
  GET  /api/v1/dashboard/summary   — aggregated counts (cached 60s, no auth)
  GET  /api/v1/dashboard/storage   — per-bucket storage stats (cached 5min, requireAuth)
  GET  /api/v1/officers/terms      — distinct term_year values
  GET  /api/v1/settings/:key       — read a setting
  POST /api/v1/settings/:key       — write a setting (requireAuth)
  GET  /api/v1/changelog           — serves CHANGELOG.md as plain text
```

---

## In-memory cache (backend/src/lib/cache.js)

```
Cached resources and their TTLs:
  officers:*         60s  — invalidate with invalidateCachePrefix('officers:')
  committees:*       60s  — invalidate with invalidateCachePrefix('committees:')
  equipment:all      60s  — invalidate with invalidateCache('equipment:all')
  dashboard:storage  300s — self-expiring only
  dashboard:summary  60s  — self-expiring only

ALL write endpoints for cached resources MUST call cache invalidation.
```

---

## Approved designs — DO NOT MODIFY

These public pages are finalized and must not be changed without Harold's approval:
- `/announcements` (bulletin page) — reference design for search bar layout
- `/documents` page

---

## Environment variables

```
Backend (.env):  SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY,
                 SUPABASE_JWT_SECRET, PDF_REDACT_URL, FRONTEND_URL, PORT
Frontend (.env): VITE_API_URL (e.g., https://localhost:3000/api/v1)
```

---

## Current completion status

```
Public frontend:  COMPLETE
Admin panel:      COMPLETE (functional)
Auth loop:        Implemented (login → session → protected routes)
Pending:          Supabase migrations not yet run in production database
                  (backend developer availability required)
```
