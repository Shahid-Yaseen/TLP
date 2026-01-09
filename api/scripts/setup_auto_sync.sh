#!/bin/bash
# Quick Setup Script for Automatic Launch Sync Cron Job
#
# This script automatically sets up a cron job to sync upcoming and previous launches
# from the Space Devs API every hour.
#
# Usage:
#   bash scripts/setup_auto_sync.sh

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
NODE_PATH=$(which node)
CRON_SCRIPT="$API_DIR/scripts/sync_upcoming_previous_launches.js"
LOG_DIR="$API_DIR/logs"
CRON_LOG="$LOG_DIR/upcoming_previous_sync.log"
RATE_LIMIT=${SPACE_DEVS_RATE_LIMIT:-210}  # Default: 210 (Advanced Supporter), can be set via env var

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

echo "🚀 Setting up automatic launch sync cron job..."
echo ""

# Remove existing cron job if it exists
if crontab -l 2>/dev/null | grep -q "sync_upcoming_previous_launches.js"; then
    echo "⚠️  Removing existing cron job..."
    crontab -l 2>/dev/null | grep -v "sync_upcoming_previous_launches.js" | crontab -
fi

# Set up cron job to run every hour
CRON_SCHEDULE="0 * * * *"  # Every hour at minute 0
CRON_COMMAND="cd $API_DIR && $NODE_PATH $CRON_SCRIPT --rate-limit $RATE_LIMIT >> $CRON_LOG 2>&1"
CRON_ENTRY="$CRON_SCHEDULE $CRON_COMMAND"

# Add cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job configured successfully!"
echo ""
echo "Configuration:"
echo "  Schedule: Every hour (at minute 0)"
echo "  Rate Limit: $RATE_LIMIT calls/hour"
echo "  Script: $CRON_SCRIPT"
echo "  Logs: $CRON_LOG"
echo ""
echo "The cron job will:"
echo "  - Sync upcoming launches from the API"
echo "  - Sync previous launches (last 30 days) from the API"
echo "  - Respect rate limits automatically"
echo "  - Keep your database up to date"
echo ""
echo "To view cron jobs:"
echo "  crontab -l"
echo ""
echo "To view logs:"
echo "  tail -f $CRON_LOG"
echo ""
echo "To test manually:"
echo "  cd $API_DIR && $NODE_PATH $CRON_SCRIPT --dry-run --verbose"
echo ""
echo "To remove this cron job:"
echo "  crontab -l | grep -v 'sync_upcoming_previous_launches.js' | crontab -"

