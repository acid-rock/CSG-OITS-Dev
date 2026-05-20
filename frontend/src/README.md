# frontend/src

Root of the frontend source tree. Contains all React components, routes, styles, config, and hooks.

## Overview

The `src/` directory is organized by role. Page-level routes are in `route/`, homepage section components are in `layout/`, shared reusable components are in `components/`, and the entire admin panel is in `admin/`. All axios fetch functions are in `config/`. The design system lives in `styles/`.

## Directory Map

| Path                | Purpose                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `main.tsx`          | Router definition — all public and admin routes declared here                                      |
| `index.css`         | Global base styles, Wave 11A design tokens, utility classes, Google Fonts import                   |
| `styles/tokens.css` | Design system CSS custom properties (legacy + Wave 11A tokens)                                     |
| `root-layout/`      | `Root-layout.tsx` — parallel data fetch on mount, outlet context provider, wraps all public routes |
| `route/`            | Page-level route components (one subdirectory per route)                                           |
| `layout/`           | Homepage section components (assembled in `route/homepage/App.tsx`)                                |
| `components/`       | Shared public UI components (Navigation, Footer, Modal, SearchFilterBar, etc.)                     |
| `config/`           | Axios fetch functions and the shared axios instance                                                |
| `hooks/`            | Custom React hooks                                                                                 |
| `admin/`            | Entire admin panel — `AdminPage.tsx`, `ProtectedRoute.tsx`, panels, sidebar, forms, modals         |
| `bulletin-layouts/` | Bulletin/announcement layout components used by the public pages                                   |
| `assets/`           | Static image assets                                                                                |

## Key files

| File                | Purpose                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------- |
| `main.tsx`          | `createBrowserRouter` definition — source of truth for all URL paths                    |
| `index.css`         | All utility classes (`.btn-*`, `.card`, `.tag-*`, `.section-*`, etc.) + Wave 11A tokens |
| `styles/tokens.css` | All CSS custom property tokens — import this via `index.css`                            |

## Conventions

- Never hardcode hex colors — use `var(--color-*)` token variables. (CONTRIBUTING.md Rule F2)
- Never use the `any` TypeScript type. (Rule F3)
- Never use `window.location.reload()` — update local state directly. (Rule F1)
- Child routes must consume outlet context data via `useOutletContext()` — do not re-fetch data already in the context.
- All modals must use `useLockBodyScroll` hook.

## Related

- [frontend/README.md](../README.md) — setup and commands
- [docs/frontend.md](../../docs/frontend.md) — architecture detail
- [docs/design-system.md](../../docs/design-system.md) — token reference
