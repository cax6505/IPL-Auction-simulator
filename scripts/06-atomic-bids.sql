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
BEGIN
    -- 1. Atomically lock the room for updating to prevent concurrent identical bids
    SELECT current_bid_cr, current_highest_bidder_id
    INTO v_current_bid, v_current_team
    FROM rooms
    WHERE id = p_room_id
    FOR UPDATE;

    -- 2. Strictly validate the incoming bid is perfectly higher than the locked current bid
    IF p_bid_amount <= COALESCE(v_current_bid, 0) THEN
        RETURN FALSE; -- Blocked: Race condition defeated. Another client beat them to the exact dollar amount.
    END IF;

    -- 3. Block self-bidding (you cannot outbid yourself)
    IF v_current_team = p_team_id THEN
        RETURN FALSE;
    END IF;

    -- 4. Process the verified bid safely
    INSERT INTO bids (room_id, player_id, team_id, amount_cr)
    VALUES (p_room_id, p_player_id, p_team_id, p_bid_amount);

    UPDATE rooms
    SET current_bid_cr = p_bid_amount,
        current_highest_bidder_id = p_team_id,
        timer_ends_at = now() + interval '10 seconds'
    WHERE id = p_room_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Atomic Bid Engine RPC Mounted!' as status;
