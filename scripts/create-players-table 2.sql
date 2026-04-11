-- scripts/create-players-table.sql
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Create enum for player roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'player_role') THEN
    CREATE TYPE player_role AS ENUM ('batter', 'bowler', 'all-rounder', 'wicket-keeper');
  END IF;
END$$;

-- Create the players table
CREATE TABLE IF NOT EXISTS players (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  nationality   TEXT NOT NULL DEFAULT 'Unknown',
  role          player_role NOT NULL,
  current_team  TEXT,
  base_price    TEXT,
  retained_price TEXT,
  image_url     TEXT,
  stats         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint for upsert conflict resolution
  CONSTRAINT players_name_role_unique UNIQUE (name, role)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_players_role ON players (role);
CREATE INDEX IF NOT EXISTS idx_players_nationality ON players (nationality);
CREATE INDEX IF NOT EXISTS idx_players_current_team ON players (current_team);

-- Enable Row Level Security (good practice, even if policies are permissive for now)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon key can read)
CREATE POLICY IF NOT EXISTS "Allow public read access"
  ON players
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated insert/update (for the scraper running server-side)
CREATE POLICY IF NOT EXISTS "Allow anon insert"
  ON players
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow anon update"
  ON players
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Verify
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;
