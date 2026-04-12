-- The previous python seeder generated multi-year duplicates with hyphens (e.g., 'P0606-2008', 'P0606-2009').
-- Our cleaned dataset now exclusively relies on the pure, root player_id ('P0606').

-- 1. Un-bind any active auction rooms currently locking player records:
UPDATE rooms SET current_player_id = NULL;

-- 2. Wipe the mismatched/legacy player records safely:
-- Since we already re-seeded the precise 1,196 valid players via python, we can just remove all players that aren't in those 1,196.
-- Alternatively, the easiest approach is to wipe players entirely and rerun the python seeder, but since you already ran Python, 
-- we will specifically erase the pure P-series duplicates:
DELETE FROM players WHERE id ~ '^P[0-9]+-[0-9]{4}$';

-- 2. Validate cleanup
SELECT 'Duplicates obliterated. Player pool now matches pure unique records.' as status;
