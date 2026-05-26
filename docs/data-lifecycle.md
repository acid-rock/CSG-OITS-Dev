# Content Data Lifecycle

---

## Overview

All content in CSG-OITS follows a three-tier lifecycle. Items start as **Active**, can be moved to **Archived** (permanent historical record) or **Bin** (soft-delete, recoverable), and can eventually be **permanently deleted** only from the Bin. Archive and Bin are completely separate states — see the rule in `CONTRIBUTING.md` Rule F4.

---

## The three tiers

| Tier | DB state | Visible to | Reversible | Auto-purged |
|---|---|---|---|---|
| **Active** | `is_archived = false AND deleted_at IS NULL` | Public + Admin | Via Archive or Bin | No |
| **Archived** | `is_archived = true AND deleted_at IS NULL` | Admin only | Yes — restore to Active | Never |
| **Bin** | `deleted_at IS NOT NULL` | Admin only (Bin panel) | Yes — restore to Active | ⚠️ Manual only (30-day policy not automated) |

---

## State transition diagram

```
                ┌─────────────────┐
                │     ACTIVE      │ ◄────────────────────────┐
                │  is_archived=F  │                          │
                │  deleted_at=NULL│                          │
                └────────┬────────┘                          │
                         │                                   │
           ┌─────────────┼─────────────┐                    │
           │             │             │                    │
    Archive│       Move  │    to Bin   │         Restore    │
           │             │             │         from       │
           ▼             ▼             │         Archive    │
  ┌─────────────┐  ┌─────────────┐    │    ┌──────────────┐ │
  │  ARCHIVED   │  │     BIN     │────┘────►              │ │
  │is_archived=T│  │deleted_at=  │  Restore│ (back to     │ │
  │deleted_at=  │  │  timestamp  │  from   │  Active)     │ │
  │   NULL      │  │             │  Bin    └──────────────┘ │
  └──────┬──────┘  └──────┬──────┘                          │
         │                │                                  │
Restore  │         Restore│           Permanent              │
to Active│                │           Delete                 │
         │                ▼           (irreversible)         │
         └──────────► (gone) ◄────────────────────────────── │
                                   DELETE from DB
```

---

## Database queries for each state

```sql
-- Active (shown publicly and in admin Active tab)
WHERE is_archived = false AND deleted_at IS NULL

-- Archived (admin Archived tab — permanent record)
WHERE is_archived = true AND deleted_at IS NULL

-- Bin (admin Bin panel — pending review)
WHERE deleted_at IS NOT NULL
```

These patterns are used consistently across `bulletin`, `documents`, `events`, `organizations`.

---

## API endpoints per transition

| Transition | Endpoint | Database change |
|---|---|---|
| Active → Archived | `POST /[resource]/archive` | `is_archived = true` |
| Archived → Active | `POST /[resource]/restore` | `is_archived = false` |
| Active → Bin | `POST /[resource]/bin` | `deleted_at = now()` |
| Archived → Bin | not supported (archive is permanent) | — |
| Bin → Active | `POST /[resource]/restore-from-bin` | `deleted_at = null` |
| Bin → Deleted | `DELETE /[resource]/delete` | Hard DELETE from table |

**Never** set `is_archived = true` when moving to Bin. **Never** set `deleted_at` when archiving. These are separate flags — misusing them breaks the three-tier system.

---

## Officers — variant pattern

Officers use a `status` text column (`'active'` | `'archived'`) instead of `is_archived`. This is intentional — officers have a richer lifecycle where archived status carries contextual meaning (the officer served in a specific term).

| State | DB query |
|---|---|
| Active | `.eq('status', 'active').is('deleted_at', null)` |
| Archived | `.eq('status', 'archived').is('deleted_at', null)` |
| Bin | `.not('deleted_at', 'is', null)` |

**Archive transition:** Requires `term_year` in the request body — the system records which term the officer served. Endpoint: `POST /officers/archive`.

**Restore transition:** Sets `status = 'active'` and clears `term_year`. Endpoint: `POST /officers/restore`.

---

## Committees — variant pattern

Committees use `status` (`'active'` | `'archived'`) like officers, plus `deleted_at` for the bin.

**Critical:** `committees.id` is an INTEGER (not UUID). Always `parseInt()` before any query.

**Archive transition:** `POST /committees/archive` with `{ "ids": [1, 2] }` (integer array).

**Bin view:** ⚠️ PARTIAL — the UI tab exists but the `deleted_at` column migration may not have been run in production. The bin tab may be non-functional until the migration is applied.

---

## 30-day purge policy

Items in the Bin should be permanently deleted after 30 days to limit data retention.

**Current implementation status: ⚠️ PARTIAL**

The policy is documented and referenced in the UI (the Bin panel shows how long items have been deleted), but there is no automated scheduler. Purge must be triggered manually by admins:

- **Documents:** `DELETE /api/v1/documents/bin/purge` — purges documents older than 30 days
- **Other resources:** Select items in the Bin panel and use "Delete Permanently"

A cron job or Supabase Edge Function scheduled task would be needed to automate this.

---

## Announcement pinning

Announcements have an additional `is_pinned` flag separate from the archive/bin lifecycle.

- At most one announcement can be pinned at a time.
- `POST /api/v1/announcements/pin` with `{ "id": "uuid" }`:
  1. Sets `is_pinned = false` on **all** announcements.
  2. Sets `is_pinned = true` on the target announcement.
- The pinned announcement appears as a hero card at the top of the `/bulletin` page and as the "Latest Update" strip on the homepage.
- Archiving or binning a pinned announcement does not automatically unpin it — the pin flag moves with the record.

---

## Storage file lifecycle

When content with associated files is permanently deleted, the backend also removes files from Supabase Storage:

| Resource | Storage bucket | Files deleted on hard delete |
|---|---|---|
| Announcements | `bulletin` | `{id}.jpg` |
| Documents | `documents`, `thumbnails` | `{id}.pdf`, `{id}.png` |
| Events | `events` | `{id}/image_0.jpg`, `image_1.jpg`, `image_2.jpg` |
| Officers | `officers` | `{id}.jpg` |
| Organizations | `organizations` | `{id}.jpg` |

Files are **not** deleted when moving to Archive or Bin. They are only deleted on hard DELETE (permanent deletion from the Bin view).
