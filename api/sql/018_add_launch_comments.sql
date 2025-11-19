-- Migration 018: Add Launch Comments Support
-- This migration extends the comments table to support comments on launches
-- in addition to news articles

-- Add launch_id column to comments table
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS launch_id INTEGER REFERENCES launches(id) ON DELETE CASCADE;

-- Add constraint to ensure either article_id OR launch_id is set (not both, not neither)
ALTER TABLE comments
DROP CONSTRAINT IF EXISTS check_content_type;

ALTER TABLE comments
ADD CONSTRAINT check_content_type CHECK (
  (article_id IS NOT NULL AND launch_id IS NULL) OR 
  (article_id IS NULL AND launch_id IS NOT NULL)
);

-- Create index on launch_id for performance
CREATE INDEX IF NOT EXISTS idx_comments_launch ON comments(launch_id);

-- Create index for sorting by created_at on launch comments
CREATE INDEX IF NOT EXISTS idx_comments_launch_created ON comments(launch_id, created_at DESC) WHERE launch_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN comments.launch_id IS 'Reference to launch if this comment is on a launch (mutually exclusive with article_id)';

-- Create comment_likes table for like functionality
CREATE TABLE IF NOT EXISTS comment_likes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

