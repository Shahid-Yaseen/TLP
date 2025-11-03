-- Phase 5: Supporting Features
-- This migration creates tables for events, crew management, live streams, satellites, statistics, and featured content

-- 5.1 Events (Separate from Launches)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "Crew 12 Launch", "Artemis 3 Landing"
    event_type TEXT, -- launch, landing, conference, milestone, etc.
    status TEXT, -- TBD, confirmed, cancelled, completed, never
    event_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    description TEXT,
    related_launch_id INTEGER REFERENCES launches(id) ON DELETE SET NULL,
    media JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.1 Crew Members (About Us / Crew Management)
CREATE TABLE IF NOT EXISTS crew_members (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    location TEXT, -- e.g., "SPACE COAST, FL"
    category TEXT, -- ADVISOR, PRODUCTION, JOURNALIST, SPACE HISTORY WRITER, ROCKETCHASER, MODERATOR
    title TEXT,
    bio TEXT,
    profile_image_url TEXT,
    coordinates JSONB, -- lat/long for map display
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Crew Locations (for map pins)
CREATE TABLE IF NOT EXISTS crew_locations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "TLP NETWORK HQ", "TLP SPACE COAST"
    location_type TEXT, -- HQ, regional office, etc.
    coordinates JSONB NOT NULL, -- lat/long
    country TEXT,
    is_headquarters BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.1 Live Streams
CREATE TABLE IF NOT EXISTS live_streams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL, -- "Starbase Now", "ISS Now", "Space Coast East"
    youtube_channel_id TEXT,
    youtube_video_id TEXT,
    stream_url TEXT,
    is_live BOOLEAN DEFAULT false,
    status TEXT, -- live, offline, coming_soon
    description TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9.1 Satellites (Earth Navigator)
CREATE TABLE IF NOT EXISTS satellites (
    id SERIAL PRIMARY KEY,
    norad_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    international_designator TEXT,
    launch_id INTEGER REFERENCES launches(id) ON DELETE SET NULL,
    tle_line1 TEXT,
    tle_line2 TEXT,
    tle_updated_at TIMESTAMPTZ,
    orbit_type TEXT,
    apogee_km DOUBLE PRECISION,
    perigee_km DOUBLE PRECISION,
    inclination_degrees DOUBLE PRECISION,
    period_minutes DOUBLE PRECISION,
    status TEXT, -- active, inactive, decayed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.1 Launch Statistics
CREATE TABLE IF NOT EXISTS launch_statistics (
    id SERIAL PRIMARY KEY,
    total_launches INTEGER DEFAULT 0,
    total_successes INTEGER DEFAULT 0,
    total_failures INTEGER DEFAULT 0,
    total_partial_failures INTEGER DEFAULT 0,
    year INTEGER,
    month INTEGER,
    provider_id INTEGER REFERENCES providers(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11.1 Featured Content
CREATE TABLE IF NOT EXISTS featured_content (
    id SERIAL PRIMARY KEY,
    content_type TEXT NOT NULL, -- launch, article, event, etc.
    content_id INTEGER NOT NULL,
    featured_section TEXT, -- homepage, news, launch_center, etc.
    priority INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10.1 User Preferences (Mobile App Support)
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    preference_key TEXT NOT NULL,
    preference_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, preference_key)
);

-- 10.2 Push Notification Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    platform TEXT, -- ios, android
    enabled BOOLEAN DEFAULT true,
    subscribed_topics JSONB, -- array of topics: launches, news, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

