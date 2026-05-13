# Design System

**Token file:** `frontend/src/styles/tokens.css`
**Global utilities:** `frontend/src/index.css`
**Rule:** All colors and spacing MUST come from token variables. Never hardcode hex values (CONTRIBUTING.md Rule F2).

---

## Token system structure

`index.css` defines two sets of tokens in two `:root` blocks:

1. **Wave 11A (canonical)** — the primary design system used across all new components. Loaded from `index.css` second `:root` block.
2. **tokens.css legacy set** — the original token set. Still used by components that haven't been migrated. Both coexist; the Wave 11A set overrides overlapping names.

Use Wave 11A tokens for all new development.

---

## Color tokens

### Primary palette (`tokens.css` + `index.css` Wave 11A)

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#4F6EF7` (tokens.css) / `#4f6fd1` (index.css) | Buttons, links, active states, borders |
| `--color-primary-dark` | `#3D5CE8` / `#3b5fbc` | Button hover, pressed state |
| `--color-primary-deep` | `#2c4ba0` | Deep accent, heading em elements |
| `--color-primary-mid` | `#8aaae0` | Muted accent, card hover borders |
| `--color-primary-light` | `#EEF1FE` / `#c8d2ef` | Light backgrounds, selected state fills |

### Backgrounds and surfaces

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#F8F9FF` | Page background |
| `--color-background-hero` | `#7B8FD4` | Hero gradient start |
| `--color-background-hero-end` | `#B8C4E8` | Hero gradient end |
| `--color-surface` | `#FFFFFF` / `#f4f6fd` | Card backgrounds, modal backgrounds |
| `--color-surface-elevated` | `#FFFFFF` | Elevated cards |
| `--color-surface-deep` | `#eef1fb` | Sunken/inset surfaces |
| `--color-white` | `#ffffff` | Pure white |
| `--gradient-hero` | `linear-gradient(160deg, #4f6fd1 0%, #8aaae0 55%, #c8d2ef 100%)` | Hero sections |
| `--gradient-deep` | `linear-gradient(160deg, #3b5fbc 0%, #4f6fd1 50%, #8aaae0 100%)` | Deep hero sections |

### Text colors

| Token | Value | Usage |
|---|---|---|
| `--color-text-primary` | `#0D1117` / `#0f1729` | Headings, primary body text |
| `--color-text-secondary` | `#374151` | Secondary body text |
| `--color-text-muted` | `#6B7280` | Captions, labels, placeholders |
| `--color-text-hint` | `#9ca3af` | Disabled text, helper text |
| `--color-text-on-primary` | `#FFFFFF` | Text on primary-colored backgrounds |
| `--color-text-on-hero` | `#0D1117` | Text overlaid on hero |
| `--color-accent-italic` | `#4F6EF7` | Italic accent text color |

### Border colors

| Token | Value | Usage |
|---|---|---|
| `--color-border` | `#E8EAF0` / `#e2e8f0` | Default borders |
| `--color-border-soft` | `#eef0f5` | Subtle borders, card edges |
| `--color-border-focus` | `#4F6EF7` | Input focus ring |

### Semantic colors

| Token | Value | Usage |
|---|---|---|
| `--color-success` | `#16A34A` | Success indicators |
| `--color-success-bg` | `#dcfce7` | Success badge background |
| `--color-success-text` | `#15803d` | Success badge text |
| `--color-danger` | `#DC2626` | Danger/error indicators |
| `--color-danger-bg` | `#fee2e2` | Danger badge background |
| `--color-danger-text` | `#b91c1c` | Danger badge text |
| `--color-warning` | `#D97706` | Warning indicators |
| `--color-warning-bg` | `#fef3c7` | Warning badge background |
| `--color-warning-text` | `#92400e` | Warning badge text |

### Tag colors

| Token | Value | Usage |
|---|---|---|
| `--color-tag-update-bg` | `#FFF7ED` | "CSG Updates" tag background |
| `--color-tag-update-text` | `#C2410C` | "CSG Updates" tag text |
| `--color-tag-event-bg` | `#F0FDF4` | "University Events" tag background |
| `--color-tag-event-text` | `#15803D` | "University Events" tag text |
| `--color-tag-notice-bg` | `#EFF6FF` | "Notice" tag background |
| `--color-tag-notice-text` | `#1D4ED8` | "Notice" tag text |
| `--color-tag-featured-bg` | `#EEF1FE` | "Featured" tag background |
| `--color-tag-featured-text` | `#4F6EF7` | "Featured" tag text |
| `--color-pinned-bg` | `#4F6EF7` | Pinned announcement badge |
| `--color-pinned-text` | `#FFFFFF` | Pinned badge text |

### Layout-specific colors

| Token | Value | Usage |
|---|---|---|
| `--color-footer-bg` | `#2D3A6B` | Footer background |
| `--color-footer-text` | `#FFFFFF` | Footer primary text |
| `--color-footer-muted` | `rgba(255,255,255,0.65)` | Footer secondary text |
| `--color-blockquote-border` | `#4F6EF7` | Blockquote left border |
| `--color-stat-value` | `#0D1117` | Stats number text |
| `--color-stat-label` | `#6B7280` | Stats label text |
| `--color-pillar-icon-bg` | `#EEF1FE` | Pillar icon circle background |
| `--color-pillar-icon-text` | `#4F6EF7` | Pillar icon color |

---

## Typography tokens

### Font families

| Token | Value | Usage |
|---|---|---|
| `--font-family-base` / `--font-stack` | `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif` | Body text, UI elements |
| `--font-family-heading` | `'Inter', system-ui, sans-serif` | Headings (tokens.css) |
| `--font-family-italic-accent` / `--font-serif` | `'Instrument Serif', Georgia, serif` | Decorative italic accents |
| `--font-family-monospace` / `--font-mono` | `'JetBrains Mono', monospace` | Code blocks |

Fonts are loaded from Google Fonts in `index.css`: Plus Jakarta Sans (400, 500, 600, 700, 800), Instrument Serif (italic), JetBrains Mono (400, 500).

### Font sizes

| Token | Value |
|---|---|
| `--font-size-xs` | `0.75rem` (12px) |
| `--font-size-sm` | `0.875rem` (14px) |
| `--font-size-base` / `--font-size-md` | `1rem` (16px) |
| `--font-size-lg` | `1.125rem` (18px) |
| `--font-size-xl` | `1.25rem` (20px) |
| `--font-size-2xl` | `1.5rem` (24px) |
| `--font-size-3xl` | `1.875rem` (30px) |
| `--font-size-4xl` | `2.25rem` (36px) |
| `--font-size-5xl` | `3rem` (48px) |
| `--font-size-h1` | `3.2em` (legacy) |

### Font weights

| Token | Value |
|---|---|
| `--font-weight-normal` | `400` |
| `--font-weight-medium` | `500` |
| `--font-weight-semibold` | `600` |
| `--font-weight-bold` | `700` |
| `--font-weight-extrabold` | `800` |

### Line heights

| Token | Value |
|---|---|
| `--line-height-tight` | `1.2` |
| `--line-height-snug` | `1.375` |
| `--line-height-base` | `1.5` |
| `--line-height-relaxed` | `1.75` |

### Letter spacing

| Token | Value |
|---|---|
| `--letter-spacing-tight` | `-0.02em` |
| `--letter-spacing-normal` | `0` |
| `--letter-spacing-wide` | `0.06em` |
| `--letter-spacing-wider` | `0.1em` |

---

## Spacing tokens

Spacing follows a 4px base unit:

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |
| `--space-20` | `80px` |
| `--space-24` | `96px` |

---

## Border radius tokens

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `4px` | Tags, small badges |
| `--radius-md` / `--radius-input` | `8px` | Inputs, small buttons |
| `--radius-lg` | `12px` | Buttons, form elements |
| `--radius-xl` | `16px` | Cards |
| `--radius-2xl` | `24px` | Large cards |
| `--radius-full` / `--radius-pill` | `9999px` | Pill badges, avatars |
| `--radius-card` | `14px` | Standard cards (Wave 11A) |
| `--radius-card-lg` | `18px` | Large cards (Wave 11A) |
| `--radius-btn` | `10px` | Buttons (Wave 11A) |

---

## Shadow tokens

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | Subtle elevation |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Medium elevation |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.10)` | Strong elevation |
| `--shadow-card` | `0 2px 8px rgba(79,110,247,0.08)` | Default card shadow |
| `--shadow-modal` | `0 20px 60px rgba(0,0,0,0.15)` | Modal elevation |
| `--shadow-soft` | `0 1px 2px rgba(15,23,41,0.04)` | Ultra-subtle (Wave 11A) |
| `--shadow-card-hover` | `0 8px 28px -8px rgba(79,111,209,0.25)` | Card hover state (Wave 11A) |
| `--shadow-pop` | `0 24px 60px -20px rgba(15,23,41,0.25)` | Large popped cards (Wave 11A) |

---

## Transition tokens

| Token | Value | Usage |
|---|---|---|
| `--transition-fast` | `150ms ease` | Quick UI responses |
| `--transition-base` | `250ms ease` | Standard transitions |
| `--transition-slow` | `350ms ease` | Modal slides, image carousels |
| `--transition` | `all 200ms cubic-bezier(.2,.8,.2,1)` | Wave 11A unified transition |

---

## Layout tokens

| Token | Value | Usage |
|---|---|---|
| `--max-width-content` | `1200px` | Maximum content width |
| `--nav-height` | `64px` | Navigation bar height |
| `--section-padding-x` | `clamp(1.5rem, 5vw, 4rem)` | Horizontal section padding |
| `--section-padding-y` | `clamp(3rem, 8vw, 6rem)` | Vertical section padding |

---

## Utility classes

Defined in `frontend/src/index.css`.

### Buttons

| Class | Style | Usage |
|---|---|---|
| `.btn` | Base flex container, cursor pointer | Applied to all buttons (base) |
| `.btn-primary` | Blue background (`--color-primary`), white text, box-shadow | Primary actions (Save, Submit) |
| `.btn-secondary` | Frosted white, blue border, blue text | Secondary actions (Cancel, Back) |
| `.btn-ghost` | White background, gray border, gray text | Tertiary actions (links, minor controls) |
| `.btn-danger` | Red background (`--color-danger-text`), white text | Destructive actions (Delete, Remove) |

### Cards

| Class | Style | Usage |
|---|---|---|
| `.card` | White surface, soft border, xl radius, hover lift | Standard content cards |
| `.card-lg` | White, 2xl radius, deeper shadow, hover pop | Featured / hero cards |

### Tags and badges

| Class | Style | Usage |
|---|---|---|
| `.tag` | Uppercase, bold, small text, rounded | Base tag |
| `.tag-notice` | Blue tones | "Official CVSU" / notice type |
| `.tag-update` | Orange/amber tones | "CSG Updates" type |
| `.tag-event` | Green tones | "University Events" type |
| `.tag-pinned` | Primary blue, full-radius, glow shadow | Pinned announcements |
| `.tag-wellness` | `#F0FDF4` bg / `#15803D` text | Wellness category |
| `.tag-assembly` | `#FFF7ED` bg / `#C2410C` text | Assembly category |
| `.tag-outreach` | `#FAF5FF` bg / `#7C3AED` text | Outreach category |
| `.badge-success` | Green, full-radius | Success state indicators |
| `.badge-danger` | Red, full-radius | Error/danger state indicators |
| `.pill` | White pill with border | Inactive filter pills |
| `.pill-active` | Primary blue, glow shadow | Active/selected filter pill |
| `.crown-tag` | Primary blue, full-radius, glow | President indicator badge |

### Typography helpers

| Class | Style | Usage |
|---|---|---|
| `.section-label` | Uppercase, muted, semibold, xs size | Section labels above headings |
| `.italic-accent` | Instrument Serif, italic, primary-deep color | Decorative word emphasis |
| `.kicker` | Uppercase, bold, primary color, 11px | Small topic labels |
| `.eyebrow` | Frosted pill, uppercase, bold | Hero section labels |
| `.disclaimer` | Small, italic, muted, centered | Footnotes and disclaimers |

### Layout helpers

| Class | Style | Usage |
|---|---|---|
| `.section` | Standard section padding | Page section wrapper |
| `.section-gradient` | Hero gradient background + dot pattern overlay | Hero sections |
| `.section-white` | White background | Clean sections |
| `.section-surface` | Surface-tone background | Alternating sections |
| `.section-head` | Centered, max-width 680px, bottom margin | Section heading containers |
| `.bl-toolbar-wrap` | Sticky toolbar with border-bottom | Search/filter toolbars |
| `.toolbar` | Flex row, space-between | Toolbar layout |
| `.divider` | 1px border-soft rule | Horizontal dividers |

### Form utilities

| Class | Style |
|---|---|
| `.field` | Flex column with gap |
| `.field label` | Uppercase, muted, 11px |
| `.field input/textarea/select` | Bordered input with focus ring |
| `.form-row` | Two-column grid |
| `.search-pill` | Frosted rounded search input |

### Modal

| Class | Style |
|---|---|
| `.modal-backdrop` / `.modal-overlay` | Fixed fullscreen, blur backdrop, flex center, z-index 1000 |

### Shadow utilities

| Class | Applies |
|---|---|
| `.shadow-soft` | `--shadow-sm` |
| `.shadow-card-hover` | `--shadow-lg` |
| `.shadow-pop` | `--shadow-pop` |

---

## Design conventions

### Page header pattern (reference — approved)

The `/bulletin` page header is the approved reference design for public page headers. It consists of:
- A gradient hero banner (`--gradient-hero` or `--gradient-deep`)
- A centered `<eyebrow>` label with frosted glass effect
- A large heading with an `<em>` italic accent word
- A subheading/description paragraph
- A search + filter toolbar directly below (sticky)

Other public pages should match this pattern.

### Admin table pattern

Admin tables (not public-facing) use a hover-reveal action pattern:
- Actions (Edit, Delete, Archive) are hidden by default
- They appear only when the row is hovered (`hoveredRowId === id`)
- This keeps the table clean and prevents accidental clicks
- Checkboxes appear in the leftmost column for bulk selection

### Modal pattern

All modals:
1. Use `useLockBodyScroll()` hook to prevent background scroll
2. Close on backdrop (`.modal-backdrop`) click
3. Show a confirmation dialog (`ConfimationModal`) before any destructive action
4. Use the `--transition-slow` (350ms) for slide/fade animations

### Card patterns

- **Announcement card:** image header, tag badge, date, title, preview text
- **Event card:** full-bleed image, date overlay, name, carousel arrows
- **Officer card:** circular avatar, crown tag for President, name, position, Facebook icon
- **Organization card:** logo/initials avatar, name, description, Facebook link

---

## Admin panel design note

The admin panel uses its own CSS design system — a separate blue sidebar with dark-tone backgrounds — that is **not** based on the public design tokens. The public `tokens.css` / `index.css` tokens should **not** be applied to admin panel components.

When styling admin panel components, follow the existing admin CSS patterns rather than importing public tokens.

---

## Approved pages — do not modify

Per CONTRIBUTING.md Rule F5, these public pages have been approved and must not be visually changed without explicit sign-off from the project lead:

- **`/bulletin`** (Bulletin.tsx) — reference implementation for the page header, search toolbar, pinned hero card, and announcement grid layout
- **`/documents`** (Documents.tsx / BulletinDocuments.tsx) — reference implementation for the sidebar filter + document grid layout

Any PR that modifies these files must include a screenshot comparison and explicit approval from Harold in the PR description.
