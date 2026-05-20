# frontend/src/admin/panel

The 12 content panel components rendered by `ContentPanel.tsx` based on the `?panel=` URL parameter.

## Overview

Each subdirectory is a self-contained content panel that manages its own state (data array, loading, error, active tab, filters, selected IDs). Panels fetch their data via `axiosInstance` (which includes the httpOnly auth cookie). Writes re-fetch the active list on success via `fetchData()`.

## Panels

| Subdirectory     | `?panel=` key   | Description                                                                                                               |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `dashboard/`     | `dashboard`     | Stats cards (officers, documents, announcements, events) + bar chart + line chart + pie chart + recent audit log activity |
| `announcement/`  | `announcement`  | Bulletin CRUD — Active/Archived/Bin tabs, pin/archive/restore/delete, image upload                                        |
| `documents/`     | `documents`     | PDF document CRUD — upload + PDF redaction selector, Active/Archived/Bin tabs                                             |
| `events/`        | `events`        | Event CRUD — up to 3 photos per event, Active/Archived/Bin tabs                                                           |
| `officers/`      | `officers`      | Officer roster management — avatar upload, committee assignment, term archiving, Active/Archived tabs                     |
| `committees/`    | `committees`    | Committee management — inline rename, bulk archive, Active/Archived tabs                                                  |
| `borrowing/`     | `borrowing`     | Two sub-tabs: Borrow Requests (approve/reject/return) + Inventory (add/edit/delete equipment)                             |
| `organizations/` | `organizations` | Organization CRUD — logo upload, Facebook link, Active/Archived/Bin tabs                                                  |
| `auditlog/`      | `auditlog`      | Read-only audit log — all write operations with admin email, action, entity, timestamp, date filter                       |
| `contributors/`  | `contributors`  | Dev team credits with avatar lookup from officers API                                                                     |
| `settings/`      | `settings`      | Active term management, admin account list, password change, changelog modal                                              |

Note: The Bin panel is rendered from `route/bin/Bin.tsx` (not the `panel/` directory) with `?panel=bin`.

## Common patterns

**Three-tab pattern:** Most panels have Active, Archived, and Bin tabs. Switching tabs re-fetches with different query parameters.

**Hover action buttons:** Action buttons (Edit, Archive, Delete) are hidden by default and appear on row hover (`hoveredRowId === id`). This keeps tables clean.

**Bulk selection:** Checkboxes in the leftmost column. When rows are selected, `Actionbar.tsx` appears at the bottom with Archive and Delete buttons.

**`fetchData` pattern:**

```tsx
const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const res = await axiosInstance.get("/announcements/");
    setData(res.data);
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

After any write, call `onSuccess?.()` → `fetchData()` to re-fetch without reloading the page.

## Panel key → component mapping

Defined in `contentPanel/ContentPanel.tsx`:

```tsx
const panel = [
  { name: "dashboard", content: <Dashboard /> },
  { name: "announcement", content: <Announcement /> },
  { name: "documents", content: <Documents /> },
  { name: "events", content: <Events /> },
  { name: "officers", content: <OfficersPanel /> },
  { name: "committees", content: <CommitteesPanel /> },
  { name: "borrowing", content: <BorrowingPanel /> },
  { name: "auditlog", content: <Audit /> },
  { name: "contributors", content: <Contributor /> },
  { name: "settings", content: <Settings /> },
  { name: "bin", content: <Bin /> },
  { name: "organizations", content: <OrganizationsPanel /> },
];
```

## Related

- [docs/admin-guide.md](../../../../docs/admin-guide.md) — detailed per-panel documentation (fields, validations, actions)
- [frontend/src/admin/components/README.md](../components/README.md) — shared admin UI components used by panels
