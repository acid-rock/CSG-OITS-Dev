# Prompt for VS Code Claude — CSG-OITS Wave 11A Design Port

Copy everything below the `---` line into VS Code Claude (Claude Code) as your initial message. Attach the `vscode-handoff/` folder so Claude can read the source files.

---

# CSG-OITS — Wave 11A Design Port (HIGHEST PRIORITY)

You are porting a finalized, approved design system into this codebase. The new design **completely supersedes** every prior styling decision in this repo. Treat it as the single source of truth.

## Authoritative inputs (in priority order)

1. **`vscode-handoff/`** (attached) — the **canonical, current design**. Every CSS file in here is the final answer. Every TSX patch in `vscode-handoff/tsx-patches/` is required.
2. **`vscode-handoff/CLAUDE_CODE_PROMPT.md`** — this prompt.
3. **`vscode-handoff/README.md`** — file mapping (which file in the package replaces which file in `src/`).
4. **The existing codebase under `frontend/src/`** — preserve component structure, routing, data flow, and config files. Restyle, don't rewrite.

## What is NOT authoritative

- The current visual design of any page in `frontend/src/` — it is the **old design** and is being replaced.
- Color tokens like `--primary-blue`, `--accent-blue`, `--blue-border` in the existing `index.css` — these are **legacy**. They will be aliased to the new tokens for backward compat, but all NEW work must use the new tokens (`--color-primary`, `--gradient-hero`, etc.).
- The Roboto / Montserrat / Inter font stack — replaced with **Plus Jakarta Sans** + **Instrument Serif** (italic accents only).
- Any older committed design artifacts, screenshots, or PRs that conflict with `vscode-handoff/`.

If you encounter a conflict between the existing code and `vscode-handoff/`, **`vscode-handoff/` always wins.**

## Non-negotiable design rules (Wave 11A)

- **Typography**: body uses `var(--font-stack)` (Plus Jakarta Sans). Italic emphasis words use `var(--font-serif)` (Instrument Serif). No Roboto, no Montserrat, no Inter.
- **Color**: `--color-primary: #4f6fd1`, `--color-primary-deep: #2c4ba0`. The gradient is `--gradient-hero: linear-gradient(160deg, #4f6fd1 0%, #8aaae0 55%, #c8d2ef 100%)`. Section backgrounds alternate between gradient, white, and surface (`#f4f6fd`).
- **Cards**: `border-radius: var(--radius-card)` (14px). 1px border in `--color-border-soft`. Hover state lifts 2px + shows the `--shadow-card-hover` shadow + reveals an animated 3px top accent bar in `--color-primary`.
- **Buttons**: primary uses inset white highlight + outer blue glow shadow. Hover lifts 1px and intensifies the glow.
- **Hero**: gradient bg + dot pattern overlay + floating info badges + 3 stat tiles. Headline mixes regular sans with italic Instrument Serif emphasis words.
- **Admin sidebar**: gradient background (`--gradient-deep`) with dot-pattern overlay, welcome block under brand, section-grouped nav (`Overview` / `Content` / `Operations`), active item shows a 3px white indicator pill on the left edge.
- **Status pills**: dot prefix + uppercase label. `success` / `danger` / `warning` / `pending` / `approved` / `rejected` variants.
- **Modals**: gradient header with pattern overlay, slide-up entry animation.

## Migration plan

Work through phases **in order**. Do not skip ahead.

### Phase 1 — Tokens (atomic)
- Replace `frontend/src/index.css` entirely with `vscode-handoff/tokens/index.css`.
- Verify the dev server still boots and the app renders without console errors. The aliases at the bottom of the new tokens file will keep legacy components rendering.

### Phase 2 — Shared atoms
Replace these files one at a time. After each, do a visual smoke test of any page that uses the component:
- `components/navigation/navigation.css` ← `vscode-handoff/components/navigation.css`
- `components/button/button.css` ← `vscode-handoff/components/button.css`
- `components/footer/footer.css` ← `vscode-handoff/components/footer.css`
- `components/announcement-card/announcement-card.css` ← `vscode-handoff/components/announcement-card.css`
- `components/document-card/document-card.css` ← `vscode-handoff/components/document-card.css`
- `components/event-card/card.css` ← `vscode-handoff/components/event-card.css`
- `components/officer-card/officer-card.css` ← `vscode-handoff/components/officer-card.css`
- `components/modal/modal.css` ← `vscode-handoff/components/modal.css`

### Phase 3 — Page layouts
- `layout/main-section/main.css` ← `vscode-handoff/layout/main.css` (then apply `tsx-patches/Main.tsx.md`)
- `layout/announcement-section/announcement.css` ← `vscode-handoff/layout/announcement.css` (then apply `tsx-patches/Announcement.md`)
- `layout/document-section/document.css` ← `vscode-handoff/layout/document.css`
- `layout/events-section/event.css` ← `vscode-handoff/layout/event.css`
- `layout/officer-layout/officer.css` ← `vscode-handoff/layout/officer.css` (then apply `tsx-patches/Officer-section.md`)
- `layout/about-section/about.css` ← `vscode-handoff/layout/about.css`

### Phase 4 — Routes
- `route/borrow/borrow.css` ← `vscode-handoff/route/borrow.css`
- `route/officers/officers.css` ← `vscode-handoff/route/officers.css`
- `route/bulletin/bulletin.css` ← `vscode-handoff/route/bulletin.css`

### Phase 5 — Admin (final, largest)
- `admin/adminPanel.css` ← `vscode-handoff/admin/adminPanel.css`
- `admin/contentPanel/contenePanel.css` ← `vscode-handoff/admin/contentPanel.css`
- Apply `tsx-patches/AdminSidebar.md` to add the welcome block and section-grouped nav.

## Verification checklist (run after each phase)

- [ ] `npm run dev` boots without errors.
- [ ] Every page loads without TypeScript or runtime errors.
- [ ] Open DevTools → Computed: confirm body `font-family` resolves to Plus Jakarta Sans.
- [ ] Hero gradient matches `linear-gradient(160deg, #4f6fd1, #8aaae0, #c8d2ef)`.
- [ ] Card hover shows a top accent bar animating from left to right.
- [ ] Admin sidebar shows the gradient background, welcome block, and section labels.
- [ ] No `--primary-blue` or `--accent-blue` references remain in NEW or RESTYLED files (the aliases in `index.css` are the only allowed usage, and only as temporary back-compat).

## Style for code edits

- **Replace files entirely** when migrating CSS. Don't merge old + new — the old rules will leak.
- **Preserve TSX file structure** — keep imports, hooks, routing, and data fetching. Only add JSX nodes called out in `tsx-patches/`.
- **Do not edit `*Config.ts` files** — they are the data source of truth.
- **Do not introduce new dependencies.** Everything works with the existing `package.json` (React 19, lucide-react, react-router-dom 7).
- **Do not add Tailwind, styled-components, or any CSS-in-JS** — the project uses plain CSS-per-component and that pattern stays.

## When in doubt

Re-read `vscode-handoff/`. The prototype it was extracted from is the agreed-upon final design. If something in `frontend/src/` looks "right" but contradicts the package, the package wins.

Begin with Phase 1.
