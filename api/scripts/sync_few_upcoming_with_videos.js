#!/usr/bin/env node
/**
 * Quick script to sync a few upcoming launches with video URLs
 * This will fetch full details and sync them to the database
 */

require('dotenv').config();
const spaceDevsApi = require('../services/spaceDevsApi');
const launchMapper = require('../services/launchMapper');
const launchSync = require('../services/launchSync');

async function syncFewUpcoming() {
  try {
    console.log('Fetching upcoming launches from Space Devs API...\n');
    
    // Fetch list of upcoming launches
    const response = await spaceDevsApi.fetchUpcomingLaunches({ limit: 10 });
    
    if (!response.results || response.results.length === 0) {
      console.log('No upcoming launches found');
      return;
    }
    
    console.log(`Found ${response.results.length} upcoming launches\n`);
    
    let synced = 0;
    let withVideos = 0;
    
    for (const launch of response.results) {
      try {
        console.log(`\nProcessing: ${launch.name}`);
        console.log(`  External ID: ${launch.id}`);
        
        // Always fetch full details to get video URLs
        const fullDetails = await spaceDevsApi.fetchLauncherById(launch.id);
        const vidCount = fullDetails.vid_urls ? fullDetails.vid_urls.length : 0;
        console.log(`  Video URLs in API: ${vidCount}`);
        
        if (vidCount > 0) {
          withVideos++;
          console.log(`  ✅ Has ${vidCount} video URLs!`);
        }
        
        // Map and sync
        const mapped = launchMapper.mapLauncherToLaunch(fullDetails);
        if (mapped && mapped.external_id) {
          await launchSync.syncLaunchFromApi(mapped);
          synced++;
          console.log(`  ✅ Synced successfully!`);
        } else {
          console.log(`  ⚠️  Skipped (no external_id)`);
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('  ⚠️  Rate limit hit. Please wait and try again later.');
          break;
        }
      }
    }
    
    console.log(`\n\n✅ Summary:`);
    console.log(`  Total processed: ${response.results.length}`);
    console.log(`  Successfully synced: ${synced}`);
    console.log(`  Launches with video URLs: ${withVideos}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

syncFewUpcoming();

