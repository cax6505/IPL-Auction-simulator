-- scripts/05-add-timer.sql
-- Run this in your Supabase SQL Editor.
-- Adds the server-side timestamp to synchronize countdown clocks.

ALTER TABLE rooms ADD COLUMN timer_ends_at TIMESTAMPTZ;

-- Allow Realtime publication to pick up the new column automatically
SELECT 'Timer column added successfully!' as status;
