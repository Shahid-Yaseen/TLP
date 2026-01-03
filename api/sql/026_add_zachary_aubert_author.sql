-- Migration 026: Add Zachary Aubert as Default Author for Launches
-- This migration creates Zachary Aubert as an author and sets him as the default author for all launches

-- Insert Zachary Aubert as an author (only if he doesn't exist)
INSERT INTO authors (first_name, last_name, full_name, title, bio, profile_image_url, book_info)
VALUES (
  'Zachary',
  'Aubert',
  'Zachary Aubert',
  'SPACE NEWS JOURNALIST',
  'Zac Aubert is the founder and CEO of The Launch Pad, covering everything from rocket launches, space tech, and off planet missions.',
  'https://i.imgur.com/zachary-aubert-profile.jpg',
  '{"upcoming_books": [{"title": "Astro Guide: An UnOfficial Guide To The America Space Coast", "status": "in_progress"}]}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Get the author ID (assuming full_name is unique or we can use a subquery)
-- First, let's ensure we have the author
DO $$
DECLARE
  author_id_val INTEGER;
BEGIN
  -- Get or create Zachary Aubert
  SELECT id INTO author_id_val
  FROM authors
  WHERE full_name = 'Zachary Aubert'
  LIMIT 1;

  -- If author doesn't exist, insert it
  IF author_id_val IS NULL THEN
    INSERT INTO authors (first_name, last_name, full_name, title, bio, profile_image_url, book_info)
    VALUES (
      'Zachary',
      'Aubert',
      'Zachary Aubert',
      'SPACE NEWS JOURNALIST',
      'Zac Aubert is the founder and CEO of The Launch Pad, covering everything from rocket launches, space tech, and off planet missions.',
      'https://i.imgur.com/zachary-aubert-profile.jpg',
      '{"upcoming_books": [{"title": "Astro Guide: An UnOfficial Guide To The America Space Coast", "status": "in_progress"}]}'::jsonb
    )
    RETURNING id INTO author_id_val;
  END IF;

  -- Update all launches that don't have an author to use Zachary Aubert
  UPDATE launches
  SET author_id = author_id_val
  WHERE author_id IS NULL;

  RAISE NOTICE 'Set Zachary Aubert (ID: %) as default author for all launches without an author', author_id_val;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN launches.author_id IS 'Reference to author/journalist who wrote about or is covering this launch. Default: Zachary Aubert';

