# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — not yet created. Generate it by running `/grill-with-docs`.
- **`docs/decisions/`** — read decision files that touch the area you're about to work in (this repo uses `docs/decisions/` instead of the canonical `docs/adr/`).

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo:

```
/
├── CONTEXT.md                          ← domain glossary (create via /grill-with-docs)
├── docs/decisions/                     ← architectural decisions (already exists)
│   ├── 001-supabase-client-strategy.md
│   ├── 002-soft-delete-archive-bin.md
│   ├── 003-root-layout-data-fetching.md
│   ├── 004-committee-integer-pk.md
│   └── 005-in-memory-cache.md
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag decision conflicts

If your output contradicts an existing decision file in `docs/decisions/`, surface it explicitly rather than silently overriding:

> _Contradicts docs/decisions/005-in-memory-cache.md — but worth reopening because…_
