#!/bin/bash
# Quick setup for 5-minute interval (safe for 15 calls/hour rate limit)

API_DIR="/Users/muhammadshahid/Desktop/projects/TLP_P2/TLP/api"
NODE_PATH="/opt/homebrew/opt/node@20/bin/node"
CRON_SCRIPT="$API_DIR/scripts/sync_upcoming_previous_launches.js"
LOG_DIR="$API_DIR/logs"
CRON_LOG="$LOG_DIR/upcoming_previous_sync.log"
RATE_LIMIT=15

# Remove existing if any
crontab -l 2>/dev/null | grep -v "sync_upcoming_previous_launches.js" | crontab - 2>/dev/null || true

# Add new cron job (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * cd $API_DIR && $NODE_PATH $CRON_SCRIPT --rate-limit $RATE_LIMIT >> $CRON_LOG 2>&1") | crontab -

echo "✅ Cron job set to run every 5 minutes"
echo "Rate limit: $RATE_LIMIT calls/hour"
echo "The script will automatically wait if rate limit is reached"
echo ""
echo "To verify: crontab -l"
echo "To view logs: tail -f $CRON_LOG"
