# frontend/src/admin/components

Shared components used across admin panels.

## Overview

These components are the building blocks of the admin panel UI. They are not used on public pages. Each subdirectory is a self-contained component with its own CSS.

## Contents

| Subdirectory               | Purpose                                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sidebar/`                 | Admin sidebar with navigation buttons (from `dashboard-buttonConfig.tsx`), admin user info, and logout button                                                           |
| `form/`                    | Universal `Form.tsx` component for Announcements, Documents, Events — controlled by `forType` prop                                                                      |
| `modals/`                  | Shared modal components: `DeleteModal`, `ConfimationModal`, `SessionExpiredModal`, `ChangelogModal`, `PauseAccessModal`                                                 |
| `action-bar/`              | `Actionbar.tsx` — floating bar shown when rows are selected, with bulk Archive and Delete buttons                                                                       |
| `filter/`                  | Filter dropdown and sort components for admin table toolbars                                                                                                            |
| `avatar/`                  | Admin avatar/initials fallback component                                                                                                                                |
| `charts/`                  | Dashboard chart components using Chart.js (bar chart, line chart, pie chart)                                                                                            |
| `content-preview/`         | Content preview helpers used in table rows                                                                                                                              |
| `settings-form/`           | `PasswordForm` and other settings-specific form components                                                                                                              |
| `pdf-selector-components/` | PDF redaction UI — `pdf-selector.tsx` lets admins draw redaction boxes over PDF pages before upload. Also contains `main.py` (the Python redaction microservice source) |

## Key components

### `sidebar/dashboard-buttonConfig.tsx`

Defines the array of sidebar button configs (label, `name` for `?panel=` param, icon). The sidebar iterates this array and calls `setSearchParams({ panel: name })` on click.

### `form/Form.tsx`

Universal form modal controlled by a `forType` prop (`'announcement'`, `'document'`, `'event'`). Renders different fields based on type. Submits to the appropriate add/edit endpoint. Calls `onSuccess()` on successful write.

### `modals/SessionExpiredModal.tsx`

Full-screen overlay triggered by the axios 401 interceptor in `AdminPage.tsx`. Shows session expired message. "Go to Login" button clears `localStorage` and navigates to `/admin/login`.

### `modals/ConfimationModal.tsx`

Generic yes/no confirmation dialog. Used before all bulk destructive operations (archive, delete). Red "Confirm" button, gray "Cancel".

### `modals/DeleteModal.tsx`

Single-item hard delete confirmation. `source` prop determines the delete endpoint and request body shape.

### `pdf-selector-components/`

Contains both the React component for drawing redaction boxes (`pdf-selector.tsx`) and `main.py` — the source of the Python PDF redaction microservice. The Python file should eventually be moved to a standalone service directory for production deployment.

## Related

- [frontend/src/admin/panel/README.md](../panel/README.md) — panels that use these components
- [docs/admin-guide.md](../../../../docs/admin-guide.md) — per-panel documentation
