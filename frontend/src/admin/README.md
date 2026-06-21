# frontend/src/admin

Entire admin panel — authentication pages, the panel shell, all content panels, components, and utilities.

## Overview

The admin panel is a password-protected content management interface for CSG administrators. It lives at `/admin` and uses a `?panel=` URL query parameter for internal navigation — there are no additional nested routes. The blue sidebar on the left links to 12 content panels. API calls use the raw `axios` default instance with `withCredentials: true` to include the httpOnly session cookie. A global request interceptor (registered in `src/config/axiosSetup.ts`) automatically attaches the `X-CSRF-Token` header from the `csrf_token` cookie on every request.

## Entry points

| File                            | Purpose                                                                                                                                                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AdminPage.tsx`                 | Panel shell: sidebar + `ContentPanel` + `SessionExpiredModal`. Sets up the axios 401 interceptor that triggers session expiry overlay.                                                                                           |
| `ProtectedRoute.tsx`            | UI gate: checks `localStorage.getItem('admin_authenticated') === '1'`. Shows `AccessRestrictedScreen` if not set. **This is a UI gate only — the real auth is the httpOnly cookie verified by `requireAuth` on every API call.** |
| `admin-loginpage/`              | Login (`/admin/login`), forgot password (`/admin/forgot-password`), reset password (`/admin/reset-password`) — not wrapped in `ProtectedRoute`                                                                                   |
| `contentPanel/ContentPanel.tsx` | Reads `?panel=` search param; renders the matching panel component                                                                                                                                                               |
| `panel/`                        | All 12 content panel components                                                                                                                                                                                                  |
| `components/`                   | Shared admin UI components (sidebar, forms, modals, action bar, charts, etc.)                                                                                                                                                    |
| `lib/`                          | Admin-specific utilities                                                                                                                                                                                                         |
| `utils/`                        | Admin-specific helper functions                                                                                                                                                                                                  |
| `adminPanel.css`                | Admin panel global styles (separate from public token system)                                                                                                                                                                    |

## Panel navigation

Internal navigation is driven entirely by the `?panel=` URL query parameter. The sidebar calls `setSearchParams({ panel: 'announcement' })`. `ContentPanel.tsx` finds the matching panel in its array and renders it.

Valid `?panel=` values: `dashboard`, `announcement`, `documents`, `events`, `officers`, `committees`, `borrowing`, `organizations`, `auditlog`, `contributors`, `settings`, `bin`.

## Auth guard

`ProtectedRoute.tsx` checks the localStorage flag. If absent, it shows an `AccessRestrictedScreen` with a login button. If present, it renders `<AdminPage>`.

The `AdminPage.tsx` axios interceptor catches 401 responses and shows `SessionExpiredModal` — a full-screen overlay requiring the user to go back to login.

## Layout

All admin panels use the unified Layout B shell (consolidated AY 2025–2026):

- **Sidebar:** `panel/_shared/Sidebar.tsx` — the ONLY admin sidebar. Do not create a second one.
- **Shell:** wrap panel content in `<div className="ad-shell"><Sidebar active="<panel-id>" /><main className="ad-main">…</main></div>`
- **Styles:** `panel/_shared/admin-list.css` — import this at the top of every new panel
- **Atoms & Chrome:** `panel/_shared/atoms.tsx`, `panel/_shared/chrome.tsx` (Thumb, Tag, StatusPill, Tabs, Toolbar, BulkBar, TableFoot)
- **Icons:** `panel/_shared/icons.tsx`
- **Utils:** `panel/_shared/utils.ts` (timeAgo, fmtDate, downloadCSV, etc.)

When adding a new panel, copy the pattern from `panel/announcement/Announcement.tsx`.

## Design system note

The admin panel uses its own CSS design system (`panel/_shared/admin-list.css` + per-panel CSS) separate from the public `tokens.css`. Do not apply public token variables to admin panel components.

## Rules

- All admin write calls must include `withCredentials: true` (the CSRF header is added automatically by the global interceptor in `src/config/axiosSetup.ts`).
- Never use `window.location.reload()` after writes — update local React state directly.
- Never use the `any` TypeScript type.
- `parseInt()` is required on ALL committee ID comparisons (committees.id is an INTEGER).

## Related

- [frontend/src/admin/panel/README.md](panel/README.md) — all 12 content panels
- [frontend/src/admin/components/README.md](components/README.md) — shared admin UI components
- [docs/admin-guide.md](../../../docs/admin-guide.md) — full admin panel documentation
- [docs/auth.md](../../../docs/auth.md) — authentication flow
