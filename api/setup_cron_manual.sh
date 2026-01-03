#!/bin/bash
# Manual Cron Setup - Copy and paste the output

API_DIR="/Users/muhammadshahid/Desktop/projects/TLP_P2/TLP/api"
NODE_PATH="/opt/homebrew/opt/node@20/bin/node"
CRON_SCRIPT="$API_DIR/scripts/sync_upcoming_previous_launches.js"
LOG_DIR="$API_DIR/logs"
CRON_LOG="$LOG_DIR/upcoming_previous_sync.log"
RATE_LIMIT=15

echo "=== CRON JOB COMMAND ==="
echo ""
echo "Run this command to add the cron job:"
echo ""
echo "crontab -e"
echo ""
echo "Then add this line:"
echo ""
echo "0 * * * * cd $API_DIR && $NODE_PATH $CRON_SCRIPT --rate-limit $RATE_LIMIT >> $CRON_LOG 2>&1"
echo ""
echo "=== OR RUN THIS COMMAND ==="
echo ""
echo "(crontab -l 2>/dev/null; echo '0 * * * * cd $API_DIR && $NODE_PATH $CRON_SCRIPT --rate-limit $RATE_LIMIT >> $CRON_LOG 2>&1') | crontab -"
echo ""
