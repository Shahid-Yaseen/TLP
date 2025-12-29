-- Migration 023: Add Author Support to Launches
-- This migration adds author_id column to launches table to allow assigning authors to launches

-- Add author_id column to launches table
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL;

-- Create index for author_id lookups
CREATE INDEX IF NOT EXISTS idx_launches_author ON launches(author_id);

-- Add comment for documentation
COMMENT ON COLUMN launches.author_id IS 'Reference to author/journalist who wrote about or is covering this launch';

