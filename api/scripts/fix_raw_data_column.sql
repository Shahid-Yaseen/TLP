-- Quick fix: Add raw_data column if it doesn't exist
-- This is a standalone script to fix the missing raw_data column

-- Add raw_data column to store complete API response
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Add index for JSONB queries on raw_data (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_launches_raw_data ON launches USING GIN (raw_data);

-- Verify the column was added
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'launches' 
  AND column_name = 'raw_data';

