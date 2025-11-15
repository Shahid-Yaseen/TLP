-- Add all missing API fields as individual columns
-- This ensures we capture every field from the Space Devs API response

-- Remove raw_data column (we'll use individual columns instead)
ALTER TABLE launches DROP COLUMN IF EXISTS raw_data;

-- Add missing API fields as JSONB columns for complex objects
ALTER TABLE launches 
    -- Status object (id, name, abbrev, description)
    ADD COLUMN IF NOT EXISTS status_json JSONB,
    
    -- Image object (id, name, image_url, thumbnail_url, credit, license, etc.)
    ADD COLUMN IF NOT EXISTS image_json JSONB,
    
    -- Infographic object
    ADD COLUMN IF NOT EXISTS infographic_json JSONB,
    
    -- Probability object (if it's an object, otherwise keep integer column)
    -- Keep existing probability column, add JSONB version if needed
    
    -- Weather concerns object
    ADD COLUMN IF NOT EXISTS weather_concerns_json JSONB,
    
    -- Hashtag object
    ADD COLUMN IF NOT EXISTS hashtag_json JSONB,
    
    -- Launch service provider object (id, name, abbrev, type, url, etc.)
    ADD COLUMN IF NOT EXISTS launch_service_provider_json JSONB,
    
    -- Rocket object (id, configuration with nested families, etc.)
    ADD COLUMN IF NOT EXISTS rocket_json JSONB,
    
    -- Mission object (id, name, type, description, orbit, agencies, info_urls, vid_urls, etc.)
    ADD COLUMN IF NOT EXISTS mission_json JSONB,
    
    -- Pad object (id, url, name, active, agencies, image, description, info_url, wiki_url, map_url, latitude, longitude, country, location, map_image, total_launch_count, etc.)
    ADD COLUMN IF NOT EXISTS pad_json JSONB,
    
    -- Program array
    ADD COLUMN IF NOT EXISTS program_json JSONB;

-- Add indexes for JSONB columns that might be queried
CREATE INDEX IF NOT EXISTS idx_launches_status_json ON launches USING GIN (status_json);
CREATE INDEX IF NOT EXISTS idx_launches_provider_json ON launches USING GIN (launch_service_provider_json);
CREATE INDEX IF NOT EXISTS idx_launches_rocket_json ON launches USING GIN (rocket_json);
CREATE INDEX IF NOT EXISTS idx_launches_mission_json ON launches USING GIN (mission_json);
CREATE INDEX IF NOT EXISTS idx_launches_pad_json ON launches USING GIN (pad_json);

