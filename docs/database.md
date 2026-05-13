# Database Schema

**Database:** PostgreSQL (managed by Supabase)
**ORM:** None — raw Supabase JS client queries
**Row-Level Security:** Enabled on all tables

---

## Supabase client rules

Three clients are exported from `backend/src/lib/supabaseClient.js`. The choice of client is not optional — see `CONTRIBUTING.md` Rule B3.

| Client | Key | Use for | RLS |
|---|---|---|---|
| `anonSupabase` | Anon/public key | Public GET routes | Enforced |
| `supabase` | Service role key | Admin writes, `auth.admin` calls, whitelist, officer archive, storage ops | Bypassed |
| `createUserClient(token)` | User JWT | User-scoped writes subject to RLS | Enforced |

```js
import { anonSupabase, supabase, createUserClient } from '../lib/supabaseClient.js';

// Public read (RLS enforced)
const { data } = await anonSupabase.from('bulletin').select('*').eq('is_archived', false);

// Admin write (bypasses RLS)
await supabase.from('bulletin').insert({ title, content, owner_id });

// User-scoped write (RLS enforced)
const userClient = createUserClient(req.token);
await userClient.auth.updateUser({ password: newPassword });
```

**Never** use `anonSupabase` for writes. **Never** use `createUserClient` for whitelist or storage operations.

---

## Tables

### `bulletin`

Stores CSG announcements.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `title` | text | No | — | Announcement headline |
| `content` | text | No | — | HTML-sanitized body |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `owner_id` | uuid | Yes | — | FK → auth.users.id |
| `is_pinned` | bool | No | `false` | Pinned to top of homepage |
| `is_archived` | bool | No | `false` | Archived state |
| `deleted_at` | timestamptz | Yes | `NULL` | Soft-delete timestamp |
| `category` | text | No | `'CSG Updates'` | Announcement category |
| `term_year` | text | Yes | `NULL` | Academic term, e.g. "AY 2025-2026" |

**Active query:** `.eq('is_archived', false).is('deleted_at', null)`
**Archived query:** `.eq('is_archived', true).is('deleted_at', null)`
**Bin query:** `.not('deleted_at', 'is', null)`

**Valid categories:** `CSG Updates`, `Class Advisories`, `Examinations`, `University Events`, `Official CVSU`

**RLS:** `anonSupabase` can SELECT active records. Only service key can INSERT/UPDATE/DELETE.

---

### `documents`

Stores official PDF documents.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `file_path` | text | No | — | Storage path in `documents` bucket |
| `description` | text | Yes | `NULL` | Human-readable description |
| `created_at` | timestamptz | No | `now()` | Upload timestamp |
| `owner_id` | uuid | Yes | — | FK → auth.users.id |
| `is_archived` | bool | No | `false` | Archived state |
| `deleted_at` | timestamptz | Yes | `NULL` | Soft-delete timestamp |
| `term_year` | text | Yes | `NULL` | Academic term |
| `name` | text | Yes | `NULL` | Display name |
| `category` | text | Yes | `NULL` | Document type/category |

**Storage:** PDF stored in `documents` bucket; thumbnail PNG in `thumbnails` bucket.

---

### `events`

Stores CSG event records.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | — | Event name |
| `description` | text | No | — | HTML-sanitized description |
| `date_happened` | date | No | — | Date of event |
| `created_at` | timestamptz | No | `now()` | Record creation timestamp |
| `ip_address` | text | Yes | `NULL` | Admin IP at time of creation |
| `user_agent` | text | Yes | `NULL` | Admin browser at time of creation |
| `is_archived` | bool | No | `false` | Archived state |
| `deleted_at` | timestamptz | Yes | `NULL` | Soft-delete timestamp |
| `term_year` | text | Yes | `NULL` | Academic term |

**Storage:** Up to 3 images per event in `events/{id}/image_0.jpg`, `image_1.jpg`, `image_2.jpg`.

---

### `officers`

Stores CSG officer profiles.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `full_name` | text | No | — | Officer's full name |
| `position` | text | No | — | Title or position |
| `type` | text | No | — | Role type: `executive`, `board`, `adviser`, `former` |
| `avatar` | text | Yes | `NULL` | Storage path in `officers` bucket |
| `socials` | text | Yes | `NULL` | Facebook profile URL |
| `year_serving` | text | Yes | `NULL` | Academic year string |
| `student_number` | text | Yes | `NULL` | Student ID |
| `committee` | integer | Yes | `NULL` | FK → committees.id (INTEGER) |
| `is_committee_official` | bool | No | `false` | Is the committee chair/head |
| `status` | text | No | `'active'` | `active` or `archived` |
| `term_year` | text | Yes | `NULL` | Academic term (set on archive) |
| `deleted_at` | timestamptz | Yes | `NULL` | Soft-delete timestamp |

**Note:** Uses `status` field instead of `is_archived` for the archive state. This is intentional (ADR 004).

**Active query:** `.eq('status', 'active').is('deleted_at', null)`
**Archived query:** `.eq('status', 'archived').is('deleted_at', null)`
**Bin query:** `.not('deleted_at', 'is', null)`

---

### `committees`

Stores CSG committees.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | integer | No | auto-increment | **Primary key — INTEGER, NOT UUID** |
| `name` | text | No | — | Committee name |
| `status` | text | No | `'active'` | `active` or `archived` |
| `deleted_at` | timestamptz | Yes | `NULL` | Soft-delete timestamp |

**Critical:** `id` is an INTEGER column. Always `parseInt()` before any Supabase query:
```js
const id = parseInt(req.body.id, 10);
await supabase.from('committees').select('*').eq('id', id);
```

---

### `organizations`

Stores affiliated student organizations.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | — | Organization name |
| `description` | text | Yes | `NULL` | Brief description |
| `logo_path` | text | Yes | `NULL` | Storage path in `organizations` bucket |
| `facebook_link` | text | Yes | `NULL` | Facebook page URL |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `is_archived` | bool | No | `false` | Archived state |
| `deleted_at` | timestamptz | Yes | `NULL` | Soft-delete timestamp |

---

### `inventory`

Stores borrowable equipment. **Note:** The database table is named `inventory`, not `equipment`.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | — | Equipment name |
| `quantity` | integer | No | — | Current available quantity |
| `max_quantity` | integer | No | — | Total units owned |
| `is_available` | bool | No | `true` | Whether currently borrowable |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

---

### `borrowing_requests`

Stores student equipment borrow requests.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `borrower_name` | text | No | — | Requester's name |
| `borrower_id` | text | No | — | Student ID number |
| `email` | text | No | — | Student email |
| `contact_number` | text | Yes | `NULL` | Phone number |
| `organization` | text | Yes | `NULL` | Student's organization |
| `position_in_org` | text | Yes | `NULL` | Role in organization |
| `equipment_name` | text | No | — | Equipment requested |
| `quantity_requested` | integer | No | — | Units requested |
| `purpose_type` | text | Yes | `NULL` | `academic`, `event`, `organization`, `others` |
| `activity_name` | text | Yes | `NULL` | Name of the event/activity |
| `venue` | text | Yes | `NULL` | Location |
| `time_of_use` | text | Yes | `NULL` | Planned time |
| `borrow_date` | date | No | — | Start date |
| `return_date` | date | Yes | `NULL` | Expected return date |
| `status` | text | No | `'pending'` | `pending`, `approved`, `rejected`, `returned` |
| `admin_notes` | text | Yes | `NULL` | Notes from admin |
| `created_at` | timestamptz | No | `now()` | Submission timestamp |

---

### `profiles`

Stores admin role information. Maps to Supabase Auth users.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `owner_id` | uuid | No | — | **Primary key — maps to auth.users.id. NO `id` column.** |
| `role` | text | Yes | `NULL` | User role, e.g. `admin` |

**Critical:** There is no `id` column in this table. Always use `owner_id` as the lookup key.

---

### `whitelist`

Stores authorized student emails/IDs for restricted features.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `email` | text | Yes | `NULL` | Student email (optional) |
| `full_name` | text | Yes | `NULL` | Student name |
| `student_id` | text | Yes | `NULL` | Student ID (optional) |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

At least one of `email` or `student_id` must be provided. RLS enforced — only service key can read/write.

---

### `settings`

Key-value store for system configuration.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `key` | text | No | — | Primary key |
| `value` | text | Yes | `NULL` | Setting value |

**Current keys:**
- `active_term` — current academic term string, e.g. "AY 2025-2026"

---

### `audit_logs`

Stores all admin write operations.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `action` | text | No | — | `INSERT`, `UPDATE`, `DELETE` |
| `entity` | text | No | — | Table/resource name (e.g. `bulletin`) |
| `entity_id` | text | Yes | `NULL` | ID of the affected record |
| `created_by` | uuid | Yes | `NULL` | FK → auth.users.id |
| `ip_address` | text | Yes | `NULL` | Request IP address |
| `created_at` | timestamptz | No | `now()` | Log timestamp |

The `admin_name` column visible in the Audit Log panel is resolved at query time by joining with `auth.admin.listUsers()`.

---

## Storage buckets

| Bucket | Contents | Path pattern | Public |
|---|---|---|---|
| `bulletin` | Announcement cover images | `{announcement-uuid}.jpg` | Yes |
| `documents` | Redacted PDF files | `{document-uuid}.pdf` | Yes |
| `thumbnails` | Document thumbnail PNGs | `{document-uuid}.png` | Yes |
| `events` | Event photo galleries | `{event-uuid}/image_0.jpg`, `image_1.jpg`, `image_2.jpg` | Yes |
| `officers` | Officer avatar photos | `{officer-uuid}.jpg` | Yes |
| `organizations` | Organization logos | `{org-uuid}.jpg` | Yes |
| `equipment` | Equipment item photos | `{inventory-uuid}.jpg` | Yes |

---

## Known pending migrations

| Migration | Status | Notes |
|---|---|---|
| `committees.deleted_at` column | ⚠️ PARTIAL | Column exists in code logic but may not be run in production — committees bin view is non-functional until applied |
| `whitelist.full_name`, `whitelist.student_id` columns | ⚠️ PARTIAL | Referenced in `user.routes.js` comments as `MANUAL STEP` — apply if not yet run |

---

## Common query patterns

```js
// Active list (public-facing)
.from('bulletin')
.select('*')
.eq('is_archived', false)
.is('deleted_at', null)
.order('created_at', { ascending: false })

// Archived list (admin only)
.from('bulletin')
.select('*')
.eq('is_archived', true)
.is('deleted_at', null)
.order('created_at', { ascending: false })

// Bin list (admin only)
.from('bulletin')
.select('*')
.not('deleted_at', 'is', null)
.order('deleted_at', { ascending: false })

// Committee query — always parseInt first
const id = parseInt(req.body.id, 10);
.from('committees').select('*').eq('id', id)

// Officer archive
.from('officers').update({ status: 'archived', term_year }).eq('id', id)

// Profile lookup — use owner_id, not id
.from('profiles').select('role').eq('owner_id', req.user.sub).single()
```
