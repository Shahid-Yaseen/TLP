-- Add raw_data column to store complete API response
-- This ensures we have the exact schema as returned from the Space Devs API

ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Add index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_launches_raw_data ON launches USING GIN (raw_data);

-- Add url column to match API response
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS url TEXT;

