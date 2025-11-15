#!/bin/bash

# Database Setup Script for TLP API
# This script creates the database user and database

echo "🔧 Setting up TLP Database..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your database configuration."
    exit 1
fi

# Source the .env file to get database credentials
source .env

DB_USER=${DB_USER:-tlp_user}
DB_DATABASE=${DB_DATABASE:-tlp_db}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Error: DB_PASSWORD not set in .env file!"
    exit 1
fi

echo "📋 Database Configuration:"
echo "  User: $DB_USER"
echo "  Database: $DB_DATABASE"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "❌ Error: PostgreSQL is not running on $DB_HOST:$DB_PORT"
    exit 1
fi

echo "✅ PostgreSQL is running"
echo ""

# Try to connect as postgres user to create the database user
echo "🔐 Creating database user '$DB_USER'..."
PGPASSWORD=${POSTGRES_PASSWORD:-postgres} psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ User '$DB_USER' created successfully"
elif [ $? -eq 2 ]; then
    echo "⚠️  User '$DB_USER' may already exist (this is okay)"
else
    echo "⚠️  Could not create user as 'postgres'. Trying without password..."
    # Try without password (if local trust authentication)
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ User '$DB_USER' created successfully"
    elif [ $? -eq 2 ]; then
        echo "⚠️  User '$DB_USER' may already exist (this is okay)"
    else
        echo "❌ Failed to create user. You may need to run manually:"
        echo "   psql -U postgres -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';\""
        exit 1
    fi
fi

echo ""
echo "🗄️  Creating database '$DB_DATABASE'..."
PGPASSWORD=${POSTGRES_PASSWORD:-postgres} psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_DATABASE OWNER $DB_USER;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database '$DB_DATABASE' created successfully"
elif [ $? -eq 2 ]; then
    echo "⚠️  Database '$DB_DATABASE' may already exist (this is okay)"
else
    echo "⚠️  Could not create database as 'postgres'. Trying without password..."
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_DATABASE OWNER $DB_USER;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Database '$DB_DATABASE' created successfully"
    elif [ $? -eq 2 ]; then
        echo "⚠️  Database '$DB_DATABASE' may already exist (this is okay)"
    else
        echo "❌ Failed to create database. You may need to run manually:"
        echo "   psql -U postgres -c \"CREATE DATABASE $DB_DATABASE OWNER $DB_USER;\""
        exit 1
    fi
fi

echo ""
echo "🔑 Granting privileges..."
PGPASSWORD=${POSTGRES_PASSWORD:-postgres} psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_DATABASE -c "GRANT ALL PRIVILEGES ON DATABASE $DB_DATABASE TO $DB_USER;" 2>/dev/null || \
psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_DATABASE -c "GRANT ALL PRIVILEGES ON DATABASE $DB_DATABASE TO $DB_USER;" 2>/dev/null

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Run migrations: npm run migrate"
echo "2. (Optional) Seed data: node scripts/seed_launch_data.js"
echo "3. Restart the API server"

