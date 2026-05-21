-- =============================================================================
-- CSG-OITS  |  Migration 005 — Page-view tracking
-- Run in Supabase SQL Editor.
-- Adds a lightweight event log for public page visits broken down by content
-- type. Used by the Dashboard "Content Views" line chart.
--
-- Safe to re-run: drops the table first so a stale partial table
-- (created by a previous failed run) never causes column-not-found errors.
-- =============================================================================

-- Drop any previous partial table so CREATE TABLE always runs cleanly
DROP TABLE IF EXISTS page_views CASCADE;

-- ---------------------------------------------------------------------------
-- page_views
-- One row per visit. entity_id is optional — tracks section-level visits
-- (entity_id NULL) as well as individual-item opens (entity_id = item UUID).
-- ---------------------------------------------------------------------------
CREATE TABLE page_views (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text        NOT NULL CHECK (entity_type IN ('document', 'announcement', 'event')),
  entity_id   uuid,
  viewed_at   timestamptz NOT NULL DEFAULT now(),
  ip_address  text
);

-- Fast time-series aggregation by type
CREATE INDEX idx_page_views_type_date
  ON page_views (entity_type, viewed_at DESC);

-- Fast per-item lookup (sparse — only rows with entity_id)
CREATE INDEX idx_page_views_entity_id
  ON page_views (entity_id)
  WHERE entity_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS: allow anonymous inserts (public visits) but restrict reads to
-- authenticated users (admins) only.
-- ---------------------------------------------------------------------------
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Public visitors may insert
CREATE POLICY "allow_public_insert" ON page_views
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated users (admins) may select
CREATE POLICY "allow_auth_select" ON page_views
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role may delete (cleanup jobs)
-- (no explicit policy needed — service key bypasses RLS)
