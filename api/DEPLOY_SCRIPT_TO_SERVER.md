# Deploy Script to Server

The script `sync_upcoming_previous_launches.js` needs to be on your server. Here's how to get it there:

## Option 1: Pull Latest Code (Recommended)

If you're using git, pull the latest code:

```bash
cd /opt/tlp/api
git pull origin main  # or master, or your branch name
```

Then verify the file exists:
```bash
ls -la scripts/sync_upcoming_previous_launches.js
```

## Option 2: Copy File Manually

If git pull doesn't work, you can copy the file manually. The file should be at:

**Local path:** `api/scripts/sync_upcoming_previous_launches.js`

**Server path:** `/opt/tlp/api/scripts/sync_upcoming_previous_launches.js`

You can:
1. Use `scp` to copy from your local machine
2. Or create the file directly on the server

## Option 3: Create File Directly on Server

If you can't pull from git, I can help you create the file content directly on the server.

## Quick Check Commands

Run these on your server to see what's there:

```bash
# Check scripts directory
ls -la /opt/tlp/api/scripts/

# Check if any sync scripts exist
find /opt/tlp/api -name '*sync*' -type f

# Check git status (if using git)
cd /opt/tlp/api && git status
```

## After File is on Server

Once the file exists, run:

```bash
cd /opt/tlp/api
chmod +x scripts/sync_upcoming_previous_launches.js
mkdir -p logs
(crontab -l 2>/dev/null; echo "*/5 * * * * cd /opt/tlp/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1") | crontab -
crontab -l
```

