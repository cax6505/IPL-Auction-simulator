-- 06-atomic-bids.sql
-- SECURE BIDDING ENGINE (RPC)
-- This function processes bids entirely on the PostgreSQL backend to entirely eliminate JavaScript race conditions.

CREATE OR REPLACE FUNCTION execute_bid(
    p_room_id UUID,
    p_player_id VARCHAR,
    p_team_id VARCHAR,
    p_bid_amount NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_bid NUMERIC;
    v_current_team VARCHAR;
    v_timer_dur INT;
    v_franchise RECORD;
    v_is_overseas BOOLEAN;
BEGIN
    -- 1. Atomically lock the room for updating to prevent concurrent identical bids
    SELECT current_bid_cr, current_highest_bidder_id, COALESCE(timer_duration, 10)
    INTO v_current_bid, v_current_team, v_timer_dur
    FROM rooms
    WHERE id = p_room_id
    FOR UPDATE;

    -- 2. Lock the bidder franchise for validation
    SELECT * INTO v_franchise
    FROM room_franchises
    WHERE room_id = p_room_id AND team_id = p_team_id
    FOR UPDATE;

    IF v_franchise IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 3. Strictly validate the incoming bid is higher than the current bid
    IF p_bid_amount <= COALESCE(v_current_bid, 0) THEN
        RETURN FALSE; -- Race condition defeated
    END IF;

    -- 4. Block self-bidding
    IF v_current_team = p_team_id THEN
        RETURN FALSE;
    END IF;

    -- 5. Validate Purse Capacity
    IF COALESCE(v_franchise.purse_remaining_cr, 120.0) < p_bid_amount THEN
        RETURN FALSE; -- Insufficient funds
    END IF;

    -- 6. Validate Squad Limit (Max 25)
    IF COALESCE(v_franchise.squad_count, 0) >= 25 THEN
        RETURN FALSE; -- Squad roster full
    END IF;

    -- 7. Validate Overseas Limit (Max 8)
    SELECT COALESCE(is_overseas, false) INTO v_is_overseas
    FROM players WHERE id = p_player_id;

    IF v_is_overseas AND COALESCE(v_franchise.overseas_count, 0) >= 8 THEN
        RETURN FALSE; -- Overseas slot full
    END IF;

    -- 8. Process the verified bid safely
    INSERT INTO bids (room_id, player_id, team_id, amount_cr)
    VALUES (p_room_id, p_player_id, p_team_id, p_bid_amount);

    UPDATE rooms
    SET current_bid_cr = p_bid_amount,
        current_highest_bidder_id = p_team_id,
        timer_ends_at = now() + (v_timer_dur || ' seconds')::interval
    WHERE id = p_room_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Atomic Bid Engine RPC Mounted!' as status;
