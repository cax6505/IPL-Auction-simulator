-- scripts/13-add-is-private.sql
-- Run this in your Supabase SQL Editor.
-- Adds the is_private column to the rooms table to support room visibility filtering.

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Allow Realtime publication to pick up the new column automatically
SELECT 'Private visibility column added successfully!' as status;
