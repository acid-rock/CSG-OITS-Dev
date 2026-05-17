# backend/src/schemas

Zod validation schemas for all API request bodies.

## Overview

All schemas are exported from `index.js` and consumed by the `validate()` middleware in route definitions. Adding a schema here before wiring a new route is required — the `validate(schema)` middleware throws a 400 if the schema rejects the request body.

## Contents (`index.js`)

### Shared fields

| Schema | Description |
|---|---|
| `uuidField` | `z.string().uuid()` — validates any UUID ID field |
| `termYearField` | Optional string matching `^AY \d{4}-\d{4}$` |

### Announcements

| Schema | Used by | Key fields |
|---|---|---|
| `addAnnouncementSchema` | `POST /announcements/add` | `title` (1–300), `content` (1–50000), `category` (enum), `term_year` (optional) |
| `editAnnouncementSchema` | `POST /announcements/edit` | `id` (uuid required), all other fields optional |
| `deleteIdsSchema` | Archive, bin, delete batch endpoints | `ids: string[]` — array of UUIDs, min 1 |
| `singleIdSchema` | Pin, single-item operations | `id: string` — single UUID |

### Documents

| Schema | Used by | Key validation |
|---|---|---|
| `addDocumentSchema` | `POST /documents/add` | `name` alphanumeric + spaces/hyphens/underscores only (blocks path traversal); `type` alphanumeric + hyphens only |
| `editDocumentSchema` | `POST /documents/edit` | Same regex rules, all fields optional except `id` |

### Events

| Schema | Used by |
|---|---|
| `addEventSchema` | `POST /events/add` |
| `editEventSchema` | `POST /events/edit` |

`date_happened` must match `^\d{4}-\d{2}-\d{2}` format.

### Officers

| Schema | Used by | Notes |
|---|---|---|
| `addOfficerSchema` | `POST /officers/add` | `type` enum: executive/board/adviser/former; `committee` is integer (not UUID) |
| `editOfficerSchema` | `POST /officers/edit` | Extends addOfficerSchema as partial + adds required `id` |
| `archiveOfficerSchema` | `POST /officers/archive` | `id` (uuid) + `term_year` (required) |

### Committees

| Schema | Notes |
|---|---|
| `addCommitteeSchema` | `name` string 1–200 |
| `editCommitteeSchema` | `id` is `z.number().int().positive()` — NOT a UUID |
| `committeeIdSchema` | Single integer ID |
| `committeeIdsSchema` | Array of positive integers |

**Important:** committee IDs are integers in all schemas. Always `parseInt()` before querying.

### Organizations

| Schema | Notes |
|---|---|
| `addOrganizationSchema` | `facebook_link` is optional URL or empty string |
| `editOrganizationSchema` | All fields optional except `id` |

### Equipment / Borrowing

| Schema | Notes |
|---|---|
| `addEquipmentSchema` | `quantity`, `max_quantity` are integers |
| `borrowRequestSchema` | Legacy schema; actual borrow request validation may differ from current route |

### Auth

| Schema | Key rules |
|---|---|
| `registerSchema` | Password: 8–72 chars, requires uppercase + number |
| `loginSchema` | Valid email + non-empty password |

### Settings

| Schema | Notes |
|---|---|
| `settingValueSchema` | `value` string 1–100 chars |

## Rules

- Add a schema in this file before adding a new route that accepts a body.
- Do not use `z.any()` — every field must have an explicit type.
- Use `uuidField` and `termYearField` helpers for consistency.
- Zod v4 is used (not v3) — `err.issues` not `err.errors`.

## Related

- [backend/src/middlewares/README.md](../middlewares/README.md) — `validate()` middleware that uses these schemas
- [docs/api-reference.md](../../../docs/api-reference.md) — full request body documentation per endpoint
