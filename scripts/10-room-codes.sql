-- 10-room-codes.sql
-- Add 6-character room codes, timer_duration, and max_players to rooms table

-- Unique 6-character room code for sharing
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_code VARCHAR(6) UNIQUE;

-- Configurable timer duration in seconds (default 10, min 5, max 30)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS timer_duration INTEGER DEFAULT 10;

-- Track max players allowed (default 10)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 10;

-- Generate a unique 6-char room code if missing
-- Backfill existing rooms
UPDATE rooms SET room_code = UPPER(SUBSTR(MD5(RANDOM()::text), 1, 6))
WHERE room_code IS NULL;

-- Make room_code NOT NULL for new inserts
ALTER TABLE rooms ALTER COLUMN room_code SET DEFAULT UPPER(SUBSTR(MD5(RANDOM()::text), 1, 6));

-- Enhanced execute_bid RPC with purse/squad/overseas validation + timer +5s
CREATE OR REPLACE FUNCTION execute_bid(
    p_room_id UUID,
    p_player_id VARCHAR,
    p_team_id VARCHAR,
    p_bid_amount NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_bid NUMERIC;
    v_current_team VARCHAR;
    v_purse NUMERIC;
    v_squad_count INTEGER;
    v_overseas_count INTEGER;
    v_is_overseas BOOLEAN;
    v_timer_ends TIMESTAMPTZ;
    v_new_timer TIMESTAMPTZ;
BEGIN
    -- 1. Lock the room row
    SELECT current_bid_cr, current_highest_bidder_id, timer_ends_at
    INTO v_current_bid, v_current_team, v_timer_ends
    FROM rooms
    WHERE id = p_room_id
    FOR UPDATE;

    -- 2. Bid must be strictly higher
    IF p_bid_amount <= COALESCE(v_current_bid, 0) THEN
        RETURN FALSE;
    END IF;

    -- 3. No self-bidding
    IF v_current_team = p_team_id THEN
        RETURN FALSE;
    END IF;

    -- 4. Check franchise purse, squad count, overseas count
    SELECT purse_remaining_cr, squad_count, overseas_count
    INTO v_purse, v_squad_count, v_overseas_count
    FROM room_franchises
    WHERE room_id = p_room_id AND team_id = p_team_id
    FOR UPDATE;

    -- Purse check
    IF v_purse < p_bid_amount THEN
        RETURN FALSE;
    END IF;

    -- Squad size check (max 25)
    IF v_squad_count >= 25 THEN
        RETURN FALSE;
    END IF;

    -- Overseas check
    SELECT is_overseas INTO v_is_overseas
    FROM players WHERE id = p_player_id;

    IF v_is_overseas = TRUE AND v_overseas_count >= 8 THEN
        RETURN FALSE;
    END IF;

    -- 5. Insert bid record
    INSERT INTO bids (room_id, player_id, team_id, amount_cr)
    VALUES (p_room_id, p_player_id, p_team_id, p_bid_amount);

    -- 6. Calculate new timer: add 5 seconds, but never less than 5s from now
    v_new_timer := GREATEST(
        COALESCE(v_timer_ends, now()) + interval '5 seconds',
        now() + interval '5 seconds'
    );

    -- 7. Update room
    UPDATE rooms
    SET current_bid_cr = p_bid_amount,
        current_highest_bidder_id = p_team_id,
        timer_ends_at = v_new_timer
    WHERE id = p_room_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Room codes + enhanced bid engine applied!' as status;
