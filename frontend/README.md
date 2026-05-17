# frontend

React 19 + TypeScript + Vite 7 single-page application for CSG-OITS. Serves both the public transparency site and the authenticated admin panel.

## Overview

The frontend is a Vite-built React SPA. It has two distinct audiences: public students (no login required) and CSG administrators (email + password login). Public data is pre-fetched in `Root-layout.tsx` and distributed via React Router's outlet context. The admin panel is a single route (`/admin`) with internal navigation via `?panel=` query parameters.

## Two audiences

| Audience | URL | Auth required | What they do |
|---|---|---|---|
| Students (public) | `/`, `/bulletin`, `/documents`, `/events`, `/officers`, `/about`, `/borrow`, `/contributors`, `/organizations` | No | Read-only: browse announcements, download docs, view events, see officers, submit borrow requests |
| CSG Admins | `/admin` | Yes (httpOnly cookie) | Full CRUD on all content, manage equipment, view audit log, configure settings |

## Commands

```bash
# Install dependencies
npm install

# Start dev server (HTTPS required — see below)
npm run dev       # https://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## HTTPS requirement

The backend sets `sb_access_token` with `secure: true`. Browsers refuse to store or send secure cookies over plain HTTP, so login appears to work (returns 200) but no cookie is stored, and all subsequent admin calls return 403. **Local development requires HTTPS via mkcert.** See [docs/local-setup.md](../docs/local-setup.md) Step 3.

## Environment variables (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend base URL, e.g. `https://localhost:3000/api/v1` |
| `VITE_GITHUB_OWNER` | No | GitHub org for Settings changelog modal |
| `VITE_GITHUB_REPO` | No | GitHub repo name for Settings changelog modal |

## Outlet context pattern

`Root-layout.tsx` fetches all public data in parallel on mount and passes it to child routes via React Router's `<Outlet context={...}>`. Child routes consume it with `useOutletContext<OutletContextType>()`.

```tsx
// In a child route component
import { useOutletContext } from 'react-router-dom';
const { bulletin, documents, events, officers, organizations } =
  useOutletContext<OutletContextType>();
```

Child routes must NOT add their own fetch calls for data already in the outlet context. See ADR 003 (`docs/decisions/003-root-layout-data-fetching.md`).

## Admin panel navigation

The admin panel uses a single route (`/admin`) with `?panel=` query parameters for internal navigation. There are no additional routes like `/admin/announcements`. The URL looks like `/admin?panel=announcement`.

## Key files

| File | Purpose |
|---|---|
| `src/main.tsx` | All routes defined here using `createBrowserRouter` |
| `src/root-layout/Root-layout.tsx` | All public data fetched here; outlet context provider |
| `src/styles/tokens.css` | Design system tokens — always use these, never hardcode hex |
| `src/index.css` | Global styles, Wave 11A tokens, utility classes |
| `src/admin/AdminPage.tsx` | Admin panel shell with sidebar + content area |
| `src/admin/ProtectedRoute.tsx` | localStorage-based UI gate (not the real auth boundary) |
| `src/admin/contentPanel/ContentPanel.tsx` | Renders the active `?panel=` component |

## Related docs

- [docs/frontend.md](../docs/frontend.md) — complete frontend architecture guide
- [docs/admin-guide.md](../docs/admin-guide.md) — every admin panel documented
- [docs/design-system.md](../docs/design-system.md) — token reference and utility classes
- [docs/auth.md](../docs/auth.md) — authentication flow
