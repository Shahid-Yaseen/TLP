-- Add raw_data column to store complete API response
-- This ensures we have the exact complete response from the Space Devs API
-- This is in addition to the individual JSONB fields for easier querying

ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Add index for JSONB queries on raw_data
CREATE INDEX IF NOT EXISTS idx_launches_raw_data ON launches USING GIN (raw_data);

