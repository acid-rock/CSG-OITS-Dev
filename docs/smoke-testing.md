# Smoke Testing Guide

Use this guide before every release or after a major change. It covers two tracks:

1. **Automated tests** — run scripts, check counts and pass/fail
2. **Manual UI checks** — step-by-step browser walkthrough with a ✅ / ❌ column

Both tracks must complete before merging to `main`.

---

## Prerequisites

Both dev servers must be running for manual checks and E2E tests.
Open two terminals and leave them running for the entire session.

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Expected: "Server running on port 3000"

# Terminal 2 — Frontend
cd frontend
npm run dev
# Expected: "Local: http://localhost:5173"
```

Verify both are up before proceeding:

| Check | Command | Expected |
|---|---|---|
| Backend health | `curl http://localhost:3000/health` | `OK` |
| Frontend | Open `http://localhost:5173` in browser | Homepage loads |

---

## Track 1 — Automated Tests

Run from the **project root** (`CSG-OITS-Dev/`).

---

### 1A. Backend Unit Tests

These test pure utility functions — no servers, no database required.

```bash
cd backend && npm test
```

**Test files run:**

| File | Tests | Expected |
|---|---|---|
| `tests/unit/cache.test.js` | 6 | ✅ All pass |
| `tests/unit/sanitize.test.js` | 9 | ✅ All pass |
| `tests/unit/uploadValidation.test.js` | 11 | ✅ All pass |
| `tests/unit/validate.middleware.test.js` | 5 | ✅ All pass |
| `tests/routes/announcements.test.js` | 9 | ✅ All pass |
| `tests/routes/user.test.js` | 7 active + 4 `.todo` | ✅ 7 pass · ⏭ 4 skipped (todo) |
| `tests/routes/dashboard.test.js` | 4 | ✅ All pass |
| `tests/routes/documents.test.js` | varies | ✅ All pass |

**Total expected: ~51 tests pass, 4 todo (shown as skipped, not failures)**

> All Supabase calls are mocked — no real database is hit.
> `requireAuth` is mocked as a passthrough so all routes behave as authenticated.

**What the `.todo` tests cover (intentionally skipped):**
These are in `user.test.js` and document that `registerSchema` is not yet applied
to `POST /user/register`. They are reminders, not failures:
```
it.todo('returns 400 when password has no uppercase letter')
it.todo('returns 400 when password has no number')
it.todo('returns 400 when password is shorter than 8 characters')
it.todo('returns 400 for invalid email format')
```

**Sample output to look for:**
```
✓ backend/tests/unit/cache.test.js (6)
✓ backend/tests/unit/sanitize.test.js (9)
✓ backend/tests/unit/uploadValidation.test.js (11)
✓ backend/tests/unit/validate.middleware.test.js (5)
✓ backend/tests/routes/announcements.test.js (9)
✓ backend/tests/routes/user.test.js (7)
✓ backend/tests/routes/dashboard.test.js (4)

Test Files  7 passed
Tests      51 passed | 4 todo
```

---

### 1B. Backend Unit Tests with Coverage

```bash
cd backend && npm run test:coverage
```

**Coverage thresholds (will fail the run if not met):**

| Metric | Required | Notes |
|---|---|---|
| Lines | ≥ 70% | |
| Functions | ≥ 70% | |
| Branches | ≥ 60% | |

Coverage report is written to `backend/coverage/` (HTML) — open `backend/coverage/index.html` in a browser to view.

---

### 1C. Frontend Unit Tests

No servers required.

```bash
cd frontend && npm test
```

**Test files run:**

| File | Tests | Expected |
|---|---|---|
| `tests/components/SearchFilterBar.test.tsx` | 7 | ✅ All pass |
| `tests/hooks/useLockBodyScroll.test.ts` | 4 | ✅ All pass |
| `tests/utils/filters.test.ts` | 8 | ✅ All pass |

**Total expected: 19 tests pass**

**Sample output:**
```
✓ tests/components/SearchFilterBar.test.tsx (7)
✓ tests/hooks/useLockBodyScroll.test.ts (4)
✓ tests/utils/filters.test.ts (8)

Test Files  3 passed
Tests      19 passed
```

---

### 1D. Frontend Tests with Coverage

```bash
cd frontend && npm run test:coverage
```

**Coverage thresholds:**

| Metric | Required |
|---|---|
| Lines | ≥ 60% |
| Functions | ≥ 60% |
| Branches | ≥ 50% |

---

### 1E. Run All Unit Tests Together (from root)

```bash
npm test
```

Equivalent to running `1A` + `1C` in sequence. Exits non-zero if any test fails.

---

### 1F. E2E Tests (Playwright)

**Requires both dev servers running** (see Prerequisites above).

```bash
npx playwright test
```

Playwright will launch a Chromium browser and run automated UI flows.

**Test files and expected results:**

#### `tests/e2e/public.spec.ts` — Public pages

| Test | Expected | Notes |
|---|---|---|
| Homepage loads without errors | ✅ Pass | Checks page title and nav visibility |
| Navigation dropdown opens on hover | ✅ Pass | Hovers "News", checks Announcements/Events appear |
| Clicking Announcements navigates to `/bulletin` | ⚠️ Check URL | Test asserts `/announcements` pattern — actual route is `/bulletin`. Will pass only if the router redirects, otherwise ❌ Fail. **Fix:** update the test to expect `/bulletin` |
| `/announcements` search bar filters | ⚠️ Route mismatch | Test navigates to `/announcements` directly — may 404. **Fix:** change to `/bulletin` |
| Category filter chips visible | ⚠️ Route mismatch | Same issue — test navigates to `/announcements` |
| Clicking category chip filters list | ⚠️ Route mismatch | Same issue |
| Events page loads | ✅ Pass | |
| Events search bar present | ✅ Pass | |
| Officers page loads | ✅ Pass | |
| Committee card opens modal | ✅ Pass (if data exists) | Conditional — skips if no committee cards found |
| Borrow page loads | ✅ Pass | |
| Request to Borrow button opens form | ✅ Pass (if data exists) | Conditional — skips if no items in inventory |

> **Known issue in E2E public tests:** Four tests use the route `/announcements` but the
> actual React Router path is `/bulletin`. Update `tests/e2e/public.spec.ts` to use
> `/bulletin` before running. Until fixed, those 4 tests will fail.

#### `tests/e2e/auth.spec.ts` — Authentication

| Test | Expected | Notes |
|---|---|---|
| `/admin` redirects unauthenticated users | ✅ Pass | |
| Login form rejects empty credentials | ✅ Pass | |
| Login form rejects invalid credentials | ✅ Pass | Makes real login attempt, expects to stay on login page |
| Successful login navigates to dashboard | ⏭ Skipped | Requires `TEST_ADMIN_EMAIL` + `TEST_ADMIN_PASSWORD` env vars |

#### `tests/e2e/admin.spec.ts` — Admin panel

| Test | Expected | Notes |
|---|---|---|
| Can navigate between panels via sidebar | ⏭ Skipped | Requires auth — all tests in this file are `test.skip` |

**To run the skipped auth-required tests:**
```bash
TEST_ADMIN_EMAIL=your@email.com TEST_ADMIN_PASSWORD=YourPassword npx playwright test
```

**E2E expected summary (without credentials set):**

```
✓  [chromium] public.spec.ts — ~7 pass (4 may fail due to /announcements route bug)
✓  [chromium] auth.spec.ts — 3 pass · 1 skipped
⏭ [chromium] admin.spec.ts — 1 skipped

Passed:  ~10
Skipped: 2
Failed:  0–4 (depending on /announcements route bug)
```

**Playwright HTML report** (opens in browser after the run):
```bash
npx playwright show-report
```

---

### 1G. Full Test Run (everything)

```bash
npm run test:all
```

Runs unit tests for both backend and frontend, then E2E.
Exit code 0 = all passed. Exit code 1 = at least one failure.

---

## Track 2 — Manual UI Smoke Test

Work through this checklist top to bottom.
Mark each item ✅ Pass or ❌ Fail as you go.

---

### 2A. Public pages — anonymous visitor

Open `http://localhost:5173` in an incognito/private window (ensures no admin session).

#### Homepage

| # | Step | Expected result | Result |
|---|---|---|---|
| 1 | Open `http://localhost:5173` | Page loads, navigation bar visible, no error messages | |
| 2 | Hover "News" in the nav bar | Dropdown appears with Announcements and Events | |
| 3 | Hover "Resources" | Dropdown shows Documents and Borrow Equipment | |
| 4 | Hover "About" | Dropdown shows About, Officers, Organizations, Contributors | |
| 5 | Scroll down the homepage | Hero, announcements strip, events section, about section, organizations grid all render | |
| 6 | Check the latest announcements strip | Shows announcement titles with dates | |

#### Announcements (`/bulletin`)

| # | Step | Expected result | Result |
|---|---|---|---|
| 7 | Click Announcements under News | Navigates to `/bulletin` | |
| 8 | Page renders with announcements | Cards visible with images, category tags, titles, dates | |
| 9 | Type in the search bar | List filters as you type | |
| 10 | Click "Class Advisories" category chip | Only Class Advisories announcements shown | |
| 11 | Click "All" chip | All announcements restored | |
| 12 | Click any announcement card | Modal opens with full content | |
| 13 | Click outside the modal | Modal closes | |
| 14 | Check term dropdown | Options list academic years (e.g. AY 2025-2026) | |

#### Documents (`/documents`)

| # | Step | Expected result | Result |
|---|---|---|---|
| 15 | Click Documents under Resources | Navigates to `/documents` | |
| 16 | Page renders with document cards | Cards show name, category, date | |
| 17 | Click a document type in the left sidebar | List filters to that type | |
| 18 | Click View on any document card | PDF opens inside the page | |
| 19 | Check that no raw database errors appear | No error text like "supabase" or "500" visible | |

#### Events (`/events`)

| # | Step | Expected result | Result |
|---|---|---|---|
| 20 | Click Events under News | Navigates to `/events` | |
| 21 | Event cards render with photos | Each card shows a photo, name, and date | |
| 22 | Type in the search bar | Results filter | |
| 23 | Click an event card | Modal opens with full details and photo gallery | |
| 24 | If event has multiple photos, click arrow | Carousel navigates to next photo | |
| 25 | Click outside the modal | Modal closes | |

#### Officers (`/officers`)

| # | Step | Expected result | Result |
|---|---|---|---|
| 26 | Click Officers under About | Navigates to `/officers` | |
| 27 | President card renders at top | Crown badge visible, centered card | |
| 28 | Executive Officers grid renders | Officer cards with photos/initials, position, Facebook link | |
| 29 | Board Members section renders | Board member cards visible | |
| 30 | Advisers section renders | Adviser cards visible (no Facebook link) | |
| 31 | Committees section renders | Committee cards with "View members →" link | |
| 32 | Click a committee card | Modal opens listing officials and members | |
| 33 | Search bar filters officers | Type a name — matching officers shown, others hidden | |

#### Borrow Equipment (`/borrow`)

| # | Step | Expected result | Result |
|---|---|---|---|
| 34 | Click Borrow Equipment under Resources | Navigates to `/borrow` | |
| 35 | Equipment inventory grid renders | Cards show item name, stock count, AVAILABLE/OUT badge | |
| 36 | Click "Available" filter pill | Only available items shown | |
| 37 | Type in search bar | Filters by equipment name | |
| 38 | Click "Request to Borrow" on an available item | Form opens with 4 sections | |
| 39 | Submit form without required fields | Error message appears ("Please fill in all required fields") | |
| 40 | Fill all required fields and submit | Success page shows "Your equipment request has been submitted!" | |
| 41 | Click "Browse Equipment" on success page | Returns to inventory list | |

#### Other public pages

| # | Step | Expected result | Result |
|---|---|---|---|
| 42 | Click About under About dropdown | Navigates to `/about`, CSG mission text renders | |
| 43 | Click Organizations under About dropdown | Scrolls to organizations section | |
| 44 | Click Contributors under About dropdown | Navigates to `/contributors`, team cards render | |
| 45 | Click the CSG logo in the nav bar | Returns to homepage | |
| 46 | Open site on a mobile viewport (DevTools) | Hamburger menu appears, all content responsive | |

---

### 2B. Admin panel — authenticated

Log into the admin panel. Use a real CSG admin account.

#### Login

| # | Step | Expected result | Result |
|---|---|---|---|
| 47 | Navigate to `http://localhost:5173/admin/login` | Login form renders | |
| 48 | Submit with empty fields | Form does not submit | |
| 49 | Enter wrong password | Stays on login page, error message shown | |
| 50 | Enter correct credentials and click Log In | Redirects to `/admin`, Dashboard renders | |

#### Dashboard

| # | Step | Expected result | Result |
|---|---|---|---|
| 51 | Stat line renders | Shows total documents · announcements · events | |
| 52 | Bar chart renders | Document Uploads by week chart visible | |
| 53 | Pie chart renders | Storage usage chart visible | |
| 54 | Recent Activity table renders | Shows last 5 admin actions | |
| 55 | Total Officers card shows a number | Not blank or "—" after loading | |
| 56 | Click "View All Logs" | Navigates to Audit Log panel | |

#### Announcements panel

| # | Step | Expected result | Result |
|---|---|---|---|
| 57 | Click Announcements in the sidebar | Panel renders, Active tab shows announcement table | |
| 58 | Click "Add Announcement" | Form slides in with Title, Category, Description, Image fields | |
| 59 | Submit form with empty Title | Form shows error or stays open | |
| 60 | Fill all fields and click Post | Form closes, new announcement appears in the Active table | |
| 61 | Open public site `/bulletin` in another tab | New announcement is visible | |
| 62 | Hover a row, click Pin icon | Announcement gets "Pinned" badge (yellow highlight) | |
| 63 | Check `/bulletin` on public site | Pinned announcement appears as featured card | |
| 64 | Hover a row, click Archive icon | Announcement disappears from Active, appears in Archived tab | |
| 65 | Click Archived tab, click Restore | Announcement returns to Active tab | |
| 66 | Hover a row, click Bin icon | Moves to Bin tab | |
| 67 | Click Bin tab, click Restore | Returns to Active tab | |
| 68 | Bin tab — click Delete, confirm | Announcement permanently removed, not visible in any tab | |

#### Documents panel

| # | Step | Expected result | Result |
|---|---|---|---|
| 69 | Click Documents in the sidebar | Panel renders with Active/Archived/Bin tabs | |
| 70 | Click Add, fill fields, upload a PDF | PDF Selector overlay opens for redaction boxes | |
| 71 | Click Done and click Post | Form closes, document appears in Active table | |
| 72 | Check public `/documents` page | New document card visible | |
| 73 | Hover a row, click Archive | Moves to Archived tab | |
| 74 | Restore from Archived | Returns to Active | |

#### Events panel

| # | Step | Expected result | Result |
|---|---|---|---|
| 75 | Click Events in the sidebar | Panel renders | |
| 76 | Add an event with a name, description, date, and 1 photo | Event appears in Active table | |
| 77 | Check public `/events` page | New event card visible | |
| 78 | Archive the event | Moves to Archived tab | |

#### Officers panel

| # | Step | Expected result | Result |
|---|---|---|---|
| 79 | Click Officers in the sidebar | Panel renders with Active/Archived tabs | |
| 80 | Add an officer with type = Executive | Officer appears in Active table | |
| 81 | Check public `/officers` page | New officer visible in Executive Officers section | |
| 82 | Edit the officer's position | Change is reflected in the table | |
| 83 | Archive the officer (term year required) | Moves to Archived tab | |

#### Committees panel

| # | Step | Expected result | Result |
|---|---|---|---|
| 84 | Click Committees in the sidebar | Panel renders with committee list | |
| 85 | Add a committee | Appears in Active table | |
| 86 | Click the committee name to rename inline | Name becomes editable input | |
| 87 | Save the rename | Updated name shown | |
| 88 | Check public `/officers` — Committees section | New/renamed committee visible | |

#### Organizations panel

| # | Step | Expected result | Result |
|---|---|---|---|
| 89 | Click Organizations in the sidebar | Panel renders | |
| 90 | Add an organization with a name | Appears in Active table | |
| 91 | Check public homepage and `/about` | New organization card visible | |

#### Equipment panel

| # | Step | Expected result | Result |
|---|---|---|---|
| 92 | Click Equipment in the sidebar | Borrow Requests tab shows request table | |
| 93 | Switch to Inventory Management tab | Equipment list renders with name, quantity, status | |
| 94 | Submit a borrow request on public site (`/borrow`) | Request appears in Borrow Requests table | |
| 95 | Click Approve on the request | Status changes to Approved, inventory quantity decreases | |
| 96 | Click Mark Returned | Status changes to Returned, quantity restored | |

#### Bin panel

| # | Step | Expected result | Result |
|---|---|---|---|
| 97 | Click Bin in the sidebar | Deleted tab shows all soft-deleted items | |
| 98 | Click Archived tab | Shows archived officers by term | |
| 99 | Select multiple items with checkboxes | Action toolbar appears at bottom | |
| 100 | Click Restore on one item | Item removed from Bin, returns to Active in its panel | |

#### Settings panel

| # | Step | Expected result | Result |
|---|---|---|---|
| 101 | Click Settings in the sidebar | Panel renders with 4 sections | |
| 102 | Change Administration Term dropdown | Save button becomes active | |
| 103 | Click Save | Term saved, public Officers page now filters to new term | |
| 104 | Account Security — change password | New password required to log in on next session | |
| 105 | Click "View System Changelog" | Changelog modal opens | |

#### Audit Log panel

| # | Step | Expected result | Result |
|---|---|---|---|
| 106 | Click Audit Log in the sidebar | Table renders with action, table, record ID, admin, timestamp | |
| 107 | Check that actions from this session appear | Add/edit/archive/delete actions from above steps are logged | |
| 108 | Filter by "Today" | Only today's logs shown | |

#### Logout

| # | Step | Expected result | Result |
|---|---|---|---|
| 109 | Click Log Out at the bottom of the sidebar | Redirects to `/admin/login` |  |
| 110 | Navigate to `http://localhost:5173/admin` | Shows "Access Restricted" screen, not the dashboard | |

---

## Known Issues to Note During Testing

| Issue | Affected test | Severity |
|---|---|---|
| E2E public tests use `/announcements` route — actual route is `/bulletin` | `public.spec.ts` lines 20–37 | ⚠️ Medium — 4 E2E tests fail until fixed |
| `POST /user/register` — `registerSchema` not applied — password complexity not enforced by API | `user.test.js` (4 `.todo` tests) | 🔵 Low — schema exists, just not wired to this route |
| 30-day bin auto-purge — no scheduler implemented | Manual test item 97 | 🔵 Low — items accumulate until manually purged |
| Remove admin button in Settings is a placeholder | Manual test item 101 | 🔵 Low — UI shows button but no action |
| Committees Bin view may be empty if `deleted_at` migration not run | Manual test item 97 | ⚠️ Medium — contact system administrator |

---

## Quick Command Reference

```bash
# From project root (CSG-OITS-Dev/)

npm test                        # backend + frontend unit tests
npm run test:backend            # backend only
npm run test:frontend           # frontend only
npm run test:e2e                # Playwright E2E (needs servers running)
npm run test:e2e:ui             # Playwright with visual browser
npm run test:all                # everything
npm run test:coverage           # both with coverage thresholds

# With admin credentials for auth-required E2E tests
TEST_ADMIN_EMAIL=you@email.com TEST_ADMIN_PASSWORD=YourPass npm run test:e2e

# View Playwright HTML report after E2E run
npx playwright show-report
```
