-- Migration 012: RLS policies for logbook_sessions
-- The table had RLS auto-enabled by Supabase's project defaults but was
-- created in migration 011 without any policies, causing INSERT to hard-fail
-- while SELECT silently returned 0 rows.
--
-- All logbook operations go through the backend service key (which bypasses
-- RLS by default). This migration makes that explicit and adds a read policy
-- so any future direct reads via anonSupabase also work safely.

ALTER TABLE logbook_sessions ENABLE ROW LEVEL SECURITY;

-- Service role: full access (all backend logbook operations use the service key)
-- Belt-and-suspenders: service_role already bypasses RLS, but an explicit
-- policy ensures this holds even if project-level settings change.
CREATE POLICY "service_role_all" ON logbook_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated (admin JWT): read-only — admins view sessions in the admin panel
-- Writes always go through the backend service key, never directly from the client.
CREATE POLICY "authenticated_select" ON logbook_sessions
  FOR SELECT
  TO authenticated
  USING (true);
