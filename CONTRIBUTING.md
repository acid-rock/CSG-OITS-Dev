# Contributing to CSG-OITS

This document is mandatory reading before writing any code for this project.
Future developers who skip this document will introduce bugs that have already
been fixed and architectural violations that are difficult to reverse.

---

## Project overview

CSG-OITS is the Online Information Transparency System for the Central Student
Government of Cavite State University – Imus Campus. It serves two audiences:

- **Students (public):** Read-only access to announcements, documents, events,
  officers, committees, organizations, and equipment borrowing
- **CSG admins:** Authenticated access to create, manage, archive, and delete
  all content through a protected admin panel

The codebase has two separate applications:

- `frontend/` — React 19 + TypeScript + Vite
- `backend/` — Node.js ESM + Express 5

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5, Vite 7, React Router DOM 7, Axios |
| Backend | Node.js (ESM), Express 5, express-async-handler |
| Database | Supabase (PostgreSQL + Row-Level Security) |
| Auth | Supabase Auth (JWT, httpOnly cookies) |
| Storage | Supabase Storage (buckets: bulletin, documents, thumbnails, events, officers, organizations) |
| Design tokens | `frontend/src/styles/tokens.css` |

---

## Critical rules — violations will be rejected in review

### Backend

**Rule B1 — ESM only. Never use require().**

```js
// ✅ Correct
import express from 'express';
import ApiError from '../lib/apiError.js';

// ❌ Wrong — will fail at runtime in ESM context
const express = require('express');
```

**Rule B2 — Always import ApiError and use it for operational errors.**

```js
// ✅ Correct
import ApiError from '../lib/apiError.js';
if (!id) throw new ApiError(400, 'ID is required');

// ❌ Wrong — untyped errors bypass the global error handler
throw new Error('ID is required');
```

**Rule B3 — Supabase client selection is not optional.**

| Client | Use for |
|---|---|
| `anonSupabase` | Public GET routes — subject to RLS |
| `supabase` | Service key — admin writes, auth.admin calls, whitelist, officer archive, storage ops |
| `createUserClient(token)` | User-scoped writes subject to RLS |

Never use `anonSupabase` for writes. Never use `createUserClient` for whitelist
or archive operations. Never use the service key on public read routes unless
explicitly justified with a comment.

**Rule B4 — requireAuth on every write endpoint.**

```js
// ✅ Correct
router.post('/add', requireAuth, async (req, res) => { ... });
router.delete('/delete', requireAuth, async (req, res) => { ... });

// ❌ Wrong — anyone on the internet can call this
router.post('/add', async (req, res) => { ... });
```

**Rule B5 — parseInt() for ALL committee ID operations.**

`committees.id` is an INTEGER column (not UUID). Supabase will silently
return wrong results if you pass a string where an integer is expected.

```js
// ✅ Correct
const id = parseInt(req.body.id, 10);
await supabase.from('committees').select('*').eq('id', id);

// ❌ Wrong — string comparison against integer column
await supabase.from('committees').select('*').eq('id', req.body.id);
```

**Rule B6 — Cache invalidation after writes.**

Officers, committees, equipment, and dashboard data are cached in memory
via `backend/src/lib/cache.js`. Any endpoint that modifies these resources
MUST call `invalidateCachePrefix('resource:')` after a successful write.

```js
import { invalidateCachePrefix } from '../lib/cache.js';

// After successful officer edit:
invalidateCachePrefix('officers:');
```

### Frontend

**Rule F1 — Never use window.location.reload().**

After any create/update/delete operation, update the local React state array
directly. Do not reload the page.

```tsx
// ✅ Correct
setAnnouncements(prev => prev.filter(a => a.id !== deletedId));

// ❌ Wrong — causes full page reload, loses state, triggers all API calls again
window.location.reload();
```

**Rule F2 — Never hardcode hex colors.**

All colors MUST come from CSS token variables defined in
`frontend/src/styles/tokens.css`.

```tsx
// ✅ Correct
style={{ color: 'var(--color-primary)' }}

// ❌ Wrong — bypasses the design system, breaks dark mode if ever added
style={{ color: '#4F6EF7' }}
```

**Rule F3 — Never use the `any` TypeScript type.**

Define a proper interface for every API response and component prop.

```tsx
// ✅ Correct
interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  category: string;
  is_pinned: boolean;
}

// ❌ Wrong — defeats TypeScript entirely
const [announcements, setAnnouncements] = useState<any[]>([]);
```

**Rule F4 — Delete behavior has three distinct tiers.**

| Action | What it does | Database change | Reversible? |
|---|---|---|---|
| Archive | Permanent historical record | `is_archived = true` | Yes — restore to active |
| Move to Bin | Pending deletion | `deleted_at = now()` | Yes — restore from bin |
| Delete permanently | Unrecoverable removal | Hard DELETE | No |

Archive ≠ Bin. Never set `deleted_at` when archiving. Never set `is_archived`
when moving to bin. Permanent delete is only available from the Bin view after
a confirmation modal.

**Rule F5 — Do not modify approved page designs.**

These public-facing pages have been approved and must not be visually changed
without explicit sign-off from Harold:

- `/announcements` (bulletin page)
- `/documents` page

Any PR that modifies these files must include a screenshot comparison and
explicit approval from the project lead in the PR description.

---

## Database conventions

### Soft delete vs archive vs hard delete

```sql
-- Soft delete (move to bin) — recoverable for ~30 days
UPDATE bulletin SET deleted_at = NOW() WHERE id = $1;

-- Archive (permanent record) — never auto-purged
UPDATE bulletin SET is_archived = true WHERE id = $1;

-- Active list query — ALWAYS filter both conditions
SELECT * FROM bulletin
  WHERE is_archived = false AND deleted_at IS NULL;

-- Archived list query
SELECT * FROM bulletin WHERE is_archived = true;

-- Bin query
SELECT * FROM bulletin WHERE deleted_at IS NOT NULL;
```

### Adding new columns

Any new column must have:

1. A migration SQL block in the PR description
2. A DEFAULT value specified so existing rows aren't broken
3. A note in the relevant ADR if the column changes an architectural pattern

### Primary key types

- All tables use `uuid` primary keys EXCEPT `committees`, which uses `INTEGER`
  (auto-increment sequence). This is intentional — see `docs/decisions/004`.
- Always `parseInt()` before querying committees by ID.

### Row-Level Security

RLS is enabled on all tables. `anonSupabase` (anon key) is subject to RLS.
`supabase` (service key) bypasses RLS. Do not use the service key on public
read routes without a documented reason.

---

## API conventions

**Base path:** `/api/v1`
**Rate limits:** 100 req/15min (public), 500 req/15min (admin routes)

**Route naming:**

```
GET    /api/v1/{resource}/           — list all active
GET    /api/v1/{resource}/archived   — list archived
POST   /api/v1/{resource}/add        — create
POST   /api/v1/{resource}/edit       — update
POST   /api/v1/{resource}/archive    — soft archive
POST   /api/v1/{resource}/restore    — restore from archive
POST   /api/v1/{resource}/bin        — move to bin
DELETE /api/v1/{resource}/delete     — hard delete
```

Never change existing endpoint paths — the frontend has hardcoded axios calls
to these paths in the config/ directory.

New endpoints MUST be added to the API endpoint table in this file
(see Appendix A below).

---

## Environment variables

Two `.env.example` files exist. Copy and fill them before running locally.

**Backend** (`backend/.env`):

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
SUPABASE_JWT_SECRET=
PDF_REDACT_URL=
FRONTEND_URL=http://localhost:5173
PORT=3000
```

**Frontend** (`frontend/.env`):

```
VITE_API_URL=https://localhost:3000/api/v1
```

Note: Local development requires HTTPS for cookie auth to work. Use mkcert
to generate a local certificate. See setup instructions in the README.

---

## Design system

All visual styling must use token variables from `frontend/src/styles/tokens.css`.

Key tokens:

```css
--color-primary: #4F6EF7
--color-primary-dark: #3D5CE8
--color-background: #F8F9FF
--color-surface: #FFFFFF
--color-footer-bg: #2D3A6B
--color-text-primary: #0D1117
--color-text-muted: #6B7280
--color-success: #16A34A
--color-danger: #DC2626
--font-family-base: Inter, system-ui
--font-family-italic-accent: Georgia, Times New Roman, serif
```

---

## Running the project locally

```bash
# Backend
cd backend
cp .env.example .env  # fill in values
npm install
npm run dev           # starts on https://localhost:3000

# Frontend
cd frontend
cp .env.example .env  # fill in VITE_API_URL
npm install
npm run dev           # starts on http://localhost:5173
```

---

## Appendix A — API endpoint map

See `docs/api-endpoints.md` for the full endpoint reference.
Update it whenever you add a new route.

---

## Appendix B — Architecture Decision Records

See `docs/decisions/` for the reasoning behind major architectural choices.
Read the relevant ADRs before modifying the systems they describe.
