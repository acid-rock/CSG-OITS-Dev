# frontend/src/admin

Entire admin panel — authentication pages, the panel shell, all content panels, components, and utilities.

## Overview

The admin panel is a password-protected content management interface for CSG administrators. It lives at `/admin` and uses a `?panel=` URL query parameter for internal navigation — there are no additional nested routes. The blue sidebar on the left links to 12 content panels. All API calls use `axiosInstance` with `withCredentials: true` to include the httpOnly session cookie.

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

## Design system note

The admin panel uses its own CSS design system — a blue sidebar with dark-tone UI — that is separate from the public `tokens.css`. Do not apply public token variables to admin panel components. Follow existing admin CSS patterns in `adminPanel.css` and per-component CSS files.

## Rules

- All admin write calls must include `withCredentials: true` (already configured in `axiosInstance`).
- Never use `window.location.reload()` after writes — update local React state directly.
- Never use the `any` TypeScript type.

## Related

- [frontend/src/admin/panel/README.md](panel/README.md) — all 12 content panels
- [frontend/src/admin/components/README.md](components/README.md) — shared admin UI components
- [docs/admin-guide.md](../../../docs/admin-guide.md) — full admin panel documentation
- [docs/auth.md](../../../docs/auth.md) — authentication flow
