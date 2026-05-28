# Changelog

All notable changes to CSG-OITS will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

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
