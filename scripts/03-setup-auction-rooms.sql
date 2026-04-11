DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS room_franchises CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- 1. Create Rooms Table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'active', 'paused', 'completed'
  current_player_id VARCHAR(100) REFERENCES players(id),
  current_bid_cr NUMERIC(6, 2) DEFAULT 0.0,
  current_highest_bidder_id VARCHAR(10) REFERENCES teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Room Franchises (User <-> Team mapping per room)
CREATE TABLE room_franchises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  team_id VARCHAR(10) REFERENCES teams(id),
  user_name VARCHAR(50), -- The friend's nickname who joined
  is_host BOOLEAN DEFAULT false,
  purse_remaining_cr NUMERIC(6, 2) DEFAULT 125.0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, team_id) -- Only 1 person can control CSK per room
);

-- 3. Create Live Bids history
CREATE TABLE bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id VARCHAR(100) REFERENCES players(id),
  team_id VARCHAR(10) REFERENCES teams(id),
  amount_cr NUMERIC(6, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and setup permissive public anon access for multiplayer
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to rooms" ON rooms FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert to rooms" ON rooms FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update to rooms" ON rooms FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to room_franchises" ON room_franchises FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert to room_franchises" ON room_franchises FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update to room_franchises" ON room_franchises FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to bids" ON bids FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert to bids" ON bids FOR INSERT TO anon WITH CHECK (true);

SELECT 'Real-Time Auction Tables Migrated!' as status;
