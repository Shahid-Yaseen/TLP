#!/usr/bin/env node
/**
 * Check for New Launches Cron Job
 * 
 * This script checks for new launches from the Space Devs API and syncs them to the database.
 * Designed to run every 10 minutes via cron job.
 * 
 * It:
 * 1. Fetches recent launches from the API (upcoming and recent past launches)
 * 2. Compares with existing database records by external_id
 * 3. For any new launches, fetches detailed data and saves to database
 * 
 * Usage:
 *   node scripts/check_new_launches.js [options]
 * 
 * Options:
 *   --dry-run    : Show what would be synced without making changes
 *   --verbose    : Show detailed progress information
 *   --days N     : Check launches from last N days (default: 7 days)
 */

require('dotenv').config();
const { getPool, closePool } = require('../config/database');
const launchSync = require('../services/launchSync');
const spaceDevsApi = require('../services/spaceDevsApi');
const launchMapper = require('../services/launchMapper');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const daysIndex = args.indexOf('--days');
const daysBack = daysIndex !== -1 && args[daysIndex + 1] ? parseInt(args[daysIndex + 1]) : 7;

// Statistics
const stats = {
  checked: 0,
  new: 0,
  updated: 0,
  errors: 0,
  skipped: 0,
  startTime: Date.now()
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
 * Fetch recent launches from API
 */
async function fetchRecentLaunches() {
  const launches = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - daysBack);
  
  const startDateISO = startDate.toISOString().split('T')[0];
  const todayISO = today.toISOString().split('T')[0];
  
  log(`Fetching launches from ${startDateISO} to future (last ${daysBack} days + upcoming)...`, 'info');
  
  try {
    // Fetch upcoming launches using the dedicated /launches/upcoming/ endpoint
    log('Fetching upcoming launches...', 'info');
    const upcomingResponse = await spaceDevsApi.fetchUpcomingLaunches({
      limit: 100,
      ordering: 'net'
    });
    if (upcomingResponse.results && Array.isArray(upcomingResponse.results)) {
      launches.push(...upcomingResponse.results);
      log(`Fetched ${upcomingResponse.results.length} upcoming launches`, 'success');
    }
    
    // Fetch recent past launches (last N days)
    log(`Fetching recent launches from last ${daysBack} days...`, 'info');
    const recentParams = {
      limit: 100,
      ordering: '-net',
      net__gte: startDateISO,
      net__lt: todayISO
    };
    
    const recentResponse = await spaceDevsApi.fetchLaunchers(recentParams);
    if (recentResponse.results && Array.isArray(recentResponse.results)) {
      launches.push(...recentResponse.results);
      log(`Fetched ${recentResponse.results.length} recent launches`, 'success');
    }
    
    // Remove duplicates by external_id
    const uniqueLaunches = launches.reduce((acc, launch) => {
      const id = launch.id;
      if (id && !acc.find(l => l.id === id)) {
        acc.push(launch);
      }
      return acc;
    }, []);
    
    log(`Total unique launches to check: ${uniqueLaunches.length}`, 'info');
    return uniqueLaunches;
  } catch (error) {
    log(`Error fetching launches from API: ${error.message}`, 'error');
    if (verbose && error.stack) {
      console.error(error.stack);
    }
    return [];
  }
}

/**
 * Get existing launch external_ids from database
 */
async function getExistingLaunchIds() {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT external_id 
      FROM launches 
      WHERE external_id IS NOT NULL
    `);
    
    const existingIds = new Set(result.rows.map(row => row.external_id.toString()));
    log(`Found ${existingIds.size} existing launches in database`, 'info');
    return existingIds;
  } catch (error) {
    log(`Error fetching existing launch IDs: ${error.message}`, 'error');
    return new Set();
  }
}

/**
 * Fetch detailed launch data
 */
async function fetchLaunchDetails(launchId) {
  try {
    verboseLog(`Fetching detailed data for launch ${launchId}...`);
    const detailedData = await spaceDevsApi.fetchLauncherById(launchId);
    if (detailedData) {
      verboseLog(`Successfully fetched detailed data for ${launchId}`);
      return detailedData;
    }
    return null;
  } catch (error) {
    log(`Error fetching details for launch ${launchId}: ${error.message}`, 'error');
    if (verbose && error.stack) {
      console.error(error.stack);
    }
    return null;
  }
}

/**
 * Sync a single launch
 */
async function syncLaunch(launcher, isNew) {
  try {
    if (!launcher || !launcher.id) {
      stats.skipped++;
      verboseLog(`Skipping invalid launcher: ${launcher?.name || 'unknown'}`);
      return null;
    }

    if (isDryRun) {
      log(`[DRY RUN] Would ${isNew ? 'create' : 'update'}: ${launcher.name || launcher.id}`, 'info');
      if (isNew) stats.new++;
      else stats.updated++;
      return null;
    }

    // Fetch detailed data for complete information (including raw_data)
    verboseLog(`Fetching detailed data for launch ${launcher.id}...`);
    const detailedData = await fetchLaunchDetails(launcher.id);
    let launchData = launcher;
    
    if (detailedData) {
      launchData = detailedData;
      verboseLog(`Using detailed data for ${launcher.id} - will save complete raw_data`);
    } else {
      log(`Warning: Could not fetch details for ${launcher.id}, using basic data`, 'warn');
    }

    // Map and sync - this will include raw_data (complete API response)
    const mappedLaunch = launchMapper.mapLauncherToLaunch(launchData);
    if (mappedLaunch && mappedLaunch.raw_data) {
      verboseLog(`Launch ${launcher.id} has raw_data ready to save`);
    }
    if (!mappedLaunch || !mappedLaunch.external_id) {
      stats.skipped++;
      verboseLog(`Skipping launch without external_id: ${launcher.name || launcher.id}`);
      return null;
    }

    await launchSync.syncLaunchFromApi(mappedLaunch);
    
    if (isNew) {
      stats.new++;
      log(`✅ New launch synced: ${mappedLaunch.name || mappedLaunch.external_id}`, 'success');
    } else {
      stats.updated++;
      verboseLog(`Updated launch: ${mappedLaunch.name || mappedLaunch.external_id}`);
    }

    return mappedLaunch;
  } catch (error) {
    stats.errors++;
    const errorId = launcher?.id || launcher?.name || 'unknown';
    log(`Error syncing launch ${errorId}: ${error.message}`, 'error');
    if (verbose && error.stack) {
      console.error(error.stack);
    }
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  log('🚀 Starting New Launches Check', 'info');
  log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE SYNC'}`, 'info');
  log(`Checking launches from last ${daysBack} days + upcoming`, 'info');
  console.log('');

  try {
    const pool = getPool();
    await pool.query('SELECT 1'); // Test connection
    log('Database connection established', 'success');
    console.log('');

    // Get existing launch IDs from database
    log('Checking existing launches in database...', 'info');
    const existingIds = await getExistingLaunchIds();
    console.log('');

    // Fetch recent launches from API
    log('Fetching recent launches from Space Devs API...', 'info');
    const recentLaunches = await fetchRecentLaunches();
    console.log('');

    if (recentLaunches.length === 0) {
      log('No recent launches found to check', 'info');
      return;
    }

    stats.checked = recentLaunches.length;
    log(`Checking ${stats.checked} launches for new/updated data...`, 'info');
    console.log('');

    // Process each launch
    for (let i = 0; i < recentLaunches.length; i++) {
      const launch = recentLaunches[i];
      const launchId = launch.id?.toString();
      
      if (!launchId) {
        stats.skipped++;
        continue;
      }

      const isNew = !existingIds.has(launchId);
      await syncLaunch(launch, isNew);
      
      // Small delay to avoid overwhelming the API/database
      if (i < recentLaunches.length - 1 && !isDryRun) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Summary
    const duration = Date.now() - stats.startTime;
    const durationSeconds = (duration / 1000).toFixed(1);
    
    console.log('');
    log('📊 Check Complete', 'info');
    log(`   Checked: ${stats.checked} launches`, 'info');
    log(`   New: ${stats.new} launches`, stats.new > 0 ? 'success' : 'info');
    log(`   Updated: ${stats.updated} launches`, stats.updated > 0 ? 'success' : 'info');
    log(`   Skipped: ${stats.skipped} launches`, 'info');
    log(`   Errors: ${stats.errors} launches`, stats.errors > 0 ? 'error' : 'info');
    log(`   Duration: ${durationSeconds}s`, 'info');
    
    if (stats.new > 0 || stats.updated > 0) {
      log(`✅ Successfully processed ${stats.new + stats.updated} launches`, 'success');
    } else if (stats.errors === 0) {
      log('✅ No new launches found - database is up to date', 'success');
    }

  } catch (error) {
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
  main().catch(error => {
    log(`Unhandled error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { main };

