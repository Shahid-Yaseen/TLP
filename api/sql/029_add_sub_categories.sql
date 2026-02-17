-- Migration 029: Add sub-category support to news_categories
-- This allows hierarchical category structure (e.g., LAUNCH > SpaceX, LAUNCH > Blue Origin)

-- Add parent_id column for hierarchical categories
ALTER TABLE news_categories 
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES news_categories(id) ON DELETE SET NULL;

-- Add index for parent lookups
CREATE INDEX IF NOT EXISTS idx_news_categories_parent_id ON news_categories(parent_id);

-- Add display_order for sorting sub-categories
ALTER TABLE news_categories
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

COMMENT ON COLUMN news_categories.parent_id IS 'Reference to parent category for hierarchical structure';
COMMENT ON COLUMN news_categories.display_order IS 'Order in which sub-categories should be displayed';

-- Insert example sub-categories for LAUNCH category
INSERT INTO news_categories (name, slug, parent_id, description, display_order) 
SELECT 'SpaceX', 'spacex', id, 'SpaceX launch news and updates', 1
FROM news_categories WHERE slug = 'launch'
ON CONFLICT (name) DO NOTHING;

INSERT INTO news_categories (name, slug, parent_id, description, display_order)
SELECT 'Blue Origin', 'blue-origin', id, 'Blue Origin launch news and updates', 2
FROM news_categories WHERE slug = 'launch'
ON CONFLICT (name) DO NOTHING;

INSERT INTO news_categories (name, slug, parent_id, description, display_order)
SELECT 'ULA', 'ula', id, 'United Launch Alliance news and updates', 3
FROM news_categories WHERE slug = 'launch'
ON CONFLICT (name) DO NOTHING;

INSERT INTO news_categories (name, slug, parent_id, description, display_order)
SELECT 'Rocket Lab', 'rocket-lab', id, 'Rocket Lab launch news and updates', 4
FROM news_categories WHERE slug = 'launch'
ON CONFLICT (name) DO NOTHING;

-- Insert example sub-categories for IN SPACE category
INSERT INTO news_categories (name, slug, parent_id, description, display_order)
SELECT 'NASA', 'nasa', id, 'NASA space exploration news', 1
FROM news_categories WHERE slug = 'in-space'
ON CONFLICT (name) DO NOTHING;

INSERT INTO news_categories (name, slug, parent_id, description, display_order)
SELECT 'ISS', 'iss', id, 'International Space Station news', 2
FROM news_categories WHERE slug = 'in-space'
ON CONFLICT (name) DO NOTHING;

INSERT INTO news_categories (name, slug, parent_id, description, display_order)
SELECT 'Artemis', 'artemis', id, 'Artemis program news and updates', 3
FROM news_categories WHERE slug = 'in-space'
ON CONFLICT (name) DO NOTHING;
