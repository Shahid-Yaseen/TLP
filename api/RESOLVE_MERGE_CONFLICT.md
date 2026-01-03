# Resolve Merge Conflict on Server

You have a merge conflict in `api/scripts/run_migrations.js`. Here's how to fix it:

## Quick Fix (Keep Server Version)

Run these commands on your server:

```bash
cd /opt/tlp/api

# Check what's conflicted
git status

# Keep the incoming version (from git)
git checkout --theirs scripts/run_migrations.js

# Mark as resolved
git add scripts/run_migrations.js

# Complete the merge
git commit -m "Resolve merge conflict - keep server version"

# Now pull the latest
git pull origin main
```

## Alternative: Keep Your Local Changes

If you want to keep your server's local changes:

```bash
cd /opt/tlp/api

# Keep your local version
git checkout --ours scripts/run_migrations.js

# Mark as resolved
git add scripts/run_migrations.js

# Complete the merge
git commit -m "Resolve merge conflict - keep local version"

# Now pull
git pull origin main
```

## All-in-One Command (Keep Server Version)

```bash
cd /opt/tlp/api && \
git checkout --theirs scripts/run_migrations.js && \
git add scripts/run_migrations.js && \
git commit -m "Resolve merge conflict" && \
git pull origin main
```

## After Resolving

Once the conflict is resolved and you've pulled, update your cron job:

```bash
crontab -l | grep -v "sync_upcoming_previous_launches" | crontab - && \
rm -f /opt/tlp/api/.rate_limit_state.json && \
(crontab -l 2>/dev/null; echo "*/2 * * * * cd /opt/tlp/api && /usr/bin/node scripts/sync_upcoming_previous_launches.js --rate-limit 210 >> logs/upcoming_previous_sync.log 2>&1") | crontab - && \
crontab -l
```

