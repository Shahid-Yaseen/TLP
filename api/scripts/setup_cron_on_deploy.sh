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

# Set schedule: Every 1 minute (1 call per run × 60 runs/hour = 60 calls/hour)
CRON_SCHEDULE="* * * * *"  # Every 1 minute
INTERVAL_DESC="Every 1 minute (60 runs/hour, 1 API call per run)"

echo "  Schedule: $INTERVAL_DESC"
echo ""

# Remove existing cron jobs if they exist
if crontab -l 2>/dev/null | grep -q "sync_upcoming_previous_launches.js"; then
    echo "⚠️  Removing existing cron jobs..."
    crontab -l 2>/dev/null | grep -v "sync_upcoming_previous_launches.js" | crontab - || true
fi

# Build cron commands
# Upcoming launches: every 1 minute (60 calls/hour)
CRON_SCHEDULE_UPCOMING="* * * * *"
CRON_COMMAND_UPCOMING="cd $API_DIR && $NODE_PATH $CRON_SCRIPT --upcoming-only --rate-limit $RATE_LIMIT >> $CRON_LOG 2>&1"
CRON_ENTRY_UPCOMING="$CRON_SCHEDULE_UPCOMING $CRON_COMMAND_UPCOMING"

# Previous launches: every 10 minutes (6 calls/hour)
CRON_LOG_PREVIOUS="$LOG_DIR/previous_launches_sync.log"
CRON_SCHEDULE_PREVIOUS="*/10 * * * *"
CRON_COMMAND_PREVIOUS="cd $API_DIR && $NODE_PATH $CRON_SCRIPT --previous-only --rate-limit $RATE_LIMIT >> $CRON_LOG_PREVIOUS 2>&1"
CRON_ENTRY_PREVIOUS="$CRON_SCHEDULE_PREVIOUS $CRON_COMMAND_PREVIOUS"

# Add both cron jobs
(crontab -l 2>/dev/null; echo "$CRON_ENTRY_UPCOMING"; echo "$CRON_ENTRY_PREVIOUS") | crontab -

echo "✅ Cron jobs configured successfully!"
echo ""
echo "Cron job details:"
echo "  📅 Upcoming Launches: Every 1 minute (60 calls/hour)"
echo "  📅 Previous Launches: Every 10 minutes (6 calls/hour)"
echo ""
echo "To verify: crontab -l"
echo "To view logs:"
echo "  tail -f $CRON_LOG (upcoming)"
echo "  tail -f $CRON_LOG_PREVIOUS (previous)"

