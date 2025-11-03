-- Phase 6: Indexes for Performance Optimization
-- This migration creates indexes to improve query performance across all modules

-- Launch queries
CREATE INDEX IF NOT EXISTS idx_launches_date ON launches(launch_date);
CREATE INDEX IF NOT EXISTS idx_launches_outcome ON launches(outcome);
CREATE INDEX IF NOT EXISTS idx_launches_provider ON launches(provider_id);
CREATE INDEX IF NOT EXISTS idx_launches_site ON launches(site_id);
CREATE INDEX IF NOT EXISTS idx_launches_rocket ON launches(rocket_id);
CREATE INDEX IF NOT EXISTS idx_launches_featured ON launches(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_launches_mission_type ON launches(mission_type_id);
CREATE INDEX IF NOT EXISTS idx_launches_pad ON launches(launch_pad_id);

-- Launch extensions
CREATE INDEX IF NOT EXISTS idx_launch_payloads_launch ON launch_payloads(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_payloads_payload ON launch_payloads(payload_id);
CREATE INDEX IF NOT EXISTS idx_recoveries_launch ON recoveries(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_windows_launch ON launch_windows(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_windows_open ON launch_windows(window_open);
CREATE INDEX IF NOT EXISTS idx_launch_hazards_launch ON launch_hazards(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_pads_site ON launch_pads(launch_site_id);

-- Spacebase/TLPedia queries
CREATE INDEX IF NOT EXISTS idx_astronauts_status ON astronauts(status);
CREATE INDEX IF NOT EXISTS idx_astronauts_agency ON astronauts(agency_id);
CREATE INDEX IF NOT EXISTS idx_astronauts_number ON astronauts(astronaut_number);
CREATE INDEX IF NOT EXISTS idx_astronaut_missions_astronaut ON astronaut_missions(astronaut_id);
CREATE INDEX IF NOT EXISTS idx_astronaut_missions_launch ON astronaut_missions(launch_id);
CREATE INDEX IF NOT EXISTS idx_engines_manufacturer ON engines(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_rocket_engines_rocket ON rocket_engines(rocket_id);
CREATE INDEX IF NOT EXISTS idx_rocket_engines_engine ON rocket_engines(engine_id);
CREATE INDEX IF NOT EXISTS idx_spacecraft_manufacturer ON spacecraft(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_spacecraft_status ON spacecraft(status);
CREATE INDEX IF NOT EXISTS idx_facilities_agency ON facilities(agency_id);

-- News queries
CREATE INDEX IF NOT EXISTS idx_articles_published ON news_articles(published_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_status ON news_articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON news_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author ON news_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON news_articles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_articles_trending ON news_articles(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_articles_slug ON news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_article_tags_articles_article ON article_tags_articles(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_articles_tag ON article_tags_articles(tag_id);
CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_trending_topics_active ON trending_topics(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_trending_topics_priority ON trending_topics(priority DESC);

-- User/auth queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_launch ON events(related_launch_id);

-- Crew
CREATE INDEX IF NOT EXISTS idx_crew_members_category ON crew_members(category);
CREATE INDEX IF NOT EXISTS idx_crew_members_active ON crew_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_crew_locations_headquarters ON crew_locations(is_headquarters) WHERE is_headquarters = true;

-- Live streams
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_live ON live_streams(is_live) WHERE is_live = true;

-- Satellites
CREATE INDEX IF NOT EXISTS idx_satellites_norad ON satellites(norad_id);
CREATE INDEX IF NOT EXISTS idx_satellites_launch ON satellites(launch_id);
CREATE INDEX IF NOT EXISTS idx_satellites_status ON satellites(status);

-- Statistics
CREATE INDEX IF NOT EXISTS idx_launch_statistics_provider ON launch_statistics(provider_id);
CREATE INDEX IF NOT EXISTS idx_launch_statistics_year ON launch_statistics(year);

-- Featured content
CREATE INDEX IF NOT EXISTS idx_featured_content_type ON featured_content(content_type);
CREATE INDEX IF NOT EXISTS idx_featured_content_section ON featured_content(featured_section);
CREATE INDEX IF NOT EXISTS idx_featured_content_active ON featured_content(is_active) WHERE is_active = true;

-- User preferences & push notifications
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled ON push_subscriptions(enabled) WHERE enabled = true;

-- Related content
CREATE INDEX IF NOT EXISTS idx_related_content_source ON related_content(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_related_content_related ON related_content(related_type, related_id);

-- Note: For full-text search with trigram (pg_trgm extension), uncomment these after enabling the extension:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON news_articles USING gin(title gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_astronauts_name_trgm ON astronauts USING gin(full_name gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_rockets_name_trgm ON rockets USING gin(name gin_trgm_ops);

