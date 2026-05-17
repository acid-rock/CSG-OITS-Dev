# frontend/src/root-layout

Central data-fetch layer for all public routes. Wraps every public page with Navigation, Footer, and pre-fetched API data via outlet context.

## Overview

`Root-layout.tsx` is the parent layout component for all public routes. It has two responsibilities:
1. Render the Navigation bar, the child route (via `<Outlet>`), and the Footer.
2. Fetch all public data in parallel on mount and pass it to child routes via React Router's outlet context.

This is the only component that should fetch public API data. Child routes consume it via `useOutletContext<OutletContextType>()`.

## Contents

| File | Purpose |
|---|---|
| `Root-layout.tsx` | Navigation + parallel data fetch + Outlet + Footer |

## What it fetches

On mount, `Root-layout.tsx` fires six requests simultaneously via `Promise.allSettled`:

```tsx
const [settingsResult, bulletinResult, docsResult, eventsResult, officersResult, orgsResult] =
  await Promise.allSettled([
    axios.get('/settings/term'),          // → activeTerm (for officer filtering)
    fetchBulletinData(),                   // → bulletin[]
    fetchDocuments(),                      // → documents[]
    fetchEvents(),                         // → events[]
    fetchOfficers(activeTerm),             // → officers[]
    fetchOrganizations(),                  // → organizations[]
  ]);
```

`Promise.allSettled` means partial failures are tolerated. If one call fails, the rest still render with whatever data succeeded.

## Outlet context

The resolved data is passed as the outlet context to all child routes:

```tsx
<Outlet context={{ bulletin, documents, events, officers, organizations }} />
```

Child routes consume it:
```tsx
const { bulletin, officers } = useOutletContext<OutletContextType>();
```

See `docs/frontend.md` for the full `OutletContextType` TypeScript interface.

## Rules

- New public data sources (new API endpoints) MUST be added to the `Promise.allSettled` call in this file.
- New public page components MUST consume data from outlet context — they must NOT make their own fetch calls for data already available here.
- Exception: if a child route needs data not in the outlet context (e.g., `Officers.tsx` fetching committees), a direct `axios.get()` inside `useEffect` is acceptable.

## Related

- [docs/decisions/003-root-layout-data-fetching.md](../../../docs/decisions/003-root-layout-data-fetching.md) — ADR explaining this pattern
- [docs/architecture.md](../../../docs/architecture.md) — outlet context data flow diagram
- [frontend/src/config/README.md](../config/README.md) — the fetch functions called here
