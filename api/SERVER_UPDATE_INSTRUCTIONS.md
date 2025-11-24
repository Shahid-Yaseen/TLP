# Server Update Instructions

## Quick Fix: Pull Latest Code on Server

SSH into your production server and run:

```bash
# Navigate to the project directory
cd /opt/tlp

# Pull latest changes from GitHub
git pull origin main

# Verify the script exists
ls -la api/scripts/seed_crew_members.js

# Now run the script
cd api
node scripts/seed_crew_members.js
```

## Option 2: Manual File Copy (If Git Pull Doesn't Work)

If you can't pull from git, manually copy the file:

```bash
# On your local machine, copy the file to server
scp api/scripts/seed_crew_members.js root@your-server-ip:/opt/tlp/api/scripts/

# Then on server, make it executable
ssh root@your-server-ip
chmod +x /opt/tlp/api/scripts/seed_crew_members.js
cd /opt/tlp/api
node scripts/seed_crew_members.js
```

## Option 3: Wait for Next Deployment

The file will be automatically deployed when you push changes to the `api/**` directory, which triggers the GitHub Actions workflow.

## Verify Script is Available

After pulling/copying, verify:

```bash
cd /opt/tlp/api
ls -la scripts/seed_crew_members.js
# Should show the file exists

# Check file permissions
chmod +x scripts/seed_crew_members.js

# Run the script
node scripts/seed_crew_members.js
```

