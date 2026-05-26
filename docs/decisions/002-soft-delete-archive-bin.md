# ADR 002 — Three-tier content lifecycle: Active → Archive → Bin

**Status:** Accepted
**Date:** 2026-05

## Context

CSG-OITS must preserve historical records (past officers, old announcements,
previous documents) while also allowing admins to clean up unwanted or
mistaken content. A single "delete" action conflates two different intents.

## Decision

Content follows a three-tier lifecycle, tracked by two database columns:

| State | is_archived | deleted_at | Description |
|---|---|---|---|
| Active | false | NULL | Publicly visible |
| Archived | true | NULL | Permanent historical record, admin-only |
| Bin | any | NOT NULL | Pending permanent deletion |

**Archive** (`is_archived = true`, `deleted_at` stays NULL):
- Intent: preserve as permanent historical record
- Use case: end of term, officer handover, superseded documents
- Auto-purge: NEVER
- Restore: available at any time

**Bin** (`deleted_at = timestamp`, `is_archived` unchanged):
- Intent: mark for permanent deletion after review
- Use case: duplicate posts, accidental uploads, spam
- Auto-purge: eligible after 30 days (not yet automated — manual review)
- Restore: available before permanent deletion

**Permanent delete** (hard DELETE from Supabase):
- Only available from the Bin view
- Requires a confirmation modal
- Irreversible — also deletes associated storage files

## Query patterns

```sql
-- Active:   WHERE is_archived = false AND deleted_at IS NULL
-- Archived: WHERE is_archived = true  AND deleted_at IS NULL
-- Bin:      WHERE deleted_at IS NOT NULL
```

## Consequences

- Officers use a different mechanism: `status` ('active'|'archived') instead
  of `is_archived`, for historical reasons. Their bin uses `deleted_at`.
- The bin panel has two tabs: Deleted (deleted_at NOT NULL) and
  Archived (is_archived = true) — they are shown separately because
  their behavior differs.
