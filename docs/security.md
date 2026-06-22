# Security Implementation

---

## Implemented security measures

### 1. Zod input validation

**Source:** `backend/src/middlewares/validate.middleware.js` + `backend/src/schemas/index.js`

Applied via `validate(schema)` middleware on every route that accepts request body input:

```js
router.post('/add', requireAuth, validate(addAnnouncementSchema), asyncHandler(...));
```

Key validation rules enforced:
- **Path traversal prevention on document names:** `regex(/^[a-zA-Z0-9\s\-_]+$/)` — blocks `../` or `/` in document names
- **Document type sanitization:** `regex(/^[a-zA-Z0-9\-]+$/)` — alphanumeric + hyphens only
- **UUID format enforcement:** All ID fields validated with `z.string().uuid()`
- **Term year format:** `regex(/^AY \d{4}-\d{4}$/)` — strict format enforcement
- **Date format:** `regex(/^\d{4}-\d{2}-\d{2}/)` — prevents SQL injection via date fields
- **Enum enforcement:** Category fields are restricted to exact allowed values
- **Length limits:** All text fields have min/max length constraints
- **URL validation:** Social links and Facebook URLs validated with `z.string().url()`

Validation errors return `400` with per-field error details from Zod.

---

### 2. Authentication — httpOnly cookies + JWT

**Source:** `backend/src/middlewares/auth.middleware.js`

- JWTs stored in httpOnly cookies — inaccessible to JavaScript, resistant to XSS token theft
- `secure: true` — cookies only sent over HTTPS
- `sameSite: 'strict'` — prevents CSRF (cross-site request forgery)
- JWTs verified with `jsonwebtoken` using `SUPABASE_JWT_SECRET`
- Automatic token refresh via Supabase refresh token — transparent to the user

See [docs/auth.md](auth.md) for the full authentication flow.

---

### 3. File upload validation

**Source:** `backend/src/lib/uploadValidation.js`

Two validation functions applied at upload endpoints:

**`validateImageUpload(file)`:**
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Maximum size: 5 MB
- Returns `ApiError(415, ...)` for wrong type, `ApiError(413, ...)` for oversized file

**`validatePdfUpload(file)`:**
- Allowed MIME types: `application/pdf` only
- Maximum size: 20 MB
- Returns `ApiError(415, ...)` for non-PDF, `ApiError(413, ...)` for oversized file

Both functions first check the `mimetype` field set by Multer (from the client-reported `Content-Type` header), then independently verify the file's actual content via magic-byte sniffing (using [`file-type`](https://www.npmjs.com/package/file-type) against the buffer Multer captured in memory). A file whose `Content-Type` header was spoofed to pass the declared-type check (e.g. an HTML or script payload renamed/declared as `image/png`) is still rejected with `ApiError(415, ...)` because its real signature doesn't match an allowed format.

---

### 4. HTML sanitization

**Source:** `backend/src/lib/sanitize.js`

Applied to announcement `content` and event `description` fields before database insertion. Uses `sanitize-html` with an allowlist approach:

- **Allowed tags:** standard text formatting (`b`, `i`, `u`, `p`, `br`, `ul`, `ol`, `li`, `a`, `blockquote`, `strong`, `em`, `h1`–`h6`)
- **Stripped tags:** `<script>`, `<iframe>`, `<form>`, `<input>`, all event handlers (`onclick`, `onload`, etc.)
- **Allowed URL schemes on `<a>`:** `http`, `https`, `mailto` only — prevents `javascript:` URLs

This prevents stored XSS — malicious HTML submitted via the announcement form cannot execute in users' browsers.

---

### 5. Content Security Policy (CSP)

**Source:** `backend/src/app.js` — Helmet middleware configuration

```js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", `https://${supabaseHost}`, "data:", "blob:"],
      mediaSrc:       ["'self'", `https://${supabaseHost}`],
      connectSrc:     ["'self'", `https://${supabaseHost}`],
      frameSrc:       ["'self'", `https://${supabaseHost}`],
      fontSrc:        ["'self'", "data:"],
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      formAction:     ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
```

**Key directives:**
- `defaultSrc: 'self'` — no inline scripts or third-party scripts by default
- `scriptSrc: 'self'` — no third-party JavaScript
- `frameSrc: [...supabaseHost]` — allows PDF iframe from Supabase Storage
- `crossOriginEmbedderPolicy: false` — required for the PDF iframe (otherwise COEP would block the Supabase Storage URL from loading in an iframe)
- `frameAncestors: 'none'` — prevents clickjacking (this site cannot be embedded in an iframe)
- `objectSrc: 'none'` — blocks Flash, Java applets, and similar plugins
- `upgradeInsecureRequests` — forces HTTP → HTTPS upgrade

**Note:** `styleSrc` allows `'unsafe-inline'` because the frontend uses inline styles for dynamic token values and animation state. This is a known trade-off.

**Frontend CSP (separate from the above):** The Helmet CSP only decorates backend API/JSON responses. The static React app served by Vercel is governed by its own CSP header in `frontend/vercel.json`. It mirrors the backend directives but additionally whitelists the third-party origins the frontend legitimately loads:

- `style-src` includes `https://fonts.googleapis.com` — the Google Fonts `css2` stylesheet
- `font-src` includes `https://fonts.gstatic.com` — the Google Fonts `.woff2` files
- `frame-src` includes `https://maps.google.com https://www.google.com` — the embedded Google Map on `/office` (`OfficePage.tsx`)
- `img-src` includes `https://*.tile.openstreetmap.org` — OpenStreetMap tiles for the admin geofence map

The admin geofence map (admin Dashboard + Settings) renders Leaflet directly in the React tree via the shared `GeofenceMap` component. It was previously a `srcDoc` iframe that loaded Leaflet from `unpkg.com` and ran an inline `<script>`; because a `srcDoc` document inherits the parent CSP, that approach was fully blocked. The current component bundles Leaflet (CSS + marker assets served same-origin / inlined as `data:`), so it needs **no** `script-src` or CDN exceptions — only the OpenStreetMap tile origin in `img-src`.

Changes to `frontend/vercel.json` only take effect on a Vercel redeploy.

---

### 6. CORS

**Source:** `backend/src/app.js`

```js
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
```

- Only the frontend URL (from `FRONTEND_URL` env var) is allowed as an origin
- `credentials: true` is required for cookies to be included in cross-origin requests
- In production, `FRONTEND_URL` must be the exact deployed frontend URL — no wildcards

---

### 7. Rate limiting

**Source:** `backend/src/app.js`

```js
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const adminLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
```

- **Public routes** (announcements, documents, events, officers, committees, equipment, organizations): 100 requests per 15 minutes per IP
- **Admin routes** (user, dashboard, settings, analytics, auditlog, borrowing): 500 requests per 15 minutes per IP
- Both limiters use standard `RateLimit-*` headers
- `app.set('trust proxy', 1)` is set to correctly read client IP from Cloudflare/reverse proxy `X-Forwarded-For`

---

### 8. Request body size limit

**Source:** `backend/src/app.js`

```js
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

10 MB limit on JSON and URL-encoded request bodies. File uploads use Multer's per-field size limits (5 MB images, 20 MB PDFs).

---

### 9. Audit logging

**Source:** `backend/src/middlewares/audit.middleware.js`

Every write operation (INSERT, UPDATE, DELETE) is logged to the `audit_logs` table. The `auditLogger` middleware is fire-and-forget (does not block the response) and records:
- `action` — INSERT / UPDATE / DELETE
- `entity` — table name
- `entity_id` — ID of the affected record
- `created_by` — Supabase user UUID from `req.user.sub`
- `ip_address` — client IP from `req.ip`
- `created_at` — server timestamp

The full audit trail is visible in the Admin → Audit Log panel.

---

### 10. Error response hardening

**Source:** `backend/src/app.js` — global error handler

```js
return res.status(500).json({
  error: isDev ? err.message : 'An unexpected error occurred. Please try again later.',
  ...(isDev && { stack: err.stack }),
});
```

In production (`NODE_ENV=production`):
- Stack traces are never sent to clients
- Internal error messages are hidden behind a generic message
- Only `ApiError` (operational errors) expose their messages to the client

---

## Security architecture decisions

### Three-client Supabase strategy

The service key (`supabase`) bypasses RLS. It is used only on the backend for admin operations (writes, storage, auth.admin calls). Public reads use `anonSupabase` which enforces RLS. User-scoped writes use `createUserClient(token)` which enforces RLS under the user's JWT. This minimizes the blast radius if the anon key is ever exposed.

### `sameSite: 'strict'` on cookies

In production, the frontend and backend share the same root domain (e.g., `cvsu-imus-csg.ph`). Same-site cookies prevent the session from being sent on cross-site requests, eliminating classic CSRF attacks.

---

## Known remaining concerns

| Concern | Severity | Recommended fix |
|---|---|---|
| MIME type validation uses client-reported type | Low | Add `file-type` package to check magic bytes for file uploads |
| Admin registration has no whitelist enforcement | Medium | The `/user/register` endpoint requires auth but doesn't verify that the registering admin has permission to grant new accounts — a rogue admin could create unlimited accounts |
| PDF microservice URL in `.env` is trusted blindly | Low | Add origin validation so only the known microservice can upload to the backend |
| `storage.analytics` uses Supabase Management API key | Low | Rotate `SUPABASE_MANAGEMENT_TOKEN` regularly; this token has broad Supabase account access |
| `unsafe-inline` on `styleSrc` | Low | Refactor dynamic inline styles to use CSS classes to enable a stricter CSP |
| No brute-force lockout on login | Low | Supabase Auth has built-in rate limiting; the `adminLimiter` (500/15 min) provides additional throttling |

---

## Supabase security settings

In Supabase dashboard:
- **Auth → Settings → Enable email confirmations** — require email verification before accounts can log in
- **Auth → Settings → Minimum password strength** — set to "Strong"
- **Auth → Settings → OTP expiry** — keep default (1 hour)
- **Database → Row Level Security** — verify all tables show "RLS enabled"
- **Database → Extensions → pg_net** — disable if not using Supabase webhooks
- **Storage → Policies** — all buckets should have public SELECT but require service role for INSERT/UPDATE/DELETE

---

## npm audit

Run periodically to check for known vulnerabilities:

```bash
cd backend && npm audit
cd frontend && npm audit
```

As of the initial release, no high-severity vulnerabilities were present in the dependency tree.
