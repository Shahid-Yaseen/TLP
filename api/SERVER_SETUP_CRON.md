# Set Up Cron Job on Server - Step by Step

Since the cron job is not set up yet, run these commands on your server:

## Step 1: Navigate to API Directory

```bash
cd /opt/tlp/api
```

## Step 2: Find Node.js Path

```bash
which node
```

**Note the path** (usually `/usr/bin/node` or `/usr/local/bin/node`)

## Step 3: Make Scripts Executable

```bash
chmod +x scripts/sync_upcoming_previous_launches.js
chmod +x scripts/setup_cron_on_deploy.sh
```

## Step 4: Create Logs Directory

```bash
mkdir -p logs
```

## Step 5: Set Up Cron Job

**Option A: Use the setup script (recommended)**

```bash
npm run setup:cron
```

**Option B: Manual setup**

Replace `/usr/bin/node` with your actual node path from Step 2:

```bash
# For default rate limit (15 calls/hour) - runs every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * cd /opt/tlp/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1") | crontab -
```

**Option C: For Advanced Supporter (210 calls/hour) - runs every 2 minutes**

```bash
(crontab -l 2>/dev/null; echo "*/2 * * * * cd /opt/tlp/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 210 >> logs/upcoming_previous_sync.log 2>&1") | crontab -
```

## Step 6: Verify It's Set Up

```bash
crontab -l
```

You should see a line like:
```
*/5 * * * * cd /opt/tlp/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1
```

## Step 7: Test It Works

```bash
# Test manually first
cd /opt/tlp/api
node scripts/sync_upcoming_previous_launches.js --dry-run --verbose
```

## Step 8: Wait and Check Logs

Wait 5 minutes, then check:

```bash
tail -20 /opt/tlp/api/logs/upcoming_previous_sync.log
```

You should see sync activity.

## Complete Setup Command (Copy & Paste)

If you know your node path is `/usr/bin/node`, run this:

```bash
cd /opt/tlp/api && \
chmod +x scripts/sync_upcoming_previous_launches.js && \
mkdir -p logs && \
(crontab -l 2>/dev/null; echo "*/5 * * * * cd /opt/tlp/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1") | crontab - && \
echo "✅ Cron job set up! Verify with: crontab -l"
```

## Troubleshooting

### If node path is different:

```bash
# Find node
which node

# Use that path in the cron command
# Example if node is at /usr/local/bin/node:
(crontab -l 2>/dev/null; echo "*/5 * * * * cd /opt/tlp/api && /usr/local/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 15 >> logs/upcoming_previous_sync.log 2>&1") | crontab -
```

### Check if script exists:

```bash
ls -la /opt/tlp/api/scripts/sync_upcoming_previous_launches.js
```

### Test script manually:

```bash
cd /opt/tlp/api
node scripts/sync_upcoming_previous_launches.js --dry-run
```

