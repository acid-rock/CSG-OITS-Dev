-- Migration 009: Add parent_id to organizations for sub-organization support
-- Run in Supabase SQL editor (Dashboard → SQL Editor)

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS parent_id uuid
    REFERENCES organizations(id)
    ON DELETE SET NULL;

-- Top-level orgs:  parent_id IS NULL  (most orgs)
-- Sub-orgs:        parent_id = <parent uuid>

-- Sub-orgs are excluded from counts:
--   SELECT COUNT(*) FROM organizations
--   WHERE is_archived = false AND deleted_at IS NULL AND parent_id IS NULL
