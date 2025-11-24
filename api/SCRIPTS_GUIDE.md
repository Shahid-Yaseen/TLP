# TLP API Scripts Guide

This guide explains how to run database migrations, seed crew members, and understand the API changes for serving data from the database.

## Prerequisites

1. **Database Setup**: Ensure PostgreSQL is running and accessible
2. **Environment Variables**: Create a `.env` file in the `api/` directory with:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=tlp_db
   ```

3. **Dependencies**: Install npm packages:
   ```bash
   cd api
   npm install
   ```

## 1. Database Migrations

### What are migrations?
Migrations set up your database schema (tables, columns, indexes, etc.). They need to be run before seeding data.

### Running All Migrations

**From the `api/` directory:**

```bash
# Option 1: Using npm script (recommended)
npm run migrate

# Option 2: Direct node command
node scripts/run_migrations.js
```

### Dry Run (Preview SQL without executing)

```bash
npm run migrate:dry-run
# or
node scripts/run_migrations.js --dry-run
```

### Running Specific Migrations

```bash
# Run migrations up to migration 019
node scripts/run_migrations.js --to=19
```

### What Migrations Do

The migrations in `api/sql/` create:
- Core tables (launches, rockets, providers, etc.)
- User management tables
- News and spacebase tables
- Crew members table
- Indexes for performance
- Email verification support
- Raw API response storage

### Migration Files Order

Migrations are numbered and run in order:
- `001_init_launchpad.sql` - Base schema
- `002_launch_extensions.sql` - Launch enhancements
- `003_spacebase.sql` - Spacebase tables
- `004_news_section.sql` - News tables
- `005_user_management.sql` - User/auth tables
- ... and so on

**Important**: Always run migrations in order. The script handles this automatically.

## 2. Seeding Crew Members

### What is seeding?
Seeding populates the database with initial data. The crew members script adds team members for the About Us page.

### Running Crew Members Seed Script

**From the `api/` directory:**

```bash
# Option 1: Direct node command
node scripts/seed_crew_members.js

# Option 2: Make it executable and run
chmod +x scripts/seed_crew_members.js
./scripts/seed_crew_members.js
```

### What the Script Does

1. Connects to the database using `.env` configuration
2. Inserts crew member data including:
   - Name, location, category
   - Title, bio, profile image URL
   - Coordinates for map display
   - Active status
3. Uses `ON CONFLICT` to update existing members (upsert)
4. Logs success/failure for each member

### Crew Member Data Structure

The script includes crew members with:
- `first_name`, `last_name`, `full_name`
- `location` (e.g., "SPACE COAST, FL")
- `category` (e.g., "ADVISORS", "PRODUCTION", "JOURNALISTS")
- `title` (e.g., "Chief Advisor")
- `bio` (description)
- `profile_image_url` (optional - shows gradient if missing)
- `coordinates` (JSONB with lat/lng for map)
- `is_active` (boolean)

### Verifying Crew Members

After seeding, verify the data:

```bash
# Connect to PostgreSQL
psql -U postgres -d tlp_db

# Check crew members
SELECT id, full_name, location, category, is_active FROM crew_members ORDER BY category, full_name;

# Exit psql
\q
```

## 3. API Changes: Database-First Approach

### Overview
The API has been updated to serve launch data from the local database instead of making external API calls each time. This improves:
- **Performance**: Faster responses
- **Reliability**: Works even if external API is down
- **Cost**: Reduces external API rate limits

### Key Changes

#### Launch Detail Endpoint (`/api/launches/:id`)

**File**: `api/routes/launches.js`

**What Changed**:
1. **Priority**: Fetches from database first
2. **Fallback**: Only calls external API if data not in DB
3. **Raw Data Storage**: Saves complete API responses in `raw_data` JSONB column
4. **Response Metadata**: Includes `_source` field indicating data source

**How It Works**:
```javascript
// 1. Try to get from database
const launch = await getLaunchFromDB(launchId);

// 2. If found, return it (with _source: "database")
if (launch) {
  return formatLaunchResponse(launch, { source: 'database' });
}

// 3. If not found, fetch from external API
const apiData = await fetchFromExternalAPI(launchId);

// 4. Save to database for future use
await saveLaunchToDB(apiData);

// 5. Return with _source: "api"
return formatLaunchResponse(apiData, { source: 'api' });
```

### No Action Required

**The API changes are already in place!** You don't need to run any scripts. The code in `api/routes/launches.js` already:
- ✅ Checks database first
- ✅ Falls back to external API if needed
- ✅ Saves responses to database
- ✅ Returns data with source metadata

### Verifying API Changes

1. **Check API Response**:
   ```bash
   curl http://localhost:3007/api/launches/haste-leidos-3
   ```
   
   Look for `"_source": "database"` in the response.

2. **Check Database**:
   ```sql
   -- See how many launches have detailed data
   SELECT COUNT(*) FROM launches WHERE raw_data IS NOT NULL;
   
   -- Check a specific launch
   SELECT id, name, net, raw_data IS NOT NULL as has_raw_data 
   FROM launches 
   WHERE slug = 'haste-leidos-3';
   ```

## 4. Complete Setup Workflow

### For New Server/Environment

```bash
# 1. Navigate to API directory
cd api

# 2. Install dependencies
npm install

# 3. Create .env file (if not exists)
cp .env.example .env
# Edit .env with your database credentials

# 4. Run all migrations
npm run migrate

# 5. Seed crew members
node scripts/seed_crew_members.js

# 6. (Optional) Seed other data
npm run seed:roles
npm run seed:countries

# 7. Start the API server
npm start
# or for development
npm run dev
```

### For Existing Server (After Code Updates)

```bash
# 1. Pull latest code
cd /opt/tlp
git pull origin main

# 2. Install/update dependencies
cd api
npm install

# 3. Run new migrations (if any)
npm run migrate

# 4. Seed/update crew members
node scripts/seed_crew_members.js

# 5. Restart API server
pm2 restart tlp-api
# or
systemctl restart tlp-api
```

## 5. Troubleshooting

### Migration Errors

**Error**: "relation already exists"
- **Solution**: Migrations are idempotent - safe to run multiple times. This is normal.

**Error**: "connection refused"
- **Solution**: Check database is running and `.env` has correct credentials.

**Error**: "permission denied"
- **Solution**: Ensure database user has CREATE TABLE permissions.

### Seed Script Errors

**Error**: "duplicate key value violates unique constraint"
- **Solution**: This is handled by `ON CONFLICT` - the script updates existing records. Safe to run multiple times.

**Error**: "relation 'crew_members' does not exist"
- **Solution**: Run migrations first: `npm run migrate`

### API Not Serving from Database

**Check**:
1. Is the database running?
2. Are migrations run?
3. Is data in the `launches` table?
4. Check API logs for errors

**Force Refresh**:
- The API automatically fetches from external API if data not in DB
- To force refresh, you can delete a launch record and it will fetch fresh data

## 6. Useful Commands Summary

```bash
# Migrations
npm run migrate              # Run all migrations
npm run migrate:dry-run      # Preview SQL
node scripts/run_migrations.js --to=19  # Run up to specific migration

# Seeding
node scripts/seed_crew_members.js       # Seed crew members
npm run seed:roles           # Seed roles/permissions
npm run seed:countries       # Seed countries

# Database
psql -U postgres -d tlp_db   # Connect to database
SELECT * FROM crew_members;  # View crew members
SELECT COUNT(*) FROM launches WHERE raw_data IS NOT NULL;  # Check launch data

# Server
npm start                    # Start API server
npm run dev                  # Start with nodemon (auto-reload)
pm2 restart tlp-api          # Restart with PM2
```

## 7. Production Deployment

When deploying to production:

1. **Migrations run automatically** via GitHub Actions workflow (`.github/workflows/deploy-api.yml`)
2. **Crew members** should be seeded manually or added via admin panel
3. **API changes** are automatically applied when code is deployed

The deployment workflow includes:
```bash
npm ci --production
npm run migrate
pm2 restart tlp-api
```

## Need Help?

- Check migration logs in console output
- Check API logs: `pm2 logs tlp-api` or `tail -f api/server.log`
- Verify database connection: `node api/test_db_connection.js`

