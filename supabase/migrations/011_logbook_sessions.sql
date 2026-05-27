-- Migration 011: Digital Office Logbook
-- Run in Supabase SQL editor (Dashboard → SQL Editor → New query)

-- Logbook sessions table
CREATE TABLE IF NOT EXISTS logbook_sessions (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id    UUID         NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  date          DATE         NOT NULL,          -- local PH date (Asia/Manila) of check-in
  check_in_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  check_out_at  TIMESTAMPTZ,                    -- NULL = open session
  check_in_lat  DOUBLE PRECISION,
  check_in_lng  DOUBLE PRECISION,
  auto_checkout BOOLEAN      NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ  DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_logbook_officer
  ON logbook_sessions (officer_id);

CREATE INDEX IF NOT EXISTS idx_logbook_date
  ON logbook_sessions (date);

-- Partial index speeds up the "is officer already checked in?" check
CREATE INDEX IF NOT EXISTS idx_logbook_open
  ON logbook_sessions (officer_id, date)
  WHERE check_out_at IS NULL;
