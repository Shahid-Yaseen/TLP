-- Migration: Create article_launch_relationships table
-- This table links news articles to related launches

CREATE TABLE IF NOT EXISTS article_launch_relationships (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  launch_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, launch_id)
);

CREATE INDEX idx_article_launch_article ON article_launch_relationships(article_id);
CREATE INDEX idx_article_launch_launch ON article_launch_relationships(launch_id);

COMMENT ON TABLE article_launch_relationships IS 'Links news articles to related launches';
COMMENT ON COLUMN article_launch_relationships.article_id IS 'Reference to the news article';
COMMENT ON COLUMN article_launch_relationships.launch_id IS 'ID of the related launch (from launches table)';
