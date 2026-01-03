# Automatic Cron Job Setup on Server Deployment

The cron job for syncing launches is automatically set up when you deploy to the server.

## Automatic Setup

When you push to the server and run the setup, the cron job will be configured automatically.

### On Server Deployment

After deploying, run:

```bash
cd /path/to/your/api
npm run setup:cron
```

Or include it in your deployment script:

```bash
# In your deployment script (e.g., deploy.sh)
cd /path/to/api
npm install
npm run migrate
npm run setup:cron  # This sets up the cron job automatically
npm start
```

## What It Does

The `setup:cron` script:
- ✅ Automatically detects your rate limit (from `SPACE_DEVS_RATE_LIMIT` env var or defaults to 15)
- ✅ Sets appropriate schedule based on rate limit:
  - 15 calls/hour → Every 5 minutes
  - 210 calls/hour → Every 2 minutes
- ✅ Uses absolute paths (works on any server)
- ✅ Removes old cron jobs before adding new one
- ✅ Creates log directory automatically

## Environment Variable

Set your rate limit in `.env` or server environment:

```bash
SPACE_DEVS_RATE_LIMIT=15  # Default tier
# or
SPACE_DEVS_RATE_LIMIT=210  # Advanced Supporter
```

## Manual Setup (if needed)

If automatic setup doesn't work, you can run manually:

```bash
cd api
bash scripts/setup_cron_on_deploy.sh
```

## Verify on Server

```bash
# Check cron job is set
crontab -l | grep sync_upcoming_previous_launches

# View logs
tail -f api/logs/upcoming_previous_sync.log

# Check if it's running
ps aux | grep sync_upcoming_previous_launches
```

## Cron Job Details

- **Schedule**: Every 5 minutes (or 2-3 minutes for higher rate limits)
- **Script**: `scripts/sync_upcoming_previous_launches.js`
- **Logs**: `logs/upcoming_previous_sync.log`
- **Rate Limit**: Automatically respected (script waits if limit reached)

## Troubleshooting

### Cron job not running

1. Check cron service:
   ```bash
   # Linux
   sudo systemctl status cron
   
   # Check logs
   grep CRON /var/log/syslog
   ```

2. Verify paths in cron job:
   ```bash
   crontab -l
   # Make sure all paths are absolute
   ```

3. Test script manually:
   ```bash
   cd /path/to/api
   node scripts/sync_upcoming_previous_launches.js --dry-run
   ```

### Permission issues

Make sure the script is executable:
```bash
chmod +x scripts/setup_cron_on_deploy.sh
chmod +x scripts/sync_upcoming_previous_launches.js
```

