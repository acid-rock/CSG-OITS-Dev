-- =============================================================================
-- CSG-OITS  |  Migration 002 — Soft Delete for Documents
-- Adds is_deleted and deleted_at columns to the documents table.
-- Documents moved to the bin are flagged is_deleted = true instead of being
-- hard-deleted. Permanent purge removes the row and storage files.
-- =============================================================================

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS is_deleted boolean     NOT NULL DEFAULT false;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Back-fill existing rows to ensure no NULLs in is_deleted
UPDATE documents SET is_deleted = false WHERE is_deleted IS NULL;
