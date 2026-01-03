-- Migration 027: Create mission page content tables

-- Main mission content table (single row - singleton pattern)
CREATE TABLE IF NOT EXISTS mission_content (
    id SERIAL PRIMARY KEY,
    -- Hero Section
    hero_title TEXT DEFAULT 'LunEx-1',
    hero_subtitle TEXT DEFAULT 'LAUNCHING JULY 2026',
    hero_mission_statement TEXT DEFAULT 'LunEx-1 is The Launch Pad''s first mission off planet; and we want you to come with us!',
    hero_background_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1614730321146-b6fa6efe46c1?w=1920&q=80',
    
    -- CTA Buttons
    button1_text TEXT DEFAULT 'SEND YOUR NAME',
    button1_status_text TEXT DEFAULT 'SUBMISSIONS CLOSED',
    button2_text TEXT DEFAULT 'SEND YOUR PHOTO',
    button2_status_text TEXT DEFAULT 'SUBMISSIONS CLOSED',
    button3_text TEXT DEFAULT 'SEND YOUR VIDEO',
    button3_status_text TEXT DEFAULT 'SUBMISSIONS CLOSED',
    
    -- Mission Overview
    lift_off_time TEXT DEFAULT 'NET JULY 2026',
    launch_facility TEXT DEFAULT 'NASA KENNEDY SPACE CENTER',
    launch_pad TEXT DEFAULT 'LC-39A',
    launch_provider TEXT DEFAULT 'SPACEX',
    rocket TEXT DEFAULT 'FALCON HEAVY',
    
    -- Lander Overview
    lander_provider TEXT DEFAULT 'ASTROBOTIC',
    lunar_lander TEXT DEFAULT 'GRIFFIN',
    lander_image_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mission updates table (multiple updates)
CREATE TABLE IF NOT EXISTS mission_updates (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mission_updates_display_order ON mission_updates(display_order);
CREATE INDEX IF NOT EXISTS idx_mission_updates_date ON mission_updates(date);

-- Insert default mission content if it doesn't exist
INSERT INTO mission_content (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Insert default updates
INSERT INTO mission_updates (title, date, description, display_order) VALUES
    ('Launch Delayed to NET 2026', '2025-11-05', 'The Space Development Agency (SDA) and its HALO program are seeking commercial space industry involvement for low-Earth orbit (LEO) satellite constellations.', 1),
    ('Seeking new players', NULL, 'The HALO program''s goal is to attract newer commercial players for rapid prototyping and spaceflight demonstrations, with proposals due July 11.', 2),
    ('Payload Ready For Integration', '2025-10-05', 'Another update about the SDA and HALO program, focusing on commercial space industry involvement.', 3),
    ('Seeking new players', NULL, 'Additional information about the HALO program and its objectives for rapid prototyping.', 4)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE mission_content IS 'Mission page content (singleton - only one row)';
COMMENT ON TABLE mission_updates IS 'Mission page updates/news items';

