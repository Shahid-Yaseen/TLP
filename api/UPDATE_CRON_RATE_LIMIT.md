# Update Cron Job to Use Advanced Supporter Rate Limit (210 calls/hour)

## On Your Server - Run These Commands

### Step 1: Remove Old Cron Job

```bash
crontab -l | grep -v "sync_upcoming_previous_launches" | crontab -
```

### Step 2: Clear Rate Limit State (if needed)

```bash
rm -f /opt/tlp/api/.rate_limit_state.json
```

### Step 3: Add New Cron Job with 210 Rate Limit

```bash
(crontab -l 2>/dev/null; echo "*/2 * * * * cd /opt/tlp/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 210 >> logs/upcoming_previous_sync.log 2>&1") | crontab -
```

### Step 4: Verify

```bash
crontab -l
```

You should see:
```
*/2 * * * * cd /opt/tlp/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 210 >> logs/upcoming_previous_sync.log 2>&1
```

## All-in-One Command

```bash
crontab -l | grep -v "sync_upcoming_previous_launches" | crontab - && \
rm -f /opt/tlp/api/.rate_limit_state.json && \
(crontab -l 2>/dev/null; echo "*/2 * * * * cd /opt/tlp/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 210 >> logs/upcoming_previous_sync.log 2>&1") | crontab - && \
echo "✅ Updated to Advanced Supporter (210 calls/hour, runs every 2 minutes)" && \
crontab -l
```

## Test It

```bash
cd /opt/tlp/api
node scripts/sync_upcoming_previous_launches.js --rate-limit 210 --upcoming-only --verbose
```

