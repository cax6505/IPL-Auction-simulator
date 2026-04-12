-- Add auction_mode column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS auction_mode VARCHAR(50) DEFAULT 'mega_auction';

SELECT 'auction_mode column added successfully!' as status;
