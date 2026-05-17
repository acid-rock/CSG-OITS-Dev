# docs

Documentation for CSG-OITS. Every file in this directory has a specific audience and scope.

## Document Index

| File | Audience | Description |
|---|---|---|
| [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) | All | **Single authoritative reference.** System purpose, architecture, all modules, DB design, API, security, caching, testing, deployment — 20 sections. Start here. |
| [architecture.md](architecture.md) | Developers | System diagram, all request flows (public load, admin write, auth), caching layer detail, rate limiting strategy, external dependencies |
| [api-reference.md](api-reference.md) | Developers | Every API endpoint — method, path, auth, request body, response shape, validation rules, error codes |
| [database.md](database.md) | Developers | All 12 table schemas with column types, nullability, defaults. Supabase client rules. Storage buckets. Query patterns. |
| [frontend.md](frontend.md) | Frontend developers | Route table, outlet context TypeScript interface, component inventory, config functions, state management patterns |
| [admin-guide.md](admin-guide.md) | Admins + developers | Every admin panel documented: tabs, table columns, form fields, row actions, filters, validation |
| [auth.md](auth.md) | Developers | Login flow, cookie spec, `requireAuth` middleware behavior, session expiry, registration, forgot/reset password |
| [data-lifecycle.md](data-lifecycle.md) | Developers + admins | Three-tier lifecycle (Active → Archive → Bin → delete), state machine diagram, query patterns, officers variant, 30-day purge policy |
| [design-system.md](design-system.md) | Frontend developers | Complete token reference (all CSS custom properties with values), utility classes, design conventions, approved pages |
| [local-setup.md](local-setup.md) | Developers | Step-by-step: clone, install, mkcert, env vars, Supabase setup, run servers, create first admin, verify setup, common issues |
| [deployment.md](deployment.md) | DevOps | Production architecture, backend/frontend/microservice deployment options, Supabase config, pre-launch checklist |
| [security.md](security.md) | Developers + security | 10-layer security implementation, CSP directives, sanitize-html allowlist, known limitations |
| [testing.md](testing.md) | Developers | Test suite overview, commands, backend/frontend/E2E structure, mock infrastructure, coverage thresholds, CI integration |
| [smoke-testing.md](smoke-testing.md) | Testers | Smoke test scripts and pass/fail expectations for verifying a deployment |
| [decisions/README.md](decisions/README.md) | Developers | Index of Architecture Decision Records |
| [decisions/001-supabase-client-strategy.md](decisions/001-supabase-client-strategy.md) | Developers | Why three Supabase clients; the three-client rule |
| [decisions/002-soft-delete-archive-bin.md](decisions/002-soft-delete-archive-bin.md) | Developers | Why Archive and Bin are separate states; the two-column design |
| [decisions/003-root-layout-data-fetching.md](decisions/003-root-layout-data-fetching.md) | Frontend developers | Why Root-layout does all fetching; outlet context rule |
| [decisions/004-committee-integer-pk.md](decisions/004-committee-integer-pk.md) | Developers | Why committees uses INTEGER PK; parseInt() rule |
| [decisions/005-in-memory-cache.md](decisions/005-in-memory-cache.md) | Developers | Why in-memory cache instead of Redis; TTL and invalidation strategy |

## Update rule

When adding a new feature:
1. Update `api-reference.md` with the new endpoint(s).
2. Update `database.md` if a new table or column is added.
3. Update `admin-guide.md` if a new admin panel or action is added.
4. Update `frontend.md` if a new public route is added.
5. Add a new ADR in `decisions/` if the feature introduces a significant architectural pattern.
6. Update `SYSTEM_DESIGN.md` to reflect the changes in the relevant sections.

This document (`docs/README.md`) is the entry point to the documentation. Keep it up to date.

## See also

- [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) — the primary reference document
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — rules and conventions for contributors
- [../CHANGELOG.md](../CHANGELOG.md) — version history
