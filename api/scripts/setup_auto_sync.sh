#!/bin/bash
# Quick Setup Script for Automatic Launch Sync Cron Job
#
# This script automatically sets up a cron job to sync upcoming launches only
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

# Set up cron job for upcoming launches - runs every 1 minute (1 call per run × 60 runs/hour = 60 calls/hour)
CRON_SCHEDULE_UPCOMING="* * * * *"  # Every 1 minute
CRON_COMMAND_UPCOMING="cd $API_DIR && $NODE_PATH $CRON_SCRIPT --upcoming-only --rate-limit $RATE_LIMIT >> $CRON_LOG 2>&1"
CRON_ENTRY_UPCOMING="$CRON_SCHEDULE_UPCOMING $CRON_COMMAND_UPCOMING"

# Set up cron job for previous launches - runs every 10 minutes (1 call per run × 6 runs/hour = 6 calls/hour)
CRON_SCHEDULE_PREVIOUS="*/10 * * * *"  # Every 10 minutes
CRON_LOG_PREVIOUS="$LOG_DIR/previous_launches_sync.log"
CRON_COMMAND_PREVIOUS="cd $API_DIR && $NODE_PATH $CRON_SCRIPT --previous-only --rate-limit $RATE_LIMIT >> $CRON_LOG_PREVIOUS 2>&1"
CRON_ENTRY_PREVIOUS="$CRON_SCHEDULE_PREVIOUS $CRON_COMMAND_PREVIOUS"

# Remove existing cron jobs if they exist
if crontab -l 2>/dev/null | grep -q "sync_upcoming_previous_launches.js"; then
    echo "⚠️  Removing existing cron jobs..."
    crontab -l 2>/dev/null | grep -v "sync_upcoming_previous_launches.js" | crontab -
fi

# Add both cron jobs
(crontab -l 2>/dev/null; echo "$CRON_ENTRY_UPCOMING"; echo "$CRON_ENTRY_PREVIOUS") | crontab -

echo "✅ Cron job configured successfully!"
echo ""
echo "Configuration:"
echo ""
echo "📅 Upcoming Launches Cron:"
echo "  Schedule: Every 1 minute (60 runs per hour)"
echo "  Calls per run: 1 API call (list only)"
echo "  Total calls/hour: 60 calls (1 × 60 runs)"
echo "  Logs: $CRON_LOG"
echo ""
echo "📅 Previous Launches Cron:"
echo "  Schedule: Every 10 minutes (6 runs per hour)"
echo "  Calls per run: 1 API call (list only)"
echo "  Total calls/hour: 6 calls (1 × 6 runs)"
echo "  Logs: $CRON_LOG_PREVIOUS"
echo ""
echo "📊 Total API Calls:"
echo "  Upcoming: 60 calls/hour"
echo "  Previous: 6 calls/hour"
echo "  Details (next 2 days): ~5-10 calls/hour"
echo "  Grand Total: ~71-76 calls/hour"
echo "  Rate Limit: $RATE_LIMIT calls/hour"
echo ""
echo "The cron jobs will:"
echo "  ✅ Upcoming: Run every 1 minute, 1 API call per run"
echo "  ✅ Previous: Run every 10 minutes, 1 API call per run"
echo "  ✅ Fetch full details only for launches in next 2 days"
echo "  ✅ Respect rate limits automatically"
echo "  ✅ Keep your database up to date"
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

