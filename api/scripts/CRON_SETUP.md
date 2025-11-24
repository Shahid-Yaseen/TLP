# Launch Sync Cron Job Setup

This guide explains how to set up a cron job to automatically check for new launches every 10 minutes.

## Overview

The cron job runs `check_new_launches.js` every 10 minutes to:
1. Fetch recent launches from the Space Devs API (last 7 days + upcoming)
2. Compare with existing database records
3. Fetch detailed data for any new launches
4. Save new launches to the database

## Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
cd api
bash scripts/setup_cron.sh
```

This will automatically:
- Create the cron job entry
- Set up log directory
- Configure logging

### Option 2: Manual Setup

1. **Edit crontab:**
   ```bash
   crontab -e
   ```

2. **Add the following line:**
   ```bash
   */10 * * * * cd /path/to/your/project/api && /usr/bin/node scripts/check_new_launches.js >> logs/cron_launch_sync.log 2>&1
   ```
   
   Replace `/path/to/your/project/api` with your actual API directory path.
   Replace `/usr/bin/node` with your Node.js path (find it with `which node`).

3. **Create logs directory:**
   ```bash
   mkdir -p api/logs
   ```

## Verify Setup

### Check if cron job is installed:
```bash
crontab -l | grep check_new_launches
```

### Test the script manually:
```bash
cd api
node scripts/check_new_launches.js --verbose
```

### View cron logs:
```bash
tail -f api/logs/cron_launch_sync.log
```

## Cron Job Details

- **Frequency**: Every 10 minutes (`*/10 * * * *`)
- **Script**: `api/scripts/check_new_launches.js`
- **Logs**: `api/logs/cron_launch_sync.log`
- **Checks**: Last 7 days of launches + all upcoming launches

## Script Options

The script supports several options:

```bash
# Dry run (test without making changes)
node scripts/check_new_launches.js --dry-run

# Verbose output
node scripts/check_new_launches.js --verbose

# Check different time range (e.g., last 14 days)
node scripts/check_new_launches.js --days 14

# Combine options
node scripts/check_new_launches.js --verbose --days 14
```

## Monitoring

### Check recent cron execution:
```bash
tail -50 api/logs/cron_launch_sync.log
```

### Check if cron is running:
```bash
ps aux | grep cron
```

### View system cron logs (Linux):
```bash
# Ubuntu/Debian
grep CRON /var/log/syslog

# CentOS/RHEL
grep CRON /var/log/cron
```

## Troubleshooting

### Cron job not running?

1. **Check cron service:**
   ```bash
   # Ubuntu/Debian
   sudo service cron status
   
   # macOS
   sudo launchctl list | grep cron
   ```

2. **Check script permissions:**
   ```bash
   chmod +x api/scripts/check_new_launches.js
   ```

3. **Check Node.js path:**
   ```bash
   which node
   # Use this path in your cron entry
   ```

4. **Check environment variables:**
   - Cron jobs run with minimal environment
   - Make sure `.env` file is in the API directory
   - Or set environment variables in the cron entry

### Database connection errors?

- Ensure database credentials are in `.env` file
- Check database is accessible from the server
- Verify network connectivity

### API rate limiting?

- The script includes delays between requests
- If you hit rate limits, increase delays in the script
- Consider reducing the `--days` parameter

## Removing the Cron Job

```bash
# Remove the cron job
crontab -l | grep -v 'check_new_launches.js' | crontab -

# Verify removal
crontab -l
```

## Production Considerations

1. **Log Rotation**: Set up log rotation to prevent log files from growing too large
2. **Error Alerts**: Consider adding email notifications for errors
3. **Monitoring**: Set up monitoring to alert if the cron job fails
4. **Backup**: Ensure database backups are running regularly

## Example Log Output

```
[2025-11-22T19:45:00.000Z] ℹ️ 🚀 Starting New Launches Check
[2025-11-22T19:45:00.100Z] ℹ️ Mode: LIVE SYNC
[2025-11-22T19:45:00.200Z] ✅ Database connection established
[2025-11-22T19:45:00.500Z] ℹ️ Found 432 existing launches in database
[2025-11-22T19:45:01.000Z] ℹ️ Fetching recent launches from Space Devs API...
[2025-11-22T19:45:02.500Z] ✅ Fetched 15 upcoming launches
[2025-11-22T19:45:03.000Z] ✅ Fetched 8 recent launches
[2025-11-22T19:45:03.100Z] ℹ️ Total unique launches to check: 23
[2025-11-22T19:45:05.000Z] ✅ New launch synced: Falcon 9 Block 5 | Starlink Group 6-79
[2025-11-22T19:45:10.000Z] 📊 Check Complete
[2025-11-22T19:45:10.100Z] ℹ️    Checked: 23 launches
[2025-11-22T19:45:10.200Z] ✅    New: 1 launches
[2025-11-22T19:45:10.300Z] ℹ️    Updated: 0 launches
[2025-11-22T19:45:10.400Z] ✅ Successfully processed 1 launches
```

