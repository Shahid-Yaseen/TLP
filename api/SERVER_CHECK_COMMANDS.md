# Server Commands to Check Cron Job Status

Run these commands on your server to verify the cron job is working.

## Quick Status Check

```bash
# 1. Check if cron job is configured
crontab -l | grep sync_upcoming_previous_launches

# 2. Check recent logs
tail -20 /opt/tlp/api/logs/upcoming_previous_sync.log

# 3. Check if script exists and is executable
ls -la /opt/tlp/api/scripts/sync_upcoming_previous_launches.js

# 4. Test script manually
cd /opt/tlp/api && node scripts/sync_upcoming_previous_launches.js --dry-run --verbose
```

## Detailed Check

### Check Cron Job Configuration
```bash
crontab -l
```

**Look for a line like:**
```
*/5 * * * * cd /opt/tlp/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1
```

### Check Logs
```bash
# View last 50 lines
tail -50 /opt/tlp/api/logs/upcoming_previous_sync.log

# Watch in real-time (wait 5 minutes to see if it runs)
tail -f /opt/tlp/api/logs/upcoming_previous_sync.log
```

### Check Database Updates
```bash
# Connect to database and check recent updates
psql -U tlp_user -d tlp_db -c "SELECT COUNT(*), MAX(updated_at) FROM launches WHERE updated_at > NOW() - INTERVAL '1 hour';"

# Check upcoming launches
psql -U tlp_user -d tlp_db -c "SELECT COUNT(*) FROM launches WHERE launch_date >= NOW();"
```

### Check Rate Limit State
```bash
cat /opt/tlp/api/.rate_limit_state.json
```

### Check System Cron Logs for Your Job
```bash
sudo grep "sync_upcoming_previous_launches" /var/log/syslog | tail -20
```

## If Cron Job is NOT Set Up

Run this on your server:

```bash
cd /opt/tlp/api
npm run setup:cron
```

Or manually:

```bash
cd /opt/tlp/api
bash scripts/setup_cron_on_deploy.sh
```

## Test Manually First

Before checking cron, test the script works:

```bash
cd /opt/tlp/api
node scripts/sync_upcoming_previous_launches.js --upcoming-only --verbose
```

This will show you if there are any errors.

