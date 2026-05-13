# ADR 001 — Supabase client selection strategy

**Status:** Accepted
**Date:** 2026-05

## Context

The Supabase JS client can be initialized with either the anon (public) key or
the service role key. These have fundamentally different security properties:

- Anon key: subject to Row-Level Security (RLS) policies
- Service role key: bypasses ALL RLS policies

The project also needs user-scoped database access for write operations that
should be attributed to a specific authenticated user.

## Decision

Three distinct clients are exported from `backend/src/lib/supabaseClient.js`:

| Client | Key | RLS | Use for |
|---|---|---|---|
| `anonSupabase` | Anon | Enforced | Public GET routes |
| `supabase` | Service role | Bypassed | Admin writes, auth.admin, whitelist, storage |
| `createUserClient(token)` | User JWT | Enforced | User-attributed writes |

## Consequences

- Public reads are always RLS-protected — a misconfigured RLS policy is
  caught immediately because anonSupabase can't bypass it
- Admin operations that need to cross ownership boundaries (e.g., deleting
  another user's content) use the service key explicitly, making these
  operations visible and auditable in code review
- `createUserClient` is rarely used — most admin write operations go through
  the service key because admins operate on content they don't personally own

## Rules enforced by this decision

NEVER use anonSupabase for writes.
NEVER use createUserClient for whitelist or storage operations.
Service key usage in public read routes requires an explicit comment justifying it.
