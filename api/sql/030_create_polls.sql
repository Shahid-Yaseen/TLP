-- Migration 030: Create polls system for news articles
-- Allows articles to have interactive polls with multiple options

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    article_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    is_multiple_choice BOOLEAN DEFAULT false,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll options table
CREATE TABLE IF NOT EXISTS poll_options (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    votes_count INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll votes table (track user votes to prevent duplicate voting)
CREATE TABLE IF NOT EXISTS poll_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id INTEGER NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poll_id, user_id),
    UNIQUE(poll_id, ip_address)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_polls_article_id ON polls(article_id);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);

-- Comments
COMMENT ON TABLE polls IS 'Interactive polls attached to news articles';
COMMENT ON TABLE poll_options IS 'Options for each poll';
COMMENT ON TABLE poll_votes IS 'User votes on polls (prevents duplicate voting)';

COMMENT ON COLUMN polls.is_multiple_choice IS 'Whether users can select multiple options';
COMMENT ON COLUMN polls.end_date IS 'Optional end date for the poll';
COMMENT ON COLUMN poll_votes.ip_address IS 'IP address for anonymous voting (fallback if user not logged in)';
COMMENT ON COLUMN poll_votes.user_agent IS 'Browser user agent for additional fraud prevention';
