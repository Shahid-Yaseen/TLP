-- Migration 025: Create Subscriptions Table
-- For managing email subscriptions from coming soon pages

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ NULL,
    is_active BOOLEAN DEFAULT true,
    source_page TEXT, -- Track which coming soon page they subscribed from (space-news, spacebase, orbit-navigator, support)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);

-- Create index on is_active for filtering active subscribers
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);

-- Create index on source_page for analytics
CREATE INDEX IF NOT EXISTS idx_subscriptions_source_page ON subscriptions(source_page);

-- Add comment to table
COMMENT ON TABLE subscriptions IS 'Email subscriptions from coming soon pages';

-- Add comments to columns
COMMENT ON COLUMN subscriptions.email IS 'Subscriber email address (unique)';
COMMENT ON COLUMN subscriptions.subscribed_at IS 'When the user first subscribed';
COMMENT ON COLUMN subscriptions.unsubscribed_at IS 'When the user unsubscribed (if applicable)';
COMMENT ON COLUMN subscriptions.is_active IS 'Whether the subscription is currently active';
COMMENT ON COLUMN subscriptions.source_page IS 'Which coming soon page the user subscribed from';

