# Test Cron Job on Server

The log file doesn't exist yet because the cron hasn't run. Test it first:

## Step 1: Test Script Manually

```bash
cd /opt/tlp/api

# Test with dry-run first (no changes)
node scripts/sync_upcoming_previous_launches.js --dry-run --verbose

# If that works, run it for real
node scripts/sync_upcoming_previous_launches.js --verbose
```

This will:
- Create the log file
- Show you if there are any errors
- Verify the script works

## Step 2: Check Logs After Manual Run

```bash
tail -20 /opt/tlp/api/logs/upcoming_previous_sync.log
```

## Step 3: Wait for Cron to Run

The cron job runs every 5 minutes. To see when it will run next:

```bash
# Check current time
date

# Cron runs at: :00, :05, :10, :15, :20, :25, :30, :35, :40, :45, :50, :55
# So if it's 13:23 now, next run is at 13:25
```

## Step 4: Watch for Cron Execution

```bash
# In one terminal, watch the log file
tail -f /opt/tlp/api/logs/upcoming_previous_sync.log

# In another terminal, watch system logs
sudo tail -f /var/log/syslog | grep sync_upcoming_previous_launches
```

## Step 5: Verify Cron Job is Scheduled

```bash
# Check cron job is still there
crontab -l

# Check when cron will run next (check system time)
date
# Cron runs at minutes: 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
```

## Quick Test Command

Run this to test everything:

```bash
cd /opt/tlp/api && \
node scripts/sync_upcoming_previous_launches.js --upcoming-only --verbose && \
echo "" && \
echo "✅ Test complete! Check logs:" && \
tail -10 logs/upcoming_previous_sync.log
```

