# Production Satellite Data Sync Guide

This guide explains how to sync satellite data from CelesTrak to your production server.

## Overview

The satellite cache needs to be refreshed periodically to keep the 3D navigator data up-to-date. CelesTrak updates their data daily, so it's recommended to refresh the cache at least once per day.

## Prerequisites

1. Database connection configured in `.env`
2. `satellites_cache` table created (migration `021_satellites_cache.sql`)
3. Node.js and npm installed on production server

## Sync Methods

### Method 1: Manual Script Execution (Recommended for Initial Setup)

SSH into your production server and run:

```bash
cd /path/to/your/api
node scripts/refresh_satellite_cache.js
```

**For full dataset (10,000+ satellites):**
```bash
CELESTRAK_GROUP=ALL node scripts/refresh_satellite_cache.js
```

**For active satellites only (faster, ~5,000 satellites):**
```bash
CELESTRAK_GROUP=ACTIVE node scripts/refresh_satellite_cache.js
```

### Method 2: API Endpoint (For Remote Triggering)

You can trigger a cache refresh via API endpoint:

```bash
curl -X POST https://your-domain.com/api/satellites/refresh \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Note:** This endpoint should be protected with authentication. Currently it's open - you may want to add authentication middleware.

### Method 3: Automated Cron Job (Recommended for Production)

Set up a daily cron job to automatically refresh the cache:

#### Step 1: Create a wrapper script

Create `api/scripts/refresh_cache_cron.sh`:

```bash
#!/bin/bash
# Satellite Cache Refresh Cron Script

cd /path/to/your/api
export NODE_ENV=production
export CELESTRAK_GROUP=ACTIVE  # or ALL for full dataset

# Log to file
LOG_FILE="/var/log/tlp/satellite_cache_refresh.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting satellite cache refresh..." >> "$LOG_FILE"

node scripts/refresh_satellite_cache.js >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "[$DATE] Cache refresh completed successfully" >> "$LOG_FILE"
else
    echo "[$DATE] Cache refresh failed with exit code $EXIT_CODE" >> "$LOG_FILE"
fi
```

#### Step 2: Make script executable

```bash
chmod +x api/scripts/refresh_cache_cron.sh
```

#### Step 3: Add to crontab

```bash
crontab -e
```

Add this line to run daily at 3 AM (adjust time as needed):

```cron
0 3 * * * /path/to/your/api/scripts/refresh_cache_cron.sh
```

Or run every 6 hours:

```cron
0 */6 * * * /path/to/your/api/scripts/refresh_cache_cron.sh
```

### Method 4: PM2 Cron (If using PM2)

If you're using PM2 for process management, you can use PM2's cron feature:

```bash
pm2 install pm2-cron
```

Then add to your `ecosystem.config.js`:

```javascript
{
  name: 'satellite-cache-refresh',
  script: 'scripts/refresh_satellite_cache.js',
  cron_restart: '0 3 * * *', // Daily at 3 AM
  env: {
    NODE_ENV: 'production',
    CELESTRAK_GROUP: 'ACTIVE'
  }
}
```

## Environment Variables

Configure these in your production `.env`:

```env
# Database connection
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_DATABASE=your-db-name
DB_PASSWORD=your-db-password

# CelesTrak group (ACTIVE or ALL)
CELESTRAK_GROUP=ACTIVE  # Use ALL for full dataset (slower but complete)

# Node environment
NODE_ENV=production
```

## Performance Considerations

### ACTIVE vs ALL

- **ACTIVE**: ~5,000 satellites, faster sync (~2-5 minutes)
- **ALL**: ~10,000+ satellites, slower sync (~5-10 minutes)

For production, start with `ACTIVE` and switch to `ALL` if needed.

### Database Performance

- The script uses batch inserts (1000 records at a time)
- Ensure your database has sufficient connection pool size
- Monitor database load during refresh

### Network Considerations

- CelesTrak API can be slow during peak times
- Consider running refresh during off-peak hours
- The script will retry on network errors

## Monitoring

### Check Last Update Time

```sql
SELECT MAX(last_updated) as last_sync, COUNT(*) as total_satellites 
FROM satellites_cache;
```

### Check Sync Status

```sql
SELECT 
  status,
  COUNT(*) as count,
  MAX(last_updated) as last_updated
FROM satellites_cache
GROUP BY status;
```

### View Recent Errors

Check your application logs or the cron log file for any errors during sync.

## Troubleshooting

### Issue: Script fails with "ECONNREFUSED"

**Solution:** Check database connection settings in `.env`

### Issue: Script times out

**Solution:** 
- Use `ACTIVE` group instead of `ALL`
- Increase Node.js timeout: `NODE_OPTIONS="--max-old-space-size=4096" node scripts/refresh_satellite_cache.js`

### Issue: Out of memory

**Solution:**
- Process in smaller batches
- Use `ACTIVE` group
- Increase server memory or use swap

### Issue: CelesTrak API returns 429 (Rate Limit)

**Solution:**
- Wait and retry later
- Don't run multiple refreshes simultaneously
- Consider using a different CelesTrak endpoint if available

## Initial Production Setup Checklist

1. ✅ Run database migration: `021_satellites_cache.sql`
2. ✅ Set up environment variables in `.env`
3. ✅ Test manual refresh: `node scripts/refresh_satellite_cache.js`
4. ✅ Verify data in database: `SELECT COUNT(*) FROM satellites_cache;`
5. ✅ Set up automated cron job
6. ✅ Monitor first few automated runs
7. ✅ Set up log rotation for cron logs

## Security Notes

- The `/api/satellites/refresh` endpoint should be protected with authentication
- Don't expose database credentials in logs
- Use environment variables for all sensitive data
- Consider rate limiting the refresh endpoint

## Support

If you encounter issues:
1. Check application logs
2. Verify database connectivity
3. Test CelesTrak API access: `curl https://celestrak.org/NORAD/elements/gp.php?GROUP=ACTIVE&FORMAT=TLE`
4. Review error messages in the script output

