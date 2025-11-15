-- Add updated_at column to launches table for tracking sync status
-- This migration adds the updated_at column if it doesn't exist

ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to set updated_at to created_at if null
UPDATE launches 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Add index on updated_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_launches_updated_at ON launches(updated_at);

-- Ensure external_id index exists (should already exist from 009_enhanced_launch_schema.sql)
CREATE INDEX IF NOT EXISTS idx_launches_external_id ON launches(external_id);

