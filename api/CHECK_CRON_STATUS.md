# How to Check if Cron Job is Working on Server

## Quick Check Commands

### 1. Check if Cron Job is Set Up

```bash
crontab -l | grep sync_upcoming_previous_launches
```

**Expected output:**
```
*/5 * * * * cd /path/to/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1
```

If you see this, the cron job is configured ✅

---

### 2. Check Cron Service is Running

```bash
# Linux
sudo systemctl status cron

# Or check if cron daemon is running
ps aux | grep cron | grep -v grep
```

**Expected:** Should show cron process running

---

### 3. Check Recent Logs

```bash
# View last 50 lines of sync log
tail -50 /path/to/api/logs/upcoming_previous_sync.log

# Watch logs in real-time
tail -f /path/to/api/logs/upcoming_previous_sync.log
```

**Look for:**
- `✅ Successfully synced X launches` - Good sign!
- `API Calls Made: X/15` - Shows rate limit tracking
- Timestamps showing recent activity

---

### 4. Check System Cron Logs

```bash
# Linux - Check system cron logs
sudo grep CRON /var/log/syslog | tail -20

# Or
sudo tail -50 /var/log/cron

# macOS - Check cron execution
log show --predicate 'process == "cron"' --last 1h | grep sync_upcoming
```

**Look for:** Entries showing your cron job executing

---

### 5. Check Database Updates

```bash
# Connect to database and check recent updates
psql -U your_db_user -d your_db_name -c "SELECT COUNT(*), MAX(updated_at) FROM launches WHERE updated_at > NOW() - INTERVAL '1 hour';"

# Check upcoming launches count
psql -U your_db_user -d your_db_name -c "SELECT COUNT(*) FROM launches WHERE launch_date >= NOW();"

# Check most recent synced launches
psql -U your_db_user -d your_db_name -c "SELECT name, launch_date, updated_at FROM launches WHERE updated_at > NOW() - INTERVAL '1 hour' ORDER BY updated_at DESC LIMIT 5;"
```

**Expected:** Should show recent updates within the last hour

---

### 6. Check Rate Limit State

```bash
# Check if rate limit tracking is working
cat /path/to/api/.rate_limit_state.json
```

**Expected:** JSON file with `calls` array showing recent API calls

---

### 7. Test Manually

```bash
cd /path/to/api

# Dry run (no changes)
node scripts/sync_upcoming_previous_launches.js --dry-run --verbose

# Real sync test
node scripts/sync_upcoming_previous_launches.js --verbose
```

**Expected:** Should show sync progress and success messages

---

## Complete Verification Script

Create this script on your server:

```bash
#!/bin/bash
# check_cron_status.sh

API_DIR="/path/to/api"  # Change this to your actual path

echo "=== CRON JOB STATUS CHECK ==="
echo ""

echo "1. Checking if cron job exists..."
if crontab -l 2>/dev/null | grep -q "sync_upcoming_previous_launches"; then
    echo "✅ Cron job is configured:"
    crontab -l | grep sync_upcoming_previous_launches
else
    echo "❌ Cron job NOT found in crontab"
fi
echo ""

echo "2. Checking if log file exists..."
if [ -f "$API_DIR/logs/upcoming_previous_sync.log" ]; then
    echo "✅ Log file exists"
    echo "   Last 5 lines:"
    tail -5 "$API_DIR/logs/upcoming_previous_sync.log"
else
    echo "❌ Log file not found at $API_DIR/logs/upcoming_previous_sync.log"
fi
echo ""

echo "3. Checking rate limit state..."
if [ -f "$API_DIR/.rate_limit_state.json" ]; then
    echo "✅ Rate limit state file exists"
    CALLS=$(cat "$API_DIR/.rate_limit_state.json" | grep -o '"calls"' | wc -l || echo "0")
    echo "   API calls tracked in state file"
else
    echo "⚠️  Rate limit state file not found (will be created on first run)"
fi
echo ""

echo "4. Checking last sync time..."
if [ -f "$API_DIR/logs/upcoming_previous_sync.log" ]; then
    LAST_SYNC=$(tail -1 "$API_DIR/logs/upcoming_previous_sync.log" | grep -o '[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}T[0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}' | head -1)
    if [ ! -z "$LAST_SYNC" ]; then
        echo "   Last sync: $LAST_SYNC"
    else
        echo "   Could not determine last sync time"
    fi
fi
echo ""

echo "5. Testing script manually (dry-run)..."
cd "$API_DIR"
if node scripts/sync_upcoming_previous_launches.js --dry-run 2>&1 | head -10; then
    echo "✅ Script is executable and working"
else
    echo "❌ Script test failed"
fi
echo ""

echo "=== CHECK COMPLETE ==="
```

---

## Troubleshooting

### Cron Job Not Running

1. **Check cron service:**
   ```bash
   sudo systemctl status cron  # Linux
   sudo launchctl list | grep cron  # macOS
   ```

2. **Check file permissions:**
   ```bash
   ls -la /path/to/api/scripts/sync_upcoming_previous_launches.js
   # Should be executable: -rwxr-xr-x
   ```

3. **Check paths in cron job:**
   ```bash
   crontab -l
   # Make sure all paths are absolute (start with /)
   ```

### No Logs Being Created

1. **Check log directory exists:**
   ```bash
   ls -la /path/to/api/logs/
   ```

2. **Check write permissions:**
   ```bash
   touch /path/to/api/logs/test.log
   # If this fails, fix permissions:
   chmod 755 /path/to/api/logs
   ```

### Script Fails in Cron but Works Manually

1. **Cron has limited environment - add to cron job:**
   ```cron
   */5 * * * * cd /path/to/api && /usr/bin/env PATH=/usr/bin:/bin:/usr/local/bin /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1
   ```

2. **Or source environment:**
   ```cron
   */5 * * * * . /path/to/.env && cd /path/to/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1
   ```

---

## Quick Status Check (One Command)

```bash
# Check everything at once
echo "Cron Job:" && crontab -l | grep sync_upcoming_previous_launches && echo "" && echo "Last Log Entry:" && tail -1 /path/to/api/logs/upcoming_previous_sync.log && echo "" && echo "Recent Database Updates:" && psql -U your_user -d your_db -c "SELECT COUNT(*) as recent_updates FROM launches WHERE updated_at > NOW() - INTERVAL '1 hour';"
```

---

## Expected Behavior

✅ **Working correctly if you see:**
- Cron job in `crontab -l`
- Log file being updated every 5 minutes
- Recent timestamps in logs
- Database shows recent `updated_at` timestamps
- Rate limit state file exists and updates

❌ **Not working if:**
- No cron job in crontab
- Log file doesn't exist or hasn't updated in hours
- Database `updated_at` is old
- Script fails when run manually

