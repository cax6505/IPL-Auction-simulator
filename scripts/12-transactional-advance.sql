-- 12-transactional-advance.sql
-- Server-side transactional auction advancement.
-- Eliminates client-side race conditions and host-dependency.
-- Any connected peer can call this RPC when the timer expires.

CREATE OR REPLACE FUNCTION advance_auction(
    p_room_id UUID,
    p_expected_player_id VARCHAR DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_room RECORD;
    v_final_bid NUMERIC;
    v_winner_id VARCHAR;
    v_current_pid VARCHAR;
    v_is_overseas BOOLEAN;
    v_winner RECORD;
    v_new_purse NUMERIC;
    v_new_squad INT;
    v_new_os INT;
    v_next_player RECORD;
    v_td INT;
    v_new_timer TIMESTAMPTZ;
    v_sold_ids VARCHAR[];
BEGIN
    -- 1. Lock the room row for atomic update
    SELECT * INTO v_room
    FROM rooms
    WHERE id = p_room_id
    FOR UPDATE;

    IF v_room IS NULL THEN
        RETURN json_build_object('ok', false, 'reason', 'room_not_found');
    END IF;

    -- Guard: if a specific player was expected, make sure it still matches
    -- (prevents double-advance if two clients race)
    IF p_expected_player_id IS NOT NULL AND v_room.current_player_id != p_expected_player_id THEN
        RETURN json_build_object('ok', false, 'reason', 'already_advanced');
    END IF;

    v_final_bid   := COALESCE(v_room.current_bid_cr, 0);
    v_winner_id   := v_room.current_highest_bidder_id;
    v_current_pid := v_room.current_player_id;

    -- 2. Process sale if there was a winning bid
    IF v_final_bid > 0 AND v_winner_id IS NOT NULL AND v_current_pid IS NOT NULL THEN
        -- Get overseas status
        SELECT is_overseas INTO v_is_overseas
        FROM players
        WHERE id = v_current_pid;

        v_is_overseas := COALESCE(v_is_overseas, false);

        -- Get current winner franchise record
        SELECT * INTO v_winner
        FROM room_franchises
        WHERE room_id = p_room_id AND team_id = v_winner_id
        FOR UPDATE;

        IF v_winner IS NOT NULL THEN
            v_new_purse := ROUND((COALESCE(v_winner.purse_remaining_cr, 120.0) - v_final_bid)::numeric, 2);
            v_new_squad := COALESCE(v_winner.squad_count, 0) + 1;
            v_new_os    := COALESCE(v_winner.overseas_count, 0) + (CASE WHEN v_is_overseas THEN 1 ELSE 0 END);

            UPDATE room_franchises
            SET purse_remaining_cr = v_new_purse,
                squad_count        = v_new_squad,
                overseas_count     = v_new_os
            WHERE room_id = p_room_id AND team_id = v_winner_id;

            INSERT INTO room_sold_players (room_id, player_id, team_id, sold_price_cr, is_overseas)
            VALUES (p_room_id, v_current_pid, v_winner_id, v_final_bid, v_is_overseas)
            ON CONFLICT (room_id, player_id) DO NOTHING;
        END IF;
    END IF;

    -- 3. Gather all sold player IDs to skip them
    SELECT array_agg(player_id) INTO v_sold_ids
    FROM room_sold_players
    WHERE room_id = p_room_id;

    v_sold_ids := COALESCE(v_sold_ids, ARRAY[]::VARCHAR[]);

    -- 4. Find the next unsold player (ordered by base_price desc, id asc)
    SELECT id INTO v_next_player
    FROM players
    WHERE id != ALL(v_sold_ids)
      AND id != COALESCE(v_current_pid, '')
    ORDER BY base_price_cr DESC NULLS LAST, id ASC
    LIMIT 1;

    -- 5. Advance or complete
    v_td := COALESCE(v_room.timer_duration, 10);

    IF v_next_player.id IS NOT NULL THEN
        v_new_timer := now() + (v_td || ' seconds')::interval;

        UPDATE rooms
        SET current_player_id           = v_next_player.id,
            current_bid_cr              = 0,
            current_highest_bidder_id   = NULL,
            status                      = 'active',
            timer_ends_at               = v_new_timer
        WHERE id = p_room_id;

        RETURN json_build_object(
            'ok', true,
            'action', 'advanced',
            'next_player_id', v_next_player.id,
            'sold_to', v_winner_id,
            'sold_price', v_final_bid
        );
    ELSE
        UPDATE rooms
        SET status = 'completed',
            timer_ends_at = NULL
        WHERE id = p_room_id;

        RETURN json_build_object(
            'ok', true,
            'action', 'completed',
            'sold_to', v_winner_id,
            'sold_price', v_final_bid
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Transactional Advance RPC mounted!' AS status;
