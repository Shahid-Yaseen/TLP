# Why PostgreSQL Stops Working (And How to Fix It Permanently)

## Why This Happens

PostgreSQL can stop working for several reasons, even if it was working perfectly before:

### 1. **Server Reboot** (Most Common)
When your Digital Ocean droplet reboots (updates, maintenance, or manual restart), services need to be **enabled** to start automatically. 

**The Problem:**
- The wrapper service `postgresql.service` might be enabled
- But the actual cluster service `postgresql@14-main` (or your version) might NOT be enabled
- So after reboot, PostgreSQL doesn't start automatically

**Check if enabled:**
```bash
sudo systemctl is-enabled postgresql@14-main
# Should return: enabled
# If it returns: disabled - that's your problem!
```

### 2. **PostgreSQL Cluster Service Not Enabled**
PostgreSQL uses a two-tier service system:
- `postgresql.service` - Wrapper service (just manages clusters)
- `postgresql@X-main.service` - Actual database server (this needs to be enabled)

**The wrapper shows "active (exited)"** which means it ran but didn't start the actual database.

### 3. **Manual Stop**
Someone might have stopped PostgreSQL:
```bash
sudo systemctl stop postgresql@14-main
```

### 4. **Service Crash**
PostgreSQL might have crashed due to:
- Out of memory
- Disk space full
- Configuration error
- Corrupted data

### 5. **System Updates**
System updates might have:
- Changed service configurations
- Disabled auto-start
- Changed PostgreSQL version

## How to Fix It Permanently

### Step 1: Find Your PostgreSQL Version
```bash
ls /etc/postgresql/
# Output: 14, 15, or 16 (your version)
```

### Step 2: Enable and Start the Cluster Service
```bash
# Replace 14 with your version
VERSION=14  # Change this to your version

# Start the service
sudo systemctl start postgresql@${VERSION}-main

# Enable it to start on boot (THIS IS CRITICAL!)
sudo systemctl enable postgresql@${VERSION}-main

# Verify it's enabled
sudo systemctl is-enabled postgresql@${VERSION}-main
# Should return: enabled
```

### Step 3: Verify It's Running
```bash
# Check status
sudo systemctl status postgresql@${VERSION}-main

# Check if port is listening
sudo netstat -tulpn | grep 5432

# Test connection
sudo -u postgres psql -c "SELECT version();"
```

## Permanent Fix Script

Run this once to ensure PostgreSQL always starts on boot:

```bash
#!/bin/bash
# Permanent fix for PostgreSQL auto-start

echo "🔧 Setting up PostgreSQL to always start on boot..."

# Find PostgreSQL version
PG_VERSION=$(ls -1 /etc/postgresql/ | head -1)
echo "Found PostgreSQL version: $PG_VERSION"

# Enable and start the cluster service
SERVICE_NAME="postgresql@${PG_VERSION}-main"
echo "Service name: $SERVICE_NAME"

# Start the service
sudo systemctl start "$SERVICE_NAME"
echo "✅ Started PostgreSQL cluster"

# Enable it to start on boot (CRITICAL!)
sudo systemctl enable "$SERVICE_NAME"
echo "✅ Enabled PostgreSQL to start on boot"

# Verify
if sudo systemctl is-enabled "$SERVICE_NAME" | grep -q enabled; then
    echo "✅ PostgreSQL is now configured to start automatically on boot"
else
    echo "❌ Failed to enable auto-start"
    exit 1
fi

# Also enable the wrapper service (for good measure)
sudo systemctl enable postgresql
echo "✅ Enabled PostgreSQL wrapper service"

# Verify it's running
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ PostgreSQL is currently running"
else
    echo "⚠️  PostgreSQL is not running, starting now..."
    sudo systemctl start "$SERVICE_NAME"
    sleep 2
    if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
        echo "✅ PostgreSQL started successfully"
    else
        echo "❌ Failed to start PostgreSQL"
        exit 1
    fi
fi

echo ""
echo "✅ PostgreSQL is now configured to always start on boot!"
echo "   It will automatically start after server reboots."
```

## Quick One-Liner Fix

```bash
# Find version and enable auto-start
ls /etc/postgresql/ | head -1 | xargs -I {} bash -c 'sudo systemctl start postgresql@{}-main && sudo systemctl enable postgresql@{}-main && echo "✅ PostgreSQL {} enabled to start on boot"'
```

## Prevention: Add to Deployment Script

Add this to your deployment script to ensure PostgreSQL is always enabled:

```bash
# In your deployment script, add:
PG_VERSION=$(ls -1 /etc/postgresql/ 2>/dev/null | head -1)
if [ -n "$PG_VERSION" ]; then
    sudo systemctl enable postgresql@${PG_VERSION}-main
    sudo systemctl start postgresql@${PG_VERSION}-main
fi
```

## Check What Happened

To see why PostgreSQL stopped, check the logs:

```bash
# Check when it stopped
sudo journalctl -u postgresql@14-main --since "1 week ago" | grep -i "stop\|fail\|error"

# Check system boot logs
sudo journalctl -b | grep -i postgres

# Check if there was a reboot
last reboot
```

## Summary

**Most likely cause:** Server reboot + PostgreSQL cluster service not enabled for auto-start.

**Quick fix:**
```bash
VERSION=$(ls -1 /etc/postgresql/ | head -1)
sudo systemctl enable postgresql@${VERSION}-main
sudo systemctl start postgresql@${VERSION}-main
```

**Verify:**
```bash
sudo systemctl is-enabled postgresql@${VERSION}-main
# Should return: enabled
```

