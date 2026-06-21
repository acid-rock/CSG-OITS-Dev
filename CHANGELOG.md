# Changelog

All notable changes to CSG-OITS will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.11.6] - 2026-06-21

### Fixed
- **Admin "session expired" lockout introduced by v1.11.5** — after the per-admin nonce change, admins were repeatedly kicked out with "session expired" a few seconds after logging in; root cause was a cache-contract mismatch in `getDbNonce` (`backend/src/middlewares/auth.middleware.js`): it gated the database read on `dbNonce === undefined`, but `getCached` (`backend/src/lib/cache.js`) returns **`null`** on a miss/expiry, never `undefined`; so once the 5-second cache primed at login expired, the DB read was skipped, the nonce resolved to `null`, and the new deny-by-default logic treated `null` as "logged out" → 401 on the next request → `SessionExpiredModal` (which fires only on 401); login re-primed the cache for 5 seconds, so every session worked briefly then died; `getDbNonce` now treats any non-null cache value as a hit and reads the DB otherwise, so the per-user nonce is correctly DB-backed beyond the 5-second window (the v1.11.5 code had the same `=== undefined` bug but its old lenient `null → allow` branch masked it; the deny-by-default fix exposed it)
- **CSRF token unreadable across domains (would block all admin writes)** — v1.11.5 delivered the CSRF token via a non-httpOnly `csrf_token` cookie that the frontend interceptor read with `document.cookie`; because the frontend (`csg-oits.vercel.app`) and backend (`*.onrender.com`) are different sites, frontend JS cannot read a cookie scoped to the backend domain, so the `X-CSRF-Token` header was never attached and every state-changing admin request (`requireAuth` + POST/PUT/PATCH/DELETE) would have returned 403 (masked until now only because the nonce 401 above hit first); the double-submit cookie is retained for the server-side comparison, but the token is now also returned in the `POST /user/login` and `GET /user/me` JSON bodies (both CORS-protected, so a cross-origin attacker still cannot read it); `frontend/src/config/axiosSetup.ts` stores the token (module memory + `sessionStorage`) via a new `setCsrfToken()` export and attaches it from there instead of reading the cookie; `Login.tsx` seeds it on login and `ProtectedRoute.tsx` rehydrates it from `/user/me` on every admin mount (covers reloads)

### Notes
- Requires redeploying both services: the backend (Render) for the nonce fix and the backend half of the CSRF fix, and the frontend (Vercel) for the frontend half; both halves of the CSRF change must ship together
- The cross-domain CSRF failure does not reproduce on a localhost dev setup (frontend and backend share the `localhost` host, so the cookie is readable either way); the nonce lockout fix is fully verifiable locally by staying logged in past the 5-second window

## [1.11.5] - 2026-06-21

### Security
- **Frontend security headers added at the hosting layer** — an external OWASP ZAP pass against the production Vercel site (`csg-oits.vercel.app`) flagged a missing Content-Security-Policy, missing anti-clickjacking header, and missing `X-Content-Type-Options`; all were absent because the backend's Helmet configuration only decorates API responses, while the static React bundle served by Vercel had no headers at all (`frontend/vercel.json` contained only an SPA rewrite rule); added a `headers` block to `frontend/vercel.json` applying to every route: `Content-Security-Policy` (mirrors the backend Helmet directives — `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, Supabase wildcard + backend origin in `connect-src`, `'unsafe-inline'` retained only in `style-src` for Vite/React inline styles), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security` (2-year `max-age`, `includeSubDomains`, `preload`), and `Permissions-Policy` (camera/microphone denied, geolocation self); the SRI, "Modern Web Application", and cache-control ZAP findings were informational only (no third-party CDN scripts are loaded) and required no change
- **Dedicated rate limiter on credential endpoints** — the entire `/api/v1/user` router was mounted under `adminLimiter` (500 req/15 min), far too generous for brute-force/credential-stuffing protection on the login and password-reset paths; added a strict `authLimiter` (10 req/15 min per IP) in `user.routes.js` applied specifically to `POST /login`, `POST /forgot-password`, `POST /reset-password`, `POST /complete-reset`, and `POST /exchange-code`; the generous admin limit still covers the rest of the router (e.g. `/whitelist`, `/list`)
- **Admin session nonce keyed per user (was global)** — the single-device-enforcement nonce was stored as one shared `admin_session_nonce` row in `settings`; because every login regenerated that single row, any admin logging in silently invalidated **every other admin's** session, and the system could only ever hold one logged-in admin at a time; the nonce is now keyed per user (`admin_session_nonce:<userId>`), so each admin has an independent single-device session and concurrent admins no longer evict one another; `checkAdminNonce` and `optionalAuth` updated to read the per-user key; login (`user.routes.js`) upserts the current user's key and primes the 5-second auth cache; logout deletes only that user's key
- **Post-logout JWT replay window closed** — `checkAdminNonce` and `optionalAuth` previously treated an **absent** stored nonce as "accept any nonce" (`if (dbNonce && ...)` / `!dbNonce || ...`); combined with logout *deleting* the nonce row, a still-valid (not-yet-expired, up to 1-hour TTL) access token could pass the nonce check after logout; both functions now **deny** when no stored nonce exists for the user — a logged-out session is rejected on its next protected request regardless of remaining JWT lifetime; logout also clears the per-user auth cache immediately so the deny takes effect without waiting out the 5-second cache window
- **CSRF protection via double-submit token** — auth cookies are `SameSite=None` (required because the Vercel frontend and the separately hosted backend are cross-site), and CSRF defense rested entirely on the CORS allowlist; added an explicit double-submit token: login issues a non-httpOnly `csrf_token` cookie (cleared on logout), and `requireAuth` — the single middleware every state-changing admin route already passes through — now rejects unsafe methods (`POST`/`PUT`/`PATCH`/`DELETE`) with 403 unless the `X-CSRF-Token` request header matches the `csrf_token` cookie; genuinely public `POST` endpoints (login, forgot/reset, feedback, `access/*`, `views/track`) are unaffected because they do not use `requireAuth`; on the frontend a single global `axios.interceptors.request` (registered once in `main.tsx` via the new `src/config/axiosSetup.ts`) reads the cookie and attaches the header on every request, so all existing raw-`axios` call sites are covered without per-call changes; a forged cross-site request carries the cookies but cannot read the token to replay it in the header
- **Raw database error messages masked in production** — many handlers built operational errors directly from Supabase/Postgres error text (e.g. `new ApiError(500, error.message)`, `new ApiError(500, "Whitelist insert failed: " + error.message)`), which the global error handler returned verbatim to the client — leaking schema, constraint, and column detail; fixed centrally in the `app.js` error handler: operational errors with a 5xx status now return a generic message in production while the real error is logged server-side via `console.error`; 4xx operational messages (validation, not-found, auth) are still returned as-is, and plain `throw new Error()` was already masked in production; this one choke-point change covers all current and future occurrences without editing 100+ call sites

### Changed
- **`frontend/src/config/axiosSetup.ts` added** and imported once in `main.tsx` to register the global CSRF interceptor; the `config/README.md` and `admin/README.md` references to a non-existent `axiosInstance.ts` were corrected to describe the actual raw-`axios` + global-interceptor setup

### Notes
- This release invalidates all existing admin sessions on deploy: the per-user nonce keys do not yet exist for current sessions, and the new CSRF requirement means every admin must log in once after the update — expected for a security release
- `frontend/vercel.json` `connect-src` must list the real backend origin (the host part of `VITE_API_URL`, without `/api/v1`); set to the production Render backend at deploy time

## [1.11.4] - 2026-06-17

### Security
- **Magic-byte validation on file uploads** — `validateImageUpload` and `validatePdfUpload` in `backend/src/lib/uploadValidation.js` previously accepted any file whose `Content-Type` header declared an allowed type; a spoofed upload (e.g. an HTML or script payload declared as `image/png`) passed the declared-type check and was piped directly to `sharp` with no further verification; both functions are now `async` and additionally read the uploaded buffer through [`file-type`](https://www.npmjs.com/package/file-type) to detect the real MIME type from the file's magic bytes; if the detected type doesn't match the allowed image or PDF allowlist the request is rejected with `ApiError(415, ...)` regardless of what the `Content-Type` header said; all 9 original call sites (announcements add/edit, documents add, events add/edit, officers add/edit, organizations add/edit) updated to `await` the now-async functions; `file-type` added as a new backend dependency; unit tests rewritten with real magic-byte fixtures and four new spoofed-upload test cases that were not catchable before this change
- **Upload validation wired into committee and borrowing routes** — `POST /committees/upload-cover`, `POST /borrowing/inventory/add`, and `POST /borrowing/inventory/edit` accepted image uploads but called neither `validateImageUpload` nor any other MIME-type check, going directly to `sharp()` on the raw buffer; a non-image file caused `sharp` to throw an uncontrolled runtime error (500 on the committee endpoint; silently swallowed with a 200 on the two inventory endpoints due to their non-fatal `try/catch`); `validateImageUpload` now runs on all three routes before `sharp` is invoked; on the inventory routes the call is placed outside the non-fatal `try/catch` so that MIME/magic-byte rejections propagate as a proper `ApiError(415, ...)` rather than being swallowed

## [1.11.3] - 2026-06-08

### Security
- **Sensitive fields stripped from public API responses** — four public GET endpoints were returning internal fields that serve no purpose for unauthenticated consumers: `GET /bulletin/` leaked `owner_id` (reveals which admin account created each post); `GET /documents/` leaked `owner_id`, `is_archived`, `archived_at`, and `deleted_at` (full soft-delete and archive state visible publicly); `GET /committees/` leaked `deleted_at` and the raw Supabase storage path `cover_image_path`; `GET /organizations/` leaked `is_archived`, `deleted_at`, and `logo_path`; all four routes updated — sensitive fields removed from Supabase `.select()` strings where possible, and response map functions rewritten to use explicit projections; a separate `buildDocRowPublic()` helper introduced in `documents.routes.js` so the shared `buildDocRow()` (used by admin routes) is unaffected; admin routes retain full row data

## [1.11.2] - 2026-06-08

### Security
- **GPS coordinates stripped from public logbook** — `GET /api/v1/logbook/today` returned `check_in_lat` and `check_in_lng` for every officer session; officer geolocation is not public information and enables real-world tracking; both fields removed from the public `/today` response transform; the admin-only `GET /logbook/admin` endpoint (behind `requireAuth`) retains them for administrative purposes
- **Student number required on kiosk checkout and recheck-in** — `POST /checkout` and `POST /recheck-in` previously accepted only `{ officer_id }`; because officer UUIDs are publicly enumerable via `GET /api/v1/officers`, any caller could forcibly close any officer's active logbook session with a single unauthenticated request; both endpoints now require `student_number` in the body and validate it server-side against the officer record (same check as `POST /checkin`); `logbookCheckoutSchema` updated accordingly; frontend kiosk and mobile check-in flows updated to include `student_number` in request bodies
- **Debug `console.log` calls with PII removed** — `officers.routes.js` and `user.routes.js` contained leftover debug logs that printed officer payloads (including `student_number`), full profile row arrays, and Supabase auth user lists to stdout; server logs are commonly shipped to external aggregators; all `console.log` calls in those two files removed (all `console.error` calls retained)
- **Password complexity parity on reset and change-password** — `POST /reset-password` checked only `new_password.length < 8`; `POST /change-password` also only checked length; neither enforced the uppercase-letter and digit requirements that `registerSchema` already required at account creation; an account could be reset to "aaaaaaaa" or "password1"; extracted a shared `assertPasswordComplexity()` helper (min 8 chars, at least one uppercase, at least one digit) and applied it to both `POST /reset-password` and `POST /change-password`
- **Zod validation added to whitelist POST** — `POST /user/whitelist` read `email`, `full_name`, and `student_id` directly from `req.body` with no schema; no length limits, no email format check, no sanitization; added `whitelistInsertSchema` (email format + max 254 chars, full_name max 200, student_id max 20, at least one of email/student_id required) and applied `validate(whitelistInsertSchema)` middleware to the route; the now-redundant manual `if (!email && !student_id)` guard removed
- **Rate limit added to `/committee-pins/validate-session`** — `POST /committee-pins/validate-session` was unauthenticated and subject only to the shared `adminLimiter` (500 req/15 min), making it possible to hammer the DB with session lookups; added a dedicated `validateSessionLimiter` (30 req/min per IP); 30 req/min is well above what `CommitteeProtectedRoute` legitimately needs (one check per navigation event)
- **Audit action labels on all write endpoints** — every `auditLogger()` call in `announcements.routes.js`, `documents.routes.js`, and `events.routes.js` was invoked without an `action` argument, writing `NULL` to `audit_logs.action` on every add/edit/delete operation and making the audit trail useless for forensic review; all 9 call sites now pass a descriptive label (`'announcement:add'`, `'document:edit'`, `'event:delete'`, etc.)
- **PKCE reset-password flow merged server-side** — the previous password-reset flow required two client-initiated round-trips: `POST /exchange-code` returned an `access_token` in the JSON response body (visible in browser DevTools), and the client then sent that token back in `POST /reset-password`; added `POST /complete-reset` which accepts `{ code, new_password }`, performs the PKCE exchange server-side, verifies the resolved user, and updates the password via the admin API — the intermediate JWT never leaves the server; `Reset.tsx` updated to call the new single endpoint
- **Raw IP addresses no longer stored in `page_views`** — `POST /api/v1/views/track` inserted `ip_address: req.ip` into the `page_views` table on every page view; raw IP addresses are PII under the Philippine Data Privacy Act and GDPR, with no documented retention or deletion policy; the `ip_address` field removed from the insert (the column remains in the DB schema; existing rows should be cleared with `UPDATE page_views SET ip_address = NULL`)
- **`unsafe-inline` removed from Content-Security-Policy `style-src`** — Helmet CSP included `'unsafe-inline'` in `styleSrc`, permitting `<style>` tag injection in API responses; the backend is a JSON-only API server and has no legitimate need for inline styles; removed from the CSP directive
- **JSON body size limit reduced from 10 MB to 1 MB** — `express.json({ limit: "10mb" })` and `express.urlencoded({ limit: "10mb" })` allowed 10 MB JSON payloads on every endpoint including unauthenticated ones; the largest legitimate JSON payload in the application (50,000-character announcement content) is well under 100 KB; limits reduced to `"1mb"`; file uploads use `multer` (multipart/form-data) and are unaffected
- **Admin nonce bypass via missing cookie** — `checkAdminNonce` previously returned `true` (allow) when the `admin_nonce` cookie was absent, with a comment describing this as a "committee/public user" skip; because `checkAdminNonce` is only ever called from `requireAuth` (an admin-only guard), any caller presenting valid JWT cookies but deliberately omitting the nonce cookie was granted full admin access, defeating single-device session enforcement entirely; changed the absent-cookie branch to return a 401 and `false`, matching the intent of every other failure path in the function
- **Stale post-logout JWT grants admin-only officer fields** — `optionalAuth` (used by `GET /api/v1/officers` to decide whether to include `student_number`) performed only a cryptographic `jwt.verify()` check with no nonce validation; a revoked admin JWT — valid within its 1-hour TTL but invalidated by logout (nonce rotated in DB) — still received `req.isAdmin = true` and caused `student_number` to be included in the response for all officers; `optionalAuth` is now async and replicates the nonce check from `checkAdminNonce`: if the `admin_nonce` cookie is absent or does not match the current DB nonce, `req.isAdmin` stays `false` and the request proceeds as public; the same `admin:session_nonce` cache (5-second TTL) is reused to avoid extra DB round-trips for active admin sessions
- **Unauthenticated access to archived officer roster** — `GET /api/v1/officers?status=archived` (or `?status=all`) was accepted from unauthenticated callers because `statusFilter` was read directly from `req.query.status` with no access-control gate; `isAdmin` was already computed from `optionalAuth` at the top of the handler but only used to decide whether to include `student_number` — not to restrict which records were returned; both `statusFilter` assignments (paginated and non-paginated paths) now force `"active"` for unauthenticated requests: `const statusFilter = isAdmin ? (req.query.status || "active") : "active"`; authenticated admin JWTs retain full filter control

## [1.11.1] - 2026-06-06

### Security
- **Admin panel — ProtectedRoute localStorage bypass** — `ProtectedRoute` previously gated the entire admin UI with `localStorage.getItem('admin_authenticated') === '1'`; any visitor could open DevTools and set that flag to render the admin panel without a valid session cookie; replaced with a server-side `GET /api/v1/user/me` call on mount — only a verified HttpOnly cookie session grants access; removed all `localStorage.setItem/removeItem('admin_authenticated')` calls from `Login.tsx`, `Sidebar.tsx`, and `SessionExpiredModal.tsx`
- **Committee PIN brute-force protection** — `POST /api/v1/committee-pins/verify` was under the shared `adminLimiter` (500 req/15 min), making a 4-character PIN crackable in ~9 days per IP; added a dedicated `pinVerifyLimiter` (10 req/15 min per IP) on that endpoint specifically; minimum PIN length raised from 4 → 8 characters (enforced on the backend route and the Settings UI); PINs are now hashed with `crypto.scrypt` before storage (prefixed `scrypt:` to distinguish from legacy plaintext); comparison uses `crypto.timingSafeEqual` to prevent timing attacks; existing plaintext PINs continue to work via a fallback until an admin re-saves them; `GET /committee-pins` returns `""` for hashed values — hashes are never sent to the client
- **Register endpoint role injection** — `POST /api/v1/user/register` accepted an arbitrary `role` string and wrote it directly into Supabase `app_metadata` with no validation; `registerSchema` extended to validate all fields (`role` locked to `z.enum(['admin'])`, plus `fullname`, `nickname`, `studentNumber`); `validate(registerSchema)` middleware applied to the route — requests with `role: "super_admin"` or any unlisted value are now rejected with 400 before reaching Supabase

## [1.11.0] - 2026-05-29

### Added
- **WebP image compression pipeline** — all image uploads across the admin panel are now converted to WebP (max 1200 px wide, quality 80) via `sharp` before being stored in Supabase Storage; applies to announcements, officers, organizations, committees, events, and equipment inventory; `Content-Type: image/webp` and `Cache-Control: max-age=31536000` (1-year browser cache) are set on every upload
- **One-time WebP migration script** (`backend/scripts/migrate-images-to-webp.js`) — downloads every existing image from the five image buckets, saves the original to `backend/scripts/backup/<bucket>/<path>` locally, converts to WebP, and re-uploads to the same path; public URLs remain unchanged; skips files already in WebP format; logs size reduction per file and a storage-saved summary
- **Backup restore script** (`backend/scripts/restore-backup.js`) — single-file restore utility: `node scripts/restore-backup.js <bucket> <path>` pushes a backed-up original back to Supabase Storage; for use if a migrated image needs to be rolled back
- `scripts/backup/` added to `backend/.gitignore` to prevent local backup files from being committed

### Changed
- **Frontend data fetching — lazy-load officers, committees, organizations** — removed `officers`, `committees`, and `organizations` from `Root-layout.tsx`'s `Promise.allSettled` and `OutletContext`; each consuming component (`OfficerSection`, `OrganizationsSection`, `Officers`, `CommitteesPage`, `OrganizationsPage`, `AboutPage`) now fetches its own data on mount; visitors to content-only pages (`/announcements`, `/documents`, `/events`) no longer trigger officer or organization image loads

### Fixed
- **`events.routes.js` multer config missing file size limit** — `multer({ storage: memoryStorage() })` had no `limits` object, allowing arbitrarily large uploads into memory; added `limits: { fileSize: 5 * 1024 * 1024 }` to match all other route files
- **`documents.routes.js` thumbnail upload — `contentType` option typo** — the thumbnail upload to the `thumbnails` bucket passed `{ thumbnailContentType, upsert: true }` where `thumbnailContentType` is not a recognised Supabase Storage option; corrected to `{ contentType: thumbnailContentType, cacheControl: '31536000', upsert: true }`

## [1.10.2] - 2026-05-29

### Fixed
- **Announcements admin panel — author showing "Admin" instead of real name** — all three announcement API handlers (`GET /`, `GET /archived`, `GET /bin`) built their response payload via an explicit `.map()` but never forwarded `owner_id` from the database row; `entry.owner_id` was always `undefined` on the frontend, causing `adminDisplayName` to immediately return the `'Admin'` fallback without ever consulting the admin map; fixed by adding `owner_id: row.owner_id ?? null` to the returned object in all three handlers

## [1.10.1] - 2026-05-29

### Changed
- **Announcements — category tag label** — `getTagLabel` now returns the raw `category` string from the database (e.g. "Examinations", "Class Advisories") instead of mapping to a hardcoded set of three labels; all actual category values are now displayed correctly
- **Announcements — category tag on card images** — tag overlay had a near-transparent background (`rgba(79,111,209,0.08)`) that was illegible on colourful images; `.bl-card-tag` now uses a dark frosted-glass override (`rgba(0,0,0,0.52)` + `backdrop-filter: blur(6px)`) with white text, readable on any image
- **Announcement and event modals — paragraph breaks** — content was rendered in a single `<p>` tag, collapsing all newlines into spaces; replaced with a paragraph splitter that maps double newlines (`\n\n+`) to separate `<p>` elements and single newlines to `<br>` tags; applies to all callers of `<Modal>` (announcements, events, homepage sections)
- **Organizations hero — stat cards layout** — grid was `repeat(3, auto)` causing ROTC to orphan on a second row; changed to `repeat(4, auto)` on wide screens (4×1), `1fr 1fr` on ≤768 px (2×2), and `1fr 1fr` on ≤480 px (2×2)

### Fixed
- TypeScript build error `TS2367` in `LogbookCheckin.tsx` — `phase === 'already-in'` comparison inside the `if (phase === 'form')` render block was always false (TypeScript narrows `phase` to `'form'` inside that branch); removed the dead check; the `already-in` → `form` reset is already handled by the "Not me" button in the `already-in` render block
- **Announcements — category tag reading wrong field** — `getTagClass` and `getTagLabel` were reading `(ann as any).type` which does not exist on bulletin records; corrected to `(ann as any).category`

## [1.10.0] - 2026-05-29

### Added
- **Admin Feedback panel** (`/admin?panel=feedback`) — new panel under Operations in the sidebar; lists all site feedback submissions with type tag, message preview, sender info, and status badge; filter by status (New / Read / Resolved) with live unread counts; click any row to expand the full message with a mailto reply link; mark individual entries as read or resolved; single and bulk delete
- **In-app feedback form** — "Send Feedback" button in the public footer now opens an in-app modal instead of redirecting to Google Forms; collects feedback type (Bug Report, Suggestion, Other), message (10–2000 chars), and optional name and email; submissions stored in `site_feedback` Supabase table; success state confirms receipt
- `POST /api/v1/feedback` — public endpoint to submit feedback; validated by `feedbackSubmitSchema`
- `GET /api/v1/feedback` — admin endpoint to list all feedback entries (requireAuth)
- `PATCH /api/v1/feedback/status` — admin endpoint to update entry status (requireAuth)
- `DELETE /api/v1/feedback/delete` — admin endpoint to hard-delete one or more entries (requireAuth)
- `feedbackSubmitSchema`, `feedbackUpdateSchema`, `feedbackDeleteSchema` Zod schemas added to `schemas/index.js`

### Changed
- **Admin sort filter — dropdown** — sort controls in Announcements, Events, and Documents panels changed from a cosmetic toggle button to a functional `<select>` dropdown ("Newest first" / "Oldest first"); all three panels now actually sort by the selected direction; Announcements sort respects pinned-first ordering
- **Committees panel — avatar resolution** — chair and vice chair name lookups now use case-insensitive, whitespace-trimmed string comparison; `OfficialAvatar` component replaces inline `<img onError>` so a broken or expired image URL gracefully falls back to the `MiniAvatar` initials display instead of leaving a blank slot

### Fixed
- **Organizations hero — ROTC stat card missing** — ROTC count was tracked and shown in the filter bar but had no stat card in the hero section alongside Academic, Non-academic, and Publication; card now renders conditionally when `counts.rotc > 0`
- **Committees panel — chair/vice chair photo not shown** — strict `===` comparison between `chair_name` stored on the committee and `full_name` in the officers list failed on any whitespace or casing difference, returning `avatar: null` and falling through to initials; fixed with normalized (trimmed + lowercased) comparison

## [1.9.0] - 2026-05-29

### Added
- **Logbook — kiosk checkout display** — new full-screen 1920×1080 kiosk page at `/logbook?action=checkout`; officers walk up to the screen, select their name in a large touch-friendly combobox, and tap "Check out now" — no QR scan needed; left column shows the checkout form with live session summary (check-in time + running duration); right column shows the live "On Duty Now" roster and a "Checking in?" hint card linking back to `/logbook/display`; after a successful checkout the screen shows a celebration state with the officer's name, session summary (in/out/duration), and a 10-second auto-reset countdown before returning to the form; supports the two-QR-code physical kiosk setup (one laminated QR for check-in → `/logbook/display`, one for check-out → `/logbook?action=checkout`)
- **Logbook — `POST /recheck-in` endpoint** — allows re-check-in after an accidental checkout without a fresh QR scan; validates that the most recent session today was shorter than 5 minutes and the request is within 10 minutes of that checkout; creates a new open session; returns `{ session, officer_name }`
- **Logbook check-in — accidental checkout detection** — on the `checkout-success` phase, if the closed session lasted less than 5 minutes an amber banner appears ("That session was only X min — accidental check-out?") with a "Re-check in" button that calls `POST /logbook/recheck-in`; on success transitions directly to the `success` phase with the new check-in time

### Changed
- **Settings — Office Hours — auto-checkout column** — the "Close" time column is now labelled "Auto-checkout" with a blue tint and column header in `var(--color-primary)`; a live countdown panel below the grid shows the current day's closing time in 12-h format and the time remaining until auto-checkout fires, ticking every minute; makes the connection between the schedule and the logbook's auto-checkout mechanism explicit for admins
- **Settings — Office Hours — grid layout** — redesigned from a cramped flex row to a 3-column CSS grid (160 px day label · 46 px toggle · 1fr time inputs); each row has a "Today" pill badge when it matches the current day; closed days show a "Closed — no auto-checkout" label spanning the time area; the auto-checkout input has a distinct blue tinted background
- **Office page — hero counter card** — replaced sparse "The office is open and staffed." + tiny avatar strip with a full inline officer roster; each row shows a colour-coded initials avatar, the officer's name and position, and their running session duration in serif italic; the counter number reduced from 100 px to 80 px font to leave room for the list
- **Logbook display — QR tap affordance** — replaced the hover-only effect with an always-visible dark pill badge inside the QR card ("👆 Tap to check in"); pill turns primary-blue on hover; hint text ("Can't scan? Tap the QR to open on this screen.") moved outside the white card so it is legible on the dark blue background
- **`POST /checkout` response** — now returns `{ message, session: closedSession, officer_name }` in addition to the previous `{ message }`; `LogbookCheckin` uses `data.session.check_in_at` to compute the accidental-checkout duration without a separate API call
- **Logbook name dropdowns — adviser exclusion** — officers whose `position` field matches `/adviser|advisor/i` are filtered out of both the check-in and checkout name selectors; advisers are faculty-level roles and do not participate in student officer duty sessions
- **Logbook name dropdowns — position deduplication fix** — officers who appear under multiple committee records (one with a real position, one with an empty `position` field) were previously deduplicated incorrectly; empty position strings now rank `-1` (below all real positions including "Member"), so the record with the most descriptive role always wins
- **Logbook name dropdowns — conditional position rendering** — the position `<span>` in both the check-in combobox and the kiosk checkout combobox is now only rendered when `displayPosition` is non-empty; removes blank space beneath names with no position data
- **Dark mode — temporarily disabled** — all dark mode UI (theme toggle buttons, `[data-theme="dark"]` token overrides, `useTheme` hook usage) commented out with `/* DARK MODE: re-enable when dark mode is ready */` markers pending design review; the `csg-theme` localStorage key, `useTheme` hook, and token overrides are fully preserved and can be re-enabled in one pass

### Fixed
- **Modal popups — no scroll on tall content** — announcement and event modals had `overflow: hidden` with no height cap on desktop, so long descriptions (e.g. multi-paragraph announcements) were silently clipped; modal container now has `max-height: 90vh` and `display: flex; flex-direction: column` at all viewport sizes; image section gets `flex-shrink: 0`; text section gets `flex: 1; overflow-y: auto` so only the description scrolls, not the image; a slim 5 px scrollbar appears when needed; mobile breakpoint simplified since flex handles the layout universally

## [1.8.0] - 2026-05-28

### Added
- **Settings — Office Hours module** — new "Office hours" entry under Modules in the Settings nav rail; day-by-day schedule editor with open/close time inputs (`<input type="time">`) and a closed toggle per day; defaults to Mon–Sat 08:00–19:00, Sunday closed; persisted as JSON in `settings.office_hours`; the closing hour drives logbook auto-checkout and the public `/office` page schedule display
- **Admin Dashboard — Office Geofence map** — new card in the left column shows a Leaflet/OpenStreetMap map with the configured office location marker and a blue circle overlay at the saved radius; only rendered when coordinates are saved; links to Settings → Office location for editing
- **Logbook — remote checkout for forgotten check-outs** — if an officer selects their name on the check-in page and already has an open session today, the page automatically transitions to an "Already checked in" card showing their session details (check-in time, time on duty, geo-verified badge) and a "Check Out" button; no location check is required on checkout since the original check-in was already geofence-verified; allows officers who forgot to scan out and have since left the building to close their session remotely from anywhere

### Changed
- **Logbook auto-checkout — dynamic closing hour** — the hard-coded `OFFICE_CLOSE_HOUR_PH = 19` constant replaced with a DB-driven lookup from the `office_hours` setting; result is cached at the module level for 5 minutes (negligible DB traffic); falls back to 7:00 PM when the setting is not yet configured; on days marked as Closed in the schedule, auto-checkout is suppressed entirely (sentinel value 25 ensures the condition never fires)
- **Office Hours public page — dynamic schedule list** — hardcoded Mon–Fri 8AM–5PM schedule replaced with live data fetched from `GET /api/v1/settings/office_hours` on mount alongside the existing coords fetch; converted from 24-h strings (`"08:00"`) to 12-h display ("8:00 AM") via `fmt24to12()`; defaults to Mon–Sat 8:00 AM – 7:00 PM while loading
- **Office Hours public page — card grid layout** — "On Duty Now" section switched from CSS grid `repeat(auto-fill, minmax(260px, 1fr))` to `flex-wrap` with `justify-content: center`; cards are sized to `calc(33.333% - 16px)` so 3 cards fill a row exactly and 1–2 orphan cards in the last row center instead of anchoring to the left; responsive: 2-col at ≤768 px, 1-col at ≤640 px
- **Access control — concurrent slot rate limiting** — removed `publicLimiter` (100 req/15 min per IP) from `/api/v1/access` entirely; all CVSU-Imus students share a single campus NAT IP; with 35 holders (heartbeat every 20 s) + 15 queued users (poll every 15 s) the shared IP generates ~2,475 req/15 min — exhausting the 100-req bucket in ~36 seconds, causing slot TTLs to expire and the 35-slot cap to be bypassed; the slot cap itself is the protection mechanism, not per-IP rate limiting
- **Settings — Geofence radius field** — column width widened from 110 px to 160 px so larger values are fully visible in the input
- **Settings — Geofence preview map** — replaced static Google Maps iframe (which cannot draw circles) with a self-contained Leaflet/OpenStreetMap iframe via `srcDoc`; shows a pin marker and a blue circle at the configured radius; tip text now reflects the saved radius value dynamically instead of the hardcoded "200 m"
- **Logbook check-in — location status label** — "Location verified / You're within the CSG office radius." changed to "Location acquired / Coordinates captured — radius will be verified on check-in." to avoid the false implication that the geofence has already passed before the check-in request is submitted

### Fixed
- **Admin views chart — 429 Too Many Requests** — `/api/v1/views` was under `publicLimiter` (100 req/15 min); the public `POST /track` calls from concurrent visitors exhausted the bucket, causing the admin line-graph stats endpoint to 429; moved to `adminLimiter` (500 req/15 min)
- **Logbook — duplicate officer in "Earlier Today"** — officers who accidentally checked out and re-checked in appeared in both "On Duty Now" and "Earlier Today" simultaneously; fixed by building a `presentNames` set from `dedupPresent` and excluding those names from the "Earlier Today" filter
- **Office Hours — duplicate officer cards** — an officer with two rows in the `officers` table (e.g. VP of Internal Affairs + RIAC Chairperson) showed two "On Duty Now" cards; fixed by deduplicating sessions by `officer.full_name`, preferring the CSG-wide role (`is_committee_official = false`) over the committee role
- **Logbook — concatenated position string** — `officers.position` is a Postgres `TEXT[]` column; Supabase returns it as a JS array which JSX concatenates without separator, producing strings like "Vice President of Internal AffairsRIAC Chairperson"; fixed by adding `normalizePosition()` in `logbook.routes.js` that takes `pos[0]` for arrays and passes strings through unchanged; applied to both `/today` and `/admin` response transforms
- **Admin logbook — auto-checkout sessions excluded from KPI tiles** — sessions marked `auto_checkout = true` were excluded from the "checked-out today" count and total office-minutes calculation by `&& !s.auto_checkout` guards; removed the guards so auto-closed sessions count as normal completed attendance records
- Organization card modal spawned at the top of the viewport instead of being vertically centered — added `margin: auto` to `.org-modal` and `.org-modal--wide`; changed `align-items` on `.org-modal--wide` from `flex-start` to `center`
- Document modal — Google Docs Viewer native "Pop out" button overlapped the custom × close button — added a `.modal__header` bar (document title + close button) above the iframe; removed absolute positioning from the close button so it is a flex item in the header row
- Borrow equipment — purpose-type checkboxes could not be toggled — native `<label>` wrapping a hidden `<input type="checkbox">` caused a double-fire (label click forwarded to input, toggling state twice back to its original value); replaced with `<div role="checkbox">` driven by `onClick` and `onKeyDown`
- Reset password — "Auth Session Missing" error when submitting a new password via a recovery link — `createUserClient(token).auth.updateUser()` requires an in-memory Supabase session, not just an Authorization header; replaced with `supabase.auth.getUser(access_token)` to verify the token, then `supabase.auth.admin.updateUserById()` to set the new password
- Reset password — typing in the Confirm Password field shifted focus back to New Password on every keystroke — `Shell` layout component was defined inside `Reset`, creating a new component reference on every state update and causing a full subtree remount; moved `Shell` to module level; also removed `autoFocus` from the New Password input
- Logbook officer combobox — "No matches found" when typing a name that includes a middle initial (e.g. "John Harold Magma" vs "John Harold R. Magma") — simple `.includes()` fails when words are not a continuous substring; replaced with word-by-word matching using `.split(/\s+/)` and `.every()`
- Logbook officer combobox — dropdown showed "No matches found" even with no text typed and the API returning valid officers — `parseFirstPosition()` threw `TypeError: raw.split is not a function` when an officer's `position` field was a non-string value in the database; the error inside `Promise.allSettled().then()` was silently swallowed, preventing `setOfficers()` from being called; fixed by adding a `typeof raw !== 'string'` guard in `parseFirstPosition()`

## [1.7.0] - 2026-05-28

### Added
- **Digital Office Logbook — batch Excel export** — the Export button in the admin Office Duty panel now opens a date-range modal; the selected range is fetched in a single API call and exported as a formatted `.xlsx` file; columns: No., Officer Name, Position, Date, Check-in, Check-out, Duration, Status, Location Verified; multi-day exports include a per-day group header row and a **Daily Summary** table (sessions, checked-out count, auto-closed count, total hours per day)
- **Export modal — custom date-range calendar picker** — two-month side-by-side calendar; only dates that have recorded logbook sessions are selectable (shown as solid chips); all other dates are grayed out and cannot be clicked; live hover preview draws the range as the user mouses over candidate end-dates; click once to set the start, click again to confirm the end
- `GET /api/v1/logbook/admin/dates` — returns `{ dates: string[] }` of all distinct session dates; used by the calendar picker to constrain which days are selectable
- `GET /api/v1/logbook/admin/earliest` — returns `{ earliest: string | null }` of the very first session date ever recorded
- `?from=YYYY-MM-DD&to=YYYY-MM-DD` query support on `GET /api/v1/logbook/admin` — enables batch fetching across an arbitrary date range for the export flow
- **Officers — Excel export** — "Export CSV" in the Officers admin panel replaced by "Export Excel"; generates a formatted `.xlsx` with a blue title block, bold column headers, and alternating row shading; file is named `officers-{tab}-{date}.xlsx`

### Changed
- **Changelog viewer — environment-aware `[Unreleased]` section** — in production the `[Unreleased]` heading and its contents are hidden so the latest released version is the first thing visible; in development (localhost) the section is shown with a `DEV` badge so in-progress notes remain visible to the team
- **Admin Office Duty — Export button** — now opens a modal instead of immediately downloading a single-day CSV; exports Excel (`.xlsx`) instead of CSV
- **Officers panel — Export CSV → Export Excel** — button label and file format updated

### Fixed
- Officer name combobox on `/logbook?action=checkout` showed "No matches found" for all input — `Promise.all` was silently swallowing the entire fetch when the committees endpoint failed; changed to `Promise.allSettled` so officers always load even if the committees request errors
- Organizations wide modal on mobile (≤700px) — the full parent `OrganizationCard` was too tall and pushed all sub-organization cards below the fold; replaced with a compact parent header row (44 px logo + org name + type tag + Facebook icon) on mobile; the full card is preserved on desktop; sub-org grid remains 2-column (≥380 px) and collapses to 1-column below 380 px

## [1.6.0] - 2026-05-28
### Added
- **Digital Office Logbook** — individual officers record physical presence in the CSG office in real time
  - TOTP-style rotating QR code (HMAC-SHA256, refreshes every 5 minutes) displayed on the office TV screen
  - `/logbook` — mobile check-in/out page (standalone, no nav header); reads `?token=` from URL, requests geolocation, validates student number identity
  - `/logbook/display` — kiosk display page (standalone); shows live QR + roster of officers currently on duty; now scales to any viewport via JS `transform: scale()` — no longer locked to 1920×1080
  - IP-gated QR token endpoint — `GET /api/v1/logbook/qr-token` returns 403 when request comes from outside the configured campus CIDR
  - Geofence validation — server rejects check-ins beyond a configurable radius (meters) from the saved office coordinates; gracefully disabled when `logbook_lat`/`logbook_lng` are not set
  - Student number identity verification — checked server-side only; `student_number` is never sent back to the client
  - Auto-checkout safeguard — `GET /api/v1/logbook/today` auto-closes any sessions still open from a previous calendar day (`auto_checkout = true`)
  - `/api/v1/logbook` route with 8 endpoints: `GET /qr-token`, `GET /today`, `GET /status/:officer_id`, `POST /checkin`, `POST /checkout`, `GET /admin`, `POST /admin/checkout`, `DELETE /admin/delete`
  - `logbook_sessions` table with indexes (`idx_logbook_officer`, `idx_logbook_date`, `idx_logbook_open`)
  - Settings keys `logbook_lat`, `logbook_lng`, `logbook_radius_m` — writable by admins in the Settings panel (Office location section)
- **Admin "Office Duty" panel** — browse logbook sessions by date; shows currently on-duty officers at top; force-checkout and hard-delete per session; registered in sidebar under Operations
- **Office Hours page — functional Google Maps** — `/office` now embeds a real Google Maps iframe pinned to the admin-configured `logbook_lat`/`logbook_lng` coordinates; falls back to campus address search when no coords are set; "Open in Google Maps ↗" link added below map

### Changed
- **Settings panel redesigned** — two-pane layout with nav rail (228 px) and content pane; CSS prefix `.st-*`; nav groups: Account, Modules, System; replaces the previous flat card-stack layout
- **Committee PINs** — inputs now default to `type="password"` (masked); per-field eye icon toggles visibility; copy button retained alongside the toggle; pins are write-only from the admin perspective
- **Password change form** — redesigned to match new `.st-*` settings style: "Current password" row (label + desc left, field right), "New password" row (label + desc left, two side-by-side New + Confirm fields right), save bar at bottom ("You'll stay signed in after saving." + Cancel + Change password); replaces the old inline-styled `PasswordForm` component
- **About section** — version updated to v1.6.0, last update date updated to May 28, 2026
- **Borrow equipment** — catalog uses VariantHybrid design (`.eq-*` CSS prefix); checkout uses BorrowCheckout design (`.chk-*` CSS prefix); 7-day availability strip per item with date-aware "X available / Fully Booked" badges
- **Office Hours page** — now derives live attendance data entirely from open logbook sessions (replaces the manual committee duty filing system); auto-polls every 60 s; office address corrected to "Old Building, 2nd Floor"
- **Organizations modal** — wide parent+sub-org modal now has `max-height: calc(100dvh - 40px)` and `overflow-y: auto`; overlay uses `align-items: flex-start` with vertical scroll so the modal is fully accessible on narrow viewports

### Removed
- **Committee office duty manual filing system** — removed `office_duties` table, `GET/POST /api/v1/office-duties/` endpoints, `CommitteeOfficeDuty` portal panel, `AdminOfficeDuty` admin panel, and all related committee duty PIN verification logic; replaced by the Digital Office Logbook
- **`student_number` from public officer API** — `GET /api/v1/officers/` no longer returns `student_number`; the field is used only server-side in `logbook.routes.js` for identity verification and never sent to the client
- **`PasswordForm` component** — password change UI inlined directly into Settings.tsx; standalone `PasswordForm.tsx` is no longer imported

### Fixed
- Organizations wide modal extends beyond viewport on screens narrower than 860 px — resolved by adding scroll and max-height constraints
- Logbook display page (`/logbook/display`) was fixed at 1920×1080 and cut off on smaller browser windows — resolved with JS viewport scaling via `transform: scale()`

## [1.5.0] - 2026-05-27
### Added
- **Committee Office Duty system** — committees can file which dates they will be in the CSG office
  - New `office_duties` table (`committee_id`, `duty_date`, `notes`, unique per committee+date)
  - Backend `GET /api/v1/office-duties/` — public; supports `?date=YYYY-MM-DD` and `?month=YYYY-MM` filters
  - Backend `POST /api/v1/office-duties/checkin` — PIN-verified duty filing; returns 409 on duplicate
  - Backend `DELETE /api/v1/office-duties/checkout` — PIN-verified duty removal
  - Backend `POST /api/v1/office-duties/admin/add` — admin bypass (no PIN required)
  - Backend `DELETE /api/v1/office-duties/admin/delete` — admin hard-delete by id
  - Backend `GET /api/v1/office-duties/admin` — paginated admin view with optional `?month=YYYY-MM`
  - Backend `POST /api/v1/committee-pins/verify-duty` — verifies a committee's duty PIN
  - `committees.duty_pin` column — set per-committee by admins; excluded from all public API responses
  - `CommitteeOfficeDuty` panel — committee portal panel for filing/removing duty dates with a calendar grid and notes
  - `OfficePage` (`/office`) — public page showing which committees are on duty per day; calendar + committee cards
  - `office.css` — styles for the public office hours page (`od-` prefix)
  - Admin panel "Office Duty" entry in Operations sidebar — `AdminOfficeDuty` panel for full admins
  - Committee portal extended: all three content roles (publication, secretariat, finance) can also access the Office Duty panel
  - Committee login dual-mode: **"Content Portal"** (existing 3 roles) and **"Office Duty"** (any active committee with a duty PIN)
  - `CommitteeProtectedRoute` now accepts both content and duty sessions
  - "Office Hours" added to Navigation Resources dropdown
- **Settings — Committee Duty PINs section** — admins can set or rotate duty PINs for all 10 committees directly from the Settings panel; write-only inputs (current PIN never displayed)
- **Borrow page — date-aware availability overlay**
  - Date picker defaults to today; capped at today +7 days (1-week reservation window)
  - Per-item availability fetched in parallel on date change; shows "X available", "X of Y free" (amber), or "Fully Booked" (red) badges
  - Fully-booked cards dim with reduced opacity; button changes to "Fully Booked"
  - Removed misleading static "● AVAILABLE / OUT" badge — replaced by date-specific status
  - Removed All/Available/Unavailable filter pills (redundant with date-aware display)
- **BorrowReservation — 7-day cap enforced on calendar** — dates beyond today +7 render as greyed/non-clickable via `DateStatus 'past'`; `handleDateSelect` also guards against out-of-window clicks
- **Office Hours page — 7-day window** — past dates and dates beyond today +7 are greyed and non-clickable; prev/next month nav disabled when navigating outside the window
- `supabase/migrations/010_committees_full_schema.sql` — idempotent backfill migration that adds all missing committees columns (`status`, `deleted_at`, `description`, `duty_pin`, `cover_image_path`, `chair_name`, `vice_chair_name`), patches NULL status rows, adds a check constraint, re-seeds the 10 committees, and sets all committee descriptions

### Changed
- Committee login tabs renamed: **"Content Access" → "Content Portal"**, **"File Office Duty" → "Office Duty"**; duty submit button renamed to "Sign In"
- Concurrent access limit raised from 10 → **35** slots (covers 30–40 concurrent deployment spec)
- `BorrowReservation` — AM/PM time slots now auto-set same-day return date when no return date has been selected yet
- Documents page (`/documents`) — pagination added (12 per page) matching the announcements page style; `getPageRange` threshold lowered to ≤3 so 5 pages renders as `1 2 … 5` instead of `1 2 3 4 5`
- Organizations grid — changed from 4-column centered to **3-column left-aligned** on both the `/organizations` page and the homepage section; prevents lone orphan card at the bottom
- Sub-organization indicator moved from floating card badge to **footer meta slot** on `OrganizationCard`; card height is now uniform regardless of sub-org status
- Sub-org cards in the wide org modal are now **clickable** — open a stacked detail modal (z-index 1010) with name, description, and Facebook link; Escape key closes sub-org modal first, then outer modal
- Hero section — `align-items` changed back to `center` with symmetric `var(--space-16)` padding so content is vertically centred with equal top and bottom space
- `committees` route public SELECT — removed `created_at` (column does not exist on the table); fixes persistent 500 error in the overhaul branch

### Fixed
- `/api/v1/committees` returning 500 — caused by `created_at` being selected from a table that has no such column
- `CLAUDE.md` schema entry for `committees` corrected: `id` is `uuid` (not INTEGER), `officers.committee` FK is `uuid`; full column list now documented

## [1.4.0] - 2026-05-26
### Added
- Committee admin portal at `/committee/admin` — role-based panel access via PIN login at `/committee/login`
  - Publication Committee: Announcements + Events panels
  - Secretariat Committee: Documents panel
  - Finance Committee: Equipment + Finance panels
- `CommitteeSidebar` — dedicated sidebar using existing `ad-sb-*` CSS classes; shows only allowed modules per role; signs out by clearing `sessionStorage`
- `CommitteeProtectedRoute` — UX gate that redirects to `/committee/login` when no valid committee session is present
- `CommitteeAdminPage` — mounts existing admin panel components inside the committee shell; hides embedded admin sidebar via CSS (`display: none !important`) without duplicating any panel code
- `committee-admin.css` — layout overrides for committee shell (`ca-` prefix); collapses `.ad-shell` grid to single-column when admin sidebar is hidden
- Backend `POST /api/v1/committee-pins/verify` — validates a committee PIN against the `settings` table and returns the matching role
- Backend `GET /api/v1/committee-pins` — returns all three current PINs (auth required)
- Backend `POST /api/v1/committee-pins/:role` — updates a single committee PIN (auth required, min 4 chars)
- Settings panel — Committee PINs section: per-committee PIN inputs with show/hide toggle and Update button; defaults `pub2026`, `sec2026`, `fin2026`
- Settings panel — Account Security now shows the current admin's name, email, and initials avatar above the password change form
- Finance admin panel — placeholder panel with "=== To Be Developed ===" content; registered in `Sidebar` and `ContentPanel` under Operations group
- Concurrent access limiter — backend `POST /api/v1/access/join`, `POST /api/v1/access/heartbeat`, `POST /api/v1/access/leave` endpoints (in-memory slot manager, MAX 10 simultaneous public users, 60 s TTL per token)
- `QueueScreen` component — shown when all 10 public slots are occupied; displays queue position, retries `POST /access/join` every 15 s, transitions to the site when a slot opens
- Root-layout access integration — on mount, calls `/access/join`; sends heartbeat every 20 s; releases slot via `navigator.sendBeacon('/access/leave')` on `beforeunload`
- Bulletin page pagination — 9 cards per page with Prev/Next and numbered pill buttons; resets to page 1 on filter or search change; smooth-scrolls to top on page change
- `vercel.json` at `frontend/` — SPA catch-all rewrite (`/(.*) → /index.html`) so direct navigation and page refresh work correctly on Vercel

### Changed
- CORS `origin` upgraded from a single string to a multi-origin function; `FRONTEND_URL` env var now accepts a comma-separated list (e.g. `https://csg-oits.vercel.app,http://localhost:5173`)
- Auth cookies (`sb_access_token`, `sb_refresh_token`) changed from `SameSite=Strict` to `SameSite=None` — required for cross-origin credentialed requests between the Vercel frontend and the separately hosted backend
- Local `.env` `FRONTEND_URL` updated to include both `http://localhost:5173` and `https://csg-oits.vercel.app`
- Finance panel now uses `<div className="ad-shell">` wrapper (was a bare React fragment) so the sidebar and content render side-by-side correctly

### Fixed
- 404 NOT_FOUND on direct navigation or page refresh on the deployed Vercel site — fixed by adding `vercel.json` SPA rewrite rule
- "Not authenticated." on all protected admin endpoints on the deployed site — root cause was `SameSite=Strict` cookies never being sent on cross-origin requests; fixed by changing to `SameSite=None; Secure`
- Finance panel content area was blank — bare fragment caused sidebar to stack above content with no grid layout; fixed by wrapping in `.ad-shell`
- 18 pre-existing TypeScript `noUnusedLocals` build errors resolved across 11 files:
  - Renamed destructured `spinning` getter to `_spinning` in Announcement, Auditlog, Bin, Committees, Document, Events, Officers panels (setter still needed for mutations)
  - Removed unused `TableFoot` import from Auditlog
  - Deleted unreachable `committeeSuggestions` function in Committees
  - Deleted unreachable `handlePermanentDelete` function in Events
  - Deleted unused `showInitials` local in Officer-card
  - Deleted unused `hasTerm` local in SearchFilterBar
  - Deleted unused `scrollToSection` local in Main layout
  - Renamed `selectedFromList` to `_selectedFromList` in Borrow page
- `TS1484` in `authError.ts` — changed `import { NavigateFunction }` to `import type { NavigateFunction }` (verbatimModuleSyntax)
- `TS2503` in `chrome.tsx` — `JSX.Element` not in scope; added `import React from 'react'` and changed return type to `React.ReactElement`
- `TS2322` in Officers panel — `editData.position` is `string | string[]` but `OfficerForm` expects `string`; coerced with `Array.isArray` join before passing as `initialData`
- `TS2345` in Root-layout — `fetchDocuments()` return type is `Document[] | PaginatedDocuments`; added `Array.isArray` guard before assigning to document state

## [1.3.0] - 2026-05-22
### Added
- Client-side pagination (25 rows/page) for Announcements, Documents, Events, and Borrowing admin tables — consistent with Officers table
- Paginated footer: "Showing X–Y of Z" with previous/next and numbered page buttons, ellipsis for large page counts
- Select-all checkbox on paginated tables now selects/deselects the current page only
- Committee edit modal — chairperson and vice chairperson fields with filter-as-you-type autocomplete
- Committee edit modal — member management: add/remove officers with live chip display
- Committee cover photo upload in add and edit modals
- `POST /committees/update-members` backend endpoint — assigns or removes officers from a committee in one round-trip
- `POST /committees/upload-cover` backend endpoint — uploads and stores committee cover image
- About page live stats: committees count now reflects real backend data (was hardcoded 12)
- `academicYear()` utility — converts a date to the correct Philippine academic year string (Aug–Jul calendar)

### Changed
- Changelog modal renders markdown properly (headings, bullet lists, bold, inline code, links) instead of displaying raw `.md` text
- Committee `editCommitteeSchema` now accepts optional `chair_name` and `vice_chair_name` fields
- `/committees/edit` route writes `chair_name` and `vice_chair_name` to the database
- `resolveChair()` in Committees panel does a name-match fallback to the officers list so the chair's real avatar is preserved after saving a text chair name
- Officers table select-all checkbox scoped to current page (not all filtered rows)
- Removed `TableFoot` import from modules now using inline paginated footer (Announcements, Documents, Events, Borrowing, Officers)
- `ChangelogModal` replaced raw `<pre>` block with inline markdown renderer — no new dependency added

### Fixed
- Chair/vice chair names were sent to the backend but silently discarded — Zod schema stripped unknown fields and the route only updated `name`
- Chair avatar disappeared after saving a chair name — `resolveChair` returned early with no `avatar` field when `chair_name` was set as text
- `update-members` endpoint now correctly invalidates both `officers:*` and `committees:*` cache keys

### Removed
- Husky pre-commit and pre-push hooks (`.husky/` directory deleted)
- lint-staged configuration (`.lintstagedrc.cjs` deleted, package uninstalled)
- `"prepare": "husky"` script removed from root `package.json`
- ESLint retained as a dev-only tool (editor integration and `npm run lint` still work)

## [1.2.0] - 2026-05-13
### Added
- Organizations panel — full CRUD with logo upload, Facebook link, archive/bin lifecycle
- Equipment borrowing system — multi-item borrow request form (public), approve/reject/return workflow (admin)
- Inventory management panel — add/edit/delete equipment with image upload
- Analytics route — 6-month monthly and 8-week weekly document upload charts
- Audit log route (`/api/v1/auditlog/`) — returns all audit entries with email resolution
- Borrowing route (`/api/v1/borrowing/`) — inventory and request management endpoints
- Changelog route (`/api/v1/changelog/`) — serves CHANGELOG.md as plain text
- Contributors public page (`/contributors`) — team credits with officer avatar lookup
- Borrow public page (`/borrow`) — equipment inventory grid + multi-item borrow form
- About page (`/about`) with live stats (officers, committees, documents)
- Admin Settings panel — active term management, account list, password change, changelog modal
- Admin Analytics section — bar chart, line chart, pie chart on dashboard
- Sidebar logout — calls `POST /user/logout` and clears localStorage session flag
- `GET /user/me` endpoint — returns current admin name, email, role
- `GET /user/list` endpoint — returns all admin accounts (profiles + auth users joined)
- `POST /user/change-password` endpoint — re-authenticates before updating password
- `POST /user/forgot-password` — always returns 200 (avoids user enumeration)
- `POST /user/reset-password` — one-time token password reset
- Bin panel two-tab structure — Deleted tab + Archived tab with restore/permanent delete
- Full archive/bin/restore lifecycle for events, organizations, and committees
- Pin/unpin for announcements — only one pinned at a time
- Term filter for officers, announcements, and documents
- `GET /officers/terms` endpoint — returns distinct term years from archived officers
- SessionExpiredModal — axios 401 interceptor triggers session expired overlay
- ChangelogModal in Settings — fetches GitHub Releases API
- PDF redaction visual selector (pdf-selector.tsx) in document add/edit form
- `docs/` directory with 12 documentation files

### Changed
- Route `GET /equipment/` now queries `inventory` table (not `equipment`)
- Dashboard summary endpoint returns pinned announcement data
- Officer archive now requires `term_year` in request body
- Rate limit split: public routes 100/15min, admin routes 500/15min
- Admin login uses `anonSupabase.auth.signInWithPassword` (was service key)

### Fixed
- UUID mismatch bug in officer edit (avatar storage path)
- Committee ID must be `parseInt()`-ed — Supabase returns wrong results with string comparison on integer column
- `profiles` table has no `id` column — fixed queries to use `owner_id` as primary key
- Cookie `secure: true` requires HTTPS — documented mkcert setup requirement

## [1.0.0] - 2026-05-12
### Added
- Public homepage with hero, announcements, events, about, officers, equipment sections
- Dedicated pages: /announcements, /documents, /events, /about, /officers, /equipment
- Admin panel with announcements, documents, events, officers, committees management
- Soft delete (archive) and hard delete for all content types
- Bin panel for reviewing and permanently deleting soft-deleted content
- Audit log panel with real log entries
- Dashboard with storage analytics and upload bar chart
- Equipment borrow request system
- PDF redaction integration for uploaded documents
- Supabase Auth with JWT session management and cookie-based tokens
- Admin whitelist and account management
- Design system tokens (tokens.css)
