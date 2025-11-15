# Quick Sync Guide - Digital Ocean Server

## Quick Start (3 Steps)

### 1. Update Schema
```bash
ssh root@YOUR_DROPLET_IP
cd /var/www/tlp/api  # adjust path as needed
psql -U your_db_user -d your_db_name -f sql/017_ensure_launch_schema_complete.sql
```

### 2. Run Sync
```bash
node scripts/sync_launches_from_api.js --verbose
```

### 3. Verify
```bash
psql -U your_db_user -d your_db_name -c "SELECT COUNT(*) FROM launches;"
```

## Common Commands

```bash
# Test run (no changes)
node scripts/sync_launches_from_api.js --dry-run

# Test with 10 launches
node scripts/sync_launches_from_api.js --limit 10 --verbose

# Full production sync
node scripts/sync_launches_from_api.js --verbose

# Force sync (ignore cache)
node scripts/sync_launches_from_api.js --force --verbose
```

## Troubleshooting

```bash
# Check database connection
psql -U your_db_user -d your_db_name -c "SELECT 1"

# Check if schema is correct
psql -U your_db_user -d your_db_name -c "\d launches" | grep external_id

# Check recent syncs
psql -U your_db_user -d your_db_name -c "SELECT COUNT(*), MAX(updated_at) FROM launches;"
```

## Files Created

- `scripts/sync_launches_from_api.js` - Main sync script
- `sql/017_ensure_launch_schema_complete.sql` - Schema migration
- `scripts/SYNC_LAUNCHES_README.md` - Full documentation

