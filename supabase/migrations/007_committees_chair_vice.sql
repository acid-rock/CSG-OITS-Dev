-- =============================================================================
-- CSG-OITS  |  Migration 007 — Committees chair / vice-chair columns
-- Run in Supabase SQL Editor.
-- Safe to re-run (IF NOT EXISTS guards).
-- =============================================================================

ALTER TABLE committees ADD COLUMN IF NOT EXISTS chair_name text;
ALTER TABLE committees ADD COLUMN IF NOT EXISTS vice_chair_name text;
