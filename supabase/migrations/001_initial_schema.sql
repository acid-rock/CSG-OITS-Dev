-- =============================================================================
-- CSG-OITS  |  Migration 001 — Initial Schema
-- Run this first. Creates all base tables and the audit infrastructure.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- One row per admin user. Linked to Supabase Auth users.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- bulletin
-- CSG announcements / bulletin board posts. Each post has a cover image
-- stored in the 'bulletin' storage bucket as {id}.jpg.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bulletin (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text        NOT NULL UNIQUE,
  content    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  owner_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- documents
-- Official CSG documents (PDFs). Files are stored in the 'documents' storage
-- bucket at the path held in file_path. Thumbnails live in 'thumbnails' as
-- {id}.png. Soft-delete columns added in migration 002.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path   text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  owner_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- events
-- CSG events. Up to 3 photos per event are stored in the 'events' storage
-- bucket under {id}/0.jpg, {id}/1.jpg, {id}/2.jpg.
-- ip_address and user_agent are captured at creation for audit purposes.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL UNIQUE,
  description  text,
  date_happened timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  ip_address   text,
  user_agent   text
);

-- ---------------------------------------------------------------------------
-- committees
-- CSG standing committees. Officers are assigned to a committee via FK.
-- Uses an integer identity PK so committees can be ordered by ID.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS committees (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------------
-- officers
-- CSG officers and board members. Avatar images are stored in the 'officers'
-- storage bucket. type must be one of: executive, board, adviser.
-- committee is a nullable FK to committees(id).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS officers (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  full_name            text        NOT NULL,
  position             jsonb,
  avatar               text,
  type                 text        CHECK (type IN ('executive', 'board', 'adviser', 'member', 'former')),
  socials              text,
  year_serving         text,
  student_number       text,
  committee            uuid        REFERENCES committees(id) ON DELETE SET NULL,
  is_committee_official boolean     NOT NULL DEFAULT false,
  UNIQUE (full_name, year_serving)
);

-- ---------------------------------------------------------------------------
-- whitelist
-- Emails pre-approved to receive admin accounts. Checked before registration.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS whitelist (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- settings
-- Single-row system configuration (system name, logo, access state).
-- Only one row should ever exist (id = 1).
-- ---------------------------------------------------------------------------
-- Uses a text singleton key so upserts always update the same row.
-- The DEFAULT 'default' ensures every INSERT without an explicit id lands on the
-- same key, making ON CONFLICT (id) DO UPDATE work correctly.
CREATE TABLE IF NOT EXISTS settings (
  id            text    PRIMARY KEY DEFAULT 'default',
  system_name   text    NOT NULL DEFAULT 'CSG-OITS',
  logo_url      text,
  access_paused boolean NOT NULL DEFAULT false
);

-- ---------------------------------------------------------------------------
-- audit_logs
-- Written by the Supabase audit_trigger_function() which fires on every table.
-- The trigger reads session variables set by set_audit_context() (called from
-- the backend audit middleware) and records who made each change and from where.
-- action:     'INSERT' | 'UPDATE' | 'DELETE'  (TG_OP)
-- entity:     table that was modified          (TG_TABLE_NAME)
-- entity_id:  primary key of the affected row  (new.id or old.id — must be uuid)
-- created_by: Supabase auth user id
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action     text,
  entity     text,
  entity_id  uuid,
  old_data   jsonb,
  new_data   jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text
);

-- ---------------------------------------------------------------------------
-- set_audit_context()
-- Called by the backend audit middleware before each authenticated write.
-- Stores the caller's identity in session-level config variables so that
-- triggers on other tables can read them when writing to audit_logs.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_audit_context(
  user_id    uuid,
  ip_address text,
  user_agent text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.audit_user_id',    COALESCE(user_id::text, ''), true);
  PERFORM set_config('app.audit_ip_address', COALESCE(ip_address,    ''), true);
  PERFORM set_config('app.audit_user_agent', COALESCE(user_agent,    ''), true);
END;
$$;
