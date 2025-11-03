# TLP Platform Deployment Guide

This guide covers deploying the TLP Platform to Digital Ocean Droplets using GitHub Actions workflows.

## Architecture Overview

The TLP Platform consists of three components:

1. **Web Frontend** (`/web`) - User-facing React application (Vite)
2. **Admin Frontend** (`/api/admin`) - Admin dashboard (Create React App)
3. **Backend API** (`/api`) - Express.js REST API with PostgreSQL

All components can be deployed to a single Digital Ocean Droplet or separate droplets.

## Prerequisites

### 1. Digital Ocean Droplet Setup

Create a Digital Ocean Droplet with:
- Ubuntu 22.04 LTS or later
- Minimum 2GB RAM (4GB+ recommended for production)
- SSH key access configured

### 2. Initial Droplet Configuration

SSH into your droplet and run the initial setup:

```bash
# Clone your repository (or copy files manually)
git clone <your-repo-url> /opt/tlp

# Run the setup script
cd /opt/tlp
chmod +x deployment/setup.sh
sudo ./deployment/setup.sh
```

The setup script will:
- Update system packages
- Install Node.js 18.x
- Install PostgreSQL client
- Install nginx
- Install PM2 globally
- Create necessary directories
- Configure firewall
- Set up PM2 startup script

### 3. Database Setup

Set up PostgreSQL database (can be on the same droplet or a managed database):

```bash
# If installing PostgreSQL on the droplet
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE tlp_db;
CREATE USER tlp_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tlp_db TO tlp_user;
\q
```

### 4. Nginx Configuration

Copy and configure nginx:

```bash
# Copy nginx configuration
sudo cp /opt/tlp/deployment/nginx.conf /etc/nginx/sites-available/tlp

# Edit the configuration file
sudo nano /etc/nginx/sites-available/tlp

# Update SSL certificate paths (if using custom domain)
# Replace 'your-domain.com' with your actual domain

# Enable the site
sudo ln -s /etc/nginx/sites-available/tlp /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate (Let's Encrypt)

If using a custom domain:

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Certbot will automatically configure nginx for SSL
```

### 6. Environment Variables

Create `.env` file for the API on the server:

```bash
sudo nano /opt/tlp/api/.env
```

Add the following (adjust values as needed):

```env
NODE_ENV=production
PORT=3007
DB_HOST=localhost
DB_PORT=5432
DB_USER=tlp_user
DB_PASSWORD=your_secure_password
DB_DATABASE=tlp_db
JWT_SECRET=your_secret_key_minimum_32_characters_long_change_in_production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

Set proper permissions:

```bash
sudo chmod 600 /opt/tlp/api/.env
sudo chown $USER:$USER /opt/tlp/api/.env
```

### 7. PM2 Ecosystem Configuration

Copy PM2 ecosystem config to the correct location:

```bash
# The ecosystem config should be at /opt/tlp/deployment/pm2.ecosystem.config.js
# PM2 will reference it from there
```

Update the ecosystem config with your actual environment variables or ensure they're loaded from `.env`.

## GitHub Secrets Configuration

Configure the following secrets in your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each:

### Required Secrets

- **`DROPLET_HOST`**: Your Digital Ocean Droplet IP address or domain
  - Example: `123.45.67.89` or `api.yourdomain.com`

- **`DROPLET_USER`**: SSH username (typically `root` for Ubuntu droplets)
  - Example: `root`

- **`SSH_PRIVATE_KEY`**: Your SSH private key for accessing the droplet
  - Generate with: `ssh-keygen -t rsa -b 4096 -C "github-actions"`
  - Copy the private key (entire content including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)
  - Add the public key to your droplet: `cat ~/.ssh/id_rsa.pub | ssh root@your-droplet-ip "cat >> ~/.ssh/authorized_keys"`

- **`API_URL`**: Production API URL
  - Example: `https://your-domain.com/api` or `https://api.yourdomain.com`
  - This is used during build time for frontend applications

### Optional Secrets

- **`API_PORT`**: API server port (default: 3007)
  - Only needed if using a non-default port

- **`DB_HOST`**: Database host (if not using localhost)
- **`DB_USER`**: Database user
- **`DB_PASSWORD`**: Database password
- **`DB_DATABASE`**: Database name

## Deployment Workflows

The repository includes three GitHub Actions workflows:

### 1. `deploy-api.yml`
- **Trigger**: Push to `main`/`master` branch when `api/**` files change
- **Actions**:
  - Builds and tests the API
  - Deploys to `/opt/tlp/api` on the droplet
  - Runs database migrations
  - Restarts PM2 process

### 2. `deploy-web.yml`
- **Trigger**: Push to `main`/`master` branch when `web/**` files change
- **Actions**:
  - Builds production bundle with Vite
  - Deploys static files to `/var/www/tlp-web`
  - Reloads nginx

### 3. `deploy-admin.yml`
- **Trigger**: Push to `main`/`master` branch when `api/admin/**` files change
- **Actions**:
  - Builds production bundle with Create React App
  - Deploys static files to `/var/www/tlp-admin`
  - Reloads nginx

## Manual Deployment

If you need to deploy manually:

### Deploy API
```bash
cd /opt/tlp/api
git pull origin main
npm ci --production
npm run migrate
pm2 restart tlp-api
```

### Deploy Web Frontend
```bash
cd /opt/tlp/web
git pull origin main
npm ci
VITE_API_URL=https://your-domain.com/api npm run build
sudo cp -r dist/* /var/www/tlp-web/
sudo chown -R www-data:www-data /var/www/tlp-web
sudo systemctl reload nginx
```

### Deploy Admin Frontend
```bash
cd /opt/tlp/api/admin
git pull origin main
npm ci
REACT_APP_API_URL=https://your-domain.com/api npm run build
sudo cp -r build/* /var/www/tlp-admin/
sudo chown -R www-data:www-data /var/www/tlp-admin
sudo systemctl reload nginx
```

## Directory Structure on Droplet

After deployment, your droplet should have this structure:

```
/opt/tlp/
├── api/              # Backend API code
│   ├── .env          # Environment variables (secure)
│   ├── index.js
│   └── ...
├── web/              # Web frontend source (not needed after build)
├── api/admin/        # Admin frontend source (not needed after build)
└── deployment/      # Deployment scripts and configs

/var/www/
├── tlp-web/         # Web frontend production build
└── tlp-admin/       # Admin frontend production build

/etc/nginx/
└── sites-available/
    └── tlp          # Nginx configuration

/var/log/
└── pm2/             # PM2 logs
```

## PM2 Process Management

### Check Status
```bash
pm2 status
pm2 logs tlp-api
```

### Restart API
```bash
pm2 restart tlp-api
```

### Stop API
```bash
pm2 stop tlp-api
```

### View Logs
```bash
pm2 logs tlp-api --lines 100
```

### Monitor
```bash
pm2 monit
```

## Nginx Management

### Check Configuration
```bash
sudo nginx -t
```

### Reload Nginx
```bash
sudo systemctl reload nginx
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### View Logs
```bash
sudo tail -f /var/log/nginx/tlp-access.log
sudo tail -f /var/log/nginx/tlp-error.log
```

## Troubleshooting

### API Not Starting

1. Check PM2 logs: `pm2 logs tlp-api`
2. Verify environment variables: `cat /opt/tlp/api/.env`
3. Test database connection: `psql -h localhost -U tlp_user -d tlp_db`
4. Check if port is in use: `sudo netstat -tulpn | grep 3007`

### Frontend Not Loading

1. Check nginx status: `sudo systemctl status nginx`
2. Verify nginx config: `sudo nginx -t`
3. Check file permissions: `ls -la /var/www/tlp-web`
4. View nginx error logs: `sudo tail -f /var/log/nginx/tlp-error.log`

### Database Connection Issues

1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check database credentials in `.env`
3. Test connection: `psql -h localhost -U tlp_user -d tlp_db`
4. Check firewall: `sudo ufw status`

### GitHub Actions Failing

1. Verify all secrets are set correctly in GitHub
2. Check SSH key has proper permissions on droplet
3. Verify droplet has required software installed
4. Check GitHub Actions logs for specific error messages

## Environment Variables Reference

### Web Frontend (`web/.env.production`)
```env
VITE_API_URL=https://your-domain.com/api
```

### Admin Frontend (`api/admin/.env.production`)
```env
REACT_APP_API_URL=https://your-domain.com/api
```

### Backend API (`api/.env`)
```env
NODE_ENV=production
PORT=3007
DB_HOST=localhost
DB_PORT=5432
DB_USER=tlp_user
DB_PASSWORD=your_secure_password
DB_DATABASE=tlp_db
JWT_SECRET=your_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (minimum 32 characters, random)
3. **Keep system packages updated**: `sudo apt-get update && sudo apt-get upgrade`
4. **Configure firewall properly**: Only allow necessary ports
5. **Use HTTPS**: Always use SSL/TLS in production
6. **Regular backups**: Set up automated database backups
7. **Monitor logs**: Regularly check application and server logs
8. **Rotate secrets**: Change JWT secrets and database passwords periodically

## Monitoring

### PM2 Monitoring
```bash
pm2 install pm2-logrotate    # Rotate logs
pm2 startup                   # Auto-start on reboot
pm2 save                      # Save current process list
```

### System Monitoring
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check running processes
ps aux | grep node
```

## Backup and Recovery

### Database Backup
```bash
# Create backup
pg_dump -h localhost -U tlp_user -d tlp_db > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U tlp_user -d tlp_db < backup_20240101.sql
```

### Application Backup
```bash
# Backup entire application
tar -czf tlp_backup_$(date +%Y%m%d).tar.gz /opt/tlp /var/www/tlp-web /var/www/tlp-admin
```

## Support

For issues or questions:
1. Check the logs first
2. Review this deployment guide
3. Check GitHub Actions workflow logs
4. Verify all prerequisites are met

## Next Steps

After successful deployment:

1. Test all endpoints and features
2. Set up monitoring and alerting
3. Configure automated backups
4. Set up log rotation
5. Configure CDN (if needed)
6. Set up staging environment for testing


