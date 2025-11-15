# Launch Sync Setup - Complete Guide

## Overview

This setup provides a production-ready script to sync launches from the Space Devs API to your Digital Ocean database, along with a schema migration to ensure your database matches the API format.

## Files Created

### 1. Sync Script
**Location**: `api/scripts/sync_launches_from_api.js`

A comprehensive Node.js script that:
- Fetches all launches from Space Devs API
- Syncs them to your PostgreSQL database
- Handles errors gracefully
- Provides detailed logging and statistics
- Supports dry-run mode for testing
- Can limit syncs for testing purposes

### 2. Schema Migration
**Location**: `api/sql/017_ensure_launch_schema_complete.sql`

A PostgreSQL migration that:
- Ensures all required fields exist in the `launches` table
- Creates necessary indexes for performance
- Adds JSONB columns for complex API objects
- Verifies schema completeness
- Adds helpful comments

### 3. Documentation
- `api/scripts/SYNC_LAUNCHES_README.md` - Complete usage guide
- `api/scripts/QUICK_SYNC_GUIDE.md` - Quick reference

## Quick Start

### On Your Local Machine (Testing)

```bash
cd api

# 1. Test with dry-run
node scripts/sync_launches_from_api.js --dry-run

# 2. Test with 10 launches
node scripts/sync_launches_from_api.js --limit 10 --verbose

# 3. Full sync (if ready)
node scripts/sync_launches_from_api.js --verbose
```

### On Digital Ocean Server

```bash
# 1. SSH into server
ssh root@YOUR_DROPLET_IP

# 2. Navigate to project
cd /var/www/tlp/api  # adjust path as needed

# 3. Update schema first
psql -U your_db_user -d your_db_name -f sql/017_ensure_launch_schema_complete.sql

# 4. Run sync
node scripts/sync_launches_from_api.js --verbose
```

## Script Options

| Option | Description |
|-------|-------------|
| `--dry-run` | Show what would be synced without making changes |
| `--limit N` | Limit sync to first N launches (for testing) |
| `--force` | Force sync even if cache is not expired |
| `--verbose` | Show detailed progress and error information |

## Example Usage

```bash
# Test run (safe, no changes)
node scripts/sync_launches_from_api.js --dry-run

# Test with small batch
node scripts/sync_launches_from_api.js --limit 10 --verbose

# Production sync
node scripts/sync_launches_from_api.js --verbose

# Force sync (ignore cache check)
node scripts/sync_launches_from_api.js --force --verbose
```

## What Gets Synced

The script syncs the following data from Space Devs API:

- **Launch Information**: Name, slug, designator, dates, status
- **Provider/Agency**: Launch service provider details
- **Rocket**: Rocket configuration and details
- **Mission**: Mission type, description, orbit
- **Location**: Launch site and pad information
- **Media**: Images, videos, YouTube links
- **Metadata**: Probability, weather, hashtags, etc.
- **JSON Objects**: Complete API response objects stored as JSONB

## Schema Changes

The migration ensures these fields exist:

### Core Fields
- `external_id` (UUID) - Unique identifier from API
- `slug` - URL-friendly identifier
- `launch_designator` - International designator

### Timing
- `launch_date` - Main launch date/time
- `window_start` / `window_end` - Launch window
- `net_precision` - Precision information (JSONB)

### Status & Outcome
- `status_id` - Reference to launch_statuses table
- `outcome` - Success/failure/partial/TBD

### Media
- `media` - Media links (JSONB)
- `youtube_video_id` / `youtube_channel_id`
- `image_json` / `infographic_json` (JSONB)

### Metadata
- `probability` - Launch success probability
- `weather_concerns` / `weather_concerns_json`
- `hashtag` / `hashtag_json`
- `flightclub_url` / `pad_turnaround`

### JSONB Objects
- `status_json` - Complete status object
- `launch_service_provider_json` - Provider details
- `rocket_json` - Rocket configuration
- `mission_json` - Mission details
- `pad_json` - Pad and location info
- `program_json` - Program information

### Counters
- `orbital_launch_attempt_count` (and year variants)
- `location_launch_attempt_count` (and year variants)
- `pad_launch_attempt_count` (and year variants)
- `agency_launch_attempt_count` (and year variants)

## Verification

After running the sync, verify the data:

```sql
-- Check total count
SELECT COUNT(*) FROM launches;

-- Check recent syncs
SELECT id, name, launch_date, updated_at 
FROM launches 
ORDER BY updated_at DESC 
LIMIT 10;

-- Check for missing external_ids (should be 0)
SELECT COUNT(*) FROM launches WHERE external_id IS NULL;

-- Check sync coverage
SELECT 
  COUNT(*) as total,
  COUNT(external_id) as with_external_id,
  COUNT(*) - COUNT(external_id) as missing_external_id
FROM launches;
```

## Error Handling

The script handles errors gracefully:

- **API Errors**: Logs and continues with next launch
- **Database Errors**: Logs and continues
- **Network Issues**: Retries automatically (handled by spaceDevsApi service)
- **Invalid Data**: Skips and logs

All errors are collected and displayed in the summary.

## Performance

- **Rate**: Typically 5-10 launches/second
- **Large Syncs**: 1500+ launches take ~5-10 minutes
- **Database**: Uses transactions for efficiency
- **Memory**: Processes launches one at a time

## Automation

### Cron Job (Daily Sync)

Add to crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /var/www/tlp/api && /usr/bin/node scripts/sync_launches_from_api.js >> /var/log/launch-sync.log 2>&1
```

### PM2 (One-time Job)

```bash
pm2 start scripts/sync_launches_from_api.js --name "launch-sync" --no-autorestart
pm2 logs launch-sync
```

## Troubleshooting

### Schema Errors
```bash
# Run the migration
psql -U your_db_user -d your_db_name -f sql/017_ensure_launch_schema_complete.sql
```

### Database Connection
```bash
# Test connection
psql -U your_db_user -d your_db_name -c "SELECT 1"

# Check .env
cat .env | grep DB_
```

### API Issues
```bash
# Test API
curl -H "Authorization: YOUR_API_KEY" https://lldev.thespacedevs.com/2.3.0/launches/?limit=1

# Check API key
cat .env | grep SPACE_DEVS_API_KEY
```

## Next Steps

1. **Test Locally**: Run with `--dry-run` and `--limit 10` first
2. **Update Schema**: Run the migration on your server
3. **First Sync**: Run with `--verbose` to monitor
4. **Verify Data**: Check the database after sync
5. **Automate**: Set up cron job for regular syncs

## Support

For issues:
1. Check error messages in output
2. Review logs with `--verbose`
3. Verify database schema
4. Test with `--limit 10` first
5. Check API connectivity

