# Local Development Setup

---

## Prerequisites

| Requirement | Why |
|---|---|
| Node.js ≥ 18 | Backend ESM modules and frontend build tooling |
| npm ≥ 9 | Package management |
| **mkcert** | Local HTTPS certificates — **required** for httpOnly cookie auth |
| Git | Source control |
| Supabase account | Database, Auth, Storage |

**Why is HTTPS required?** The backend sets `sb_access_token` with `secure: true`. Browsers refuse to store or send `secure` cookies over plain `http://`. Without HTTPS, login will return 200 but no cookie will be stored, and every subsequent admin API call will return 403.

---

## Step 1 — Clone the repository

```bash
git clone <repo-url>
cd CSG-OITS-Dev
```

---

## Step 2 — Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## Step 3 — Set up local HTTPS with mkcert

**Install mkcert:**

```bash
# macOS
brew install mkcert
brew install nss  # for Firefox support

# Windows (via Chocolatey)
choco install mkcert

# Linux (Debian/Ubuntu)
sudo apt install libnss3-tools
curl -L https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-linux-amd64 -o mkcert
chmod +x mkcert && sudo mv mkcert /usr/local/bin/
```

**Generate certificates:**

```bash
# From the project root
mkcert -install                         # install the local CA
mkcert localhost 127.0.0.1 ::1         # generate certificates
```

This creates `localhost+2.pem` and `localhost+2-key.pem` in the current directory.

**Configure Vite to use the certificates:**

Check `frontend/vite.config.ts` — it should already reference these certificate files. If it does not, add:

```ts
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('../localhost+2-key.pem'),
      cert: fs.readFileSync('../localhost+2.pem'),
    },
  },
});
```

**Configure the backend** — ensure `backend/src/server.js` serves HTTPS on port 3000 (it should already, check the file).

---

## Step 4 — Configure environment variables

### Backend — `backend/.env`

```env
# Supabase connection (from Supabase dashboard → Project Settings → API)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=your-jwt-secret

# Supabase management (for storage analytics — from dashboard → Access Tokens)
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_MANAGEMENT_TOKEN=sbp_...

# PDF Redaction microservice (run locally or use a deployed URL)
PDF_REDACT_URL=http://localhost:8000

# Must match where the frontend runs
FRONTEND_URL=https://localhost:5173

# Port for the backend server
PORT=3000
```

Where to find these values:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` → Supabase dashboard → Project Settings → API
- `SUPABASE_JWT_SECRET` → Supabase dashboard → Project Settings → API → JWT Settings → JWT Secret
- `SUPABASE_PROJECT_REF` → from the project URL (`https://<ref>.supabase.co`)
- `SUPABASE_MANAGEMENT_TOKEN` → Supabase dashboard → Account → Access Tokens

### Frontend — `frontend/.env`

```env
# Point to the local backend
VITE_API_URL=https://localhost:3000/api/v1

# For the Settings panel changelog modal (GitHub Releases)
VITE_GITHUB_OWNER=your-github-org
VITE_GITHUB_REPO=CSG-OITS-Dev
```

---

## Step 5 — Set up Supabase

### 5a. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Choose a region close to your users (Philippines → Singapore/Southeast Asia).
3. Note your project URL, anon key, and service key.

### 5b. Run database migrations

Open Supabase dashboard → SQL Editor and run the following SQL in order:

**1. Base schema:**
```sql
-- Create tables with all required columns

CREATE TABLE IF NOT EXISTS bulletin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  owner_id uuid REFERENCES auth.users(id),
  is_pinned bool NOT NULL DEFAULT false,
  is_archived bool NOT NULL DEFAULT false,
  deleted_at timestamptz,
  category text NOT NULL DEFAULT 'CSG Updates',
  term_year text
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  name text,
  description text,
  category text,
  term_year text,
  created_at timestamptz NOT NULL DEFAULT now(),
  owner_id uuid REFERENCES auth.users(id),
  is_archived bool NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  date_happened date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  is_archived bool NOT NULL DEFAULT false,
  deleted_at timestamptz,
  term_year text
);

CREATE TABLE IF NOT EXISTS committees (
  id serial PRIMARY KEY,   -- INTEGER, auto-increment
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  position text NOT NULL,
  type text NOT NULL,
  avatar text,
  socials text,
  year_serving text,
  student_number text,
  committee integer REFERENCES committees(id),
  is_committee_official bool NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  term_year text,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_path text,
  facebook_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_archived bool NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  max_quantity integer NOT NULL,
  is_available bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS borrowing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_name text NOT NULL,
  borrower_id text NOT NULL,
  email text NOT NULL,
  contact_number text,
  organization text,
  position_in_org text,
  equipment_name text NOT NULL,
  quantity_requested integer NOT NULL,
  purpose_type text,
  activity_name text,
  venue text,
  time_of_use text,
  borrow_date date NOT NULL,
  return_date date,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  owner_id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text
);

CREATE TABLE IF NOT EXISTS whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  full_name text,
  student_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  created_by uuid REFERENCES auth.users(id),
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**2. Seed initial data (optional):**
```sql
-- Insert default settings
INSERT INTO settings (key, value) VALUES ('active_term', 'AY 2025-2026')
ON CONFLICT (key) DO NOTHING;

-- Insert committees (customize these names)
INSERT INTO committees (name) VALUES
  ('Academic Affairs'),
  ('Budget and Finance'),
  ('Ways and Means'),
  ('Sports and Recreation'),
  ('Health and Wellness'),
  ('Cultural and Arts'),
  ('Environment and Sustainability'),
  ('Information and Communications Technology'),
  ('Scholarship and Awards'),
  ('Socio-Civic and Community Development'),
  ('Gender and Development'),
  ('Public Relations and Documentation')
ON CONFLICT DO NOTHING;
```

### 5c. Enable Row Level Security

In Supabase dashboard → Table Editor → each table → RLS → Enable. The backend's service key bypasses RLS for admin operations; the anon key enforces it for public reads.

### 5d. Create storage buckets

In Supabase dashboard → Storage → New Bucket. Create all 7 buckets as **public**:

- `bulletin`
- `documents`
- `thumbnails`
- `events`
- `officers`
- `organizations`
- `equipment`

### 5e. Configure Auth

In Supabase dashboard → Authentication → Settings:
- Enable email/password sign-in
- Set Site URL to `https://localhost:5173` (for local dev)
- Add `https://localhost:5173/admin/reset-password` to the redirect URLs list

---

## Step 6 — Run the development servers

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Starts on https://localhost:3000
```

```bash
# Terminal 2 — Frontend
cd frontend
npm run dev
# Starts on https://localhost:5173
```

---

## Step 7 — Create the first admin account

There is no seeded admin user. You need to create the first account via the Supabase Auth dashboard:

1. Supabase dashboard → Authentication → Users → Invite User (or Add User)
2. Enter an email and password
3. Manually insert a profile record in SQL Editor:
   ```sql
   INSERT INTO profiles (owner_id, role)
   SELECT id, 'admin' FROM auth.users WHERE email = 'your@email.com';
   ```
4. Confirm the email (or disable email confirmation in Auth settings for local dev)

---

## Step 8 — Verify setup

```
[ ] https://localhost:3000/health returns "OK"
[ ] https://localhost:5173 loads the public homepage
[ ] GET https://localhost:3000/api/v1/announcements/ returns [] (empty array)
[ ] POST https://localhost:3000/api/v1/user/login returns 200 and sets cookies
[ ] https://localhost:5173/admin loads the admin panel after login
[ ] Admin can create an announcement and it appears on the public homepage
```

---

## Common issues

### Cookies not being set (403 on all admin calls)

**Cause:** Browser refuses `secure` cookies over HTTP.
**Fix:** Ensure both frontend and backend are running over HTTPS (mkcert certificates installed).

### 500 errors on organizations or committees

**Cause:** Migration not run — the table doesn't exist or is missing columns.
**Fix:** Run the base schema SQL from Step 5b.

### `deleted_at` column missing on committees

**Cause:** The `deleted_at` column was added as a later migration.
**Fix:** Run in SQL Editor:
```sql
ALTER TABLE committees ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
```

### PDF upload fails with "Connection refused"

**Cause:** `PDF_REDACT_URL` is not running or not set.
**Fix:** Start the PDF redaction microservice (`frontend/src/admin/components/pdf-selector-components/main.py`) or set `PDF_REDACT_URL` to a deployed instance.

### `SUPABASE_JWT_SECRET` not found

**Cause:** Missing from `.env` or wrong value.
**Fix:** Find it at Supabase dashboard → Project Settings → API → JWT Settings → JWT Secret.

### `whitelist.full_name` or `whitelist.student_id` column missing

**Cause:** These columns were added later and the migration may not have been applied.
**Fix:**
```sql
ALTER TABLE whitelist ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE whitelist ADD COLUMN IF NOT EXISTS student_id text;
```

---

## Running tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E (requires both servers running)
npx playwright test
```

See [docs/testing.md](testing.md) for the full test guide.
