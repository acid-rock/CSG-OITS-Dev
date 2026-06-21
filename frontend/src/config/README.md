# frontend/src/config

Axios fetch functions and shared HTTP client configuration.

## Overview

This directory contains one fetch function per API resource plus global axios setup. These functions are called by `Root-layout.tsx` during the parallel data fetch on mount. Admin panel components call the API directly via the raw `axios` instance (with `withCredentials: true`) rather than using these config functions.

## Contents

| File                        | Exports                               | API call                                                                                           |
| --------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `axiosSetup.ts`             | — (side-effect import)                | Registers a global axios request interceptor that attaches the `X-CSRF-Token` header from the `csrf_token` cookie. Imported once in `main.tsx`. |
| `bulletinConfig.ts`         | `fetchBulletinData()`                 | `GET /announcements/` — formats dates, returns `Announcement[]`                                    |
| `documentsConfig.ts`        | `fetchDocuments(page?, limit?)`       | `GET /documents/` — supports optional pagination                                                   |
| `eventConfig.ts`            | `fetchEvents()`                       | `GET /events/` — formats dates, returns `Event[]`                                                  |
| `officerConfig.ts`          | `fetchOfficers(page?, limit?, term?)` | `GET /officers/` — supports term filter                                                            |
| `committeeConfig.ts`        | `fetchCommittees()`                   | `GET /committees/` — returns `Committee[]`                                                         |
| `organizationsConfig.ts`    | `fetchOrganizations()`                | `GET /organizations/`                                                                              |
| `navigationConfig.tsx`      | —                                     | Navigation dropdown structure definition                                                           |
| `officers-board-members.ts` | —                                     | Static helper config for officer type ordering                                                     |

## Usage

These functions are called in `Root-layout.tsx` inside `Promise.allSettled`:

```tsx
const [, bulletinResult, docsResult, eventsResult, officersResult, orgsResult] =
  await Promise.allSettled([
    axios.get("/settings/term"),
    fetchBulletinData(),
    fetchDocuments(),
    fetchEvents(),
    fetchOfficers(activeTerm),
    fetchOrganizations(),
  ]);
```

## `VITE_API_URL`

All functions build URLs from `import.meta.env.VITE_API_URL`. In development this is `https://localhost:3000/api/v1`. In production it is the deployed backend URL.

## Rules

- Child route components must NOT call these functions directly if the data is already in the outlet context. Use `useOutletContext()` instead.
- If a public page needs data not in the outlet context (e.g., committees within Officers.tsx), a direct `axios.get()` inside `useEffect` is acceptable.
- Admin panel write calls must pass `withCredentials: true`, which is required for the httpOnly cookie authentication. The CSRF header is attached automatically by the global interceptor in `axiosSetup.ts`.

## Related

- [frontend/src/root-layout/README.md](../root-layout/README.md) — how these are used
- [docs/frontend.md](../../../docs/frontend.md) — outlet context data flow
- [docs/decisions/003-root-layout-data-fetching.md](../../../docs/decisions/003-root-layout-data-fetching.md)
