# CSG-OITS — Online Information Transparency System

The Online Information Transparency System (OITS) is the official website and content management system for the Central Student Government (CSG) of Cavite State University Imus Campus. It provides CVSU-Imus students with open access to CSG announcements, official documents, event records, and officer information. Authenticated CSG administrators can create, update, and delete all content through a protected admin panel.

---

## Architecture

```
CSG-OITS-Dev/
├── backend/     Express 5 REST API (Node.js ESM)
└── frontend/    React 19 + TypeScript SPA (Vite)
```

**Backend** — Express 5 serves a REST API under `/api/v1`. Authentication is handled via Supabase Auth (email/password). The server issues httpOnly cookies (`sb_access_token`, `sb_refresh_token`) on login and verifies JWTs on protected routes.

**Frontend** — React 19 + TypeScript built with Vite. Public pages consume the backend API via Axios. The admin panel is guarded by a `ProtectedRoute` component that checks a localStorage session flag; the backend `requireAuth` middleware is the real enforcement layer.

**Database / Auth / Storage** — [Supabase](https://supabase.com) (PostgreSQL). Tables: `bulletin`, `documents`, `events`, `officers`, `committees`, `profiles`, `settings`, `whitelist`. Storage buckets: `bulletin`, `documents`, `thumbnails`, `events`, `officers`. Row Level Security (RLS) is enforced at the Supabase level.

**PDF Redaction Microservice** — An external service at `PDF_REDACT_URL`. When an admin uploads a document, the backend sends the PDF to this service which redacts the selected areas and returns the cleaned PDF. The service also generates a thumbnail PNG. The microservice source is currently located at `frontend/src/admin/components/pdf-selector-components/main.py` and should be extracted to its own service directory.

---

## Prerequisites

- Node.js >= 18
- npm >= 9

---

## Local Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd CSG-OITS-Dev

# 2. Set up backend environment
cd backend
cp .env.example .env
# Edit .env and fill in all required values

# 3. Install backend dependencies
npm install

# 4. Set up frontend environment
cd ../frontend
cp .env.example .env
# Edit .env — set VITE_API_URL to http://localhost:3000/api/v1

# 5. Install frontend dependencies
npm install

# 6. Start the backend (from /backend)
cd ../backend
npm run dev

# 7. Start the frontend (from /frontend, in a separate terminal)
cd ../frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.
The backend API will be available at `http://localhost:3000`.

---

## API Endpoint Reference

All endpoints are prefixed with `/api/v1`. A rate limit of 100 requests per 15 minutes applies to all routes.

### User

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/user/login` | No | Sign in with email/password; sets httpOnly session cookies |
| POST | `/user/logout` | No | Clear session cookies |
| POST | `/user/register` | Yes | Create a new admin account (admin only) |
| POST | `/user/forgot-password` | No | Send a Supabase password reset email |
| GET | `/user/whitelist` | Yes | List all whitelisted emails |
| POST | `/user/whitelist` | Yes | Add an email to the whitelist |
| DELETE | `/user/whitelist` | Yes | Remove an entry from the whitelist |

### Announcements (Bulletin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/announcements/` | No | List all bulletin items with image URLs |
| POST | `/announcements/add` | Yes | Create a bulletin item and upload image to storage |
| POST | `/announcements/edit` | Yes | Update a bulletin item |
| DELETE | `/announcements/delete` | Yes | Delete bulletin items (array body) |

### Documents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/documents/` | No | List all documents (supports `?page=&limit=` for pagination) |
| POST | `/documents/add` | Yes | Upload and redact a PDF, generate thumbnail, insert DB record |
| POST | `/documents/edit` | Yes | Rename/re-describe a document and move the storage file |
| DELETE | `/documents/delete` | Yes | Delete document rows and storage files (array body) |

### Events

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/events/` | No | List all events with image URLs from storage |
| POST | `/events/add` | Yes | Create an event and upload up to 3 images |
| POST | `/events/edit` | Yes | Update event name, description, date |
| DELETE | `/events/delete` | Yes | Delete an event and all its images (`{id}` body) |

### Officers

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/officers/` | No | List all officers with resolved avatar URLs (supports `?page=&limit=`) |

### Committees

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/committees/` | No | List all committees ordered by ID |

### Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/settings/` | No | Get system settings (system name, logo, access state) |
| POST | `/settings/` | Yes | Upsert system settings |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Returns `200 OK` for uptime monitoring |

---

## Database Setup

The database schema is managed through SQL migration files in `supabase/migrations/`. Run them in order using the **SQL Editor** in your Supabase dashboard.

### Steps

1. **Create a new Supabase project** at [supabase.com](https://supabase.com).

2. **Run migrations in order** — paste each file into the Supabase SQL Editor and execute:
   - `supabase/migrations/001_initial_schema.sql` — creates all base tables and the audit infrastructure
   - `supabase/migrations/002_soft_delete_documents.sql` — adds `is_deleted` and `deleted_at` to the documents table
   - `supabase/migrations/003_announcement_pinning.sql` — adds `is_pinned` to the bulletin table

3. **Run the seed file** — paste `supabase/seed.sql` into the SQL Editor and execute. Edit the committee names in the seed file to match your actual CSG committee names before running.

4. **Copy credentials into `backend/.env`** — from Supabase dashboard → Project Settings → API:
   - `SUPABASE_URL` — your project URL
   - `SUPABASE_ANON_KEY` — the anon/public key
   - `SUPABASE_SERVICE_KEY` — the service_role key
   - `SUPABASE_JWT_SECRET` — from API Settings → JWT Settings → JWT Secret

5. **Create the required storage buckets** in Supabase dashboard → Storage → New Bucket (set each to Public):
   - `bulletin`
   - `documents`
   - `thumbnails`
   - `events`
   - `officers`

6. **Enable Row Level Security (RLS)** on all tables. The backend uses the service role key for admin operations (bypasses RLS) and the anon key with user-scoped JWTs for authenticated writes (enforces RLS). Configure RLS policies as appropriate for your security requirements.

### Optional: View Tracking

If you want to track per-document view counts, create the following PostgreSQL function in the SQL Editor:

```sql
-- Add a views column to each table you want to track
ALTER TABLE bulletin   ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;
ALTER TABLE documents  ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;
ALTER TABLE events     ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- Atomic increment function (safe for concurrent requests)
CREATE OR REPLACE FUNCTION increment_views(row_id uuid, table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET views = views + 1 WHERE id = $1',
    table_name
  ) USING row_id;
END;
$$;
```

Then uncomment the `supabase.rpc('increment_views', ...)` calls in the backend GET routes (announcements, documents, events).

---

## PDF Redaction Microservice

The document upload flow sends PDFs to an external redaction service at `PDF_REDACT_URL` before storing them in Supabase. The service exposes two endpoints:

- `POST /api/v1/redact` — accepts a PDF and a list of bounding boxes, returns a redacted PDF
- `POST /api/v1/thumbnail/create` — accepts a PDF, returns a PNG thumbnail of the first page

The admin panel includes a visual area-selector tool ([pdf-selector.tsx](frontend/src/admin/components/pdf-selector-components/pdf-selector.tsx)) that lets admins draw redaction boxes on the PDF before uploading.

**The microservice source code** is currently located at `frontend/src/admin/components/pdf-selector-components/main.py`. It should be moved to a dedicated `services/redact/` directory and documented separately before production deployment.
