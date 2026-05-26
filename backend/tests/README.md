# backend/tests

Vitest test suite for the backend. Unit tests and route integration tests. Never hits the real database.

## Overview

Tests are organized into three directories: `unit/` for pure utility functions, `routes/` for API endpoint behavior, and `mocks/` for the Supabase client mock infrastructure. All Supabase calls are intercepted at the module level — no real database connection is made during tests.

**Test runner: Vitest (NOT Jest).** The two are similar but not identical. Do not use `jest.mock()` — use `vi.mock()`.

## Commands

```bash
# Run all tests once
npm test

# Run in watch mode (during development)
npm run test:watch

# Generate coverage report
npm run test:coverage
# Output: backend/coverage/

# Run with UI
npm run test:ui
```

## Directory structure

| Path | Contents |
|---|---|
| `unit/apiError.test.js` | `ApiError` class — constructor, `isOperational` flag, HTTP status |
| `unit/cache.test.js` | `getCached`, `setCache`, `invalidateCache`, `invalidateCachePrefix`, TTL expiry |
| `unit/sanitize.test.js` | `sanitizeContent()` — allowed tags, stripped tags, URL scheme enforcement |
| `unit/uploadValidation.test.js` | `validateImageUpload`, `validatePdfUpload` — correct type/size pass; wrong type/oversized throw |
| `routes/announcements.test.js` | All `/announcements` endpoints |
| `routes/documents.test.js` | All `/documents` endpoints |
| `routes/events.test.js` | All `/events` endpoints |
| `routes/officers.test.js` | All `/officers` endpoints |
| `routes/committees.test.js` | All `/committees` endpoints |
| `routes/organizations.test.js` | All `/organizations` endpoints |
| `routes/user.test.js` | Login, logout, register, whitelist |
| `routes/settings.test.js` | Settings read/write |
| `routes/dashboard.test.js` | Summary and storage endpoints |
| `mocks/supabase.mock.js` | Mock infrastructure — `createQueryChain`, `mockFromTable`, `mockRequireAuth` |
| `setup.js` | Vitest global setup |

## Mock infrastructure

### `createQueryChain(resolvedValue)`

Returns a chainable mock that mimics Supabase's fluent query API. Supports `.from().select().eq().is().not().order().single()`. The chain resolves to `resolvedValue` when awaited.

### `mockFromTable(tableName, data)`

Configure what a specific table returns for the current test:
```js
mockFromTable('bulletin', [{ id: 'uuid', title: 'Test' }]);
// Now: supabase.from('bulletin').select('*') → { data: [...], error: null }
```

### `mockRequireAuth(userId)`

Simulates `requireAuth` passing — sets `req.user = { sub: userId }` and calls `next()`.

## Why tests never hit real Supabase

1. No `SUPABASE_URL` or `SUPABASE_SERVICE_KEY` are set in the test environment.
2. The mock intercepts `supabase.from()` at the module level via `vi.mock('../lib/supabaseClient.js')`.
3. Tests run in milliseconds and are fully deterministic.

## Coverage thresholds

| Metric | Threshold |
|---|---|
| Lines | 70% |
| Functions | 70% |
| Branches | 60% |

## Writing new route tests

1. Copy the nearest existing route test file.
2. Update the route path and import paths.
3. Use `mockFromTable(tableName, data)` to configure Supabase return values per test.
4. Test the happy path (200/201) AND error paths (400, 401, 415, 500).
5. Test Zod validation: submit a body with missing required fields → expect 400.
6. Test `requireAuth`: remove the auth mock → expect 403.

## Related

- [docs/testing.md](../../docs/testing.md) — full test guide including E2E
- [backend/src/lib/README.md](../src/lib/README.md) — what the mocks replace
