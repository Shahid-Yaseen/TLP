/**
 * Fetch and display the latest 5 upcoming launches from Space Devs API
 */

const spaceDevsApi = require('./services/spaceDevsApi');

async function fetchLatestLaunches() {
  try {
    console.log('🚀 Fetching latest 5 upcoming launches from Space Devs API...\n');
    
    const response = await spaceDevsApi.fetchUpcomingLaunches({
      limit: 5,
      ordering: 'net' // Order by launch date (net) ascending
    });
    
    if (!response.results || response.results.length === 0) {
      console.log('❌ No upcoming launches found.');
      return;
    }
    
    console.log(`✅ Found ${response.results.length} upcoming launches:\n`);
    console.log('═'.repeat(80));
    
    response.results.forEach((launch, index) => {
      const launchDate = launch.net ? new Date(launch.net).toLocaleString() : 'TBD';
      const missionName = launch.mission?.name || launch.name || 'Unknown Mission';
      const rocketName = launch.rocket?.configuration?.name || launch.rocket?.name || 'Unknown Rocket';
      const location = launch.pad?.location?.name || launch.pad?.name || 'Unknown Location';
      const status = launch.status?.name || 'Unknown Status';
      
      console.log(`\n${index + 1}. ${missionName}`);
      console.log(`   🚀 Rocket: ${rocketName}`);
      console.log(`   📍 Location: ${location}`);
      console.log(`   📅 Launch Date: ${launchDate}`);
      console.log(`   📊 Status: ${status}`);
      
      if (launch.mission?.description) {
        const description = launch.mission.description.length > 100 
          ? launch.mission.description.substring(0, 100) + '...'
          : launch.mission.description;
        console.log(`   📝 Description: ${description}`);
      }
      
      if (launch.probability) {
        console.log(`   🎯 Probability: ${launch.probability}%`);
      }
      
      if (launch.vid_urls && launch.vid_urls.length > 0) {
        const liveUrl = launch.vid_urls.find(v => v.live)?.url;
        if (liveUrl) {
          console.log(`   📺 Live Stream: ${liveUrl}`);
        }
      }
      
      console.log(`   🔗 ID: ${launch.id}`);
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log(`\nTotal upcoming launches available: ${response.count || 'Unknown'}`);
    
  } catch (error) {
    console.error('❌ Error fetching launches:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the function
fetchLatestLaunches()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

