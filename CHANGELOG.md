# Changelog

All notable changes to CSG-OITS will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

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
