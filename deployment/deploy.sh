#!/bin/bash

# TLP Platform Deployment Script
# This script is executed on the Digital Ocean Droplet

set -e

APP_DIR="/opt/tlp"
WEB_DIR="/var/www/tlp-web"
ADMIN_DIR="/var/www/tlp-admin"
LOG_DIR="/var/log/pm2"

echo "=== TLP Platform Deployment Started ==="
echo "Timestamp: $(date)"

# Ensure directories exist
mkdir -p $APP_DIR
mkdir -p $WEB_DIR
mkdir -p $ADMIN_DIR
mkdir -p $LOG_DIR

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing..."
    npm install -g pm2
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Nginx is not installed. Please install it first."
    exit 1
fi

# Deploy API
if [ -d "$APP_DIR/api" ]; then
    echo "Deploying API..."
    cd $APP_DIR/api
    
    # Install production dependencies
    npm ci --production
    
    # Run database migrations
    echo "Running database migrations..."
    npm run migrate || echo "Migration failed or already up to date"
    
    # Restart API with PM2
    if pm2 list | grep -q "tlp-api"; then
        echo "Restarting existing PM2 process..."
        pm2 restart tlp-api
    else
        echo "Starting new PM2 process..."
        cd $APP_DIR
        pm2 start deployment/pm2.ecosystem.config.js --env production
        pm2 save
        pm2 startup
    fi
fi

# Deploy Web Frontend
if [ -d "$WEB_DIR" ]; then
    echo "Web frontend deployed to $WEB_DIR"
    # Set proper permissions
    chown -R www-data:www-data $WEB_DIR
    chmod -R 755 $WEB_DIR
fi

# Deploy Admin Frontend
if [ -d "$ADMIN_DIR" ]; then
    echo "Admin frontend deployed to $ADMIN_DIR"
    # Set proper permissions
    chown -R www-data:www-data $ADMIN_DIR
    chmod -R 755 $ADMIN_DIR
fi

# Reload nginx
echo "Reloading nginx..."
nginx -t && systemctl reload nginx || echo "Nginx reload failed"

echo "=== Deployment Complete ==="
echo "Timestamp: $(date)"


