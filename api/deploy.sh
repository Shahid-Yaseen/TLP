#!/bin/bash
# Deployment Script - Sets up everything including cron job
# Run this on your server after pulling the latest code

set -e

echo "🚀 Starting deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run migrations
echo "🗄️  Running database migrations..."
npm run migrate

# Set up cron job automatically
echo "⏰ Setting up automatic launch sync cron job..."
npm run setup:cron

# Restart the server (if using PM2)
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting server with PM2..."
    pm2 restart tlp-api || pm2 start index.js --name tlp-api
else
    echo "⚠️  PM2 not found. Please restart your server manually."
fi

echo "✅ Deployment complete!"
echo ""
echo "Cron job is now running automatically."
echo "Check logs: tail -f logs/upcoming_previous_sync.log"

