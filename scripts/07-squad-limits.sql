-- 07-squad-limits.sql
-- Add tracking metrics securely to the Real-Time Franchises table to enforce Math Validations in React.

ALTER TABLE room_franchises ADD COLUMN IF NOT EXISTS squad_count INTEGER DEFAULT 0;
ALTER TABLE room_franchises ADD COLUMN IF NOT EXISTS overseas_count INTEGER DEFAULT 0;

SELECT 'Squad Limit columns successfully applied!' as status;
