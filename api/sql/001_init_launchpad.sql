-- Providers: NASA, SpaceX, etc.
CREATE TABLE IF NOT EXISTS providers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Rockets: (e.g., Falcon 9)
CREATE TABLE IF NOT EXISTS rockets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    spec JSONB -- freeform rocket specs
);

-- Launch sites: Cape Canaveral, Baikonur, etc.
CREATE TABLE IF NOT EXISTS launch_sites (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- Orbit types: LEO, GEO, SSO, etc.
CREATE TABLE IF NOT EXISTS orbits (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE, -- e.g., LEO, GEO, SSO
    description TEXT
);

-- Launches: Main event table
CREATE TABLE IF NOT EXISTS launches (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    launch_date TIMESTAMP WITH TIME ZONE NOT NULL,
    provider_id INTEGER REFERENCES providers(id),
    rocket_id INTEGER REFERENCES rockets(id),
    site_id INTEGER REFERENCES launch_sites(id),
    orbit_id INTEGER REFERENCES orbits(id),
    outcome TEXT,  -- success, failure, partial, TBD
    details TEXT,  -- freeform description
    media JSONB,   -- links to photos, presskits, videos
    created_at TIMESTAMPTZ DEFAULT NOW() -- audit
);
