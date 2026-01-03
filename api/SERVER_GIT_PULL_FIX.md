# Fix Git Pull on Server

You have local changes that need to be handled before pulling.

## Option 1: Stash Changes (Recommended - Saves your changes)

```bash
cd /opt/tlp/api
git stash
git pull origin main
git stash pop  # Re-applies your local changes after pull
```

## Option 2: Commit Local Changes First

```bash
cd /opt/tlp/api
git add api/routes/subscriptions.js api/scripts/run_migrations.js
git commit -m "Server local changes"
git pull origin main
```

## Option 3: Discard Local Changes (⚠️ WARNING: Loses your changes)

```bash
cd /opt/tlp/api
git checkout -- api/routes/subscriptions.js api/scripts/run_migrations.js
git pull origin main
```

## Option 4: See What Changed First

```bash
cd /opt/tlp/api
git diff api/routes/subscriptions.js
git diff api/scripts/run_migrations.js
```

This shows what your local changes are, so you can decide if you want to keep them.

## Recommended: Stash and Pull

Run these commands:

```bash
cd /opt/tlp/api
git stash
git pull origin main
```

Then verify the file exists:

```bash
ls -la scripts/sync_upcoming_previous_launches.js
```

If the file exists, proceed with cron setup. If you need your local changes back:

```bash
git stash pop
```

