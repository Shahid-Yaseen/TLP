# How to Run Database Migrations

## Problem: "relation launches does not exist"

If you see this error, it means the database hasn't been initialized yet. You need to run all migrations in order, starting from `001_init_launchpad.sql`.

## Option 1: Use the Migration Runner Script (Recommended)

```bash
# From your project directory
cd /path/to/api

# Run all pending migrations
node scripts/run_migrations.js

# Or with dry-run to see what will happen
node scripts/run_migrations.js --dry-run
```

## Option 2: Run Migrations Manually in psql

### Step 1: Connect to your database
```bash
psql -U your_db_user -d your_db_name
```

### Step 2: Navigate to the sql directory
```sql
\cd /path/to/api/sql
```

### Step 3: Run migrations in order
```sql
-- Run each migration file in order:
\i 001_init_launchpad.sql
\i 002_launch_extensions.sql
\i 003_spacebase.sql
\i 004_news_section.sql
\i 005_user_management.sql
\i 006_supporting_features.sql
\i 007_indexes.sql
\i 008_user_profile_fields.sql
\i 009_enhanced_launch_schema.sql
\i 010_enhanced_agency_schema.sql
\i 011_enhanced_astronaut_schema.sql
\i 012_add_launch_updated_at.sql
\i 013_add_raw_data_to_launches.sql
\i 014_add_all_api_fields.sql
\i 015_add_missing_launch_fields.sql
\i 016_create_launch_arrays.sql
\i 017_ensure_launch_schema_complete.sql
```

### Step 4: Verify the launches table exists
```sql
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'launches'
);

-- Check key columns
\d launches
```

## Option 3: Run All at Once (if you're in psql)

If you're already in psql and in the sql directory:

```sql
-- Make sure you're in the sql directory
\cd /path/to/api/sql

-- Run the combined script
\i RUN_ALL_MIGRATIONS.sql
```

## Option 4: Using psql from Command Line

```bash
# Run all migrations from command line
cd /path/to/api/sql

psql -U your_db_user -d your_db_name -f 001_init_launchpad.sql
psql -U your_db_user -d your_db_name -f 002_launch_extensions.sql
psql -U your_db_user -d your_db_name -f 003_spacebase.sql
# ... continue for all files
psql -U your_db_user -d your_db_name -f 017_ensure_launch_schema_complete.sql
```

Or use a loop:

```bash
cd /path/to/api/sql
for file in $(ls -1 *.sql | sort); do
    echo "Running $file..."
    psql -U your_db_user -d your_db_name -f "$file"
done
```

## Quick Fix for Your Current Situation

Since you're already in psql and got the error, here's what to do:

```sql
-- 1. First, make sure you're connected to the right database
\c your_database_name

-- 2. Check if you're in the right directory (if using \i)
\cd /path/to/api/sql

-- 3. Run the first migration to create the launches table
\i 001_init_launchpad.sql

-- 4. Then continue with the rest
\i 002_launch_extensions.sql
\i 003_spacebase.sql
-- ... (continue for all 17 migrations)

-- 5. Finally, verify
\d launches
```

## Verification

After running all migrations, verify everything is set up:

```sql
-- Check launches table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'launches'
) as launches_table_exists;

-- Check key columns exist
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'launches'
AND column_name IN ('external_id', 'updated_at', 'status_json', 'rocket_json')
ORDER BY column_name;

-- Count tables created
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';
```

## Troubleshooting

### Error: "relation already exists"
- This is OK - migrations use `IF NOT EXISTS` clauses
- The migration will skip creating existing objects

### Error: "permission denied"
- Make sure you're using a user with CREATE TABLE permissions
- Try: `GRANT ALL PRIVILEGES ON DATABASE your_db_name TO your_db_user;`

### Error: "could not open file"
- Make sure you're in the correct directory
- Use absolute paths: `\i /full/path/to/api/sql/001_init_launchpad.sql`

## Next Steps

After running all migrations:
1. Verify the schema is complete
2. Run the sync script: `node scripts/sync_launches_from_api.js --limit 10 --verbose`

