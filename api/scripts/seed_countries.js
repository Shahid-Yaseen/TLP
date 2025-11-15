/**
 * Seed Countries Table
 * Populates the countries table with space-faring countries
 */

const { getPool } = require('../config/database');

const pool = getPool();

// Common space-faring countries with ISO codes
const countries = [
  { name: 'United States', alpha_2_code: 'US', alpha_3_code: 'USA' },
  { name: 'Russia', alpha_2_code: 'RU', alpha_3_code: 'RUS' },
  { name: 'China', alpha_2_code: 'CN', alpha_3_code: 'CHN' },
  { name: 'France', alpha_2_code: 'FR', alpha_3_code: 'FRA' },
  { name: 'Japan', alpha_2_code: 'JP', alpha_3_code: 'JPN' },
  { name: 'India', alpha_2_code: 'IN', alpha_3_code: 'IND' },
  { name: 'United Kingdom', alpha_2_code: 'GB', alpha_3_code: 'GBR' },
  { name: 'Germany', alpha_2_code: 'DE', alpha_3_code: 'DEU' },
  { name: 'Italy', alpha_2_code: 'IT', alpha_3_code: 'ITA' },
  { name: 'Spain', alpha_2_code: 'ES', alpha_3_code: 'ESP' },
  { name: 'Canada', alpha_2_code: 'CA', alpha_3_code: 'CAN' },
  { name: 'Australia', alpha_2_code: 'AU', alpha_3_code: 'AUS' },
  { name: 'Brazil', alpha_2_code: 'BR', alpha_3_code: 'BRA' },
  { name: 'South Korea', alpha_2_code: 'KR', alpha_3_code: 'KOR' },
  { name: 'Israel', alpha_2_code: 'IL', alpha_3_code: 'ISR' },
  { name: 'Iran', alpha_2_code: 'IR', alpha_3_code: 'IRN' },
  { name: 'North Korea', alpha_2_code: 'KP', alpha_3_code: 'PRK' },
  { name: 'Kazakhstan', alpha_2_code: 'KZ', alpha_3_code: 'KAZ' },
  { name: 'Sweden', alpha_2_code: 'SE', alpha_3_code: 'SWE' },
  { name: 'Norway', alpha_2_code: 'NO', alpha_3_code: 'NOR' },
  { name: 'Netherlands', alpha_2_code: 'NL', alpha_3_code: 'NLD' },
  { name: 'Belgium', alpha_2_code: 'BE', alpha_3_code: 'BEL' },
  { name: 'Switzerland', alpha_2_code: 'CH', alpha_3_code: 'CHE' },
  { name: 'New Zealand', alpha_2_code: 'NZ', alpha_3_code: 'NZL' },
  { name: 'United Arab Emirates', alpha_2_code: 'AE', alpha_3_code: 'ARE' },
  { name: 'Saudi Arabia', alpha_2_code: 'SA', alpha_3_code: 'SAU' },
  { name: 'Turkey', alpha_2_code: 'TR', alpha_3_code: 'TUR' },
  { name: 'Argentina', alpha_2_code: 'AR', alpha_3_code: 'ARG' },
  { name: 'Mexico', alpha_2_code: 'MX', alpha_3_code: 'MEX' },
  { name: 'Indonesia', alpha_2_code: 'ID', alpha_3_code: 'IDN' },
];

// Country name mappings for matching (common variations)
const countryNameMappings = {
  'USA': 'United States',
  'US': 'United States',
  'United States of America': 'United States',
  'Russian Federation': 'Russia',
  "People's Republic of China": 'China',
  'PRC': 'China',
  'UK': 'United Kingdom',
  'Great Britain': 'United Kingdom',
  'South Korea': 'South Korea',
  'Republic of Korea': 'South Korea',
  'North Korea': 'North Korea',
  "Democratic People's Republic of Korea": 'North Korea',
  'DPRK': 'North Korea',
};

async function seedCountries() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding countries table...');

    // Insert countries
    for (const country of countries) {
      await client.query(
        `INSERT INTO countries (name, alpha_2_code, alpha_3_code)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET
           alpha_2_code = COALESCE(EXCLUDED.alpha_2_code, countries.alpha_2_code),
           alpha_3_code = COALESCE(EXCLUDED.alpha_3_code, countries.alpha_3_code)`,
        [country.name, country.alpha_2_code, country.alpha_3_code]
      );
    }

    console.log(`✅ Inserted ${countries.length} countries`);

    // Link existing launch sites to countries based on country text field
    console.log('Linking launch sites to countries...');
    
    const { rows: sites } = await client.query('SELECT id, name, country FROM launch_sites WHERE country_id IS NULL');
    
    let linkedCount = 0;
    for (const site of sites) {
      if (!site.country) continue;
      
      // Try to find country by various name formats
      let countryName = site.country.trim();
      
      // Check mappings first
      if (countryNameMappings[countryName]) {
        countryName = countryNameMappings[countryName];
      }
      
      // Try exact match
      let { rows: countryRows } = await client.query(
        'SELECT id FROM countries WHERE name = $1 OR alpha_2_code = $1 OR alpha_3_code = $1',
        [countryName]
      );
      
      // Try case-insensitive match
      if (countryRows.length === 0) {
        countryRows = await client.query(
          'SELECT id FROM countries WHERE LOWER(name) = LOWER($1) OR LOWER(alpha_2_code) = LOWER($1) OR LOWER(alpha_3_code) = LOWER($1)',
          [countryName]
        ).rows;
      }
      
      // Try partial match (contains)
      if (countryRows.length === 0) {
        countryRows = await client.query(
          'SELECT id FROM countries WHERE name ILIKE $1 OR alpha_2_code ILIKE $1',
          [`%${countryName}%`]
        ).rows;
      }
      
      if (countryRows.length > 0) {
        await client.query(
          'UPDATE launch_sites SET country_id = $1 WHERE id = $2',
          [countryRows[0].id, site.id]
        );
        linkedCount++;
        console.log(`  Linked ${site.name} → ${countryName}`);
      } else {
        console.log(`  ⚠️  Could not find country for: ${site.name} (country: ${site.country})`);
      }
    }

    console.log(`✅ Linked ${linkedCount} launch sites to countries`);

    await client.query('COMMIT');
    console.log('✅ Countries seeding completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding countries:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedCountries()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { seedCountries, countryNameMappings };

