-- =============================================================================
-- CSG-OITS  |  Migration 010 — Committees full schema backfill
-- Run in Supabase SQL Editor.
-- Safe to re-run — all statements use IF NOT EXISTS / ON CONFLICT guards.
-- Adds every column the committees route depends on that was previously
-- applied manually to the live database but never tracked in a migration file.
-- =============================================================================

-- ── 1. Ensure all columns exist ────────────────────────────────────────────
ALTER TABLE committees ADD COLUMN IF NOT EXISTS status           text        NOT NULL DEFAULT 'active';
ALTER TABLE committees ADD COLUMN IF NOT EXISTS deleted_at       timestamptz;
ALTER TABLE committees ADD COLUMN IF NOT EXISTS description      text;
ALTER TABLE committees ADD COLUMN IF NOT EXISTS cover_image_path text;
ALTER TABLE committees ADD COLUMN IF NOT EXISTS chair_name       text;
ALTER TABLE committees ADD COLUMN IF NOT EXISTS vice_chair_name  text;

-- ── 2. Patch any rows whose status became NULL after the column was added ──
UPDATE committees SET status = 'active' WHERE status IS NULL;

-- ── 3. Add a check constraint so only valid values can be inserted ──────────
ALTER TABLE committees DROP CONSTRAINT IF EXISTS committees_status_check;
ALTER TABLE committees ADD CONSTRAINT committees_status_check
  CHECK (status IN ('active', 'archived'));

-- ── 4. Re-seed the 10 committees (skips duplicates) ────────────────────────
INSERT INTO committees (name, status) VALUES
  ('Rules and Internal Affairs Committee',        'active'),
  ('Committee on External Affairs',               'active'),
  ('Secretariat Committee',                       'active'),
  ('Committee on Finance',                        'active'),
  ('Committee on Audit',                          'active'),
  ('Committee on Culture, Athletics, and Arts',   'active'),
  ('Social and Environmental Awareness Committee','active'),
  ('Committee on Creatives',                      'active'),
  ('Committee on Student Affairs and Concern',    'active'),
  ('Committee on Web Development',                'active')
ON CONFLICT (name) DO NOTHING;

-- ── 5. Set committee descriptions ──────────────────────────────────────────
UPDATE committees SET description = CASE name
  WHEN 'Rules and Internal Affairs Committee' THEN
    'Oversees the internal governance of the CSG, drafts and enforces by-laws, and ensures that all student government proceedings are conducted in accordance with established rules and parliamentary procedures.'
  WHEN 'Committee on External Affairs' THEN
    'Manages the CSG''s relationships with partner institutions, government agencies, non-governmental organizations, and other student councils both on and off campus. Leads inter-school delegations and linkage programs.'
  WHEN 'Secretariat Committee' THEN
    'Responsible for all official correspondence, minutes of meetings, document filing, and records management of the CSG. Serves as the administrative backbone that keeps every office coordinated and documented.'
  WHEN 'Committee on Finance' THEN
    'Manages the collection, disbursement, and safekeeping of CSG funds. Prepares financial statements, oversees the annual budget, and ensures all expenditures are properly authorized and transparently reported.'
  WHEN 'Committee on Audit' THEN
    'Conducts independent review and verification of all CSG financial transactions, ensuring accountability and compliance with university financial policies. Issues audit reports to the student body each term.'
  WHEN 'Committee on Culture, Athletics, and Arts' THEN
    'Plans and executes cultural, athletic, and artistic programs that celebrate student talent and campus traditions — from sports fests and intramurals to theatrical productions and cultural showcases.'
  WHEN 'Social and Environmental Awareness Committee' THEN
    'Champions social responsibility and environmental stewardship among the student body. Organizes community outreach activities, livelihood drives, clean-up campaigns, and sustainability awareness programs.'
  WHEN 'Committee on Creatives' THEN
    'Handles all visual communication, multimedia production, and event hosting for the CSG. Covers graphic design, layout, photography, video documentation, and the coordination of event logistics and hosting.'
  WHEN 'Committee on Student Affairs and Concern' THEN
    'Acts as the primary advocate for student welfare, mediating concerns raised by the student body and coordinating with university offices to address academic, social, and well-being related issues.'
  WHEN 'Committee on Web Development' THEN
    'Develops and maintains the CSG''s digital platforms and online transparency systems. Responsible for the design, development, and ongoing upkeep of the CSG-OITS website and any campus-facing web services.'
END
WHERE name IN (
  'Rules and Internal Affairs Committee',
  'Committee on External Affairs',
  'Secretariat Committee',
  'Committee on Finance',
  'Committee on Audit',
  'Committee on Culture, Athletics, and Arts',
  'Social and Environmental Awareness Committee',
  'Committee on Creatives',
  'Committee on Student Affairs and Concern',
  'Committee on Web Development'
);
