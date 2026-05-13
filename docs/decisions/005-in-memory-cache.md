# ADR 005 — In-memory response caching without Redis

**Status:** Accepted
**Date:** 2026-05

## Context

The admin dashboard was causing 429 rate limit errors by firing 6–8 parallel
API calls on mount. Slow-changing resources (officers, committees, equipment)
were being fetched from Supabase on every request.

## Decision

A simple in-memory TTL cache is implemented in `backend/src/lib/cache.js`
using a JavaScript Map. No external dependencies (no Redis, no Memcached).

TTLs:
- Officers, committees, equipment: 60 seconds
- Dashboard storage stats: 5 minutes
- Dashboard summary: 60 seconds

## Consequences

- Cache is per-process — if the backend has multiple instances (e.g., behind
  a load balancer), each instance has its own cache. At CSG-OITS scale
  (single server), this is acceptable.
- Cache is lost on server restart — this is acceptable for read caches
- Write operations MUST call `invalidateCachePrefix('resource:')` after
  modifying cached data, or stale data will be served for up to 60 seconds
- If the project scales to need distributed caching, replace `cache.js` with
  a Redis client — the interface (`getCached`, `setCache`, `invalidateCache`,
  `invalidateCachePrefix`) stays the same
