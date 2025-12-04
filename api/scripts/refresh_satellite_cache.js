/**
 * Refresh Satellite Cache Script
 * Fetches satellite data from CelesTrak and stores in database
 * 
 * Usage: node scripts/refresh_satellite_cache.js
 */

require('dotenv').config();
const { refreshCache } = require('../services/celestrakService');
const { closePool } = require('../config/database');

async function main() {
  try {
    console.log('🚀 Starting satellite cache refresh...');
    console.log('');
    
    const result = await refreshCache();
    
    console.log('');
    console.log('✅ Cache refresh completed successfully!');
    console.log(`   Total fetched: ${result.total}`);
    console.log(`   Successfully parsed: ${result.parsed}`);
    console.log(`   Inserted: ${result.inserted}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`   Duration: ${result.duration}`);
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Cache refresh failed:', error);
    console.error('');
    process.exit(1);
  } finally {
    // Close database pool
    await closePool();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };

