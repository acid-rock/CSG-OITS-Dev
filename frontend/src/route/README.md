# frontend/src/route

Page-level route components. One subdirectory per route.

## Overview

Each subdirectory contains the top-level component for a single URL path. All public routes are wrapped by `RootLayout` and receive data via `useOutletContext<OutletContextType>()`. Admin routes are in the `admin/` directory at the project root.

## Route Subdirectories

| Subdirectory | URL path | Description |
|---|---|---|
| `homepage/` | `/` | Homepage: hero stats, announcement strip, events, officer preview, about, organizations |
| `bulletin/` | `/bulletin` | Full announcements page with search, category filter, term filter, pinned hero card |
| `documents/` | `/documents` | Documents page: PDF viewer, sidebar category filter |
| `events/` | `/events` | Events gallery with image carousel modal |
| `about/` | `/about` | About CSG with live stats (officers, documents, committees) |
| `officers/` | `/officers` | Officer roster with type filter, committee modal, term filter |
| `borrow/` | `/borrow` | Public equipment borrow form + inventory grid |
| `contributors/` | `/contributors` | Dev team credits with officer avatar lookup |
| `organizations/` | `/organizations` | Student organizations grid |
| `bin/` | used at `/admin?panel=bin` | Bin panel (Deleted + Archived tabs) — used by the admin panel, not a standalone public route |

## Conventions

- Each route component reads data from `useOutletContext<OutletContextType>()` rather than making its own API calls for data that Root-layout already fetches.
- Route components that need additional data (e.g., Officers.tsx fetching committees for the dropdown) may call the API directly inside `useEffect`.
- The `/bulletin` and `/documents` pages are approved designs — do not modify them without explicit sign-off from the project lead. (CONTRIBUTING.md Rule F5)

## Related

- [frontend/src/root-layout/README.md](../root-layout/README.md) — data source for all public routes
- [docs/frontend.md](../../../docs/frontend.md) — route table with full details
- [docs/admin-guide.md](../../../docs/admin-guide.md) — admin panel (not in this directory)
