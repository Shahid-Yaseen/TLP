#!/usr/bin/env node
/**
 * Historical Launch Fetch Script
 * 
 * Fetches launches from today backward (historical data) with full details
 * and saves them to the database.
 * 
 * For each launch, makes an individual API request to fetch complete detailed data
 * including all fields, arrays, and nested objects.
 * 
 * Usage:
 *   node scripts/fetch_historical_launches.js [options]
 * 
 * Options:
 *   --dry-run    : Show what would be fetched without making changes
 *   --limit N    : Limit fetch to first N launches (for testing)
 *   --days N     : Fetch launches from last N days (default: all historical)
 *   --verbose    : Show detailed progress information
 * 
 * Note: This script automatically fetches detailed data for each launch
 * via individual API requests to ensure complete information.
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
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1]) : null;
const daysIndex = args.indexOf('--days');
const daysBack = daysIndex !== -1 && args[daysIndex + 1] ? parseInt(args[daysIndex + 1]) : null;

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
 * Fetch historical launches with pagination
 * Fetches from today backward
 */
async function fetchHistoricalLaunches() {
  const allLaunches = [];
  let offset = 0;
  const pageLimit = 100; // Space Devs API limit per page
  let hasMore = true;
  
  // Calculate date filter - fetch launches before today
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  const todayISO = today.toISOString();
  
  // If daysBack is specified, calculate the start date
  let startDateISO = null;
  if (daysBack && daysBack > 0) {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysBack);
    startDateISO = startDate.toISOString();
  }
  
  log(`Fetching historical launches (before ${todayISO})${startDateISO ? ` from last ${daysBack} days` : ''}...`, 'info');
  
  while (hasMore) {
    try {
      const params = {
        limit: pageLimit,
        offset: offset,
        ordering: '-net' // Order by launch date descending (newest first)
      };
      
      // Add start date filter if specified
      if (startDateISO) {
        params.net__gte = startDateISO;
      }
      
      verboseLog(`Fetching page: offset=${offset}, limit=${pageLimit}`);
      
      // Use fetchLaunchers with date filter to get historical launches
      // Add net__lt filter to get launches before today
      params.net__lt = todayISO;
      const response = await spaceDevsApi.fetchLaunchers(params);
      
      if (response.results && Array.isArray(response.results)) {
        // If daysBack is specified, filter results by date
        let filteredResults = response.results;
        if (startDateISO) {
          filteredResults = response.results.filter(launch => {
            const launchDate = launch.net || launch.launch_date;
            if (!launchDate) return false;
            const launchDateObj = new Date(launchDate);
            const startDateObj = new Date(startDateISO);
            return launchDateObj >= startDateObj;
          });
        }
        
        allLaunches.push(...filteredResults);
        log(`Fetched ${allLaunches.length} launches so far...`, 'info');
        
        // Check if there are more results
        hasMore = response.next !== null && response.results.length === pageLimit;
        offset += pageLimit;
        
        // Add delay to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      log(`Error fetching launches at offset ${offset}: ${error.message}`, 'error');
      if (verbose && error.stack) {
        console.error(error.stack);
      }
      // Continue with what we have
      hasMore = false;
    }
  }
  
  log(`Finished fetching ${allLaunches.length} total historical launches`, 'success');
  return allLaunches;
}

/**
 * Fetch detailed launch data by ID
 * Makes an individual API request to get complete launch details
 */
async function fetchLaunchDetails(launchId) {
  try {
    verboseLog(`Making API request for detailed launch data: ${launchId}`);
    const detailedData = await spaceDevsApi.fetchLauncherById(launchId);
    if (detailedData) {
      verboseLog(`Successfully fetched detailed data for launch ${launchId}`);
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

    // Always fetch detailed data for each launch to get complete information
    verboseLog(`Fetching detailed data for launch ${launcher.id}...`);
    const detailedData = await fetchLaunchDetails(launcher.id);
    let launchData = launcher;
    if (detailedData) {
      // Use the complete detailed API response - this will be saved as raw_data
      launchData = detailedData;
      verboseLog(`Successfully fetched detailed data for ${launcher.id} - complete API response will be saved`);
    } else {
      log(`Warning: Could not fetch details for ${launcher.id}, using basic data`, 'warn');
    }

    // Map and sync - the complete raw API response will be stored in raw_data field
    const mappedLaunch = launchMapper.mapLauncherToLaunch(launchData);
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
 * Main function
 */
async function main() {
  log('🚀 Starting Historical Launch Fetch Script', 'info');
  log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE SYNC'}`, 'info');
  if (limit) {
    log(`Limit: First ${limit} launches only`, 'warn');
  }
  if (daysBack) {
    log(`Time Range: Last ${daysBack} days`, 'info');
  } else {
    log(`Time Range: All historical launches (from today backward)`, 'info');
  }
  log(`Detail Mode: Fetching detailed data for each launch via API`, 'info');
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

    // Fetch historical launches
    log('Fetching historical launches from Space Devs API...', 'info');
    let allLaunchers;
    try {
      allLaunchers = await fetchHistoricalLaunches();
      if (allLaunchers.length === 0) {
        log('No historical launches found', 'warn');
        process.exit(0);
      }
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
      
      // Small delay to avoid overwhelming the database and API
      // Using longer delay since we're fetching detailed data for each launch
      if (i < allLaunchers.length - 1 && !isDryRun) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Delay between API calls
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

