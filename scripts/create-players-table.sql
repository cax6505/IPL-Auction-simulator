
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- 1. Create Teams Table
CREATE TABLE teams (
  id VARCHAR(10) PRIMARY KEY, -- e.g., 'CSK', 'RCB'
  name VARCHAR(50) NOT NULL,
  short VARCHAR(10) NOT NULL,
  home_ground VARCHAR(100),
  color VARCHAR(20),
  purse_2026_cr NUMERIC(6, 2) DEFAULT 125.0,
  retained_spend_2026_cr NUMERIC(6, 2) DEFAULT 0.0,
  auction_purse_remaining_2026_cr NUMERIC(6, 2) DEFAULT 125.0,
  titles JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to teams" ON teams FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert to teams" ON teams FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update to teams" ON teams FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 2. Validate/Create enum for player roles if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'player_role') THEN
    CREATE TYPE player_role AS ENUM ('BAT', 'BOWL', 'AR', 'WK', 'batter', 'bowler', 'all-rounder', 'wicket-keeper');
  END IF;
END$$;

-- Safely add the new abbreviations to the existing enum if it already existed
ALTER TYPE player_role ADD VALUE IF NOT EXISTS 'BAT';
ALTER TYPE player_role ADD VALUE IF NOT EXISTS 'BOWL';
ALTER TYPE player_role ADD VALUE IF NOT EXISTS 'AR';
ALTER TYPE player_role ADD VALUE IF NOT EXISTS 'WK';

-- 3. Create Players Table (Relational with dataset)
CREATE TABLE players (
  id VARCHAR(100) PRIMARY KEY, -- e.g., 'rishabh-pant'
  name VARCHAR(100) NOT NULL,
  nationality VARCHAR(50) NOT NULL DEFAULT 'India',
  is_overseas BOOLEAN NOT NULL DEFAULT false,
  capped_status VARCHAR(20) DEFAULT 'uncapped',
  role player_role NOT NULL,
  batting_style VARCHAR(10),
  bowling_style VARCHAR(20),
  
  -- Current and previous team routing using Foreign Keys
  ipl_team_2026 VARCHAR(10) REFERENCES teams(id) ON DELETE SET NULL,
  ipl_team_2025 VARCHAR(10) REFERENCES teams(id) ON DELETE SET NULL,
  
  contract_type_2026 VARCHAR(30), -- 'RETAINED', 'AUCTION', etc
  
  base_price_cr NUMERIC(6, 2),
  sold_price_cr NUMERIC(6, 2),
  auction_year INTEGER,
  auction_set VARCHAR(50),
  retention_cost_cr NUMERIC(6, 2),
  rtm_used BOOLEAN DEFAULT false,
  
  -- Full auction history JSON payload
  all_time_auctions JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for robust querying
CREATE INDEX idx_players_team_2026 ON players (ipl_team_2026);
CREATE INDEX idx_players_role ON players (role);
CREATE INDEX idx_players_overseas ON players (is_overseas);
CREATE INDEX idx_players_contract ON players (contract_type_2026);

-- Enable RLS for players
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to players" ON players FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert to players" ON players FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update to players" ON players FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Note: The constraints and cascades allow safe re-runs inside Supabase logic.

SELECT 'Database migrated successfully!' as status;
