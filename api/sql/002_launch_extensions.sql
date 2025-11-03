-- Phase 1: Launch Extensions
-- This migration extends the basic launch tables to support Mission Briefing features

-- 1.1 Launch Pads (within Launch Sites)
CREATE TABLE IF NOT EXISTS launch_pads (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "LC-39A"
    launch_site_id INTEGER REFERENCES launch_sites(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Payloads
CREATE TABLE IF NOT EXISTS payloads (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "23 STARLINK V2 MINI"
    customer TEXT, -- e.g., "SPACEX"
    payload_mass_kg DOUBLE PRECISION,
    payload_mass_lb DOUBLE PRECISION,
    destination_orbit TEXT, -- e.g., "LEO"
    payload_type TEXT, -- satellite, crew, cargo, etc.
    description TEXT,
    media JSONB, -- images, specs
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Launch-Payload Relationship (Many-to-Many)
CREATE TABLE IF NOT EXISTS launch_payloads (
    launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE,
    payload_id INTEGER REFERENCES payloads(id) ON DELETE CASCADE,
    PRIMARY KEY (launch_id, payload_id)
);

-- 1.4 Recovery Information
CREATE TABLE IF NOT EXISTS recoveries (
    id SERIAL PRIMARY KEY,
    launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE,
    landing_location TEXT, -- e.g., "JUST READ THE INSTRUCTIONS"
    landing_type TEXT, -- droneship, land, splashdown, none
    landing_coordinates JSONB, -- lat/long if applicable
    recovery_vessel_id INTEGER, -- references future vessels table
    success BOOLEAN,
    recovery_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Launch Windows
CREATE TABLE IF NOT EXISTS launch_windows (
    id SERIAL PRIMARY KEY,
    launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE,
    window_open TIMESTAMP WITH TIME ZONE NOT NULL,
    window_close TIMESTAMP WITH TIME ZONE,
    net_time TIMESTAMP WITH TIME ZONE, -- No Earlier Than
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Launch Hazards
CREATE TABLE IF NOT EXISTS launch_hazards (
    id SERIAL PRIMARY KEY,
    launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE,
    hazard_type TEXT, -- debris, exclusion zone, etc.
    coordinates JSONB, -- polygon coordinates for maps
    description TEXT,
    map_data JSONB, -- for Leaflet/Google Maps integration
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12.2 Extend launches table with Mission Briefing fields
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
    ADD COLUMN IF NOT EXISTS youtube_channel_id TEXT,
    ADD COLUMN IF NOT EXISTS launch_window_open TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS launch_window_close TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS mission_description TEXT;

-- Add launch pad reference to launches
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS launch_pad_id INTEGER REFERENCES launch_pads(id);

