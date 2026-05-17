# frontend/src/layout

Homepage section components. Assembled in `route/homepage/App.tsx`.

## Overview

These components render the individual sections of the homepage (`/`). Each section is a self-contained layout component that receives data from the outlet context or renders static content. They are not used on other public pages — pages like `/bulletin` use their own dedicated route components in `route/`.

## Contents

| Subdirectory | Component | Section |
|---|---|---|
| `main-section/` | `Main.tsx` | Hero section with live stats (officer count, document count, etc.) |
| `announcement-section/` | `Announcement.tsx` | Latest announcements strip — shows the pinned announcement and recent posts |
| `events-section/` | `events.tsx` | Latest events with image carousel and pagination |
| `officer-layout/` | `Officer.tsx` | Officer preview grid showing active officers |
| `about-section/` | `About.tsx` | Static about CSG section |
| `document-section/` | `BulletinDocuments.tsx` | Document section preview on homepage |
| `organizations-section/` | — | Student organizations preview |

## Data source

All data comes from `useOutletContext<OutletContextType>()` — no additional API calls should be made inside these components. They receive `bulletin`, `documents`, `events`, `officers`, and `organizations` from the outlet context.

## Related

- [frontend/src/root-layout/README.md](../root-layout/README.md) — data provider
- [frontend/src/route/homepage/](../route/homepage/) — assembles these sections into the page
