# PM2 Server Management Commands

## Check PM2 Status

```bash
# Check if PM2 is running
pm2 status

# Or
pm2 list

# Check specific app
pm2 info tlp-api
```

## Start/Restart Server

```bash
# Start the server
cd /opt/tlp/api
pm2 start index.js --name tlp-api

# Or if you have an ecosystem file
pm2 start ecosystem.config.js

# Restart if already running
pm2 restart tlp-api

# Or restart all
pm2 restart all
```

## Check Logs

```bash
# View logs
pm2 logs tlp-api

# View last 100 lines
pm2 logs tlp-api --lines 100

# Watch logs in real-time
pm2 logs tlp-api --lines 0
```

## Common Commands

```bash
# Stop server
pm2 stop tlp-api

# Delete from PM2
pm2 delete tlp-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
pm2 save
```

## Check if Server is Running

```bash
# Check if port 3007 is in use
lsof -i :3007

# Or
netstat -tulpn | grep 3007

# Check process
ps aux | grep "node.*index.js" | grep -v grep
```

## Quick Start Command

```bash
cd /opt/tlp/api && pm2 start index.js --name tlp-api && pm2 logs tlp-api --lines 20
```

