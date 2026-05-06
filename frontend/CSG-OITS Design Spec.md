# CSG-OITS Design System Specification
Generated from Figma — May 6, 2026
For use by Claude Code to implement frontend migration.

> **Source note.** The reference artifact for this extraction is the in-project `CSG-OITS Prototype.html`, which represents the locked visual target ("the Figma") for the public-facing pages. Values below are taken directly from that file. Where a token in the requested schema does not exist 1:1 in the design, the closest existing value is mapped and the deviation is called out.

---

## SECTION 1 — Color Tokens

| Token Name                  | Hex Value | Usage in Design |
|-----------------------------|-----------|-----------------|
| `--color-primary`           | `#4F6FD1` | Main CTA buttons, active nav, primary accents, footer background, focused inputs |
| `--color-primary-dark`      | `#3B5FBC` | Hover state of primary button; mid-stop in deep gradient |
| `--color-primary-light`     | `#C8D2EF` | Backgrounds behind primary elements, avatar focus rings, president card border |
| `--color-secondary`         | `#8AAAE0` | (Mapped to `--color-primary-mid`) Secondary accent — gradient mid-stop, dot ornaments, light hover borders |
| `--color-background`        | `#F4F6FD` | Page background (`--color-surface`) |
| `--color-surface`           | `#FFFFFF` | Card background, modal body (`--color-white`) |
| `--color-surface-elevated`  | `rgba(255,255,255,0.92)` over `#FFFFFF` | Navbar (translucent + 12px backdrop blur, saturate 180%); dropdowns; floating badges use opaque `#FFFFFF` |
| `--color-border`            | `#E2E8F0` | Card borders, input borders, dividers |
| `--color-border-focus`      | `#4F6FD1` | Input focus ring color (paired with `0 0 0 3px rgba(79,111,209,0.10)` halo) |
| `--color-text-primary`      | `#0F1729` | Headings, primary body emphasis |
| `--color-text-secondary`    | `#374151` | Body text, descriptions |
| `--color-text-muted`        | `#6B7280` | Timestamps, helper text, sub-labels |
| `--color-text-on-primary`   | `#FFFFFF` | Text on `--color-primary` and gradient fills |
| `--color-success`           | `#15803D` (text) on `#DCFCE7` (bg) | "Available" badge, restore action |
| `--color-danger`            | `#B91C1C` (text) on `#FEE2E2` (bg) | Destructive actions, "Unavailable" badge |
| `--color-warning`           | `#92400E` (text) on `#FEF3C7` (bg) | Caution states, archive action, UPDATE tag |
| `--color-hero-bg`           | `linear-gradient(160deg, #4F6FD1 0%, #8AAAE0 55%, #C8D2EF 100%)` | Hero section background |
| `--color-hero-text`         | `#0F1729` | Heading + body copy on hero (deliberately dark on the lavender gradient) |

### Additional colors used in the design

| Token Name                  | Hex Value | Usage |
|-----------------------------|-----------|-------|
| `--color-primary-deep`      | `#2C4BA0` | Italic accent words ("Government", "now"), badge text, link text on light surfaces, gradient start of `--gradient-deep` |
| `--color-primary-mid`       | `#8AAAE0` | Gradient mid-stop, hover border on cards, secondary dot ornaments |
| `--color-surface-deep`      | `#EEF1FB` | Equipment thumbnail gradient end |
| `--color-border-soft`       | `#EEF0F5` | Inner card borders, subtle dividers, footer rule |
| `--color-text-hint`         | `#9CA3AF` | Date/time hints, disclaimers, disabled label color |
| `--color-event-tag-text`    | `#9A3412` | EVENT badge text |
| `--color-event-tag-bg`      | `#FFF7ED` | EVENT badge background |
| `--color-status-online`     | `#22C55E` | "Equipment Online" / admin presence dot, with `0 0 0 3px rgba(34,197,94,0.18)` halo |
| `--color-overlay`           | `rgba(15,23,41,0.55)` | Modal backdrop, dark date-tag pill |
| `--gradient-hero`           | `linear-gradient(160deg, #4F6FD1 0%, #8AAAE0 55%, #C8D2EF 100%)` | Hero, section-gradient, borrow-hero |
| `--gradient-deep`           | `linear-gradient(160deg, #3B5FBC 0%, #4F6FD1 50%, #8AAAE0 100%)` | Logo, modal header, admin sidebar, avatar fill |

---

## SECTION 2 — Typography Tokens

| Token Name                | Value | Source in Figma |
|---------------------------|-------|-----------------|
| `--font-family-base`      | `'Plus Jakarta Sans', 'Segoe UI', system-ui, -apple-system, sans-serif` | Body font, all UI |
| `--font-family-heading`   | `'Plus Jakarta Sans', 'Segoe UI', system-ui, -apple-system, sans-serif` | Same family as body; weight is the differentiator |
| `--font-family-serif`     | `'Instrument Serif', Georgia, serif` | Italic accent words inside headings (`<em>` runs), logo glyph |
| `--font-family-mono`      | `'JetBrains Mono', ui-monospace, monospace` | Term codes, document term tags, placeholder labels |
| `--font-size-xs`          | `10.5px` | Sub-labels, kicker text, tag glyphs |
| `--font-size-sm`          | `11.5px` | Dates, helper meta, stat label |
| `--font-size-base`        | `13.5px` | Body text, nav links, card description |
| `--font-size-md`          | `14px` | Default button label, base body, secondary headings |
| `--font-size-lg`          | `15px` | Section subhead, card title (announcements) |
| `--font-size-xl`          | `17px` | Sub-section heading (officer president, modal title) |
| `--font-size-2xl`         | `22px` | Featured card title, event featured title |
| `--font-size-3xl`         | `34px` | Section heading (`section-head h2`) |
| `--font-size-4xl`         | `clamp(36px, 4.6vw, 56px)` | Hero `<h1>` |
| `--font-weight-normal`    | `400` | Italic serif accents, light body |
| `--font-weight-light`     | `450` | Body copy on hero / featured ("intentionally lighter") |
| `--font-weight-medium`    | `500` | Nav links, helper text, body small |
| `--font-weight-semibold`  | `600` | Buttons, links, active nav, byline |
| `--font-weight-bold`      | `700` | Card titles, kicker labels, footer brand |
| `--font-weight-extrabold` | `800` | Hero `<h1>`, section `<h2>`, stat numbers |
| `--line-height-tight`     | `1.05` | Hero h1, large display |
| `--line-height-snug`      | `1.20` | Featured headlines, h2 |
| `--line-height-base`      | `1.40` – `1.50` | Card titles |
| `--line-height-relaxed`   | `1.65` | Body, hero paragraph, descriptions |
| `--letter-spacing-tight`  | `-0.025em` | Hero `<h1>` |
| `--letter-spacing-snug`   | `-0.02em` | Section `<h2>`, featured titles |
| `--letter-spacing-normal` | `-0.01em` to `-0.005em` | Buttons, body, brand text |
| `--letter-spacing-wide`   | `0.5em – 0.8em` (used as `0.5px – 0.8px` absolute) | Uppercase labels, kickers, tag pills |

---

## SECTION 3 — Spacing Tokens

The prototype uses an ad-hoc px scale rather than a strict 4-pt grid; the table below maps the requested rungs to the values that actually appear, rounded to the nearest used value.

| Token Name   | Value  |
|--------------|--------|
| `--space-1`  | `4px`  |
| `--space-2`  | `6px`  |
| `--space-3`  | `8px`  |
| `--space-4`  | `12px` |
| `--space-5`  | `14px` |
| `--space-6`  | `18px` |
| `--space-8`  | `22px` |
| `--space-10` | `28px` |
| `--space-12` | `36px` |
| `--space-16` | `48px` |
| `--space-20` | `60px` |
| `--space-24` | `80px` |

> Section vertical padding is `80px`; hero is `96px 60px 88px`; standard horizontal page padding is `60px` (desktop) / `36px` (nav).

---

## SECTION 4 — Shape Tokens

| Token Name          | Value |
|---------------------|-------|
| `--radius-sm`       | `6px` (tag pills, doc thumb glyph corner) |
| `--radius-md`       | `8px` (input, nav-link bg, small badge) |
| `--radius-lg`       | `10px` (`--radius-btn`, equip image, admin avatar squares) |
| `--radius-xl`       | `14px` (`--radius-card` — base card, pinned strip, hero badge) |
| `--radius-2xl`      | `18px` (`--radius-card-lg` — featured cards, modal, borrow-form, hero photo) |
| `--radius-full`     | `9999px` (`--radius-pill` — filter pills, eyebrow, search, status badges) |
| `--shadow-sm`       | `0 1px 2px rgba(15,23,41,0.04), 0 0 0 1px rgba(15,23,41,0.04)` (`--shadow-soft`) |
| `--shadow-md`       | `0 4px 14px -4px rgba(15,23,41,0.08)` (pinned-strip resting), `0 6px 20px -10px rgba(15,23,41,0.15)` (event featured) |
| `--shadow-lg`       | `0 8px 28px -8px rgba(79,111,209,0.25), 0 2px 6px -2px rgba(15,23,41,0.06)` (`--shadow-card-hover`) |
| `--shadow-card`     | `--shadow-soft` resting → `--shadow-card-hover` on hover |
| `--shadow-modal`    | `0 30px 80px -20px rgba(15,23,41,0.40)` |
| `--shadow-pop`      | `0 24px 60px -20px rgba(15,23,41,0.25), 0 8px 20px -10px rgba(79,111,209,0.18)` (featured card hover, slide-out) |
| `--shadow-hero`     | `0 30px 80px -20px rgba(15,23,41,0.35), 0 10px 30px -8px rgba(79,111,209,0.25)` (hero photo) |
| `--transition-fast` | `150ms ease` (footer link color) |
| `--transition-base` | `200ms cubic-bezier(0.2, 0.8, 0.2, 1)` (the global `--transition` token) |
| `--transition-slow` | `250ms cubic-bezier(0.2, 0.8, 0.2, 1)` (announcement underline reveal); modal slide-up uses `240ms` with the same easing |

---

## SECTION 5 — Component Specifications

### 5.1 Navigation Bar
- **Background:** `rgba(255,255,255,0.92)` with `backdrop-filter: blur(12px) saturate(180%)`. Sticky (`position: sticky; top: 0; z-index: 50`).
- **Height:** `68px` fixed.
- **Logo size:** `40px × 40px` circle filled with `--gradient-deep`. Inset `3px` dashed white ring (`rgba(255,255,255,0.4)`). Outer ring stack: `0 0 0 1.5px #FFFFFF, 0 0 0 2.5px --color-primary, 0 4px 12px -2px rgba(79,111,209,0.4)`. Glyph is the letter "C" in Instrument Serif italic 18px, weight 800, white. Brand text to the right, two lines: brand name `14.5px / 700 / --color-text-primary`, sublabel `10.5px / 500 / uppercase / 0.4px tracking / --color-text-muted`.
- **Nav link default state:** `--color-text-secondary`, `13.5px`, weight `500`, padding `8px 12px`, radius `8px`, transparent background.
- **Nav link hover:** color `--color-primary`; background `rgba(79,111,209,0.06)`.
- **Nav link active:** color `--color-primary`, weight `600`, plus a `24px × 2px` underline pill in `--color-primary` centered `12px` below the text.
- **Mobile breakpoint behavior:** [NOT FOUND — needs design decision]. Recommended: collapse `.nav-links` into a hamburger trigger below `768px`, keep the brand and Admin pill visible.
- **Border / shadow:** `border-bottom: 1px solid --color-border-soft`. No box-shadow at rest.
- **Admin pill** (right edge): `12.5px / 600`, padding `7px 14px`, radius `--radius-btn` (`10px`), `1px` solid `--color-border` over white. Hover: text → `--color-primary`, border → `--color-primary-mid`, plus `--shadow-card-hover`. Includes a `6px` green presence dot (`#22C55E`) with a `3px` halo at `rgba(34,197,94,0.18)`.

### 5.2 Hero Section
- **Background:** `--gradient-hero` (`linear-gradient(160deg, #4F6FD1 0%, #8AAAE0 55%, #C8D2EF 100%)`) with two layered ornaments: (a) two soft radial glows (white at 12%/18% and blue at 88%/90%), (b) a `32px` SVG dot-pattern at 6% black opacity, layer opacity `0.6`.
- **Layout:** two-column grid `1.05fr 0.95fr`, gap `60px`, padding `96px 60px 88px`.
- **Heading typography:** `clamp(36px, 4.6vw, 56px)` / weight `800` / line-height `1.05` / tracking `-0.025em` / color `--color-text-primary`.
- **Italic/accent word style:** wrap in `<em>` → Instrument Serif italic, weight `400`, color `--color-primary-deep` (`#2C4BA0`), tracking `-0.02em`.
- **Subtext typography:** `15.5px` / weight `450` / line-height `1.65` / `--color-text-secondary`, `max-width: 540px`, `margin-bottom: 32px`.
- **Eyebrow badge ("AY 2025-2026 · NOW IN SESSION"):** background `rgba(255,255,255,0.55)` + `8px` backdrop blur + `1px` solid `rgba(255,255,255,0.6)`. Pill radius. Padding `6px 12px 6px 8px`. Text `11px / 700 / uppercase / 0.8px tracking / --color-text-primary`. Leading `6px` blue dot with `3px` halo at `rgba(79,111,209,0.2)`.
- **Primary CTA button:** background `--color-primary`, text `#FFFFFF`, weight `600`, radius `--radius-btn` (`10px`), padding `12px 26px`, `14px`, tracking `-0.01em`. Shadow `0 1px 0 rgba(255,255,255,0.18) inset, 0 6px 14px -4px rgba(79,111,209,0.5)`. Hover: bg `--color-primary-dark`, lift `-1px`, shadow deepens to `-6px / 0.55`. Disabled: bg `--color-border`, text `--color-text-hint`.
- **Secondary CTA button:** background `rgba(255,255,255,0.7)` + `6px` blur, text `--color-primary-deep`, border `1.5px` solid `--color-primary`, padding `10.5px 24px`, `14px / 600`. Hover: bg `--color-primary`, text white.
- **Stat cards (3 across, gap 12px, max-width 540px):** background `rgba(255,255,255,0.65)` + `8px` blur, border `1px` solid `rgba(255,255,255,0.7)`, radius `12px`, padding `16px 18px`. Value `26px / 800 / -0.03em / --color-text-primary` with optional Instrument Serif italic suffix (`18px / 400 / --color-primary-deep`). Label `11.5px / 500 / --color-text-secondary`. Hover lifts `-2px` and bg → `rgba(255,255,255,0.85)`.
- **Hero image area:** `aspect-ratio 5/4`, max-width `540px`, radius `--radius-card-lg` (`18px`), `1px` solid `rgba(255,255,255,0.5)`, shadow `0 30px 80px -20px rgba(15,23,41,0.35), 0 10px 30px -8px rgba(79,111,209,0.25)`. Fill is either an image or a striped placeholder (`135deg` repeating stripes of `#EEF2FB` / `#E2E8F0`, 16px each).
- **"Pinned Now" badge (top-left, offset −28px):** white card, radius `14px`, padding `14px 18px`, soft shadow `0 18px 40px -12px rgba(15,23,41,0.25), 0 4px 10px -4px rgba(79,111,209,0.18)`, `1px` solid `--color-border-soft`. Square `36px` glyph at `rgba(79,111,209,0.10)` / radius `10px` / `--color-primary` text. Two-line content: label `10.5px / 600 / uppercase / --color-text-muted` over value `14px / 700 / --color-text-primary`.
- **"Equipment Online" badge (bottom-right, offset −20px):** identical chrome to the Pinned badge; the `36px` glyph icon tints to the green status color `#22C55E`. Same typography pair.

### 5.3 Announcement Section
- **Section heading typography:** kicker `11px / 700 / 0.7px uppercase / --color-primary` above `<h2>` `34px / 800 / -0.02em / --color-text-primary`, with `<em>` words in Instrument Serif italic / `400` / `--color-primary-deep`.
- **Section subheading:** `15px / 450 / --color-text-secondary`. Block centered, `max-width: 680px`, `margin-bottom: 40px`.
- **Toolbar:** search pill (`rgba(255,255,255,0.85)` + blur, radius `--radius-pill`, `13.5px` text, leading icon at `--color-primary`) on the left, segmented filters on the right (pill container at `rgba(255,255,255,0.7)`, items `12.5px / 600`, active item solid `--color-primary` white text with `0 4px 10px -3px rgba(79,111,209,0.5)` shadow).
- **Featured (pinned) announcement:** two-column card `1.05fr / 1fr`, white surface, radius `--radius-card-lg`, shadow `0 20px 50px -20px rgba(15,23,41,0.25), 0 6px 16px -8px rgba(79,111,209,0.18)`. Image left at min-height `340px`. Body right with padding `36px 38px`, h3 `24px / 800 / -0.02em`, body `14px / 450`. Pin badge (top-left of image) in `--color-primary` solid pill. Footer separator `1px solid --color-border-soft`, byline avatar `36px` with `--gradient-deep` fill and double white/blue ring. Hover lifts `-3px` to `--shadow-pop`.
- **Announcement list item — default state:** white card, `1px` solid `--color-border-soft`, radius `--radius-card`, image header `140px` over body `padding 18px 20px 20px`. Title `15px / 700 / -0.01em`. Description `13.5px / 450 / line-clamp 3`. Footer `1px` top divider with link CTA in `--color-primary` weight `600`.
- **Card hover:** border → `--color-primary-mid`, shadow → `--shadow-card-hover`, `transform: translateY(-3px)`. Top accent rule (`3px` `--color-primary` bar) animates `scaleX 0 → 1` over `250ms`.
- **Tag/badge styles:**
  - **NOTICE** (default): text `--color-primary-deep`, bg `rgba(79,111,209,0.08)`.
  - **UPDATE**: text `--color-warning-text` `#92400E`, bg `--color-warning-bg` `#FEF3C7`.
  - **EVENT**: text `#9A3412`, bg `#FFF7ED`.
  - All: `10px / 700 / 0.5px / uppercase`, padding `4px 9px`, radius `6px`. Card-overlay variant uses the same colors at `0.95` alpha plus a `2px 6px` shadow.
- **Date typography:** `11.5px / 500 / --color-text-hint`. When standalone, prefixed by a `3px` round dot in the same hint color.
- **Arrow/expand icon:** chevron glyph `→` in `--color-primary` weight `600`; on card-hover the glyph translates `+3px` over `200ms`.

### 5.4 Document Card
- **Background / border / radius / shadow:** white, `1px` solid `--color-border-soft`, radius `--radius-card`, no resting shadow. Hover: `--shadow-card-hover`, border `--color-primary-mid`, lift `-2px`.
- **Thumb area:** `120px` tall, bg `--color-surface`, with a `135deg` faint diagonal stripe overlay at `rgba(79,111,209,0.04)`. Centered glyph plate is `64×80px`, white→`#F8FAFF` gradient, `1px` solid `--color-border`, `0 4px 12px -4px rgba(79,111,209,0.2)` shadow, with an Instrument Serif italic letter inside (`32px / 600 / --color-primary`) and a small folded-corner triangle in `#DDE4F3`.
- **Title typography:** `14px / 700 / -0.005em / --color-text-primary`, `line-height 1.4`. **Max lines:** [NOT FOUND — needs design decision]. Recommended: `2 lines` with `-webkit-line-clamp: 2` to keep cards aligned.
- **Date typography:** `11px / 500 / --color-text-hint`.
- **Type label** (above title): `11px / 500 / uppercase / 0.4px / --color-text-muted` with leading `5px` `--color-primary-mid` dot.
- **Term tag** (alt meta): `10.5px / 500 / --color-text-muted / JetBrains Mono`.
- **Category tag style:** uses the same announcement-tag system (`10px / 700 / uppercase`, radius `6px`, primary-tinted bg).
- **View button — default:** transparent fill, `1.5px` solid `--color-primary` border, text `--color-primary`, `12px / 600`, radius `8px`, padding `8px`, full-width, pinned to the bottom of the card via `margin-top: auto`.
- **View button — hover:** bg `--color-primary`, text white, `0 4px 12px -4px rgba(79,111,209,0.4)` shadow.
- **Fixed card height:** [NOT FOUND — needs design decision]. The prototype uses flex-fill (auto height) with `margin-top: auto` on the button. Recommended: do not pin a height — let cards align via the line-clamped title.

### 5.5 Event Card
There are two variants: a **featured** card (left column) and a **side** card (right column).
- **Background / border / radius:** white, `1px --color-border-soft`, radius `--radius-card-lg` (featured) or `--radius-card` (side). Resting shadow `0 6px 20px -10px rgba(15,23,41,0.15)` on featured; none on side.
- **Image area:** featured `280px` tall; side variant uses a `130px` left rail `min-height: 120px`. Object-fit: `cover`.
- **Date typography:** `11.5px / 600 / --color-primary-deep`, with leading `5px` solid `--color-primary` dot.
- **Title typography:** featured `22px / 700 / -0.02em / line-height 1.2`; default `17px / 700 / -0.01em / line-height 1.3`; side variant `14px / 700`.
- **Description:** `13.5px / 450 / --color-text-secondary / line-height 1.6`. **Max lines / overflow:** [NOT FOUND — needs design decision]. Recommended: `3 lines` with line-clamp on featured, `2 lines` on side cards.
- **Pill overlay** (top-left of image): `rgba(255,255,255,0.95)` + blur, text `--color-primary-deep`, `10px / 700 / 0.5px / uppercase`, padding `5px 11px`, pill radius, `0 2px 8px rgba(15,23,41,0.10)` shadow.
- **Date tag overlay** (bottom-left of image): `rgba(15,23,41,0.7)` + blur, white text `11px / 600`, padding `6px 12px`, radius `8px`.
- **Hover:** featured → `--shadow-pop` and lift `-3px`; side card → `--shadow-card-hover` and `translateX(+2px)`.

### 5.6 Officer Card
- **Card dimensions:** width is grid-driven via `repeat(auto-fit, minmax(180px, 1fr))` with `14px` gap. Padding `24px 18px`. Min-height is intrinsic (no fixed minimum); the President card uses padding `32px 24px`.
- **Background / border / radius:** white, `1px --color-border-soft`, radius `--radius-card`. President variant uses `1px --color-primary-light`.
- **Top wash:** `48px` (`60px` for president) gradient overlay `rgba(79,111,209,0.08)` → transparent, sitting behind the avatar.
- **Avatar:** `80px × 80px` circle (`104px` for president), filled with `--gradient-deep`, white initials at `24px / 700` (`32px` for president). Triple stack outer ring: `0 0 0 3px #FFFFFF, 0 0 0 4px --color-primary-light, 0 8px 20px -6px rgba(79,111,209,0.4)`.
- **Name typography:** `14px / 700 / -0.01em / --color-text-primary` (president `17px`). **Min-height for alignment:** [NOT FOUND — needs design decision]. Recommended: pin to `min-height: 36px` (≈2 lines at 14px) so positions align when names wrap.
- **Position text:** `12px / 500 / --color-text-muted / line-height 1.4`.
- **Year/term text:** `10.5px / 500 / --color-text-hint / JetBrains Mono`.
- **Facebook icon button:** `32px × 32px` square, radius `8px`, bg `--color-surface`, `1px --color-border-soft`, glyph in `--color-primary` Instrument Serif italic `14px / 700`. Centered horizontally; `margin: 0 auto`. Hover: bg `--color-primary`, text white, lift `-2px`, border `--color-primary`.
- **Adviser card differences:** identical chrome and avatar treatment, with the Facebook icon **omitted**. (The Year line still uses the term mono style.)
- **President "crown" pill:** absolute, top `-12px`, centered. `--color-primary` solid, white text `10px / 700 / uppercase / 0.6px`, padding `5px 14px`, pill radius, shadow `0 6px 16px -4px rgba(79,111,209,0.5)`.

### 5.7 Modal / Overlay
- **Backdrop:** `rgba(15,23,41,0.55)` + `4px` backdrop blur. Centers content via flex. Padding `20px`. Fade-in `200ms ease`.
- **Modal card:** white, radius `--radius-card-lg` (`18px`), `max-width: 600px`, `width: 100%`, overflow hidden. Shadow `0 30px 80px -20px rgba(15,23,41,0.40)`. Slide-up entry `240ms cubic-bezier(0.2, 0.8, 0.2, 1)` from `+16px / 0.98 scale`.
- **Header:** `--gradient-deep` background with the same `28px` SVG dot pattern at `0.10` white opacity. Padding `22px 28px`. Title `17px / 700 / -0.01em / #FFFFFF`.
- **Close button:** `30px` circle, bg `rgba(255,255,255,0.15)`, white `18px` glyph, no border. Hover: bg `rgba(255,255,255,0.25)`.
- **Body:** padding `28px`, default text uses `--color-text-secondary` at `13.5px`.

### 5.8 Footer
- **Background color:** `--color-primary` (`#4F6FD1`) with the same `28px` SVG dot pattern at `0.06` white opacity overlay.
- **Layout / padding:** `36px 48px`, flex-row, space-between, wraps to column at narrow widths with `20px` gap.
- **Brand block:** `15px / 700 / -0.01em / #FFFFFF`. Logo glyph: `32px` circle, `rgba(255,255,255,0.18)` fill, `1.5px rgba(255,255,255,0.4)` border, Instrument Serif italic letter at `15px`.
- **Sub-line:** `12px / 450 / rgba(255,255,255,0.7)`, sits under the brand label.
- **Link color:** `rgba(255,255,255,0.7)`, `13px / 500`. Hover: `#FFFFFF`. Transition `150ms ease`.
- **Social icon style:** [NOT FOUND — needs design decision]. The current design ships text-only links; if social icons are added, recommended size `20px` glyph, `rgba(255,255,255,0.7)` resting / `#FFFFFF` hover, no chrome.
- **Newsletter / feedback area:** [NOT FOUND — needs design decision]. None exists in the current design. Recommended placement: centered between the brand and link clusters; pill-shaped input on `rgba(255,255,255,0.10)` with white text and a solid white-on-primary submit button.
- **Copyright text style:** uses `.footer-link` color/size — `13px / 500 / rgba(255,255,255,0.7)`.
- **Divider style:** `1px × 14px` vertical bar at `rgba(255,255,255,0.25)` between footer links.

### 5.9 Document Slide-in Panel
> **Note:** The current prototype opens documents in a centered **modal** (see 5.7), not a side-in panel. The spec below is the recommended slide-in design extrapolated from the existing language.
- **Panel width:** `420px` desktop, `100%` on screens narrower than `640px`.
- **Background:** `--color-white`, with header strip in `--gradient-deep` matching the modal header.
- **Shadow:** `--shadow-pop` (`0 24px 60px -20px rgba(15,23,41,0.25), 0 8px 20px -10px rgba(79,111,209,0.18)`).
- **Category label style:** `11px / 700 / uppercase / 0.6px / --color-primary`, sits above the title.
- **Document title style:** `22px / 800 / -0.02em / --color-text-primary / line-height 1.20`.
- **Description style:** `14px / 450 / --color-text-secondary / line-height 1.65`.
- **View button style:** primary CTA — `--color-primary` fill, white text `14px / 600`, padding `12px 26px`, radius `--radius-btn`, shadow `0 6px 14px -4px rgba(79,111,209,0.5)`. Hover: bg `--color-primary-dark`, lift `-1px`.
- **Backdrop:** `rgba(15,23,41,0.55)` + `4px` blur, identical to the modal backdrop.

---

## SECTION 6 — Page-level Layout Specifications

### 6.1 Public pages (homepage, /bulletin, /documents, /officers)
- **Max content width:** `1180px` (every section's inner block uses `max-width: 1180px; margin: 0 auto`).
- **Horizontal padding:** `60px` desktop on the section wrapper; `36px` for the nav bar; `48px` for the footer.
- **Section vertical spacing:** sections use `padding: 80px 60px`; the announcement section adds `padding-bottom: 96px`. Hero is `96px 60px 88px`.
- **Grid columns for card grids:** announcements `repeat(3, 1fr)` gap `18px`; documents `repeat(3, 1fr)` gap `18px`; officers `repeat(auto-fit, minmax(180px, 1fr))` gap `14px`; events `1.25fr 0.75fr` gap `20px`; equipment `repeat(auto-fit, minmax(220px, 1fr))` gap `16px`.

### 6.2 Documents page sidebar + grid
- **Sidebar width:** `260px`; layout grid is `260px 1fr` with a `32px` gap.
- **Sidebar background, border, border-radius:** background `--color-surface`, `1px --color-border-soft`, radius `--radius-card` (`14px`), padding `20px`. Sticky to `top: 88px` so it pins below the nav.
- **Category item — default:** `13px / 500 / --color-text-secondary`, padding `8px 12px`, radius `8px`, transparent. Right-aligned count badge: `11px / 600`, bg `rgba(15,23,41,0.06)`, text `--color-text-muted`, radius `10px`.
- **Category item — hover:** bg `rgba(79,111,209,0.06)`, text `--color-primary`.
- **Category item — active:** bg `--color-primary`, text white, weight `600`, shadow `0 4px 12px -4px rgba(79,111,209,0.5)`. Count badge bg flips to `rgba(255,255,255,0.18)` with white text.
- **Search input style:** white bg, `1px --color-border`, radius `--radius-input` (`8px`), padding `10px 14px 10px 36px`, leading `14px` magnifier SVG in `--color-text-muted`. Focus: border `--color-primary`, `0 0 0 3px rgba(79,111,209,0.10)` halo.
- **Grid columns / gap:** `repeat(3, 1fr)` / `18px`.
- **Section label** (`CATEGORIES`): `10.5px / 700 / uppercase / 0.6px / --color-text-muted`, margin `8px 4px 10px`.

### 6.3 Officers page
- **President card:** centered with `max-width: 240px`, `margin: 0 auto 28px`. Card padding `32px 24px`, border `--color-primary-light`, top wash `60px` at `0.15` blue. Avatar `104px`. Name `17px`.
- **Executive officers grid:** `repeat(auto-fit, minmax(180px, 1fr))`, gap `14px`, max-width `1180px`.
- **Board members grid:** same `repeat(auto-fit, minmax(180px, 1fr))` / `14px`, centered via `margin: 0 auto`.
- **Advisers grid:** same column rule and gap; cards omit the Facebook button. When the count is small (e.g. 2), the grid centers itself with `justify-content: center` and an extra `max-width: 760px` cap to keep avatars from stretching.
- **Section label style** ("EXECUTIVE OFFICERS", "BOARD MEMBERS"): the standard kicker — `11px / 700 / uppercase / 0.7px / --color-primary`, margin-bottom `10px`. Sits inside a centered `.section-head` block (max-width `680px`) with `<h2>` `34px / 800` below.

---

## SECTION 7 — Utility Classes Needed

| Class Name        | Purpose                                  | Key Styles |
|-------------------|------------------------------------------|------------|
| `.btn-primary`    | Main CTA button                          | bg `--color-primary`, white text, `14px / 600 / -0.01em`, padding `12px 26px`, radius `--radius-btn`, shadow `0 6px 14px -4px rgba(79,111,209,0.5)` plus inset highlight; hover bg `--color-primary-dark` + lift `-1px` |
| `.btn-secondary`  | Outline/ghost CTA on hero & light surfaces | bg `rgba(255,255,255,0.7)` + blur, text `--color-primary-deep`, `1.5px --color-primary` border, padding `10.5px 24px`, `14px / 600`; hover fills with `--color-primary` and switches text to white |
| `.btn-ghost`      | Tertiary inline action (alias of nav-admin / borrow-back) | white or translucent bg, `1px --color-border`, `12.5px / 600`, padding `7px 14px`, radius `--radius-btn`; hover gains `--color-primary-mid` border |
| `.btn-danger`     | Destructive admin action                 | bg `--color-danger-text`, white, `13px / 600`, padding `8px 16px`, radius `--radius-btn` |
| `.card`           | Base card container                      | bg `--color-white`, `1px --color-border-soft`, radius `--radius-card`, `--transition-base`; hover border `--color-primary-mid` + `--shadow-card-hover` + `translateY(-2px)` |
| `.card-lg`        | Larger card (featured, modal, hero photo) | radius `--radius-card-lg`, deeper resting shadow (`0 6px 20px -10px rgba(15,23,41,0.15)`); hover lifts `-3px` to `--shadow-pop` |
| `.tag`            | Base tag/badge                           | `10px / 700 / uppercase / 0.5px`, padding `4px 9px`, radius `--radius-sm` |
| `.tag-update`     | UPDATE badge                             | text `--color-warning-text`, bg `--color-warning-bg` |
| `.tag-event`      | EVENT badge                              | text `#9A3412`, bg `#FFF7ED` |
| `.tag-notice`     | NOTICE badge (default tag)               | text `--color-primary-deep`, bg `rgba(79,111,209,0.08)` |
| `.tag-pinned`     | PINNED overlay tag                       | bg `--color-primary`, white text, pill radius, padding `6px 12px`, shadow `0 4px 12px -2px rgba(79,111,209,0.5)` |
| `.badge-success`  | Equipment "available" / restored state   | text `--color-success-text`, bg `--color-success-bg`, pill radius, leading `5px` dot |
| `.badge-danger`   | Equipment "unavailable" / destructive state | text `--color-danger-text`, bg `--color-danger-bg`, pill radius, leading dot |
| `.pill`           | Generic pill container (filters, eyebrow) | radius `--radius-pill`, padding `4px` (group) / `7px 16px` (item), `12.5px / 600` |
| `.pill-active`    | Active pill state                        | bg `--color-primary`, white text, shadow `0 4px 10px -3px rgba(79,111,209,0.5)` |
| `.kicker`         | Section eyebrow label                    | `11px / 700 / uppercase / 0.7px / --color-primary` |
| `.eyebrow`        | Hero pill label                          | bg `rgba(255,255,255,0.55)` + blur, `1px rgba(255,255,255,0.6)` border, `11px / 700 / uppercase / 0.8px / --color-text-primary`, pill radius |
| `.section`        | Section wrapper                          | padding `80px 60px`, position relative |
| `.section-gradient` | Hero/announce section background       | `--gradient-hero` + dot-pattern overlay |
| `.section-white`  | White section background                 | bg `--color-white` |
| `.section-surface` | Page-tone section background            | bg `--color-surface` |
| `.section-head`   | Centered section heading block           | `max-width: 680px`, `margin: 0 auto 40px`, text-align center |
| `.italic-accent`  | Instrument Serif italic span inside headings | font `--font-family-serif`, italic, weight `400`, color `--color-primary-deep`, tracking `-0.02em` |
| `.placeholder-stripe` | Image placeholder fill                | `135deg` repeating linear-gradient `#EEF2FB / #E2E8F0`, mono caption text in `--color-text-muted` |
| `.divider`        | Horizontal rule                          | `1px solid --color-border-soft` |
| `.shadow-soft`    | Resting card shadow                      | `0 1px 2px rgba(15,23,41,0.04), 0 0 0 1px rgba(15,23,41,0.04)` |
| `.shadow-card-hover` | Card hover shadow                     | `0 8px 28px -8px rgba(79,111,209,0.25), 0 2px 6px -2px rgba(15,23,41,0.06)` |
| `.shadow-pop`     | Featured/modal hover shadow              | `0 24px 60px -20px rgba(15,23,41,0.25), 0 8px 20px -10px rgba(79,111,209,0.18)` |
| `.field`          | Form field column (label + input)        | flex column, gap `6px`; label `11px / 600 / uppercase / 0.5px / --color-text-muted`; input `1px --color-border`, radius `--radius-input`, padding `10px 12px`, focus border `--color-primary` + `0 0 0 3px rgba(79,111,209,0.10)` |
| `.form-row`       | Two-column form row                      | `grid-template-columns: 1fr 1fr`, gap `14px` |
| `.toolbar`        | Search-and-filter row                    | flex row, space-between, `gap: 16px`, max-width `1180px`, margin `0 auto 28px` |
| `.search-pill`    | Translucent search input                 | bg `rgba(255,255,255,0.85)` + blur, pill radius, padding `11px 16px 11px 40px`, leading icon in `--color-primary`; focus → solid white + halo |
| `.dot-status`     | Presence dot                             | `6px` circle in `--color-status-online` with `0 0 0 3px rgba(34,197,94,0.18)` halo |
| `.crown-tag`      | President "crown" overlay pill           | bg `--color-primary`, white `10px / 700 / uppercase / 0.6px`, padding `5px 14px`, pill radius, shadow `0 6px 16px -4px rgba(79,111,209,0.5)` |
| `.modal-backdrop` | Modal/Drawer scrim                       | `rgba(15,23,41,0.55)` + `4px` blur, fade-in `200ms ease` |
| `.disclaimer`     | Italic helper line under forms           | `11.5px / italic / --color-text-hint`, centered |

---

*End of specification — sections 1–7 complete.*
