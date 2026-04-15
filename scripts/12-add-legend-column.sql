-- Migration: Add is_legend column to players table for Legends Auction mode
-- Run this in Supabase SQL Editor

-- Add is_legend column (default false for existing rows)
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_legend BOOLEAN DEFAULT false;

-- Create index for fast legend queries
CREATE INDEX IF NOT EXISTS idx_players_is_legend ON players (is_legend);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'players' AND column_name = 'is_legend';

SELECT 'Migration complete: is_legend column added!' as status;
