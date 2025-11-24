#!/usr/bin/env node

/**
 * Seed Crew Members
 * 
 * Creates initial crew members for the About Us page.
 * Run this after running migrations.
 * 
 * Usage: node scripts/seed_crew_members.js
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

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'tlp_db',
});

// Sample crew members data
const CREW_MEMBERS = [
  // ADVISORS
  {
    first_name: 'John',
    last_name: 'Smith',
    full_name: 'John Smith',
    location: 'SPACE COAST, FL',
    category: 'ADVISORS',
    title: 'Space Industry Advisor',
    bio: 'Experienced space industry professional with over 20 years of expertise in launch operations and mission planning.',
    profile_image_url: null,
    coordinates: { lat: 28.3922, lng: -80.6077 }, // Cape Canaveral, Florida
    is_active: true,
    metadata: {}
  },
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    full_name: 'Sarah Johnson',
    location: 'LOS ANGELES, CA',
    category: 'ADVISORS',
    title: 'Aerospace Consultant',
    bio: 'Leading consultant in commercial space ventures and satellite deployment strategies.',
    profile_image_url: null,
    coordinates: { lat: 34.0522, lng: -118.2437 }, // Los Angeles, California
    is_active: true,
    metadata: {}
  },
  
  // PRODUCTION
  {
    first_name: 'Mike',
    last_name: 'Williams',
    full_name: 'Mike Williams',
    location: 'SPACE COAST, FL',
    category: 'PRODUCTION',
    title: 'Video Producer',
    bio: 'Award-winning video producer specializing in space launch coverage and documentary filmmaking.',
    profile_image_url: null,
    coordinates: { lat: 28.3922, lng: -80.6077 }, // Cape Canaveral, Florida
    is_active: true,
    metadata: {}
  },
  {
    first_name: 'Emily',
    last_name: 'Davis',
    full_name: 'Emily Davis',
    location: 'HOUSTON, TX',
    category: 'PRODUCTION',
    title: 'Content Director',
    bio: 'Creative director with expertise in space media production and live event coverage.',
    profile_image_url: null,
    coordinates: { lat: 29.7604, lng: -95.3698 }, // Houston, Texas
    is_active: true,
    metadata: {}
  },
  
  // JOURNALISTS
  {
    first_name: 'David',
    last_name: 'Brown',
    full_name: 'David Brown',
    location: 'NEW YORK, NY',
    category: 'JOURNALISTS',
    title: 'Space Journalist',
    bio: 'Award-winning journalist covering space exploration, commercial spaceflight, and space policy.',
    profile_image_url: null,
    coordinates: { lat: 40.7128, lng: -74.0060 }, // New York City
    is_active: true,
    metadata: {}
  },
  {
    first_name: 'Lisa',
    last_name: 'Anderson',
    full_name: 'Lisa Anderson',
    location: 'WASHINGTON, DC',
    category: 'JOURNALISTS',
    title: 'Space Policy Reporter',
    bio: 'Specialized reporter covering space policy, NASA missions, and international space cooperation.',
    profile_image_url: null,
    coordinates: { lat: 38.9072, lng: -77.0369 }, // Washington DC
    is_active: true,
    metadata: {}
  },
  {
    first_name: 'Robert',
    last_name: 'Taylor',
    full_name: 'Robert Taylor',
    location: 'SEATTLE, WA',
    category: 'JOURNALISTS',
    title: 'Space Technology Writer',
    bio: 'Technology journalist focusing on space innovation, rocket technology, and commercial space ventures.',
    profile_image_url: null,
    coordinates: { lat: 47.6062, lng: -122.3321 }, // Seattle, Washington
    is_active: true,
    metadata: {}
  },
  
  // SPACE HISTORY WRITERS
  {
    first_name: 'James',
    last_name: 'Wilson',
    full_name: 'James Wilson',
    location: 'DENVER, CO',
    category: 'SPACE HISTORY WRITERS',
    title: 'Space Historian',
    bio: 'Author and historian specializing in the history of space exploration and the Apollo program.',
    profile_image_url: null,
    coordinates: { lat: 39.7392, lng: -104.9903 }, // Denver, Colorado
    is_active: true,
    metadata: {}
  },
  {
    first_name: 'Patricia',
    last_name: 'Martinez',
    full_name: 'Patricia Martinez',
    location: 'TORONTO, ON',
    category: 'SPACE HISTORY WRITERS',
    title: 'Space History Author',
    bio: 'Published author of multiple books on space history, focusing on international space programs.',
    profile_image_url: null,
    coordinates: { lat: 43.6532, lng: -79.3832 }, // Toronto, Ontario
    is_active: true,
    metadata: {}
  },
  
  // ROCKETCHASERS
  {
    first_name: 'Chris',
    last_name: 'Thompson',
    full_name: 'Chris Thompson',
    location: 'SPACE COAST, FL',
    category: 'ROCKETCHASERS',
    title: 'Launch Photographer',
    bio: 'Professional photographer capturing stunning images of rocket launches and space missions.',
    profile_image_url: null,
    coordinates: { lat: 28.3922, lng: -80.6077 }, // Cape Canaveral, Florida
    is_active: true,
    metadata: {}
  },
  {
    first_name: 'Jennifer',
    last_name: 'White',
    full_name: 'Jennifer White',
    location: 'VANDENBERG, CA',
    category: 'ROCKETCHASERS',
    title: 'Launch Chaser',
    bio: 'Dedicated launch chaser documenting launches from the West Coast and beyond.',
    profile_image_url: null,
    coordinates: { lat: 34.7294, lng: -120.5844 }, // Vandenberg Space Force Base, California
    is_active: true,
    metadata: {}
  },
  {
    first_name: 'Mark',
    last_name: 'Garcia',
    full_name: 'Mark Garcia',
    location: 'BOCA CHICA, TX',
    category: 'ROCKETCHASERS',
    title: 'SpaceX Launch Chaser',
    bio: 'Specialized in documenting SpaceX launches and Starship development at Boca Chica.',
    profile_image_url: null,
    coordinates: { lat: 25.9965, lng: -97.1554 }, // Boca Chica, Texas
    is_active: true,
    metadata: {}
  },
  
  // MODERATORS
  {
    first_name: 'Amanda',
    last_name: 'Lee',
    full_name: 'Amanda Lee',
    location: 'AMSTERDAM, NL',
    category: 'MODERATORS',
    title: 'Community Moderator',
    bio: 'Community moderator and space enthusiast managing online discussions and engagement.',
    profile_image_url: null,
    coordinates: { lat: 52.3676, lng: 4.9041 }, // Amsterdam, Netherlands
    is_active: true,
    metadata: {}
  },
  {
    first_name: 'Thomas',
    last_name: 'Clark',
    full_name: 'Thomas Clark',
    location: 'LONDON, UK',
    category: 'MODERATORS',
    title: 'Forum Moderator',
    bio: 'Experienced moderator facilitating discussions on space exploration and technology.',
    profile_image_url: null,
    coordinates: { lat: 51.5074, lng: -0.1278 }, // London, UK
    is_active: true,
    metadata: {}
  },
  {
    first_name: 'Maria',
    last_name: 'Rodriguez',
    full_name: 'Maria Rodriguez',
    location: 'MADRID, ES',
    category: 'MODERATORS',
    title: 'Content Moderator',
    bio: 'Bilingual moderator supporting Spanish and English speaking communities in space discussions.',
    profile_image_url: null,
    coordinates: { lat: 40.4168, lng: -3.7038 }, // Madrid, Spain
    is_active: true,
    metadata: {}
  },
  
  // TLP Network Locations (for map markers)
  {
    first_name: 'TLP',
    last_name: 'Network',
    full_name: 'TLP Network HQ',
    location: 'TLP NETWORK HQ',
    category: 'ADVISORS',
    title: 'Headquarters',
    bio: 'The Launch Pad Network headquarters location.',
    profile_image_url: null,
    coordinates: { lat: 39.8283, lng: -98.5795 }, // Geographic center of US
    is_active: true,
    metadata: {}
  },
  {
    first_name: 'TLP',
    last_name: 'Space Coast',
    full_name: 'TLP Space Coast',
    location: 'TLP SPACE COAST',
    category: 'PRODUCTION',
    title: 'Space Coast Office',
    bio: 'The Launch Pad Network Space Coast location.',
    profile_image_url: null,
    coordinates: { lat: 28.3922, lng: -80.6077 }, // Cape Canaveral, Florida
    is_active: true,
    metadata: {}
  },
  {
    first_name: 'TLP',
    last_name: 'West Coast',
    full_name: 'TLP West Coast',
    location: 'TLP WEST COAST',
    category: 'PRODUCTION',
    title: 'West Coast Office',
    bio: 'The Launch Pad Network West Coast location.',
    profile_image_url: null,
    coordinates: { lat: 34.0522, lng: -118.2437 }, // Los Angeles, California
    is_active: true,
    metadata: {}
  },
  {
    first_name: 'TLP',
    last_name: 'Europe',
    full_name: 'TLP Europe',
    location: 'TLP EUROPE',
    category: 'JOURNALISTS',
    title: 'European Office',
    bio: 'The Launch Pad Network European location.',
    profile_image_url: null,
    coordinates: { lat: 50.8503, lng: 4.3528 }, // Brussels, Belgium
    is_active: true,
    metadata: {}
  },
];

async function seed() {
  try {
    await pool.query('BEGIN');

    console.log('🌱 Seeding crew members...\n');

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const member of CREW_MEMBERS) {
      try {
        // Check if crew member already exists (by full_name)
        const existing = await pool.query(
          'SELECT id FROM crew_members WHERE full_name = $1',
          [member.full_name]
        );

        if (existing.rows.length > 0) {
          // Update existing member
          await pool.query(
            `UPDATE crew_members SET
              first_name = $1,
              last_name = $2,
              location = $3,
              category = $4,
              title = $5,
              bio = $6,
              profile_image_url = $7,
              coordinates = $8::jsonb,
              metadata = $9::jsonb,
              is_active = $10
            WHERE full_name = $11`,
            [
              member.first_name,
              member.last_name,
              member.location,
              member.category,
              member.title,
              member.bio,
              member.profile_image_url,
              JSON.stringify(member.coordinates),
              JSON.stringify(member.metadata),
              member.is_active,
              member.full_name
            ]
          );
          updated++;
          console.log(`🔄 Updated: ${member.full_name} (${member.category})`);
        } else {
          // Insert new member
          await pool.query(
            `INSERT INTO crew_members (
              first_name, last_name, full_name, location, category,
              title, bio, profile_image_url, coordinates, metadata, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11)
            RETURNING id`,
            [
              member.first_name,
              member.last_name,
              member.full_name,
              member.location,
              member.category,
              member.title,
              member.bio,
              member.profile_image_url,
              JSON.stringify(member.coordinates),
              JSON.stringify(member.metadata),
              member.is_active
            ]
          );
          inserted++;
          console.log(`✅ Inserted: ${member.full_name} (${member.category})`);
        }
      } catch (err) {
        skipped++;
        console.error(`❌ Error processing ${member.full_name}:`, err.message);
      }
    }

    await pool.query('COMMIT');
    console.log('\n✨ Crew members seeded successfully!');
    console.log(`\nSummary:`);
    console.log(`  - Inserted: ${inserted} new members`);
    console.log(`  - Updated: ${updated} existing members`);
    console.log(`  - Skipped: ${skipped} members (errors)`);
    console.log(`  - Total: ${CREW_MEMBERS.length} members processed`);
    
    // Show breakdown by category
    const categoryCounts = {};
    CREW_MEMBERS.forEach(m => {
      categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
    });
    console.log(`\nBy Category:`);
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count}`);
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seed().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { seed };

