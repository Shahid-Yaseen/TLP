-- Ensure Launch Schema Matches Space Devs API Format
-- This migration ensures all fields from the Space Devs API are properly represented
-- Run this before syncing launches to ensure schema compatibility

-- ============================================================================
-- CORE IDENTIFIERS
-- ============================================================================

-- Ensure external_id exists and is unique
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS external_id UUID;

-- Create unique index if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_launches_external_id_unique 
    ON launches(external_id) 
    WHERE external_id IS NOT NULL;

-- Ensure slug exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS slug TEXT;

-- Ensure launch_designator exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS launch_designator TEXT;

-- ============================================================================
-- TIMING FIELDS
-- ============================================================================

-- Ensure launch_date exists (should already exist)
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS launch_date TIMESTAMP WITH TIME ZONE;

-- Ensure window fields exist
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS window_start TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS window_end TIMESTAMPTZ;

-- Ensure net_precision exists (JSONB)
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS net_precision JSONB;

-- ============================================================================
-- STATUS AND OUTCOME
-- ============================================================================

-- Ensure status_id exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS status_id INTEGER REFERENCES launch_statuses(id);

-- Ensure outcome exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS outcome TEXT;

-- ============================================================================
-- DESCRIPTIONS AND DETAILS
-- ============================================================================

-- Ensure details exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS details TEXT;

-- Ensure mission_description exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS mission_description TEXT;

-- ============================================================================
-- MEDIA FIELDS
-- ============================================================================

-- Ensure media exists (JSONB)
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS media JSONB;

-- Ensure YouTube fields exist
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
    ADD COLUMN IF NOT EXISTS youtube_channel_id TEXT;

-- ============================================================================
-- FLAGS AND BOOLEANS
-- ============================================================================

-- Ensure is_featured exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Ensure webcast_live exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS webcast_live BOOLEAN DEFAULT false;

-- ============================================================================
-- PROBABILITY AND WEATHER
-- ============================================================================

-- Ensure probability exists (can be integer or null)
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS probability INTEGER;

-- Ensure weather_concerns exists (text version)
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS weather_concerns TEXT;

-- Ensure failreason exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS failreason TEXT;

-- Ensure hashtag exists (text version)
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS hashtag TEXT;

-- ============================================================================
-- URLS
-- ============================================================================

-- Ensure url exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS url TEXT;

-- Ensure flightclub_url exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS flightclub_url TEXT;

-- ============================================================================
-- METADATA
-- ============================================================================

-- Ensure response_mode exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS response_mode TEXT DEFAULT 'normal';

-- Ensure pad_turnaround exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS pad_turnaround TEXT;

-- ============================================================================
-- LAUNCH ATTEMPT COUNTS
-- ============================================================================

-- Ensure all launch attempt count fields exist
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS orbital_launch_attempt_count INTEGER,
    ADD COLUMN IF NOT EXISTS location_launch_attempt_count INTEGER,
    ADD COLUMN IF NOT EXISTS pad_launch_attempt_count INTEGER,
    ADD COLUMN IF NOT EXISTS agency_launch_attempt_count INTEGER,
    ADD COLUMN IF NOT EXISTS orbital_launch_attempt_count_year INTEGER,
    ADD COLUMN IF NOT EXISTS location_launch_attempt_count_year INTEGER,
    ADD COLUMN IF NOT EXISTS pad_launch_attempt_count_year INTEGER,
    ADD COLUMN IF NOT EXISTS agency_launch_attempt_count_year INTEGER;

-- ============================================================================
-- JSONB FIELDS FOR COMPLEX OBJECTS
-- ============================================================================

-- Ensure all JSONB fields exist
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS status_json JSONB,
    ADD COLUMN IF NOT EXISTS image_json JSONB,
    ADD COLUMN IF NOT EXISTS infographic_json JSONB,
    ADD COLUMN IF NOT EXISTS weather_concerns_json JSONB,
    ADD COLUMN IF NOT EXISTS hashtag_json JSONB,
    ADD COLUMN IF NOT EXISTS launch_service_provider_json JSONB,
    ADD COLUMN IF NOT EXISTS rocket_json JSONB,
    ADD COLUMN IF NOT EXISTS mission_json JSONB,
    ADD COLUMN IF NOT EXISTS pad_json JSONB,
    ADD COLUMN IF NOT EXISTS program_json JSONB;

-- ============================================================================
-- TIMESTAMPS
-- ============================================================================

-- Ensure created_at exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure updated_at exists
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to set updated_at if null
UPDATE launches 
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- ============================================================================
-- FOREIGN KEY RELATIONSHIPS
-- ============================================================================

-- Ensure all foreign key columns exist
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS provider_id INTEGER REFERENCES providers(id),
    ADD COLUMN IF NOT EXISTS rocket_id INTEGER REFERENCES rockets(id),
    ADD COLUMN IF NOT EXISTS site_id INTEGER REFERENCES launch_sites(id),
    ADD COLUMN IF NOT EXISTS launch_pad_id INTEGER REFERENCES launch_pads(id),
    ADD COLUMN IF NOT EXISTS orbit_id INTEGER REFERENCES orbits(id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on external_id (should already exist, but ensure it)
CREATE INDEX IF NOT EXISTS idx_launches_external_id ON launches(external_id) 
    WHERE external_id IS NOT NULL;

-- Index on updated_at for cache checking
CREATE INDEX IF NOT EXISTS idx_launches_updated_at ON launches(updated_at);

-- Index on launch_date for queries
CREATE INDEX IF NOT EXISTS idx_launches_launch_date ON launches(launch_date);

-- Index on slug for lookups
CREATE INDEX IF NOT EXISTS idx_launches_slug ON launches(slug) 
    WHERE slug IS NOT NULL;

-- Index on status_id for filtering
CREATE INDEX IF NOT EXISTS idx_launches_status_id ON launches(status_id) 
    WHERE status_id IS NOT NULL;

-- GIN indexes for JSONB columns (for efficient JSON queries)
CREATE INDEX IF NOT EXISTS idx_launches_status_json ON launches USING GIN (status_json) 
    WHERE status_json IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_launches_provider_json ON launches USING GIN (launch_service_provider_json) 
    WHERE launch_service_provider_json IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_launches_rocket_json ON launches USING GIN (rocket_json) 
    WHERE rocket_json IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_launches_mission_json ON launches USING GIN (mission_json) 
    WHERE mission_json IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_launches_pad_json ON launches USING GIN (pad_json) 
    WHERE pad_json IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify critical fields exist (this will error if something is wrong)
DO $$
BEGIN
    -- Check that external_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'launches' AND column_name = 'external_id'
    ) THEN
        RAISE EXCEPTION 'external_id column missing';
    END IF;

    -- Check that updated_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'launches' AND column_name = 'updated_at'
    ) THEN
        RAISE EXCEPTION 'updated_at column missing';
    END IF;

    RAISE NOTICE 'Schema verification passed - all required fields exist';
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN launches.external_id IS 'UUID from Space Devs API (unique identifier)';
COMMENT ON COLUMN launches.updated_at IS 'Last update timestamp from API, used for cache invalidation';
COMMENT ON COLUMN launches.status_json IS 'Complete status object from API (id, name, abbrev, description)';
COMMENT ON COLUMN launches.rocket_json IS 'Complete rocket object from API with nested configuration';
COMMENT ON COLUMN launches.mission_json IS 'Complete mission object from API with orbit, agencies, etc.';
COMMENT ON COLUMN launches.pad_json IS 'Complete pad object from API with location, coordinates, etc.';

