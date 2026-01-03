-- Migration 028: Create launch related articles relationship table

-- Junction table for many-to-many relationship between launches and articles
CREATE TABLE IF NOT EXISTS launch_related_articles (
    id SERIAL PRIMARY KEY,
    launch_id INTEGER NOT NULL REFERENCES launches(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(launch_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_launch_related_articles_launch_id ON launch_related_articles(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_related_articles_article_id ON launch_related_articles(article_id);
CREATE INDEX IF NOT EXISTS idx_launch_related_articles_display_order ON launch_related_articles(launch_id, display_order);

COMMENT ON TABLE launch_related_articles IS 'Many-to-many relationship between launches and related news articles (admin-managed)';
COMMENT ON COLUMN launch_related_articles.launch_id IS 'Reference to the launch';
COMMENT ON COLUMN launch_related_articles.article_id IS 'Reference to the related article';
COMMENT ON COLUMN launch_related_articles.display_order IS 'Order in which articles should be displayed';

