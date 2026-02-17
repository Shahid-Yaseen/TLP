-- Migration to add summary column to news_articles
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS summary TEXT[];

COMMENT ON COLUMN news_articles.summary IS 'Key bullet points for the article summary';
