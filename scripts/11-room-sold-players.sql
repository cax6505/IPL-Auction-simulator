-- 11-room-sold-players.sql
-- Room-scoped player purchase tracking
-- FIXES THE CRITICAL BUG: squad data was leaking across rooms because
-- purchases were written to the global `players` table instead of a per-room table.

CREATE TABLE IF NOT EXISTS room_sold_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id VARCHAR(100) NOT NULL,
  team_id VARCHAR(10) NOT NULL,
  sold_price_cr NUMERIC(6,2) NOT NULL,
  is_overseas BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, player_id) -- A player can only be sold once per room
);

-- Index for fast squad lookups
CREATE INDEX IF NOT EXISTS idx_room_sold_room_team ON room_sold_players(room_id, team_id);
CREATE INDEX IF NOT EXISTS idx_room_sold_room ON room_sold_players(room_id);

-- Enable Realtime on this table so squad updates push to all clients
ALTER PUBLICATION supabase_realtime ADD TABLE room_sold_players;

-- RLS: Allow all operations (session-based auth, no JWT)
ALTER TABLE room_sold_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON room_sold_players FOR ALL USING (true) WITH CHECK (true);

SELECT 'room_sold_players table created + realtime enabled!' as status;
