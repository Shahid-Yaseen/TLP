-- Enhanced Launch Schema Migration
-- Adds fields to support comprehensive Launch Library API-style launch objects

-- Add UUID support for external API compatibility
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS external_id UUID UNIQUE,
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS launch_designator TEXT, -- International designator (e.g., "1957-001")
    ADD COLUMN IF NOT EXISTS response_mode TEXT DEFAULT 'normal';

-- Enhanced status information
CREATE TABLE IF NOT EXISTS launch_statuses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., "Launch Successful", "Launch Failure"
    abbrev TEXT NOT NULL UNIQUE, -- e.g., "Success", "Failure"
    description TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Update launches table to reference status
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS status_id INTEGER REFERENCES launch_statuses(id);

-- Enhanced timing information
ALTER TABLE launches
    ADD COLUMN IF NOT EXISTS net_precision JSONB, -- Precision information for NET time
    ADD COLUMN IF NOT EXISTS window_start TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS window_end TIMESTAMPTZ;

-- Image support
CREATE TABLE IF NOT EXISTS launch_images (
    id SERIAL PRIMARY KEY,
    launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE,
    name TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    credit TEXT,
    license_id INTEGER,
    single_use BOOLEAN DEFAULT false,
    variants JSONB, -- Array of image variants
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_licenses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    priority INTEGER DEFAULT 0,
    link TEXT,
    single_use BOOLEAN DEFAULT false
);

ALTER TABLE launch_images
    ADD CONSTRAINT fk_license FOREIGN KEY (license_id) REFERENCES image_licenses(id);

-- Additional launch metadata
ALTER TABLE launches
    ADD COLUMN IF NOT EXISTS infographic_url TEXT,
    ADD COLUMN IF NOT EXISTS probability INTEGER, -- Launch success probability (0-100)
    ADD COLUMN IF NOT EXISTS weather_concerns TEXT,
    ADD COLUMN IF NOT EXISTS failreason TEXT,
    ADD COLUMN IF NOT EXISTS hashtag TEXT,
    ADD COLUMN IF NOT EXISTS webcast_live BOOLEAN DEFAULT false;

-- Enhanced mission information
ALTER TABLE launches
    ADD COLUMN IF NOT EXISTS mission_image_url TEXT,
    ADD COLUMN IF NOT EXISTS mission_info_urls JSONB, -- Array of URLs
    ADD COLUMN IF NOT EXISTS mission_vid_urls JSONB; -- Array of video URLs

-- Celestial bodies for orbits
CREATE TABLE IF NOT EXISTS celestial_bodies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., "Earth", "Moon", "Mars"
    response_mode TEXT DEFAULT 'normal'
);

-- Update orbits to reference celestial body
ALTER TABLE orbits
    ADD COLUMN IF NOT EXISTS celestial_body_id INTEGER REFERENCES celestial_bodies(id);

-- Enhanced location/pad information
ALTER TABLE launch_pads
    ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS info_url TEXT,
    ADD COLUMN IF NOT EXISTS wiki_url TEXT,
    ADD COLUMN IF NOT EXISTS map_url TEXT,
    ADD COLUMN IF NOT EXISTS total_launch_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS orbital_launch_attempt_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fastest_turnaround TEXT;

-- Countries table for better location data
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    alpha_2_code TEXT UNIQUE, -- ISO 3166-1 alpha-2 (e.g., "US")
    alpha_3_code TEXT UNIQUE, -- ISO 3166-1 alpha-3 (e.g., "USA")
    nationality_name TEXT,
    nationality_name_composed TEXT,
    map_image TEXT
);

-- Update launch_sites to reference country
ALTER TABLE launch_sites
    ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id),
    ADD COLUMN IF NOT EXISTS timezone_name TEXT,
    ADD COLUMN IF NOT EXISTS total_launch_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS orbital_launch_attempt_count INTEGER DEFAULT 0;

-- Programs (e.g., Apollo, ISS, Artemis)
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    info_url TEXT,
    wiki_url TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Launch-Program relationship (many-to-many)
CREATE TABLE IF NOT EXISTS launch_programs (
    launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
    PRIMARY KEY (launch_id, program_id)
);

-- Launch attempt counters
ALTER TABLE launches
    ADD COLUMN IF NOT EXISTS orbital_launch_attempt_count INTEGER,
    ADD COLUMN IF NOT EXISTS location_launch_attempt_count INTEGER,
    ADD COLUMN IF NOT EXISTS pad_launch_attempt_count INTEGER,
    ADD COLUMN IF NOT EXISTS agency_launch_attempt_count INTEGER,
    ADD COLUMN IF NOT EXISTS orbital_launch_attempt_count_year INTEGER,
    ADD COLUMN IF NOT EXISTS location_launch_attempt_count_year INTEGER,
    ADD COLUMN IF NOT EXISTS pad_launch_attempt_count_year INTEGER,
    ADD COLUMN IF NOT EXISTS agency_launch_attempt_count_year INTEGER;

-- Enhanced provider/agency information
ALTER TABLE providers
    ADD COLUMN IF NOT EXISTS abbrev TEXT,
    ADD COLUMN IF NOT EXISTS type_id INTEGER,
    ADD COLUMN IF NOT EXISTS url TEXT;

CREATE TABLE IF NOT EXISTS organization_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE -- e.g., "Government", "Commercial"
);

ALTER TABLE providers
    ADD CONSTRAINT fk_org_type FOREIGN KEY (type_id) REFERENCES organization_types(id);

-- Rocket families and configurations
CREATE TABLE IF NOT EXISTS rocket_families (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., "Falcon", "Sputnik"
    full_name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rocket_configurations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "Falcon 9 Block 5"
    full_name TEXT,
    variant TEXT,
    family_id INTEGER REFERENCES rocket_families(id),
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update rockets to reference configuration
ALTER TABLE rockets
    ADD COLUMN IF NOT EXISTS configuration_id INTEGER REFERENCES rocket_configurations(id);

-- Rocket-Family relationship (many-to-many)
CREATE TABLE IF NOT EXISTS rocket_configuration_families (
    configuration_id INTEGER REFERENCES rocket_configurations(id) ON DELETE CASCADE,
    family_id INTEGER REFERENCES rocket_families(id) ON DELETE CASCADE,
    PRIMARY KEY (configuration_id, family_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_launches_external_id ON launches(external_id);
CREATE INDEX IF NOT EXISTS idx_launches_slug ON launches(slug);
CREATE INDEX IF NOT EXISTS idx_launches_status_id ON launches(status_id);
CREATE INDEX IF NOT EXISTS idx_launches_net ON launches(launch_date);
CREATE INDEX IF NOT EXISTS idx_launch_images_launch_id ON launch_images(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_pads_site_id ON launch_pads(launch_site_id);
CREATE INDEX IF NOT EXISTS idx_launch_sites_country_id ON launch_sites(country_id);

-- Insert default celestial body (Earth)
INSERT INTO celestial_bodies (name) VALUES ('Earth') ON CONFLICT (name) DO NOTHING;

-- Insert default organization types
INSERT INTO organization_types (name) VALUES 
    ('Government'),
    ('Commercial'),
    ('Non-Profit'),
    ('International')
ON CONFLICT (name) DO NOTHING;

-- Insert default launch statuses
INSERT INTO launch_statuses (name, abbrev, description) VALUES
    ('Launch Successful', 'Success', 'The launch was successful'),
    ('Launch Failure', 'Failure', 'The launch failed'),
    ('Partial Failure', 'Partial', 'The launch had a partial failure'),
    ('On Hold', 'Hold', 'The launch is on hold'),
    ('Go', 'Go', 'The launch is a go'),
    ('To Be Determined', 'TBD', 'The launch status is to be determined')
ON CONFLICT (name) DO NOTHING;

