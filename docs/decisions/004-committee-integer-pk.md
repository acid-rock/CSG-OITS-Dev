# ADR 004 — committees table uses INTEGER primary key

**Status:** Accepted
**Date:** 2026-05

## Context

All other tables in CSG-OITS use UUID primary keys. The committees table was
created early in development with an auto-increment INTEGER primary key before
the UUID convention was established.

## Decision

The committees table retains its INTEGER primary key. Migrating to UUID would
require updating the `officers.committee` foreign key column and all existing
data — the risk is not worth the consistency benefit.

## Consequences

**Every** location in the codebase that queries committees by ID MUST call
`parseInt()` on the ID value before passing it to Supabase. Failure to do so
causes Supabase to perform string-to-integer comparison which silently returns
wrong results.

```js
// ALWAYS do this for committee IDs:
const id = parseInt(req.body.id, 10);
await supabase.from('committees').select('*').eq('id', id);
```

This rule is enforced by ESLint where detectable and by code review.
