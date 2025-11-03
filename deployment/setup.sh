#!/bin/bash

# TLP Platform Initial Droplet Setup Script
# Run this script once to set up the Droplet environment

set -e

echo "=== TLP Platform Droplet Setup ==="

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js 18.x
echo "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PostgreSQL client (if database is on another server)
echo "Installing PostgreSQL client..."
apt-get install -y postgresql-client

# Install nginx
echo "Installing nginx..."
apt-get install -y nginx

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2

# Create necessary directories
echo "Creating directories..."
mkdir -p /opt/tlp
mkdir -p /var/www/tlp-web
mkdir -p /var/www/tlp-admin
mkdir -p /var/log/pm2
mkdir -p /var/www/certbot

# Set up firewall
echo "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 3007/tcp
ufw --force enable

# Configure nginx
echo "Setting up nginx configuration..."
if [ ! -f /etc/nginx/sites-available/tlp ]; then
    # Copy nginx config (assuming it's in the repo)
    # You'll need to manually copy deployment/nginx.conf to /etc/nginx/sites-available/tlp
    echo "Please copy deployment/nginx.conf to /etc/nginx/sites-available/tlp"
    echo "Then run: ln -s /etc/nginx/sites-available/tlp /etc/nginx/sites-enabled/"
    echo "Remove default site: rm /etc/nginx/sites-enabled/default"
fi

# Set up PM2 startup script
echo "Setting up PM2 startup..."
pm2 startup systemd -u $USER --hp /home/$USER

# Install certbot for SSL (optional but recommended)
echo "To set up SSL, install certbot:"
echo "apt-get install -y certbot python3-certbot-nginx"
echo "certbot --nginx -d your-domain.com"

echo "=== Setup Complete ==="
echo "Next steps:"
echo "1. Configure GitHub Secrets (DROPLET_HOST, DROPLET_USER, SSH_PRIVATE_KEY, etc.)"
echo "2. Create .env file in /opt/tlp/api with database credentials"
echo "3. Copy nginx.conf to /etc/nginx/sites-available/tlp and enable it"
echo "4. Set up SSL certificates with certbot"
echo "5. Push to main/master branch to trigger deployment"


