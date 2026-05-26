## What does this PR do?
<!-- One paragraph describing the change and why it was made. -->

---

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor (no behavior change)
- [ ] Documentation
- [ ] Performance improvement
- [ ] Database migration

---

## Checklist — complete ALL before requesting review

### General
- [ ] I read `CONTRIBUTING.md` before writing any code
- [ ] I only changed what was directly requested — no scope creep
- [ ] No `console.log` statements in committed code
- [ ] No hardcoded hex colors — CSS token variables used throughout
- [ ] No `window.location.reload()` — React state updated directly

### Backend (if backend files were changed)
- [ ] All write/archive/delete endpoints have `requireAuth` middleware
- [ ] New public read endpoints use `anonSupabase`, not `supabase` service key
- [ ] New admin write endpoints use `supabase` service key or `createUserClient`
- [ ] `ApiError` imported and used for all operational errors
- [ ] No `require()` — ESM `import` used throughout
- [ ] `parseInt()` used for ALL committee ID operations
- [ ] New endpoints registered in `app.js`
- [ ] Cache invalidation added for any endpoint that modifies a cached resource

### Database (if schema was changed)
- [ ] Migration SQL written and included in PR description (copy-paste block)
- [ ] Migration tested in a local or test Supabase project
- [ ] `docs/decisions/` updated if a new architectural pattern was introduced

### Frontend (if frontend files were changed)
- [ ] No `any` TypeScript types — proper interfaces defined
- [ ] Soft-delete actions use `deleted_at` timestamp (not hard delete)
- [ ] Archive actions set `is_archived = true` (not `deleted_at`)
- [ ] Hard delete only available from Bin view after confirmation modal
- [ ] Approved pages NOT modified: `/announcements` and `/documents` public pages

### New features
- [ ] New backend routes added to the API Endpoint Map in `CONTRIBUTING.md`
- [ ] New environment variables documented in both `.env.example` files
- [ ] If a new Supabase table or column was added: migration SQL is in this PR

---

## Database migrations in this PR
<!-- If none, write "None". -->
<!-- If yes, paste the SQL here so the reviewer can see what will be run: -->
```sql
-- Paste migration SQL here
```

## How was this tested?
<!-- Describe what you tested manually or via automated tests. -->

## Screenshots (if UI changed)
<!-- Before / After screenshots for any visual change. -->
