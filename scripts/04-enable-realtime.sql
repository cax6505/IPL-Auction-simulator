-- scripts/04-enable-realtime.sql
-- Enables Supabase WebSockets mapping for the Live Auction updates

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_franchises;
ALTER PUBLICATION supabase_realtime ADD TABLE bids;

SELECT 'Real-Time WebSockets Enabled successfully!' as status;
