# Upcoming/Previous Launches Sync Cron Job

This script syncs upcoming and previous launches from the Space Devs API to your database while respecting rate limits.

## Features

- ✅ Fetches upcoming launches using `/launch/upcoming/` endpoint
- ✅ Fetches previous launches using `/launch/previous/` endpoint
- ✅ Rate limiting to respect API limits (15 calls/hour default, 210 for Advanced Supporter)
- ✅ Automatic pagination handling
- ✅ Database sync with upsert logic
- ✅ Safe execution with dry-run mode

## Rate Limits

The Space Devs API has the following rate limits:
- **Default**: 15 calls per hour
- **Advanced Supporter**: 210 calls per hour

The script automatically tracks API calls and waits when the limit is reached.

## Usage

### Basic Usage

```bash
# Sync both upcoming and previous launches
node scripts/sync_upcoming_previous_launches.js

# Dry run (no changes)
node scripts/sync_upcoming_previous_launches.js --dry-run

# Verbose output
node scripts/sync_upcoming_previous_launches.js --verbose
```

### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Show what would be synced without making changes |
| `--verbose` | Show detailed progress information |
| `--rate-limit N` | Set custom rate limit (default: 15 calls/hour) |
| `--upcoming-only` | Only sync upcoming launches |
| `--previous-only` | Only sync previous launches |

### Examples

```bash
# Sync with custom rate limit (for Advanced Supporter)
node scripts/sync_upcoming_previous_launches.js --rate-limit 210

# Only sync upcoming launches
node scripts/sync_upcoming_previous_launches.js --upcoming-only

# Verbose dry run
node scripts/sync_upcoming_previous_launches.js --dry-run --verbose
```

## Environment Variables

You can set the rate limit via environment variable:

```bash
# In .env file
SPACE_DEVS_RATE_LIMIT=210  # For Advanced Supporter
```

## Cron Job Setup

### Option 1: Run Every Hour (Recommended)

This ensures the database stays updated while respecting rate limits:

```bash
# Edit crontab
crontab -e

# Add this line (runs every hour at minute 0)
0 * * * * cd /path/to/your/project/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js >> logs/upcoming_previous_sync.log 2>&1
```

### Option 2: Run Every 4 Hours

If you want to reduce frequency:

```bash
# Runs every 4 hours
0 */4 * * * cd /path/to/your/project/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js >> logs/upcoming_previous_sync.log 2>&1
```

### Option 3: Run Twice Daily

```bash
# Runs at 3 AM and 3 PM
0 3,15 * * * cd /path/to/your/project/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js >> logs/upcoming_previous_sync.log 2>&1
```

### Option 4: Separate Upcoming and Previous

You can run them separately at different times:

```bash
# Upcoming launches every 2 hours
0 */2 * * * cd /path/to/your/project/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --upcoming-only >> logs/upcoming_sync.log 2>&1

# Previous launches every 6 hours
0 */6 * * * cd /path/to/your/project/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --previous-only >> logs/previous_sync.log 2>&1
```

## Rate Limit Tracking

The script stores rate limit state in `.rate_limit_state.json` to track API calls across runs. This ensures you don't exceed limits even if the script runs multiple times.

## Logs

Logs are written to:
- Console output (if run manually)
- Log file (if run via cron)

Example log output:
```
[2026-01-01T12:00:00.000Z] ℹ️ 🚀 Starting Upcoming/Previous Launches Sync
[2026-01-01T12:00:00.100Z] ℹ️ Mode: LIVE SYNC
[2026-01-01T12:00:00.200Z] ℹ️ Rate Limit: 15 calls/hour
[2026-01-01T12:00:00.300Z] ✅ Database connection established
[2026-01-01T12:00:00.400Z] ℹ️ === UPCOMING LAUNCHES ===
[2026-01-01T12:00:01.000Z] ℹ️ Fetching upcoming launches from Space Devs API...
[2026-01-01T12:00:02.500Z] ✅ Fetched 50 upcoming launches (total: 50)
[2026-01-01T12:00:05.000Z] ✅ Total upcoming launches fetched: 50
```

## Monitoring

### Check if cron job is running:

```bash
crontab -l | grep sync_upcoming_previous_launches
```

### View recent logs:

```bash
tail -f api/logs/upcoming_previous_sync.log
```

### Check rate limit state:

```bash
cat api/.rate_limit_state.json
```

## Troubleshooting

### Rate Limit Errors

If you see rate limit warnings:
1. Check your API key tier (default vs Advanced Supporter)
2. Adjust `--rate-limit` or `SPACE_DEVS_RATE_LIMIT` environment variable
3. Increase time between cron runs

### Database Connection Errors

Ensure your `.env` file has correct database credentials:
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

Test API connectivity:
```bash
curl -H "Authorization: Token YOUR_API_KEY" https://ll.thespacedevs.com/2.3.0/launch/upcoming/?limit=1
```

## Best Practices

1. **Start with dry-run**: Always test with `--dry-run` first
2. **Monitor logs**: Check logs regularly to ensure sync is working
3. **Respect rate limits**: Don't run the script too frequently
4. **Use appropriate rate limit**: Set correct limit based on your API tier
5. **Separate logs**: Use different log files for different sync types if running separately

## Integration with Existing Sync

This script complements the existing `check_new_launches.js` script:
- **This script**: Focuses on upcoming/previous endpoints, respects rate limits
- **check_new_launches.js**: Checks for new launches in date ranges

You can run both scripts at different intervals for comprehensive coverage.

