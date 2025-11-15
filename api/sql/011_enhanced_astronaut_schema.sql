-- Enhanced Astronaut Schema Migration
-- Adds comprehensive fields to support Launch Library API-style astronaut objects

-- Astronaut Status table
CREATE TABLE IF NOT EXISTS astronaut_statuses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., "Active", "Retired", "Deceased"
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Astronaut Types table
CREATE TABLE IF NOT EXISTS astronaut_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., "Government", "Commercial", "International"
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhance astronauts table
ALTER TABLE astronauts
    ADD COLUMN IF NOT EXISTS url TEXT,
    ADD COLUMN IF NOT EXISTS response_mode TEXT DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS status_id INTEGER REFERENCES astronaut_statuses(id),
    ADD COLUMN IF NOT EXISTS type_id INTEGER REFERENCES astronaut_types(id),
    ADD COLUMN IF NOT EXISTS in_space BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS time_in_space TEXT, -- Duration format (e.g., "P374DT11H19M23S")
    ADD COLUMN IF NOT EXISTS eva_time TEXT, -- Duration format for spacewalks
    ADD COLUMN IF NOT EXISTS date_of_death DATE,
    ADD COLUMN IF NOT EXISTS wiki_url TEXT,
    ADD COLUMN IF NOT EXISTS last_flight TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS first_flight TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS flights_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS landings_count INTEGER DEFAULT 0;

-- Update existing status to status_id (migrate text to reference table)
-- This will be done after inserting default statuses

-- Astronaut-Nationality relationship (many-to-many)
CREATE TABLE IF NOT EXISTS astronaut_nationalities (
    astronaut_id INTEGER REFERENCES astronauts(id) ON DELETE CASCADE,
    country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
    PRIMARY KEY (astronaut_id, country_id)
);

-- Astronaut Images
CREATE TABLE IF NOT EXISTS astronaut_images (
    id SERIAL PRIMARY KEY,
    astronaut_id INTEGER REFERENCES astronauts(id) ON DELETE CASCADE,
    image_type TEXT NOT NULL DEFAULT 'portrait', -- 'portrait', 'official', etc.
    name TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    credit TEXT,
    license_id INTEGER REFERENCES image_licenses(id),
    single_use BOOLEAN DEFAULT false,
    variants JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Astronaut Social Media Links
CREATE TABLE IF NOT EXISTS astronaut_social_media (
    id SERIAL PRIMARY KEY,
    astronaut_id INTEGER REFERENCES astronauts(id) ON DELETE CASCADE,
    platform_id INTEGER REFERENCES social_media_platforms(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(astronaut_id, platform_id)
);

-- Landings table (mission end/landing events)
CREATE TABLE IF NOT EXISTS landings (
    id SERIAL PRIMARY KEY,
    url TEXT,
    destination TEXT, -- e.g., "International Space Station", "Moon", "Mars"
    mission_end TIMESTAMPTZ NOT NULL,
    spacecraft_id INTEGER REFERENCES spacecraft(id) ON DELETE SET NULL,
    launch_id INTEGER REFERENCES launches(id) ON DELETE SET NULL,
    landing_id INTEGER, -- References landing details
    duration TEXT, -- Mission duration
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landing Details
CREATE TABLE IF NOT EXISTS landing_details (
    id SERIAL PRIMARY KEY,
    attempt BOOLEAN DEFAULT true,
    success BOOLEAN,
    description TEXT,
    landing_location_id INTEGER,
    landing_type_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landing Locations
CREATE TABLE IF NOT EXISTS landing_locations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    coordinates JSONB, -- lat/long
    country_id INTEGER REFERENCES countries(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landing Types
CREATE TABLE IF NOT EXISTS landing_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., "Splashdown", "Land Landing", "Runway Landing"
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE landing_details
    ADD CONSTRAINT fk_landing_location FOREIGN KEY (landing_location_id) REFERENCES landing_locations(id),
    ADD CONSTRAINT fk_landing_type FOREIGN KEY (landing_type_id) REFERENCES landing_types(id);

ALTER TABLE landings
    ADD CONSTRAINT fk_landing_detail FOREIGN KEY (landing_id) REFERENCES landing_details(id);

-- Astronaut-Landing relationship
CREATE TABLE IF NOT EXISTS astronaut_landings (
    astronaut_id INTEGER REFERENCES astronauts(id) ON DELETE CASCADE,
    landing_id INTEGER REFERENCES landings(id) ON DELETE CASCADE,
    PRIMARY KEY (astronaut_id, landing_id)
);

-- Spacewalks (EVAs)
CREATE TABLE IF NOT EXISTS spacewalks (
    id SERIAL PRIMARY KEY,
    url TEXT,
    name TEXT NOT NULL, -- e.g., "EVA-1", "ISS EVA 85"
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration TEXT, -- Duration format
    location TEXT, -- e.g., "International Space Station"
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spacewalk Crew (many-to-many)
CREATE TABLE IF NOT EXISTS spacewalk_crew (
    id SERIAL PRIMARY KEY,
    spacewalk_id INTEGER REFERENCES spacewalks(id) ON DELETE CASCADE,
    astronaut_id INTEGER REFERENCES astronauts(id) ON DELETE CASCADE,
    role_id INTEGER, -- References spacewalk roles
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(spacewalk_id, astronaut_id)
);

-- Spacewalk Roles
CREATE TABLE IF NOT EXISTS spacewalk_roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., "Lead", "Support", "Backup"
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE spacewalk_crew
    ADD CONSTRAINT fk_spacewalk_role FOREIGN KEY (role_id) REFERENCES spacewalk_roles(id);

-- Enhance astronaut_missions to include more details
ALTER TABLE astronaut_missions
    ADD COLUMN IF NOT EXISTS role_id INTEGER,
    ADD COLUMN IF NOT EXISTS flight_number INTEGER; -- Sequential flight number for this astronaut

-- Mission Roles (more detailed than just text)
CREATE TABLE IF NOT EXISTS mission_roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., "Commander", "Pilot", "Mission Specialist", "Payload Specialist"
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE astronaut_missions
    ADD CONSTRAINT fk_mission_role FOREIGN KEY (role_id) REFERENCES mission_roles(id);

-- Update astronauts table: migrate status from text to status_id
-- This will be done after inserting default statuses

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_astronauts_status_id ON astronauts(status_id);
CREATE INDEX IF NOT EXISTS idx_astronauts_type_id ON astronauts(type_id);
CREATE INDEX IF NOT EXISTS idx_astronauts_in_space ON astronauts(in_space);
CREATE INDEX IF NOT EXISTS idx_astronauts_agency_id ON astronauts(agency_id);
CREATE INDEX IF NOT EXISTS idx_astronaut_nationalities_astronaut ON astronaut_nationalities(astronaut_id);
CREATE INDEX IF NOT EXISTS idx_astronaut_nationalities_country ON astronaut_nationalities(country_id);
CREATE INDEX IF NOT EXISTS idx_astronaut_images_astronaut ON astronaut_images(astronaut_id);
CREATE INDEX IF NOT EXISTS idx_astronaut_social_media_astronaut ON astronaut_social_media(astronaut_id);
CREATE INDEX IF NOT EXISTS idx_landings_spacecraft ON landings(spacecraft_id);
CREATE INDEX IF NOT EXISTS idx_landings_launch ON landings(launch_id);
CREATE INDEX IF NOT EXISTS idx_astronaut_landings_astronaut ON astronaut_landings(astronaut_id);
CREATE INDEX IF NOT EXISTS idx_astronaut_landings_landing ON astronaut_landings(landing_id);
CREATE INDEX IF NOT EXISTS idx_spacewalks_start ON spacewalks(start_time);
CREATE INDEX IF NOT EXISTS idx_spacewalk_crew_spacewalk ON spacewalk_crew(spacewalk_id);
CREATE INDEX IF NOT EXISTS idx_spacewalk_crew_astronaut ON spacewalk_crew(astronaut_id);
CREATE INDEX IF NOT EXISTS idx_astronaut_missions_role ON astronaut_missions(role_id);

-- Insert default astronaut statuses
INSERT INTO astronaut_statuses (name, description) VALUES
    ('Active', 'Currently active astronaut'),
    ('Retired', 'Retired from active service'),
    ('Deceased', 'Deceased astronaut'),
    ('In Training', 'Currently in astronaut training'),
    ('On Leave', 'On leave from active duty')
ON CONFLICT (name) DO NOTHING;

-- Insert default astronaut types
INSERT INTO astronaut_types (name, description) VALUES
    ('Government', 'Government space agency astronaut'),
    ('Commercial', 'Commercial space company astronaut'),
    ('International', 'International space agency astronaut'),
    ('Military', 'Military astronaut'),
    ('Civilian', 'Civilian astronaut')
ON CONFLICT (name) DO NOTHING;

-- Insert default landing types
INSERT INTO landing_types (name, description) VALUES
    ('Splashdown', 'Water landing/splashdown'),
    ('Land Landing', 'Land-based landing'),
    ('Runway Landing', 'Runway landing (e.g., Space Shuttle)'),
    ('Parachute Landing', 'Parachute-assisted landing'),
    ('Precision Landing', 'Precision landing (e.g., SpaceX droneship)')
ON CONFLICT (name) DO NOTHING;

-- Insert default spacewalk roles
INSERT INTO spacewalk_roles (name, description) VALUES
    ('Lead', 'Lead spacewalker'),
    ('Support', 'Supporting spacewalker'),
    ('Backup', 'Backup spacewalker'),
    ('Solo', 'Solo spacewalker')
ON CONFLICT (name) DO NOTHING;

-- Insert default mission roles
INSERT INTO mission_roles (name, description) VALUES
    ('Commander', 'Mission commander'),
    ('Pilot', 'Pilot'),
    ('Mission Specialist', 'Mission specialist'),
    ('Payload Specialist', 'Payload specialist'),
    ('Flight Engineer', 'Flight engineer'),
    ('Science Officer', 'Science officer'),
    ('Medical Officer', 'Medical officer')
ON CONFLICT (name) DO NOTHING;

-- Migrate existing status text to status_id (if possible)
-- This is a best-effort migration - some statuses may not match
UPDATE astronauts a
SET status_id = (
    SELECT id FROM astronaut_statuses 
    WHERE LOWER(name) = LOWER(a.status)
    LIMIT 1
)
WHERE status_id IS NULL AND status IS NOT NULL;

-- Migrate existing type text to type_id (if possible)
UPDATE astronauts a
SET type_id = (
    SELECT id FROM astronaut_types 
    WHERE LOWER(name) = LOWER(a.type)
    LIMIT 1
)
WHERE type_id IS NULL AND type IS NOT NULL;

-- Update full_name to name if needed (for consistency with API schema)
-- Note: We'll keep full_name for backward compatibility, but can add name as alias
ALTER TABLE astronauts
    ADD COLUMN IF NOT EXISTS name TEXT;

-- Populate name from full_name if name is null
UPDATE astronauts
SET name = full_name
WHERE name IS NULL AND full_name IS NOT NULL;

-- Update biography to bio (for API consistency)
ALTER TABLE astronauts
    ADD COLUMN IF NOT EXISTS bio TEXT;

-- Populate bio from biography if bio is null
UPDATE astronauts
SET bio = biography
WHERE bio IS NULL AND biography IS NOT NULL;

-- Update days_in_space to time_in_space format if needed
-- Note: days_in_space is numeric, time_in_space is duration string
-- We'll keep both for now, but time_in_space should be used for API responses

