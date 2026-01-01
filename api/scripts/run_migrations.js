#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * This script runs all SQL migrations in order to set up the TLP database schema.
 * 
 * Usage:
 *   node scripts/run_migrations.js [--dry-run] [--to=<migration_number>]
 * 
 * Options:
 *   --dry-run    Show SQL without executing
 *   --to=N       Run migrations up to and including N (e.g., --to=3)
 */

// Try multiple paths for .env file
const path = require('path');
const fs = require('fs');

// Possible .env file locations
const possiblePaths = [
  path.join(__dirname, '..', '.env'),           // api/.env (relative to scripts/)
  path.join(__dirname, '..', '..', '.env'),     // root .env (if exists)
  '/opt/tlp/api/.env',                           // Absolute path on server
  path.join(process.cwd(), '.env'),             // Current working directory
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`✅ Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  // Try default location
  require('dotenv').config();
  console.log('⚠️  Using default dotenv.config() - .env file may not be found');
}
const { Pool } = require('pg');

// Debug: Check if env vars are loaded
console.log('🔍 Environment check:');
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET (default: localhost)');
console.log('DB_PORT:', process.env.DB_PORT || 'NOT SET (default: 5432)');
console.log('DB_USER:', process.env.DB_USER || 'NOT SET (default: postgres)');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');
console.log('DB_DATABASE:', process.env.DB_DATABASE || 'NOT SET (default: tlp_db)');
console.log('');

// Validate required environment variables
if (!process.env.DB_PASSWORD) {
  console.error('❌ ERROR: DB_PASSWORD is not set in .env file');
  console.error('Please ensure /opt/tlp/api/.env contains DB_PASSWORD=your_password');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'tlp_db',
});

// Migration files in order
const MIGRATIONS = [
  '001_init_launchpad.sql',
  '002_launch_extensions.sql',
  '003_spacebase.sql',
  '004_news_section.sql',
  '005_user_management.sql',
  '006_supporting_features.sql',
  '007_indexes.sql',
  '008_user_profile_fields.sql',
  '009_enhanced_launch_schema.sql',
  '010_enhanced_agency_schema.sql',
  '011_enhanced_astronaut_schema.sql',
  '012_add_launch_updated_at.sql',
  '013_add_raw_data_to_launches.sql',
  '014_add_all_api_fields.sql',
  '015_add_missing_launch_fields.sql',
  '016_create_launch_arrays.sql',
  '017_ensure_launch_schema_complete.sql',
  '018_add_launch_comments.sql',
  '019_add_email_verification_code.sql',
  '020_add_raw_api_response.sql',
  '021_satellites_cache.sql',
  '022_add_article_classification_fields.sql',
  '023_add_author_to_launches.sql',
  '024_create_stock_tickers.sql',
  '025_create_subscriptions.sql',
];

// Track completed migrations
const MIGRATION_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    filename TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

async function getCompletedMigrations() {
  try {
    const result = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
    return new Set(result.rows.map(row => row.version));
  } catch (err) {
    // Table doesn't exist yet, return empty set
    return new Set();
  }
}

async function recordMigration(version, filename) {
  await pool.query(
    'INSERT INTO schema_migrations (version, filename) VALUES ($1, $2)',
    [version, filename]
  );
}

async function runMigration(filename, dryRun = false) {
  const filePath = path.join(__dirname, '..', 'sql', filename);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n📄 ${filename}`);
  console.log('─'.repeat(60));
  
  if (dryRun) {
    console.log(sql);
    console.log('\n[DRY RUN - No changes made]');
    return;
  }

  try {
    await pool.query('BEGIN');
    await pool.query(sql);
    await pool.query('COMMIT');
    console.log(`✅ Successfully executed ${filename}`);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(`❌ Error executing ${filename}:`, err.message);
    throw err;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const toArg = args.find(arg => arg.startsWith('--to='));
  const maxMigration = toArg ? parseInt(toArg.split('=')[1]) : null;

  console.log('🚀 TLP Database Migration Runner');
  console.log('═'.repeat(60));
  console.log(`Database: ${process.env.DB_DATABASE || 'tlp_db'}`);
  console.log(`Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
  if (dryRun) console.log('⚠️  DRY RUN MODE - No changes will be made');
  if (maxMigration) console.log(`📌 Running migrations up to ${maxMigration}`);
  console.log('═'.repeat(60));

  try {
    // Ensure migration tracking table exists
    await pool.query(MIGRATION_TABLE);

    // Get completed migrations
    const completed = await getCompletedMigrations();
    console.log(`\n📊 Completed migrations: ${completed.size}/${MIGRATIONS.length}`);

    let executed = 0;
    let skipped = 0;

    for (let i = 0; i < MIGRATIONS.length; i++) {
      const version = i + 1;
      const filename = MIGRATIONS[i];

      // Skip if migration number is beyond --to limit
      if (maxMigration && version > maxMigration) {
        console.log(`\n⏭️  Skipping ${filename} (beyond --to limit)`);
        skipped++;
        continue;
      }

      // Skip if already completed
      if (completed.has(version)) {
        console.log(`\n⏭️  Skipping ${filename} (already executed)`);
        skipped++;
        continue;
      }

      // Run migration
      await runMigration(filename, dryRun);

      // Record completion (if not dry run)
      if (!dryRun) {
        await recordMigration(version, filename);
      }

      executed++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Executed: ${executed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${MIGRATIONS.length}`);
    
    if (executed > 0 && !dryRun) {
      console.log('\n✨ Migration completed successfully!');
    } else if (dryRun) {
      console.log('\n✨ Dry run completed. No changes made.');
    } else {
      console.log('\n✨ All migrations are up to date.');
    }

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { runMigration, MIGRATIONS };

