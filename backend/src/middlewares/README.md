# backend/src/middlewares

Express middleware functions applied to routes throughout the backend.

## Overview

Three middleware files provide authentication, request validation, and audit logging. They are composed in route definitions in a consistent order: `requireAuth` → `validate(schema)` → `auditLogger(action)` → route handler.

## Contents

### `auth.middleware.js` — `requireAuth`

Verifies the `sb_access_token` httpOnly cookie on every protected endpoint. Handles transparent token refresh.

**Usage:**
```js
import { requireAuth } from '../middlewares/auth.middleware.js';

router.post('/add', requireAuth, validate(addAnnouncementSchema), handler);
router.delete('/delete', requireAuth, handler);
```

**Behavior:**
1. Reads `sb_access_token` and `sb_refresh_token` from `req.cookies`.
2. If neither present: returns `403 { message: "Not authenticated." }`.
3. Calls `jwt.verify(accessToken, SUPABASE_JWT_SECRET)`.
4. On success: sets `req.user = payload`, `req.token = accessToken`, calls `next()`.
5. On JWT error:
   - No refresh token → `401 { error: "Session expired" }`
   - Has refresh token → calls `supabase.auth.refreshSession()`; sets new cookies; calls `next()`
   - Refresh fails → `401 { error: "Session expired" }`

**`req.user` shape after auth:**
```js
// From JWT payload
{ sub: 'supabase-user-uuid', email: 'admin@cvsu.edu.ph', aud: 'authenticated', ... }

// After token refresh (full User object)
{ id: 'supabase-user-uuid', email: 'admin@cvsu.edu.ph', user_metadata: {...}, ... }
```

**`req.token`** is set to the raw access token string, used by `createUserClient(req.token)`.

**Rule:** Every POST, PUT, PATCH, and DELETE write endpoint must have `requireAuth` as its first middleware. See CONTRIBUTING.md Rule B4.

---

### `validate.middleware.js` — `validate(schema)`

Middleware factory that validates `req.body` against a Zod schema.

**Usage:**
```js
import { validate } from '../middlewares/validate.middleware.js';
import { addAnnouncementSchema } from '../schemas/index.js';

router.post('/add', requireAuth, validate(addAnnouncementSchema), handler);
```

**Behavior:**
- On success: replaces `req.body` with the parsed, type-safe Zod output and calls `next()`.
- On failure: throws `ApiError(400, '<field1>: <error> | <field2>: <error>')`.

This means after `validate()` runs, `req.body` contains only the fields defined in the schema, with proper types and defaults applied. This also strips any extra fields not in the schema.

---

### `audit.middleware.js` — `auditLogger(action)`

Middleware factory that records write operations to the `audit_logs` table.

**Usage:**
```js
import { auditLogger } from '../middlewares/audit.middleware.js';

router.post('/add', requireAuth, auditLogger('INSERT'), validate(schema), handler);
```

**Behavior:**
- Wraps `res.json` to intercept the response.
- On 2xx status codes: fires a **fire-and-forget** INSERT into `audit_logs` with `action`, `created_by` (`req.user?.sub`), and `ip_address` (`req.ip`).
- Does not block the response — if the audit log INSERT fails, it logs the error to console only.

**Note:** The `entity` and `entity_id` fields are not automatically populated — they depend on the route handler setting them on `req` before `res.json` is called, or being derived from context. Check the actual route implementation if you need full entity tracking.

## Related

- [backend/src/lib/README.md](../lib/README.md) — `ApiError`, Supabase clients
- [backend/src/schemas/README.md](../schemas/README.md) — all Zod schemas
- [docs/auth.md](../../../docs/auth.md) — full authentication flow
- [docs/security.md](../../../docs/security.md) — security implementation overview
