# Testing Guide

---

## Test suite overview

| Layer | Tool | What it covers | Command |
|---|---|---|---|
| Backend unit | Vitest | Utility functions, middleware logic | `cd backend && npm test` |
| Backend routes | Vitest + Supertest | API endpoint behavior, status codes, body validation | `cd backend && npm test` |
| Frontend | Vitest + React Testing Library | Components, hooks, filter logic | `cd frontend && npm test` |
| E2E | Playwright | Full browser flows (login, create, delete) | `npx playwright test` |

---

## Running tests

```bash
# Backend — runs all Vitest tests in backend/tests/
cd backend
npm test

# Backend with coverage
cd backend
npm run test:coverage

# Backend in watch mode (during development)
cd backend
npm run test:watch

# Frontend — runs all Vitest tests in frontend/
cd frontend
npm test

# Frontend in watch mode
cd frontend
npm run test:watch

# E2E — requires both dev servers running
npx playwright test

# E2E with UI
npx playwright test --ui

# E2E — specific test file
npx playwright test tests/e2e/admin-login.spec.ts
```

---

## Test structure

### Backend tests (`backend/tests/`)

```
backend/tests/
├── unit/
│   ├── apiError.test.js          — ApiError class behavior
│   ├── cache.test.js             — getCached, setCache, invalidate*
│   ├── sanitize.test.js          — sanitizeContent() HTML allowlist
│   └── uploadValidation.test.js  — validateImageUpload, validatePdfUpload
├── routes/
│   ├── announcements.test.js     — all /announcements endpoints
│   ├── documents.test.js         — all /documents endpoints
│   ├── events.test.js            — all /events endpoints
│   ├── officers.test.js          — all /officers endpoints
│   ├── committees.test.js        — all /committees endpoints
│   ├── organizations.test.js     — all /organizations endpoints
│   ├── user.test.js              — login, logout, register, whitelist
│   ├── settings.test.js          — settings read/write
│   └── dashboard.test.js         — summary and storage endpoints
└── mocks/
    └── supabase.mock.js          — Supabase client mock (see below)
```

### Frontend tests (`frontend/src/**/__tests__/` or `frontend/tests/`)

Frontend tests cover:
- Filter logic (category filter, term filter, search)
- `useLockBodyScroll` hook behavior
- `SearchFilterBar` component rendering and interaction
- Config functions (`fetchBulletinData`, `fetchDocuments`, `fetchEvents`)

### E2E tests (`tests/e2e/`)

E2E flows covered (with Playwright):
- Admin login → dashboard loads
- Create announcement → appears in Active tab
- Move announcement to Bin → appears in Bin tab
- Restore from Bin → appears in Active tab
- Hard delete from Bin → no longer in any tab
- Upload document (mocked PDF)
- Create officer → appears in Active list
- Archive officer → appears in Archived tab
- Admin logout → redirects to login

---

## Mock infrastructure

**Source:** `backend/tests/mocks/supabase.mock.js`

All backend route tests mock the Supabase client. Tests never hit the real database.

### How `createQueryChain()` works

```js
// Returns a chainable mock object that mimics Supabase's fluent query API
const chain = createQueryChain(resolvedValue);
// Supports: .from().select().eq().is().not().order().single()
// Each chain method returns the same object for chaining
// The final awaited value is resolvedValue
```

### How `mockFromTable()` works

```js
// Configure per-test return values
mockFromTable('bulletin', [{ id: 'uuid', title: 'Test' }]);
// Now any supabase.from('bulletin').select(...) will return { data: [...], error: null }
```

### How auth is mocked

```js
mockRequireAuth(userId);
// Simulates requireAuth passing: sets req.user = { sub: userId } and calls next()
```

### Why tests don't hit real Supabase

1. No `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` in test environment — the Supabase client would throw on real requests.
2. The mock intercepts `supabase.from()` at the module level via `vi.mock('../lib/supabaseClient.js')`.
3. This means tests run in milliseconds and are deterministic regardless of database state.

---

## E2E test setup

### Prerequisites

Both servers must be running:
```bash
# Terminal 1
cd backend && npm run dev   # https://localhost:3000

# Terminal 2
cd frontend && npm run dev  # https://localhost:5173
```

Or use `playwright.config.ts`'s `webServer` config to start them automatically:
```ts
webServer: [
  { command: 'npm run dev', cwd: 'backend', port: 3000, reuseExistingServer: true },
  { command: 'npm run dev', cwd: 'frontend', port: 5173, reuseExistingServer: true },
]
```

### Auth test environment variables

```env
# frontend/.env.test or playwright.config.ts env
TEST_ADMIN_EMAIL=admin@cvsu.edu.ph
TEST_ADMIN_PASSWORD=TestAdmin1
```

These are used in login E2E tests. The test account must exist in Supabase (see `docs/local-setup.md` Step 7).

### Tests that are skipped by default

- Tests marked `test.skip` require a live Supabase connection with test data
- File upload tests require the PDF redaction microservice running
- Storage tests require pre-populated buckets

---

## Coverage thresholds

From `vitest.config.js` / `vitest.config.ts`:

| Target | Lines | Functions | Branches |
|---|---|---|---|
| Backend | 70% | 70% | 60% |
| Frontend | 60% | 60% | 50% |

Run coverage reports with:
```bash
cd backend && npm run test:coverage
# Output: backend/coverage/

cd frontend && npm run test:coverage
# Output: frontend/coverage/
```

---

## CI integration

**Source:** `.github/workflows/ci.yml`

The CI pipeline runs on:
- Push to `main` or `develop`
- Pull requests targeting `main`

**Jobs:**

1. **Backend tests**
   - Node.js 20
   - `cd backend && npm ci && npm test`
   - Environment: dummy Supabase values (mocked in tests)

2. **Frontend tests**
   - Node.js 20
   - `cd frontend && npm ci && npm test`

3. **Frontend build**
   - `cd frontend && npm run build`
   - Verifies TypeScript compilation and no build errors

E2E tests do **not** run in CI (require live servers and a real Supabase project).

---

## Writing new tests

### For a new backend route

1. Copy the nearest existing route test (e.g., `backend/tests/routes/announcements.test.js`).
2. Update imports and route paths.
3. Use `mockFromTable(tableName, data)` to configure per-test return values.
4. Test both the happy path (200/201) and error paths (400, 401, 415, 500).
5. Test Zod validation: submit a body with missing required fields → expect 400.
6. Test `requireAuth`: remove the auth mock → expect 403 or 401.

### For a new frontend component

1. Create `__tests__/ComponentName.test.tsx` next to the component.
2. Wrap with React Router context if the component uses `useNavigate` or `Link`.
3. Mock axios with `vi.mock('../config/axiosInstance')`.
4. Test rendering with default props.
5. Test user interactions with `@testing-library/user-event`.

### General rules

- **Always mock Supabase** — never hit the real database in unit or route tests
- **Test unhappy paths** (400, 401, 415, 413) — not just 200
- **No shared state between tests** — reset mocks in `beforeEach` / `afterEach`
- **For new routes:** add a route test before the PR is merged
- **E2E tests should not create/delete real data** without explicit cleanup logic
