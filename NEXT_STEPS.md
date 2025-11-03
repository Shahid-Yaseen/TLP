# Detailed Next Steps for Digital Ocean Deployment

This guide provides step-by-step instructions for deploying the TLP Platform to Digital Ocean.

---

## Step 1: Create Digital Ocean Droplet

### 1.1 Create Droplet
1. Log in to [Digital Ocean](https://cloud.digitalocean.com/)
2. Click **"Create"** → **"Droplets"**
3. Configure the droplet:
   - **Image**: Ubuntu 22.04 (LTS) x64
   - **Plan**: 
     - **Minimum**: Regular with 2GB RAM / 1 vCPU ($12/month)
     - **Recommended**: Regular with 4GB RAM / 2 vCPU ($24/month)
   - **Datacenter region**: Choose closest to your users
   - **Authentication**: 
     - **Option A**: SSH keys (recommended)
       - Click "New SSH Key"
       - Add your public SSH key (from `~/.ssh/id_rsa.pub`)
       - Or generate new one: `ssh-keygen -t rsa -b 4096`
     - **Option B**: Password (less secure)
   - **Hostname**: `tlp-production` (or your preferred name)
   - **Tags**: Optional (e.g., `production`, `tlp-platform`)
4. Click **"Create Droplet"**
5. Wait 30-60 seconds for droplet to be created
6. **Note the IP address** displayed (e.g., `123.45.67.89`)

### 1.2 Access Your Droplet
```bash
# From your local machine
ssh root@YOUR_DROPLET_IP

# Example:
ssh root@123.45.67.89

# If asked, type "yes" to accept the fingerprint
# Enter password if you used password authentication
```

---

## Step 2: Initial Droplet Setup

### 2.1 Update System
```bash
# Once connected to droplet
apt-get update
apt-get upgrade -y
```

### 2.2 Install Git
```bash
apt-get install -y git
```

### 2.3 Install Node.js 20.x
```bash
# Install Node.js 20 (required for Vite 7.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### 2.4 Clone Your Repository
```bash
# Create directory for application
mkdir -p /opt/tlp
cd /opt/tlp

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .

# Or if using SSH:
# git clone git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git .

# If repository is private, you'll need to:
# 1. Add SSH key to droplet: ssh-keygen, then add public key to GitHub
# 2. Or use GitHub token: git clone https://TOKEN@github.com/USER/REPO.git
```

### 2.4 Run Setup Script
```bash
cd /opt/tlp
chmod +x deployment/setup.sh
sudo ./deployment/setup.sh
```

**What this does:**
- Installs Node.js 20.x
- Installs PostgreSQL client
- Installs nginx
- Installs PM2 globally
- Creates necessary directories
- Configures firewall

---

## Step 3: Set Up PostgreSQL Database

### 3.1 Install PostgreSQL (if on same droplet)
```bash
# Install PostgreSQL
apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
systemctl start postgresql
systemctl enable postgresql

# Check status
systemctl status postgresql
```

### 3.2 Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE tlp_db;
CREATE USER tlp_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE tlp_db TO tlp_user;
ALTER DATABASE tlp_db OWNER TO tlp_user;

# Exit PostgreSQL
\q
```

**Important**: Replace `YOUR_SECURE_PASSWORD_HERE` with a strong password (save it for Step 5).

### 3.3 Test Database Connection
```bash
# Test connection
psql -h localhost -U tlp_user -d tlp_db

# Enter password when prompted
# If successful, you'll see: tlp_db=>
# Exit with: \q
```

### 3.4 Alternative: Use Managed Database (Recommended for Production)
If you prefer Digital Ocean Managed Database:
1. Go to Digital Ocean Dashboard → **"Create"** → **"Databases"**
2. Choose **PostgreSQL**
3. Select plan and region
4. Create database and user
5. **Note the connection details** (host, port, user, password, database)
6. You'll use these in Step 5

---

## Step 4: Configure Nginx

### 4.1 Copy Nginx Configuration
```bash
# Copy nginx config
sudo cp /opt/tlp/deployment/nginx.conf /etc/nginx/sites-available/tlp

# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/tlp /etc/nginx/sites-enabled/

# Remove default nginx site
sudo rm /etc/nginx/sites-enabled/default
```

### 4.2 Edit Nginx Configuration
```bash
# Edit the config file
sudo nano /etc/nginx/sites-available/tlp
```

**Update these sections:**

1. **If using custom domain**, update SSL certificate paths:
   ```nginx
   # Find these lines (around line 35-36):
   ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
   
   # Replace 'your-domain.com' with your actual domain
   ```

2. **If NOT using custom domain yet**, comment out SSL lines:
   ```nginx
   # Comment out SSL lines temporarily:
   # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
   # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
   ```

3. **Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

### 4.3 Test Nginx Configuration
```bash
# Test nginx config
sudo nginx -t

# Should output: "syntax is ok" and "test is successful"
```

### 4.4 Start Nginx
```bash
# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Reload nginx
sudo systemctl reload nginx
```

### 4.5 Configure Firewall
```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw allow 3007/tcp  # API port
sudo ufw enable

# Check firewall status
sudo ufw status
```

---

## Step 5: Configure Environment Variables

### 5.1 Create API Environment File
```bash
# Create .env file
sudo nano /opt/tlp/api/.env
```

**Add the following content** (replace with your actual values):

```env
NODE_ENV=production
PORT=3007
DB_HOST=localhost
DB_PORT=5432
DB_USER=tlp_user
DB_PASSWORD=YOUR_DATABASE_PASSWORD_HERE
DB_DATABASE=tlp_db
JWT_SECRET=YOUR_VERY_LONG_RANDOM_SECRET_KEY_MINIMUM_32_CHARACTERS
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

**Important replacements:**
- `YOUR_DATABASE_PASSWORD_HERE`: Password from Step 3.2
- `YOUR_VERY_LONG_RANDOM_SECRET_KEY_MINIMUM_32_CHARACTERS`: Generate with:
  ```bash
  openssl rand -base64 32
  ```

### 5.2 Set File Permissions
```bash
# Secure the .env file
sudo chmod 600 /opt/tlp/api/.env
sudo chown $USER:$USER /opt/tlp/api/.env
```

### 5.3 If Using Managed Database
If using Digital Ocean Managed Database, update DB_HOST:
```env
DB_HOST=your-managed-db-host.db.ondigitalocean.com
DB_PORT=25060  # Managed DB port
```

---

## Step 6: Run Database Migrations

### 6.1 Install API Dependencies
```bash
cd /opt/tlp/api
npm install --production
```

### 6.2 Run Migrations
```bash
# Run all migrations
npm run migrate

# Should output: "Migration X completed successfully" for each migration
```

### 6.3 (Optional) Seed Initial Data
```bash
# Seed roles and permissions
npm run seed:roles

# Seed launch data (optional)
npm run seed:launches
```

---

## Step 7: Set Up PM2 Process Manager

### 7.1 Copy PM2 Ecosystem Config
```bash
# Ensure PM2 ecosystem config is in place
# It should already be at /opt/tlp/deployment/pm2.ecosystem.config.js
ls -la /opt/tlp/deployment/pm2.ecosystem.config.js
```

### 7.2 Start API with PM2
```bash
cd /opt/tlp
pm2 start deployment/pm2.ecosystem.config.js --env production

# Check status
pm2 status

# View logs
pm2 logs tlp-api

# Should see API starting successfully
```

### 7.3 Configure PM2 to Start on Boot
```bash
# Save PM2 process list
pm2 save

# Generate startup script
pm2 startup systemd

# Copy and run the command it outputs (usually something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

### 7.4 Test API
```bash
# Test health endpoint
curl http://localhost:3007/health

# Should return: {"status":"ok","timestamp":"...","service":"TLP API"}

# Test database health
curl http://localhost:3007/db-health

# Should return: {"status":"db-ok","timestamp":"..."}
```

---

## Step 8: Set Up SSL Certificate (Let's Encrypt)

### 8.1 Prerequisites
- You need a domain name pointing to your droplet IP
- DNS A record: `yourdomain.com` → `YOUR_DROPLET_IP`
- DNS A record: `www.yourdomain.com` → `YOUR_DROPLET_IP` (optional)

### 8.2 Install Certbot
```bash
apt-get install -y certbot python3-certbot-nginx
```

### 8.3 Obtain SSL Certificate
```bash
# Replace 'yourdomain.com' with your actual domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### 8.4 Test Auto-Renewal
```bash
# Test renewal process
sudo certbot renew --dry-run

# Certbot automatically sets up renewal, but verify:
sudo systemctl status certbot.timer
```

### 8.5 Update Nginx Config (if needed)
If you didn't use certbot nginx mode, update nginx.conf manually with certificate paths.

---

## Step 9: Configure GitHub Secrets

### 9.1 Generate SSH Key for GitHub Actions
```bash
# On your local machine (not on droplet)
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# This creates two files:
# ~/.ssh/github_actions_deploy (private key)
# ~/.ssh/github_actions_deploy.pub (public key)
```

### 9.2 Add Public Key to Droplet
```bash
# Copy public key to droplet
cat ~/.ssh/github_actions_deploy.pub | ssh root@YOUR_DROPLET_IP "cat >> ~/.ssh/authorized_keys"

# Test connection
ssh -i ~/.ssh/github_actions_deploy root@YOUR_DROPLET_IP
```

### 9.3 Add Secrets to GitHub
1. Go to your GitHub repository
2. Click **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"** for each:

#### Secret 1: DROPLET_HOST
- **Name**: `DROPLET_HOST`
- **Value**: Your droplet IP (e.g., `123.45.67.89`) or domain (e.g., `api.yourdomain.com`)
- Click **"Add secret"**

#### Secret 2: DROPLET_USER
- **Name**: `DROPLET_USER`
- **Value**: `root` (or your SSH username)
- Click **"Add secret"**

#### Secret 3: SSH_PRIVATE_KEY
- **Name**: `SSH_PRIVATE_KEY`
- **Value**: Contents of `~/.ssh/github_actions_deploy` (the PRIVATE key)
  ```bash
  # On your local machine
  cat ~/.ssh/github_actions_deploy
  ```
  - Copy the ENTIRE output including:
    - `-----BEGIN RSA PRIVATE KEY-----`
    - All the key content
    - `-----END RSA PRIVATE KEY-----`
- Click **"Add secret"**

#### Secret 4: API_URL
- **Name**: `API_URL`
- **Value**: Your production API URL
  - If using domain: `https://yourdomain.com/api`
  - If using IP only: `http://YOUR_DROPLET_IP/api`
  - **Note**: Use HTTPS if you set up SSL
- Click **"Add secret"**

#### Optional Secret 5: API_PORT
- **Name**: `API_PORT`
- **Value**: `3007` (only if different from default)
- Click **"Add secret"**

---

## Step 10: Test Deployment

### 10.1 Trigger First Deployment
```bash
# On your local machine, in your repository
git add .
git commit -m "Initial deployment setup"
git push origin main

# Or if using master branch:
git push origin master
```

### 10.2 Monitor GitHub Actions
1. Go to your GitHub repository
2. Click **"Actions"** tab
3. Watch the workflow run:
   - `deploy-api.yml` should run if you changed `api/` files
   - `deploy-web.yml` should run if you changed `web/` files
   - `deploy-admin.yml` should run if you changed `api/admin/` files
4. Click on the workflow run to see logs
5. Wait for completion (green checkmark)

### 10.3 Verify Deployment on Droplet
```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Check API is running
pm2 status

# Check web files are deployed
ls -la /var/www/tlp-web
ls -la /var/www/tlp-admin

# Check API logs
pm2 logs tlp-api --lines 50
```

### 10.4 Test in Browser
1. **User Frontend**: Visit `http://YOUR_DROPLET_IP` or `https://yourdomain.com`
2. **Admin Frontend**: Visit `http://YOUR_DROPLET_IP/admin` or `https://yourdomain.com/admin`
3. **API Health**: Visit `http://YOUR_DROPLET_IP/api/health` or `https://yourdomain.com/api/health`

---

## Step 11: Create Admin User (First Time)

### 11.1 Create Admin User
```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Navigate to API directory
cd /opt/tlp/api

# Run admin user creation script
node scripts/create_admin_user.js

# Follow prompts:
# - Enter email
# - Enter password
# - Enter first name
# - Enter last name
```

### 11.2 Test Admin Login
1. Visit admin dashboard: `https://yourdomain.com/admin`
2. Log in with the credentials you just created
3. Verify you can access the admin panel

---

## Step 12: Post-Deployment Checklist

### 12.1 Security Hardening
- [ ] Change default SSH port (optional but recommended)
- [ ] Set up fail2ban for SSH protection
- [ ] Configure automatic security updates
- [ ] Review and restrict firewall rules
- [ ] Set up monitoring and alerting

### 12.2 Monitoring Setup
```bash
# Install monitoring tools (optional)
npm install -g pm2-logrotate
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 12.3 Backup Setup
- [ ] Set up automated database backups
- [ ] Configure backup storage (e.g., Digital Ocean Spaces)
- [ ] Test backup restoration process

### 12.4 Performance Optimization
- [ ] Enable nginx gzip compression (already in config)
- [ ] Configure CDN for static assets (optional)
- [ ] Set up caching headers
- [ ] Monitor resource usage

---

## Troubleshooting Common Issues

### Issue: Cannot SSH into Droplet
**Solution:**
- Verify IP address is correct
- Check firewall settings on Digital Ocean dashboard
- Ensure SSH key is added correctly

### Issue: API Not Starting
**Solution:**
```bash
# Check PM2 logs
pm2 logs tlp-api

# Check environment variables
cat /opt/tlp/api/.env

# Test database connection
psql -h localhost -U tlp_user -d tlp_db

# Check if port is in use
sudo netstat -tulpn | grep 3007
```

### Issue: Frontend Not Loading
**Solution:**
```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx config
sudo nginx -t

# Check file permissions
ls -la /var/www/tlp-web
sudo chown -R www-data:www-data /var/www/tlp-web
```

### Issue: GitHub Actions Failing
**Solution:**
- Verify all secrets are set correctly
- Check SSH key has proper format (entire key including headers)
- Test SSH connection manually with the key
- Check GitHub Actions logs for specific error

### Issue: Database Connection Failed
**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials in .env
cat /opt/tlp/api/.env

# Test connection
psql -h localhost -U tlp_user -d tlp_db

# Check firewall
sudo ufw status
```

---

## Next Steps After Deployment

1. **Set up domain DNS** (if not done already)
2. **Configure email service** (for user verification, password reset)
3. **Set up monitoring** (uptime monitoring, error tracking)
4. **Configure backups** (automated database backups)
5. **Set up staging environment** (for testing before production)
6. **Document API endpoints** (for team reference)
7. **Set up CI/CD testing** (run tests before deployment)

---

## Support Resources

- **Digital Ocean Documentation**: https://docs.digitalocean.com/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/
- **Let's Encrypt Documentation**: https://letsencrypt.org/docs/

---

## Quick Reference Commands

```bash
# Check API status
pm2 status
pm2 logs tlp-api

# Restart API
pm2 restart tlp-api

# Check nginx
sudo nginx -t
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/tlp-error.log
pm2 logs tlp-api --lines 100

# Check disk space
df -h

# Check memory
free -h

# Check system resources
htop
```

---

**You're all set!** Your TLP Platform should now be deployed and accessible. If you encounter any issues, refer to the troubleshooting section or check the logs.

