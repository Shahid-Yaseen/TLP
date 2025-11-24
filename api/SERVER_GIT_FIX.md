# Fix Git Pull on Server

## Problem
Local changes to `web/package-lock.json` and `web/package.json` are preventing git pull.

## Solution Options

### Option 1: Stash Changes (Recommended)
This saves your local changes temporarily, pulls the latest code, then you can decide what to do:

```bash
cd /opt/tlp

# Stash local changes
git stash

# Pull latest code
git pull origin main

# Verify the script exists
ls -la api/scripts/seed_crew_members.js

# Run the script
cd api
node scripts/seed_crew_members.js
```

**To restore stashed changes later (if needed):**
```bash
git stash pop
```

### Option 2: Discard Local Changes (If package.json changes aren't important)
This will overwrite local changes with the repository version:

```bash
cd /opt/tlp

# Discard changes to package files
git checkout -- web/package-lock.json web/package.json

# Pull latest code
git pull origin main

# Verify and run
ls -la api/scripts/seed_crew_members.js
cd api
node scripts/seed_crew_members.js
```

### Option 3: Commit Local Changes First
If you want to keep the local changes:

```bash
cd /opt/tlp

# Add and commit local changes
git add web/package-lock.json web/package.json
git commit -m "Local package.json changes on server"

# Pull latest code (may create merge conflict)
git pull origin main

# If merge conflict, resolve it, then:
git add .
git commit -m "Merge remote changes"

# Run the script
cd api
node scripts/seed_crew_members.js
```

## Recommended: Option 1 (Stash)

This is the safest approach - it preserves your changes but allows the pull to succeed.

