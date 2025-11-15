/**
 * Launch Sync Service
 * 
 * Handles syncing launch data from Space Devs API to our database
 */

const { getPool } = require('../config/database');
const spaceDevsApi = require('./spaceDevsApi');
const launchMapper = require('./launchMapper');

const pool = getPool();

// Flag to prevent multiple simultaneous syncs
let isSyncing = false;
let lastSyncStart = null;

/**
 * Check if launch needs syncing by comparing timestamps
 * @param {Object} dbLaunch - Launch from database
 * @param {string} apiLastUpdated - Last updated timestamp from API
 * @returns {boolean} True if sync is needed
 */
function shouldSync(dbLaunch, apiLastUpdated) {
  if (!dbLaunch) return true; // Launch doesn't exist in DB
  
  if (!apiLastUpdated) return false; // No API timestamp, assume DB is current
  
  const dbUpdated = dbLaunch.updated_at || dbLaunch.last_updated;
  if (!dbUpdated) return true; // No DB timestamp, sync to be safe
  
  return new Date(apiLastUpdated) > new Date(dbUpdated);
}

/**
 * Check if cache is older than specified days (default 1 day)
 * @param {number} days - Number of days for cache validity (default: 1)
 * @returns {Promise<boolean>} True if cache needs refresh
 */
async function isCacheExpired(days = 1) {
  try {
    // Check the most recent updated_at timestamp in the launches table
    const { rows } = await pool.query(`
      SELECT MAX(updated_at) as last_sync 
      FROM launches 
      WHERE updated_at IS NOT NULL
    `);
    
    if (!rows[0] || !rows[0].last_sync) {
      // No data in database, cache is expired
      return true;
    }
    
    const lastSync = new Date(rows[0].last_sync);
    const now = new Date();
    const daysSinceSync = (now - lastSync) / (1000 * 60 * 60 * 24);
    
    return daysSinceSync >= days;
  } catch (error) {
    console.error('Error checking cache expiration:', error);
    // If we can't check, assume cache is expired to be safe
    return true;
  }
}

/**
 * Sync all launches from external API and save to database
 * This is called when cache is expired
 * Prevents multiple simultaneous syncs
 * @returns {Promise<Object>} Sync results
 */
async function syncAllLaunchesFromExternal() {
  // Prevent multiple simultaneous syncs
  if (isSyncing) {
    console.log('Sync already in progress, skipping...');
    // Wait a bit and check if sync completed
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (isSyncing) {
      throw new Error('Sync already in progress');
    }
    return { message: 'Sync was already in progress' };
  }
  
  // Prevent sync if one started less than 5 minutes ago (avoid rapid re-syncs)
  if (lastSyncStart && (Date.now() - lastSyncStart) < 5 * 60 * 1000) {
    console.log('Sync started recently, skipping to avoid rapid re-syncs');
    return { message: 'Sync started recently' };
  }
  
  isSyncing = true;
  lastSyncStart = Date.now();
  
  try {
    console.log('Cache expired, fetching all launches from external API...');
    const allLaunchers = await spaceDevsApi.fetchAllLaunchers();
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < allLaunchers.length; i++) {
      const launcher = allLaunchers[i];
      try {
        const mappedLaunch = launchMapper.mapLauncherToLaunch(launcher);
        if (mappedLaunch && mappedLaunch.external_id) {
          await syncLaunchFromApi(mappedLaunch);
          successCount++;
          
          if ((i + 1) % 50 === 0) {
            console.log(`Synced ${i + 1}/${allLaunchers.length} launches...`);
          }
        }
      } catch (error) {
        errorCount++;
        const errorId = launcher.id || launcher.uuid || `index-${i}`;
        errors.push({
          id: errorId,
          error: error.message
        });
        console.error(`Error syncing launcher ${errorId}:`, error.message);
      }
    }
    
    console.log(`Full sync complete: ${successCount} successful, ${errorCount} errors`);
    
    return {
      total: allLaunchers.length,
      successful: successCount,
      errors: errorCount,
      errorDetails: errors
    };
  } catch (error) {
    console.error('Error in full sync from external API:', error);
    throw error;
  } finally {
    isSyncing = false;
  }
}

/**
 * Upsert provider/agency
 */
async function upsertProvider(providerData, client) {
  if (!providerData || !providerData.name) return null;
  
  const query = `
    INSERT INTO providers (name, abbrev, url)
    VALUES ($1, $2, $3)
    ON CONFLICT (name) 
    DO UPDATE SET 
      abbrev = COALESCE(EXCLUDED.abbrev, providers.abbrev),
      url = COALESCE(EXCLUDED.url, providers.url)
    RETURNING id
  `;
  
  const result = await client.query(query, [
    providerData.name,
    providerData.abbrev || null,
    providerData.url || null
  ]);
  
  return result.rows[0]?.id || null;
}

/**
 * Upsert orbit
 */
async function upsertOrbit(orbitData, client) {
  if (!orbitData || !orbitData.code) return null;
  
  const query = `
    INSERT INTO orbits (code, description)
    VALUES ($1, $2)
    ON CONFLICT (code) 
    DO UPDATE SET description = COALESCE(EXCLUDED.description, orbits.description)
    RETURNING id
  `;
  
  const result = await client.query(query, [
    orbitData.code,
    orbitData.description || null
  ]);
  
  return result.rows[0]?.id || null;
}

/**
 * Find or create country by name or code
 */
async function findOrCreateCountry(countryData, client) {
  if (!countryData) return null;
  
  const countryName = countryData.name || countryData;
  const countryCode = countryData.code || countryData.alpha_2_code || countryData.alpha_3_code;
  
  if (!countryName && !countryCode) return null;
  
  // Try to find existing country
  let findQuery = '';
  let findArgs = [];
  
  if (countryCode) {
    findQuery = 'SELECT id FROM countries WHERE alpha_2_code = $1 OR alpha_3_code = $1 OR LOWER(alpha_2_code) = LOWER($1) OR LOWER(alpha_3_code) = LOWER($1)';
    findArgs = [countryCode.toUpperCase()];
  } else if (countryName) {
    findQuery = 'SELECT id FROM countries WHERE name = $1 OR LOWER(name) = LOWER($1) OR name ILIKE $2';
    findArgs = [countryName, `%${countryName}%`];
  }
  
  if (findQuery) {
    const { rows } = await client.query(findQuery, findArgs);
    if (rows.length > 0) {
      return rows[0].id;
    }
  }
  
  // Country not found - return null (we'll rely on seed script to populate countries)
  // In the future, we could auto-create countries here, but for now we'll skip
  return null;
}

async function upsertLaunchSite(siteData, client) {
  if (!siteData || !siteData.name) return null;
  
  // Find or create country
  let countryId = null;
  if (siteData.country || siteData.country_code) {
    countryId = await findOrCreateCountry({
      name: siteData.country,
      code: siteData.country_code || siteData.country
    }, client);
  }
  
  // Ensure numeric values are properly typed
  const latitude = (siteData.latitude != null && siteData.latitude !== '') ? Number(siteData.latitude) : null;
  const longitude = (siteData.longitude != null && siteData.longitude !== '') ? Number(siteData.longitude) : null;
  
  // Validate numbers (NaN check)
  const validLatitude = (latitude != null && !isNaN(latitude)) ? latitude : null;
  const validLongitude = (longitude != null && !isNaN(longitude)) ? longitude : null;
  
  // First, try to find by name
  const findQuery = `SELECT id FROM launch_sites WHERE name = $1`;
  const findResult = await client.query(findQuery, [siteData.name]);
  
  if (findResult.rows.length > 0) {
    // Update existing
    const updateQuery = `
      UPDATE launch_sites 
      SET 
        country = COALESCE($2, country),
        country_id = COALESCE($3, country_id),
        latitude = COALESCE($4, latitude),
        longitude = COALESCE($5, longitude),
        timezone_name = COALESCE($6, timezone_name)
      WHERE id = $1
      RETURNING id
    `;
    await client.query(updateQuery, [
      findResult.rows[0].id,
      siteData.country || null,
      countryId,
      validLatitude,
      validLongitude,
      siteData.timezone || null
    ]);
    return findResult.rows[0].id;
  } else {
    // Insert new
    const insertQuery = `
      INSERT INTO launch_sites (name, country, country_id, latitude, longitude, timezone_name)
      VALUES ($1, $2, $3, $4::double precision, $5::double precision, $6)
      RETURNING id
    `;
    const result = await client.query(insertQuery, [
      siteData.name,
      siteData.country || null,
      countryId,
      validLatitude,
      validLongitude,
      siteData.timezone || null
    ]);
    return result.rows[0]?.id || null;
  }
}

/**
 * Upsert launch pad
 */
async function upsertLaunchPad(padData, siteId, client) {
  if (!padData || !padData.name || !siteId) return null;
  
  // Ensure siteId is a valid integer
  const siteIdInt = parseInt(siteId, 10);
  if (isNaN(siteIdInt) || siteIdInt <= 0) return null;
  
  // Ensure numeric values are properly typed
  const latitude = (padData.latitude != null && padData.latitude !== '') ? Number(padData.latitude) : null;
  const longitude = (padData.longitude != null && padData.longitude !== '') ? Number(padData.longitude) : null;
  
  // Validate numbers (NaN check)
  const validLatitude = (latitude != null && !isNaN(latitude)) ? latitude : null;
  const validLongitude = (longitude != null && !isNaN(longitude)) ? longitude : null;
  
  // Check if pad exists
  const findQuery = `SELECT id FROM launch_pads WHERE name = $1 AND launch_site_id = $2::integer LIMIT 1`;
  const findResult = await client.query(findQuery, [padData.name, siteIdInt]);
  
  if (findResult.rows.length > 0) {
    // Update existing - build dynamic query based on what we have
    const updates = [];
    const params = [findResult.rows[0].id];
    let paramIndex = 2;
    
    if (validLatitude !== null) {
      updates.push(`latitude = $${paramIndex}::double precision`);
      params.push(validLatitude);
      paramIndex++;
    }
    
    if (validLongitude !== null) {
      updates.push(`longitude = $${paramIndex}::double precision`);
      params.push(validLongitude);
      paramIndex++;
    }
    
    if (padData.description !== null && padData.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(padData.description);
      paramIndex++;
    }
    
    updates.push(`active = $${paramIndex}`);
    params.push(padData.active !== undefined ? padData.active : true);
    
    const updateQuery = `
      UPDATE launch_pads 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id
    `;
    const result = await client.query(updateQuery, params);
    return result.rows[0]?.id || null;
  } else {
    // Insert new
    const insertQuery = `
      INSERT INTO launch_pads (name, launch_site_id, latitude, longitude, description, active)
      VALUES ($1, $2::integer, $3::double precision, $4::double precision, $5, $6)
      RETURNING id
    `;
    const result = await client.query(insertQuery, [
      padData.name,
      siteIdInt,
      validLatitude,
      validLongitude,
      padData.description || null,
      padData.active !== undefined ? padData.active : true
    ]);
    return result.rows[0]?.id || null;
  }
}

/**
 * Upsert rocket
 */
async function upsertRocket(rocketData, providerId, client) {
  if (!rocketData || !rocketData.name) return null;
  
  // Check if rocket exists
  const findQuery = `SELECT id FROM rockets WHERE name = $1 LIMIT 1`;
  const findResult = await client.query(findQuery, [rocketData.name]);
  
  const spec = {
    family: rocketData.family || null,
    variant: rocketData.variant || null,
    configuration: rocketData.configuration || null,
    manufacturer: rocketData.manufacturer || null
  };
  
  if (findResult.rows.length > 0) {
    // Update existing
    const updateQuery = `
      UPDATE rockets 
      SET 
        provider_id = COALESCE($2, rockets.provider_id),
        spec = COALESCE($3, rockets.spec)
      WHERE id = $1
      RETURNING id
    `;
    const result = await client.query(updateQuery, [
      findResult.rows[0].id,
      providerId,
      JSON.stringify(spec)
    ]);
    return result.rows[0]?.id || null;
  } else {
    // Insert new
    const insertQuery = `
      INSERT INTO rockets (name, provider_id, spec)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const result = await client.query(insertQuery, [
      rocketData.name,
      providerId,
      JSON.stringify(spec)
    ]);
    return result.rows[0]?.id || null;
  }
}

/**
 * Upsert launch status
 */
async function upsertLaunchStatus(statusData, client) {
  if (!statusData) return null;
  
  const name = typeof statusData === 'string' ? statusData : (statusData.name || null);
  const abbrev = typeof statusData === 'string' ? null : (statusData.abbrev || null);
  
  if (!name) return null;
  
  // Check if status exists by name first
  const findQuery = `SELECT id FROM launch_statuses WHERE name = $1 LIMIT 1`;
  const findResult = await client.query(findQuery, [name]);
  
  if (findResult.rows.length > 0) {
    // Update existing (only if abbrev is provided and doesn't conflict)
    if (abbrev) {
      try {
        const updateQuery = `
          UPDATE launch_statuses 
          SET 
            abbrev = COALESCE($2, launch_statuses.abbrev),
            description = COALESCE($3, launch_statuses.description)
          WHERE id = $1
          RETURNING id
        `;
        await client.query(updateQuery, [
          findResult.rows[0].id,
          abbrev,
          typeof statusData === 'object' ? (statusData.description || null) : null
        ]);
      } catch (error) {
        // If abbrev conflict, just update description
        if (error.code === '23505') {
          const updateQuery = `
            UPDATE launch_statuses 
            SET description = COALESCE($2, launch_statuses.description)
            WHERE id = $1
            RETURNING id
          `;
          await client.query(updateQuery, [
            findResult.rows[0].id,
            typeof statusData === 'object' ? (statusData.description || null) : null
          ]);
        } else {
          throw error;
        }
      }
    }
    return findResult.rows[0].id;
  } else {
    // Insert new - try with abbrev, fallback to NULL if conflict
    try {
      const insertQuery = `
        INSERT INTO launch_statuses (name, abbrev, description)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const result = await client.query(insertQuery, [
        name,
        abbrev || null,
        typeof statusData === 'object' ? (statusData.description || null) : null
      ]);
      return result.rows[0]?.id || null;
    } catch (error) {
      // If abbrev conflict, insert without abbrev
      if (error.code === '23505') {
        const insertQuery = `
          INSERT INTO launch_statuses (name, description)
          VALUES ($1, $2)
          RETURNING id
        `;
        const result = await client.query(insertQuery, [
          name,
          typeof statusData === 'object' ? (statusData.description || null) : null
        ]);
        return result.rows[0]?.id || null;
      } else {
        throw error;
      }
    }
  }
}

/**
 * Sync launch updates array
 */
async function syncLaunchUpdates(launchId, updates, client) {
  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    console.log(`[Sync] Launch ${launchId}: No updates to sync (${updates ? 'empty array' : 'null/undefined'})`);
    return;
  }
  
  console.log(`[Sync] Launch ${launchId}: Syncing ${updates.length} updates`);
  
  // Delete existing updates for this launch
  await client.query('DELETE FROM launch_updates WHERE launch_id = $1', [launchId]);
  
  // Insert new updates
  let syncedCount = 0;
  for (const update of updates) {
    try {
      await client.query(`
        INSERT INTO launch_updates (launch_id, update_id, profile_image, comment, info_url, created_by, created_on)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        launchId,
        update.id || null,
        update.profile_image || null,
        update.comment || null,
        update.info_url || null,
        update.created_by || null,
        update.created_on || null
      ]);
      syncedCount++;
    } catch (error) {
      console.error(`[Sync] Launch ${launchId}: Error syncing update ${update.id}:`, error.message);
    }
  }
  console.log(`[Sync] Launch ${launchId}: Successfully synced ${syncedCount}/${updates.length} updates`);
}

/**
 * Sync launch timeline array
 */
async function syncLaunchTimeline(launchId, timeline, client) {
  if (!timeline || !Array.isArray(timeline) || timeline.length === 0) {
    console.log(`[Sync] Launch ${launchId}: No timeline to sync (${timeline ? 'empty array' : 'null/undefined'})`);
    return;
  }
  
  console.log(`[Sync] Launch ${launchId}: Syncing ${timeline.length} timeline events`);
  
  // Delete existing timeline for this launch
  await client.query('DELETE FROM launch_timeline WHERE launch_id = $1', [launchId]);
  
  // Insert new timeline events
  let syncedCount = 0;
  for (const event of timeline) {
    try {
      await client.query(`
        INSERT INTO launch_timeline (launch_id, type_id, type_abbrev, type_description, relative_time)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        launchId,
        event.type?.id || null,
        event.type?.abbrev || null,
        event.type?.description || null,
        event.relative_time || null
      ]);
      syncedCount++;
    } catch (error) {
      console.error(`[Sync] Launch ${launchId}: Error syncing timeline event:`, error.message);
    }
  }
  console.log(`[Sync] Launch ${launchId}: Successfully synced ${syncedCount}/${timeline.length} timeline events`);
}

/**
 * Sync launch mission patches array
 */
async function syncLaunchMissionPatches(launchId, patches, client) {
  if (!patches || !Array.isArray(patches) || patches.length === 0) {
    console.log(`[Sync] Launch ${launchId}: No mission patches to sync (${patches ? 'empty array' : 'null/undefined'})`);
    return;
  }
  
  console.log(`[Sync] Launch ${launchId}: Syncing ${patches.length} mission patches`);
  
  // Delete existing patches for this launch
  await client.query('DELETE FROM launch_mission_patches WHERE launch_id = $1', [launchId]);
  
  // Insert new patches
  let syncedCount = 0;
  for (const patch of patches) {
    try {
      await client.query(`
        INSERT INTO launch_mission_patches (launch_id, patch_data)
        VALUES ($1, $2)
      `, [
        launchId,
        JSON.stringify(patch)
      ]);
      syncedCount++;
    } catch (error) {
      console.error(`[Sync] Launch ${launchId}: Error syncing mission patch:`, error.message);
    }
  }
  console.log(`[Sync] Launch ${launchId}: Successfully synced ${syncedCount}/${patches.length} mission patches`);
}

/**
 * Sync launch info URLs array
 */
async function syncLaunchInfoUrls(launchId, infoUrls, client) {
  if (!infoUrls || !Array.isArray(infoUrls) || infoUrls.length === 0) {
    console.log(`[Sync] Launch ${launchId}: No info URLs to sync (${infoUrls ? 'empty array' : 'null/undefined'})`);
    return;
  }
  
  console.log(`[Sync] Launch ${launchId}: Syncing ${infoUrls.length} info URLs`);
  
  // Delete existing info URLs for this launch
  await client.query('DELETE FROM launch_info_urls WHERE launch_id = $1', [launchId]);
  
  // Insert new info URLs
  let syncedCount = 0;
  for (const url of infoUrls) {
    try {
      await client.query(`
        INSERT INTO launch_info_urls (
          launch_id, priority, source, title, description, feature_image, url,
          type_id, type_name, language_id, language_name, language_code
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        launchId,
        url.priority || null,
        url.source || null,
        url.title || null,
        url.description || null,
        url.feature_image || null,
        url.url || null,
        url.type?.id || null,
        url.type?.name || null,
        url.language?.id || null,
        url.language?.name || null,
        url.language?.code || null
      ]);
      syncedCount++;
    } catch (error) {
      console.error(`[Sync] Launch ${launchId}: Error syncing info URL:`, error.message);
    }
  }
  console.log(`[Sync] Launch ${launchId}: Successfully synced ${syncedCount}/${infoUrls.length} info URLs`);
}

/**
 * Sync launch video URLs array
 */
async function syncLaunchVidUrls(launchId, vidUrls, client) {
  if (!vidUrls || !Array.isArray(vidUrls) || vidUrls.length === 0) {
    console.log(`[Sync] Launch ${launchId}: No video URLs to sync (${vidUrls ? 'empty array' : 'null/undefined'})`);
    return;
  }
  
  console.log(`[Sync] Launch ${launchId}: Syncing ${vidUrls.length} video URLs`);
  
  // Delete existing video URLs for this launch
  await client.query('DELETE FROM launch_vid_urls WHERE launch_id = $1', [launchId]);
  
  // Insert new video URLs
  let syncedCount = 0;
  for (const url of vidUrls) {
    try {
      await client.query(`
        INSERT INTO launch_vid_urls (
          launch_id, priority, source, publisher, title, description, feature_image, url,
          type_id, type_name, language_id, language_name, language_code,
          start_time, end_time, live
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        launchId,
        url.priority || null,
        url.source || null,
        url.publisher || null,
        url.title || null,
        url.description || null,
        url.feature_image || null,
        url.url || null,
        url.type?.id || null,
        url.type?.name || null,
        url.language?.id || null,
        url.language?.name || null,
        url.language?.code || null,
        url.start_time || null,
        url.end_time || null,
        url.live || false
      ]);
      syncedCount++;
    } catch (error) {
      console.error(`[Sync] Launch ${launchId}: Error syncing video URL:`, error.message);
    }
  }
  console.log(`[Sync] Launch ${launchId}: Successfully synced ${syncedCount}/${vidUrls.length} video URLs`);
}

/**
 * Sync a single launch from API data
 * @param {Object} mappedLaunch - Mapped launch data from launchMapper
 * @returns {Promise<Object>} Synced launch with database ID
 */
async function syncLaunchFromApi(mappedLaunch) {
  if (!mappedLaunch || !mappedLaunch.external_id) {
    throw new Error('Invalid launch data: missing external_id');
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Upsert related entities
    const providerId = mappedLaunch.provider_data 
      ? await upsertProvider(launchMapper.mapProvider(mappedLaunch.provider_data), client)
      : null;
    
    const orbitId = mappedLaunch.orbit_data
      ? await upsertOrbit(launchMapper.mapOrbit(mappedLaunch.orbit_data), client)
      : null;
    
    const siteId = mappedLaunch.site_data
      ? await upsertLaunchSite(launchMapper.mapLaunchSite(mappedLaunch.site_data), client)
      : null;
    
    const padId = mappedLaunch.pad_data && siteId
      ? await upsertLaunchPad(launchMapper.mapLaunchPad(mappedLaunch.pad_data), siteId, client)
      : null;
    
    const rocketId = mappedLaunch.rocket_data
      ? await upsertRocket(launchMapper.mapRocket(mappedLaunch.rocket_data), providerId, client)
      : null;
    
    const statusId = mappedLaunch.status_data
      ? await upsertLaunchStatus(mappedLaunch.status_data, client)
      : null;
    
    // Upsert launch
    const launchQuery = `
      INSERT INTO launches (
        external_id, name, slug, launch_designator,
        launch_date, window_start, window_end, net_precision,
        provider_id, rocket_id, site_id, launch_pad_id, orbit_id, status_id,
        outcome, details, mission_description,
        media, youtube_video_id, youtube_channel_id,
        is_featured, webcast_live, probability, weather_concerns, failreason, hashtag,
        url, response_mode, flightclub_url, pad_turnaround,
        orbital_launch_attempt_count, location_launch_attempt_count, pad_launch_attempt_count, agency_launch_attempt_count,
        orbital_launch_attempt_count_year, location_launch_attempt_count_year, pad_launch_attempt_count_year, agency_launch_attempt_count_year,
        status_json, image_json, infographic_json, weather_concerns_json, hashtag_json,
        launch_service_provider_json, rocket_json, mission_json, pad_json, program_json,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49
      )
      ON CONFLICT (external_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        slug = COALESCE(EXCLUDED.slug, launches.slug),
        launch_designator = COALESCE(EXCLUDED.launch_designator, launches.launch_designator),
        launch_date = COALESCE(EXCLUDED.launch_date, launches.launch_date),
        window_start = COALESCE(EXCLUDED.window_start, launches.window_start),
        window_end = COALESCE(EXCLUDED.window_end, launches.window_end),
        net_precision = COALESCE(EXCLUDED.net_precision, launches.net_precision),
        provider_id = COALESCE(EXCLUDED.provider_id, launches.provider_id),
        rocket_id = COALESCE(EXCLUDED.rocket_id, launches.rocket_id),
        site_id = COALESCE(EXCLUDED.site_id, launches.site_id),
        launch_pad_id = COALESCE(EXCLUDED.launch_pad_id, launches.launch_pad_id),
        orbit_id = COALESCE(EXCLUDED.orbit_id, launches.orbit_id),
        status_id = COALESCE(EXCLUDED.status_id, launches.status_id),
        outcome = COALESCE(EXCLUDED.outcome, launches.outcome),
        details = COALESCE(EXCLUDED.details, launches.details),
        mission_description = COALESCE(EXCLUDED.mission_description, launches.mission_description),
        media = COALESCE(EXCLUDED.media, launches.media),
        youtube_video_id = COALESCE(EXCLUDED.youtube_video_id, launches.youtube_video_id),
        youtube_channel_id = COALESCE(EXCLUDED.youtube_channel_id, launches.youtube_channel_id),
        is_featured = COALESCE(EXCLUDED.is_featured, launches.is_featured),
        webcast_live = COALESCE(EXCLUDED.webcast_live, launches.webcast_live),
        probability = COALESCE(EXCLUDED.probability, launches.probability),
        weather_concerns = COALESCE(EXCLUDED.weather_concerns, launches.weather_concerns),
        failreason = COALESCE(EXCLUDED.failreason, launches.failreason),
        hashtag = COALESCE(EXCLUDED.hashtag, launches.hashtag),
        url = COALESCE(EXCLUDED.url, launches.url),
        response_mode = COALESCE(EXCLUDED.response_mode, launches.response_mode),
        flightclub_url = COALESCE(EXCLUDED.flightclub_url, launches.flightclub_url),
        pad_turnaround = COALESCE(EXCLUDED.pad_turnaround, launches.pad_turnaround),
        orbital_launch_attempt_count = COALESCE(EXCLUDED.orbital_launch_attempt_count, launches.orbital_launch_attempt_count),
        location_launch_attempt_count = COALESCE(EXCLUDED.location_launch_attempt_count, launches.location_launch_attempt_count),
        pad_launch_attempt_count = COALESCE(EXCLUDED.pad_launch_attempt_count, launches.pad_launch_attempt_count),
        agency_launch_attempt_count = COALESCE(EXCLUDED.agency_launch_attempt_count, launches.agency_launch_attempt_count),
        orbital_launch_attempt_count_year = COALESCE(EXCLUDED.orbital_launch_attempt_count_year, launches.orbital_launch_attempt_count_year),
        location_launch_attempt_count_year = COALESCE(EXCLUDED.location_launch_attempt_count_year, launches.location_launch_attempt_count_year),
        pad_launch_attempt_count_year = COALESCE(EXCLUDED.pad_launch_attempt_count_year, launches.pad_launch_attempt_count_year),
        agency_launch_attempt_count_year = COALESCE(EXCLUDED.agency_launch_attempt_count_year, launches.agency_launch_attempt_count_year),
        status_json = EXCLUDED.status_json,
        image_json = EXCLUDED.image_json,
        infographic_json = EXCLUDED.infographic_json,
        weather_concerns_json = EXCLUDED.weather_concerns_json,
        hashtag_json = EXCLUDED.hashtag_json,
        launch_service_provider_json = EXCLUDED.launch_service_provider_json,
        rocket_json = EXCLUDED.rocket_json,
        mission_json = EXCLUDED.mission_json,
        pad_json = EXCLUDED.pad_json,
        program_json = EXCLUDED.program_json,
        updated_at = EXCLUDED.updated_at
      RETURNING id, external_id, name
    `;
    
    const launchResult = await client.query(launchQuery, [
      mappedLaunch.external_id,
      mappedLaunch.name,
      mappedLaunch.slug,
      mappedLaunch.launch_designator,
      mappedLaunch.launch_date,
      mappedLaunch.window_start,
      mappedLaunch.window_end,
      mappedLaunch.net_precision ? JSON.stringify(mappedLaunch.net_precision) : null,
      providerId,
      rocketId,
      siteId,
      padId,
      orbitId,
      statusId,
      mappedLaunch.outcome,
      mappedLaunch.details,
      mappedLaunch.mission_description,
      mappedLaunch.media ? JSON.stringify(mappedLaunch.media) : null,
      mappedLaunch.youtube_video_id,
      mappedLaunch.youtube_channel_id,
      mappedLaunch.is_featured,
      mappedLaunch.webcast_live,
      mappedLaunch.probability,
      mappedLaunch.weather_concerns,
      mappedLaunch.failreason,
      mappedLaunch.hashtag,
      mappedLaunch.url || null,
      mappedLaunch.response_mode || null,
      mappedLaunch.flightclub_url || null,
      mappedLaunch.pad_turnaround || null,
      mappedLaunch.orbital_launch_attempt_count || null,
      mappedLaunch.location_launch_attempt_count || null,
      mappedLaunch.pad_launch_attempt_count || null,
      mappedLaunch.agency_launch_attempt_count || null,
      mappedLaunch.orbital_launch_attempt_count_year || null,
      mappedLaunch.location_launch_attempt_count_year || null,
      mappedLaunch.pad_launch_attempt_count_year || null,
      mappedLaunch.agency_launch_attempt_count_year || null,
      mappedLaunch.status_json ? JSON.stringify(mappedLaunch.status_json) : null,
      mappedLaunch.image_json ? JSON.stringify(mappedLaunch.image_json) : null,
      mappedLaunch.infographic_json ? JSON.stringify(mappedLaunch.infographic_json) : null,
      mappedLaunch.weather_concerns_json ? JSON.stringify(mappedLaunch.weather_concerns_json) : null,
      mappedLaunch.hashtag_json ? JSON.stringify(mappedLaunch.hashtag_json) : null,
      mappedLaunch.launch_service_provider_json ? JSON.stringify(mappedLaunch.launch_service_provider_json) : null,
      mappedLaunch.rocket_json ? JSON.stringify(mappedLaunch.rocket_json) : null,
      mappedLaunch.mission_json ? JSON.stringify(mappedLaunch.mission_json) : null,
      mappedLaunch.pad_json ? JSON.stringify(mappedLaunch.pad_json) : null,
      mappedLaunch.program_json ? JSON.stringify(mappedLaunch.program_json) : null,
      new Date().toISOString() // Always use current time for cache tracking
    ]);
    
    const launchId = launchResult.rows[0].id;
    
    // Sync array data
    await syncLaunchUpdates(launchId, mappedLaunch.updates, client);
    await syncLaunchTimeline(launchId, mappedLaunch.timeline, client);
    await syncLaunchMissionPatches(launchId, mappedLaunch.mission_patches, client);
    await syncLaunchInfoUrls(launchId, mappedLaunch.info_urls, client);
    await syncLaunchVidUrls(launchId, mappedLaunch.vid_urls, client);
    
    await client.query('COMMIT');
    
    return launchResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error syncing launch:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Sync a single launch by external_id
 * @param {string} externalId - External UUID
 * @returns {Promise<Object>} Synced launch
 */
async function syncLaunchByExternalId(externalId) {
  try {
    const launcherData = await spaceDevsApi.fetchLauncherById(externalId);
    const mappedLaunch = launchMapper.mapLauncherToLaunch(launcherData);
    return await syncLaunchFromApi(mappedLaunch);
  } catch (error) {
    console.error(`Error syncing launch ${externalId}:`, error.message);
    throw error;
  }
}

/**
 * Check and sync multiple launches if needed
 * @param {Array<Object>} dbLaunches - Launches from database
 * @returns {Promise<Array>} Updated launches
 */
async function checkAndSyncLaunches(dbLaunches) {
  const syncedLaunches = [];
  
  // Only check first 10 launches to avoid performance issues
  const launchesToCheck = dbLaunches.slice(0, 10);
  const remainingLaunches = dbLaunches.slice(10);
  
  for (const dbLaunch of launchesToCheck) {
    if (!dbLaunch.external_id) {
      // No external_id, can't sync
      syncedLaunches.push(dbLaunch);
      continue;
    }
    
    try {
      // Fetch from API to check last_updated
      const apiData = await spaceDevsApi.fetchLauncherById(dbLaunch.external_id);
      
      if (shouldSync(dbLaunch, apiData.last_updated)) {
        console.log(`Syncing launch ${dbLaunch.external_id} (${dbLaunch.name || 'Unknown'})`);
        const mappedLaunch = launchMapper.mapLauncherToLaunch(apiData);
        await syncLaunchFromApi(mappedLaunch);
        // Re-fetch from DB to get updated data
        const { rows } = await pool.query(
          'SELECT * FROM launches WHERE external_id = $1',
          [dbLaunch.external_id]
        );
        syncedLaunches.push(rows[0] || dbLaunch);
      } else {
        syncedLaunches.push(dbLaunch);
      }
    } catch (error) {
      console.error(`Error checking sync for launch ${dbLaunch.external_id}:`, error.message);
      // Return cached data if API fails
      syncedLaunches.push(dbLaunch);
    }
  }
  
  // Add remaining launches without checking
  syncedLaunches.push(...remainingLaunches);
  
  return syncedLaunches;
}

/**
 * Sync all launches from API (initial sync)
 * @returns {Promise<Object>} Sync results
 */
async function syncAllLaunches() {
  try {
    console.log('Starting full sync of all launches...');
    const allLaunchers = await spaceDevsApi.fetchAllLaunchers();
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < allLaunchers.length; i++) {
      const launcher = allLaunchers[i];
      try {
        const mappedLaunch = launchMapper.mapLauncherToLaunch(launcher);
        if (mappedLaunch && mappedLaunch.external_id) {
          await syncLaunchFromApi(mappedLaunch);
          successCount++;
          
          if ((i + 1) % 10 === 0) {
            console.log(`Synced ${i + 1}/${allLaunchers.length} launches...`);
          }
        }
      } catch (error) {
        errorCount++;
        errors.push({
          launcher: launcher.id || launcher.name,
          error: error.message
        });
        console.error(`Error syncing launcher ${launcher.id || launcher.name}:`, error.message);
      }
      
      // Small delay to avoid overwhelming the database
      if (i < allLaunchers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Full sync complete: ${successCount} successful, ${errorCount} errors`);
    
    return {
      total: allLaunchers.length,
      success: successCount,
      errors: errorCount,
      errorDetails: errors
    };
  } catch (error) {
    console.error('Error in full sync:', error);
    throw error;
  }
}

module.exports = {
  syncLaunchFromApi,
  syncLaunchByExternalId,
  checkAndSyncLaunches,
  syncAllLaunches,
  syncAllLaunchesFromExternal,
  shouldSync,
  isCacheExpired
};

