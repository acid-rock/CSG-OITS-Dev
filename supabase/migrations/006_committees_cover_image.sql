-- =============================================================================
-- CSG-OITS  |  Migration 006 — Committee cover image
-- Run in Supabase SQL Editor.
-- Adds the cover_image_path column used by the committees storage bucket.
-- Safe to re-run (IF NOT EXISTS guards).
-- =============================================================================

-- The path stored here is the object key inside the 'committees' bucket,
-- e.g. "3f2a1b4c-xxxx.jpg".  The backend resolves it to a full public URL.
ALTER TABLE committees
  ADD COLUMN IF NOT EXISTS cover_image_path text;
