-- Seed required news categories for the public news page
-- Categories: NEWS, LAUNCH, IN SPACE, TECHNOLOGY, MILITARY, FINANCE
-- Slugs must match frontend categorySlugMap in web/src/pages/News.jsx and CategoryNews.jsx
-- Idempotent: re-running updates existing rows by slug.

INSERT INTO news_categories (name, slug, description) VALUES
  ('NEWS', 'news', 'General space and aerospace news'),
  ('LAUNCH', 'launch', 'Launch coverage, rockets, and launch calendar'),
  ('IN SPACE', 'in-space', 'In-space operations, ISS, and orbital missions'),
  ('TECHNOLOGY', 'technology', 'Space technology and innovation'),
  ('MILITARY', 'military', 'Military space and defense'),
  ('FINANCE', 'finance', 'Space industry and market news')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;
