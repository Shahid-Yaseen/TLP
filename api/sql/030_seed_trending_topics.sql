-- Seed default trending topics for the news page bar (TRENDING | SPACEX | ARTEMIS 2 | ...)
-- Idempotent: re-running updates existing rows by slug.

INSERT INTO trending_topics (name, slug, topic_type, priority, is_active) VALUES
  ('TRENDING', 'trending', 'tag', 100, true),
  ('SPACEX', 'spacex', 'tag', 90, true),
  ('ARTEMIS 2', 'artemis', 'tag', 80, true),
  ('MARS SAMPLE RETURN', 'mars-sample-return', 'tag', 70, true),
  ('DARPA LUNAR ORBITER', 'darpa-lunar-orbiter', 'tag', 60, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  topic_type = EXCLUDED.topic_type,
  priority = EXCLUDED.priority,
  is_active = EXCLUDED.is_active;
