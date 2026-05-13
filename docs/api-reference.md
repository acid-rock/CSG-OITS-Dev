# API Reference

**Base URL:** `/api/v1`
**Authentication:** httpOnly cookie `sb_access_token` (Supabase JWT)
**Rate limits:** Public routes — 100 req/15 min | Admin routes — 500 req/15 min
**Content-Type:** `application/json` for JSON bodies; `multipart/form-data` for file uploads
**Health check:** `GET /health` → `200 OK` (no auth, no rate limit)

---

## User / Auth

Rate limit: `adminLimiter` (500/15 min)

---

### `POST /api/v1/user/login`

**Auth required:** No
**Middleware:** `validate(loginSchema)`

**Request body:**
```json
{ "email": "admin@example.com", "password": "secret" }
```

**Validation:**
- `email` — valid email format (required)
- `password` — non-empty string (required)

**Response (200):**
```json
{ "message": "Login successful." }
```
Sets two httpOnly cookies: `sb_access_token` (1 h), `sb_refresh_token` (7 d).

**Errors:** `400` missing fields | `500` Supabase auth error

---

### `POST /api/v1/user/logout`

**Auth required:** No

**Request body:** none

**Response (200):** empty

Clears `sb_access_token` and `sb_refresh_token` cookies.

---

### `POST /api/v1/user/register`

**Auth required:** Yes
**Middleware:** `requireAuth`

**Request body:**
```json
{
  "role": "admin",
  "email": "newadmin@cvsu.edu.ph",
  "password": "SecurePass1",
  "studentNumber": "2021-00001",
  "fullname": "Juan Dela Cruz",
  "nickname": "Juan"
}
```

**Validation:** manual — email and password required; studentNumber required

**Response (200):**
```json
{ "message": "Account for 2021-00001, successfully created. Please confirm your email to proceed." }
```

**Notes:** Creates Supabase Auth user via `supabase.auth.admin.createUser()` + inserts row into `profiles`. Email confirmation required before the account can log in.

**Errors:** `400` missing fields | `500` Supabase error

---

### `GET /api/v1/user/me`

**Auth required:** Yes
**Middleware:** `requireAuth`

**Response (200):**
```json
{ "name": "Juan", "email": "admin@cvsu.edu.ph", "role": "admin" }
```

`name` is resolved from `user_metadata.full_name` or derived from the email prefix.

**Errors:** `401/403` not authenticated | `500` profile fetch failed

---

### `POST /api/v1/user/forgot-password`

**Auth required:** No

**Request body:**
```json
{ "email": "admin@cvsu.edu.ph" }
```

**Response (200):** always 200 (avoids user enumeration)

Calls `supabase.auth.resetPasswordForEmail()` with redirect to `{FRONTEND_URL}/admin/reset-password`.

---

### `POST /api/v1/user/reset-password`

**Auth required:** No (uses one-time access_token from email link)

**Request body:**
```json
{ "access_token": "supabase-ott-token", "new_password": "NewPass1" }
```

**Validation:** `new_password` ≥ 8 characters; `access_token` required

**Response (200):** empty

**Errors:** `400` validation failure

---

### `POST /api/v1/user/change-password`

**Auth required:** Yes
**Middleware:** `requireAuth`

**Request body:**
```json
{
  "current_password": "OldPass1",
  "new_password": "NewPass2",
  "confirm_password": "NewPass2"
}
```

**Validation:** all fields required; passwords must match; new ≠ current; new ≥ 8 characters

**Response (200):** empty

Re-authenticates with `current_password` before updating.

**Errors:** `400` validation | `401` wrong current password | `500` server error

---

### `GET /api/v1/user/whitelist`

**Auth required:** Yes
**Middleware:** `requireAuth`

**Response (200):**
```json
[{ "id": "uuid", "email": "...", "full_name": "...", "student_id": "...", "created_at": "..." }]
```

---

### `POST /api/v1/user/whitelist`

**Auth required:** Yes
**Middleware:** `requireAuth`

**Request body:**
```json
{ "email": "student@cvsu.edu.ph", "full_name": "Maria Santos", "student_id": "2022-00001" }
```

At least one of `email` or `student_id` is required.

**Response (200):** empty

---

### `DELETE /api/v1/user/whitelist`

**Auth required:** Yes
**Middleware:** `requireAuth`

**Request body:**
```json
{ "id": "whitelist-row-uuid" }
```

**Response (200):** empty

**Errors:** `400` missing id

---

### `GET /api/v1/user/list`

**Auth required:** Yes
**Middleware:** `requireAuth`

**Response (200):**
```json
[{ "id": "uuid", "owner_id": "uuid", "role": "admin", "email": "admin@cvsu.edu.ph" }]
```

Joins `profiles` table with `auth.admin.listUsers()`. Falls back gracefully if auth admin call fails.

---

## Announcements

Rate limit: `publicLimiter` (100/15 min) on GET; `adminLimiter` on write routes.

---

### `GET /api/v1/announcements/`

**Auth required:** No

**Response (200):**
```json
[{
  "id": "uuid",
  "title": "CSG Update",
  "content": "...",
  "created_at": "2026-01-01T00:00:00Z",
  "category": "CSG Updates",
  "is_pinned": false,
  "is_archived": false,
  "term_year": "AY 2025-2026",
  "imgUrl": "https://supabase.../bulletin/uuid.jpg"
}]
```

Returns active records (`is_archived = false AND deleted_at IS NULL`), sorted pinned-first.

---

### `GET /api/v1/announcements/archived`

**Auth required:** Yes

Returns archived announcements (`is_archived = true AND deleted_at IS NULL`), sorted newest first.

---

### `GET /api/v1/announcements/bin`

**Auth required:** Yes

Returns soft-deleted announcements (`deleted_at IS NOT NULL`), sorted newest first.

---

### `POST /api/v1/announcements/add`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(addAnnouncementSchema)`, `multer` (single image `image`)

**Request body:** `multipart/form-data`
```
title       string, 1–300 chars (required)
content     string, 1–50000 chars (required)
category    enum: CSG Updates | Class Advisories | Examinations | University Events | Official CVSU (default: CSG Updates)
term_year   string, format: "AY YYYY-YYYY" (optional)
image       file (JPEG/PNG/WebP, max 5 MB, optional)
```

**Response (201):**
```json
{ "message": "Announcement created successfully.", "data": { "id": "uuid", "title": "..." } }
```

**Notes:** Image uploaded to `bulletin` storage bucket as `{id}.jpg`. Audit logged.

**Errors:** `400` validation | `415` unsupported image type | `413` file too large | `500` DB/storage error

---

### `POST /api/v1/announcements/edit`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(editAnnouncementSchema)`, `multer` (optional image)

**Request body:** `multipart/form-data`
```
id          uuid (required)
title       string (optional)
content     string (optional)
category    enum (optional)
term_year   string (optional)
image       file (optional — replaces existing image)
```

**Response (200):** `{ "message": "Announcement updated." }`

**Notes:** If new image provided, old image is deleted from storage before upload. Audit logged.

---

### `POST /api/v1/announcements/pin`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(singleIdSchema)`

**Request body:** `{ "id": "uuid" }`

**Response (200):** `{ "message": "Announcement pinned." }`

**Notes:** Unpins all other announcements first (sets `is_pinned = false` on all), then sets target to `is_pinned = true`. Only one pinned announcement at a time.

---

### `POST /api/v1/announcements/archive`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(deleteIdsSchema)`

**Request body:** `{ "ids": ["uuid", "uuid"] }`

**Response (200):** `{ "message": "Archived." }`

Sets `is_archived = true` on matching records. Audit logged.

---

### `POST /api/v1/announcements/restore`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(deleteIdsSchema)`

**Request body:** `{ "ids": ["uuid"] }`

**Response (200):** `{ "message": "Restored." }`

Sets `is_archived = false`. Audit logged.

---

### `POST /api/v1/announcements/bin`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(deleteIdsSchema)`

**Request body:** `{ "ids": ["uuid"] }`

**Response (200):** `{ "message": "Moved to bin." }`

Sets `deleted_at = now()`. Audit logged.

---

### `POST /api/v1/announcements/restore-from-bin`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(deleteIdsSchema)`

**Request body:** `{ "ids": ["uuid"] }`

**Response (200):** `{ "message": "Restored from bin." }`

Sets `deleted_at = null`. Audit logged.

---

### `DELETE /api/v1/announcements/delete`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(deleteIdsSchema)`

**Request body:** `{ "ids": ["uuid"] }`

**Response (200):** `{ "message": "Deleted." }`

Hard DELETE from DB + deletes image from `bulletin` storage bucket. Audit logged. Only call from Bin view.

---

## Documents

Rate limit: `publicLimiter` on GET; `adminLimiter` on writes.

---

### `GET /api/v1/documents/`

**Auth required:** No

**Query params:** `?page=1&limit=20` (optional pagination)

**Response (200):**
```json
[{
  "id": "uuid",
  "name": "Resolution 2025-001",
  "description": "...",
  "category": "Resolution",
  "term_year": "AY 2025-2026",
  "created_at": "...",
  "url": "https://supabase.../documents/uuid.pdf",
  "thumbnail": "https://supabase.../thumbnails/uuid.png"
}]
```

Returns active records. Without pagination returns flat array; with pagination returns `{ data, total, page, limit }`.

---

### `GET /api/v1/documents/archived`

**Auth required:** Yes

Returns archived documents.

---

### `GET /api/v1/documents/bin`

**Auth required:** Yes

Returns soft-deleted documents.

---

### `POST /api/v1/documents/add`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(addDocumentSchema)`, `multer` (single PDF `file`)

**Request body:** `multipart/form-data`
```
name          string, 1–200 chars, alphanumeric + spaces/hyphens/underscores (required)
type          string, 1–100 chars, alphanumeric + hyphens only (required)
description   string, max 1000 chars (optional)
term_year     string, "AY YYYY-YYYY" format (optional)
file          PDF file, max 20 MB (required)
redact_areas  JSON string — array of {x, y, width, height, page} bounding boxes (optional)
```

**Response (201):** `{ "message": "Document uploaded successfully.", "data": {...} }`

**Notes:** PDF sent to `PDF_REDACT_URL` microservice for redaction. Thumbnail generated. Both stored in Supabase Storage (`documents`, `thumbnails` buckets). Audit logged.

**Errors:** `400` validation | `415` non-PDF file | `413` file > 20 MB | `500` redaction/storage error

---

### `POST /api/v1/documents/edit`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(editDocumentSchema)`, optional multer

**Request body:** `multipart/form-data`
```
id          uuid (required)
name        string (optional)
type        string (optional)
description string (optional)
term_year   string (optional)
file        PDF file (optional — replaces existing file)
```

**Response (200):** `{ "message": "Document updated." }`

**Notes:** If new file: old PDF deleted from storage, new uploaded + re-redacted + new thumbnail generated. File moved (renamed) in storage if name changed. Audit logged.

---

### `POST /api/v1/documents/archive`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(deleteIdsSchema)`

**Request body:** `{ "ids": ["uuid"] }`

**Response (200):** `{ "message": "Archived." }`

---

### `POST /api/v1/documents/restore`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(deleteIdsSchema)`

**Request body:** `{ "ids": ["uuid"] }`

**Response (200):** `{ "message": "Restored." }`

---

### `POST /api/v1/documents/bin`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(deleteIdsSchema)`

**Request body:** `{ "ids": ["uuid"] }`

**Response (200):** `{ "message": "Moved to bin." }`

Sets `deleted_at = now()`.

---

### `POST /api/v1/documents/restore-from-bin`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(deleteIdsSchema)`

**Request body:** `{ "ids": ["uuid"] }`

**Response (200):** `{ "message": "Restored from bin." }`

---

### `DELETE /api/v1/documents/delete`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(deleteIdsSchema)`

**Request body:** `{ "ids": ["uuid"] }`

**Response (200):** `{ "message": "Permanently deleted." }`

Hard DELETE + removes PDF and thumbnail from storage. Audit logged.

---

### `DELETE /api/v1/documents/bin/purge`

**Auth required:** Yes
**Middleware:** `requireAuth`

**Request body:** `{ "ids": ["uuid"] }` (optional — purges items older than 30 days if omitted)

**Response (200):** `{ "message": "Purged." }`

---

## Events

Rate limit: `publicLimiter` on GET; `adminLimiter` on writes.

---

### `GET /api/v1/events/`

**Auth required:** No

**Response (200):**
```json
[{
  "id": "uuid",
  "name": "Leadership Summit",
  "description": "...",
  "date_happened": "2026-03-15",
  "created_at": "...",
  "term_year": "AY 2025-2026",
  "images": [
    "https://supabase.../events/uuid/image_0.jpg",
    "https://supabase.../events/uuid/image_1.jpg"
  ]
}]
```

Up to 3 image URLs per event. Returns active records sorted newest first.

---

### `GET /api/v1/events/archived`

**Auth required:** Yes

Returns archived events.

---

### `GET /api/v1/events/bin`

**Auth required:** Yes

Returns soft-deleted events.

---

### `POST /api/v1/events/add`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(addEventSchema)`, `multer` (up to 3 images: `image_0`, `image_1`, `image_2`)

**Request body:** `multipart/form-data`
```
name            string, 1–300 chars (required)
description     string, 1–50000 chars (required)
date_happened   string, YYYY-MM-DD format (required)
term_year       string, "AY YYYY-YYYY" (optional)
image_0         image file, JPEG/PNG/WebP, max 5 MB (optional)
image_1         image file (optional)
image_2         image file (optional)
```

**Response (201):** `{ "message": "Event created.", "data": {...} }`

**Notes:** Images stored in `events/{id}/image_0.jpg` etc. Audit logged.

---

### `POST /api/v1/events/edit`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(editEventSchema)`, optional multer

**Request body:** `multipart/form-data`
```
id              uuid (required)
name            string (optional)
description     string (optional)
date_happened   string (optional)
term_year       string (optional)
image_0         file (optional — replaces slot 0)
image_1         file (optional — replaces slot 1)
image_2         file (optional — replaces slot 2)
```

**Response (200):** `{ "message": "Event updated." }`

---

### `POST /api/v1/events/archive`

**Auth required:** Yes
**Request body:** `{ "ids": ["uuid"] }`
**Response (200):** `{ "message": "Archived." }`

---

### `POST /api/v1/events/restore`

**Auth required:** Yes
**Request body:** `{ "ids": ["uuid"] }`
**Response (200):** `{ "message": "Restored." }`

---

### `POST /api/v1/events/bin`

**Auth required:** Yes
**Request body:** `{ "ids": ["uuid"] }`
**Response (200):** `{ "message": "Moved to bin." }`

---

### `POST /api/v1/events/restore-from-bin`

**Auth required:** Yes
**Request body:** `{ "ids": ["uuid"] }`
**Response (200):** `{ "message": "Restored from bin." }`

---

### `DELETE /api/v1/events/delete`

**Auth required:** Yes
**Request body:** `{ "ids": ["uuid"] }`
**Response (200):** `{ "message": "Deleted." }`

Hard DELETE + removes all event images from storage. Audit logged.

---

## Officers

Rate limit: `publicLimiter` on GET; `adminLimiter` on writes.

---

### `GET /api/v1/officers/`

**Auth required:** No

**Query params:** `?page=1&limit=50&term=AY+2025-2026` (optional)

**Response (200):**
```json
[{
  "id": "uuid",
  "full_name": "Maria Santos",
  "position": "President",
  "type": "executive",
  "avatar": "https://supabase.../officers/uuid.jpg",
  "socials": "https://facebook.com/...",
  "year_serving": "2025-2026",
  "student_number": "2022-00001",
  "committee": 3,
  "is_committee_official": false,
  "status": "active",
  "term_year": "AY 2025-2026"
}]
```

Cached 60 s. Returns active officers (`status = 'active' AND deleted_at IS NULL`).

---

### `GET /api/v1/officers/terms`

**Auth required:** No

**Response (200):**
```json
["AY 2025-2026", "AY 2024-2025"]
```

Distinct `term_year` values from archived officers, sorted descending. Used to populate term filter dropdowns.

---

### `GET /api/v1/officers/archived`

**Auth required:** Yes

Returns archived officers (`status = 'archived' AND deleted_at IS NULL`). Cached 60 s.

---

### `POST /api/v1/officers/add`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(addOfficerSchema)`, `multer` (optional image `avatar`)

**Request body:** `multipart/form-data`
```
full_name               string, 1–200 chars (required)
position                string, 1–200 chars (required)
type                    enum: executive | board | adviser | former (required)
committee               integer (optional, nullable)
is_committee_official   boolean (default: false)
socials                 URL string (optional)
year_serving            string, max 20 chars (optional)
student_number          string, max 20 chars (optional)
term_year               string, "AY YYYY-YYYY" (optional)
avatar                  image file, max 5 MB (optional)
```

**Response (201):** `{ "message": "Officer created.", "data": {...} }`

**Notes:** `committee` is always `parseInt()`-ed before DB query. Cache invalidated. Audit logged.

---

### `POST /api/v1/officers/edit`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(editOfficerSchema)`, optional multer

**Request body:** same as add, plus `id` (uuid, required), all other fields optional.

**Response (200):** `{ "message": "Officer updated." }`

**Notes:** If new avatar: old deleted from storage. Cache invalidated. Audit logged.

---

### `POST /api/v1/officers/archive`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(archiveOfficerSchema)`

**Request body:** `{ "id": "uuid", "term_year": "AY 2025-2026" }`

**Response (200):** `{ "message": "Officer archived." }`

Sets `status = 'archived'` and `term_year`. Cache invalidated.

---

### `POST /api/v1/officers/restore`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(singleIdSchema)`

**Request body:** `{ "id": "uuid" }`

**Response (200):** `{ "message": "Officer restored." }`

Sets `status = 'active'`. Cache invalidated.

---

### `DELETE /api/v1/officers/delete`

**Auth required:** Yes

**Request body:** `{ "ids": ["uuid"] }`

**Response (200):** `{ "message": "Officer deleted." }`

Hard DELETE + removes avatar from storage. Cache invalidated. Audit logged.

---

## Committees

Rate limit: `publicLimiter` on GET; `adminLimiter` on writes.

**Important:** `committees.id` is an INTEGER (not UUID). All body/query values are `parseInt()`-ed before use.

---

### `GET /api/v1/committees/`

**Auth required:** No

**Query params:** `?status=archived` (optional — returns archived if present)

**Response (200):**
```json
[{ "id": 1, "name": "Academic Affairs", "status": "active", "deleted_at": null }]
```

Cached 60 s.

---

### `POST /api/v1/committees/add`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(addCommitteeSchema)`

**Request body:** `{ "name": "Academic Affairs" }`

**Response (201):** `{ "message": "Committee created.", "data": {...} }`

Cache invalidated.

---

### `POST /api/v1/committees/edit`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(editCommitteeSchema)`

**Request body:** `{ "id": 1, "name": "Academic Affairs Committee" }`

`id` must be a positive integer.

**Response (200):** `{ "message": "Committee updated." }`

Cache invalidated.

---

### `POST /api/v1/committees/archive`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(committeeIdsSchema)`

**Request body:** `{ "ids": [1, 2, 3] }` (array of integers)

**Response (200):** `{ "message": "Archived." }`

Sets `status = 'archived'`. Cache invalidated.

---

### `POST /api/v1/committees/restore`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(committeeIdsSchema)`

**Request body:** `{ "ids": [1] }`

**Response (200):** `{ "message": "Restored." }`

Sets `status = 'active'`. Cache invalidated.

---

### `DELETE /api/v1/committees/delete`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(committeeIdsSchema)`

**Request body:** `{ "ids": [1] }`

**Response (200):** `{ "message": "Deleted." }`

Hard DELETE. Will fail if officers are assigned to the committee. Audit logged.

---

## Organizations

Rate limit: `publicLimiter` on GET; `adminLimiter` on writes.

---

### `GET /api/v1/organizations/`

**Auth required:** No

**Response (200):**
```json
[{
  "id": "uuid",
  "name": "JPIA",
  "description": "...",
  "logo_path": "organizations/uuid.jpg",
  "logo_url": "https://supabase.../organizations/uuid.jpg",
  "facebook_link": "https://facebook.com/...",
  "created_at": "..."
}]
```

Returns active records.

---

### `GET /api/v1/organizations/archived`

**Auth required:** Yes

Returns archived organizations.

---

### `GET /api/v1/organizations/bin`

**Auth required:** Yes

Returns soft-deleted organizations.

---

### `POST /api/v1/organizations/add`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(addOrganizationSchema)`, `multer` (optional logo `logo`)

**Request body:** `multipart/form-data`
```
name            string, 1–200 chars (required)
description     string, max 2000 chars (optional)
facebook_link   URL string (optional)
logo            image file, max 5 MB (optional)
```

**Response (201):** `{ "message": "Organization created.", "data": {...} }`

---

### `POST /api/v1/organizations/edit`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(editOrganizationSchema)`, optional multer

**Request body:** `{ "id": "uuid", ...optional fields, logo? }`

**Response (200):** `{ "message": "Organization updated." }`

---

### `POST /api/v1/organizations/archive`

**Auth required:** Yes
**Request body:** `{ "ids": ["uuid"] }`
**Response (200):** `{ "message": "Archived." }`

---

### `POST /api/v1/organizations/restore`

**Auth required:** Yes
**Request body:** `{ "ids": ["uuid"] }`
**Response (200):** `{ "message": "Restored." }`

---

### `POST /api/v1/organizations/bin`

**Auth required:** Yes
**Request body:** `{ "ids": ["uuid"] }`
**Response (200):** `{ "message": "Moved to bin." }`

---

### `POST /api/v1/organizations/restore-from-bin`

**Auth required:** Yes
**Request body:** `{ "ids": ["uuid"] }`
**Response (200):** `{ "message": "Restored from bin." }`

---

### `DELETE /api/v1/organizations/delete`

**Auth required:** Yes
**Request body:** `{ "ids": ["uuid"] }`
**Response (200):** `{ "message": "Deleted." }`

Hard DELETE + removes logo from storage.

---

## Equipment

Rate limit: `publicLimiter` (100/15 min)

---

### `GET /api/v1/equipment/`

**Auth required:** No

**Response (200):**
```json
[{
  "id": "uuid",
  "name": "Basketball",
  "quantity": 3,
  "max_quantity": 5,
  "is_available": true,
  "created_at": "..."
}]
```

Read-only endpoint. Cached 60 s. Queries the `inventory` table.

---

## Borrowing

Rate limit: `adminLimiter` (500/15 min)

---

### `GET /api/v1/borrowing/inventory`

**Auth required:** No (public)

**Response (200):** Same shape as `GET /equipment/` but from `borrowing.routes.js`.

---

### `GET /api/v1/borrowing/inventory/:id`

**Auth required:** No

**Response (200):** Single inventory item.

---

### `POST /api/v1/borrowing/inventory/add`

**Auth required:** Yes

**Request body:** `multipart/form-data`
```
name            string (required)
max_quantity    integer ≥ 1 (required)
image           image file (optional)
```

**Response (201):** `{ "message": "Equipment created.", "data": {...} }`

---

### `POST /api/v1/borrowing/inventory/edit`

**Auth required:** Yes

**Request body:** `{ "id": "uuid", "name": "...", "max_quantity": 5, image? }`

**Response (200):** `{ "message": "Equipment updated." }`

Cache invalidated (`equipment:all`).

---

### `DELETE /api/v1/borrowing/inventory/delete`

**Auth required:** Yes

**Request body:** `{ "id": "uuid" }`

**Response (200):** `{ "message": "Equipment deleted." }`

---

### `GET /api/v1/borrowing/requests`

**Auth required:** Yes

**Query params:** `?status=pending` (optional — filters by status: pending | approved | rejected | returned)

**Response (200):**
```json
[{
  "id": "uuid",
  "borrower_name": "Juan Dela Cruz",
  "borrower_id": "2021-00001",
  "email": "juan@cvsu.edu.ph",
  "contact_number": "09XX...",
  "organization": "JPIA",
  "position_in_org": "President",
  "equipment_name": "Basketball",
  "quantity_requested": 2,
  "purpose_type": "event",
  "borrow_date": "2026-06-01",
  "return_date": "2026-06-02",
  "status": "pending",
  "admin_notes": null,
  "created_at": "..."
}]
```

---

### `POST /api/v1/borrowing/request`

**Auth required:** No (public submission)

**Request body:** `application/json`
```json
{
  "borrower_name": "Juan Dela Cruz",
  "borrower_id": "2021-00001",
  "email": "juan@cvsu.edu.ph",
  "contact_number": "09...",
  "organization": "JPIA",
  "position_in_org": "President",
  "purpose_type": "academic",
  "activity_name": "Thesis Defense",
  "venue": "Room 101",
  "time_of_use": "08:00 AM",
  "borrow_date": "2026-06-01",
  "return_date": "2026-06-02",
  "items": [
    { "equipment_id": "uuid", "quantity": 2 }
  ]
}
```

Supports multiple items (up to 5). Creates one `borrowing_requests` row per item.

**Response (201):** `{ "message": "Borrow request submitted." }`

---

### `POST /api/v1/borrowing/approve`

**Auth required:** Yes

**Request body:** `{ "id": "uuid", "admin_notes": "Approved" }`

**Response (200):** `{ "message": "Request approved." }`

Sets `status = 'approved'`. Deducts quantity from `inventory`.

---

### `POST /api/v1/borrowing/reject`

**Auth required:** Yes

**Request body:** `{ "id": "uuid", "reason": "Not available" }`

**Response (200):** `{ "message": "Request rejected." }`

Sets `status = 'rejected'`.

---

### `POST /api/v1/borrowing/return`

**Auth required:** Yes

**Request body:** `{ "id": "uuid" }`

**Response (200):** `{ "message": "Marked as returned." }`

Sets `status = 'returned'`. Restores quantity to `inventory`.

---

### `DELETE /api/v1/borrowing/requests/delete`

**Auth required:** Yes

**Request body:** `{ "ids": ["uuid"] }`

**Response (200):** `{ "message": "Deleted." }`

---

## Dashboard

Rate limit: `adminLimiter` (500/15 min)

---

### `GET /api/v1/dashboard/summary`

**Auth required:** No (but uses adminLimiter)

**Response (200):**
```json
{
  "officers": 24,
  "documents": 12,
  "announcements": 8,
  "events": 15,
  "pinned": { "id": "uuid", "title": "Important Update", "created_at": "..." }
}
```

Cached 60 s (self-expiring).

---

### `GET /api/v1/dashboard/storage`

**Auth required:** Yes
**Middleware:** `requireAuth`

**Response (200):**
```json
[
  { "bucket": "bulletin", "size_bytes": 4200000, "file_count": 12 },
  { "bucket": "documents", "size_bytes": 80000000, "file_count": 8 }
]
```

Cached 300 s (self-expiring). Calls Supabase Management API to get bucket sizes.

---

## Settings

Rate limit: `adminLimiter` (500/15 min)

---

### `GET /api/v1/settings/`

**Auth required:** Yes

**Response (200):**
```json
[{ "key": "active_term", "value": "AY 2025-2026" }]
```

---

### `POST /api/v1/settings/`

**Auth required:** Yes

**Request body:** `{ "key": "active_term", "value": "AY 2025-2026" }`

**Response (200):** `{ "message": "Setting saved." }`

Upserts by key.

---

### `GET /api/v1/settings/:key`

**Auth required:** No (but rate-limited to adminLimiter)

**Response (200):** `{ "key": "active_term", "value": "AY 2025-2026" }`

Used by `Root-layout.tsx` to fetch the active term before rendering.

---

### `POST /api/v1/settings/:key`

**Auth required:** Yes
**Middleware:** `requireAuth`, `validate(settingValueSchema)`

**Request body:** `{ "value": "AY 2025-2026" }` (1–100 chars, required)

**Response (200):** `{ "message": "Setting saved." }`

---

## Analytics

Rate limit: `adminLimiter` (500/15 min)

---

### `GET /api/v1/analytics/`

**Auth required:** Yes
**Middleware:** `requireAuth`

**Response (200):**
```json
{
  "monthly": [
    { "month": "2025-12", "count": 3 },
    { "month": "2026-01", "count": 7 }
  ],
  "weekly": [
    { "week": "2026-W01", "count": 2 }
  ]
}
```

Returns 6 months of monthly document upload counts and 8 weeks of weekly counts.

---

## Audit Log

Rate limit: `adminLimiter` (500/15 min)

---

### `GET /api/v1/auditlog/`

**Auth required:** Yes
**Middleware:** `requireAuth`

**Query params:** `?limit=50` (optional)

**Response (200):**
```json
[{
  "id": "uuid",
  "action": "INSERT",
  "entity": "bulletin",
  "entity_id": "uuid",
  "created_by": "admin-uuid",
  "admin_name": "admin@cvsu.edu.ph",
  "ip_address": "123.45.67.89",
  "created_at": "2026-01-01T08:00:00Z"
}]
```

`admin_name` is resolved by joining with Supabase Auth `listUsers()`. Sorted newest first.

---

## Changelog

Rate limit: `publicLimiter` (100/15 min)

---

### `GET /api/v1/changelog/`

**Auth required:** No

**Response (200):** Plain text content of `CHANGELOG.md` from the project root.

---

## Error response format

All errors return a JSON body with an `error` or `message` key:

```json
{ "error": "Description of what went wrong." }
```

In development (`NODE_ENV !== 'production'`), errors also include `stack`.

| Status | When |
|---|---|
| 400 | Validation failure (Zod) or missing required fields |
| 401 | Session expired — no valid refresh token available |
| 403 | Not authenticated — no cookies at all |
| 404 | Route not found |
| 413 | File too large (image > 5 MB, PDF > 20 MB) |
| 415 | Wrong file MIME type |
| 429 | Rate limit exceeded |
| 500 | Supabase error, storage error, or unexpected server error |
