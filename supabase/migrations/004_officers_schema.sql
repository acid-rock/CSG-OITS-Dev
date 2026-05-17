-- Add columns required by the officers route that were missing from 001_initial_schema.sql.

ALTER TABLE officers
  ADD COLUMN IF NOT EXISTS status     text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS term_year  text;
