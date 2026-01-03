#!/bin/bash
# Setup Cron Job for Upcoming/Previous Launches Sync
#
# This script sets up a cron job to sync upcoming and previous launches
# from the Space Devs API while respecting rate limits.
#
# Usage:
#   bash scripts/setup_upcoming_previous_cron.sh

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$API_DIR")"

# Configuration
NODE_PATH=$(which node)
CRON_SCRIPT="$API_DIR/scripts/sync_upcoming_previous_launches.js"
LOG_DIR="$API_DIR/logs"
CRON_LOG="$LOG_DIR/upcoming_previous_sync.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Check if Node.js is available
if [ ! -f "$NODE_PATH" ]; then
    echo "❌ Error: Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if script exists
if [ ! -f "$CRON_SCRIPT" ]; then
    echo "❌ Error: Script not found at $CRON_SCRIPT"
    exit 1
fi

echo "Setting up cron job for upcoming/previous launches sync..."
echo "Script: $CRON_SCRIPT"
echo "Node: $NODE_PATH"
echo "Logs: $CRON_LOG"
echo ""

# Ask user for rate limit
read -p "Enter your API rate limit (default: 15, Advanced Supporter: 210): " RATE_LIMIT
RATE_LIMIT=${RATE_LIMIT:-15}

# Ask user for schedule
echo ""
echo "Select schedule:"
echo "1) Every hour (recommended for default rate limit)"
echo "2) Every 4 hours"
echo "3) Twice daily (3 AM and 3 PM)"
echo "4) Custom"
read -p "Enter choice [1-4]: " SCHEDULE_CHOICE

case $SCHEDULE_CHOICE in
    1)
        CRON_SCHEDULE="0 * * * *"
        SCHEDULE_DESC="Every hour"
        ;;
    2)
        CRON_SCHEDULE="0 */4 * * *"
        SCHEDULE_DESC="Every 4 hours"
        ;;
    3)
        CRON_SCHEDULE="0 3,15 * * *"
        SCHEDULE_DESC="Twice daily (3 AM and 3 PM)"
        ;;
    4)
        read -p "Enter custom cron schedule (e.g., '0 */2 * * *' for every 2 hours): " CRON_SCHEDULE
        SCHEDULE_DESC="Custom: $CRON_SCHEDULE"
        ;;
    *)
        CRON_SCHEDULE="0 * * * *"
        SCHEDULE_DESC="Every hour (default)"
        ;;
esac

# Ask if they want to sync both or separate
echo ""
read -p "Sync both upcoming and previous? [Y/n]: " SYNC_BOTH
SYNC_BOTH=${SYNC_BOTH:-Y}

if [[ "$SYNC_BOTH" =~ ^[Yy]$ ]]; then
    CRON_COMMAND="cd $API_DIR && $NODE_PATH $CRON_SCRIPT --rate-limit $RATE_LIMIT >> $CRON_LOG 2>&1"
else
    echo ""
    echo "You'll need to set up separate cron jobs for upcoming and previous."
    echo "Upcoming sync command:"
    echo "  cd $API_DIR && $NODE_PATH $CRON_SCRIPT --upcoming-only --rate-limit $RATE_LIMIT >> $LOG_DIR/upcoming_sync.log 2>&1"
    echo "Previous sync command:"
    echo "  cd $API_DIR && $NODE_PATH $CRON_SCRIPT --previous-only --rate-limit $RATE_LIMIT >> $LOG_DIR/previous_sync.log 2>&1"
    exit 0
fi

# Build cron entry
CRON_ENTRY="$CRON_SCHEDULE $CRON_COMMAND"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "sync_upcoming_previous_launches.js"; then
    echo "⚠️  Cron job already exists. Removing old entry..."
    crontab -l 2>/dev/null | grep -v "sync_upcoming_previous_launches.js" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo ""
echo "✅ Cron job added successfully!"
echo ""
echo "Configuration:"
echo "  Schedule: $SCHEDULE_DESC"
echo "  Rate Limit: $RATE_LIMIT calls/hour"
echo "  Logs: $CRON_LOG"
echo ""
echo "To view current cron jobs:"
echo "  crontab -l"
echo ""
echo "To remove this cron job:"
echo "  crontab -l | grep -v 'sync_upcoming_previous_launches.js' | crontab -"
echo ""
echo "To test the script manually:"
echo "  cd $API_DIR && $NODE_PATH $CRON_SCRIPT --dry-run --verbose"

