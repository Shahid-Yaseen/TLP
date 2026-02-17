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
  if (query.ids) {
    addInFilter('launches.id', query.ids);
  }
  if (query.slug) addFilter('launches.slug', query.slug);
  const searchName = query.name || query.q || query.search;
  if (searchName) {
    // Broaden search: mission name, provider, rocket, launch site
    filters.push(`(launches.name ILIKE $${paramCount} OR providers.name ILIKE $${paramCount} OR rockets.name ILIKE $${paramCount} OR launch_sites.name ILIKE $${paramCount})`);
    args.push(`%${searchName}%`);
    paramCount++;
  }
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

  // Country filters (include launch_sites.country text for sites without country_id)
  if (query.country__id) addFilter('countries.id', parseInt(query.country__id));
  if (query.country__name) {
    filters.push(`(countries.name ILIKE $${paramCount} OR launch_sites.country ILIKE $${paramCount})`);
    args.push(`%${query.country__name}%`);
    paramCount++;
  }
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
      celestial_bodies.name as celestial_body_name,
      authors.id as author_id,
      authors.first_name as author_first_name,
      authors.last_name as author_last_name,
      authors.full_name as author_full_name,
      authors.title as author_title,
      authors.bio as author_bio,
      authors.profile_image_url as author_profile_image_url,
      authors.book_info as author_book_info
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
    LEFT JOIN authors ON launches.author_id = authors.id
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

  // Determine sort order based on whether we're filtering for upcoming or previous
  // If net__gte is present (upcoming), sort ASC (soonest first)
  // If net__lt is present (previous), sort DESC (most recent first)
  // Otherwise default to DESC (most recent first)
  const isUpcoming = req.query.net__gte !== undefined;
  const isPrevious = req.query.net__lt !== undefined;
  const sortOrder = isUpcoming ? 'ASC' : (isPrevious ? 'DESC' : 'DESC');
  sql += ` ORDER BY launches.launch_date ${sortOrder}`;

  // Pagination
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const finalSql = sql + ` LIMIT $${args.length + 1} OFFSET $${args.length + 2}`;
  const finalArgs = [...args, limit, offset];

  let rows = [];
  let apiUnavailable = false;

  try {
    // Rely on the automated cron job for data freshness.
    // Removed legacy background sync to prevent 429 rate limiting issues.

    // Always query database
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

  // If we have raw_data, use it as the base and merge with database fields
  // This ensures we have the complete detailed API response
  let rawData = parseJsonb(launchRow.raw_data);

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

  // If we have raw_data, prefer fields from it (they're the complete API response)
  // Otherwise use the individual JSONB fields
  const useRawData = rawData && typeof rawData === 'object';

  // Build status object - use raw_data if available, otherwise use individual fields
  const status = useRawData ? (rawData.status || statusJson) : (statusJson || (launchRow.status_id ? {
    id: launchRow.status_id,
    name: launchRow.status_name || null,
    abbrev: launchRow.status_abbrev || null,
    description: null
  } : null));

  // Build launch_service_provider object - use raw_data if available, otherwise use individual fields
  const launchServiceProvider = useRawData ? (rawData.launch_service_provider || rawData.lsp || launchServiceProviderJson) : (launchServiceProviderJson || (launchRow.provider_id ? {
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
  } : null));

  // Build rocket object - use raw_data if available, otherwise use individual fields
  // Ensure rocket always has a configuration property
  let rocket = useRawData ? (rawData.rocket || rocketJson) : rocketJson;
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

  // Build mission object - use raw_data if available, otherwise use individual fields
  const mission = useRawData ? (rawData.mission || missionJson) : (missionJson || (launchRow.mission_type_id ? {
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
  } : null));

  // Build pad object - use raw_data if available, otherwise use individual fields
  const pad = useRawData ? (rawData.pad || padJson) : (padJson || (launchRow.pad_id ? {
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
  } : null));

  // Build image object - use raw_data if available
  const image = useRawData ? (rawData.image || imageJson) : (imageJson || (launchRow.mission_image_url ? {
    image_url: launchRow.mission_image_url,
    thumbnail_url: null,
    credit: null,
    credit_link: null,
    license_id: null,
    license_name: null,
    license_link: null,
    single_use: null,
    variants: null
  } : null));

  // Build infographic object - use raw_data if available
  const infographic = useRawData ? (rawData.infographic || infographicJson) : (infographicJson || (launchRow.infographic_url ? {
    image_url: launchRow.infographic_url,
    thumbnail_url: null,
    credit: null,
    credit_link: null,
    license_id: null,
    license_name: null,
    license_link: null,
    single_use: null,
    variants: null
  } : null));

  // Build program array - use raw_data if available, ensure it's always an array
  let program = [];
  if (useRawData && rawData.program) {
    if (Array.isArray(rawData.program)) {
      program = rawData.program;
    } else if (typeof rawData.program === 'object') {
      program = [rawData.program];
    }
  } else if (Array.isArray(programJson)) {
    program = programJson;
  } else if (programJson && typeof programJson === 'object') {
    program = [programJson];
  }

  // Build response object matching Space Devs API format EXACTLY
  // If we have raw_data, use it as base and merge with database-specific fields
  let response;

  if (useRawData) {
    // Extract vid_urls from raw_data according to Space Devs API structure
    // In Space Devs API, vid_urls is at the top level (not in mission.vid_urls which is typically empty)
    // Priority: database table > raw_data.vid_urls (top-level) > raw_data.mission.vid_urls (fallback)
    let vidUrlsFromRaw = rawData.vid_urls || [];
    if (vidUrlsFromRaw.length === 0 && rawData.mission && rawData.mission.vid_urls && rawData.mission.vid_urls.length > 0) {
      vidUrlsFromRaw = rawData.mission.vid_urls;
    }

    // Use raw_data as base and merge with database fields and arrays
    response = {
      ...rawData, // Start with complete API response
      // Override with database-specific fields
      database_id: launchRow.id, // Include numeric database ID
      // Ensure arrays from database are included (they might be more complete)
      // Priority: database > raw_data top-level > raw_data.mission
      updates: relatedData.updates || rawData.updates || [],
      info_urls: relatedData.info_urls || rawData.info_urls || [],
      vid_urls: relatedData.vid_urls && relatedData.vid_urls.length > 0
        ? relatedData.vid_urls
        : (vidUrlsFromRaw && vidUrlsFromRaw.length > 0 ? vidUrlsFromRaw : []),
      timeline: relatedData.timeline || rawData.timeline || [],
      mission_patches: relatedData.mission_patches || rawData.mission_patches || [],
      // Additional related data from database
      payloads: relatedData.payloads || [],
      crew: relatedData.crew || [],
      hazards: relatedData.hazards || [],
      recovery: relatedData.recovery || null,
      windows: relatedData.windows || [],
      engines: relatedData.engines || [],
      related_articles: relatedData.related_articles || []
    };
  } else {
    // Fallback to building response from individual fields
    response = {
      id: launchRow.external_id || launchRow.id.toString(),
      database_id: launchRow.id, // Include numeric database ID for API calls
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
      // Ensure mission includes vid_urls if available in mission_json
      mission: missionJson ? {
        ...missionJson,
        vid_urls: missionJson.vid_urls || null
      } : mission,
      pad: padJson || pad,
      // Array fields from database
      // Video URLs: Priority is database table > mission_json (fallback, though typically empty in Space Devs API)
      updates: relatedData.updates || [],
      info_urls: relatedData.info_urls || [],
      vid_urls: relatedData.vid_urls && relatedData.vid_urls.length > 0
        ? relatedData.vid_urls
        : (missionJson && missionJson.vid_urls && Array.isArray(missionJson.vid_urls) && missionJson.vid_urls.length > 0
          ? missionJson.vid_urls
          : []),
      timeline: relatedData.timeline || [],
      mission_patches: relatedData.mission_patches || [],
      // Additional related data
      payloads: relatedData.payloads || [],
      crew: relatedData.crew || [],
      hazards: relatedData.hazards || [],
      recovery: relatedData.recovery || null,
      windows: relatedData.windows || [],
      engines: relatedData.engines || [],
      related_articles: relatedData.related_articles || []
    };
  }

  // Add author information if available
  if (launchRow.author_id || launchRow.author_full_name) {
    response.author = {
      id: launchRow.author_id || null,
      first_name: launchRow.author_first_name || null,
      last_name: launchRow.author_last_name || null,
      full_name: launchRow.author_full_name || null,
      title: launchRow.author_title || null,
      bio: launchRow.author_bio || null,
      profile_image_url: launchRow.author_profile_image_url || null,
      book_info: launchRow.author_book_info ? (typeof launchRow.author_book_info === 'string' ? JSON.parse(launchRow.author_book_info) : launchRow.author_book_info) : null
    };
  }

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

  // Determine if ID is UUID, numeric external_id, internal integer ID, or slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const isNumeric = /^\d+$/.test(id);
  const isSlug = !isUUID && !isNumeric; // If it's not UUID or numeric, treat as slug

  let launchRows = [];

  // Try to find launch by slug first (if it's not numeric or UUID)
  if (isSlug) {
    try {
      const { rows: slugRows } = await pool.query(`
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
          launch_statuses.abbrev as status_abbrev,
          authors.id as author_id,
          authors.first_name as author_first_name,
          authors.last_name as author_last_name,
          authors.full_name as author_full_name,
          authors.title as author_title,
          authors.bio as author_bio,
          authors.profile_image_url as author_profile_image_url,
          authors.book_info as author_book_info
        FROM launches
        LEFT JOIN providers ON launches.provider_id = providers.id
        LEFT JOIN rockets ON launches.rocket_id = rockets.id
        LEFT JOIN orbits ON launches.orbit_id = orbits.id
        LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
        LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
        LEFT JOIN mission_types ON launches.mission_type_id = mission_types.id
        LEFT JOIN launch_statuses ON launches.status_id = launch_statuses.id
        LEFT JOIN authors ON launches.author_id = authors.id
        WHERE launches.slug = $1
      `, [id]);
      if (slugRows.length) {
        launchRows = slugRows;
      }
    } catch (err) {
      console.log(`[API] Launch ${id}: Not found by slug, trying other methods...`);
    }
  }

  // Try to find launch by internal integer ID first (if it's numeric)
  if (!launchRows.length && isNumeric) {
    try {
      const { rows: intRows } = await pool.query(`
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
          launch_statuses.abbrev as status_abbrev,
          authors.id as author_id,
          authors.first_name as author_first_name,
          authors.last_name as author_last_name,
          authors.full_name as author_full_name,
          authors.title as author_title,
          authors.bio as author_bio,
          authors.profile_image_url as author_profile_image_url,
          authors.book_info as author_book_info
        FROM launches
        LEFT JOIN providers ON launches.provider_id = providers.id
        LEFT JOIN rockets ON launches.rocket_id = rockets.id
        LEFT JOIN orbits ON launches.orbit_id = orbits.id
        LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
        LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
        LEFT JOIN mission_types ON launches.mission_type_id = mission_types.id
        LEFT JOIN launch_statuses ON launches.status_id = launch_statuses.id
        LEFT JOIN authors ON launches.author_id = authors.id
        WHERE launches.id = $1::integer
      `, [id]);
      launchRows = intRows;
    } catch (err) {
      // If integer query fails, continue to try external_id
      console.log(`[API] Launch ${id}: Not found by internal ID, trying external_id...`);
    }
  }

  // If not found by internal ID, try external_id (UUID type in DB)
  if (!launchRows.length) {
    // Only try external_id if it looks like a UUID
    if (isUUID) {
      try {
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
            launch_statuses.abbrev as status_abbrev,
            authors.id as author_id,
            authors.first_name as author_first_name,
            authors.last_name as author_last_name,
            authors.full_name as author_full_name,
            authors.title as author_title,
            authors.bio as author_bio,
            authors.profile_image_url as author_profile_image_url,
            authors.book_info as author_book_info
          FROM launches
          LEFT JOIN providers ON launches.provider_id = providers.id
          LEFT JOIN rockets ON launches.rocket_id = rockets.id
          LEFT JOIN orbits ON launches.orbit_id = orbits.id
          LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
          LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
          LEFT JOIN mission_types ON launches.mission_type_id = mission_types.id
          LEFT JOIN launch_statuses ON launches.status_id = launch_statuses.id
          LEFT JOIN authors ON launches.author_id = authors.id
          WHERE launches.external_id = $1::uuid
        `, [id]);
        if (externalRows.length) {
          launchRows = externalRows;
        }
      } catch (err) {
        // If UUID query fails, continue to API fetch
        console.log(`[API] Launch ${id}: Not found by external_id UUID, will try API fetch...`);
      }
    }

    if (!launchRows.length) {
      return res.status(404).json({ error: 'Launch not found', code: 'NOT_FOUND' });
    }
  }

  if (!launchRows.length) {
    return res.status(404).json({ error: 'Launch not found', code: 'NOT_FOUND' });
  }

  let launch = launchRows[0];

  // Track data source for logging
  const dataSource = launch.raw_data ? 'DATABASE (raw_data)' : 'DATABASE (individual fields)';
  const hasRawData = !!launch.raw_data;

  // Use database data - no external API calls if we have raw_data
  // The raw_data contains the complete detailed API response
  if (launch.raw_data) {
    console.log(`[API] ✅ Using ${dataSource} for launch ${launch.external_id || launch.id} - NO external API call`);
    // We have complete data in raw_data, no need to fetch from external API
  } else if (launch.external_id) {
    // Only fetch from external API if we don't have raw_data and it's a new launch
    console.log(`[API] ⚠️ Using ${dataSource} for launch ${launch.external_id} - missing raw_data (older record)`);
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

  // Get hazards from database table
  const { rows: hazardRows } = await pool.query(`
    SELECT * FROM launch_hazards WHERE launch_id = $1
  `, [launchId]);

  // Extract hazards from launch object fields (weather_concerns, failreason, probability, status)
  // According to Space Devs API schema, these are the primary hazard fields
  const launchHazards = [];

  // Weather concerns
  if (launch.weather_concerns) {
    launchHazards.push({
      type: 'weather',
      description: launch.weather_concerns,
      severity: null,
      source: 'api-field'
    });
  }

  // Failure reason
  if (launch.failreason) {
    launchHazards.push({
      type: 'failure',
      description: launch.failreason,
      severity: 'high',
      source: 'api-field'
    });
  }

  // Probability (success probability - lower is more hazardous)
  if (launch.probability !== null && launch.probability !== undefined) {
    const probabilityHazard = {
      type: 'probability',
      description: `Success probability: ${launch.probability}%`,
      severity: launch.probability < 50 ? 'high' : launch.probability < 80 ? 'medium' : 'low',
      source: 'api-field',
      probability: launch.probability
    };
    launchHazards.push(probabilityHazard);
  }

  // Status-based hazards (if launch failed)
  if (launch.status_id) {
    const statusName = launch.status_name || '';
    if (statusName.toLowerCase().includes('failure') || statusName.toLowerCase().includes('fail')) {
      launchHazards.push({
        type: 'status',
        description: `Launch status: ${statusName}`,
        severity: 'high',
        source: 'api-status'
      });
    }
  }

  // Merge database hazards with launch field hazards
  const allHazards = [...launchHazards];
  if (hazardRows && hazardRows.length > 0) {
    hazardRows.forEach(hazard => {
      // Only add if not already in allHazards (by description matching)
      const existing = allHazards.find(h => h.description === hazard.description);
      if (!existing) {
        allHazards.push({
          type: hazard.type || 'unknown',
          description: hazard.description || null,
          severity: hazard.severity || null,
          source: 'database'
        });
      }
    });
  }

  // Get crew members from database
  const { rows: crewRows } = await pool.query(`
    SELECT 
      astronauts.*,
      astronaut_missions.role
    FROM astronauts
    JOIN astronaut_missions ON astronauts.id = astronaut_missions.astronaut_id
    WHERE astronaut_missions.launch_id = $1
  `, [launchId]);

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

  // Extract crew from external API response (mission JSONB or rocket JSONB)
  // Space Devs API stores crew in mission.crew or spacecraft_flight.launch_crew
  let apiCrew = [];
  const missionJson = parseJsonb(launch.mission_json);
  const rocketJson = parseJsonb(launch.rocket_json);

  if (missionJson) {
    // Check for direct crew array in mission
    if (missionJson.crew && Array.isArray(missionJson.crew)) {
      console.log(`[API] Launch ${launchId}: Found ${missionJson.crew.length} crew members in mission.crew`);
      apiCrew = missionJson.crew.map(member => ({
        id: member.id || null,
        name: member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || null,
        role: member.role || member.job || null,
        nationality: typeof member.nationality === 'string'
          ? member.nationality
          : member.nationality?.nationality_name || member.nationality?.name || null,
        date_of_birth: member.date_of_birth || null,
        flights_count: member.flights_count || member.flight_count || null,
        bio: member.bio || member.biography || null,
        wiki_url: member.wiki_url || member.wiki || null,
        profile_image: member.profile_image || member.profile_image_thumbnail || null,
        agency: member.agency || null,
        _source: 'api-mission'
      }));
    }
    // Check for crew in spacecraft_flight
    else if (missionJson.spacecraft_flight && Array.isArray(missionJson.spacecraft_flight)) {
      missionJson.spacecraft_flight.forEach(flight => {
        if (flight.launch_crew && Array.isArray(flight.launch_crew)) {
          console.log(`[API] Launch ${launchId}: Found ${flight.launch_crew.length} crew members in spacecraft_flight.launch_crew`);
          flight.launch_crew.forEach(member => {
            const crewMember = {
              id: member.id || null,
              name: member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || null,
              role: member.role || member.job || null,
              nationality: typeof member.nationality === 'string'
                ? member.nationality
                : member.nationality?.nationality_name || member.nationality?.name || null,
              date_of_birth: member.date_of_birth || null,
              flights_count: member.flights_count || member.flight_count || null,
              bio: member.bio || member.biography || null,
              wiki_url: member.wiki_url || member.wiki || null,
              profile_image: member.profile_image || member.profile_image_thumbnail || null,
              agency: member.agency || null,
              _source: 'api-spacecraft-flight'
            };
            // Only add if not already in apiCrew (by id or name)
            if (crewMember.id && !apiCrew.find(c => c.id === crewMember.id)) {
              apiCrew.push(crewMember);
            } else if (crewMember.name && !apiCrew.find(c => c.name === crewMember.name)) {
              apiCrew.push(crewMember);
            }
          });
        }
      });
    }
  }

  // PRIMARY: Crew is fetched from local database (crewRows)
  let astronautEndpointCrew = [];

  // Merge all crew sources: database > astronaut endpoint > JSONB fallback
  let allCrew = [];
  if (crewRows && crewRows.length > 0) {
    // Use database crew as primary source
    allCrew = crewRows.map(row => ({
      id: row.id || null,
      name: row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || null,
      role: row.role || null,
      nationality: row.nationality || null,
      date_of_birth: row.birth_date || null,
      flights_count: row.missions_count || null,
      bio: row.biography || null,
      wiki_url: null,
      profile_image: row.profile_image_url || null,
      agency: null,
      _source: 'database'
    }));
  }

  // Add astronaut endpoint crew (if not already in database)
  if (astronautEndpointCrew.length > 0) {
    const existingIds = new Set(allCrew.map(c => c.id).filter(Boolean));
    const existingNames = new Set(allCrew.map(c => c.name?.toLowerCase()).filter(Boolean));
    astronautEndpointCrew.forEach(member => {
      if (member.id && !existingIds.has(member.id)) {
        if (member.name && !existingNames.has(member.name.toLowerCase())) {
          allCrew.push(member);
        }
      } else if (member.name && !existingNames.has(member.name.toLowerCase())) {
        allCrew.push(member);
      }
    });
  }

  // Add JSONB crew as fallback (if not already added)
  if (apiCrew.length > 0) {
    const existingIds = new Set(allCrew.map(c => c.id).filter(Boolean));
    const existingNames = new Set(allCrew.map(c => c.name?.toLowerCase()).filter(Boolean));
    apiCrew.forEach(apiMember => {
      if (apiMember.id && !existingIds.has(apiMember.id)) {
        if (apiMember.name && !existingNames.has(apiMember.name.toLowerCase())) {
          allCrew.push(apiMember);
        }
      } else if (apiMember.name && !existingNames.has(apiMember.name.toLowerCase())) {
        allCrew.push(apiMember);
      }
    });
  }

  console.log(`[API] Launch ${launchId}: Crew summary - DB: ${crewRows.length}, Astronaut Endpoint: ${astronautEndpointCrew.length}, JSONB: ${apiCrew.length}, Total: ${allCrew.length}`);

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

  // Format video URLs array to match Space Devs API structure exactly
  // In Space Devs API: type and language are always objects (not null), priority is number, live is boolean
  const vidUrls = vidUrlRows.map(row => ({
    priority: typeof row.priority === 'number' ? row.priority : (row.priority ? parseInt(row.priority, 10) : null),
    source: row.source || null,
    publisher: row.publisher || null,
    title: row.title || null,
    description: row.description || null,
    feature_image: row.feature_image || null,
    url: row.url || null,
    type: {
      id: row.type_id || null,
      name: row.type_name || null
    },
    language: {
      id: row.language_id || null,
      name: row.language_name || null,
      code: row.language_code || null
    },
    start_time: row.start_time || null,
    end_time: row.end_time || null,
    live: typeof row.live === 'boolean' ? row.live : (row.live === true || row.live === 'true' || row.live === 1)
  }));

  // Fallback: Check mission_json for info_urls and vid_urls if not in separate tables
  // missionJson is already defined above in crew extraction
  if (infoUrls.length === 0 && missionJson && missionJson.info_urls && Array.isArray(missionJson.info_urls)) {
    infoUrls.push(...missionJson.info_urls);
  }
  if (vidUrls.length === 0 && missionJson && missionJson.vid_urls && Array.isArray(missionJson.vid_urls)) {
    vidUrls.push(...missionJson.vid_urls);
  }

  // Extract payloads from external API response (mission JSONB)
  // According to Space Devs API schema: launch.mission IS the primary payload
  // The mission object contains: id, name, type, description, orbit, agencies, vid_urls, info_urls, image
  let apiPayloads = [];
  if (missionJson) {
    console.log(`[API] Launch ${launchId}: Checking mission JSONB for payloads...`);
    console.log(`[API] Launch ${launchId}: missionJson keys:`, Object.keys(missionJson || {}));

    // PRIMARY: Extract mission object as the primary payload (this is the correct approach per API schema)
    if (missionJson.name || missionJson.id) {
      console.log(`[API] Launch ${launchId}: Found primary mission payload: ${missionJson.name || missionJson.id}`);
      const primaryPayload = {
        id: missionJson.id || null,
        name: missionJson.name || null,
        type: missionJson.type || null,
        description: missionJson.description || null,
        orbit: missionJson.orbit?.name || missionJson.orbit?.abbrev || null,
        orbit_id: missionJson.orbit?.id || null,
        agencies: missionJson.agencies || [],
        customers: missionJson.agencies?.map(a => a.name).filter(Boolean) || [],
        _source: 'api-mission-primary'
      };
      apiPayloads.push(primaryPayload);
    }

    // SECONDARY: Also check for spacecraft_flight array (for rideshare/secondary payloads)
    if (missionJson.spacecraft_flight && Array.isArray(missionJson.spacecraft_flight)) {
      console.log(`[API] Launch ${launchId}: Found ${missionJson.spacecraft_flight.length} spacecraft_flight entries (secondary payloads)`);
      missionJson.spacecraft_flight.forEach(flight => {
        if (flight.spacecraft) {
          const secondaryPayload = {
            id: flight.spacecraft?.id || null,
            name: flight.spacecraft?.name || flight.spacecraft?.configuration?.name || null,
            type: flight.spacecraft?.spacecraft_type?.name || flight.spacecraft?.spacecraft_type || null,
            mass_kg: flight.spacecraft?.mass_kg || null,
            orbit: flight.orbit?.name || flight.orbit?.abbrev || null,
            nationality: flight.spacecraft?.configuration?.manufacturer?.name || null,
            manufacturer: flight.spacecraft?.configuration?.manufacturer?.name || null,
            customers: flight.spacecraft?.configuration?.manufacturer?.name ? [flight.spacecraft.configuration.manufacturer.name] : [],
            description: flight.spacecraft?.description || flight.spacecraft?.configuration?.description || null,
            destination: flight.destination || null,
            launch_customer: flight.launch_customer || null,
            launch_crew: flight.launch_crew || null,
            landing: flight.landing || null,
            docking_events: flight.docking_events || null,
            _source: 'api-spacecraft-flight'
          };
          // Only add if not already in apiPayloads (by name matching)
          if (secondaryPayload.name && !apiPayloads.find(p => p.name === secondaryPayload.name)) {
            apiPayloads.push(secondaryPayload);
          }
        }
      });
    }
    // Also check for spacecraft as a single object (secondary payload)
    else if (missionJson.spacecraft && typeof missionJson.spacecraft === 'object' && !Array.isArray(missionJson.spacecraft)) {
      console.log(`[API] Launch ${launchId}: Found single spacecraft object (secondary payload)`);
      const spacecraft = missionJson.spacecraft;
      const secondaryPayload = {
        id: spacecraft.id || null,
        name: spacecraft.name || spacecraft.configuration?.name || null,
        type: spacecraft.spacecraft_type?.name || spacecraft.spacecraft_type || null,
        mass_kg: spacecraft.mass_kg || null,
        orbit: missionJson.orbit?.name || missionJson.orbit?.abbrev || null,
        nationality: spacecraft.configuration?.manufacturer?.name || null,
        manufacturer: spacecraft.configuration?.manufacturer?.name || null,
        customers: spacecraft.configuration?.manufacturer?.name ? [spacecraft.configuration.manufacturer.name] : [],
        description: spacecraft.description || spacecraft.configuration?.description || null,
        destination: null,
        _source: 'api-spacecraft'
      };
      // Only add if not already in apiPayloads (by name matching)
      if (secondaryPayload.name && !apiPayloads.find(p => p.name === secondaryPayload.name)) {
        apiPayloads.push(secondaryPayload);
      }
    }
    // Also check for spacecraft as an array (secondary payloads)
    else if (missionJson.spacecraft && Array.isArray(missionJson.spacecraft)) {
      console.log(`[API] Launch ${launchId}: Found ${missionJson.spacecraft.length} spacecraft entries (secondary payloads)`);
      missionJson.spacecraft.forEach(spacecraft => {
        const secondaryPayload = {
          id: spacecraft.id || null,
          name: spacecraft.name || spacecraft.configuration?.name || null,
          type: spacecraft.spacecraft_type?.name || spacecraft.spacecraft_type || null,
          mass_kg: spacecraft.mass_kg || null,
          orbit: missionJson.orbit?.name || missionJson.orbit?.abbrev || null,
          nationality: spacecraft.configuration?.manufacturer?.name || null,
          manufacturer: spacecraft.configuration?.manufacturer?.name || null,
          customers: spacecraft.configuration?.manufacturer?.name ? [spacecraft.configuration.manufacturer.name] : [],
          description: spacecraft.description || spacecraft.configuration?.description || null,
          destination: null,
          _source: 'api-spacecraft-array'
        };
        // Only add if not already in apiPayloads (by name matching)
        if (secondaryPayload.name && !apiPayloads.find(p => p.name === secondaryPayload.name)) {
          apiPayloads.push(secondaryPayload);
        }
      });
    }
    // Also check for direct payloads array (some API versions - secondary payloads)
    if (missionJson.payloads && Array.isArray(missionJson.payloads)) {
      console.log(`[API] Launch ${launchId}: Found ${missionJson.payloads.length} direct payloads (secondary payloads)`);
      missionJson.payloads.forEach(payload => {
        const secondaryPayload = {
          id: payload.id || null,
          name: payload.name || null,
          type: payload.type || null,
          mass_kg: payload.mass_kg || null,
          orbit: payload.orbit?.name || payload.orbit?.abbrev || payload.orbit || null,
          nationality: payload.nationality || null,
          manufacturer: payload.manufacturer?.name || payload.manufacturer || null,
          customers: payload.customers || (payload.customer ? [payload.customer] : []),
          description: payload.description || null,
          destination: payload.destination || null,
          _source: 'api-payloads-array'
        };
        // Only add if not already in apiPayloads (by name matching)
        if (secondaryPayload.name && !apiPayloads.find(p => p.name === secondaryPayload.name)) {
          apiPayloads.push(secondaryPayload);
        }
      });
    }
  } else {
    console.log(`[API] Launch ${launchId}: No mission JSONB available`);
  }

  // Also check rocket JSONB for payloads (sometimes stored there)
  // rocketJson is already defined above in crew extraction
  if (rocketJson && rocketJson.spacecraft_stage && Array.isArray(rocketJson.spacecraft_stage)) {
    console.log(`[API] Launch ${launchId}: Found ${rocketJson.spacecraft_stage.length} spacecraft_stage entries in rocket JSONB`);
    rocketJson.spacecraft_stage.forEach(stage => {
      if (stage.spacecraft) {
        const payload = {
          id: stage.spacecraft.id || null,
          name: stage.spacecraft.name || stage.spacecraft.configuration?.name || null,
          type: stage.spacecraft.spacecraft_type?.name || stage.spacecraft.spacecraft_type || null,
          mass_kg: stage.spacecraft.mass_kg || null,
          orbit: null,
          nationality: stage.spacecraft.configuration?.manufacturer?.name || null,
          manufacturer: stage.spacecraft.configuration?.manufacturer?.name || null,
          customers: stage.spacecraft.configuration?.manufacturer?.name ? [stage.spacecraft.configuration.manufacturer.name] : [],
          description: stage.spacecraft.description || stage.spacecraft.configuration?.description || null,
          _source: 'api-rocket'
        };
        // Only add if not already in apiPayloads
        if (payload.name && !apiPayloads.find(p => p.name === payload.name)) {
          apiPayloads.push(payload);
        }
      }
    });
  }

  // Merge database payloads with API payloads
  // If database has payloads, use those; otherwise use API payloads
  // If both exist, prefer database but add API ones that aren't in database
  let allPayloads = [];
  if (payloadRows && payloadRows.length > 0) {
    // Use database payloads as primary source
    allPayloads = payloadRows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.payload_type,
      mass_kg: row.payload_mass_kg,
      mass_lb: row.payload_mass_lb,
      orbit: row.destination_orbit,
      nationality: null,
      manufacturer: null,
      customers: row.customer ? [row.customer] : [],
      description: row.description,
      _source: 'database'
    }));

    // Add API payloads that don't exist in database (by name matching)
    const dbPayloadNames = new Set(allPayloads.map(p => p.name?.toLowerCase()));
    apiPayloads.forEach(apiPayload => {
      if (apiPayload.name && !dbPayloadNames.has(apiPayload.name.toLowerCase())) {
        allPayloads.push(apiPayload);
      }
    });
  } else {
    // No database payloads, use API payloads
    allPayloads = apiPayloads;
  }

  // Log payload information
  console.log(`[API] Launch ${launchId}: Payload summary - DB: ${payloadRows.length}, API: ${apiPayloads.length}, Total: ${allPayloads.length}`);
  if (allPayloads.length > 0) {
    console.log(`[API] Launch ${launchId}: Sample payload:`, JSON.stringify(allPayloads[0], null, 2));
  }

  // Extract engine data from rocket configuration
  // PRIMARY: Fetch from rocket.configuration.url (correct API-native approach per Space Devs schema)
  // Extract engine data from multiple possible sources
  let engineData = [];

  // Helper function to extract engines from a launcher_stage array
  const extractEnginesFromStages = (stages, source) => {
    if (!stages || !Array.isArray(stages)) return [];

    const extracted = [];
    stages.forEach((stage, stageIdx) => {
      if (stage.engines && Array.isArray(stage.engines)) {
        stage.engines.forEach(engine => {
          extracted.push({
            stage: stageIdx + 1,
            stage_type: stage.type || `Stage ${stageIdx + 1}`,
            reusable: stage.reusable || false,
            engine_id: engine.id || null,
            engine_name: engine.name || null,
            engine_type: engine.type || null,
            engine_configuration: engine.configuration || null,
            engine_layout: engine.layout || null,
            engine_version: engine.version || null,
            isp_sea_level: engine.isp?.sea_level || null,
            isp_vacuum: engine.isp?.vacuum || null,
            thrust_sea_level_kn: engine.thrust_sea_level?.kn || engine.thrust_sea_level || null,
            thrust_vacuum_kn: engine.thrust_vacuum?.kn || engine.thrust_vacuum || null,
            number_of_engines: engine.number_of_engines || stage.engines.length || null,
            propellant_1: engine.propellant_1 || null,
            propellant_2: engine.propellant_2 || null,
            engine_loss_max: engine.engine_loss_max || null,
            stage_thrust_kn: stage.thrust?.kn || stage.thrust || null,
            stage_fuel_amount_tons: stage.fuel_amount_tons || null,
            stage_burn_time_sec: stage.burn_time_sec || null,
            _source: source
          });
        });
      }
    });
    return extracted;
  };

  // METHOD 1: DISABLED - Don't fetch from configuration URL (causes 404 errors)
  // Using only database JSONB data instead
  // if (rocketJson && rocketJson.configuration && rocketJson.configuration.url) {
  //   try {
  //     console.log(`[API] Launch ${launchId}: Fetching engine data from configuration URL: ${rocketJson.configuration.url}`);
  //     const configData = await spaceDevsApi.fetchLauncherConfiguration(rocketJson.configuration.url);
  //     
  //     if (configData && configData.launcher_stage && Array.isArray(configData.launcher_stage)) {
  //       console.log(`[API] Launch ${launchId}: Found ${configData.launcher_stage.length} launcher_stage entries in configuration`);
  //       engineData = extractEnginesFromStages(configData.launcher_stage, 'api-configuration-url');
  //     }
  //   } catch (error) {
  //     console.error(`[API] Launch ${launchId}: Error fetching configuration from URL:`, error.message);
  //     // Fall through to JSONB extraction
  //   }
  // }

  // METHOD 1 (NEW): Extract from rocket.configuration.launcher_stage (if nested in configuration)
  if (engineData.length === 0 && rocketJson) {
    const configLauncherStage = rocketJson.configuration?.launcher_stage || null;
    if (configLauncherStage && Array.isArray(configLauncherStage)) {
      console.log(`[API] Launch ${launchId}: Found ${configLauncherStage.length} launcher_stage entries in rocket.configuration`);
      engineData = extractEnginesFromStages(configLauncherStage, 'api-rocket-configuration-jsonb');
    }
  }

  // METHOD 2: Extract from rocket.launcher_stage (direct in rocket object)
  if (engineData.length === 0 && rocketJson) {
    if (rocketJson.launcher_stage && Array.isArray(rocketJson.launcher_stage)) {
      console.log(`[API] Launch ${launchId}: Found ${rocketJson.launcher_stage.length} launcher_stage entries in rocket JSONB`);
      engineData = extractEnginesFromStages(rocketJson.launcher_stage, 'api-rocket-jsonb');
    }
  }

  // Log detailed information for debugging
  if (engineData.length === 0 && rocketJson) {
    console.log(`[API] Launch ${launchId}: No engines found. Rocket JSONB structure:`, {
      hasRocket: !!rocketJson,
      hasConfiguration: !!rocketJson.configuration,
      hasConfigurationUrl: !!(rocketJson.configuration?.url),
      hasConfigurationLauncherStage: !!(rocketJson.configuration?.launcher_stage),
      hasLauncherStage: !!rocketJson.launcher_stage,
      rocketKeys: Object.keys(rocketJson || {}),
      configurationKeys: Object.keys(rocketJson.configuration || {})
    });
  }

  console.log(`[API] Launch ${launchId}: Engine data - Found ${engineData.length} engines`);

  // Get related articles (admin-managed)
  const { rows: relatedArticleRows } = await pool.query(`
    SELECT 
      na.id,
      na.title,
      na.slug,
      na.hero_image_url,
      na.featured_image_url,
      na.subtitle,
      na.excerpt,
      na.published_at,
      na.status,
      lra.display_order
    FROM launch_related_articles lra
    JOIN news_articles na ON lra.article_id = na.id
    WHERE lra.launch_id = $1
      AND na.status = 'published'
    ORDER BY lra.display_order ASC, na.published_at DESC
  `, [launchId]);

  const relatedArticles = relatedArticleRows.map(row => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    hero_image_url: row.hero_image_url,
    featured_image_url: row.featured_image_url,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    published_at: row.published_at,
    status: row.status
  }));

  // Prepare related data
  const relatedData = {
    payloads: allPayloads,
    recovery: recoveryRows[0] || null,
    windows: windowRows,
    hazards: allHazards, // Now includes launch field hazards + database hazards
    crew: allCrew,
    engines: engineData,
    updates: updates,
    info_urls: infoUrls,
    vid_urls: vidUrls,
    timeline: timeline,
    mission_patches: missionPatches,
    related_articles: relatedArticles
  };

  // Transform to Space Devs API format
  let formattedLaunch;
  try {
    formattedLaunch = formatLaunchResponse(launch, relatedData);

    // Log what we're sending to frontend
    console.log(`[API] Launch ${launchId}: Sending response with arrays - Updates: ${formattedLaunch.updates?.length || 0}, Timeline: ${formattedLaunch.timeline?.length || 0}, Patches: ${formattedLaunch.mission_patches?.length || 0}, Info URLs: ${formattedLaunch.info_urls?.length || 0}, Vid URLs: ${formattedLaunch.vid_urls?.length || 0}`);
    console.log(`[API] Launch ${launchId}: Has launch_service_provider: ${!!formattedLaunch.launch_service_provider}, Has rocket: ${!!formattedLaunch.rocket}, Has mission: ${!!formattedLaunch.mission}, Has pad: ${!!formattedLaunch.pad}`);
    console.log(`[API] Launch ${launchId}: Payloads in response: ${formattedLaunch.payloads?.length || 0}`);
    console.log(`[API] Launch ${launchId}: Engines in response: ${formattedLaunch.engines?.length || 0}, Engines type: ${Array.isArray(formattedLaunch.engines) ? 'Array' : typeof formattedLaunch.engines}`);
    if (formattedLaunch.engines && formattedLaunch.engines.length > 0) {
      console.log(`[API] Launch ${launchId}: First engine sample:`, JSON.stringify(formattedLaunch.engines[0], null, 2));
    }
    console.log(`[API] Launch ${launchId}: Payloads type: ${Array.isArray(formattedLaunch.payloads) ? 'Array' : typeof formattedLaunch.payloads}`);
    if (formattedLaunch.payloads && formattedLaunch.payloads.length > 0) {
      console.log(`[API] Launch ${launchId}: First payload in response:`, JSON.stringify(formattedLaunch.payloads[0], null, 2));
    } else {
      console.log(`[API] Launch ${launchId}: No payloads in response. relatedData.payloads:`, relatedData.payloads?.length || 0);
      console.log(`[API] Launch ${launchId}: allPayloads length:`, allPayloads?.length || 0);
      if (allPayloads && allPayloads.length > 0) {
        console.log(`[API] Launch ${launchId}: Sample allPayloads[0]:`, JSON.stringify(allPayloads[0], null, 2));
      }
    }

    // Verify transformation worked
    if (!formattedLaunch.launch_service_provider && launch.launch_service_provider_json) {
      console.warn(`[API] Launch ${launchId}: Transformation warning - launch_service_provider missing but launch_service_provider_json exists`);
    }

    // Add cache metadata to response - track data source
    const now = new Date();
    const updatedAt = launch.updated_at ? new Date(launch.updated_at) : null;
    const cacheAge = updatedAt ? Math.round((now - updatedAt) / (1000 * 60 * 60)) : null;

    formattedLaunch._cache = {
      cached: true, // Always true since we're using database
      data_source: hasRawData ? 'database_raw_data' : 'database_individual_fields',
      last_updated: launch.updated_at,
      age_hours: cacheAge,
      source: dataSource // Track where data came from
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
    is_featured,
    author_id
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
      launch_window_close, is_featured, author_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *
  `, [
    name, launch_date, provider_id, rocket_id, site_id, launch_pad_id,
    orbit_id, mission_type_id, outcome, details, mission_description,
    JSON.stringify(media || {}), youtube_video_id, youtube_channel_id,
    launch_window_open, launch_window_close, is_featured || false, author_id || null
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
    'launch_window_close', 'is_featured', 'author_id'
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

/**
 * GET /api/launches/:id/comments
 * Get all comments for a launch (with nested replies)
 */
router.get('/:id/comments', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sort = 'newest', approved = 'true', limit = 100, offset = 0 } = req.query;
  const userId = req.user?.id || null;

  // Verify launch exists
  const { rows: launchRows } = await pool.query('SELECT id FROM launches WHERE id = $1', [id]);
  if (!launchRows.length) {
    return res.status(404).json({ error: 'Launch not found', code: 'NOT_FOUND' });
  }

  try {
    // Build query for top-level comments (no parent)
    let orderClause = '';
    switch (sort) {
      case 'oldest':
        orderClause = 'ORDER BY c.created_at ASC';
        break;
      case 'best':
        // Best = most likes + recency (weighted)
        orderClause = `ORDER BY 
          (COALESCE(like_counts.like_count, 0) * 10 + 
           EXTRACT(EPOCH FROM (NOW() - c.created_at)) / 3600) DESC`;
        break;
      case 'newest':
      default:
        orderClause = 'ORDER BY c.created_at DESC';
        break;
    }

    const approvedFilter = approved === 'true' ? 'AND c.is_approved = true' : '';

    // Get top-level comments with like counts
    // Build query differently based on whether user is logged in
    let comments;
    if (userId) {
      // User is logged in - include user_likes check
      const { rows } = await pool.query(`
        SELECT 
          c.id,
          c.content,
          c.parent_comment_id,
          c.is_approved,
          c.created_at,
          c.updated_at,
          u.id as user_id,
          u.username,
          u.email,
          u.profile_image_url,
          COALESCE(like_counts.like_count, 0) as like_count,
          CASE WHEN user_likes.user_id IS NOT NULL THEN true ELSE false END as user_liked
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN (
          SELECT comment_id, COUNT(*) as like_count
          FROM comment_likes
          GROUP BY comment_id
        ) like_counts ON c.id = like_counts.comment_id
        LEFT JOIN (
          SELECT comment_id, user_id
          FROM comment_likes
          WHERE user_id = $1
        ) user_likes ON c.id = user_likes.comment_id
        WHERE c.launch_id = $2 
          AND c.parent_comment_id IS NULL
          ${approvedFilter}
        ${orderClause}
        LIMIT $3 OFFSET $4
      `, [userId, id, parseInt(limit), parseInt(offset)]);
      comments = rows;
    } else {
      // User is not logged in - no user_likes check needed
      const { rows } = await pool.query(`
        SELECT 
          c.id,
          c.content,
          c.parent_comment_id,
          c.is_approved,
          c.created_at,
          c.updated_at,
          u.id as user_id,
          u.username,
          u.email,
          u.profile_image_url,
          COALESCE(like_counts.like_count, 0) as like_count,
          false as user_liked
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN (
          SELECT comment_id, COUNT(*) as like_count
          FROM comment_likes
          GROUP BY comment_id
        ) like_counts ON c.id = like_counts.comment_id
        WHERE c.launch_id = $1 
          AND c.parent_comment_id IS NULL
          ${approvedFilter}
        ${orderClause}
        LIMIT $2 OFFSET $3
      `, [id, parseInt(limit), parseInt(offset)]);
      comments = rows;
    }

    // Get nested replies for each comment
    const commentIds = comments.map(c => c.id);
    let replies = [];
    if (commentIds.length > 0) {
      if (userId) {
        // User is logged in - include user_likes check
        const { rows: replyRows } = await pool.query(`
          SELECT 
            c.id,
            c.content,
            c.parent_comment_id,
            c.is_approved,
            c.created_at,
            c.updated_at,
            u.id as user_id,
            u.username,
            u.email,
            u.profile_image_url,
            COALESCE(like_counts.like_count, 0) as like_count,
            CASE WHEN user_likes.user_id IS NOT NULL THEN true ELSE false END as user_liked
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          LEFT JOIN (
            SELECT comment_id, COUNT(*) as like_count
            FROM comment_likes
            GROUP BY comment_id
          ) like_counts ON c.id = like_counts.comment_id
          LEFT JOIN (
            SELECT comment_id, user_id
            FROM comment_likes
            WHERE user_id = $1
          ) user_likes ON c.id = user_likes.comment_id
          WHERE c.launch_id = $2 
            AND c.parent_comment_id = ANY($3::int[])
            ${approvedFilter}
          ORDER BY c.created_at ASC
        `, [userId, id, commentIds]);
        replies = replyRows;
      } else {
        // User is not logged in - no user_likes check needed
        const { rows: replyRows } = await pool.query(`
          SELECT 
            c.id,
            c.content,
            c.parent_comment_id,
            c.is_approved,
            c.created_at,
            c.updated_at,
            u.id as user_id,
            u.username,
            u.email,
            u.profile_image_url,
            COALESCE(like_counts.like_count, 0) as like_count,
            false as user_liked
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          LEFT JOIN (
            SELECT comment_id, COUNT(*) as like_count
            FROM comment_likes
            GROUP BY comment_id
          ) like_counts ON c.id = like_counts.comment_id
          WHERE c.launch_id = $1 
            AND c.parent_comment_id = ANY($2::int[])
            ${approvedFilter}
          ORDER BY c.created_at ASC
        `, [id, commentIds]);
        replies = replyRows;
      }
    }

    // Organize replies under their parent comments
    const repliesByParent = {};
    replies.forEach(reply => {
      if (!repliesByParent[reply.parent_comment_id]) {
        repliesByParent[reply.parent_comment_id] = [];
      }
      repliesByParent[reply.parent_comment_id].push(reply);
    });

    // Attach replies to comments
    const commentsWithReplies = comments.map(comment => ({
      ...comment,
      replies: repliesByParent[comment.id] || []
    }));

    // Get total count
    const { rows: countRows } = await pool.query(`
      SELECT COUNT(*) as count
      FROM comments c
      WHERE c.launch_id = $1 AND c.parent_comment_id IS NULL ${approvedFilter}
    `, [id]);

    res.json({
      comments: commentsWithReplies,
      total: parseInt(countRows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('[Comments] Error fetching comments:', error);
    throw error; // Let asyncHandler catch it
  }
}));

/**
 * POST /api/launches/:id/comments
 * Create a new comment (requires authentication)
 */
router.post('/:id/comments', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, parent_comment_id } = req.body;
  const userId = req.user.id;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      error: 'Comment content is required',
      code: 'VALIDATION_ERROR'
    });
  }

  if (content.length > 5000) {
    return res.status(400).json({
      error: 'Comment content must be less than 5000 characters',
      code: 'VALIDATION_ERROR'
    });
  }

  // Verify launch exists
  const { rows: launchRows } = await pool.query('SELECT id FROM launches WHERE id = $1', [id]);
  if (!launchRows.length) {
    return res.status(404).json({ error: 'Launch not found', code: 'NOT_FOUND' });
  }

  // If parent_comment_id is provided, verify it exists and belongs to this launch
  if (parent_comment_id) {
    const { rows: parentRows } = await pool.query(
      'SELECT id FROM comments WHERE id = $1 AND launch_id = $2',
      [parent_comment_id, id]
    );
    if (!parentRows.length) {
      return res.status(404).json({
        error: 'Parent comment not found',
        code: 'NOT_FOUND'
      });
    }
  }

  // Check email verification - users must verify their email before commenting
  if (!req.user.email_verified) {
    return res.status(403).json({
      error: 'Please verify your email address before commenting. Check your inbox for the verification code.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  // Insert comment (auto-approve all comments - no moderation required)
  const isApproved = true;

  const { rows } = await pool.query(`
    INSERT INTO comments (launch_id, user_id, parent_comment_id, content, is_approved, email_verified)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, content, parent_comment_id, is_approved, created_at, updated_at
  `, [id, userId, parent_comment_id || null, content.trim(), isApproved, req.user.email_verified || false]);

  const comment = rows[0];

  // Fetch full comment with user info
  const { rows: fullCommentRows } = await pool.query(`
    SELECT 
      c.id,
      c.content,
      c.parent_comment_id,
      c.is_approved,
      c.created_at,
      c.updated_at,
      u.id as user_id,
      u.username,
      u.email,
      u.profile_image_url,
      0 as like_count,
      false as user_liked
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = $1
  `, [comment.id]);

  res.status(201).json(fullCommentRows[0]);
}));

/**
 * PATCH /api/comments/:id
 * Update own comment (owner or moderator/admin)
 */
router.patch('/comments/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      error: 'Comment content is required',
      code: 'VALIDATION_ERROR'
    });
  }

  if (content.length > 5000) {
    return res.status(400).json({
      error: 'Comment content must be less than 5000 characters',
      code: 'VALIDATION_ERROR'
    });
  }

  // Check if user is moderator or admin
  const { rows: roleRows } = await pool.query(
    `SELECT r.name FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [userId]
  );
  const userRoles = roleRows.map(r => r.name);
  const isModerator = userRoles.includes('moderator') || userRoles.includes('admin');

  // Get comment and verify ownership or moderator status
  const { rows: commentRows } = await pool.query(
    'SELECT id, user_id FROM comments WHERE id = $1',
    [id]
  );

  if (!commentRows.length) {
    return res.status(404).json({ error: 'Comment not found', code: 'NOT_FOUND' });
  }

  const comment = commentRows[0];
  if (comment.user_id !== userId && !isModerator) {
    return res.status(403).json({
      error: 'You do not have permission to edit this comment',
      code: 'FORBIDDEN'
    });
  }

  // Update comment
  const { rows: updatedRows } = await pool.query(`
    UPDATE comments 
    SET content = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, content, parent_comment_id, is_approved, created_at, updated_at
  `, [content.trim(), id]);

  // Fetch full comment with user info
  const { rows: fullCommentRows } = await pool.query(`
    SELECT 
      c.id,
      c.content,
      c.parent_comment_id,
      c.is_approved,
      c.created_at,
      c.updated_at,
      u.id as user_id,
      u.username,
      u.email,
      u.profile_image_url,
      COALESCE(like_counts.like_count, 0) as like_count,
      CASE WHEN user_likes.user_id IS NOT NULL THEN true ELSE false END as user_liked
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN (
      SELECT comment_id, COUNT(*) as like_count
      FROM comment_likes
      GROUP BY comment_id
    ) like_counts ON c.id = like_counts.comment_id
    LEFT JOIN (
      SELECT comment_id, user_id
      FROM comment_likes
      ${userId ? 'WHERE user_id = $1' : 'WHERE FALSE'}
    ) user_likes ON c.id = user_likes.comment_id
    WHERE c.id = $2
  `, [userId, id]);

  res.json(fullCommentRows[0]);
}));

/**
 * DELETE /api/comments/:id
 * Delete comment (owner, moderator, or admin)
 */
router.delete('/comments/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if user is moderator or admin
  const { rows: roleRows } = await pool.query(
    `SELECT r.name FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [userId]
  );
  const userRoles = roleRows.map(r => r.name);
  const isModerator = userRoles.includes('moderator') || userRoles.includes('admin');

  // Get comment and verify ownership or moderator status
  const { rows: commentRows } = await pool.query(
    'SELECT id, user_id FROM comments WHERE id = $1',
    [id]
  );

  if (!commentRows.length) {
    return res.status(404).json({ error: 'Comment not found', code: 'NOT_FOUND' });
  }

  const comment = commentRows[0];
  if (comment.user_id !== userId && !isModerator) {
    return res.status(403).json({
      error: 'You do not have permission to delete this comment',
      code: 'FORBIDDEN'
    });
  }

  // Delete comment (CASCADE will handle replies and likes)
  await pool.query('DELETE FROM comments WHERE id = $1', [id]);

  res.json({ deleted: true });
}));

/**
 * POST /api/comments/:id/like
 * Like or unlike a comment
 */
router.post('/comments/:id/like', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Verify comment exists
  const { rows: commentRows } = await pool.query('SELECT id FROM comments WHERE id = $1', [id]);
  if (!commentRows.length) {
    return res.status(404).json({ error: 'Comment not found', code: 'NOT_FOUND' });
  }

  // Check if user already liked this comment
  const { rows: likeRows } = await pool.query(
    'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (likeRows.length > 0) {
    // Unlike: remove the like
    await pool.query(
      'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [id, userId]
    );
    res.json({ liked: false });
  } else {
    // Like: add the like
    await pool.query(
      'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, userId]
    );
    res.json({ liked: true });
  }
}));

/**
 * GET /api/launches/:id/related-articles
 * Get related articles for a launch (admin)
 */
router.get('/:id/related-articles', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const launchId = parseInt(id);

  if (isNaN(launchId)) {
    return res.status(400).json({ error: 'Invalid launch ID' });
  }

  const { rows } = await pool.query(`
    SELECT 
      lra.id,
      lra.launch_id,
      lra.article_id,
      lra.display_order,
      na.id as article_id,
      na.title,
      na.slug,
      na.hero_image_url,
      na.featured_image_url,
      na.status,
      na.published_at
    FROM launch_related_articles lra
    JOIN news_articles na ON lra.article_id = na.id
    WHERE lra.launch_id = $1
    ORDER BY lra.display_order ASC, na.published_at DESC
  `, [launchId]);

  res.json(rows);
}));

/**
 * POST /api/launches/:id/related-articles
 * Add a related article to a launch (admin)
 */
router.post('/:id/related-articles', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { article_id, display_order } = req.body;
  const launchId = parseInt(id);

  if (isNaN(launchId)) {
    return res.status(400).json({ error: 'Invalid launch ID' });
  }

  if (!article_id) {
    return res.status(400).json({ error: 'article_id is required' });
  }

  // Check if launch exists
  const { rows: launchRows } = await pool.query('SELECT id FROM launches WHERE id = $1', [launchId]);
  if (!launchRows.length) {
    return res.status(404).json({ error: 'Launch not found' });
  }

  // Check if article exists
  const { rows: articleRows } = await pool.query('SELECT id FROM news_articles WHERE id = $1', [article_id]);
  if (!articleRows.length) {
    return res.status(404).json({ error: 'Article not found' });
  }

  // Check if relationship already exists
  const { rows: existingRows } = await pool.query(
    'SELECT id FROM launch_related_articles WHERE launch_id = $1 AND article_id = $2',
    [launchId, article_id]
  );

  if (existingRows.length > 0) {
    return res.status(409).json({ error: 'Article is already related to this launch' });
  }

  // Get max display_order if not provided
  let order = display_order;
  if (order === undefined || order === null) {
    const { rows: maxOrderRows } = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM launch_related_articles WHERE launch_id = $1',
      [launchId]
    );
    order = maxOrderRows[0].next_order;
  }

  const { rows } = await pool.query(`
    INSERT INTO launch_related_articles (launch_id, article_id, display_order, updated_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING *
  `, [launchId, article_id, order]);

  res.status(201).json(rows[0]);
}));

/**
 * DELETE /api/launches/:id/related-articles/:articleId
 * Remove a related article from a launch (admin)
 */
router.delete('/:id/related-articles/:articleId', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id, articleId } = req.params;
  const launchId = parseInt(id);
  const articleIdNum = parseInt(articleId);

  if (isNaN(launchId) || isNaN(articleIdNum)) {
    return res.status(400).json({ error: 'Invalid launch ID or article ID' });
  }

  const { rows } = await pool.query(
    'DELETE FROM launch_related_articles WHERE launch_id = $1 AND article_id = $2 RETURNING *',
    [launchId, articleIdNum]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Related article relationship not found' });
  }

  res.json({ message: 'Related article removed', data: rows[0] });
}));

/**
 * PUT /api/launches/:id/related-articles/:articleId
 * Update display order of a related article (admin)
 */
router.put('/:id/related-articles/:articleId', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id, articleId } = req.params;
  const { display_order } = req.body;
  const launchId = parseInt(id);
  const articleIdNum = parseInt(articleId);

  if (isNaN(launchId) || isNaN(articleIdNum)) {
    return res.status(400).json({ error: 'Invalid launch ID or article ID' });
  }

  if (display_order === undefined || display_order === null) {
    return res.status(400).json({ error: 'display_order is required' });
  }

  const { rows } = await pool.query(`
    UPDATE launch_related_articles 
    SET display_order = $1, updated_at = NOW()
    WHERE launch_id = $2 AND article_id = $3
    RETURNING *
  `, [display_order, launchId, articleIdNum]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Related article relationship not found' });
  }

  res.json(rows[0]);
}));

module.exports = router;
