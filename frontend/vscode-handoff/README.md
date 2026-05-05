# CSG-OITS — Wave 11A Design Port

Drop-in package to port the polished prototype design into the existing Vite + React 19 + TypeScript codebase at `CSG-OITS-Dev/frontend/`.

## What's in here

```
vscode-handoff/
├── README.md                  ← this file
├── CLAUDE_CODE_PROMPT.md      ← paste into VS Code Claude to drive the port
├── tokens/
│   └── index.css              ← REPLACE src/index.css
├── components/
│   ├── navigation.css         ← REPLACE src/components/navigation/navigation.css
│   ├── footer.css             ← REPLACE src/components/footer/footer.css
│   ├── officer-card.css       ← REPLACE src/components/officer-card/officer-card.css
│   ├── document-card.css      ← REPLACE src/components/document-card/document-card.css
│   ├── event-card.css         ← REPLACE src/components/event-card/card.css
│   ├── announcement-card.css  ← REPLACE src/components/announcement-card/announcement-card.css
│   ├── modal.css              ← REPLACE src/components/modal/modal.css
│   └── button.css             ← REPLACE src/components/button/button.css
├── layout/
│   ├── main.css               ← REPLACE src/layout/main-section/main.css
│   ├── announcement.css       ← REPLACE src/layout/announcement-section/announcement.css
│   ├── document.css           ← REPLACE src/layout/document-section/document.css
│   ├── event.css              ← REPLACE src/layout/events-section/event.css
│   ├── officer.css            ← REPLACE src/layout/officer-layout/officer.css
│   └── about.css              ← REPLACE src/layout/about-section/about.css
├── route/
│   ├── borrow.css             ← REPLACE src/route/borrow/borrow.css
│   ├── officers.css           ← REPLACE src/route/officers/officers.css
│   └── bulletin.css           ← REPLACE src/route/bulletin/bulletin.css
├── admin/
│   ├── adminPanel.css         ← REPLACE src/admin/adminPanel.css
│   └── contentPanel.css       ← REPLACE src/admin/contentPanel/contenePanel.css
└── tsx-patches/               ← JSX additions for new structural elements
    ├── Main.tsx.md            ← floating badges + stat tiles for hero
    ├── Officer-section.md     ← president crown badge
    ├── Announcement.md        ← pinned strip + tag system
    └── AdminSidebar.md        ← welcome block + section-grouped nav
```

## Order of operations

1. **Tokens first** — replace `src/index.css`. The new tokens (`--color-primary`, `--gradient-hero`, `--font-stack`, etc.) drive every other file. Old token names (`--primary-blue` etc.) are aliased so existing components keep rendering during the migration.

2. **Atom components** — `navigation.css`, `button.css`, `footer.css`, etc. These are shared across pages, so swapping them updates the whole app at once.

3. **Layouts and routes** — section-by-section. Each `.css` file is self-contained and uses only the new tokens.

4. **JSX patches** — apply the `tsx-patches/*.md` instructions for new structural elements (floating hero badges, president crown, pinned strip, admin welcome block). These are minimal additions, not rewrites.

5. **Admin** — `adminPanel.css` is the largest single file. Apply last; review the gradient sidebar carefully against existing routes.

## Compatibility notes

- React 19 / `react-router-dom@7` — no API changes needed, all selectors are CSS-only
- Existing `lucide-react` icons stay; they replace the prototype's emoji glyphs
- Existing config files (`*Config.ts`) are the source of truth for data — don't pull data from the prototype
- Mobile breakpoints kept at 768px / 480px to match existing components

## Visual delta (vs. current design)

| Aspect | Before | After |
|---|---|---|
| Body font | Roboto/Inter | Plus Jakarta Sans |
| Display accent | none | Instrument Serif italic for emphasis words |
| Hero | flat blue gradient + carousel | richer gradient + dot pattern + floating badge cards + 3 stat tiles |
| Cards | borderless with shadow | thin border + animated top accent on hover |
| Buttons | filled blue | filled with inset highlight + lift on hover |
| Admin sidebar | flat blue | gradient with dot-pattern overlay + welcome block |
| Modals | plain header | gradient header with pattern overlay |
| Status pills | text only | dot + uppercase label, color-coded |
