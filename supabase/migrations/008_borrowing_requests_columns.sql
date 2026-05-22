-- =============================================================================
-- CSG-OITS  |  Migration 008 — borrowing_requests extended columns
-- Run in Supabase SQL Editor.
-- Adds all columns that the borrow-request endpoint inserts.
-- Safe to re-run (IF NOT EXISTS / IF NOT EXISTS guards).
-- =============================================================================

-- Core columns (may already exist)
ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS borrower_email     text;
ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS contact_number     text;
ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS return_date        date;

-- Extended fields added in later iterations
ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS organization            text;
ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS position_in_org        text;
ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS purpose_type           text;
ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS purpose_others_detail  text;
ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS activity_name          text;
ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS venue                  text;
ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS time_of_use            text;
ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS equipment_items        jsonb;
ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS admin_notes            text;

-- RLS: allow public inserts (students submit without an account)
ALTER TABLE borrowing_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'borrowing_requests' AND policyname = 'allow_public_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "allow_public_insert" ON borrowing_requests
             FOR INSERT TO anon WITH CHECK (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'borrowing_requests' AND policyname = 'allow_auth_all'
  ) THEN
    EXECUTE 'CREATE POLICY "allow_auth_all" ON borrowing_requests
             FOR ALL TO authenticated USING (true)';
  END IF;
END $$;
