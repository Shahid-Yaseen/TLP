# How to Check Logs on Digital Ocean

## Quick Access Methods

### Method 1: SSH into Droplet

```bash
ssh root@YOUR_DROPLET_IP
# Or if you have a specific user:
ssh YOUR_USER@YOUR_DROPLET_IP
```

## API Server Logs (PM2)

### View Real-time Logs

```bash
# View all PM2 logs
pm2 logs

# View logs for specific app
pm2 logs tlp-api

# View last 100 lines
pm2 logs tlp-api --lines 100

# View logs without colors (easier to read)
pm2 logs tlp-api --nostream --lines 50

# Follow logs (real-time updates)
pm2 logs tlp-api --lines 0
```

### View Log Files Directly

```bash
# PM2 log files location
~/.pm2/logs/tlp-api-out.log    # Standard output
~/.pm2/logs/tlp-api-error.log  # Error output

# View last 50 lines of output
tail -50 ~/.pm2/logs/tlp-api-out.log

# View last 50 lines of errors
tail -50 ~/.pm2/logs/tlp-api-error.log

# Follow logs in real-time
tail -f ~/.pm2/logs/tlp-api-out.log
tail -f ~/.pm2/logs/tlp-api-error.log
```

### PM2 Log Management

```bash
# Clear all logs
pm2 flush

# Clear logs for specific app
pm2 flush tlp-api

# Set log file size limit
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Nginx Logs (Web Server)

### Access Logs (All Requests)

```bash
# View last 100 lines
tail -100 /var/log/nginx/access.log

# View last 100 lines for TLP site
tail -100 /var/log/nginx/tlp-access.log

# Follow logs in real-time
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/tlp-access.log

# Search for specific IP or URL
grep "192.168.1.1" /var/log/nginx/access.log
grep "/api/launches" /var/log/nginx/access.log
```

### Error Logs

```bash
# View last 100 error lines
tail -100 /var/log/nginx/error.log

# View TLP-specific errors
tail -100 /var/log/nginx/tlp-error.log

# Follow error logs in real-time
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/tlp-error.log

# Search for specific errors
grep "error" /var/log/nginx/error.log
grep "502\|503\|504" /var/log/nginx/error.log
```

## Application Logs

### API Application Logs

```bash
# If your API writes to custom log files
cd /opt/tlp/api
tail -50 logs/app.log  # If you have custom logging

# Check for any log files in API directory
find /opt/tlp/api -name "*.log" -type f
```

### Database Logs (PostgreSQL)

```bash
# PostgreSQL logs location (varies by installation)
tail -50 /var/log/postgresql/postgresql-*.log

# Or check system logs
journalctl -u postgresql -n 50
```

## System Logs

### System Service Logs

```bash
# Check systemd service logs
journalctl -u nginx -n 50
journalctl -u postgresql -n 50

# Follow system logs
journalctl -u nginx -f
journalctl -u postgresql -f

# Check all system logs
journalctl -n 100
```

### System Log Files

```bash
# System messages
tail -50 /var/log/syslog

# Authentication logs
tail -50 /var/log/auth.log

# Kernel logs
dmesg | tail -50
```

## Quick Log Check Commands

### One-Liner: Check All Important Logs

```bash
# API logs
echo "=== API Output Log ===" && tail -20 ~/.pm2/logs/tlp-api-out.log
echo "=== API Error Log ===" && tail -20 ~/.pm2/logs/tlp-api-error.log
echo "=== Nginx Access Log ===" && tail -20 /var/log/nginx/tlp-access.log
echo "=== Nginx Error Log ===" && tail -20 /var/log/nginx/tlp-error.log
```

### Check Recent Errors Only

```bash
# Recent PM2 errors
pm2 logs tlp-api --err --lines 50

# Recent Nginx errors
tail -50 /var/log/nginx/tlp-error.log | grep -i error

# Recent system errors
journalctl -p err -n 50
```

## Log Analysis Commands

### Find Most Common Errors

```bash
# Most common API errors
grep -i error ~/.pm2/logs/tlp-api-error.log | sort | uniq -c | sort -rn | head -10

# Most requested endpoints
awk '{print $7}' /var/log/nginx/tlp-access.log | sort | uniq -c | sort -rn | head -10

# Most common HTTP status codes
awk '{print $9}' /var/log/nginx/tlp-access.log | sort | uniq -c | sort -rn
```

### Check for Specific Issues

```bash
# Check for 500 errors
grep " 500 " /var/log/nginx/tlp-access.log | tail -20

# Check for database connection errors
grep -i "database\|connection\|postgres" ~/.pm2/logs/tlp-api-error.log | tail -20

# Check for authentication errors
grep -i "auth\|unauthorized\|401\|403" ~/.pm2/logs/tlp-api-error.log | tail -20
```

## Remote Log Viewing (Without SSH)

### Using PM2 Web Interface

```bash
# Install PM2 web interface (if not already)
pm2 web

# Access at: http://YOUR_DROPLET_IP:9615
```

### Using Log Aggregation Services

Consider setting up:
- **Logtail** - Real-time log aggregation
- **Papertrail** - Cloud log management
- **Datadog** - Full monitoring solution

## Log Rotation

### Check Log File Sizes

```bash
# Check PM2 log sizes
du -h ~/.pm2/logs/

# Check Nginx log sizes
du -h /var/log/nginx/

# Check all log files
find /var/log -type f -name "*.log" -exec du -h {} \; | sort -h
```

### Manual Log Rotation

```bash
# Rotate Nginx logs manually
sudo logrotate -f /etc/logrotate.d/nginx

# Clear old PM2 logs
pm2 flush
```

## Troubleshooting Common Issues

### API Not Responding

```bash
# Check if API is running
pm2 status

# Check recent errors
pm2 logs tlp-api --err --lines 50

# Check if port is in use
sudo netstat -tulpn | grep 3007
```

### High Server Load

```bash
# Check system resources
htop
# Or
top

# Check disk usage
df -h

# Check memory usage
free -h
```

### Database Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check database logs
tail -50 /var/log/postgresql/postgresql-*.log
```

## Quick Reference

| What to Check | Command |
|--------------|---------|
| API logs (real-time) | `pm2 logs tlp-api` |
| API errors only | `pm2 logs tlp-api --err` |
| Last 100 API logs | `pm2 logs tlp-api --lines 100` |
| Nginx access logs | `tail -f /var/log/nginx/tlp-access.log` |
| Nginx errors | `tail -f /var/log/nginx/tlp-error.log` |
| System logs | `journalctl -n 100` |
| PM2 status | `pm2 status` |
| Clear PM2 logs | `pm2 flush` |

## Pro Tips

1. **Use `less` for large log files:**
   ```bash
   less ~/.pm2/logs/tlp-api-out.log
   # Press '/' to search, 'q' to quit
   ```

2. **Filter logs by date:**
   ```bash
   grep "2025-11-09" ~/.pm2/logs/tlp-api-out.log
   ```

3. **Save logs to file:**
   ```bash
   pm2 logs tlp-api --lines 1000 > api-logs-$(date +%Y%m%d).txt
   ```

4. **Monitor logs remotely:**
   ```bash
   ssh root@YOUR_DROPLET_IP "pm2 logs tlp-api --lines 50"
   ```

