#!/usr/bin/env node
/**
 * Launch Sync Script for Production Server
 * 
 * Syncs all launches from Space Devs API to the database
 * Handles errors gracefully and provides detailed logging
 * 
 * Usage:
 *   node scripts/sync_launches_from_api.js [options]
 * 
 * Options:
 *   --dry-run    : Show what would be synced without making changes
 *   --limit N    : Limit sync to first N launches (for testing)
 *   --force      : Force sync even if cache is not expired
 *   --verbose    : Show detailed progress information
 */

require('dotenv').config();
const { getPool, closePool } = require('../config/database');
const launchSync = require('../services/launchSync');
const spaceDevsApi = require('../services/spaceDevsApi');
const launchMapper = require('../services/launchMapper');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const forceSync = args.includes('--force');
const verbose = args.includes('--verbose');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1]) : null;

// Statistics
const stats = {
  total: 0,
  successful: 0,
  errors: 0,
  skipped: 0,
  errorDetails: [],
  startTime: null,
  endTime: null
};

/**
 * Log with timestamp
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Log verbose message
 */
function verboseLog(message) {
  if (verbose) {
    log(message);
  }
}

/**
 * Format duration
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW() as time, version() as version');
    log(`Database connected: PostgreSQL ${result.rows[0].version.split(' ')[1]}`, 'success');
    return true;
  } catch (error) {
    log(`Database connection failed: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Check if sync is needed
 */
async function checkSyncNeeded() {
  if (forceSync) {
    log('Force sync enabled, skipping cache check', 'warn');
    return true;
  }
  
  try {
    const isExpired = await launchSync.isCacheExpired(1);
    if (isExpired) {
      log('Cache expired, sync needed', 'info');
      return true;
    } else {
      log('Cache is still valid, skipping sync', 'info');
      log('Use --force to sync anyway', 'info');
      return false;
    }
  } catch (error) {
    log(`Error checking cache: ${error.message}`, 'error');
    log('Proceeding with sync anyway', 'warn');
    return true;
  }
}

/**
 * Sync a single launch
 */
async function syncLaunch(launcher, index, total) {
  try {
    if (!launcher || !launcher.id) {
      stats.skipped++;
      verboseLog(`Skipping invalid launcher at index ${index}`);
      return null;
    }

    verboseLog(`[${index + 1}/${total}] Processing: ${launcher.name || launcher.id}`);

    if (isDryRun) {
      log(`[DRY RUN] Would sync: ${launcher.name || launcher.id}`, 'info');
      stats.successful++;
      return null;
    }

    // Map and sync
    const mappedLaunch = launchMapper.mapLauncherToLaunch(launcher);
    if (!mappedLaunch || !mappedLaunch.external_id) {
      stats.skipped++;
      verboseLog(`Skipping launch without external_id: ${launcher.name || launcher.id}`);
      return null;
    }

    await launchSync.syncLaunchFromApi(mappedLaunch);
    stats.successful++;
    
    if ((index + 1) % 50 === 0) {
      log(`Progress: ${index + 1}/${total} launches synced (${stats.successful} successful, ${stats.errors} errors)`, 'info');
    }

    return mappedLaunch;
  } catch (error) {
    stats.errors++;
    const errorId = launcher?.id || launcher?.name || `index-${index}`;
    stats.errorDetails.push({
      id: errorId,
      name: launcher?.name || 'Unknown',
      error: error.message,
      stack: verbose ? error.stack : undefined
    });
    
    log(`Error syncing launch ${errorId}: ${error.message}`, 'error');
    if (verbose && error.stack) {
      console.error(error.stack);
    }
    return null;
  }
}

/**
 * Main sync function
 */
async function main() {
  log('🚀 Starting Launch Sync Script', 'info');
  log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE SYNC'}`, 'info');
  if (limit) {
    log(`Limit: First ${limit} launches only`, 'warn');
  }
  if (forceSync) {
    log('Force sync enabled', 'warn');
  }
  console.log('');

  stats.startTime = Date.now();

  try {
    // Test database connection
    log('Testing database connection...', 'info');
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }
    console.log('');

    // Check if sync is needed
    if (!forceSync) {
      log('Checking if sync is needed...', 'info');
      const syncNeeded = await checkSyncNeeded();
      if (!syncNeeded) {
        log('Sync not needed at this time', 'info');
        process.exit(0);
      }
      console.log('');
    }

    // Fetch all launches from API
    log('Fetching launches from Space Devs API...', 'info');
    let allLaunchers;
    try {
      allLaunchers = await spaceDevsApi.fetchAllLaunchers();
      log(`Fetched ${allLaunchers.length} launches from API`, 'success');
    } catch (error) {
      log(`Failed to fetch launches from API: ${error.message}`, 'error');
      process.exit(1);
    }
    console.log('');

    // Apply limit if specified
    if (limit && limit > 0) {
      allLaunchers = allLaunchers.slice(0, limit);
      log(`Limited to first ${allLaunchers.length} launches`, 'info');
    }

    stats.total = allLaunchers.length;
    log(`Starting sync of ${stats.total} launches...`, 'info');
    console.log('');

    // Sync each launch
    for (let i = 0; i < allLaunchers.length; i++) {
      await syncLaunch(allLaunchers[i], i, allLaunchers.length);
      
      // Small delay to avoid overwhelming the database
      if (i < allLaunchers.length - 1 && !isDryRun) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    stats.endTime = Date.now();
    const duration = stats.endTime - stats.startTime;

    // Print summary
    console.log('');
    log('═══════════════════════════════════════════════════════════', 'info');
    log('📊 SYNC SUMMARY', 'info');
    log('═══════════════════════════════════════════════════════════', 'info');
    log(`Total launches processed: ${stats.total}`, 'info');
    log(`✅ Successful: ${stats.successful}`, 'success');
    log(`❌ Errors: ${stats.errors}`, stats.errors > 0 ? 'error' : 'info');
    log(`⏭️  Skipped: ${stats.skipped}`, stats.skipped > 0 ? 'warn' : 'info');
    log(`⏱️  Duration: ${formatDuration(duration)}`, 'info');
    log(`📈 Rate: ${(stats.total / (duration / 1000)).toFixed(2)} launches/second`, 'info');
    log('═══════════════════════════════════════════════════════════', 'info');

    // Show error details if any
    if (stats.errors > 0 && stats.errorDetails.length > 0) {
      console.log('');
      log('⚠️  ERROR DETAILS (first 10):', 'warn');
      stats.errorDetails.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.name || err.id}: ${err.error}`);
      });
      if (stats.errorDetails.length > 10) {
        log(`   ... and ${stats.errorDetails.length - 10} more errors`, 'warn');
      }
    }

    // Exit with appropriate code
    if (stats.errors > 0 && stats.successful === 0) {
      log('All launches failed to sync', 'error');
      process.exit(1);
    } else if (stats.errors > stats.successful) {
      log('More errors than successes', 'warn');
      process.exit(1);
    } else {
      log('Sync completed successfully!', 'success');
      process.exit(0);
    }
  } catch (error) {
    stats.endTime = Date.now();
    log(`Fatal error: ${error.message}`, 'error');
    if (verbose && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    log(`Unhandled error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { main };

