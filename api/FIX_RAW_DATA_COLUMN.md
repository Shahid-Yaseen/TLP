# Fix Missing raw_data Column on Server

## Problem

The sync script is failing with:
```
error: column "raw_data" of relation "launches" does not exist
```

This means the `raw_data` column hasn't been added to the `launches` table on the server.

## Quick Fix (Recommended)

Run this SQL directly on the server:

```bash
# SSH into server
ssh root@your-server-ip

# Connect to database
cd /opt/tlp/api
psql -U postgres -d tlp_db -f scripts/fix_raw_data_column.sql
```

Or run the SQL directly:

```bash
psql -U postgres -d tlp_db << EOF
ALTER TABLE launches ADD COLUMN IF NOT EXISTS raw_data JSONB;
CREATE INDEX IF NOT EXISTS idx_launches_raw_data ON launches USING GIN (raw_data);
EOF
```

## Full Migration (Alternative)

If you want to run all pending migrations:

```bash
cd /opt/tlp/api
npm run migrate
```

This will run all migrations including `020_add_raw_api_response.sql` which adds the `raw_data` column.

## Verify Fix

After running the fix, verify the column exists:

```bash
psql -U postgres -d tlp_db -c "\d launches" | grep raw_data
```

Or:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'launches' AND column_name = 'raw_data';
```

You should see:
```
 column_name | data_type 
-------------+-----------
 raw_data    | jsonb
```

## Then Resume Sync

After fixing the column, you can resume the sync:

```bash
cd /opt/tlp/api
node scripts/fetch_historical_launches.js --verbose
```

The script will continue from where it left off (it's safe to re-run).

