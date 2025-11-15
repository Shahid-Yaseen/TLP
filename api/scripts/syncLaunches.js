/**
 * Initial Launch Sync Script
 * 
 * Syncs all launches from Space Devs API to our database
 * Run with: node scripts/syncLaunches.js
 */

require('dotenv').config();
const { getPool, closePool } = require('../config/database');
const launchSync = require('../services/launchSync');

async function main() {
  console.log('🚀 Starting launch sync from Space Devs API...\n');
  
  try {
    // Initialize database connection
    const pool = getPool();
    await pool.query('SELECT 1'); // Test connection
    console.log('✅ Database connection established\n');
    
    // Run full sync
    const results = await launchSync.syncAllLaunches();
    
    console.log('\n📊 Sync Results:');
    console.log(`   Total launchers: ${results.total}`);
    console.log(`   ✅ Successful: ${results.success}`);
    console.log(`   ❌ Errors: ${results.errors}`);
    
    if (results.errors > 0 && results.errorDetails.length > 0) {
      console.log('\n⚠️  Error Details:');
      results.errorDetails.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.launcher}: ${err.error}`);
      });
      if (results.errorDetails.length > 10) {
        console.log(`   ... and ${results.errorDetails.length - 10} more errors`);
      }
    }
    
    console.log('\n✅ Sync complete!');
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };

