require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

async function seed() {
  try {
    await pool.query('BEGIN');

    // Providers
    const providers = [
      ['NASA'],
      ['SpaceX'],
      ['Roscosmos'],
    ];
    for (const [name] of providers) {
      await pool.query('INSERT INTO providers (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
    }

    // Orbits
    const orbits = [
      ['LEO', 'Low Earth Orbit'],
      ['GEO', 'Geostationary Orbit'],
      ['SSO', 'Sun Synchronous Orbit'],
    ];
    for (const [code, desc] of orbits) {
      await pool.query('INSERT INTO orbits (code, description) VALUES ($1, $2) ON CONFLICT DO NOTHING', [code, desc]);
    }

    // Sites
    const sites = [
      ['Cape Canaveral LC-39A', 'USA', 28.608, -80.604],
      ['Baikonur Cosmodrome', 'Kazakhstan', 45.920278, 63.342222],
    ];
    for (const [name, country, lat, long] of sites) {
      await pool.query('INSERT INTO launch_sites (name, country, latitude, longitude) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [name, country, lat, long]);
    }

    // Rockets
    const { rows: provs } = await pool.query('SELECT * FROM providers');
    const rocketArr = [
      ['Falcon 9', provs.find(p => p.name === 'SpaceX').id, JSON.stringify({ stages: 2, reusable: true })],
      ['Soyuz 2.1a', provs.find(p => p.name === 'Roscosmos').id, JSON.stringify({ stages: 3 })],
    ];
    for (const [name, provider_id, spec] of rocketArr) {
      await pool.query('INSERT INTO rockets (name, provider_id, spec) VALUES ($1, $2, $3)', [name, provider_id, spec]);
    }

    // Launches
    const { rows: rockets } = await pool.query('SELECT * FROM rockets');
    const { rows: allSites } = await pool.query('SELECT * FROM launch_sites');
    const { rows: allOrbits } = await pool.query('SELECT * FROM orbits');
    const now = new Date();
    const launches = [
      {
        name: 'SpaceX Starlink 35',
        launch_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 12).toISOString(),
        provider_id: provs.find(p => p.name === 'SpaceX').id,
        rocket_id: rockets.find(r => r.name === 'Falcon 9').id,
        site_id: allSites.find(s => s.name.includes('39A')).id,
        orbit_id: allOrbits.find(o => o.code === 'LEO').id,
        outcome: 'TBD',
        details: 'Deployment of 60 Starlink satellites.',
        media: JSON.stringify({ webcast: 'https://youtube.com/spacex', images: [] }),
      },
      {
        name: 'Soyuz ISS Supply',
        launch_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 14).toISOString(),
        provider_id: provs.find(p => p.name === 'Roscosmos').id,
        rocket_id: rockets.find(r => r.name === 'Soyuz 2.1a').id,
        site_id: allSites.find(s => s.name.includes('Baikonur')).id,
        orbit_id: allOrbits.find(o => o.code === 'LEO').id,
        outcome: 'TBD',
        details: 'ISS re-supply mission.',
        media: JSON.stringify({ webcast: '', images: [] }),
      },
    ];
    for (const l of launches) {
      await pool.query(
        `INSERT INTO launches (name, launch_date, provider_id, rocket_id, site_id, orbit_id, outcome, details, media) VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [l.name, l.launch_date, l.provider_id, l.rocket_id, l.site_id, l.orbit_id, l.outcome, l.details, l.media],
      );
    }

    await pool.query('COMMIT');
    console.log('Seeded demo launch data!');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Seed failed:', err);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}
