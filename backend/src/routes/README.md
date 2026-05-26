# backend/src/routes

One route file per resource. All routes are mounted in `src/app.js` under `/api/v1/`.

## Overview

Each file exports a single Express Router. Routes follow a consistent naming pattern. All write endpoints require the `requireAuth` middleware. File uploads use Multer (memory storage). Zod validation is applied via `validate(schema)` from `schemas/index.js`.

## Files

| File | Mount path | Rate limiter | Description |
|---|---|---|---|
| `user.routes.js` | `/api/v1/user` | `adminLimiter` | Auth: login, logout, register, me, passwords, whitelist |
| `announcements.routes.js` | `/api/v1/announcements` | `publicLimiter` | Bulletin CRUD + pin + archive/bin lifecycle |
| `documents.routes.js` | `/api/v1/documents` | `publicLimiter` | PDF upload (via PDF microservice) + lifecycle |
| `events.routes.js` | `/api/v1/events` | `publicLimiter` | Events + up to 3 images per event + lifecycle |
| `officers.routes.js` | `/api/v1/officers` | `publicLimiter` | Officers CRUD + term filter + cache |
| `committee.routes.js` | `/api/v1/committees` | `publicLimiter` | Committees CRUD + INTEGER ID handling + cache |
| `organizations.routes.js` | `/api/v1/organizations` | `publicLimiter` | Organizations CRUD + logo upload + lifecycle |
| `equipment.routes.js` | `/api/v1/equipment` | `publicLimiter` | Read-only equipment list (cached) |
| `borrowing.routes.js` | `/api/v1/borrowing` | `adminLimiter` | Inventory CRUD + borrow request lifecycle |
| `dashboard.routes.js` | `/api/v1/dashboard` | `adminLimiter` | Summary stats (cached) + storage stats (cached) |
| `settings.routes.js` | `/api/v1/settings` | `adminLimiter` | Key-value settings read/write |
| `analytics.routes.js` | `/api/v1/analytics` | `adminLimiter` | Document upload charts (monthly + weekly) |
| `auditlog.routes.js` | `/api/v1/auditlog` | `adminLimiter` | Audit log read (with email resolution) |
| `changelog.routes.js` | `/api/v1/changelog` | `publicLimiter` | Serves CHANGELOG.md as plain text |

## Standard endpoint pattern

Most content resources follow this URL pattern:

```
GET    /api/v1/{resource}/             active list (no auth)
GET    /api/v1/{resource}/archived     archived list (requireAuth)
GET    /api/v1/{resource}/bin          bin list (requireAuth)
POST   /api/v1/{resource}/add          create (requireAuth)
POST   /api/v1/{resource}/edit         update (requireAuth)
POST   /api/v1/{resource}/archive      soft archive (requireAuth)
POST   /api/v1/{resource}/restore      restore from archive (requireAuth)
POST   /api/v1/{resource}/bin          move to bin (requireAuth)
POST   /api/v1/{resource}/restore-from-bin  restore from bin (requireAuth)
DELETE /api/v1/{resource}/delete       hard delete (requireAuth)
```

## Rules

1. **ESM only** — `import`/`export`, never `require()`. (CONTRIBUTING.md Rule B1)
2. **`requireAuth` on every write** — every POST/DELETE that modifies data. (Rule B4)
3. **Use `ApiError` for operational errors** — not plain `new Error()`. (Rule B2)
4. **Cache invalidation after writes** — call `invalidateCachePrefix('resource:')` after any write to a cached resource. (Rule B6)
5. **`parseInt()` for committee IDs** — `committees.id` is an INTEGER column. (Rule B5)
6. **Supabase client selection** — read the three-client rule in `lib/README.md`. (Rule B3)
7. **Add schema before route** — every new route that accepts a body needs a Zod schema in `schemas/index.js` first.

## Related

- [backend/src/lib/README.md](../lib/README.md) — Supabase clients, cache, error class
- [backend/src/middlewares/README.md](../middlewares/README.md) — requireAuth, validate, auditLogger
- [backend/src/schemas/README.md](../schemas/README.md) — all Zod schemas
- [docs/api-reference.md](../../../docs/api-reference.md) — full endpoint documentation
