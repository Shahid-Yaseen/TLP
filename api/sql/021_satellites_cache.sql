-- Migration 021: Satellites Cache Table
-- Creates table for caching satellite data from CelesTrak

CREATE TABLE IF NOT EXISTS satellites_cache (
    norad_id INTEGER PRIMARY KEY,
    name TEXT,
    international_designator TEXT,
    object_type TEXT, -- SATELLITE, DEBRIS, ROCKET_BODY, etc.
    country TEXT,
    constellation TEXT, -- STARLINK, GPS, ONEWEB, etc.
    tle_line1 TEXT NOT NULL,
    tle_line2 TEXT NOT NULL,
    orbital_data JSONB, -- {apogee, perigee, inclination, period, eccentricity, etc.}
    status TEXT, -- ACTIVE, INACTIVE, DEBRIS, OTHER
    launch_date DATE,
    rocket_name TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_satellites_object_type ON satellites_cache(object_type);
CREATE INDEX IF NOT EXISTS idx_satellites_constellation ON satellites_cache(constellation);
CREATE INDEX IF NOT EXISTS idx_satellites_status ON satellites_cache(status);
CREATE INDEX IF NOT EXISTS idx_satellites_country ON satellites_cache(country);
CREATE INDEX IF NOT EXISTS idx_satellites_name ON satellites_cache(name);
CREATE INDEX IF NOT EXISTS idx_satellites_international_designator ON satellites_cache(international_designator);
CREATE INDEX IF NOT EXISTS idx_satellites_last_updated ON satellites_cache(last_updated);

-- GIN index for JSONB orbital_data queries
CREATE INDEX IF NOT EXISTS idx_satellites_orbital_data ON satellites_cache USING GIN(orbital_data);

COMMENT ON TABLE satellites_cache IS 'Cached satellite data from CelesTrak API';
COMMENT ON COLUMN satellites_cache.norad_id IS 'NORAD catalog number (primary key)';
COMMENT ON COLUMN satellites_cache.orbital_data IS 'JSONB containing calculated orbital parameters: apogee, perigee, inclination, period, etc.';

