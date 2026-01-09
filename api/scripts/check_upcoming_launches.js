#!/usr/bin/env node
/**
 * Quick script to check upcoming launches from database
 */

require('dotenv').config();
const { getPool, closePool } = require('../config/database');

async function getUpcomingLaunches() {
  const pool = getPool();
  
  try {
    const query = `
      SELECT DISTINCT
        launches.id,
        launches.external_id,
        launches.name,
        launches.launch_date,
        launches.window_start,
        launches.window_end,
        launches.outcome,
        launches.details,
        launches.mission_description,
        launches.youtube_video_id,
        launches.webcast_live,
        launches.probability,
        launches.weather_concerns,
        launches.hashtag,
        providers.name as provider,
        providers.abbrev as provider_abbrev,
        rockets.name as rocket,
        orbits.code as orbit,
        orbits.description as orbit_name,
        launch_sites.name as site,
        launch_sites.country as site_country,
        launch_pads.name as pad_name,
        launch_statuses.name as status_name,
        launch_statuses.abbrev as status_abbrev,
        launches.updated_at
      FROM launches
      LEFT JOIN providers ON launches.provider_id = providers.id
      LEFT JOIN rockets ON launches.rocket_id = rockets.id
      LEFT JOIN orbits ON launches.orbit_id = orbits.id
      LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
      LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
      LEFT JOIN launch_statuses ON launches.status_id = launch_statuses.id
      WHERE launches.launch_date >= NOW()
        AND launches.launch_date IS NOT NULL
      ORDER BY launches.launch_date ASC
      LIMIT 4
    `;
    
    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    console.error('Error querying upcoming launches:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Fetching last 4 upcoming launches from database...\n');
  
  try {
    const pool = getPool();
    await pool.query('SELECT 1'); // Test connection
    console.log('✅ Database connection established\n');
    
    const launches = await getUpcomingLaunches();
    
    if (launches.length === 0) {
      console.log('❌ No upcoming launches found in database.');
      console.log('💡 You may need to run the sync script:');
      console.log('   node scripts/sync_upcoming_previous_launches.js\n');
      return;
    }
    
    console.log(`📊 Found ${launches.length} upcoming launch(es):\n`);
    console.log('='.repeat(80));
    
    launches.forEach((launch, index) => {
      console.log(`\n${index + 1}. ${launch.name || 'Unnamed Launch'}`);
      console.log('-'.repeat(80));
      console.log(`   External ID: ${launch.external_id || 'N/A'}`);
      console.log(`   Launch Date: ${launch.launch_date ? new Date(launch.launch_date).toLocaleString() : 'TBD'}`);
      
      if (launch.window_start && launch.window_end) {
        console.log(`   Window: ${new Date(launch.window_start).toLocaleString()} - ${new Date(launch.window_end).toLocaleString()}`);
      }
      
      console.log(`   Provider: ${launch.provider || launch.provider_abbrev || 'Unknown'}`);
      console.log(`   Rocket: ${launch.rocket || 'TBD'}`);
      console.log(`   Site: ${launch.site || 'TBD'}${launch.site_country ? `, ${launch.site_country}` : ''}`);
      console.log(`   Pad: ${launch.pad_name || 'TBD'}`);
      console.log(`   Orbit: ${launch.orbit || launch.orbit_name || 'TBD'}`);
      console.log(`   Status: ${launch.status_name || launch.status_abbrev || launch.outcome || 'TBD'}`);
      
      if (launch.probability !== null && launch.probability !== undefined) {
        console.log(`   Probability: ${launch.probability}%`);
      }
      
      if (launch.webcast_live) {
        console.log(`   🎥 Webcast: Live`);
      }
      
      if (launch.youtube_video_id) {
        console.log(`   📺 YouTube: https://youtube.com/watch?v=${launch.youtube_video_id}`);
      }
      
      if (launch.hashtag) {
        console.log(`   #️⃣ Hashtag: ${launch.hashtag}`);
      }
      
      if (launch.weather_concerns) {
        console.log(`   ⚠️  Weather: ${launch.weather_concerns}`);
      }
      
      if (launch.details) {
        const details = launch.details.length > 150 
          ? launch.details.substring(0, 150) + '...' 
          : launch.details;
        console.log(`   📝 Details: ${details}`);
      }
      
      console.log(`   Last Updated: ${launch.updated_at ? new Date(launch.updated_at).toLocaleString() : 'Never'}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Displayed ${launches.length} upcoming launch(es)\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
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
    console.error('Unhandled error:', error.message);
    process.exit(1);
  });
}

module.exports = { getUpcomingLaunches };

