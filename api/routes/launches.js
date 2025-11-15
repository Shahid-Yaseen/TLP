/**
 * Launch Routes
 * 
 * Handles all launch-related endpoints with comprehensive filtering
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { role, permission } = require('../middleware/authorize');
const { getPool } = require('../config/database');
const launchSync = require('../services/launchSync');
const spaceDevsApi = require('../services/spaceDevsApi');
const launchMapper = require('../services/launchMapper');

const pool = getPool();

/**
 * Comprehensive filter builder supporting Launch Library API-style filters
 */
function buildFilters(query) {
  const filters = [];
  const args = [];
  let paramCount = 1;

  // Helper to add filter with operator
  const addFilter = (column, value, operator = '=') => {
    if (value === undefined || value === null || value === '') return;
    filters.push(`${column} ${operator} $${paramCount++}`);
    args.push(value);
  };

  // Helper for comparison operators
  const addComparison = (column, value, suffix) => {
    if (value === undefined || value === null || value === '') return;
    let operator = '=';
    if (suffix === '__gt') operator = '>';
    else if (suffix === '__gte') operator = '>=';
    else if (suffix === '__lt') operator = '<';
    else if (suffix === '__lte') operator = '<=';
    filters.push(`${column} ${operator} $${paramCount++}`);
    args.push(value);
  };

  // Helper for IN clause (multiple IDs or values)
  const addInFilter = (column, values, isNumeric = true) => {
    if (!values || (Array.isArray(values) && values.length === 0)) return;
    const ids = Array.isArray(values) ? values : values.split(',').map(v => v.trim());
    const placeholders = ids.map(() => `$${paramCount++}`).join(', ');
    filters.push(`${column} IN (${placeholders})`);
    if (isNumeric) {
      args.push(...ids.map(id => parseInt(id) || id));
    } else {
      args.push(...ids);
    }
  };

  // Helper for ILIKE (case-insensitive contains)
  const addContains = (column, value) => {
    if (!value) return;
    filters.push(`${column} ILIKE $${paramCount++}`);
    args.push(`%${value}%`);
  };

  // Basic filters
  if (query.id) addFilter('launches.id', parseInt(query.id));
  if (query.slug) addFilter('launches.slug', query.slug);
  if (query.name) addContains('launches.name', query.name);
  if (query.serial_number) addFilter('launches.serial_number', query.serial_number);
  if (query.launch_designator) addFilter('launches.launch_designator', query.launch_designator);
  if (query.video_url) addFilter('launches.video_url', query.video_url);

  // Date/Time filters
  if (query.net) addFilter('launches.launch_date', query.net);
  if (query.net__gt) addComparison('launches.launch_date', query.net__gt, '__gt');
  if (query.net__gte) addComparison('launches.launch_date', query.net__gte, '__gte');
  if (query.net__lt) addComparison('launches.launch_date', query.net__lt, '__lt');
  if (query.net__lte) addComparison('launches.launch_date', query.net__lte, '__lte');

  if (query.window_start) addFilter('launches.window_start', query.window_start);
  if (query.window_start__gt) addComparison('launches.window_start', query.window_start__gt, '__gt');
  if (query.window_start__gte) addComparison('launches.window_start', query.window_start__gte, '__gte');
  if (query.window_start__lt) addComparison('launches.window_start', query.window_start__lt, '__lt');
  if (query.window_start__lte) addComparison('launches.window_start', query.window_start__lte, '__lte');

  if (query.window_end) addFilter('launches.window_end', query.window_end);
  if (query.window_end__gt) addComparison('launches.window_end', query.window_end__gt, '__gt');
  if (query.window_end__gte) addComparison('launches.window_end', query.window_end__gte, '__gte');
  if (query.window_end__lt) addComparison('launches.window_end', query.window_end__lt, '__lt');
  if (query.window_end__lte) addComparison('launches.window_end', query.window_end__lte, '__lte');

  if (query.last_updated__gte) addComparison('launches.updated_at', query.last_updated__gte, '__gte');
  if (query.last_updated__lte) addComparison('launches.updated_at', query.last_updated__lte, '__lte');

  // Date components
  if (query.year) addFilter('EXTRACT(YEAR FROM launches.launch_date)', parseInt(query.year));
  if (query.month) addFilter('EXTRACT(MONTH FROM launches.launch_date)', parseInt(query.month));
  if (query.day) addFilter('EXTRACT(DAY FROM launches.launch_date)', parseInt(query.day));

  // Status filters
  if (query.status) {
    if (query.status.includes(',')) {
      addInFilter('launches.status_id', query.status.split(','));
    } else {
      addFilter('launches.status_id', parseInt(query.status));
    }
  }
  if (query.status__ids) addInFilter('launches.status_id', query.status__ids);

  // Launch attempt counts
  if (query.orbital_launch_attempt_count !== undefined) {
    addFilter('launches.orbital_launch_attempt_count', parseInt(query.orbital_launch_attempt_count));
  }
  if (query.orbital_launch_attempt_count__gt !== undefined) {
    addComparison('launches.orbital_launch_attempt_count', parseInt(query.orbital_launch_attempt_count__gt), '__gt');
  }
  if (query.orbital_launch_attempt_count__gte !== undefined) {
    addComparison('launches.orbital_launch_attempt_count', parseInt(query.orbital_launch_attempt_count__gte), '__gte');
  }
  if (query.orbital_launch_attempt_count__lt !== undefined) {
    addComparison('launches.orbital_launch_attempt_count', parseInt(query.orbital_launch_attempt_count__lt), '__lt');
  }
  if (query.orbital_launch_attempt_count__lte !== undefined) {
    addComparison('launches.orbital_launch_attempt_count', parseInt(query.orbital_launch_attempt_count__lte), '__lte');
  }

  if (query.orbital_launch_attempt_count_year !== undefined) {
    addFilter('launches.orbital_launch_attempt_count_year', parseInt(query.orbital_launch_attempt_count_year));
  }
  if (query.orbital_launch_attempt_count_year__gt !== undefined) {
    addComparison('launches.orbital_launch_attempt_count_year', parseInt(query.orbital_launch_attempt_count_year__gt), '__gt');
  }
  if (query.orbital_launch_attempt_count_year__gte !== undefined) {
    addComparison('launches.orbital_launch_attempt_count_year', parseInt(query.orbital_launch_attempt_count_year__gte), '__gte');
  }
  if (query.orbital_launch_attempt_count_year__lt !== undefined) {
    addComparison('launches.orbital_launch_attempt_count_year', parseInt(query.orbital_launch_attempt_count_year__lt), '__lt');
  }
  if (query.orbital_launch_attempt_count_year__lte !== undefined) {
    addComparison('launches.orbital_launch_attempt_count_year', parseInt(query.orbital_launch_attempt_count_year__lte), '__lte');
  }

  // Agency launch attempt counts
  if (query.agency_launch_attempt_count !== undefined) {
    addFilter('launches.agency_launch_attempt_count', parseInt(query.agency_launch_attempt_count));
  }
  if (query.agency_launch_attempt_count__gt !== undefined) {
    addComparison('launches.agency_launch_attempt_count', parseInt(query.agency_launch_attempt_count__gt), '__gt');
  }
  if (query.agency_launch_attempt_count__gte !== undefined) {
    addComparison('launches.agency_launch_attempt_count', parseInt(query.agency_launch_attempt_count__gte), '__gte');
  }
  if (query.agency_launch_attempt_count__lt !== undefined) {
    addComparison('launches.agency_launch_attempt_count', parseInt(query.agency_launch_attempt_count__lt), '__lt');
  }
  if (query.agency_launch_attempt_count__lte !== undefined) {
    addComparison('launches.agency_launch_attempt_count', parseInt(query.agency_launch_attempt_count__lte), '__lte');
  }

  if (query.agency_launch_attempt_count_year !== undefined) {
    addFilter('launches.agency_launch_attempt_count_year', parseInt(query.agency_launch_attempt_count_year));
  }
  if (query.agency_launch_attempt_count_year__gt !== undefined) {
    addComparison('launches.agency_launch_attempt_count_year', parseInt(query.agency_launch_attempt_count_year__gt), '__gt');
  }
  if (query.agency_launch_attempt_count_year__gte !== undefined) {
    addComparison('launches.agency_launch_attempt_count_year', parseInt(query.agency_launch_attempt_count_year__gte), '__gte');
  }
  if (query.agency_launch_attempt_count_year__lt !== undefined) {
    addComparison('launches.agency_launch_attempt_count_year', parseInt(query.agency_launch_attempt_count_year__lt), '__lt');
  }
  if (query.agency_launch_attempt_count_year__lte !== undefined) {
    addComparison('launches.agency_launch_attempt_count_year', parseInt(query.agency_launch_attempt_count_year__lte), '__lte');
  }

  // Location launch attempt counts
  if (query.location_launch_attempt_count !== undefined) {
    addFilter('launches.location_launch_attempt_count', parseInt(query.location_launch_attempt_count));
  }
  if (query.location_launch_attempt_count__gt !== undefined) {
    addComparison('launches.location_launch_attempt_count', parseInt(query.location_launch_attempt_count__gt), '__gt');
  }
  if (query.location_launch_attempt_count__gte !== undefined) {
    addComparison('launches.location_launch_attempt_count', parseInt(query.location_launch_attempt_count__gte), '__gte');
  }
  if (query.location_launch_attempt_count__lt !== undefined) {
    addComparison('launches.location_launch_attempt_count', parseInt(query.location_launch_attempt_count__lt), '__lt');
  }
  if (query.location_launch_attempt_count__lte !== undefined) {
    addComparison('launches.location_launch_attempt_count', parseInt(query.location_launch_attempt_count__lte), '__lte');
  }

  if (query.location_launch_attempt_count_year !== undefined) {
    addFilter('launches.location_launch_attempt_count_year', parseInt(query.location_launch_attempt_count_year));
  }
  if (query.location_launch_attempt_count_year__gt !== undefined) {
    addComparison('launches.location_launch_attempt_count_year', parseInt(query.location_launch_attempt_count_year__gt), '__gt');
  }
  if (query.location_launch_attempt_count_year__gte !== undefined) {
    addComparison('launches.location_launch_attempt_count_year', parseInt(query.location_launch_attempt_count_year__gte), '__gte');
  }
  if (query.location_launch_attempt_count_year__lt !== undefined) {
    addComparison('launches.location_launch_attempt_count_year', parseInt(query.location_launch_attempt_count_year__lt), '__lt');
  }
  if (query.location_launch_attempt_count_year__lte !== undefined) {
    addComparison('launches.location_launch_attempt_count_year', parseInt(query.location_launch_attempt_count_year__lte), '__lte');
  }

  // Pad launch attempt counts
  if (query.pad_launch_attempt_count !== undefined) {
    addFilter('launches.pad_launch_attempt_count', parseInt(query.pad_launch_attempt_count));
  }
  if (query.pad_launch_attempt_count__gt !== undefined) {
    addComparison('launches.pad_launch_attempt_count', parseInt(query.pad_launch_attempt_count__gt), '__gt');
  }
  if (query.pad_launch_attempt_count__gte !== undefined) {
    addComparison('launches.pad_launch_attempt_count', parseInt(query.pad_launch_attempt_count__gte), '__gte');
  }
  if (query.pad_launch_attempt_count__lt !== undefined) {
    addComparison('launches.pad_launch_attempt_count', parseInt(query.pad_launch_attempt_count__lt), '__lt');
  }
  if (query.pad_launch_attempt_count__lte !== undefined) {
    addComparison('launches.pad_launch_attempt_count', parseInt(query.pad_launch_attempt_count__lte), '__lte');
  }

  if (query.pad_launch_attempt_count_year !== undefined) {
    addFilter('launches.pad_launch_attempt_count_year', parseInt(query.pad_launch_attempt_count_year));
  }
  if (query.pad_launch_attempt_count_year__gt !== undefined) {
    addComparison('launches.pad_launch_attempt_count_year', parseInt(query.pad_launch_attempt_count_year__gt), '__gt');
  }
  if (query.pad_launch_attempt_count_year__gte !== undefined) {
    addComparison('launches.pad_launch_attempt_count_year', parseInt(query.pad_launch_attempt_count_year__gte), '__gte');
  }
  if (query.pad_launch_attempt_count_year__lt !== undefined) {
    addComparison('launches.pad_launch_attempt_count_year', parseInt(query.pad_launch_attempt_count_year__lt), '__lt');
  }
  if (query.pad_launch_attempt_count_year__lte !== undefined) {
    addComparison('launches.pad_launch_attempt_count_year', parseInt(query.pad_launch_attempt_count_year__lte), '__lte');
  }

  // Boolean filters
  if (query.is_crewed !== undefined) {
    // Check if any crew members exist for this launch
    filters.push(`EXISTS (SELECT 1 FROM astronaut_missions WHERE launch_id = launches.id) = $${paramCount++}`);
    args.push(query.is_crewed === 'true' || query.is_crewed === true);
  }
  if (query.include_suborbital !== undefined) {
    // This would require additional logic - for now, we'll include all launches
    // You may need to add a suborbital flag to launches table
  }

  // Launch Service Provider (LSP) filters
  if (query.lsp__id) addFilter('launches.provider_id', parseInt(query.lsp__id));
  if (query.lsp__name) addContains('providers.name', query.lsp__name);
  if (query.related_lsp__id) addFilter('launches.provider_id', parseInt(query.related_lsp__id));
  if (query.related_lsp__name) addContains('providers.name', query.related_lsp__name);

  // Rocket Configuration filters
  if (query.rocket__configuration__id || query.launcher_config__id) {
    addFilter('rockets.configuration_id', parseInt(query.rocket__configuration__id || query.launcher_config__id));
  }
  if (query.rocket__configuration__name) addContains('rocket_configurations.name', query.rocket__configuration__name);
  if (query.rocket__configuration__name__icontains) addContains('rocket_configurations.name', query.rocket__configuration__name__icontains);
  if (query.rocket__configuration__full_name) addContains('rocket_configurations.full_name', query.rocket__configuration__full_name);
  if (query.rocket__configuration__full_name__icontains) addContains('rocket_configurations.full_name', query.rocket__configuration__full_name__icontains);
  if (query.rocket__configuration__manufacturer__name) addContains('agencies.name', query.rocket__configuration__manufacturer__name);
  if (query.rocket__configuration__manufacturer__name__icontains) addContains('agencies.name', query.rocket__configuration__manufacturer__name__icontains);

  // Mission filters
  if (query.mission__agency__ids) addInFilter('launches.provider_id', query.mission__agency__ids);
  if (query.mission__orbit__name) addFilter('orbits.description', query.mission__orbit__name);
  if (query.mission__orbit__name__icontains) addContains('orbits.description', query.mission__orbit__name__icontains);
  if (query.mission__orbit__celestial_body__id) addFilter('celestial_bodies.id', parseInt(query.mission__orbit__celestial_body__id));

  // Spacecraft filters
  if (query.rocket__spacecraftflight__spacecraft__id) {
    // This would require a spacecraft_flights join table
    // For now, we'll note it needs implementation
  }
  if (query.rocket__spacecraftflight__spacecraft__name) {
    // This would require a spacecraft_flights join table
  }
  if (query.rocket__spacecraftflight__spacecraft__name__icontains) {
    // This would require a spacecraft_flights join table
  }
  if (query.spacecraft_config__ids) {
    // This would require spacecraft configuration joins
  }

  // Location and Pad filters
  if (query.location__ids) addInFilter('launch_sites.id', query.location__ids);
  if (query.pad) addContains('launch_pads.name', query.pad);
  if (query.pad__location) {
    // Filter by pad's location (launch site)
    addContains('launch_sites.name', query.pad__location);
  }
  if (query.pad__location__celestial_body__id) {
    // This would require celestial body relationship on launch sites
  }

  // Country filters
  if (query.country__id) addFilter('countries.id', parseInt(query.country__id));
  if (query.country__name) addContains('countries.name', query.country__name);
  if (query.country__code) {
    // Support comma-separated country codes (e.g., 'FR,DE,IT')
    if (query.country__code.includes(',')) {
      const codes = query.country__code.split(',').map(c => c.trim().toUpperCase());
      const placeholders = codes.map(() => `$${paramCount++}`).join(', ');
      filters.push(`(countries.alpha_2_code IN (${placeholders}) OR countries.alpha_3_code IN (${placeholders}))`);
      args.push(...codes, ...codes);
    } else {
      // Single country code
      filters.push(`(countries.alpha_2_code = $${paramCount} OR countries.alpha_3_code = $${paramCount})`);
      args.push(query.country__code.toUpperCase());
      paramCount++;
    }
  }
  if (query.location__country) {
    // Alias for country filtering by name
    addContains('countries.name', query.location__country);
  }

  // Program filters
  if (query.program) {
    // Filter by program name
    filters.push(`EXISTS (
      SELECT 1 FROM launch_programs lp
      JOIN programs p ON lp.program_id = p.id
      WHERE lp.launch_id = launches.id AND p.name ILIKE $${paramCount++}
    )`);
    args.push(`%${query.program}%`);
  }

  // Legacy filters (for backward compatibility)
  if (query.provider) addContains('providers.name', query.provider);
  if (query.rocket) addContains('rockets.name', query.rocket);
  if (query.site) addContains('launch_sites.name', query.site);
  if (query.orbit) addContains('orbits.code', query.orbit);
  if (query.after) addComparison('launches.launch_date', query.after, '__gte');
  if (query.before) addComparison('launches.launch_date', query.before, '__lte');
  if (query.outcome) {
    // Support comma-separated values like 'success,failure,partial'
    if (query.outcome.includes(',')) {
      addInFilter('launches.outcome', query.outcome, false); // false = text values, not numeric
    } else {
      addFilter('launches.outcome', query.outcome);
    }
  }
  if (query.featured === 'true') addFilter('launches.is_featured', true);
  if (query.mission_type) addContains('mission_types.name', query.mission_type);

  return { filters, args, needsJoins: true };
}

/**
 * Build comprehensive SQL with all necessary joins
 */
function buildLaunchQuery(filters, args, options = {}) {
  const {
    includePayloads = false,
    includeCrew = false,
    includeRecovery = false,
    includeWindows = false,
    includeHazards = false
  } = options;
  
  let sql = `
    SELECT DISTINCT
      launches.*,
      providers.id as provider_id,
      providers.name as provider,
      providers.abbrev as provider_abbrev,
      rockets.id as rocket_id,
      rockets.name as rocket,
      orbits.id as orbit_id,
      orbits.code as orbit,
      orbits.description as orbit_name,
      launch_sites.id as site_id,
      launch_sites.name as site,
      launch_sites.country as site_country,
      launch_pads.id as pad_id,
      launch_pads.name as pad_name,
      mission_types.id as mission_type_id,
      mission_types.name as mission_type,
      launch_statuses.id as status_id,
      launch_statuses.name as status_name,
      launch_statuses.abbrev as status_abbrev,
      countries.id as country_id,
      countries.name as country_name,
      countries.alpha_2_code as country_code,
      celestial_bodies.id as celestial_body_id,
      celestial_bodies.name as celestial_body_name
    FROM launches
    LEFT JOIN providers ON launches.provider_id = providers.id
    LEFT JOIN agencies ON launches.provider_id = agencies.id
    LEFT JOIN rockets ON launches.rocket_id = rockets.id
    LEFT JOIN orbits ON launches.orbit_id = orbits.id
    LEFT JOIN celestial_bodies ON orbits.celestial_body_id = celestial_bodies.id
    LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
    LEFT JOIN countries ON launch_sites.country_id = countries.id
    LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
    LEFT JOIN mission_types ON launches.mission_type_id = mission_types.id
    LEFT JOIN launch_statuses ON launches.status_id = launch_statuses.id
  `;

  // Add joins for nested filters
  const filterStr = filters.join(' ');
  if (filterStr.includes('rocket_configurations') || filterStr.includes('launcher_config')) {
    sql += ` LEFT JOIN rocket_configurations ON rockets.configuration_id = rocket_configurations.id `;
  }
  if (filterStr.includes('agencies') && !filterStr.includes('LEFT JOIN agencies')) {
    sql += ` LEFT JOIN agencies ON launches.provider_id = agencies.id `;
  }
  if (filterStr.includes('program')) {
    sql += ` LEFT JOIN launch_programs ON launches.id = launch_programs.launch_id
             LEFT JOIN programs ON launch_programs.program_id = programs.id `;
  }

  if (filters.length) {
    sql += ' WHERE ' + filters.join(' AND ');
  }

  return sql;
}

/**
 * GET /api/launches
 * Get all launches with comprehensive filtering
 * Automatically syncs with Space Devs API if data is outdated
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { filters, args, needsJoins } = buildFilters(req.query);
  
  let sql = buildLaunchQuery(filters, args);
  sql += ' ORDER BY launches.launch_date DESC';

  // Pagination
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const finalSql = sql + ` LIMIT $${args.length + 1} OFFSET $${args.length + 2}`;
  const finalArgs = [...args, limit, offset];

  let rows = [];
  let apiUnavailable = false;

  try {
    // Check if cache is expired (older than 1 day)
    const cacheExpired = await launchSync.isCacheExpired(1);
    
    // Start sync in background if cache is expired (non-blocking)
    if (cacheExpired) {
      console.log('Cache expired, starting background sync from external API...');
      // Don't await - let it run in background
      launchSync.syncAllLaunchesFromExternal()
        .then(() => {
          console.log('Background sync completed successfully');
        })
        .catch((syncError) => {
          console.error('Error in background sync from external API:', syncError.message);
          apiUnavailable = true;
        });
    }
    
    // Always query database (either fresh data or cached)
    // This returns immediately, even if sync is still running in background
    const { rows: dbRows } = await pool.query(finalSql, finalArgs);
    rows = dbRows;
  } catch (error) {
    console.error('Error querying launches:', error);
    throw error;
  }

  // Get total count - use simpler query for better performance
  // Only count if explicitly requested or for small result sets
  let totalCount = rows.length;
  let hasMore = false;
  
  if (req.query.include_count === 'true' || limit <= 20) {
    try {
      // Simplified count query - just count launches matching filters
  let countSql = 'SELECT COUNT(DISTINCT launches.id) as count FROM launches';
      const countFilters = [];
      const countArgs = [];
      let countParamCount = 1;
      
      // Add only the essential filters for counting
      if (filters.length > 0) {
        // Extract just the launch_date and basic filters
        filters.forEach((filter, idx) => {
          if (filter.includes('launches.launch_date') || filter.includes('launches.id') || filter.includes('launches.name')) {
            countFilters.push(filter.replace(/\$\d+/g, () => `$${countParamCount++}`));
            countArgs.push(args[idx]);
          }
        });
        
        if (countFilters.length > 0) {
          countSql += ' WHERE ' + countFilters.join(' AND ');
        }
      }
      
      const { rows: countRows } = await pool.query(countSql, countArgs);
      totalCount = parseInt(countRows[0]?.count || rows.length);
      hasMore = offset + rows.length < totalCount;
    } catch (countError) {
      // If count fails, estimate based on returned rows
      console.warn('Count query failed, using estimate:', countError.message);
      hasMore = rows.length === limit;
    }
  } else {
    // Estimate has_more based on returned rows
    hasMore = rows.length === limit;
  }

  const response = {
    data: rows,
    pagination: {
      total: totalCount,
      limit,
      offset,
      has_more: hasMore
    }
  };

  // Add warning if API was unavailable
  if (apiUnavailable) {
    response._cached = true;
    response._warning = 'Some data may be stale due to API unavailability';
  }

  res.json(response);
}));

// ... rest of the routes remain the same ...
// (Keeping the existing /upcoming, /previous, /featured, /:id, POST, PATCH, DELETE routes)

/**
 * GET /api/launches/upcoming
 * Get upcoming launches
 */
router.get('/upcoming', optionalAuth, asyncHandler(async (req, res) => {
  req.query.net__gte = new Date().toISOString();
  const { filters, args } = buildFilters(req.query);
  
  let sql = buildLaunchQuery(filters, args);
  if (filters.length) {
    sql += ' WHERE launches.launch_date >= NOW() AND ' + filters.join(' AND ');
  } else {
    sql += ' WHERE launches.launch_date >= NOW()';
  }
  sql += ' ORDER BY launches.launch_date ASC LIMIT $' + (args.length + 1);
  args.push(parseInt(req.query.limit) || 50);

  const { rows } = await pool.query(sql, args);
  res.json(rows);
}));

/**
 * GET /api/launches/previous
 * Get previous launches
 */
router.get('/previous', optionalAuth, asyncHandler(async (req, res) => {
  req.query.net__lt = new Date().toISOString();
  const { filters, args } = buildFilters(req.query);
  
  let sql = buildLaunchQuery(filters, args);
  if (filters.length) {
    sql += ' WHERE launches.launch_date < NOW() AND ' + filters.join(' AND ');
  } else {
    sql += ' WHERE launches.launch_date < NOW()';
  }
  sql += ' ORDER BY launches.launch_date DESC LIMIT $' + (args.length + 1);
  args.push(parseInt(req.query.limit) || 50);

  const { rows } = await pool.query(sql, args);
  res.json(rows);
}));

/**
 * GET /api/launches/featured
 * Get featured launches
 */
router.get('/featured', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT 
      launches.*,
      providers.name as provider,
      rockets.name as rocket,
      orbits.code as orbit,
      launch_sites.name as site,
      launch_pads.name as pad_name
    FROM launches
    LEFT JOIN providers ON launches.provider_id = providers.id
    LEFT JOIN rockets ON launches.rocket_id = rockets.id
    LEFT JOIN orbits ON launches.orbit_id = orbits.id
    LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
    LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
    WHERE launches.is_featured = true
    ORDER BY launches.launch_date DESC
  `);
  res.json(rows);
}));

/**
 * GET /api/launches/historical
 * Get historical launches from database for the same month and day
 * Only queries database - no external API calls
 */
router.get('/historical', optionalAuth, asyncHandler(async (req, res) => {
  const { month, day, currentYear } = req.query;
  
  if (!month || !day) {
    return res.status(400).json({ 
      error: 'Month and day parameters are required',
      code: 'MISSING_PARAMS'
    });
  }

  try {
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    const yearNum = currentYear ? parseInt(currentYear) : new Date().getFullYear();
    
    console.log(`[Historical] Fetching for month=${monthNum}, day=${dayNum}, year=${yearNum}`);
    
    const targetCount = 5;
    
    // Query database ONLY - no external API calls
    console.log(`[Historical] Querying database...`);
    const { rows: dbRows } = await pool.query(`
      SELECT DISTINCT
        launches.id,
        launches.name,
        launches.launch_date,
        launches.mission_image_url,
        launches.image_json::text as image_json_text,
        launches.infographic_url,
        providers.id as provider_id,
        providers.name as provider,
        providers.abbrev as provider_abbrev,
        rockets.id as rocket_id,
        rockets.name as rocket,
        orbits.id as orbit_id,
        orbits.code as orbit,
        orbits.description as orbit_name,
        launch_sites.id as site_id,
        launch_sites.name as site,
        launch_sites.country as site_country,
        launch_pads.id as pad_id,
        launch_pads.name as pad_name,
        mission_types.id as mission_type_id,
        mission_types.name as mission_type,
        launch_statuses.id as status_id,
        launch_statuses.name as status_name,
        launch_statuses.abbrev as status_abbrev,
        countries.id as country_id,
        countries.name as country_name,
        countries.alpha_2_code as country_code
      FROM launches
      LEFT JOIN providers ON launches.provider_id = providers.id
      LEFT JOIN rockets ON launches.rocket_id = rockets.id
      LEFT JOIN orbits ON launches.orbit_id = orbits.id
      LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
      LEFT JOIN countries ON launch_sites.country_id = countries.id
      LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
      LEFT JOIN mission_types ON launches.mission_type_id = mission_types.id
      LEFT JOIN launch_statuses ON launches.status_id = launch_statuses.id
      WHERE EXTRACT(MONTH FROM launches.launch_date) = $1
        AND EXTRACT(DAY FROM launches.launch_date) = $2
        AND EXTRACT(YEAR FROM launches.launch_date) < $3
        AND launches.launch_date < NOW()
        AND launches.launch_date IS NOT NULL
      ORDER BY launches.launch_date DESC
      LIMIT $4
    `, [monthNum, dayNum, yearNum, targetCount]);
    
    console.log(`[Historical] Found ${dbRows.length} launches in DB for month=${monthNum}, day=${dayNum}`);
    
    // Format the data to match frontend expectations exactly
    const formattedLaunches = dbRows.map(row => {
      // Parse image_json if it exists
      let imageJson = null;
      let imageUrl = null;
      
      try {
        if (row.image_json_text) {
          imageJson = typeof row.image_json_text === 'string' 
            ? JSON.parse(row.image_json_text) 
            : row.image_json_text;
          imageUrl = imageJson?.image_url || null;
        }
      } catch (e) {
        console.warn('[Historical] Error parsing image_json:', e.message);
      }
      
      // Get image URL from various sources
      const finalImageUrl = row.mission_image_url || imageUrl || null;
      
      return {
        id: row.id,
        name: row.name || 'Unknown Launch',
        launch_date: row.launch_date,
        net: row.launch_date,
        provider: row.provider || null,
        provider_abbrev: row.provider_abbrev || row.provider || null,
        site: row.site || row.site_country || null,
        site_name: row.site || row.site_country || null,
        rocket: row.rocket || null,
        mission_type: row.mission_type || null,
        mission_image_url: finalImageUrl,
        infographic_url: row.infographic_url || null,
        media: finalImageUrl ? { image: { image_url: finalImageUrl } } : null,
        // Include all other fields for compatibility
        provider_id: row.provider_id,
        rocket_id: row.rocket_id,
        site_id: row.site_id,
        pad_id: row.pad_id,
        mission_type_id: row.mission_type_id,
        status_id: row.status_id,
        status_name: row.status_name,
        status_abbrev: row.status_abbrev,
        country_id: row.country_id,
        country_name: row.country_name,
        country_code: row.country_code,
        orbit: row.orbit,
        orbit_name: row.orbit_name,
        pad_name: row.pad_name
      };
    });
    
    console.log(`[Historical] Returning ${formattedLaunches.length} launches`);
    if (formattedLaunches.length > 0) {
      console.log(`[Historical] Sample launch data:`, JSON.stringify(formattedLaunches[0], null, 2));
    }

    res.json({
      data: formattedLaunches,
      count: formattedLaunches.length
    });
  } catch (error) {
    console.error('[Historical] Error fetching historical launches from database:', error);
    console.error('[Historical] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch historical launches from database',
      code: 'DATABASE_ERROR',
      message: error.message
    });
  }
}));

/**
 * Transform database launch row to Space Devs API format
 */
function formatLaunchResponse(launchRow, relatedData = {}) {
  // Helper to safely parse JSONB columns
  const parseJsonb = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.warn('Error parsing JSONB column:', e.message);
        return null;
      }
    }
    return value;
  };

  // Parse JSONB columns
  const statusJson = parseJsonb(launchRow.status_json);
  const imageJson = parseJsonb(launchRow.image_json);
  const infographicJson = parseJsonb(launchRow.infographic_json);
  const launchServiceProviderJson = parseJsonb(launchRow.launch_service_provider_json);
  const rocketJson = parseJsonb(launchRow.rocket_json);
  const missionJson = parseJsonb(launchRow.mission_json);
  const padJson = parseJsonb(launchRow.pad_json);
  const programJson = parseJsonb(launchRow.program_json);
  const netPrecision = parseJsonb(launchRow.net_precision);
  const weatherConcernsJson = parseJsonb(launchRow.weather_concerns_json);
  const hashtagJson = parseJsonb(launchRow.hashtag_json);

  // Build status object
  const status = statusJson || (launchRow.status_id ? {
    id: launchRow.status_id,
    name: launchRow.status_name || null,
    abbrev: launchRow.status_abbrev || null,
    description: null
  } : null);

  // Build launch_service_provider object - use JSONB directly if available, otherwise fallback
  const launchServiceProvider = launchServiceProviderJson || (launchRow.provider_id ? {
    id: launchRow.provider_id,
    url: null,
    name: launchRow.provider || null,
    type: null,
    country_code: null,
    abbrev: launchRow.provider_abbrev || null,
    description: null,
    administrator: null,
    founding_year: null,
    launchers: null,
    spacecraft: null,
    parent: null,
    image_url: null,
    logo_url: null,
    nation_url: null,
    wiki_url: null,
    info_url: null
  } : null);

  // Build rocket object - use JSONB directly if available, otherwise fallback
  // Ensure rocket always has a configuration property
  let rocket = rocketJson;
  if (!rocket && launchRow.rocket_id) {
    rocket = {
      id: launchRow.rocket_id,
      configuration: {
        id: null,
        url: null,
        name: launchRow.rocket || null,
        family: null,
        full_name: launchRow.rocket || null,
        variant: null,
        alias: null,
        min_stage: null,
        max_stage: null,
        length: null,
        diameter: null,
        maiden_flight: null,
        launch_cost: null,
        launch_mass: null,
        leo_capacity: null,
        gto_capacity: null,
        to_thrust: null,
        apogee: null,
        vehicle_range: null,
        image_url: null,
        info_url: null,
        wiki_url: null,
        total_launch_count: null,
        consecutive_successful_launches: null,
        successful_launches: null,
        failed_launches: null,
        pending_launches: null,
        manufacturer: null,
        program: null,
        reusable: null,
        description: null
      },
      launcher_stage: null,
      spacecraft_stage: null
    };
  }
  // If rocketJson exists but doesn't have configuration, ensure it does
  if (rocket && !rocket.configuration && launchRow.rocket) {
    rocket.configuration = {
      name: launchRow.rocket,
      full_name: launchRow.rocket
    };
  }

  // Build mission object - use JSONB directly if available, otherwise fallback
  const mission = missionJson || (launchRow.mission_type_id ? {
    id: launchRow.mission_type_id,
    name: launchRow.mission_type || null,
    description: null,
    type: launchRow.mission_type || null,
    orbit: launchRow.orbit_id ? {
      id: launchRow.orbit_id,
      name: launchRow.orbit_name || null,
      abbrev: launchRow.orbit || null
    } : null,
    agencies: null,
    info_urls: launchRow.mission_info_urls ? (typeof launchRow.mission_info_urls === 'string' ? JSON.parse(launchRow.mission_info_urls) : launchRow.mission_info_urls) : null,
    vid_urls: launchRow.mission_vid_urls ? (typeof launchRow.mission_vid_urls === 'string' ? JSON.parse(launchRow.mission_vid_urls) : launchRow.mission_vid_urls) : null
  } : null);

  // Build pad object - use JSONB directly if available, otherwise fallback
  const pad = padJson || (launchRow.pad_id ? {
    id: launchRow.pad_id,
    url: null,
    agency_id: null,
    name: launchRow.pad_name || null,
    info_url: null,
    wiki_url: null,
    map_url: null,
    latitude: null,
    longitude: null,
    location: launchRow.site_id ? {
      id: launchRow.site_id,
      url: null,
      name: launchRow.site || null,
      country_code: null,
      map_image: null,
      total_launch_count: null,
      total_landing_count: null
    } : null,
    country_code: null,
    map_image: null,
    total_launch_count: null,
    orbital_launch_attempt_count: null
  } : null);

  // Build image object
  const image = imageJson || (launchRow.mission_image_url ? {
    image_url: launchRow.mission_image_url,
    thumbnail_url: null,
    credit: null,
    credit_link: null,
    license_id: null,
    license_name: null,
    license_link: null,
    single_use: null,
    variants: null
  } : null);

  // Build infographic object
  const infographic = infographicJson || (launchRow.infographic_url ? {
    image_url: launchRow.infographic_url,
    thumbnail_url: null,
    credit: null,
    credit_link: null,
    license_id: null,
    license_name: null,
    license_link: null,
    single_use: null,
    variants: null
  } : null);

  // Build program array - ensure it's always an array
  let program = [];
  if (Array.isArray(programJson)) {
    program = programJson;
  } else if (programJson && typeof programJson === 'object') {
    program = [programJson];
  }

  // Build response object matching Space Devs API format EXACTLY
  // Use the stored JSONB fields directly from Space Devs API
  const response = {
    id: launchRow.external_id || launchRow.id.toString(),
    url: launchRow.url || null,
    name: launchRow.name || null,
    slug: launchRow.slug || null,
    launch_designator: launchRow.launch_designator || null,
    response_mode: launchRow.response_mode || 'normal',
    last_updated: launchRow.updated_at || launchRow.created_at || new Date().toISOString(),
    net: launchRow.launch_date || launchRow.net || null,
    net_precision: netPrecision || null,
    window_start: launchRow.window_start || null,
    window_end: launchRow.window_end || null,
    probability: launchRow.probability !== null && launchRow.probability !== undefined ? launchRow.probability : null,
    weather_concerns: weatherConcernsJson || launchRow.weather_concerns || null,
    failreason: launchRow.failreason || null,
    hashtag: hashtagJson || launchRow.hashtag || null,
    webcast_live: launchRow.webcast_live || false,
    // Use raw JSONB fields directly from Space Devs API
    image: imageJson || image,
    infographic: infographicJson || infographic,
    program: programJson || program,
    orbital_launch_attempt_count: launchRow.orbital_launch_attempt_count !== null && launchRow.orbital_launch_attempt_count !== undefined ? launchRow.orbital_launch_attempt_count : null,
    location_launch_attempt_count: launchRow.location_launch_attempt_count !== null && launchRow.location_launch_attempt_count !== undefined ? launchRow.location_launch_attempt_count : null,
    pad_launch_attempt_count: launchRow.pad_launch_attempt_count !== null && launchRow.pad_launch_attempt_count !== undefined ? launchRow.pad_launch_attempt_count : null,
    agency_launch_attempt_count: launchRow.agency_launch_attempt_count !== null && launchRow.agency_launch_attempt_count !== undefined ? launchRow.agency_launch_attempt_count : null,
    orbital_launch_attempt_count_year: launchRow.orbital_launch_attempt_count_year !== null && launchRow.orbital_launch_attempt_count_year !== undefined ? launchRow.orbital_launch_attempt_count_year : null,
    location_launch_attempt_count_year: launchRow.location_launch_attempt_count_year !== null && launchRow.location_launch_attempt_count_year !== undefined ? launchRow.location_launch_attempt_count_year : null,
    pad_launch_attempt_count_year: launchRow.pad_launch_attempt_count_year !== null && launchRow.pad_launch_attempt_count_year !== undefined ? launchRow.pad_launch_attempt_count_year : null,
    agency_launch_attempt_count_year: launchRow.agency_launch_attempt_count_year !== null && launchRow.agency_launch_attempt_count_year !== undefined ? launchRow.agency_launch_attempt_count_year : null,
    pad_turnaround: launchRow.pad_turnaround || null,
    flightclub_url: launchRow.flightclub_url || null,
    // Use raw JSONB objects directly - these are already in Space Devs API format
    status: statusJson || status,
    launch_service_provider: launchServiceProviderJson || launchServiceProvider,
    rocket: rocketJson || rocket,
    mission: missionJson || mission,
    pad: padJson || pad,
    // Array fields from database
    updates: relatedData.updates || [],
    info_urls: relatedData.info_urls || [],
    vid_urls: relatedData.vid_urls || [],
    timeline: relatedData.timeline || [],
    mission_patches: relatedData.mission_patches || []
  };

  return response;
}

/**
 * GET /api/launches/:id
 * Get a single launch by ID with all related data
 * Automatically syncs with Space Devs API if data is outdated or missing
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  let apiUnavailable = false;

  // Try to find launch by internal ID first
  let { rows: launchRows } = await pool.query(`
    SELECT 
      launches.*,
      providers.name as provider,
      providers.abbrev as provider_abbrev,
      rockets.name as rocket,
      orbits.code as orbit,
      orbits.description as orbit_name,
      launch_sites.name as site,
      launch_sites.country as site_country,
      launch_pads.name as pad_name,
      mission_types.name as mission_type,
      launch_statuses.name as status_name,
      launch_statuses.abbrev as status_abbrev
    FROM launches
    LEFT JOIN providers ON launches.provider_id = providers.id
    LEFT JOIN rockets ON launches.rocket_id = rockets.id
    LEFT JOIN orbits ON launches.orbit_id = orbits.id
    LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
    LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
    LEFT JOIN mission_types ON launches.mission_type_id = mission_types.id
    LEFT JOIN launch_statuses ON launches.status_id = launch_statuses.id
    WHERE launches.id = $1
  `, [id]);

  // If not found by internal ID, try external_id (UUID)
  if (!launchRows.length) {
    const { rows: externalRows } = await pool.query(`
      SELECT 
        launches.*,
        providers.name as provider,
        providers.abbrev as provider_abbrev,
        rockets.name as rocket,
        orbits.code as orbit,
        orbits.description as orbit_name,
        launch_sites.name as site,
        launch_sites.country as site_country,
        launch_pads.name as pad_name,
        mission_types.name as mission_type,
        launch_statuses.name as status_name,
        launch_statuses.abbrev as status_abbrev
      FROM launches
      LEFT JOIN providers ON launches.provider_id = providers.id
      LEFT JOIN rockets ON launches.rocket_id = rockets.id
      LEFT JOIN orbits ON launches.orbit_id = orbits.id
      LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
      LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
      LEFT JOIN mission_types ON launches.mission_type_id = mission_types.id
      LEFT JOIN launch_statuses ON launches.status_id = launch_statuses.id
      WHERE launches.external_id = $1
    `, [id]);
    
    if (externalRows.length) {
      launchRows = externalRows;
    } else {
      // Not found in DB, try fetching from API
      try {
        const apiData = await spaceDevsApi.fetchLauncherById(id);
        const mappedLaunch = launchMapper.mapLauncherToLaunch(apiData);
        const syncedLaunch = await launchSync.syncLaunchFromApi(mappedLaunch);
        
        // Re-fetch from DB with all joins
        const { rows: newRows } = await pool.query(`
          SELECT 
            launches.*,
            providers.name as provider,
            providers.abbrev as provider_abbrev,
            rockets.name as rocket,
            orbits.code as orbit,
            orbits.description as orbit_name,
            launch_sites.name as site,
            launch_sites.country as site_country,
            launch_pads.name as pad_name,
            mission_types.name as mission_type,
            launch_statuses.name as status_name,
            launch_statuses.abbrev as status_abbrev
          FROM launches
          LEFT JOIN providers ON launches.provider_id = providers.id
          LEFT JOIN rockets ON launches.rocket_id = rockets.id
          LEFT JOIN orbits ON launches.orbit_id = orbits.id
          LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
          LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
          LEFT JOIN mission_types ON launches.mission_type_id = mission_types.id
          LEFT JOIN launch_statuses ON launches.status_id = launch_statuses.id
          WHERE launches.id = $1
        `, [syncedLaunch.id]);
        
        launchRows = newRows;
      } catch (apiError) {
        console.error('Error fetching launch from API:', apiError.message);
        return res.status(404).json({ 
          error: 'Launch not found', 
          code: 'NOT_FOUND',
          message: 'Launch not found in database or external API'
        });
      }
    }
  }

  if (!launchRows.length) {
    return res.status(404).json({ error: 'Launch not found', code: 'NOT_FOUND' });
  }

  let launch = launchRows[0];

  // Cache data for 24 hours - only fetch from external API if data is older than 1 day
  const CACHE_DURATION_HOURS = 24;
  const now = new Date();
  const updatedAt = launch.updated_at ? new Date(launch.updated_at) : null;
  const hoursSinceUpdate = updatedAt ? (now - updatedAt) / (1000 * 60 * 60) : Infinity;
  const shouldRefresh = hoursSinceUpdate > CACHE_DURATION_HOURS;

  if (launch.external_id && shouldRefresh) {
    console.log(`[Cache] Launch ${launch.external_id} is ${Math.round(hoursSinceUpdate)} hours old - refreshing from external API...`);
    try {
      const apiData = await spaceDevsApi.fetchLauncherById(launch.external_id);
      if (apiData) {
        console.log(`[Cache] Syncing launch ${launch.external_id} with external API data...`);
        const mappedLaunch = launchMapper.mapLauncherToLaunch(apiData);
        const syncedLaunch = await launchSync.syncLaunchFromApi(mappedLaunch);
        
        // Re-fetch launch from DB with all joins after sync
        const { rows: syncedLaunchRows } = await pool.query(`
          SELECT 
            launches.*,
            providers.name as provider,
            providers.abbrev as provider_abbrev,
            rockets.name as rocket,
            orbits.code as orbit,
            orbits.description as orbit_name,
            launch_sites.name as site,
            launch_sites.country as site_country,
            launch_pads.name as pad_name,
            mission_types.name as mission_type,
            launch_statuses.name as status_name,
            launch_statuses.abbrev as status_abbrev
          FROM launches
          LEFT JOIN providers ON launches.provider_id = providers.id
          LEFT JOIN rockets ON launches.rocket_id = rockets.id
          LEFT JOIN orbits ON launches.orbit_id = orbits.id
          LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
          LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
          LEFT JOIN mission_types ON launches.mission_type_id = mission_types.id
          LEFT JOIN launch_statuses ON launches.status_id = launch_statuses.id
          WHERE launches.id = $1
        `, [syncedLaunch.id]);
        
        if (syncedLaunchRows.length > 0) {
          launch = syncedLaunchRows[0];
          console.log(`[Cache] Successfully synced launch ${launch.external_id} with external API data`);
        }
      }
    } catch (apiError) {
      console.error('[Cache] Error fetching from external API:', apiError.message);
      // Continue with existing database data if API fails
      apiUnavailable = true;
    }
  } else if (launch.external_id) {
    console.log(`[Cache] Launch ${launch.external_id} is ${Math.round(hoursSinceUpdate)} hours old - using cached data (refreshes every ${CACHE_DURATION_HOURS}h)`);
  }

  // Get payloads (use launch.id after potential sync)
  const launchId = launch.id;
  const { rows: payloadRows } = await pool.query(`
    SELECT payloads.*
    FROM payloads
    JOIN launch_payloads ON payloads.id = launch_payloads.payload_id
    WHERE launch_payloads.launch_id = $1
  `, [launchId]);

  // Get recovery info
  const { rows: recoveryRows } = await pool.query(`
    SELECT * FROM recoveries WHERE launch_id = $1
  `, [launchId]);

  // Get launch windows
  const { rows: windowRows } = await pool.query(`
    SELECT * FROM launch_windows WHERE launch_id = $1
  `, [launchId]);

  // Get hazards
  const { rows: hazardRows } = await pool.query(`
    SELECT * FROM launch_hazards WHERE launch_id = $1
  `, [launchId]);

  // Get crew members
  const { rows: crewRows } = await pool.query(`
    SELECT 
      astronauts.*,
      astronaut_missions.role
    FROM astronauts
    JOIN astronaut_missions ON astronauts.id = astronaut_missions.astronaut_id
    WHERE astronaut_missions.launch_id = $1
  `, [launchId]);

  // Get updates (after sync, this should have all the latest data)
  const { rows: updateRows } = await pool.query(`
    SELECT * FROM launch_updates WHERE launch_id = $1 ORDER BY created_on DESC
  `, [launchId]);

  // Get timeline
  const { rows: timelineRows } = await pool.query(`
    SELECT * FROM launch_timeline WHERE launch_id = $1 ORDER BY 
      CASE 
        WHEN relative_time LIKE '-%' THEN 1
        WHEN relative_time LIKE 'P%' THEN 2
        ELSE 3
      END,
      relative_time
  `, [launchId]);

  // Get mission patches
  const { rows: patchRows } = await pool.query(`
    SELECT patch_data FROM launch_mission_patches WHERE launch_id = $1
  `, [launchId]);

  // Get info URLs
  const { rows: infoUrlRows } = await pool.query(`
    SELECT * FROM launch_info_urls WHERE launch_id = $1 ORDER BY priority ASC
  `, [launchId]);

  // Get video URLs
  const { rows: vidUrlRows } = await pool.query(`
    SELECT * FROM launch_vid_urls WHERE launch_id = $1 ORDER BY priority ASC
  `, [launchId]);
  
  console.log(`[API] Launch ${launchId}: Fetched array data - Updates: ${updateRows.length}, Timeline: ${timelineRows.length}, Patches: ${patchRows.length}, Info URLs: ${infoUrlRows.length}, Vid URLs: ${vidUrlRows.length}`);

  // Helper to safely parse JSONB
  const parseJsonb = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return null;
      }
    }
    return value;
  };
  
  // Format updates array
  const updates = updateRows.map(row => ({
    id: row.update_id,
    profile_image: row.profile_image,
    comment: row.comment,
    info_url: row.info_url,
    created_by: row.created_by,
    created_on: row.created_on
  }));

  // Format timeline array
  const timeline = timelineRows.map(row => ({
    type: {
      id: row.type_id,
      abbrev: row.type_abbrev,
      description: row.type_description
    },
    relative_time: row.relative_time
  }));

  // Format mission patches array
  const missionPatches = patchRows.map(row => parseJsonb(row.patch_data)).filter(p => p !== null);

  // Format info URLs array
  const infoUrls = infoUrlRows.map(row => ({
    priority: row.priority,
    source: row.source,
    title: row.title,
    description: row.description,
    feature_image: row.feature_image,
    url: row.url,
    type: {
      id: row.type_id,
      name: row.type_name
    },
    language: {
      id: row.language_id,
      name: row.language_name,
      code: row.language_code
    }
  }));

  // Format video URLs array
  const vidUrls = vidUrlRows.map(row => ({
    priority: row.priority,
    source: row.source,
    publisher: row.publisher,
    title: row.title,
    description: row.description,
    feature_image: row.feature_image,
    url: row.url,
    type: {
      id: row.type_id,
      name: row.type_name
    },
    language: {
      id: row.language_id,
      name: row.language_name,
      code: row.language_code
    },
    start_time: row.start_time,
    end_time: row.end_time,
    live: row.live
  }));

  // Fallback: Check mission_json for info_urls and vid_urls if not in separate tables
  const missionJson = parseJsonb(launch.mission_json);
  if (infoUrls.length === 0 && missionJson && missionJson.info_urls && Array.isArray(missionJson.info_urls)) {
    infoUrls.push(...missionJson.info_urls);
  }
  if (vidUrls.length === 0 && missionJson && missionJson.vid_urls && Array.isArray(missionJson.vid_urls)) {
    vidUrls.push(...missionJson.vid_urls);
  }

  // Prepare related data
  const relatedData = {
    payloads: payloadRows,
    recovery: recoveryRows[0] || null,
    windows: windowRows,
    hazards: hazardRows,
    crew: crewRows,
    updates: updates,
    info_urls: infoUrls,
    vid_urls: vidUrls,
    timeline: timeline,
    mission_patches: missionPatches
  };

  // Transform to Space Devs API format
  let formattedLaunch;
  try {
    formattedLaunch = formatLaunchResponse(launch, relatedData);
    
    // Log what we're sending to frontend
    console.log(`[API] Launch ${launchId}: Sending response with arrays - Updates: ${formattedLaunch.updates?.length || 0}, Timeline: ${formattedLaunch.timeline?.length || 0}, Patches: ${formattedLaunch.mission_patches?.length || 0}, Info URLs: ${formattedLaunch.info_urls?.length || 0}, Vid URLs: ${formattedLaunch.vid_urls?.length || 0}`);
    console.log(`[API] Launch ${launchId}: Has launch_service_provider: ${!!formattedLaunch.launch_service_provider}, Has rocket: ${!!formattedLaunch.rocket}, Has mission: ${!!formattedLaunch.mission}, Has pad: ${!!formattedLaunch.pad}`);
    
    // Verify transformation worked
    if (!formattedLaunch.launch_service_provider && launch.launch_service_provider_json) {
      console.warn(`[API] Launch ${launchId}: Transformation warning - launch_service_provider missing but launch_service_provider_json exists`);
    }
    
    // Add cache metadata to response
    const cacheAge = updatedAt ? Math.round((now - updatedAt) / (1000 * 60 * 60)) : null;
    const nextRefresh = updatedAt ? new Date(updatedAt.getTime() + (CACHE_DURATION_HOURS * 60 * 60 * 1000)) : null;
    
    formattedLaunch._cache = {
      cached: !shouldRefresh,
      last_updated: launch.updated_at,
      age_hours: cacheAge,
      next_refresh: nextRefresh,
      cache_duration_hours: CACHE_DURATION_HOURS
    };
    
    // Add warning if API was unavailable
    if (apiUnavailable) {
      formattedLaunch._cache.api_unavailable = true;
      formattedLaunch._warning = 'Data may be stale due to API unavailability';
    }

    res.json(formattedLaunch);
  } catch (transformError) {
    console.error('Error transforming launch response:', transformError);
    console.error('Stack:', transformError.stack);
    // Fallback: return raw data with a warning
    res.json({
      ...launch,
      payloads: relatedData.payloads || [],
      recovery: relatedData.recovery || null,
      windows: relatedData.windows || [],
      hazards: relatedData.hazards || [],
      crew: relatedData.crew || [],
      _error: 'Failed to transform response to Space Devs API format',
      _raw: true
    });
  }
}));

/**
 * POST /api/launches
 * Create a new launch (Admin/Writer only)
 */
router.post('/', authenticate, role('admin', 'writer'), asyncHandler(async (req, res) => {
  const {
    name,
    launch_date,
    provider_id,
    rocket_id,
    site_id,
    launch_pad_id,
    orbit_id,
    mission_type_id,
    outcome,
    details,
    mission_description,
    media,
    youtube_video_id,
    youtube_channel_id,
    launch_window_open,
    launch_window_close,
    is_featured
  } = req.body;

  if (!name || !launch_date) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, launch_date',
      code: 'VALIDATION_ERROR' 
    });
  }

  const { rows } = await pool.query(`
    INSERT INTO launches (
      name, launch_date, provider_id, rocket_id, site_id, launch_pad_id,
      orbit_id, mission_type_id, outcome, details, mission_description,
      media, youtube_video_id, youtube_channel_id, launch_window_open,
      launch_window_close, is_featured
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `, [
    name, launch_date, provider_id, rocket_id, site_id, launch_pad_id,
    orbit_id, mission_type_id, outcome, details, mission_description,
    JSON.stringify(media || {}), youtube_video_id, youtube_channel_id,
    launch_window_open, launch_window_close, is_featured || false
  ]);

  res.status(201).json(rows[0]);
}));

/**
 * PATCH /api/launches/:id
 * Update a launch (Admin/Writer only)
 */
router.patch('/:id', authenticate, role('admin', 'writer'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowedFields = [
    'name', 'launch_date', 'provider_id', 'rocket_id', 'site_id', 'launch_pad_id',
    'orbit_id', 'mission_type_id', 'outcome', 'details', 'mission_description',
    'media', 'youtube_video_id', 'youtube_channel_id', 'launch_window_open',
    'launch_window_close', 'is_featured'
  ];

  const updates = Object.keys(req.body).filter(key => allowedFields.includes(key));
  
  if (updates.length === 0) {
    return res.status(400).json({ 
      error: 'No valid fields to update',
      code: 'VALIDATION_ERROR' 
    });
  }

  const setClause = updates.map((field, index) => {
    if (field === 'media') {
      return `${field} = $${index + 2}::jsonb`;
    }
    return `${field} = $${index + 2}`;
  }).join(', ');

  const values = updates.map(field => {
    if (field === 'media' && typeof req.body[field] === 'object') {
      return JSON.stringify(req.body[field]);
    }
    return req.body[field];
  });
  values.unshift(id);

  const { rows } = await pool.query(
    `UPDATE launches SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Launch not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * DELETE /api/launches/:id
 * Delete a launch (Admin only)
 */
router.delete('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rowCount } = await pool.query('DELETE FROM launches WHERE id = $1', [id]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Launch not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true });
}));

module.exports = router;
