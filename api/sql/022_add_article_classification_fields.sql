-- Add classification fields to news_articles table
-- This migration adds fields for interviews, top stories, and country-based articles

-- Add is_interview flag
ALTER TABLE news_articles 
  ADD COLUMN IF NOT EXISTS is_interview BOOLEAN DEFAULT false;

-- Add is_top_story flag
ALTER TABLE news_articles 
  ADD COLUMN IF NOT EXISTS is_top_story BOOLEAN DEFAULT false;

-- Add country_id reference (if countries table exists)
-- Note: This assumes countries table exists from previous migrations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'countries') THEN
    ALTER TABLE news_articles 
      ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_news_articles_country_id ON news_articles(country_id);
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_news_articles_is_interview ON news_articles(is_interview) WHERE is_interview = true;
CREATE INDEX IF NOT EXISTS idx_news_articles_is_top_story ON news_articles(is_top_story) WHERE is_top_story = true;

