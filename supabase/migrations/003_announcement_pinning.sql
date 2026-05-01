-- =============================================================================
-- CSG-OITS  |  Migration 003 — Announcement Pinning
-- Adds is_pinned column to the bulletin table.
-- Pinned announcements are sorted to the top of the public bulletin feed.
-- Admins toggle pinning via POST /api/v1/announcements/pin.
-- =============================================================================

ALTER TABLE bulletin
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- Back-fill existing rows
UPDATE bulletin SET is_pinned = false WHERE is_pinned IS NULL;
