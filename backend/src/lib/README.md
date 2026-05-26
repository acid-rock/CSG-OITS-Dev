# backend/src/lib

Shared utility modules used by routes and middlewares throughout the backend.

## Overview

This directory contains the foundational building blocks of the backend: the three Supabase clients, the in-memory cache, the error class, HTML sanitization, and upload validation. Every file in `routes/` imports from here. Understand this directory before writing any route.

## THE THREE-CLIENT RULE — Read this first

The most critical rule in the entire backend. Violating it causes RLS bypasses or broken queries.

```
anonSupabase             → public reads only (RLS enforced)
supabase                 → service key: admin writes, auth.admin, storage ops — bypasses RLS
createUserClient(token)  → user-scoped JWT writes, subject to RLS

NEVER use anonSupabase for writes.
NEVER use createUserClient for whitelist, archive, or storage operations.
```

See ADR 001 (`docs/decisions/001-supabase-client-strategy.md`) for the full rationale.

## Contents

### `supabaseClient.js`

Exports three Supabase clients:

| Export | Key used | RLS | Use for |
|---|---|---|---|
| `anonSupabase` | Anon/public key | Enforced | `GET` routes serving public data |
| `supabase` | Service role key | Bypassed | Admin writes, `auth.admin` calls, whitelist, storage uploads/deletes |
| `createUserClient(token)` | User JWT (from `req.token`) | Enforced | User-attributed writes (e.g., `updateUser`) |

```js
import { anonSupabase, supabase, createUserClient } from '../lib/supabaseClient.js';

// Public read
const { data } = await anonSupabase.from('bulletin').select('*').eq('is_archived', false);

// Admin write
await supabase.from('bulletin').insert({ title, content, owner_id });

// User-scoped auth operation
const userClient = createUserClient(req.token);
await userClient.auth.updateUser({ password: newPassword });
```

### `apiError.js`

```js
export default class ApiError extends Error {
  constructor(status, message)
  // this.isOperational = true
  // this.status = status
}
```

**Always use `ApiError` for operational errors in route handlers.** This ensures the global error handler in `app.js` sends the correct HTTP status and message to the client. Throwing a plain `Error` bypasses this and returns a generic 500.

```js
import ApiError from '../lib/apiError.js';

if (!id) throw new ApiError(400, 'ID is required.');
if (!file) throw new ApiError(415, 'Image file is required.');
```

### `cache.js`

In-memory TTL cache using a JavaScript `Map`. Per-process — not shared across backend instances.

```js
import { getCached, setCache, invalidateCache, invalidateCachePrefix } from '../lib/cache.js';

// Read
const cached = getCached('officers:active');
if (cached) return res.json(cached);

// Write with TTL
setCache('officers:active', data, 60_000);  // 60 seconds

// Invalidate one key
invalidateCache('equipment:all');

// Invalidate a family (e.g., after any officer write)
invalidateCachePrefix('officers:');
```

**ALL write endpoints for cached resources must call invalidation** after a successful DB write. Cached resources: `officers:*` (60s), `committees:*` (60s), `equipment:all` (60s), `dashboard:summary` (60s), `dashboard:storage` (300s).

See ADR 005 (`docs/decisions/005-in-memory-cache.md`) for the rationale.

### `sanitize.js`

Exports `sanitizeContent(html)`. Uses `sanitize-html` with a strict allowlist to prevent stored XSS.

Allowed tags: `b`, `strong`, `i`, `em`, `u`, `a`, `br`, `p`
Allowed attributes: `href`, `target`, `rel` on `<a>` only
Allowed URL schemes: `http`, `https`, `mailto`
All `<a>` tags automatically receive `rel="noopener noreferrer"` and `target="_blank"`.

Apply to user-provided HTML before any database INSERT or UPDATE (announcement `content`, event `description`).

### `uploadValidation.js`

Two validation functions. Call after Multer, before any storage operation.

```js
import { validateImageUpload, validatePdfUpload } from '../lib/uploadValidation.js';

validateImageUpload(req.file);           // required by default
validateImageUpload(req.file, false);    // optional — no error if missing
validatePdfUpload(req.file);
```

| Function | Allowed types | Max size | Errors thrown |
|---|---|---|---|
| `validateImageUpload` | `image/jpeg`, `image/jpg`, `image/png`, `image/webp` | 5 MB | `ApiError(415, ...)`, `ApiError(413, ...)` |
| `validatePdfUpload` | `application/pdf` | 20 MB | `ApiError(415, ...)`, `ApiError(413, ...)` |

### `mailer.js` and `emailTemplates.js`

Nodemailer-based email utility for borrow request notifications. `emailTemplates.js` contains the HTML email templates. Used by `routes/borrowing.routes.js` when a request is submitted, approved, or rejected.

## Related

- [backend/src/middlewares/README.md](../middlewares/README.md) — `requireAuth`, `validate`, `auditLogger`
- [backend/src/routes/README.md](../routes/README.md) — route conventions
- [docs/decisions/001-supabase-client-strategy.md](../../../docs/decisions/001-supabase-client-strategy.md)
- [docs/decisions/005-in-memory-cache.md](../../../docs/decisions/005-in-memory-cache.md)
