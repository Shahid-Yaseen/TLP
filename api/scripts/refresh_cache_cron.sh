#!/bin/bash
# Satellite Cache Refresh Cron Script
# This script is designed to be run via cron for automated satellite data sync

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to API directory
cd "$API_DIR"

# Set environment
export NODE_ENV=production
export CELESTRAK_GROUP=${CELESTRAK_GROUP:-ACTIVE}  # Default to ACTIVE, can be overridden

# Log directory (create if it doesn't exist)
LOG_DIR="/var/log/tlp"
mkdir -p "$LOG_DIR"

# Log file
LOG_FILE="$LOG_DIR/satellite_cache_refresh.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Function to log with timestamp
log() {
    echo "[$DATE] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Starting satellite cache refresh..."
log "Group: $CELESTRAK_GROUP"
log "Working directory: $API_DIR"
log "=========================================="

# Run the refresh script
node scripts/refresh_satellite_cache.js >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    log "✅ Cache refresh completed successfully"
    log "=========================================="
else
    log "❌ Cache refresh failed with exit code $EXIT_CODE"
    log "=========================================="
    # Optionally send alert email or notification here
fi

# Rotate log if it gets too large (keep last 10MB)
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
    MAX_SIZE=$((10 * 1024 * 1024))  # 10MB
    
    if [ "$LOG_SIZE" -gt "$MAX_SIZE" ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        touch "$LOG_FILE"
        log "Log file rotated (size was ${LOG_SIZE} bytes)"
    fi
fi

exit $EXIT_CODE

