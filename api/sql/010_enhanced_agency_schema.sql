-- Enhanced Agency Schema Migration
-- Adds comprehensive fields to support Launch Library API-style agency objects

-- Enhance agencies table with comprehensive fields
ALTER TABLE agencies
    ADD COLUMN IF NOT EXISTS response_mode TEXT DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS url TEXT,
    ADD COLUMN IF NOT EXISTS abbrev TEXT UNIQUE, -- abbreviation (e.g., "NASA")
    ADD COLUMN IF NOT EXISTS type_id INTEGER REFERENCES organization_types(id),
    ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS administrator TEXT,
    ADD COLUMN IF NOT EXISTS founding_year INTEGER,
    ADD COLUMN IF NOT EXISTS launchers TEXT, -- Human-readable summary
    ADD COLUMN IF NOT EXISTS spacecraft_summary TEXT, -- Human-readable summary (renamed from spacecraft to avoid conflict)
    ADD COLUMN IF NOT EXISTS parent TEXT,
    ADD COLUMN IF NOT EXISTS info_url TEXT,
    ADD COLUMN IF NOT EXISTS wiki_url TEXT;

-- Agency-Country relationship (many-to-many, as agencies can operate in multiple countries)
CREATE TABLE IF NOT EXISTS agency_countries (
    agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
    country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
    PRIMARY KEY (agency_id, country_id)
);

-- Agency Images (image, logo, social_logo)
CREATE TABLE IF NOT EXISTS agency_images (
    id SERIAL PRIMARY KEY,
    agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
    image_type TEXT NOT NULL, -- 'image', 'logo', 'social_logo'
    name TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    credit TEXT,
    license_id INTEGER REFERENCES image_licenses(id),
    single_use BOOLEAN DEFAULT false,
    variants JSONB, -- Array of image variants
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Image Variants
CREATE TABLE IF NOT EXISTS image_variants (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES agency_images(id) ON DELETE CASCADE,
    variant_type_id INTEGER,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS variant_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE -- e.g., "small", "medium", "large", "thumbnail"
);

ALTER TABLE image_variants
    ADD CONSTRAINT fk_variant_type FOREIGN KEY (variant_type_id) REFERENCES variant_types(id);

-- Social Media Links
CREATE TABLE IF NOT EXISTS social_media_platforms (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., "Twitter", "Facebook", "Instagram", "YouTube"
    url TEXT, -- Base URL for the platform
    logo_id INTEGER REFERENCES agency_images(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS agency_social_media (
    id SERIAL PRIMARY KEY,
    agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
    platform_id INTEGER REFERENCES social_media_platforms(id) ON DELETE CASCADE,
    url TEXT NOT NULL, -- Specific URL to agency's profile
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, platform_id)
);

-- Agency Statistics
ALTER TABLE agencies
    ADD COLUMN IF NOT EXISTS total_launch_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS consecutive_successful_launches INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS successful_launches INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS failed_launches INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pending_launches INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS consecutive_successful_landings INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS successful_landings INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS failed_landings INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS attempted_landings INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS successful_landings_spacecraft INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS failed_landings_spacecraft INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS attempted_landings_spacecraft INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS successful_landings_payload INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS failed_landings_payload INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS attempted_landings_payload INTEGER DEFAULT 0;

-- Launcher List (rockets/launch vehicles associated with agency)
-- This is already covered by the rockets table with provider_id/agency_id relationship
-- But we can add a view or enhance the relationship

-- Spacecraft List (spacecraft associated with agency)
-- This is already covered by the spacecraft table with manufacturer_id relationship
-- But we can enhance it

-- Update existing agencies table to use organization_types
-- Make sure abbrev is properly set (migrate from abbreviation if needed)
UPDATE agencies 
SET abbrev = abbreviation 
WHERE abbrev IS NULL AND abbreviation IS NOT NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agencies_abbrev ON agencies(abbrev);
CREATE INDEX IF NOT EXISTS idx_agencies_type_id ON agencies(type_id);
CREATE INDEX IF NOT EXISTS idx_agencies_featured ON agencies(featured);
CREATE INDEX IF NOT EXISTS idx_agency_countries_agency_id ON agency_countries(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_countries_country_id ON agency_countries(country_id);
CREATE INDEX IF NOT EXISTS idx_agency_images_agency_id ON agency_images(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_images_type ON agency_images(image_type);
CREATE INDEX IF NOT EXISTS idx_agency_social_media_agency_id ON agency_social_media(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_social_media_platform_id ON agency_social_media(platform_id);

-- Insert default variant types
INSERT INTO variant_types (name) VALUES
    ('thumbnail'),
    ('small'),
    ('medium'),
    ('large'),
    ('original')
ON CONFLICT (name) DO NOTHING;

-- Insert common social media platforms
INSERT INTO social_media_platforms (name, url) VALUES
    ('Twitter', 'https://twitter.com'),
    ('Facebook', 'https://facebook.com'),
    ('Instagram', 'https://instagram.com'),
    ('YouTube', 'https://youtube.com'),
    ('LinkedIn', 'https://linkedin.com'),
    ('TikTok', 'https://tiktok.com'),
    ('Reddit', 'https://reddit.com')
ON CONFLICT (name) DO NOTHING;

-- Note: The launcher_list and spacecraft_list are represented through:
-- - rockets table (via provider_id/agency_id relationship)
-- - spacecraft table (via manufacturer_id relationship)
-- These relationships can be queried to build the lists dynamically

