#!/bin/bash
# Quick script to check PostgreSQL status on server

echo "🔍 Checking PostgreSQL Status..."
echo ""

# Check if postgres process is running
echo "1. Checking for postgres processes:"
if pgrep -x postgres > /dev/null; then
    echo "   ✅ PostgreSQL processes are running"
    ps aux | grep postgres | grep -v grep | head -5
else
    echo "   ❌ No PostgreSQL processes found"
fi

echo ""

# Check if port 5432 is listening
echo "2. Checking if port 5432 is listening:"
if sudo netstat -tulpn | grep -q ":5432" || sudo ss -tulpn | grep -q ":5432"; then
    echo "   ✅ Port 5432 is listening"
    sudo netstat -tulpn | grep 5432 || sudo ss -tulpn | grep 5432
else
    echo "   ❌ Port 5432 is NOT listening"
fi

echo ""

# Check PostgreSQL cluster status
echo "3. Checking PostgreSQL cluster status:"
if sudo systemctl status postgresql@* 2>/dev/null | grep -q "active (running)"; then
    echo "   ✅ PostgreSQL cluster is running"
    sudo systemctl status postgresql@* --no-pager | head -10
else
    echo "   ⚠️  Checking for PostgreSQL clusters..."
    sudo systemctl list-units | grep postgresql
fi

echo ""

# Try to connect
echo "4. Testing database connection:"
if sudo -u postgres psql -c "SELECT version();" 2>/dev/null | grep -q PostgreSQL; then
    echo "   ✅ Can connect to PostgreSQL"
    sudo -u postgres psql -c "SELECT version();" | head -1
else
    echo "   ❌ Cannot connect to PostgreSQL"
    echo "   Error details:"
    sudo -u postgres psql -c "SELECT version();" 2>&1 | head -3
fi

echo ""
echo "✅ Status check complete!"

