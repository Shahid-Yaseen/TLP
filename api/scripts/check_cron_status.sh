#!/bin/bash
# Quick Status Check Script for Launch Sync Cron Job
# Run this on your server to verify cron job is working

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== CRON JOB STATUS CHECK ==="
echo ""

# 1. Check if cron job exists
echo "1️⃣  Checking if cron job is configured..."
if crontab -l 2>/dev/null | grep -q "sync_upcoming_previous_launches"; then
    echo "   ✅ Cron job is configured:"
    crontab -l | grep sync_upcoming_previous_launches | sed 's/^/   /'
else
    echo "   ❌ Cron job NOT found in crontab"
    echo "   Run: npm run setup:cron"
fi
echo ""

# 2. Check log file
echo "2️⃣  Checking log file..."
LOG_FILE="$API_DIR/logs/upcoming_previous_sync.log"
if [ -f "$LOG_FILE" ]; then
    echo "   ✅ Log file exists: $LOG_FILE"
    echo "   📄 Last 3 log entries:"
    tail -3 "$LOG_FILE" | sed 's/^/      /'
    
    # Check if log was updated recently (within last hour)
    if [ -f "$LOG_FILE" ]; then
        LAST_MODIFIED=$(stat -f "%m" "$LOG_FILE" 2>/dev/null || stat -c "%Y" "$LOG_FILE" 2>/dev/null || echo "0")
        NOW=$(date +%s)
        AGE=$((NOW - LAST_MODIFIED))
        if [ $AGE -lt 3600 ]; then
            echo "   ✅ Log was updated recently (within last hour)"
        else
            echo "   ⚠️  Log hasn't been updated in $((AGE / 60)) minutes"
        fi
    fi
else
    echo "   ⚠️  Log file not found: $LOG_FILE"
    echo "   (Will be created on first cron run)"
fi
echo ""

# 3. Check rate limit state
echo "3️⃣  Checking rate limit state..."
STATE_FILE="$API_DIR/.rate_limit_state.json"
if [ -f "$STATE_FILE" ]; then
    echo "   ✅ Rate limit state file exists"
    CALL_COUNT=$(cat "$STATE_FILE" 2>/dev/null | grep -o '"calls"' | wc -l | tr -d ' ' || echo "0")
    echo "   📊 API calls tracked in state file"
else
    echo "   ⚠️  Rate limit state file not found (will be created on first run)"
fi
echo ""

# 4. Check if script is executable
echo "4️⃣  Checking script permissions..."
SYNC_SCRIPT="$API_DIR/scripts/sync_upcoming_previous_launches.js"
if [ -f "$SYNC_SCRIPT" ]; then
    if [ -x "$SYNC_SCRIPT" ]; then
        echo "   ✅ Script is executable"
    else
        echo "   ⚠️  Script is not executable"
        echo "   Fix with: chmod +x $SYNC_SCRIPT"
    fi
else
    echo "   ❌ Script not found: $SYNC_SCRIPT"
fi
echo ""

# 5. Test script (dry-run)
echo "5️⃣  Testing script (dry-run)..."
cd "$API_DIR"
if node scripts/sync_upcoming_previous_launches.js --dry-run 2>&1 | head -5 > /dev/null 2>&1; then
    echo "   ✅ Script is working (dry-run successful)"
else
    echo "   ❌ Script test failed"
    echo "   Try running manually: node scripts/sync_upcoming_previous_launches.js --dry-run --verbose"
fi
echo ""

# 6. Check database connection (if possible)
echo "6️⃣  Checking database updates..."
if command -v psql &> /dev/null && [ ! -z "$DB_DATABASE" ]; then
    RECENT_UPDATES=$(psql -U "$DB_USER" -d "$DB_DATABASE" -t -c "SELECT COUNT(*) FROM launches WHERE updated_at > NOW() - INTERVAL '1 hour';" 2>/dev/null || echo "0")
    if [ ! -z "$RECENT_UPDATES" ] && [ "$RECENT_UPDATES" != "0" ]; then
        echo "   ✅ Database shows $RECENT_UPDATES recent updates (last hour)"
    else
        echo "   ⚠️  No recent database updates found"
    fi
else
    echo "   ⚠️  Cannot check database (psql not available or DB vars not set)"
fi
echo ""

# 7. Check cron service
echo "7️⃣  Checking cron service..."
if command -v systemctl &> /dev/null; then
    if systemctl is-active --quiet cron 2>/dev/null || systemctl is-active --quiet crond 2>/dev/null; then
        echo "   ✅ Cron service is running"
    else
        echo "   ⚠️  Cron service status unknown (systemctl not available or different system)"
    fi
elif ps aux | grep -q "[c]ron"; then
    echo "   ✅ Cron daemon is running"
else
    echo "   ⚠️  Cannot determine cron service status"
fi
echo ""

echo "=== SUMMARY ==="
echo ""
if crontab -l 2>/dev/null | grep -q "sync_upcoming_previous_launches" && [ -f "$LOG_FILE" ]; then
    echo "✅ Cron job appears to be set up correctly"
    echo ""
    echo "To monitor in real-time:"
    echo "  tail -f $LOG_FILE"
    echo ""
    echo "To check when it last ran:"
    echo "  tail -20 $LOG_FILE | grep 'Sync Complete'"
else
    echo "⚠️  Cron job may not be set up correctly"
    echo ""
    echo "To set it up:"
    echo "  cd $API_DIR"
    echo "  npm run setup:cron"
fi

