-- Phase 3: News Section Tables
-- This migration creates tables for the News Section module
-- Note: This phase depends on users table (created in Phase 4) for comments.user_id

-- 3.1 Authors/Journalists
CREATE TABLE IF NOT EXISTS authors (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    title TEXT, -- e.g., "SPACE NEWS JOURNALIST"
    bio TEXT,
    profile_image_url TEXT,
    book_info JSONB, -- upcoming books, publications
    social_links JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 News Categories
CREATE TABLE IF NOT EXISTS news_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- NEWS, LAUNCH, IN SPACE, TECHNOLOGY, MILITARY, FINANCE
    slug TEXT UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 News Articles
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    slug TEXT UNIQUE,
    author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES news_categories(id) ON DELETE SET NULL,
    featured_image_url TEXT,
    hero_image_url TEXT,
    content TEXT NOT NULL, -- full article content
    excerpt TEXT, -- summary/snippet
    status TEXT DEFAULT 'draft', -- draft, published, archived
    published_at TIMESTAMPTZ,
    views_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    metadata JSONB, -- SEO, custom fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 Article Tags
CREATE TABLE IF NOT EXISTS article_tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- ARTEMIS, SLS, SPACEX, NASA, MOON
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 Article-Tag Relationship
CREATE TABLE IF NOT EXISTS article_tags_articles (
    article_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES article_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- 3.6 Trending Topics
CREATE TABLE IF NOT EXISTS trending_topics (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL, -- SPACEX, ARTEMIS 2, MARS SAMPLE RETURN, etc.
    slug TEXT UNIQUE,
    topic_type TEXT, -- tag, category, entity
    related_entity_id INTEGER, -- can reference various entity types
    entity_type TEXT, -- launch, article, astronaut, rocket, etc.
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 Comments (requires users table from Phase 4)
-- This table will be created with a deferred constraint check
-- The user_id foreign key will be added after users table exists
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
    user_id INTEGER, -- Will add FK constraint in Phase 4 migration
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE, -- for nested replies
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 Related Content Links
CREATE TABLE IF NOT EXISTS related_content (
    id SERIAL PRIMARY KEY,
    source_type TEXT NOT NULL, -- article, launch, astronaut, etc.
    source_id INTEGER NOT NULL,
    related_type TEXT NOT NULL,
    related_id INTEGER NOT NULL,
    relationship_type TEXT, -- related_launch, related_story, etc.
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

