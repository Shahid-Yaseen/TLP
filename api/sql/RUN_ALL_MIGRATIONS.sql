-- Run All Migrations in Order
-- This script runs all migrations sequentially
-- Use this if you're running migrations manually in psql

-- Note: Make sure you're connected to the correct database first
-- \c your_database_name

-- Migration 001: Initial Launchpad Tables
\i 001_init_launchpad.sql

-- Migration 002: Launch Extensions
\i 002_launch_extensions.sql

-- Migration 003: Spacebase Tables
\i 003_spacebase.sql

-- Migration 004: News Section
\i 004_news_section.sql

-- Migration 005: User Management
\i 005_user_management.sql

-- Migration 006: Supporting Features
\i 006_supporting_features.sql

-- Migration 007: Indexes
\i 007_indexes.sql

-- Migration 008: User Profile Fields
\i 008_user_profile_fields.sql

-- Migration 009: Enhanced Launch Schema
\i 009_enhanced_launch_schema.sql

-- Migration 010: Enhanced Agency Schema
\i 010_enhanced_agency_schema.sql

-- Migration 011: Enhanced Astronaut Schema
\i 011_enhanced_astronaut_schema.sql

-- Migration 012: Add Launch Updated At
\i 012_add_launch_updated_at.sql

-- Migration 013: Add Raw Data to Launches
\i 013_add_raw_data_to_launches.sql

-- Migration 014: Add All API Fields
\i 014_add_all_api_fields.sql

-- Migration 015: Add Missing Launch Fields
\i 015_add_missing_launch_fields.sql

-- Migration 016: Create Launch Arrays
\i 016_create_launch_arrays.sql

-- Migration 017: Ensure Launch Schema Complete
\i 017_ensure_launch_schema_complete.sql

-- Verify launches table exists
SELECT 
    'Launches table exists: ' || 
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'launches'
    ) THEN 'YES ✅' ELSE 'NO ❌' END as status;

-- Check key columns
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'launches'
AND column_name IN ('external_id', 'updated_at', 'status_json', 'rocket_json')
ORDER BY column_name;

