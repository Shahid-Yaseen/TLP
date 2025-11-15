-- Add missing top-level fields to launches table
-- These fields are present in the Space Devs API response but missing from our schema

ALTER TABLE launches 
    ADD COLUMN IF NOT EXISTS flightclub_url TEXT,
    ADD COLUMN IF NOT EXISTS pad_turnaround TEXT; -- ISO 8601 duration format

-- Verify that these fields already exist (they should from previous migrations)
-- response_mode - should exist from 009_enhanced_launch_schema.sql
-- updated_at - should exist from 012_add_launch_updated_at.sql
-- orbital_launch_attempt_count - should exist from 009_enhanced_launch_schema.sql
-- location_launch_attempt_count - should exist from 009_enhanced_launch_schema.sql
-- pad_launch_attempt_count - should exist from 009_enhanced_launch_schema.sql
-- agency_launch_attempt_count - should exist from 009_enhanced_launch_schema.sql
-- orbital_launch_attempt_count_year - should exist from 009_enhanced_launch_schema.sql
-- location_launch_attempt_count_year - should exist from 009_enhanced_launch_schema.sql
-- pad_launch_attempt_count_year - should exist from 009_enhanced_launch_schema.sql
-- agency_launch_attempt_count_year - should exist from 009_enhanced_launch_schema.sql

