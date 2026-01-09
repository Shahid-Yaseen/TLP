#!/bin/bash
# Safe Cron Setup - Runs every 5 minutes with rate limit protection
#
# This script sets up a cron job that runs frequently but respects API rate limits.
# The sync script has built-in rate limiting that will wait if limits are reached.
#
# Usage:
#   bash scripts/setup_cron_safe.sh

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
NODE_PATH=$(which node)
CRON_SCRIPT="$API_DIR/scripts/sync_upcoming_previous_launches.js"
LOG_DIR="$API_DIR/logs"
CRON_LOG="$LOG_DIR/upcoming_previous_sync.log"
RATE_LIMIT=${SPACE_DEVS_RATE_LIMIT:-15}  # Default: 15, can be set via env var

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

echo "🚀 Setting up automatic launch sync cron job (safe mode)..."
echo ""

# Ask user for rate limit
read -p "Enter your API rate limit (default: 15, Advanced Supporter: 210): " USER_RATE_LIMIT
RATE_LIMIT=${USER_RATE_LIMIT:-$RATE_LIMIT}

# Set schedule: Every 1 minute (1 call per run × 60 runs/hour = 60 calls/hour)
CRON_SCHEDULE="* * * * *"  # Every 1 minute
INTERVAL_DESC="Every 1 minute (60 runs/hour, 1 API call per run)"

echo ""
echo "Selected schedule: $INTERVAL_DESC"
echo ""

# Remove existing cron jobs if they exist
if crontab -l 2>/dev/null | grep -q "sync_upcoming_previous_launches.js"; then
    echo "⚠️  Removing existing cron jobs..."
    crontab -l 2>/dev/null | grep -v "sync_upcoming_previous_launches.js" | crontab -
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
echo "Configuration:"
echo "  📅 Upcoming Launches: Every 1 minute (60 calls/hour)"
echo "  📅 Previous Launches: Every 10 minutes (6 calls/hour)"
echo "  Rate Limit: $RATE_LIMIT calls/hour"
echo "  Script: $CRON_SCRIPT"
echo "  Logs: $CRON_LOG (upcoming), $CRON_LOG_PREVIOUS (previous)"
echo ""
echo "Safety Features:"
echo "  ✅ Built-in rate limiting - script will wait if limit is reached"
echo "  ✅ Rate limit state tracking across runs"
echo "  ✅ Separate counts for upcoming and previous"
echo ""
echo "The cron jobs will:"
echo "  - Upcoming: Sync every 1 minute (1 API call per run)"
echo "  - Previous: Sync every 10 minutes (1 API call per run)"
echo "  - Details: Only for launches in next 2 days"
echo "  - Automatically wait if rate limit is reached"
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

