# frontend/src/components

Shared public UI components used across multiple public pages.

## Overview

These components are reusable building blocks for the public-facing site. They are not used in the admin panel (the admin panel has its own components in `admin/components/`). Each subdirectory contains one component with its CSS file.

## Contents

| Subdirectory         | Component             | Purpose                                                                                           |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| `navigation/`        | `Navigation.tsx`      | Top navigation bar with desktop dropdown menus and mobile hamburger accordion                     |
| `footer/`            | `Footer.tsx`          | Site footer with Privacy Policy, Terms, Cookie Settings, Facebook link, and feedback form link    |
| `modal/`             | `Modal.tsx`           | Announcement and event detail modal with image carousel, prev/next navigation, and backdrop close |
| `document-modal/`    | `DocumentModal.tsx`   | PDF document viewer in an `<iframe>` with `useLockBodyScroll`                                     |
| `search-filter-bar/` | `SearchFilterBar.tsx` | Reusable search input + optional term filter dropdown toolbar                                     |
| `announcement-card/` | —                     | Announcement card used in the bulletin and homepage                                               |
| `event-card/`        | —                     | Event card with full-bleed image                                                                  |
| `document-card/`     | —                     | Document card with thumbnail and download link                                                    |
| `officer-card/`      | —                     | Officer card with avatar, crown tag for President, Facebook link                                  |
| `organization-card/` | —                     | Organization card with logo/initials fallback and Facebook link                                   |
| `button/`            | —                     | Button component                                                                                  |
| `sidebar/`           | —                     | Sidebar component (public-facing, not admin)                                                      |
| `typography/`        | —                     | Typography utility components                                                                     |

## Key component props

### `SearchFilterBar`

```tsx
{
  searchValue: string;
  onSearchChange: (v: string) => void;
  termValue?: string;
  onTermChange?: (v: string) => void;
  termOptions?: string[];
  searchPlaceholder?: string;
  showTermFilter?: boolean;  // default: true
}
```

Used on `/bulletin`, `/events`, `/officers`, `/borrow`.

### `Modal`

Used for announcements and events. For events, enables an image carousel with 350ms slide transitions and dot indicators.

### `DocumentModal`

Renders a Supabase Storage PDF URL in an `<iframe>`. Uses `useLockBodyScroll`.

## Conventions

- All components use CSS token variables — no hardcoded hex colors.
- All modals use `useLockBodyScroll()` from `hooks/useLockBodyScroll.ts`.
- The `Navigation.tsx` component uses `NavLink` `isActive` for active link highlighting — no custom state needed.

## Related

- [frontend/src/hooks/README.md](../hooks/README.md) — `useLockBodyScroll`
- [docs/design-system.md](../../../docs/design-system.md) — token system
