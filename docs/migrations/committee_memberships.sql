-- ============================================================
-- Migration: committee_memberships junction table
-- Run in Supabase SQL Editor (project dashboard)
-- ============================================================
-- This replaces the single officers.committee FK with a proper
-- many-to-many relationship: one officer can belong to multiple
-- committees with a distinct role in each.
-- ============================================================

-- 1. Create the junction table
CREATE TABLE IF NOT EXISTS committee_memberships (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id   UUID        NOT NULL REFERENCES officers(id)    ON DELETE CASCADE,
  committee_id UUID        NOT NULL REFERENCES committees(id)  ON DELETE CASCADE,
  role_title   TEXT        NOT NULL DEFAULT 'Member',
  is_official  BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (officer_id, committee_id)
);

-- 2. Enable Row Level Security
ALTER TABLE committee_memberships ENABLE ROW LEVEL SECURITY;

-- 3. Public can read all memberships (needed for the public Officers page)
CREATE POLICY "Public read committee_memberships"
  ON committee_memberships FOR SELECT
  USING (true);

-- 4. Authenticated users (admin panel) can insert / update / delete
CREATE POLICY "Authenticated write committee_memberships"
  ON committee_memberships FOR ALL
  USING (auth.role() = 'authenticated');

-- 5. Seed from existing data (migrate officers.committee + is_committee_official)
--    Only inserts active, non-deleted officers that already have a committee.
INSERT INTO committee_memberships (officer_id, committee_id, role_title, is_official)
SELECT
  id          AS officer_id,
  committee   AS committee_id,
  CASE
    WHEN is_committee_official THEN 'Committee Chairperson'
    ELSE 'Member'
  END         AS role_title,
  is_committee_official
FROM officers
WHERE committee IS NOT NULL
  AND status    = 'active'
  AND deleted_at IS NULL
ON CONFLICT (officer_id, committee_id) DO NOTHING;

-- ============================================================
-- DONE — the legacy officers.committee column is kept for
-- backward compatibility and as a "primary committee" indicator.
-- The junction table is the authoritative source for the
-- committee modal membership list.
-- ============================================================
