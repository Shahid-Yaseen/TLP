# Launch Sync Script - Server Usage Guide

This guide explains how to sync launches from the Space Devs API to your Digital Ocean database.

## Prerequisites

1. **Database connection configured**: Ensure your `.env` file has the correct database credentials
2. **Schema up to date**: Run the schema migration before syncing
3. **API key**: The script uses the Space Devs API key from `SPACE_DEVS_API_KEY` in `.env` (or defaults to a public key)

## Step 1: Update Database Schema

Before syncing, ensure your database schema matches the API format:

```bash
# SSH into your Digital Ocean droplet
ssh root@YOUR_DROPLET_IP

# Navigate to your project directory
cd /path/to/your/project/api

# Run the schema migration
psql -U your_db_user -d your_db_name -f sql/017_ensure_launch_schema_complete.sql
```

Or if you're using the migration script:

```bash
node scripts/run_migrations.js
```

## Step 2: Run the Sync Script

### Basic Usage

```bash
# Full sync (recommended for first run)
node scripts/sync_launches_from_api.js

# Or make it executable and run directly
chmod +x scripts/sync_launches_from_api.js
./scripts/sync_launches_from_api.js
```

### Options

```bash
# Dry run (see what would be synced without making changes)
node scripts/sync_launches_from_api.js --dry-run

# Limit to first 10 launches (for testing)
node scripts/sync_launches_from_api.js --limit 10

# Force sync even if cache is still valid
node scripts/sync_launches_from_api.js --force

# Verbose output (detailed progress and error messages)
node scripts/sync_launches_from_api.js --verbose

# Combine options
node scripts/sync_launches_from_api.js --limit 50 --verbose
```

## Step 3: Verify the Sync

After syncing, verify the data:

```bash
# Connect to your database
psql -U your_db_user -d your_db_name

# Check launch count
SELECT COUNT(*) FROM launches;

# Check recent launches
SELECT id, name, launch_date, updated_at 
FROM launches 
ORDER BY updated_at DESC 
LIMIT 10;

# Check for errors (launches without external_id)
SELECT COUNT(*) FROM launches WHERE external_id IS NULL;
```

## Running on Digital Ocean Server

### Option 1: Direct SSH

```bash
# SSH into server
ssh root@YOUR_DROPLET_IP

# Navigate to project
cd /var/www/tlp/api  # or wherever your project is

# Run sync
node scripts/sync_launches_from_api.js --verbose
```

### Option 2: Using PM2 (Recommended for Production)

You can run the sync as a one-time PM2 job:

```bash
# SSH into server
ssh root@YOUR_DROPLET_IP

# Navigate to project
cd /var/www/tlp/api

# Run with PM2 (will exit when done)
pm2 start scripts/sync_launches_from_api.js --name "launch-sync" --no-autorestart

# Monitor progress
pm2 logs launch-sync

# Check status
pm2 status
```

### Option 3: Cron Job (Automated Sync)

To run the sync automatically (e.g., daily at 2 AM):

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /var/www/tlp/api && /usr/bin/node scripts/sync_launches_from_api.js >> /var/log/launch-sync.log 2>&1
```

## Troubleshooting

### Database Connection Errors

```bash
# Test database connection
psql -U your_db_user -d your_db_name -c "SELECT 1"

# Check .env file
cat .env | grep DB_
```

### API Errors

```bash
# Test API connection
curl -H "Authorization: YOUR_API_KEY" https://lldev.thespacedevs.com/2.3.0/launches/?limit=1

# Check API key in .env
cat .env | grep SPACE_DEVS_API_KEY
```

### Schema Errors

If you get column errors, make sure you've run the schema migration:

```bash
# Check if migration was run
psql -U your_db_user -d your_db_name -c "\d launches" | grep external_id

# If missing, run migration
psql -U your_db_user -d your_db_name -f sql/017_ensure_launch_schema_complete.sql
```

### Performance Issues

For large syncs, consider:

1. **Run during off-peak hours**
2. **Use --limit to sync in batches**
3. **Monitor database performance**

```bash
# Monitor database during sync
watch -n 1 'psql -U your_db_user -d your_db_name -c "SELECT COUNT(*) FROM launches"'
```

## Expected Output

Successful sync output looks like:

```
[2024-01-15T10:30:00.000Z] ℹ️  🚀 Starting Launch Sync Script
[2024-01-15T10:30:00.001Z] ℹ️  Mode: LIVE SYNC
[2024-01-15T10:30:00.002Z] ℹ️  Testing database connection...
[2024-01-15T10:30:00.150Z] ✅ Database connected: PostgreSQL 14.5
[2024-01-15T10:30:00.151Z] ℹ️  Checking if sync is needed...
[2024-01-15T10:30:00.200Z] ℹ️  Cache expired, sync needed
[2024-01-15T10:30:00.201Z] ℹ️  Fetching launches from Space Devs API...
[2024-01-15T10:30:05.500Z] ✅ Fetched 1500 launches from API
[2024-01-15T10:30:05.501Z] ℹ️  Starting sync of 1500 launches...
[2024-01-15T10:30:05.502Z] ℹ️  Progress: 50/1500 launches synced (50 successful, 0 errors)
...
[2024-01-15T10:35:00.000Z] ℹ️  ═══════════════════════════════════════════════════════════
[2024-01-15T10:35:00.001Z] ℹ️  📊 SYNC SUMMARY
[2024-01-15T10:35:00.002Z] ℹ️  ═══════════════════════════════════════════════════════════
[2024-01-15T10:35:00.003Z] ℹ️  Total launches processed: 1500
[2024-01-15T10:35:00.004Z] ✅ Successful: 1495
[2024-01-15T10:35:00.005Z] ℹ️  Errors: 5
[2024-01-15T10:35:00.006Z] ℹ️  ⏱️  Duration: 4m 30s
[2024-01-15T10:35:00.007Z] ℹ️  📈 Rate: 5.56 launches/second
[2024-01-15T10:35:00.008Z] ✅ Sync completed successfully!
```

## Best Practices

1. **First Run**: Use `--dry-run` to verify everything works
2. **Testing**: Use `--limit 10` to test with a small batch
3. **Production**: Run with `--verbose` to monitor progress
4. **Monitoring**: Check logs regularly for errors
5. **Backup**: Consider backing up your database before large syncs

## Support

If you encounter issues:

1. Check the error messages in the output
2. Verify database connection and schema
3. Check API key and network connectivity
4. Review logs with `--verbose` flag
5. Test with `--limit 10` first

