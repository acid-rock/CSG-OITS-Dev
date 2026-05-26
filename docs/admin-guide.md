# Admin Panel Guide

**Access URL:** `/admin` (requires authentication)
**Authentication:** Email + password via Supabase Auth

---

## Login

1. Navigate to `/admin/login`.
2. Enter your CSG-issued email and password.
3. On success, the backend sets two httpOnly cookies (`sb_access_token`, `sb_refresh_token`) and returns 200.
4. The frontend sets `localStorage.item('admin_authenticated', '1')` and navigates to `/admin`.

**On failure:** An error message is displayed inline. Common reasons: wrong credentials, email not confirmed.

**Session expiry:** If the access token expires and the refresh token is also invalid, any subsequent API call returns 401. The axios interceptor in `AdminPage.tsx` catches this and opens the `SessionExpiredModal`, which shows a "Session Expired" overlay. Clicking "Go to Login" clears the localStorage flag and navigates to `/admin/login`.

**Forgot password:** `/admin/forgot-password` — enter email, receive a reset link from Supabase. The link redirects to `/admin/reset-password` where a new password can be set.

---

## Sidebar navigation

The sidebar (left panel) is organized into three sections. Clicking any item sets `?panel=<key>` in the URL.

**Overview**
1. Dashboard

**Content**
2. Announcements
3. Documents
4. Events
5. Officers
6. Committees
7. Organizations

**Operations**
8. Equipment (Borrowing)
9. Audit Log
10. Contributors
11. Settings
12. Bin

The admin's name and initials avatar are displayed at the top of the sidebar, fetched from `GET /api/v1/user/me`. A Logout button at the bottom calls `POST /api/v1/user/logout` and clears the localStorage flag.

---

## Dashboard

**URL:** `/admin?panel=dashboard`
**Data sources:** `GET /dashboard/summary`, `GET /auditlog/?limit=5`, `GET /documents/`

**Stat cards:**
- Total Officers (from `summary.officers`)
- Total Documents (from `summary.documents`)
- Total Announcements (from `summary.announcements`)
- Total Events (from `summary.events`)

**Charts:**
- **Bar chart** — document uploads by ISO week (last 8 weeks), computed from the documents list
- **Line chart** — placeholder (view tracking not yet implemented)
- **Pie chart** — storage bucket breakdown (from `GET /dashboard/storage`)

**Recent Activity table:**
- Shows last 5 audit log entries
- Columns: Action, Entity, Admin, Timestamp
- Action color-coded: INSERT = green, UPDATE = blue, DELETE = red

---

## Announcements Panel

**URL:** `/admin?panel=announcement`
**Sidebar label:** Announcements

### Tabs

| Tab | Query | Description |
|---|---|---|
| Active | `GET /announcements/` | Currently live announcements |
| Archived | `GET /announcements/archived` | Permanent archive |
| Bin | `GET /announcements/bin` | Soft-deleted (recoverable) |

### Table columns (Active tab)

| Column | Description |
|---|---|
| Title | Announcement headline |
| Category | CSG Updates, Class Advisories, etc. |
| Term | Academic term |
| Date | Creation date |
| Pinned | Pin status indicator |
| Actions | Edit, Pin/Unpin, Move to Bin, Archive |

### Row actions

- **Edit** — opens the form modal with prefilled values
- **Pin / Unpin** — calls `POST /announcements/pin`. Only one can be pinned; all others are unpinned first
- **Move to Bin** — calls `POST /announcements/bin` (sets `deleted_at`); item moves to Bin tab
- **Archive** — calls `POST /announcements/archive` (sets `is_archived = true`); moves to Archived tab

### Bulk actions

Select multiple rows via checkboxes. Actionbar appears at the bottom:
- **Archive Selected** — calls `POST /announcements/archive` with array of IDs
- **Delete Selected** — calls `DELETE /announcements/delete` (hard delete — only from Bin tab)

### Add announcement

Click "Add Announcement" button → opens `Form.tsx` with `forType='announcement'`:

| Field | Type | Validation |
|---|---|---|
| Title | Text input | Required, 1–300 chars |
| Category | Dropdown | enum: CSG Updates / Class Advisories / Examinations / University Events / Official CVSU |
| Description | Textarea | Required, max 50000 chars |
| Image | File upload | JPEG / PNG / WebP, max 5 MB (optional) |

Submits to `POST /announcements/add` as `multipart/form-data`.

### Edit announcement

Same form as Add, prefilled. Submits to `POST /announcements/edit`. Image field is optional — existing image kept if no new file is provided.

### Bin tab actions

- **Restore** — calls `POST /announcements/restore-from-bin` (sets `deleted_at = null`)
- **Delete Permanently** — calls `DELETE /announcements/delete` (hard DELETE, irreversible)

### Filters

- **Search** — filters by title text
- **Category filter** — dropdown: All / CSG Updates / Class Advisories / etc.
- **Sort** — Newest / Oldest / Alphabetical

---

## Documents Panel

**URL:** `/admin?panel=documents`
**Sidebar label:** Documents

### Tabs

| Tab | Query |
|---|---|
| Active | `GET /documents/` |
| Archived | `GET /documents/archived` |
| Bin | `GET /documents/bin` |

### Table columns (Active tab)

| Column | Description |
|---|---|
| Name | Document display name |
| Category | Document type/category |
| Term | Academic term |
| Date uploaded | Creation date |
| Actions | Edit, Archive, Move to Bin |

### Add document

`Form.tsx` with `forType='document'`:

| Field | Type | Validation |
|---|---|---|
| Title (Name) | Text input | Required, alphanumeric + spaces/hyphens/underscores, max 200 chars |
| Type | Dropdown | Activity Proposal, Resolution, Memorandum, etc. |
| Term | Text input | "AY YYYY-YYYY" format (optional) |
| Description | Textarea | Max 1000 chars (optional) |
| PDF File | File upload | PDF only, max 20 MB |

**PDF Redaction workflow:**
1. Admin uploads a PDF.
2. The **PDF Selector** overlay opens — admin can draw redaction boxes over sensitive areas.
3. On submit, the backend sends the PDF + bounding boxes to `PDF_REDACT_URL` microservice.
4. The microservice returns a redacted PDF.
5. A thumbnail PNG is generated.
6. Both are stored in Supabase Storage (`documents` and `thumbnails` buckets).

Submits to `POST /documents/add` as `multipart/form-data`.

### Filters

- **Search** — filters by name or description
- **Category filter** — dynamically computed from loaded data
- **Sort** — Name A-Z / Z-A, Date Newest / Oldest

---

## Events Panel

**URL:** `/admin?panel=events`
**Sidebar label:** Events

### Tabs

| Tab | Query |
|---|---|
| Active | `GET /events/` |
| Archived | `GET /events/archived` |
| Bin | `GET /events/bin` |

### Table columns

| Column | Description |
|---|---|
| Name | Event name |
| Date | Date the event happened |
| Images | Count of attached images |
| Term | Academic term |
| Actions | Edit, Archive, Move to Bin |

### Add / Edit event

`Form.tsx` with `forType='event'`:

| Field | Type | Validation |
|---|---|---|
| Event Name | Text input | Required, max 300 chars |
| Description | Textarea | Required, max 50000 chars |
| Date | Date picker | YYYY-MM-DD format (required) |
| Photo 1 | File upload | JPEG/PNG/WebP, max 5 MB (optional) |
| Photo 2 | File upload | Optional |
| Photo 3 | File upload | Optional |

In edit mode, existing images are shown. New uploads replace individual slots (`image_0`, `image_1`, `image_2`).

### Filters

- **Date filter** — All / Today / This Week / This Month

---

## Officers Panel

**URL:** `/admin?panel=officers`
**Sidebar label:** Officers

### Tabs

| Tab | Query |
|---|---|
| Active | `GET /officers/` |
| Archived | `GET /officers/archived` |
| Bin | Officers with `deleted_at IS NOT NULL` |

### Table columns

| Column | Description |
|---|---|
| Avatar | Officer photo (circular) |
| Name | Full name |
| Position | Title/role |
| Type | executive / board / adviser / former |
| Committee | Assigned committee (if any) |
| Year Serving | Academic year |
| Actions | Edit, Archive, Delete |

### Add / Edit officer

`OfficerForm.tsx`:

| Field | Type | Validation |
|---|---|---|
| Full Name | Text input | Required, max 200 chars |
| Position | Text input | Required, max 200 chars |
| Type | Dropdown | executive / board / adviser / former |
| Committee | Dropdown | Populated from `GET /committees/` (optional) |
| Facebook URL | Text input | Valid URL (optional) |
| Term (S.Y.) | Text input | Required if type = former |
| Student Number | Text input | Max 20 chars (optional) |
| Is Committee Official | Checkbox | Marks as committee chair/head |
| Avatar | File upload | JPEG/PNG/WebP, max 5 MB (optional) |

Submits to `POST /officers/add` or `POST /officers/edit`.

### Archive action

Archives an officer with a required `term_year`. Calls `POST /officers/archive`. The officer moves to the Archived tab and their `status` becomes `'archived'`.

### Filters

- **Type filter** — All / Executive / Board / Adviser / Former
- **Sort** — Name, Date

---

## Committees Panel

**URL:** `/admin?panel=committees`
**Sidebar label:** Committees

### Tabs

| Tab | Query |
|---|---|
| Active | `GET /committees/` |
| Archived | `GET /committees?status=archived` |
| Bin | ⚠️ PARTIAL — `deleted_at` migration not yet run |

### Table columns

| Column | Description |
|---|---|
| ID | Integer primary key |
| Name | Committee name (inline-editable) |
| Actions | Edit, Archive, Delete |

### Inline rename

Click a committee name or Edit button → the cell becomes an input. Save updates via `POST /committees/edit`. Cancel discards changes.

### Bulk archive

Select multiple committees via checkboxes → "Archive Selected" calls `POST /committees/archive` with an array of integer IDs.

**Important:** `id` values are always `parseInt()`-ed before sending to the backend.

---

## Organizations Panel

**URL:** `/admin?panel=organizations`
**Sidebar label:** Organizations

### Tabs

| Tab | Query |
|---|---|
| Active | `GET /organizations/` |
| Archived | `GET /organizations/archived` |
| Bin | `GET /organizations/bin` |

### Table columns

| Column | Description |
|---|---|
| Logo | Circular avatar (initials fallback) |
| Name | Organization name |
| Facebook | Link (if set) |
| Actions | Edit, Archive, Move to Bin, Delete |

### Add / Edit organization

Modal form:

| Field | Type | Validation |
|---|---|---|
| Name | Text input | Required, max 200 chars |
| Description | Textarea | Max 2000 chars (optional) |
| Facebook Link | URL input | Valid URL (optional) |
| Logo | File upload | JPEG/PNG/WebP, max 5 MB (optional) |

Submits to `POST /organizations/add` or `POST /organizations/edit`.

---

## Equipment / Borrowing Panel

**URL:** `/admin?panel=borrowing`
**Sidebar label:** Equipment

Two sub-tabs: **Borrow Requests** and **Inventory**.

### Borrow Requests sub-tab

**Data source:** `GET /borrowing/requests?status=<filter>`

**Table columns:**

| Column | Description |
|---|---|
| Borrower Name | Student name |
| Student ID | Student ID number |
| Equipment | Item requested |
| Quantity | Units requested |
| Borrow Date | Requested date |
| Status | pending / approved / rejected / returned |
| Actions | Approve / Reject / Return / Delete |

**Expandable rows:** Clicking a row expands to show: organization, position, contact number, purpose type, activity name, venue, time of use, email.

**Status filter:** All / Pending / Approved / Rejected / Returned

**Row actions:**

| Action | API call | When available |
|---|---|---|
| Approve | `POST /borrowing/approve` with optional notes | When status = pending |
| Reject | `POST /borrowing/reject` with reason | When status = pending |
| Mark Returned | `POST /borrowing/return` | When status = approved |
| Delete | `DELETE /borrowing/requests/delete` | Always |

**Approve/Reject modal:** Shows a textarea for admin notes/reason before confirming.

### Inventory sub-tab

**Data source:** `GET /borrowing/inventory`

**Table columns:** Name, Available Qty, Total Units, Status badge, Actions

**Add equipment inline form:**

| Field | Type |
|---|---|
| Equipment Name | Text (required) |
| Total Units | Integer ≥ 1 (required) |
| Equipment Image | File (optional) |

Submits to `POST /borrowing/inventory/add`.

**Edit:** Same form, prefilled. Submits to `POST /borrowing/inventory/edit`.

**Delete:** Two-stage confirmation (toggle → confirm). Calls `DELETE /borrowing/inventory/delete`.

---

## Audit Log Panel

**URL:** `/admin?panel=auditlog`
**Sidebar label:** Audit Log
**Data source:** `GET /auditlog/`

**Read-only.** All admin write operations are automatically logged.

**Table columns:**

| Column | Description |
|---|---|
| Action | INSERT / UPDATE / DELETE (color-coded) |
| Entity | Table affected (e.g., `bulletin`) |
| Record ID | Shortened UUID of the affected record |
| Admin | Email of the admin who performed the action |
| Date & Time | Formatted as "MMM D, YYYY h:mm A" |

**Filter:** All / Today / This Week / This Month

**Row click** highlights the row (no bulk action — audit log is read-only).

---

## Contributors Panel

**URL:** `/admin?panel=contributors`
**Sidebar label:** Contributors

Displays the hardcoded development team. Officer avatars are fetched by matching full names from `GET /officers/` to resolve profile photos.

**Team members:**
1. Ivan P. Duran — Committee Chair, Web Development
2. John Harold R. Magma — Project Coordinator / GAD Representative
3. Lorenz E. Tuboro — Back-End Developer
4. Ralph Kenneth B. Perez — UI/UX Designer
5. Jerald D. Estrella — Front-End Developer
6. Taisei Domingo — Front-End Developer
7. Gerald D. Alansalon — Documentation Officer

---

## Settings Panel

**URL:** `/admin?panel=settings`
**Sidebar label:** Settings

### Section A — General System Settings

**Administration Term dropdown:**
- Fetches available terms from `GET /officers/terms`
- Saving calls `POST /settings/term` with the selected term
- The active term controls officer filtering across all public pages

**Pause Access toggle:**
- Opens `PauseAccessModal` to confirm
- ⚠️ The pause access behavior is configured but the exact implementation depends on the active deployment

### Section B — Admin Accounts

- Fetches admin accounts from `GET /user/list`
- Columns: Email, Role, Remove button
- **Remove button:** ⚠️ PARTIAL — button is visible but the click handler is a `console.log` placeholder. Removing admins is not yet implemented.

### Section C — Account Security

- `PasswordForm` component
- Fields: Current Password, New Password, Confirm New Password
- Validates that new ≠ current, passwords match, ≥ 8 characters
- Submits to `POST /user/change-password`

### Section D — About

- Version: v1.2.0 Stable
- Last Updated date
- **View System Changelog** button → opens `ChangelogModal` which fetches release notes from the GitHub Releases API (`VITE_GITHUB_OWNER` / `VITE_GITHUB_REPO`)

---

## Bin Panel

**URL:** `/admin?panel=bin` (also accessible from sidebar: Bin)

### Deleted tab

Shows all soft-deleted items (items with `deleted_at IS NOT NULL`) across:
- Announcements (`GET /announcements/bin`)
- Documents (`GET /documents/bin`)
- Events (`GET /events/bin`)
- Organizations (`GET /organizations/bin`)

**Per-row actions:**
- **Restore** — calls the appropriate `restore-from-bin` endpoint (sets `deleted_at = null`)
- **Delete Permanently** — calls the appropriate hard-delete endpoint (irreversible)

**Bulk actions:** Select multiple items (same type) → floating Actionbar appears with Restore and Delete options.

**30-day policy:** Items in the Bin for more than 30 days should be purged. ⚠️ PARTIAL — no automated scheduler exists. Purge must be done manually via `DELETE /documents/bin/purge` or by selecting items and deleting from the panel.

### Archived tab

Shows permanently archived records (items with `is_archived = true` or `status = 'archived'`) across all content types:
- Announcements (`GET /announcements/archived`)
- Documents (`GET /documents/archived`)
- Events (`GET /events/archived`)
- Officers (`GET /officers/archived`)

These are permanent historical records and are never auto-purged.

**Per-row action:** **Restore** only — calls the appropriate `restore` endpoint to move back to Active.

---

## Shared components

### Form.tsx

Universal form modal for Announcements, Documents, and Events. Controlled by `forType` prop. See per-panel sections above for field details.

### DeleteModal.tsx

Confirmation modal for hard deletes. Requires clicking "Delete Permanently" to confirm. The request body shape varies by `source` prop (announcement, document, event, officer, committee, settings).

### Actionbar.tsx

Floating bar that appears when items are selected. Shows count of selected items, Archive and Delete buttons. Calls `ConfimationModal` before executing destructive bulk operations.

### SessionExpiredModal.tsx

Full-screen overlay triggered by axios 401 interceptor. Shows session expired message. Clicking "Go to Login" clears localStorage and navigates to `/admin/login`.

### ConfimationModal.tsx

Generic yes/no dialog used before bulk destructive operations. Red "Confirm" button, gray "Cancel".

### ChangelogModal.tsx

Fetches release notes from GitHub Releases API using `VITE_GITHUB_OWNER` and `VITE_GITHUB_REPO` env vars. Displays in scrollable modal overlay.
