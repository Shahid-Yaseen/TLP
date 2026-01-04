#!/bin/bash
# Script to start PostgreSQL and fix database connection issues

echo "🔧 Starting PostgreSQL Database..."
echo ""

# Find PostgreSQL version
echo "1. Finding PostgreSQL installation..."
if [ -d /etc/postgresql ]; then
    PG_VERSION=$(ls -1 /etc/postgresql | head -1)
    echo "   ✅ Found PostgreSQL version: $PG_VERSION"
else
    echo "   ❌ PostgreSQL not found in /etc/postgresql"
    echo "   Installing PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    PG_VERSION=$(ls -1 /etc/postgresql | head -1)
fi

# Find cluster name (usually 'main')
CLUSTER_NAME="main"
if [ -d "/etc/postgresql/$PG_VERSION/$CLUSTER_NAME" ]; then
    echo "   ✅ Found cluster: $CLUSTER_NAME"
else
    CLUSTER_NAME=$(ls -1 /etc/postgresql/$PG_VERSION | head -1)
    echo "   ✅ Found cluster: $CLUSTER_NAME"
fi

echo ""

# Check if cluster is running
echo "2. Checking cluster status..."
SERVICE_NAME="postgresql@${PG_VERSION}-${CLUSTER_NAME}"
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "   ✅ Cluster is already running"
else
    echo "   ❌ Cluster is not running"
    echo "   Starting cluster: $SERVICE_NAME"
    sudo systemctl start "$SERVICE_NAME"
    sudo systemctl enable "$SERVICE_NAME"
    sleep 3
    
    if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
        echo "   ✅ Cluster started successfully"
    else
        echo "   ❌ Failed to start cluster"
        echo "   Checking logs..."
        sudo journalctl -u "$SERVICE_NAME" -n 20 --no-pager
        exit 1
    fi
fi

echo ""

# Verify port 5432 is listening
echo "3. Verifying port 5432 is listening..."
if sudo netstat -tulpn | grep -q ":5432" || sudo ss -tulpn | grep -q ":5432"; then
    echo "   ✅ Port 5432 is listening"
    sudo netstat -tulpn | grep 5432 || sudo ss -tulpn | grep 5432
else
    echo "   ⚠️  Port 5432 is not listening yet, waiting..."
    sleep 5
    if sudo netstat -tulpn | grep -q ":5432"; then
        echo "   ✅ Port 5432 is now listening"
    else
        echo "   ❌ Port 5432 still not listening"
        echo "   Check PostgreSQL logs: sudo journalctl -u $SERVICE_NAME -n 50"
    fi
fi

echo ""

# Test connection
echo "4. Testing database connection..."
if sudo -u postgres psql -c "SELECT version();" &>/dev/null; then
    echo "   ✅ Database connection successful"
    sudo -u postgres psql -c "SELECT version();" | head -1
else
    echo "   ❌ Database connection failed"
    echo "   Attempting to start PostgreSQL manually..."
    sudo -u postgres /usr/lib/postgresql/$PG_VERSION/bin/pg_ctl -D /var/lib/postgresql/$PG_VERSION/$CLUSTER_NAME start
    sleep 3
    if sudo -u postgres psql -c "SELECT version();" &>/dev/null; then
        echo "   ✅ Database connection successful after manual start"
    else
        echo "   ❌ Still cannot connect"
        exit 1
    fi
fi

echo ""

# Check .env file
echo "5. Checking database configuration..."
if [ -f /opt/tlp/api/.env ]; then
    echo "   ✅ .env file exists"
    cd /opt/tlp/api
    source .env
    echo "   DB_HOST: ${DB_HOST:-localhost}"
    echo "   DB_PORT: ${DB_PORT:-5432}"
    echo "   DB_USER: $DB_USER"
    echo "   DB_DATABASE: $DB_DATABASE"
    
    # Test connection with app credentials
    if PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -d $DB_DATABASE -c "SELECT 1;" &>/dev/null; then
        echo "   ✅ Application database connection successful"
    else
        echo "   ⚠️  Application database connection failed"
        echo "   Database or user may not exist"
    fi
else
    echo "   ⚠️  .env file not found at /opt/tlp/api/.env"
fi

echo ""
echo "✅ PostgreSQL should now be running!"
echo ""
echo "Next step: Restart the API"
echo "  pm2 restart tlp-api"
echo "  pm2 logs tlp-api --lines 20"

