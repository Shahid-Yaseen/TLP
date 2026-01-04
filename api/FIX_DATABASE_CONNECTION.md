# Fix Database Connection Error (ECONNREFUSED)

## Problem
The API is getting `ECONNREFUSED` errors when trying to connect to PostgreSQL on port 5432. This means PostgreSQL is either:
- Not installed
- Not running
- Not configured correctly
- Blocked by firewall

## Quick Fix Commands (Run on Server)

### Step 1: Check if PostgreSQL is Installed
```bash
# Check if PostgreSQL is installed
which psql
psql --version

# If not installed, install it:
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
```

### Step 2: Check if PostgreSQL is Running
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if PostgreSQL is listening on port 5432
sudo netstat -tulpn | grep 5432
# Or
sudo ss -tulpn | grep 5432
```

### Step 3: Start PostgreSQL
```bash
# Start PostgreSQL service
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql

# Verify it's running
sudo systemctl status postgresql
```

### Step 4: Check Database Configuration
```bash
# Check .env file
cd /opt/tlp/api
cat .env | grep DB_

# Verify the database exists
sudo -u postgres psql -c "\l" | grep tlp_db
```

### Step 5: Test Database Connection
```bash
# Test connection as postgres user
sudo -u postgres psql -c "SELECT version();"

# Test connection with your DB credentials
cd /opt/tlp/api
source .env
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DATABASE -c "SELECT 1;"
```

## Complete Troubleshooting Script

Run this on your server to diagnose and fix:

```bash
#!/bin/bash
echo "🔍 Diagnosing PostgreSQL Connection Issue..."
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed"
    echo "Installing PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
else
    echo "✅ PostgreSQL is installed: $(psql --version)"
fi

# Check if PostgreSQL is running
if sudo systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not running"
    echo "Starting PostgreSQL..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    sleep 2
    if sudo systemctl is-active --quiet postgresql; then
        echo "✅ PostgreSQL started successfully"
    else
        echo "❌ Failed to start PostgreSQL"
        echo "Check logs: sudo journalctl -u postgresql -n 50"
        exit 1
    fi
fi

# Check if port 5432 is listening
if sudo netstat -tulpn | grep -q ":5432"; then
    echo "✅ PostgreSQL is listening on port 5432"
else
    echo "⚠️  PostgreSQL may not be listening on port 5432"
    echo "Check PostgreSQL config: sudo cat /etc/postgresql/*/main/postgresql.conf | grep listen_addresses"
fi

# Check .env file
if [ -f /opt/tlp/api/.env ]; then
    echo "✅ .env file exists"
    echo "Database config:"
    grep "^DB_" /opt/tlp/api/.env | sed 's/PASSWORD=.*/PASSWORD=***/'
else
    echo "❌ .env file not found at /opt/tlp/api/.env"
    exit 1
fi

# Test connection
cd /opt/tlp/api
source .env
if PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -d $DB_DATABASE -c "SELECT 1;" &>/dev/null; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed"
    echo "Trying to connect as postgres user..."
    sudo -u postgres psql -c "\l" | head -20
fi

echo ""
echo "✅ Diagnosis complete!"
```

## Common Issues and Solutions

### Issue 1: PostgreSQL Not Installed
**Solution:**
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Issue 2: PostgreSQL Not Running
**Solution:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Issue 3: Wrong Database Credentials
**Check .env file:**
```bash
cd /opt/tlp/api
cat .env
```

**Verify database exists:**
```bash
sudo -u postgres psql -c "\l"
```

**Create database if missing:**
```bash
cd /opt/tlp/api
source .env
sudo -u postgres psql -c "CREATE DATABASE $DB_DATABASE;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_DATABASE TO $DB_USER;"
```

### Issue 4: PostgreSQL Not Listening on Localhost
**Check PostgreSQL config:**
```bash
sudo cat /etc/postgresql/*/main/postgresql.conf | grep listen_addresses
```

**Edit config if needed:**
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: listen_addresses = 'localhost'
sudo systemctl restart postgresql
```

### Issue 5: Firewall Blocking Port 5432
**Check firewall:**
```bash
sudo ufw status
```

**Allow PostgreSQL (if needed for external access):**
```bash
sudo ufw allow 5432/tcp
```

## After Fixing: Restart API

```bash
# Restart PM2 process
pm2 restart tlp-api

# Check logs to verify connection
pm2 logs tlp-api --lines 50
```

## Verify Fix

```bash
# Check API health endpoint
curl http://localhost:3007/health

# Check database health endpoint
curl http://localhost:3007/db-health

# Check PM2 logs for errors
pm2 logs tlp-api --err --lines 20
```

