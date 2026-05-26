# Changelog

All notable changes to CSG-OITS will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

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
