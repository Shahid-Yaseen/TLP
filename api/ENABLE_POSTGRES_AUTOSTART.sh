#!/bin/bash
# Permanent fix: Enable PostgreSQL to always start on boot
# Run this once to prevent PostgreSQL from stopping after server reboots

echo "🔧 Enabling PostgreSQL to start automatically on boot..."
echo ""

# Find PostgreSQL version
if [ ! -d /etc/postgresql ]; then
    echo "❌ PostgreSQL not found. Installing..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
fi

PG_VERSION=$(ls -1 /etc/postgresql/ 2>/dev/null | head -1)

if [ -z "$PG_VERSION" ]; then
    echo "❌ Could not find PostgreSQL version"
    exit 1
fi

echo "✅ Found PostgreSQL version: $PG_VERSION"

# Service name
SERVICE_NAME="postgresql@${PG_VERSION}-main"
echo "Service: $SERVICE_NAME"
echo ""

# Check current status
echo "📋 Current status:"
if sudo systemctl is-enabled "$SERVICE_NAME" 2>/dev/null | grep -q enabled; then
    echo "   ✅ Already enabled for auto-start"
else
    echo "   ❌ NOT enabled for auto-start (this is the problem!)"
fi

if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "   ✅ Currently running"
else
    echo "   ❌ Currently NOT running"
fi

echo ""

# Enable and start
echo "🔧 Fixing..."
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl start "$SERVICE_NAME"

# Wait a moment
sleep 2

# Verify
echo ""
echo "✅ Verification:"
if sudo systemctl is-enabled "$SERVICE_NAME" | grep -q enabled; then
    echo "   ✅ Auto-start: ENABLED"
else
    echo "   ❌ Auto-start: FAILED"
    exit 1
fi

if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "   ✅ Status: RUNNING"
else
    echo "   ❌ Status: NOT RUNNING"
    echo "   Checking logs..."
    sudo journalctl -u "$SERVICE_NAME" -n 20 --no-pager
    exit 1
fi

# Also enable wrapper service
sudo systemctl enable postgresql 2>/dev/null || true

# Test connection
echo ""
echo "🧪 Testing connection..."
if sudo -u postgres psql -c "SELECT version();" &>/dev/null; then
    echo "   ✅ Database connection: SUCCESS"
    sudo -u postgres psql -c "SELECT version();" | head -1
else
    echo "   ⚠️  Database connection: FAILED (but service is running)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ PostgreSQL is now configured to ALWAYS start on boot!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "This means:"
echo "  • PostgreSQL will start automatically after server reboots"
echo "  • You won't see ECONNREFUSED errors after restarts"
echo "  • The database will always be available"
echo ""
echo "Next step: Restart your API"
echo "  pm2 restart tlp-api"

