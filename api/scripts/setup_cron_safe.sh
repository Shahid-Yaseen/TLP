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

# Calculate safe interval based on rate limit
if [ "$RATE_LIMIT" -ge 210 ]; then
    # Advanced Supporter: Can run every 2 minutes safely
    CRON_SCHEDULE="*/2 * * * *"
    INTERVAL_DESC="Every 2 minutes (Advanced Supporter - 210 calls/hour)"
elif [ "$RATE_LIMIT" -ge 100 ]; then
    # Higher tier: Every 3 minutes
    CRON_SCHEDULE="*/3 * * * *"
    INTERVAL_DESC="Every 3 minutes ($RATE_LIMIT calls/hour)"
else
    # Default: Every 5 minutes (safe for 15 calls/hour)
    # Each sync uses ~2-4 calls, so 5 min = 12 runs/hour = max 24-48 calls/hour
    # But the script's rate limiter will wait if needed
    CRON_SCHEDULE="*/5 * * * *"
    INTERVAL_DESC="Every 5 minutes ($RATE_LIMIT calls/hour - script will auto-wait if limit reached)"
fi

echo ""
echo "Selected schedule: $INTERVAL_DESC"
echo ""

# Remove existing cron job if it exists
if crontab -l 2>/dev/null | grep -q "sync_upcoming_previous_launches.js"; then
    echo "⚠️  Removing existing cron job..."
    crontab -l 2>/dev/null | grep -v "sync_upcoming_previous_launches.js" | crontab -
fi

# Build cron command
CRON_COMMAND="cd $API_DIR && $NODE_PATH $CRON_SCRIPT --rate-limit $RATE_LIMIT >> $CRON_LOG 2>&1"
CRON_ENTRY="$CRON_SCHEDULE $CRON_COMMAND"

# Add cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job configured successfully!"
echo ""
echo "Configuration:"
echo "  Schedule: $INTERVAL_DESC"
echo "  Rate Limit: $RATE_LIMIT calls/hour"
echo "  Script: $CRON_SCRIPT"
echo "  Logs: $CRON_LOG"
echo ""
echo "Safety Features:"
echo "  ✅ Built-in rate limiting - script will wait if limit is reached"
echo "  ✅ Rate limit state tracking across runs"
echo "  ✅ Automatic pagination handling"
echo ""
echo "The cron job will:"
echo "  - Sync upcoming launches from the API"
echo "  - Sync previous launches (last 30 days) from the API"
echo "  - Automatically wait if rate limit is reached"
echo "  - Keep your database up to date every few minutes"
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

