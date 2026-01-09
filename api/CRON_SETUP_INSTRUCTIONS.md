# Automatic Launch Sync - Cron Job Setup Instructions

This guide will help you set up automatic syncing of upcoming and previous launches from the Space Devs API.

## Quick Setup (Recommended)

Run the setup script:

```bash
cd api
bash scripts/setup_auto_sync.sh
```

## Manual Setup

If the script doesn't work, you can set it up manually:

### Step 1: Open your crontab

```bash
crontab -e
```

### Step 2: Add this line (adjust paths as needed)

```cron
# Sync upcoming launches only every hour
0 * * * * cd /path/to/your/project/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --upcoming-only --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1
```

**Important:** Replace `/path/to/your/project/api` with your actual project path.

### Step 3: Find your Node.js path

```bash
which node
```

Use that path in the cron job instead of `/usr/bin/node` if different.

### Step 4: Verify the cron job

```bash
crontab -l
```

You should see your cron job listed.

## Schedule Options

### Every Hour (Recommended)
```cron
0 * * * * cd /path/to/api && node scripts/sync_upcoming_previous_launches.js --upcoming-only --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1
```

### Every 4 Hours
```cron
0 */4 * * * cd /path/to/api && node scripts/sync_upcoming_previous_launches.js --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1
```

### Twice Daily (3 AM and 3 PM)
```cron
0 3,15 * * * cd /path/to/api && node scripts/sync_upcoming_previous_launches.js --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1
```

### Every 2 Hours
```cron
0 */2 * * * cd /path/to/api && node scripts/sync_upcoming_previous_launches.js --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1
```

## Rate Limit Configuration

### Default (15 calls/hour)
```bash
--rate-limit 15
```

### Advanced Supporter (210 calls/hour)
```bash
--rate-limit 210
```

Or set via environment variable:
```bash
export SPACE_DEVS_RATE_LIMIT=210
```

## Monitoring

### View Logs
```bash
tail -f api/logs/upcoming_previous_sync.log
```

### Check Last Sync
```bash
tail -20 api/logs/upcoming_previous_sync.log
```

### Test Manually
```bash
cd api
node scripts/sync_upcoming_previous_launches.js --dry-run --verbose
```

## Troubleshooting

### Cron Job Not Running

1. **Check cron service is running:**
   ```bash
   # macOS
   sudo launchctl list | grep cron
   
   # Linux
   sudo systemctl status cron
   ```

2. **Check cron logs:**
   ```bash
   # macOS
   log show --predicate 'process == "cron"' --last 1h
   
   # Linux
   grep CRON /var/log/syslog
   ```

3. **Verify paths are correct:**
   - Use absolute paths in cron jobs
   - Check Node.js path with `which node`
   - Check script path exists

### Permission Issues

If you get "Operation not permitted" on macOS:

1. **Grant Full Disk Access to Terminal:**
   - System Settings → Privacy & Security → Full Disk Access
   - Add Terminal (or your terminal app)

2. **Or use sudo (not recommended for user crontab):**
   ```bash
   sudo crontab -e
   ```

### Database Connection Errors

Make sure your `.env` file has correct database credentials:
```bash
DB_HOST=your_host
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
```

### API Errors

Check your API key:
```bash
cat .env | grep SPACE_DEVS_API_KEY
```

## What Gets Synced

- **Upcoming Launches**: All launches with `launch_date >= NOW()`
- **Previous Launches**: Disabled by default (use `--previous-only` flag if needed)
- **Rate Limiting**: Automatically respects API limits
- **Database Updates**: Upserts existing launches, creates new ones

## Verification

After setting up, verify it's working:

1. **Wait for the next cron run** (or trigger manually)
2. **Check the logs:**
   ```bash
   tail -50 api/logs/upcoming_previous_sync.log
   ```
3. **Check database:**
   ```bash
   # Check recent updates
   psql -U your_user -d your_db -c "SELECT COUNT(*), MAX(updated_at) FROM launches WHERE updated_at > NOW() - INTERVAL '1 hour';"
   ```

## Removing the Cron Job

```bash
crontab -l | grep -v 'sync_upcoming_previous_launches.js' | crontab -
```

Or edit manually:
```bash
crontab -e
# Remove the line with sync_upcoming_previous_launches.js
```

