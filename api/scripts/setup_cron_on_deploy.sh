#!/bin/bash
# Automatic Cron Setup for Server Deployment
# This script sets up the cron job automatically when deployed to the server
# It should be run as part of the deployment process

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
NODE_PATH=$(which node)
CRON_SCRIPT="$API_DIR/scripts/sync_upcoming_previous_launches.js"
LOG_DIR="$API_DIR/logs"
CRON_LOG="$LOG_DIR/upcoming_previous_sync.log"

# Get rate limit from environment variable or use default
RATE_LIMIT=${SPACE_DEVS_RATE_LIMIT:-210}  # Default: 210 (Advanced Supporter)

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Check if Node.js is available
if [ ! -f "$NODE_PATH" ]; then
    echo "❌ Error: Node.js not found at $NODE_PATH"
    echo "Trying to find node..."
    NODE_PATH=$(which node || echo "/usr/bin/node")
    if [ ! -f "$NODE_PATH" ]; then
        echo "❌ Error: Node.js not found. Please install Node.js first."
        exit 1
    fi
fi

# Check if script exists
if [ ! -f "$CRON_SCRIPT" ]; then
    echo "❌ Error: Script not found at $CRON_SCRIPT"
    exit 1
fi

echo "🚀 Setting up automatic launch sync cron job..."
echo "  API Directory: $API_DIR"
echo "  Node Path: $NODE_PATH"
echo "  Rate Limit: $RATE_LIMIT calls/hour"
echo "  Log File: $CRON_LOG"
echo ""

# Calculate safe interval based on rate limit
if [ "$RATE_LIMIT" -ge 210 ]; then
    # Advanced Supporter: Every 2 minutes
    CRON_SCHEDULE="*/2 * * * *"
    INTERVAL_DESC="Every 2 minutes"
elif [ "$RATE_LIMIT" -ge 100 ]; then
    # Higher tier: Every 3 minutes
    CRON_SCHEDULE="*/3 * * * *"
    INTERVAL_DESC="Every 3 minutes"
else
    # Default: Every 5 minutes (safe for 15 calls/hour)
    CRON_SCHEDULE="*/5 * * * *"
    INTERVAL_DESC="Every 5 minutes"
fi

echo "  Schedule: $INTERVAL_DESC"
echo ""

# Remove existing cron job if it exists
if crontab -l 2>/dev/null | grep -q "sync_upcoming_previous_launches.js"; then
    echo "⚠️  Removing existing cron job..."
    crontab -l 2>/dev/null | grep -v "sync_upcoming_previous_launches.js" | crontab - || true
fi

# Build cron command with absolute paths
CRON_COMMAND="cd $API_DIR && $NODE_PATH $CRON_SCRIPT --rate-limit $RATE_LIMIT >> $CRON_LOG 2>&1"
CRON_ENTRY="$CRON_SCHEDULE $CRON_COMMAND"

# Add cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job configured successfully!"
echo ""
echo "Cron job details:"
echo "  Schedule: $CRON_SCHEDULE ($INTERVAL_DESC)"
echo "  Command: $CRON_COMMAND"
echo ""
echo "To verify: crontab -l"
echo "To view logs: tail -f $CRON_LOG"

