# frontend/src/styles

Design system token file for CSG-OITS.

## Overview

`tokens.css` defines all CSS custom properties used across the public-facing frontend. It is the source of truth for the design system. `index.css` (in `src/`) imports and extends these tokens with the Wave 11A canonical set, plus all utility classes.

## Contents

| File | Purpose |
|---|---|
| `tokens.css` | Original design token set — CSS custom properties for color, typography, spacing, border radius, shadows, transitions, layout |

## Token categories

| Category | Token prefix | Examples |
|---|---|---|
| Primary colors | `--color-primary*` | `--color-primary`, `--color-primary-dark`, `--color-primary-deep` |
| Backgrounds | `--color-background*`, `--color-surface*` | `--color-background`, `--color-surface` |
| Text | `--color-text-*` | `--color-text-primary`, `--color-text-muted`, `--color-text-hint` |
| Borders | `--color-border*` | `--color-border`, `--color-border-focus` |
| Semantic | `--color-success*`, `--color-danger*`, `--color-warning*` | Status colors + their bg/text variants |
| Tag colors | `--color-tag-*` | Per-announcement-category colors |
| Layout | `--color-footer-bg`, `--color-background-hero*` | Section-specific colors |
| Typography | `--font-family-*`, `--font-size-*`, `--font-weight-*` | Font stacks, size scale, weights |
| Spacing | `--space-1` through `--space-24` | 4px base unit scale |
| Border radius | `--radius-sm` through `--radius-pill` | Size variants |
| Shadows | `--shadow-sm` through `--shadow-pop` | Elevation levels |
| Transitions | `--transition-fast`, `--transition-base`, `--transition-slow` | Duration + easing |
| Layout | `--max-width-content`, `--nav-height`, `--section-padding-*` | Structural dimensions |

## Wave 11A tokens

`index.css` defines a second `:root` block with the Wave 11A canonical token set. These override `tokens.css` values where names overlap. **Use Wave 11A tokens for all new development** — they are the current canonical set.

## Utility classes in `index.css`

`src/index.css` also defines all utility CSS classes:
- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`
- Cards: `.card`, `.card-lg`
- Tags: `.tag`, `.tag-update`, `.tag-event`, `.tag-notice`, `.tag-pinned`, `.tag-wellness`, etc.
- Badges: `.badge-success`, `.badge-danger`
- Typography: `.section-label`, `.italic-accent`, `.kicker`, `.eyebrow`, `.disclaimer`
- Layout: `.section`, `.section-gradient`, `.section-white`, `.section-head`, `.divider`
- Forms: `.field`, `.form-row`, `.search-pill`
- Modals: `.modal-backdrop`, `.modal-overlay`

## Rules

**NEVER hardcode hex colors in component files.** All colors must come from CSS token variables.

```tsx
// Correct
style={{ color: 'var(--color-primary)' }}

// Wrong — bypasses design system, breaks theme consistency
style={{ color: '#4F6EF7' }}
```

**Admin panel exception:** The admin panel uses its own CSS design system (blue sidebar, dark-tone UI). Public tokens should not be applied to admin panel components. Follow existing admin CSS patterns instead.

## Related

- [docs/design-system.md](../../../docs/design-system.md) — full token reference with values
- [CONTRIBUTING.md](../../../CONTRIBUTING.md) — Rule F2 (no hardcoded hex)
