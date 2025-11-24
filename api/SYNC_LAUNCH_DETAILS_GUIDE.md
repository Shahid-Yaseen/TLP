# Sync Launch Details to Database - Complete Guide

This guide explains how to sync all launch details from the Space Devs API to your database so that the API serves data from the database instead of making external API calls.

## Quick Start

### For Historical Launches (Complete Details)

**This is the recommended script** - it fetches historical launches with **full detailed data** for each launch:

```bash
cd api

# Full sync of all historical launches with detailed data
node scripts/fetch_historical_launches.js --verbose

# Or with npm script (if added to package.json)
npm run sync:historical
```

### For All Launches (Basic + Details)

```bash
cd api

# Sync all launches (fetches detailed data for each)
node scripts/sync_launches_from_api.js --verbose
```

## Scripts Available

### 1. `fetch_historical_launches.js` ⭐ **RECOMMENDED**

**Purpose**: Fetches historical launches from today backward with **complete detailed data** for each launch.

**Features**:
- Fetches from today backward (all historical launches)
- Makes individual API requests for each launch to get complete details
- Saves complete raw API response in `raw_data` JSONB field
- Ensures all launches have detailed data saved

**Usage**:
```bash
# Full sync (all historical launches with details)
node scripts/fetch_historical_launches.js --verbose

# Test with first 10 launches
node scripts/fetch_historical_launches.js --limit 10 --verbose

# Sync last 30 days only
node scripts/fetch_historical_launches.js --days 30 --verbose

# Dry run (see what would be fetched)
node scripts/fetch_historical_launches.js --dry-run
```

### 2. `sync_launches_from_api.js`

**Purpose**: Syncs all launches from the API (upcoming + historical).

**Usage**:
```bash
# Full sync
node scripts/sync_launches_from_api.js --verbose

# Test with limit
node scripts/sync_launches_from_api.js --limit 50 --verbose

# Force sync (ignore cache)
node scripts/sync_launches_from_api.js --force --verbose
```

### 3. `check_new_launches.js`

**Purpose**: Checks for new launches (designed for cron jobs).

**Usage**:
```bash
# Check last 7 days for new launches
node scripts/check_new_launches.js --verbose

# Check last 30 days
node scripts/check_new_launches.js --days 30 --verbose
```

## Recommended Workflow

### Step 1: Run Migrations (if not done)

```bash
cd api
npm run migrate
```

### Step 2: Sync Historical Launches with Full Details

```bash
# This ensures all historical launches have complete detailed data
node scripts/fetch_historical_launches.js --verbose
```

**What this does**:
- Fetches all historical launches from today backward
- For each launch, makes an individual API request to get complete details
- Saves the complete raw API response in the `raw_data` field
- Maps and saves all launch data to the database

**Expected output**:
```
🚀 Starting Historical Launch Fetch Script
Mode: LIVE SYNC
Time Range: All historical launches (from today backward)
Detail Mode: Fetching detailed data for each launch via API

✅ Database connected: PostgreSQL 14.5
✅ Fetched 1500 launches from API
Starting sync of 1500 launches...
Progress: 50/1500 launches synced (50 successful, 0 errors)
...
📊 SYNC SUMMARY
Total launches processed: 1500
✅ Successful: 1495
❌ Errors: 5
⏱️  Duration: 4m 30s
```

### Step 3: Verify Data in Database

```bash
# Connect to database
psql -U postgres -d tlp_db

# Check total launches
SELECT COUNT(*) FROM launches;

# Check how many have detailed data (raw_data)
SELECT 
  COUNT(*) as total_launches,
  COUNT(raw_data) as launches_with_details,
  COUNT(*) - COUNT(raw_data) as launches_without_details
FROM launches;

# Check a specific launch
SELECT 
  id, 
  name, 
  slug,
  raw_data IS NOT NULL as has_raw_data,
  updated_at
FROM launches 
WHERE slug = 'haste-leidos-3';

# Exit
\q
```

### Step 4: (Optional) Sync New/Upcoming Launches

```bash
# Check for new launches
node scripts/check_new_launches.js --verbose
```

## Running on Production Server

### Option 1: Direct SSH

```bash
# SSH into server
ssh root@your-server-ip

# Navigate to project
cd /opt/tlp/api

# Run sync
node scripts/fetch_historical_launches.js --verbose
```

### Option 2: Background Process (for long syncs)

```bash
# Run in background with nohup
nohup node scripts/fetch_historical_launches.js --verbose > /var/log/launch-sync.log 2>&1 &

# Monitor progress
tail -f /var/log/launch-sync.log

# Check if still running
ps aux | grep fetch_historical_launches
```

### Option 3: Using PM2

```bash
# Start sync as PM2 process
pm2 start scripts/fetch_historical_launches.js --name "launch-sync" --no-autorestart -- --verbose

# Monitor
pm2 logs launch-sync

# Check status
pm2 status
```

## Understanding the Sync Process

### What Gets Saved

1. **Basic Launch Data**: All individual columns (name, slug, net, status, etc.)
2. **Raw API Response**: Complete JSON response saved in `raw_data` JSONB field
3. **Mapped Data**: Structured data in individual columns for quick access

### How the API Uses This Data

The API endpoint `/api/launches/:id`:
1. **First**: Checks database for launch with `raw_data`
2. **If found**: Returns data from database (fast, reliable)
3. **If not found**: Fetches from external API, saves to database, then returns

### Why This Matters

- **Performance**: Database queries are much faster than external API calls
- **Reliability**: Works even if external API is down
- **Cost**: Reduces external API rate limit usage
- **Completeness**: Ensures all launches have full detailed data

## Troubleshooting

### Script Not Found

If you get "Cannot find module" error:

```bash
# On server, pull latest code
cd /opt/tlp
git stash  # Save local changes
git pull origin main

# Verify script exists
ls -la api/scripts/fetch_historical_launches.js
```

### Database Connection Errors

```bash
# Test connection
cd api
node -e "require('dotenv').config(); const {getPool} = require('./config/database'); getPool().query('SELECT 1').then(() => console.log('✅ Connected')).catch(e => console.error('❌', e.message))"

# Check .env file
cat .env | grep DB_
```

### API Rate Limits

If you hit rate limits:
- The script handles this automatically with delays
- Use `--limit` to sync in smaller batches
- Run during off-peak hours

### Partial Sync

If sync stops partway:
- The script is idempotent - safe to run again
- It will update existing records or create new ones
- Use `--verbose` to see progress

## Monitoring Sync Progress

### Check Database During Sync

```bash
# In another terminal, connect to database
psql -U postgres -d tlp_db

# Watch launch count increase
SELECT COUNT(*) FROM launches;

# Check recent updates
SELECT name, updated_at 
FROM launches 
ORDER BY updated_at DESC 
LIMIT 10;
```

### Check Logs

```bash
# If running with nohup
tail -f /var/log/launch-sync.log

# If running with PM2
pm2 logs launch-sync
```

## Best Practices

1. **First Run**: Test with `--limit 10` to verify everything works
2. **Production**: Run with `--verbose` to monitor progress
3. **Large Syncs**: Run during off-peak hours
4. **Monitoring**: Check database periodically during long syncs
5. **Verification**: After sync, verify data with SQL queries

## Expected Results

After successful sync:

```sql
-- Should show most/all launches have raw_data
SELECT 
  COUNT(*) as total,
  COUNT(raw_data) as with_details,
  ROUND(100.0 * COUNT(raw_data) / COUNT(*), 2) as percent_with_details
FROM launches;
```

**Goal**: 100% of launches should have `raw_data` populated.

## Next Steps After Sync

1. **Verify API is using database**: Check API response for `"_source": "database"`
2. **Set up cron job**: Use `check_new_launches.js` to automatically sync new launches
3. **Monitor**: Check logs regularly for any sync errors

## Quick Reference Commands

```bash
# Full historical sync (recommended)
cd api
node scripts/fetch_historical_launches.js --verbose

# Test sync (10 launches)
node scripts/fetch_historical_launches.js --limit 10 --verbose

# Check new launches
node scripts/check_new_launches.js --verbose

# Verify in database
psql -U postgres -d tlp_db -c "SELECT COUNT(*), COUNT(raw_data) FROM launches;"
```

