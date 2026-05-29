=============================================================================
CSG-OITS — COMPLETE CHANGE LOG
Online Information Transparency System for CVSU Imus CSG
Generated: 2026-05-01
=============================================================================

This document records every file created or modified from the initial
codebase analysis through the final production-ready state.

=============================================================================
SYSTEM OVERVIEW (FINAL STATE)
=============================================================================

Stack:
  Frontend  : React 19.2 + TypeScript 5.9 + Vite 7.2
  Backend   : Node.js ESM + Express 5.2
  Database  : Supabase (PostgreSQL + Auth + Storage)
  Auth      : Supabase email/password, httpOnly cookie session
  External  : PDF redaction microservice at PDF_REDACT_URL

Public routes: / (homepage), /bulletin, /officers
Admin routes:  /admin (protected), /admin/login, /admin/forgot-password, /bin

Admin panels: Dashboard, Announcements, Documents, Events,
              Officers, Committees, Bin, Audit Log, Contributors, Settings

API base path: /api/v1
Rate limit: 100 req / 15 min (all routes)

=============================================================================
WAVE 1 — CRITICAL RUNTIME CRASHES + AUTHENTICATION PLUMBING
=============================================================================

MODIFIED  backend/src/routes/announcements.routes.js
  - Added: import ApiError from '../lib/apiError.js'
  - Fixed: res.send(200) → res.sendStatus(200) (3 occurrences: /add, /edit, /delete)

MODIFIED  backend/src/routes/documents.routes.js
  - Added: import ApiError from '../lib/apiError.js'
  - Removed: dangling `if (error) throw new Error(error.message)` on former line 173
              (error was out of scope inside the /edit handler)

MODIFIED  backend/src/routes/user.routes.js
  - Added: import ApiError from '../lib/apiError.js'
  - Added: import { requireAuth } from '../middlewares/auth.middleware.js'
  - Added: requireAuth middleware guard on POST /register
  - Added: POST /logout route — clears sb_access_token and sb_refresh_token cookies
           (httpOnly: true, secure: true, sameSite: 'none')

MODIFIED  backend/src/middlewares/audit.middleware.js
  - Added: import { supabase } from '../lib/supabaseClient.js'
  - Fixed: req.supabase.rpc(...) → supabase.rpc(...) (req.supabase was never set)
  - Removed: console.log of user sub (security/noise)

MODIFIED  backend/src/routes/events.routes.js
  - Fixed: POST /add now includes date_happened in the upsert payload
           (was missing — all new events had null event date)
  - Removed: // NOTE TO SELF comment about date_happened

CREATED   frontend/src/admin/ProtectedRoute.tsx
  - Reads localStorage flag 'admin_authenticated' (set on login, cleared on logout)
  - Renders <Outlet /> if authenticated, redirects to /admin/login otherwise
  - Note: httpOnly cookies cannot be read by JS; localStorage flag is the
           client-side auth indicator. Backend requireAuth is the real enforcer.

MODIFIED  frontend/src/main.tsx
  - Restructured /admin route to use <ProtectedRoute> as a layout wrapper
    with <AdminPage> as a child index route (required for Outlet to work)
  - Added /bin route under ProtectedRoute that redirects to /admin?panel=bin

MODIFIED  frontend/src/admin/admin-loginpage/login/Login.tsx
  - Made inputs controlled (added email, password, loading, error state)
  - Added async handleSubmit: POST to /user/login, set localStorage flag on
    success, navigate to /admin, display error message on failure
  - Added disabled state on submit button during request

MODIFIED  frontend/src/admin/components/sidebar/Sidebar.tsx
  - Added import axios
  - Added handleLogout: POST /user/logout, clear localStorage flag, redirect
    to /admin/login (fires on success or error — always redirects)
  - Wired to the Log Out button onClick

=============================================================================
WAVE 2 — CONNECT ADMIN PANEL TO REAL API
=============================================================================

MODIFIED  frontend/src/admin/components/form/Form.tsx
  - Added import axios; replaced hardcoded fetch() with axios.post()
  - Fixed wrong API paths (/api/announcement/upload → /api/v1/announcements/add)
  - Added VITE_API_URL-based URL construction
  - Added withCredentials: true on all requests
  - Added onSuccess?: () => void prop — called after successful submit
  - Made handleSubmit async; calls setOpen(false) + onSuccess() on success
  - Added backend-expected field name mappings:
      announcements: appends 'content' alongside 'description'
      documents: appends 'name' alongside 'title'
      events: appends 'name', 'date_happened', multiple 'images'
  - Appends 'id' to FormData on edit operations
  - Extended forType to include 'event':
      adds date field, multi-image file input (up to 3), event endpoints

MODIFIED  frontend/src/admin/components/modals/deleteModal/DeleteModal.tsx
  - Added import axios; replaced fetch() with axios.delete()
  - Fixed wrong API paths
  - Added withCredentials: true
  - Restructured sourceConfig from URL-path format to body-based format:
      announcement: DELETE /announcements/delete  body=[{id}]
      document:     DELETE /documents/delete      body=[{id, name}]
      event:        DELETE /events/delete         body={id}
      settings:     DELETE /user/whitelist        body={id}
  - Added optional name?: string | null prop (file_path for document deletion)
  - Added 'event' to DeleteSource type
  - (Later in Wave 6) Added 'officer' and 'committee' to DeleteSource type

MODIFIED  frontend/src/admin/panel/announcement/Announcement.tsx
  - Replaced hardcoded announcementConfig mock with live BulletinEntry interface
  - Added axios.get /announcements/ on mount with loading/error states
  - Added fetchData useCallback; passed as onSuccess and onConfirm to children
  - Removed window.location.reload() calls — replaced with fetchData()
  - Selection key changed from fileName to real entry.id
  - Shows actual imgUrl thumbnail in table

MODIFIED  frontend/src/admin/panel/documents/Document.tsx
  - Same pattern as Announcement.tsx with DocumentEntry interface
  - Tracks selectedName (file_path) separately for document deletes
    (backend delete requires both id + name to remove storage file)
  - Added formatDate helper for createdAt ISO timestamps

CREATED   frontend/src/admin/panel/events/Events.tsx
  - Full Events admin panel matching Announcement.tsx structure
  - EventEntry interface with id, name, description, date, created_at, images
  - Fetches /events on mount; loading/error states
  - Table: Name, Date, Description, Actions (Edit/Delete)
  - Reuses Form.tsx (forType='event') and DeleteModal.tsx (source='event')
  - Refetches on mutations

MODIFIED  frontend/src/admin/contentPanel/ContentPanel.tsx
  - Imported Events panel
  - Registered 'events' → <Events /> in the panel array

MODIFIED  frontend/src/admin/components/sidebar/dashboard-buttonConfig.tsx
  - Added Events button (name: 'events') between Documents and Contributors

=============================================================================
WAVE 3 — MISSING BACKEND FEATURES (TASKS 3 & 4)
=============================================================================

CREATED   backend/src/routes/settings.routes.js
  - GET /settings: reads first row from settings table; returns defaults
    { system_name: 'CSG-OITS', logo_url: null, access_paused: false }
    if no row exists
  - POST /settings (requireAuth): upserts into settings table with onConflict: 'id'
  - Comment: TABLE NAME UNVERIFIED — confirm in Supabase dashboard

MODIFIED  backend/src/app.js
  - Added import settingsRoutes
  - Registered app.use('/api/v1/settings', settingsRoutes)
  - (Wave 6) Added import analyticsRoutes; registered /api/v1/analytics

MODIFIED  frontend/src/admin/components/settings-form/general-form/SettingsForm.tsx
  - Added useEffect to fetch GET /settings on mount; populates form fields
  - Replaced TODO comment in handleSubmit with axios.post to /settings
  - Added success message ('Settings saved.') and error message display

MODIFIED  backend/src/routes/user.routes.js
  - Added POST /forgot-password: calls supabase.auth.resetPasswordForEmail(email)
    Always returns 200 regardless of whether email exists (avoids enumeration)

MODIFIED  frontend/src/admin/admin-loginpage/forgot/Forgot.tsx
  - Removed 2FA step and new-password step entirely
  - New 3-step flow: email → confirmation → success/redirect
    Step 1: POST /user/forgot-password with email
    Step 2: "Check your email for a password reset link." screen
    Step 3: Success screen redirects to /admin/login (was /bin — fixed)
  - Supabase handles OTP delivery and password reset via email link

=============================================================================
WAVE 4 — MODERATE BUG FIXES + CODE CORRECTNESS
=============================================================================

CREATED   frontend/src/admin/utils/filterByDate.ts
  - Extracted shared filterByDate(date, filter) function from three panel files
  - TypeScript typed; exported for use across announcement, document, audit panels

MODIFIED  frontend/src/admin/panel/announcement/Announcement.tsx
  - Removed inline filterByDate definition
  - Added: import { filterByDate } from '../../utils/filterByDate'

MODIFIED  frontend/src/admin/panel/documents/Document.tsx
  - Same filterByDate removal + import

MODIFIED  frontend/src/admin/panel/auditlog/Auditlog.tsx
  - Same filterByDate removal + import

MODIFIED  frontend/src/bulletin-layouts/latest-updates/LatestUpdates.tsx
  - Fixed sort: Number(b.id) - Number(a.id) → new Date(b.created_at) comparator
    (UUIDs cast to Number() always produce NaN, making sort a no-op)
  - Removed: console.log(documents)

MODIFIED  frontend/src/config/committeeConfig.ts
  - Removed: await fetchCommittees() at module top level
    (was triggering a network request on every import of the module)

MODIFIED  frontend/src/layout/officer-layout/Officer.tsx
  - Added: getPosition(pos: string | string[]): string helper at top of file
    returns Array.isArray(pos) ? pos[0] : pos
  - Replaced all position[0] accesses with getPosition(officer.position)
  - (Wave 5) Also passes socials prop to all OfficerCard usages

MODIFIED  frontend/src/route/officers/Officers.tsx
  - Fixed: committeeMembers filter now excludes is_committee_official === true
    (officials were appearing in both the officials section and members dropdown)
  - (Wave 5) Fixed: inline Facebook href="#" → conditional href={official.socials}

MODIFIED  backend/src/routes/announcements.routes.js
  - Fixed: all 3 occurrences of res.send(200) → res.sendStatus(200)
    (/add, /edit, /delete — res.send(200) sent "200" as body text)

MODIFIED  backend/src/routes/documents.routes.js
  - Fixed: res.send(200) → res.sendStatus(200) in /add and /delete

MODIFIED  backend/src/routes/events.routes.js
  - Fixed: res.send(200) → res.sendStatus(200) in /add, /edit, /delete
  - Removed: console.log(req.headers) from /edit handler

MODIFIED  backend/src/middlewares/auth.middleware.js
  - Fixed: token refresh now sets cookies with secure: true, sameSite: 'none'
    (was: secure commented out, sameSite: 'strict' — mismatched login settings)

MODIFIED  frontend/src/layout/events-section/events.tsx
  - Removed: console.log(events)

MODIFIED  frontend/src/layout/main-section/Main.tsx
  - Fixed typo: "Trasparency" → "Transparency"
  - Fixed typo: "accesible" → "accessible"

MODIFIED  frontend/src/layout/about-section/About.tsx
  - Fixed typo: "GOVERMENT" → "GOVERNMENT" (both occurrences)

MODIFIED  frontend/src/layout/document-section/Document.tsx
  - Completed truncated placeholder subtitle sentence

=============================================================================
WAVE 5 — NEW FEATURES
=============================================================================

MODIFIED  frontend/src/root-layout/Root-layout.tsx
  - Added loading state (true on init); renders centered "Loading..." indicator
  - Added error state (null on init); renders centered error + "Try again" button
  - Wrapped Promise.all in try/catch/finally — sets error on any failure
  - fetchAll wrapped in useCallback for use as "Try again" handler
  - (Wave 7) Added is_pinned?: boolean to Announcement type
  - (Wave 7) Sorts bulletin after fetch: pinned first, then preserves API order

MODIFIED  frontend/src/components/officer-card/Officer-card.tsx
  - Added socials?: string | null prop
  - Conditionally renders <a href={socials} target="_blank"> around FaFacebook
    icon only when socials is truthy — hidden when null or empty string

MODIFIED  frontend/src/layout/officer-layout/Officer.tsx
  - Passes socials={o.socials} to all three OfficerCard usages
    (executives, board members, advisers)
  - Adviser section now also uses getPosition() for type safety

MODIFIED  frontend/src/admin/components/action-bar/Actionbar.tsx
  - Added 'event' to ActionbarSource type
  - Added onSuccess?: () => void prop
  - Implemented handleDelete with ConfimationModal confirmation:
      announcement/document: bulk DELETE with [{id}] array body
      event: individual DELETE with {id} body (loops through selectedIds)
  - handleMove, handleArchive, handleApprove: replaced console.log stubs
    with // TODO: implement [action] operation comments
  - Added import axios and ConfimationModal

MODIFIED  frontend/src/admin/panel/events/Events.tsx
  - Fixed: Actionbar source='announcement' → source='event'
  - Added: onSuccess={fetchData} to Actionbar

MODIFIED  backend/src/routes/documents.routes.js
  - Added: transformDocument() helper extracted from inline map
  - Added: optional page/limit query parameters
    - Without params: returns flat array (backward compat with Root-layout)
    - With params: returns { data, total, page, limit } paginated format

MODIFIED  backend/src/routes/officers.routes.js
  - Added: transformOfficer() helper extracted from inline map
  - Added: same optional page/limit pagination as documents

MODIFIED  frontend/src/config/documentsConfig.ts
  - Added: optional page?: number, limit?: number parameters
  - Without params: calls backend without params, returns flat array
  - With params: returns { data, total, page, limit }
  - Added TypeScript interfaces: DocumentItem, PaginatedDocuments

MODIFIED  frontend/src/config/officerConfig.ts
  - Added: optional page?: number, limit?: number parameters
  - Same conditional return pattern as documentsConfig
  - Added TypeScript interfaces: OfficerItem, PaginatedOfficers

CREATED   backend/.env.example
  - Documents all 7 required backend environment variables with explanations:
    SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY,
    SUPABASE_JWT_SECRET, PDF_REDACT_URL, FRONTEND_URL, PORT

CREATED   frontend/.env.example
  - Documents VITE_API_URL with note that it must include /api/v1

CREATED   README.md (project root: CSG-OITS-Dev/)
  - Project description, architecture overview
  - Prerequisites and local setup steps
  - Complete API endpoint reference table
  - PDF redaction microservice documentation
  - (Wave 7) Added Database Setup section with migration run order,
    storage bucket creation, RLS notes, and increment_views() SQL

=============================================================================
WAVE 6 — DASHBOARD ANALYTICS + OFFICERS/COMMITTEES CRUD + DOCUMENT BIN
=============================================================================

--- TASK 1: Dashboard Real Analytics ---

CREATED   backend/src/routes/analytics.routes.js
  - GET /analytics (requireAuth)
  - Returns: total_officers, total_documents, documents_this_week,
             total_announcements, total_events (all from Supabase COUNT queries)
  - Returns: uploads_by_month (last 6 months, documents + announcements grouped by month)
  - Returns: views_by_week (last 8 weeks — upload count used as engagement proxy
             until increment_views() DB function is set up)
  - Note: views_by_week comment documents the manual step for real view tracking

MODIFIED  backend/src/app.js
  - Added import analyticsRoutes
  - Registered app.use('/api/v1/analytics', analyticsRoutes)

MODIFIED  backend/src/routes/announcements.routes.js
  - Added: // MANUAL STEP comment for increment_views RPC in GET /

MODIFIED  backend/src/routes/documents.routes.js
  - Added: // MANUAL STEP comment for increment_views RPC in GET /

MODIFIED  backend/src/routes/events.routes.js
  - Added: // MANUAL STEP comment for increment_views RPC in GET /

MODIFIED  frontend/src/admin/components/charts/bar-chart/Barchart.tsx
  - Changed from hardcoded Math.random() data to prop-driven:
    accepts labels: string[] and datasets: ChartDataset[]
  - useEffect re-runs on data change (JSON.stringify deps)
  - Shows "Uploads by Month" and last-entry count in header

MODIFIED  frontend/src/admin/components/charts/line-chart/Linechart.tsx
  - Same prop-driven change as Barchart
  - Shows "Activity by Week" in header

MODIFIED  frontend/src/admin/panel/dashboard/Dashboard.tsx
  - Fetches /analytics on mount with loading/error states
  - Replaced hardcoded "15 Total Officers" / "8 Documents" with real API values
  - Passes uploads_by_month to Barchart (documents + announcements datasets)
  - Passes views_by_week to Linechart

--- TASK 2: Officers + Committees CRUD ---

MODIFIED  backend/src/routes/officers.routes.js
  - Added multer upload (memoryStorage, 5MB limit)
  - Added: POST /add (requireAuth, upload.single('avatar'))
      Validates full_name, position, type
      Inserts row, then uploads avatar to officers storage bucket
      Avatar path: {generated_uuid}.{ext}
  - Added: POST /edit (requireAuth, upload.single('avatar'))
      Accepts any subset of officer fields
      If new avatar: deletes old from storage, uploads new
  - Added: DELETE /delete (requireAuth)
      Accepts array of ids; deletes avatar from storage then DB row

MODIFIED  backend/src/routes/committee.routes.js
  - Added imports: createUserClient, supabase, requireAuth, ApiError
  - Added: POST /add (requireAuth) — validates name, inserts committee
  - Added: POST /edit (requireAuth) — validates id + name, updates by id
  - Added: DELETE /delete (requireAuth) — checks if any officers reference
    this committee (refuses with 400 if count > 0), then deletes

MODIFIED  frontend/src/admin/components/modals/deleteModal/DeleteModal.tsx
  - Added 'officer' source: DELETE /officers/delete body=[id] array
  - Added 'committee' source: DELETE /committees/delete body={id: parseInt(id)}

CREATED   frontend/src/admin/panel/officers/OfficerForm.tsx
  - Local form component (Form.tsx does not support 'officer' type)
  - Fields: full_name, position, type (select), committee (select from API),
            socials, year_serving, student_number, is_committee_official (checkbox),
            avatar (file upload)
  - Fetches committees on mount for the dropdown
  - Submits to /officers/add or /officers/edit via FormData + axios

CREATED   frontend/src/admin/panel/officers/Officers.tsx
  - Fetches /officers + /committees on mount (parallel Promise.all)
  - Maps committee IDs to names for table display
  - Table: Full Name (with avatar thumbnail), Position, Type, Committee,
           Year Serving, Actions (Edit/Delete)
  - Follows exact pattern as Announcement.tsx (loading/error, refetch)
  - Uses OfficerForm for add/edit, DeleteModal (source='officer') for delete

CREATED   frontend/src/admin/panel/committees/Committees.tsx
  - Fetches /committees on mount
  - Inline add form (name input + Add Committee button)
  - Inline row edit (input appears in-row, Save/Cancel buttons)
  - Table: ID, Name, Actions (Edit/Delete)
  - Uses DeleteModal (source='committee') for delete

MODIFIED  frontend/src/admin/contentPanel/ContentPanel.tsx
  - Added imports: OfficersPanel, CommitteesPanel, Bin
  - Registered panels: 'officers', 'committees', 'bin'

MODIFIED  frontend/src/admin/components/sidebar/dashboard-buttonConfig.tsx
  - Added: Officers button (name: 'officers')
  - Added: Committees button (name: 'committees')
  - Added: Bin button (name: 'bin', icon: bin.png)

--- TASK 3: Document Bin with Soft Delete ---

MODIFIED  backend/src/routes/documents.routes.js
  - Added migration comment block at top of file (manual schema steps required)
  - Modified GET /: added .eq('is_deleted', false) to both paginated and flat queries
  - Modified DELETE /delete: changed from hard delete to soft delete
      Updates is_deleted=true, deleted_at=now() — does NOT delete storage files
  - Added GET /bin (requireAuth): returns is_deleted=true rows, sorted by deleted_at desc
      Returns same shape as GET / plus deleted_at field
  - Added POST /restore (requireAuth): accepts array of ids
      Updates is_deleted=false, deleted_at=null for each
  - Added DELETE /bin/purge (requireAuth):
      If specific ids in body: purges only those items regardless of age
      If empty body: purges all is_deleted=true items older than 30 days
      For each item: deletes from documents + thumbnails storage, then hard-deletes row
      Returns { purged: number }

CREATED   frontend/src/route/bin/Bin.tsx
  - Full bin panel component (used both via /admin?panel=bin and /bin redirect)
  - Fetches /documents/bin on mount; loading/error states
  - Table: Thumbnail, File Name, Description, Deleted At, Actions
  - Per-row Restore button (POST /restore)
  - Per-row Permanent Delete button (DELETE /bin/purge with single id)
  - Bulk selection with Restore (selected) and Delete Permanently (selected) buttons
  - "Purge >30 days" button with empty body (deletes all eligible items)
  - ConfimationModal required before any permanent delete action

MODIFIED  frontend/src/main.tsx
  - Added /bin route under ProtectedRoute
  - Renders: <Navigate to="/admin?panel=bin" replace />

=============================================================================
WAVE 7 — DOCUMENT SEARCH, ANNOUNCEMENT PINNING, SCHEMA MIGRATIONS
=============================================================================

--- TASK 1: Public Document Search ---

MODIFIED  frontend/src/bulletin-layouts/documents/BulletinDocuments.tsx
  - Added searchQuery state (initialized to '')
  - Added search input above category nav (inline styles matching existing design)
  - filteredDocuments now applies BOTH category AND search filters simultaneously
  - Search matches on doc.name (file_path) and doc.description (case-insensitive)
  - Empty state: displays "No documents found." paragraph when no results

--- TASK 2: Announcement Pinning ---

MODIFIED  backend/src/routes/announcements.routes.js
  - Added: // MANUAL STEP comment block for is_pinned column at top of file
  - Modified GET /: added .order('is_pinned', {ascending:false}) primary sort
                    added .order('created_at', {ascending:false}) secondary sort
  - Modified GET / payload: added is_pinned: row.is_pinned ?? false to each item
  - Added POST /pin (requireAuth):
      Validates id (required) and is_pinned (must be boolean)
      Updates bulletin row by id, sets is_pinned to provided value
      Returns sendStatus(200)

MODIFIED  frontend/src/root-layout/Root-layout.tsx
  - Added is_pinned?: boolean to Announcement type
  - After bulletinData fetch, sorts array: pinned first, preserves API order within groups

MODIFIED  frontend/src/admin/panel/announcement/Announcement.tsx
  - Added is_pinned?: boolean to BulletinEntry interface
  - Added import { Pin, PinOff } from 'lucide-react'
  - Added handleTogglePin: POST /announcements/pin with {id, is_pinned: !current}
    then refetches data
  - Added pin toggle button in Actions column (Pin icon = unpinned, PinOff = pinned)
  - Pinned rows: background #fef9c3 (amber-50) applied via inline style
  - Pinned rows: small "Pinned" amber badge rendered in the File Name cell

--- TASK 3: Supabase Schema Migration Files ---

CREATED   supabase/migrations/001_initial_schema.sql
  - CREATE TABLE IF NOT EXISTS for all 9 base tables:
    profiles, bulletin, documents, events, committees, officers,
    whitelist, settings, audit_logs
  - Each table has a comment explaining its purpose
  - committees.id: uuid (NOT integer — audit trigger requires uuid primary keys)
  - committees: UNIQUE (name) constraint
  - officers.committee: uuid FK referencing committees(id)
  - officers.position: jsonb (stores array of role strings per officer)
  - officers.type: CHECK IN ('executive','board','adviser','member','former')
  - officers: UNIQUE (full_name, year_serving) for idempotent seed
  - settings.id: text PRIMARY KEY DEFAULT 'default' (singleton row pattern)
  - audit_logs: columns match existing Supabase audit_trigger_function schema
      (entity, entity_id uuid, created_by, old_data jsonb, new_data jsonb)
  - CREATE OR REPLACE FUNCTION set_audit_context(user_id, ip_address, user_agent)
      Sets app.audit_* session variables read by the audit trigger

CREATED   supabase/migrations/002_soft_delete_documents.sql
  - ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false
  - ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at timestamptz
  - UPDATE documents SET is_deleted = false WHERE is_deleted IS NULL (back-fill)

CREATED   supabase/migrations/003_announcement_pinning.sql
  - ALTER TABLE bulletin ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false
  - UPDATE bulletin SET is_pinned = false WHERE is_pinned IS NULL (back-fill)

CREATED   supabase/seed.sql
  - INSERT settings default row (system_name: 'CSG-OITS')
  - INSERT 10 CSG committees (2025-2026 names from officers-board-members config)
  - INSERT 74 officers using LEFT JOIN to committees by name
      Resolves committee integer IDs from source CSV to UUIDs automatically
      position stored as jsonb arrays (e.g. '["President"]'::jsonb)
      UNIQUE (full_name, year_serving) conflict key prevents duplicate seeding
      Apostrophes escaped (Dean Levi''s); encoding fixed (Cañares)
      Duplicate row 'Craven Mish Norbe' omitted with explanatory comment

MODIFIED  README.md
  - Added Database Setup section (after Local Setup):
    * Supabase project creation
    * Migration run order (001 → 002 → 003)
    * seed.sql run instructions
    * Storage bucket list and public access requirement
    * RLS note
    * increment_views() optional SQL code block

=============================================================================
POST-WAVE SCHEMA FIXES (Applied after Supabase errors during setup)
=============================================================================

ISSUE: audit_trigger_function() requires uuid primary keys on all tables.
       committees and settings used integer GENERATED ALWAYS AS IDENTITY.
       This caused "expression is of type bigint" errors.

ISSUE: audit_logs had wrong column names (record_id, table_name, user_id)
       vs what audit_trigger_function inserts (entity_id, entity, created_by).

SQL run in Supabase to fix existing project:
  DROP TABLE IF EXISTS officers; DROP TABLE IF EXISTS committees;
  CREATE TABLE committees (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL);
  CREATE TABLE officers (...committee uuid REFERENCES committees(id)...);
  DROP TABLE IF EXISTS settings;
  CREATE TABLE settings (id text PRIMARY KEY DEFAULT 'default', ...);
  DROP TABLE IF EXISTS audit_logs;
  CREATE TABLE audit_logs (id uuid, action text, entity text, entity_id uuid,
    old_data jsonb, new_data jsonb, created_at timestamptz, created_by uuid,
    ip_address text, user_agent text);

All of the above are reflected in the updated 001_initial_schema.sql.

MODIFIED  backend/src/routes/officers.routes.js
  - Fixed: committee ? parseInt(committee) : null
         → committee || null (×2, in /add and /edit handlers)
    (parseInt of a UUID string returns NaN; committee IDs are now uuid strings)

MODIFIED  frontend/src/admin/panel/committees/Committees.tsx
  - Changed: interface CommitteeEntry { id: number } → { id: string }
  - Changed: editingId state type number | null → string | null
  - Changed: handleEditSave parameter id: number → id: string

MODIFIED  frontend/src/admin/panel/officers/Officers.tsx
  - Changed: committee?: number | null → committee?: string | null in OfficerEntry
  - Changed: committeeName helper parameter type number → string

=============================================================================
OFFICER DATA IMPORT FIXES (Applied after CSV analysis)
=============================================================================

Issues found in officers_rows.csv:
  1. Integer IDs → officers table uses uuid (auto-generate, skip CSV id column)
  2. Integer committee references (1-10) → uuid FKs (resolve by name join in seed)
  3. 13 CSV fields vs 11 table columns (2 trailing empty columns — ignored)
  4. position stored as JSON arrays ["President"] → required jsonb column type
  5. type values 'member' and 'former' not in original CHECK constraint

MODIFIED  frontend/src/admin/panel/officers/OfficerForm.tsx
  - Added <option value='member'>Member</option> to type select
  - Added <option value='former'>Former</option> to type select

MODIFIED  supabase/seed.sql
  - Added complete officers INSERT (74 officers from the 2025-2026 CSG roster)
  - Uses CTE-style SELECT FROM (VALUES...) LEFT JOIN committees for committee lookup
  - Covers: 7 executives, 9 board members, 2 advisers, 1 former, 55 committee members
  - ON CONFLICT (full_name, year_serving) DO NOTHING for idempotency

MODIFIED  supabase/migrations/001_initial_schema.sql
  - officers.position: text → jsonb
  - officers.type CHECK: added 'member' and 'former'
  - officers: added UNIQUE (full_name, year_serving) constraint
  - committees: added UNIQUE (name) constraint

=============================================================================
COMPLETE FILE MANIFEST
=============================================================================

NEWLY CREATED FILES:
  backend/src/routes/analytics.routes.js
  backend/src/routes/settings.routes.js
  backend/.env.example
  frontend/src/admin/utils/filterByDate.ts
  frontend/src/admin/panel/events/Events.tsx
  frontend/src/admin/panel/officers/OfficerForm.tsx
  frontend/src/admin/panel/officers/Officers.tsx
  frontend/src/admin/panel/committees/Committees.tsx
  frontend/.env.example
  supabase/migrations/001_initial_schema.sql
  supabase/migrations/002_soft_delete_documents.sql
  supabase/migrations/003_announcement_pinning.sql
  supabase/seed.sql
  README.md
  CHANGES.md (this file)

MODIFIED FILES — BACKEND:
  backend/src/app.js
  backend/src/middlewares/audit.middleware.js
  backend/src/middlewares/auth.middleware.js
  backend/src/routes/announcements.routes.js
  backend/src/routes/committee.routes.js
  backend/src/routes/documents.routes.js
  backend/src/routes/events.routes.js
  backend/src/routes/officers.routes.js
  backend/src/routes/user.routes.js

MODIFIED FILES — FRONTEND (Admin):
  frontend/src/admin/admin-loginpage/forgot/Forgot.tsx
  frontend/src/admin/admin-loginpage/login/Login.tsx
  frontend/src/admin/components/action-bar/Actionbar.tsx
  frontend/src/admin/components/charts/bar-chart/Barchart.tsx
  frontend/src/admin/components/charts/line-chart/Linechart.tsx
  frontend/src/admin/components/form/Form.tsx
  frontend/src/admin/components/modals/deleteModal/DeleteModal.tsx
  frontend/src/admin/components/settings-form/general-form/SettingsForm.tsx
  frontend/src/admin/components/sidebar/Sidebar.tsx
  frontend/src/admin/components/sidebar/dashboard-buttonConfig.tsx
  frontend/src/admin/contentPanel/ContentPanel.tsx
  frontend/src/admin/panel/announcement/Announcement.tsx
  frontend/src/admin/panel/auditlog/Auditlog.tsx
  frontend/src/admin/panel/dashboard/Dashboard.tsx
  frontend/src/admin/panel/documents/Document.tsx
  frontend/src/admin/panel/officers/OfficerForm.tsx
  frontend/src/admin/panel/settings/Settings.tsx  [unchanged — still uses hardcoded whitelist]
  frontend/src/admin/ProtectedRoute.tsx

MODIFIED FILES — FRONTEND (Public):
  frontend/src/bulletin-layouts/documents/BulletinDocuments.tsx
  frontend/src/bulletin-layouts/latest-updates/LatestUpdates.tsx
  frontend/src/components/officer-card/Officer-card.tsx
  frontend/src/config/committeeConfig.ts
  frontend/src/config/documentsConfig.ts
  frontend/src/config/officerConfig.ts
  frontend/src/layout/about-section/About.tsx
  frontend/src/layout/document-section/Document.tsx
  frontend/src/layout/events-section/events.tsx
  frontend/src/layout/main-section/Main.tsx
  frontend/src/layout/officer-layout/Officer.tsx
  frontend/src/main.tsx
  frontend/src/root-layout/Root-layout.tsx
  frontend/src/route/bin/Bin.tsx
  frontend/src/route/officers/Officers.tsx

MODIFIED FILES — SUPABASE:
  supabase/migrations/001_initial_schema.sql
  supabase/seed.sql

=============================================================================
MANUAL STEPS REQUIRED (NOT IN CODE — MUST BE DONE IN SUPABASE DASHBOARD)
=============================================================================

1. Run migrations in order in the SQL Editor:
     001_initial_schema.sql → 002_soft_delete_documents.sql → 003_announcement_pinning.sql

2. Run seed.sql (fill in or verify committee names before running)

3. Create 5 PUBLIC storage buckets:
     bulletin, documents, thumbnails, events, officers

4. (Optional) Create the increment_views() function for view tracking:
     SQL is documented in README.md > Database Setup > Optional: View Tracking

5. (Optional) Create audit triggers on committees and officers tables
     (both were recreated during schema fix; triggers were dropped with the tables):
     CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE
       ON committees FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
     CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE
       ON officers FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

6. Create first admin user:
     Supabase Dashboard → Authentication → Users → Add user → Create new user

7. Fill backend/.env with real production credentials

8. Fill frontend/.env with production VITE_API_URL

=============================================================================
KNOWN REMAINING ITEMS (OUT OF SCOPE — NOT IMPLEMENTED)
=============================================================================

  - Settings.tsx (admin): whitelist list still uses hardcoded data
    (Wave 3 Tasks 1 & 2 for audit log endpoint + whitelist backend were
    not included in the prompts delivered to this session)
  - Auditlog.tsx (admin): still uses hardcoded mock data array
    (real audit log GET endpoint not built)
  - Dashboard.tsx: "Pending Requests" banner uses static text
    (no approval workflow exists in the system)
  - Dashboard.tsx: charts use upload counts as views proxy
    (real view tracking requires the increment_views() DB function)
  - Officer/Committee admin panels: no pagination controls in UI
    (backend pagination API is ready; UI controls are out of scope)
  - PDF redaction microservice: source is in wrong location
    (frontend/src/admin/components/pdf-selector-components/main.py
    should be moved to services/redact/ before production)

=============================================================================
BUG FIX SESSION — 2026-05-28
=============================================================================

--- FIX 1: Organization modal vertical centering ---

MODIFIED  frontend/src/components/organization-card/OrganizationCard.css
  - Added: margin: auto to .org-modal and .org-modal--wide
    (flex children with margin: auto center themselves inside the overlay
    while preserving scroll behavior for tall content)
  - Changed: align-items on .org-modal--wide from flex-start → center
    (the parent card was flushed to the top of the overlay)

--- FIX 2: Document modal close button overlap ---

MODIFIED  frontend/src/components/document-modal/DocumentModal.tsx
  - Added: <div className="modal__header"> wrapping a <span className="modal__title">
    (document filename) and the existing × close <button>
  - The Google Docs Viewer iframe "Pop out" button cannot be removed (cross-origin);
    moving the custom close button into a header row above the iframe eliminates
    the collision

MODIFIED  frontend/src/components/document-modal/documentmodal.css
  - Added: .modal__header — flex row with space-between, border-bottom
  - Added: .modal__title — truncated single-line text with flex: 1
  - Changed: .modal__close — removed absolute positioning; now a flex item in header
  - Changed: .modal__iframe — from height: 100% to flex: 1; min-height: 0
    (required for flex child to fill remaining space after header)

--- FIX 3: Borrow equipment checkboxes non-functional ---

MODIFIED  frontend/src/route/borrow/BorrowCheckout.tsx
  - Replaced: <label> wrapping hidden <input type="checkbox"> for each purpose type
  - Added: <div role="checkbox" aria-checked={...} tabIndex={0}> with onClick and
    onKeyDown (Enter key) handlers
  - Root cause: native label→input click delegation caused the state toggle to fire
    twice (once from the label, once forwarded to the input), leaving state unchanged

--- FIX 4: Reset password "Auth Session Missing" ---

MODIFIED  backend/src/routes/user.routes.js  (POST /user/reset-password)
  - Removed: createUserClient(access_token).auth.updateUser({ password })
    which fails with "Auth Session Missing" because Supabase checks for an
    in-memory session, not just an Authorization header
  - Added: supabase.auth.getUser(access_token) to verify the token and resolve
    the user ID server-side
  - Added: supabase.auth.admin.updateUserById(userId, { password: new_password })
    to set the new password via the service key (no in-memory session required)

--- FIX 5: Reset password focus loss on every keystroke ---

MODIFIED  frontend/src/admin/admin-loginpage/reset/Reset.tsx
  - Moved: Shell layout component from inside Reset (defined as a nested function)
    to module level as a named function above Reset
  - Root cause: a component defined inside another component gets a new reference
    on every render, causing React to unmount and remount the entire subtree on
    every state update — focus was lost after each keypress
  - Removed: autoFocus from the New Password <input>
    (autoFocus was re-applied on every remount, stealing focus from Confirm field)

--- FIX 6: Settings geofence — narrow field, static tip, no map ---

MODIFIED  frontend/src/admin/panel/_shared/admin-settings.css
  - Changed: geofence grid column from 1fr 1fr 110px → 1fr 1fr 160px
    (radius input was too narrow to read values > 3 digits)

MODIFIED  frontend/src/admin/panel/settings/Settings.tsx
  - Added: savedGeoRadius state; populated on fetch and after successful save
  - Added: buildGeofenceMap(lat, lng, radiusM) helper at module level — generates
    a self-contained HTML string with Leaflet 1.9.4 + OpenStreetMap tiles,
    a marker at the office coordinates, and a blue circle at the configured radius
  - Replaced: Google Maps embed iframe (cannot draw circles) with <iframe srcDoc>
    using the Leaflet HTML; sandbox="allow-scripts" restricts the iframe
  - Changed: tip text radius value from hardcoded "200 m" to dynamic
    savedGeoRadius || geoRadius || '150' so it reflects the saved value

--- FIX 7: Dashboard — Office Geofence map card ---

MODIFIED  frontend/src/admin/panel/dashboard/Dashboard.tsx
  - Added: geoLat, geoLng, geoRadius state
  - Added: buildGeofenceMap() helper (same implementation as Settings.tsx)
  - Added: fetchGeoConfig() — reads logbook_lat, logbook_lng, logbook_radius_m
    from /api/v1/settings/:key in parallel; wired into the main useEffect
  - Added: "Office Geofence" card below Recent Activity in the left column;
    conditionally rendered only when valid coordinates are saved; contains the
    Leaflet iframe (240 px height) and an Edit button linking to the settings panel

--- FIX 8: Logbook combobox — "No matches found" for middle-initial names ---

MODIFIED  frontend/src/route/logbook/LogbookCheckin.tsx  (OfficerCombobox)
  - Changed: officer name filter from simple name.includes(search) to word-by-word
    matching: search.trim().toLowerCase().split(/\s+/).every(w => name.includes(w))
  - Root cause: "john harold magma" is not a continuous substring of
    "john harold r. magma" due to the middle initial; word-based matching finds
    each word independently regardless of what separates them

--- FIX 9: Logbook combobox — officers not loading (silent crash) ---

MODIFIED  frontend/src/route/logbook/LogbookCheckin.tsx  (parseFirstPosition)
  - Added: typeof raw !== 'string' guard in the early-return condition
  - Root cause: at least one officer record in the database has a non-string
    position value; passing it to parseFirstPosition() caused
    "TypeError: raw.split is not a function"; the error was thrown inside the
    Promise.allSettled().then() callback with no .catch(), silently preventing
    setOfficers() from being called — the officers array stayed empty

--- FIX 10: Logbook check-in — misleading "Location verified" label ---

MODIFIED  frontend/src/route/logbook/LogbookCheckin.tsx  (check-in form)
  - Changed: "Location verified" → "Location acquired"
  - Changed: "You're within the CSG office radius." →
    "Coordinates captured — radius will be verified on check-in."
  - Root cause: the geofence check runs server-side on POST /checkin; the
    frontend status only indicates that navigator.geolocation returned coordinates,
    not that the coordinates are within the configured radius

=============================================================================
BUG FIX SESSION — 2026-05-29
=============================================================================

--- FIX 1: TypeScript build error TS2367 in LogbookCheckin.tsx ---

MODIFIED  frontend/src/route/logbook/LogbookCheckin.tsx  (check-in form onChange)
  - Removed: if (phase === 'already-in') setPhase('form') from inside the
    if (phase === 'form') render block
  - Root cause: TypeScript narrows phase to 'form' inside the form branch,
    making the 'already-in' comparison always false — flagged as TS2367
  - The already-in → form reset is already handled by the "Not me" button
    in the already-in render block (setPhase('form') + setOfficerId(''))

--- FIX 2: Announcement category tag displaying "Notice" instead of actual category ---

MODIFIED  frontend/src/route/bulletin/Bulletin.tsx
  - Changed: getTagClass and getTagLabel call sites from (ann as any).type
    → (ann as any).category (the .type field does not exist on bulletin records;
    .category is the correct DB field)
  - Changed: getTagLabel now returns the category string as-is instead of
    mapping to hardcoded "Notice" / "Event" / "Update" — all category values
    ("Examinations", "Class Advisories", "University Events", etc.) now display
  - Changed: getTagClass parameter renamed type → category for clarity;
    keyword-based CSS class mapping (event, update, notice) is unchanged

--- FIX 3: Announcement category tag illegible on images ---

MODIFIED  frontend/src/route/bulletin/bulletin.css  (.bl-card-tag)
  - Added: background: rgba(0, 0, 0, 0.52) !important
  - Added: color: #fff !important
  - Added: backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px)
  - Root cause: global .tag-notice background is rgba(79,111,209,0.08) — nearly
    transparent; when overlaid on noisy or dark announcement images, the text
    was unreadable; the override applies only to .bl-card-tag (image overlay)
    and does not affect the pinned card tag which sits on a white panel

--- FIX 4: Announcement and event modal content collapsing newlines ---

MODIFIED  frontend/src/components/modal/Modal.tsx
  - Replaced: <p className="modal-description">{description}</p>
  - Added: <div className="modal-description"> with description.split(/\n\n+/)
    mapped to individual <p> elements; within each paragraph, split('\n')
    mapped to <span> + <br> for single line breaks
  - Effect: double (or more) newlines become paragraph spacing; single newlines
    become <br> within a paragraph; applies to all callers (announcements,
    events, homepage announcement section, latest-updates section)

MODIFIED  frontend/src/components/modal/modal.css
  - Added: .modal-description p { margin: 0 0 0.85em; }
  - Added: .modal-description p:last-child { margin-bottom: 0; }
  - Required because existing margin: 0 on .modal-description zeroed out
    default browser paragraph spacing inside the container

--- FIX 5: Organizations hero stat cards orphaned layout ---

MODIFIED  frontend/src/route/organizations/organizations.css
  - Changed: .po-hero-stats default grid-template-columns from
    repeat(3, auto) → repeat(4, auto)  (4×1 on wide screens)
  - Changed: ≤768px breakpoint from 1fr 1fr 1fr → 1fr 1fr  (2×2)
  - Changed: ≤480px breakpoint from repeat(3, 1fr) → 1fr 1fr  (2×2)
  - Root cause: 3-column default caused the 4th card (ROTC) to orphan
    on a second row with a wide empty gap beside it

=============================================================================
END OF CHANGE LOG
=============================================================================
