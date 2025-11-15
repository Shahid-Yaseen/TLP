-- Create tables for array fields from Space Devs API
-- These arrays are stored in separate tables for better querying and normalization

-- Launch updates table
CREATE TABLE IF NOT EXISTS launch_updates (
    id SERIAL PRIMARY KEY,
    launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE,
    update_id INTEGER, -- ID from API
    profile_image TEXT,
    comment TEXT,
    info_url TEXT,
    created_by TEXT,
    created_on TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(launch_id, update_id)
);

CREATE INDEX IF NOT EXISTS idx_launch_updates_launch_id ON launch_updates(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_updates_created_on ON launch_updates(created_on);

-- Launch timeline table
CREATE TABLE IF NOT EXISTS launch_timeline (
    id SERIAL PRIMARY KEY,
    launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE,
    type_id INTEGER,
    type_abbrev TEXT,
    type_description TEXT,
    relative_time TEXT, -- ISO 8601 duration format
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_launch_timeline_launch_id ON launch_timeline(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_timeline_type_id ON launch_timeline(type_id);

-- Launch mission patches table
CREATE TABLE IF NOT EXISTS launch_mission_patches (
    id SERIAL PRIMARY KEY,
    launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE,
    patch_data JSONB, -- Store complete patch object
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_launch_mission_patches_launch_id ON launch_mission_patches(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_mission_patches_patch_data ON launch_mission_patches USING GIN (patch_data);

-- Launch info URLs table
CREATE TABLE IF NOT EXISTS launch_info_urls (
    id SERIAL PRIMARY KEY,
    launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE,
    priority INTEGER,
    source TEXT,
    title TEXT,
    description TEXT,
    feature_image TEXT,
    url TEXT,
    type_id INTEGER,
    type_name TEXT,
    language_id INTEGER,
    language_name TEXT,
    language_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_launch_info_urls_launch_id ON launch_info_urls(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_info_urls_priority ON launch_info_urls(priority);

-- Launch video URLs table
CREATE TABLE IF NOT EXISTS launch_vid_urls (
    id SERIAL PRIMARY KEY,
    launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE,
    priority INTEGER,
    source TEXT,
    publisher TEXT,
    title TEXT,
    description TEXT,
    feature_image TEXT,
    url TEXT,
    type_id INTEGER,
    type_name TEXT,
    language_id INTEGER,
    language_name TEXT,
    language_code TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    live BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_launch_vid_urls_launch_id ON launch_vid_urls(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_vid_urls_priority ON launch_vid_urls(priority);
CREATE INDEX IF NOT EXISTS idx_launch_vid_urls_live ON launch_vid_urls(live);

