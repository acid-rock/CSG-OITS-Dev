# Supabase Security Settings

These settings must be configured manually in the Supabase dashboard.
They cannot be set from code. Verify them before any public launch.

## Authentication settings
(Dashboard → Authentication → Settings)

- [ ] **Minimum password length:** 8 characters
- [ ] **Password strength:** Enable "Letters and numbers required"
- [ ] **Rate limit for sign-in:** Enable, set to 10 attempts per hour
- [ ] **Account lockout after failed attempts:** Enable
- [ ] **Email confirmation required:** Enable for new accounts
- [ ] **Session timeout:** Set to match JWT expiry (1 hour)

## Storage bucket policies
(Dashboard → Storage → Buckets → [each bucket] → Policies)

Verify that each bucket has RLS policies that allow:
- Public READ for: bulletin, documents, events, officers, organizations
- Authenticated WRITE/DELETE only — no anonymous uploads

The backend enforces this via the service key, but bucket-level policies
provide a second layer of defense if the backend is misconfigured.

## Row-Level Security
(Dashboard → Database → Tables → [each table] → RLS)

- [ ] RLS is ENABLED on all tables
- [ ] The `anonSupabase` client (anon key) can only READ active records
- [ ] Test by making a direct Supabase query with the anon key — it
      should NOT return archived or soft-deleted records

## API settings
(Dashboard → Settings → API)

- [ ] **Exposed schemas:** Only `public` should be exposed — not `auth` or `storage`
- [ ] Service role key is NEVER committed to git or exposed in frontend code
- [ ] JWT secret matches `SUPABASE_JWT_SECRET` in backend .env
