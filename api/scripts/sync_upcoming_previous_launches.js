#!/usr/bin/env node
/**
 * Sync Upcoming and Previous Launches Cron Job
 * 
 * This script fetches upcoming and previous launches from the Space Devs API
 * and syncs them to the database while respecting rate limits.
 * 
 * Rate Limits:
 * - Default: 210 calls per hour (Advanced Supporter)
 * - Free tier: 15 calls per hour
 * 
 * Usage:
 *   node scripts/sync_upcoming_previous_launches.js [options]
 * 
 * Options:
 *   --dry-run    : Show what would be synced without making changes
 *   --verbose    : Show detailed progress information
 *   --rate-limit N : Set custom rate limit (default: 210 calls/hour)
 *   --upcoming-only : Only sync upcoming launches
 *   --previous-only : Only sync previous launches
 */

require('dotenv').config();
const { getPool, closePool } = require('../config/database');
const launchSync = require('../services/launchSync');
const spaceDevsApi = require('../services/spaceDevsApi');
const launchMapper = require('../services/launchMapper');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const upcomingOnly = args.includes('--upcoming-only');
const previousOnly = args.includes('--previous-only');
const rateLimitIndex = args.indexOf('--rate-limit');
const rateLimit = rateLimitIndex !== -1 && args[rateLimitIndex + 1]
  ? parseInt(args[rateLimitIndex + 1])
  : parseInt(process.env.SPACE_DEVS_RATE_LIMIT) || 210; // Default: 210 calls/hour (Advanced Supporter)

// Rate limiting state file
const RATE_LIMIT_STATE_FILE = path.join(__dirname, '../.rate_limit_state.json');

// Statistics
const stats = {
  upcoming: { fetched: 0, synced: 0, errors: 0, fullDetails: 0, listData: 0 },
  previous: { fetched: 0, synced: 0, errors: 0 },
  apiCalls: 0,
  startTime: Date.now()
};

/**
 * Load rate limit state from file
 */
function loadRateLimitState() {
  try {
    if (fs.existsSync(RATE_LIMIT_STATE_FILE)) {
      const data = fs.readFileSync(RATE_LIMIT_STATE_FILE, 'utf8');
      const state = JSON.parse(data);
      // Clean up stale entries (older than 1 hour) automatically
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      if (state.calls && Array.isArray(state.calls)) {
        const originalLength = state.calls.length;
        state.calls = state.calls.filter(timestamp => timestamp > oneHourAgo);
        // Save cleaned state if entries were removed
        if (state.calls.length !== originalLength) {
          saveRateLimitState(state);
        }
      }
      return state;
    }
  } catch (error) {
    // If file doesn't exist or is corrupted, start fresh
  }
  return { calls: [], lastReset: Date.now() };
}

/**
 * Save rate limit state to file
 */
function saveRateLimitState(state) {
  try {
    fs.writeFileSync(RATE_LIMIT_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    log(`Warning: Could not save rate limit state: ${error.message}`, 'warn');
  }
}

/**
 * Check if we can make an API call based on rate limit
 * @returns {boolean} True if we can make a call
 */
function canMakeApiCall() {
  const state = loadRateLimitState();
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);

  // Remove calls older than 1 hour
  state.calls = state.calls.filter(timestamp => timestamp > oneHourAgo);

  // Check if we're under the limit
  const canCall = state.calls.length < rateLimit;

  if (canCall) {
    // Record this call
    state.calls.push(now);
    saveRateLimitState(state);
  }

  return canCall;
}

/**
 * Wait until we can make an API call
 * @returns {Promise<void>}
 */
async function waitForRateLimit() {
  let attempts = 0;
  const maxAttempts = 60; // Allow more attempts (1 hour max wait)

  while (!canMakeApiCall() && attempts < maxAttempts) {
    attempts++;
    const state = loadRateLimitState();
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    state.calls = state.calls.filter(timestamp => timestamp > oneHourAgo);

    if (state.calls.length >= rateLimit) {
      // Find the oldest call
      const oldestCall = Math.min(...state.calls);
      const waitTime = (oldestCall + (60 * 60 * 1000)) - now + 1000; // Add 1 second buffer

      if (waitTime > 0 && waitTime < 3600000) { // Don't wait more than 1 hour
        const waitMinutes = Math.ceil(waitTime / 60000);
        // Only log every 5 attempts to avoid spam
        if (attempts % 5 === 1) {
          log(`Rate limit reached (${state.calls.length}/${rateLimit} calls). Waiting ${waitMinutes} minute(s)...`, 'warn');
        }
        await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 60000))); // Wait max 1 minute at a time
      } else if (waitTime > 3600000) {
        // If wait time is more than 1 hour, something is wrong - clear old state
        log(`Rate limit state appears stale. Clearing old calls...`, 'warn');
        state.calls = [];
        saveRateLimitState(state);
        break;
      } else {
        // Wait time is negative or zero, should be able to proceed
        break;
      }
    } else {
      // Should be able to make call now
      break;
    }
  }

  if (attempts >= maxAttempts) {
    // Instead of throwing error, clear stale state and continue
    log(`Rate limit wait exceeded max attempts. Clearing stale state and continuing...`, 'warn');
    const state = loadRateLimitState();
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    state.calls = state.calls.filter(timestamp => timestamp > oneHourAgo);
    saveRateLimitState(state);
  }
}

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
 * Fetch upcoming launches - makes 1 API call per run
 * Cron runs every 1 minute, so 1 call × 60 runs/hour = 60 calls/hour
 */
async function fetchUpcomingLaunches() {
  log('Fetching upcoming launches from Space Devs API...', 'info');
  const allLaunches = [];

  try {
    // Check rate limit before API call
    await waitForRateLimit();

    // Fetch first page (most recent launches) - 1 API call per run
    const offset = 0;
    // Lower limit to 20 for more efficiency as requested by user
    // most cron runs will only have a few new/updated launches
    const limit = 20;

    verboseLog(`Fetching upcoming launches (offset: ${offset}, limit: ${limit})...`);
    const response = await spaceDevsApi.fetchUpcomingLaunches({ limit, offset });
    stats.apiCalls++;

    if (response.results && Array.isArray(response.results)) {
      allLaunches.push(...response.results);
      log(`Fetched ${response.results.length} upcoming launches`, 'success');
    }

    stats.upcoming.fetched = allLaunches.length;
    log(`Total upcoming launches fetched: ${allLaunches.length} (1 API call)`, 'success');
    return allLaunches;
  } catch (error) {
    log(`Error fetching upcoming launches: ${error.message}`, 'error');
    if (verbose && error.stack) {
      console.error(error.stack);
    }
    return [];
  }
}

/**
 * Fetch previous launches - makes 1 API call per run
 * Cron runs every 10 minutes, so 1 call × 6 runs/hour = 6 calls/hour
 */
async function fetchPreviousLaunches() {
  log('Fetching previous launches from Space Devs API...', 'info');
  const allLaunches = [];

  try {
    // Check rate limit before API call
    await waitForRateLimit();

    // Fetch first page (most recent previous launches) - 1 API call per run
    const offset = 0;
    const limit = 100;

    // Only fetch recent previous launches (last 30 days) to avoid too many API calls
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

    verboseLog(`Fetching previous launches (offset: ${offset}, limit: ${limit})...`);
    const response = await spaceDevsApi.fetchPreviousLaunches({
      limit,
      offset,
      net__gte: dateFilter // Only fetch launches from last 30 days
    });
    stats.apiCalls++;

    if (response.results && Array.isArray(response.results)) {
      allLaunches.push(...response.results);
      log(`Fetched ${response.results.length} previous launches (1 API call)`, 'success');
    }

    stats.previous.fetched = allLaunches.length;
    log(`Total previous launches fetched: ${allLaunches.length} (1 API call)`, 'success');
    return allLaunches;
  } catch (error) {
    log(`Error fetching previous launches: ${error.message}`, 'error');
    if (verbose && error.stack) {
      console.error(error.stack);
    }
    return [];
  }
}

/**
 * Check if launch date is within the next 2 days (today and tomorrow only)
 * @param {string} launchDate - ISO date string
 * @returns {boolean} True if launch is within today or tomorrow
 */
function isLaunchInNextDays(launchDate) {
  if (!launchDate) return false;

  try {
    const launch = new Date(launchDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999); // End of tomorrow

    const launchDateOnly = new Date(launch);
    launchDateOnly.setHours(0, 0, 0, 0);

    return launchDateOnly >= today && launchDateOnly <= tomorrow;
  } catch (error) {
    return false;
  }
}

/**
 * Sync a launch to the database
 * Only fetches full launch details for launches in the next 2-3 days to optimize API calls
 * The list endpoint often returns empty vid_urls arrays, so we fetch details for recent launches only
 */
async function syncLaunch(launchData) {
  try {
    if (!launchData || !launchData.id) {
      return false;
    }

    if (isDryRun) {
      verboseLog(`[DRY RUN] Would sync: ${launchData.name || launchData.id}`);
      return true;
    }

    // Efficiency check: Check if launch needs syncing before doing heavy work
    // This solves the user's concern about "syncing 100 each time"
    const pool = getPool();
    const { rows: existingLaunches } = await pool.query(
      'SELECT id, updated_at, last_updated FROM launches WHERE external_id = $1',
      [launchData.id]
    );

    const dbLaunch = existingLaunches[0];
    const apiLastUpdated = launchData.last_updated;

    if (dbLaunch && apiLastUpdated) {
      const dbUpdated = dbLaunch.updated_at || dbLaunch.last_updated;
      if (dbUpdated && new Date(apiLastUpdated) <= new Date(dbUpdated)) {
        // Skip syncing if database version is already current/newer
        verboseLog(`Skipping unchanged launch: ${launchData.name || launchData.id} (last_updated: ${apiLastUpdated})`);
        return true;
      }
    }

    // Only fetch full launch details for launches in the next 2 days (today and tomorrow)
    // This optimizes API calls - we only need complete data with video URLs for immediate launches
    // For launches further out, list data is sufficient
    const launchDate = launchData.net || launchData.launch_date;
    const shouldFetchDetails = isLaunchInNextDays(launchDate); // Only today and tomorrow

    let fullLaunchData = launchData;

    if (shouldFetchDetails) {
      // Fetch full details for recent launches (to get video URLs and complete data)
      try {
        await waitForRateLimit();
        fullLaunchData = await spaceDevsApi.fetchLauncherById(launchData.id);
        stats.apiCalls++;
        stats.upcoming.fullDetails++;
        const vidCount = fullLaunchData.vid_urls ? fullLaunchData.vid_urls.length : 0;
        verboseLog(`Fetched full details for: ${fullLaunchData.name || launchData.id} (found ${vidCount} video URLs)`);
      } catch (error) {
        log(`Warning: Could not fetch full details for ${launchData.id}, using list data: ${error.message}`, 'warn');
        stats.upcoming.listData++;
        // Continue with list data if detail fetch fails
      }
    } else {
      // Use list data for launches further out (saves API calls)
      stats.upcoming.listData++;
      verboseLog(`Using list data for: ${launchData.name || launchData.id} (launch date: ${launchDate || 'TBD'})`);
    }

    // Map and sync
    const mappedLaunch = launchMapper.mapLauncherToLaunch(fullLaunchData);
    if (!mappedLaunch || !mappedLaunch.external_id) {
      verboseLog(`Skipping launch without external_id: ${fullLaunchData.name || fullLaunchData.id}`);
      return false;
    }

    await launchSync.syncLaunchFromApi(mappedLaunch);
    verboseLog(`Synced: ${mappedLaunch.name || mappedLaunch.external_id}`);
    return true;
  } catch (error) {
    log(`Error syncing launch ${launchData?.id || 'unknown'}: ${error.message}`, 'error');
    if (verbose && error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  log('🚀 Starting Upcoming/Previous Launches Sync', 'info');
  log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE SYNC'}`, 'info');
  log(`Rate Limit: ${rateLimit} calls/hour`, 'info');
  console.log('');

  try {
    const pool = getPool();
    await pool.query('SELECT 1'); // Test connection
    log('Database connection established', 'success');
    console.log('');

    // Fetch and sync upcoming launches
    if (!previousOnly) {
      log('=== UPCOMING LAUNCHES ===', 'info');
      const upcomingLaunches = await fetchUpcomingLaunches();
      console.log('');

      if (upcomingLaunches.length > 0) {
        log(`Syncing ${upcomingLaunches.length} upcoming launches...`, 'info');

        for (let i = 0; i < upcomingLaunches.length; i++) {
          const launch = upcomingLaunches[i];
          const success = await syncLaunch(launch);

          if (success) {
            stats.upcoming.synced++;
          } else {
            stats.upcoming.errors++;
          }

          // Small delay between syncs
          if (i < upcomingLaunches.length - 1 && !isDryRun) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          if ((i + 1) % 10 === 0) {
            log(`Synced ${i + 1}/${upcomingLaunches.length} upcoming launches...`, 'info');
          }
        }

        log(`Upcoming launches: ${stats.upcoming.synced} synced, ${stats.upcoming.errors} errors`,
          stats.upcoming.errors === 0 ? 'success' : 'info');
      } else {
        log('No upcoming launches found', 'info');
      }
      console.log('');
    }

    // Fetch and sync previous launches
    if (!upcomingOnly) {
      log('=== PREVIOUS LAUNCHES ===', 'info');
      const previousLaunches = await fetchPreviousLaunches();
      console.log('');

      if (previousLaunches.length > 0) {
        log(`Syncing ${previousLaunches.length} previous launches...`, 'info');

        for (let i = 0; i < previousLaunches.length; i++) {
          const launch = previousLaunches[i];
          const success = await syncLaunch(launch);

          if (success) {
            stats.previous.synced++;
          } else {
            stats.previous.errors++;
          }

          // Small delay between syncs
          if (i < previousLaunches.length - 1 && !isDryRun) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          if ((i + 1) % 10 === 0) {
            log(`Synced ${i + 1}/${previousLaunches.length} previous launches...`, 'info');
          }
        }

        log(`Previous launches: ${stats.previous.synced} synced, ${stats.previous.errors} errors`,
          stats.previous.errors === 0 ? 'success' : 'info');
      } else {
        log('No previous launches found', 'info');
      }
      console.log('');
    }

    // Summary
    const duration = Date.now() - stats.startTime;
    const durationSeconds = (duration / 1000).toFixed(1);
    const durationMinutes = (duration / 60000).toFixed(1);

    console.log('');
    log('📊 Sync Complete', 'info');
    log(`   API Calls Made: ${stats.apiCalls}/${rateLimit} (rate limit)`, 'info');
    log(`   Upcoming: ${stats.upcoming.fetched} fetched, ${stats.upcoming.synced} synced, ${stats.upcoming.errors} errors`, 'info');
    if (stats.upcoming.fullDetails > 0 || stats.upcoming.listData > 0) {
      log(`   Upcoming Details: ${stats.upcoming.fullDetails} full details (next 2 days only), ${stats.upcoming.listData} list data (further out)`, 'info');
    }
    log(`   Previous: ${stats.previous.fetched} fetched, ${stats.previous.synced} synced, ${stats.previous.errors} errors`, 'info');
    log(`   Duration: ${durationSeconds}s (${durationMinutes} min)`, 'info');

    const totalSynced = stats.upcoming.synced + stats.previous.synced;
    if (totalSynced > 0) {
      log(`✅ Successfully synced ${totalSynced} launches`, 'success');
    } else if (stats.upcoming.errors === 0 && stats.previous.errors === 0) {
      log('✅ Database is up to date', 'success');
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

