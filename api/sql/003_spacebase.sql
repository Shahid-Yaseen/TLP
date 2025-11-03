-- Phase 2: Spacebase/TLPedia Tables
-- This migration creates tables for the Space Database (TLPedia) module

-- 2.1 Agencies
CREATE TABLE IF NOT EXISTS agencies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- NASA, SpaceX, etc.
    abbreviation TEXT,
    country TEXT,
    founded_date DATE,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    headquarters_location TEXT,
    headquarters_coordinates JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Engines
CREATE TABLE IF NOT EXISTS engines (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "RS-25", "Merlin 1D"
    manufacturer_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL,
    engine_type TEXT, -- liquid, solid, hybrid
    thrust_sea_level_kn DOUBLE PRECISION,
    thrust_vacuum_kn DOUBLE PRECISION,
    isp_sea_level DOUBLE PRECISION,
    isp_vacuum DOUBLE PRECISION,
    fuel_type TEXT,
    oxidizer_type TEXT,
    cycle_type TEXT,
    specifications JSONB,
    description TEXT,
    media JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Rocket-Engine Relationship
CREATE TABLE IF NOT EXISTS rocket_engines (
    rocket_id INTEGER REFERENCES rockets(id) ON DELETE CASCADE,
    engine_id INTEGER REFERENCES engines(id) ON DELETE CASCADE,
    stage_number INTEGER, -- 1, 2, etc.
    engine_count INTEGER,
    PRIMARY KEY (rocket_id, engine_id, stage_number)
);

-- 2.4 Spacecraft
CREATE TABLE IF NOT EXISTS spacecraft (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "Crew Dragon", "Orion"
    manufacturer_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL,
    spacecraft_type TEXT, -- capsule, station, lander, rover, etc.
    capacity_crew INTEGER,
    capacity_cargo_kg DOUBLE PRECISION,
    specifications JSONB,
    description TEXT,
    first_flight_date DATE,
    status TEXT, -- active, retired, in-development
    media JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Facilities
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL,
    facility_type TEXT, -- manufacturing, control center, museum, etc.
    location TEXT,
    coordinates JSONB, -- lat/long
    description TEXT,
    media JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Astronauts
CREATE TABLE IF NOT EXISTS astronauts (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    astronaut_number INTEGER UNIQUE, -- e.g., #629
    nationality TEXT,
    hometown TEXT,
    gender TEXT,
    age INTEGER,
    birth_date DATE,
    status TEXT, -- active, retired, deceased
    type TEXT, -- NASA, private, international, etc.
    agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL,
    profile_image_url TEXT,
    biography TEXT,
    days_in_space DOUBLE PRECISION,
    missions_count INTEGER DEFAULT 0,
    spacewalks_count INTEGER DEFAULT 0,
    achievements JSONB, -- array of achievement types
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 Astronaut-Mission Relationship
CREATE TABLE IF NOT EXISTS astronaut_missions (
    astronaut_id INTEGER REFERENCES astronauts(id) ON DELETE CASCADE,
    launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE,
    role TEXT, -- commander, pilot, specialist, etc.
    PRIMARY KEY (astronaut_id, launch_id)
);

-- 2.8 Mission Types
CREATE TABLE IF NOT EXISTS mission_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- Commercial, ISS, Lunar, Mars, etc.
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 Launch-Mission Type Relationship
ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS mission_type_id INTEGER REFERENCES mission_types(id);

