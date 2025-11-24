#!/bin/bash
# Setup Cron Job for Launch Sync
# 
# This script sets up a cron job to check for new launches every 10 minutes
# 
# Usage:
#   bash scripts/setup_cron.sh
# 
# Note: Make sure to run this from the api directory

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CRON_SCRIPT="$API_DIR/scripts/check_new_launches.js"
NODE_PATH=$(which node)

if [ -z "$NODE_PATH" ]; then
    echo "❌ Error: Node.js not found. Please install Node.js first."
    exit 1
fi

echo "Setting up cron job for launch sync..."
echo "Script: $CRON_SCRIPT"
echo "Node: $NODE_PATH"
echo ""

# Create log directory if it doesn't exist
LOG_DIR="$API_DIR/logs"
mkdir -p "$LOG_DIR"

# Cron job entry: Run every 10 minutes
# Format: minute hour day month weekday command
CRON_ENTRY="*/10 * * * * cd $API_DIR && $NODE_PATH $CRON_SCRIPT >> $LOG_DIR/cron_launch_sync.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "check_new_launches.js"; then
    echo "⚠️  Cron job already exists. Removing old entry..."
    crontab -l 2>/dev/null | grep -v "check_new_launches.js" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job added successfully!"
echo ""
echo "Cron job will run every 10 minutes"
echo "Logs will be written to: $LOG_DIR/cron_launch_sync.log"
echo ""
echo "To view current cron jobs:"
echo "  crontab -l"
echo ""
echo "To remove this cron job:"
echo "  crontab -l | grep -v 'check_new_launches.js' | crontab -"
echo ""
echo "To test the script manually:"
echo "  cd $API_DIR && $NODE_PATH $CRON_SCRIPT --verbose"

