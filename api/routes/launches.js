/**
 * Launch Routes
 * 
 * Handles all launch-related endpoints
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { role, permission } = require('../middleware/authorize');
const { getPool } = require('../config/database');

const pool = getPool();

// Helper to build query filters
function buildFilters(query) {
  const filters = [];
  const args = [];
  let paramCount = 1;

  if (query.provider) {
    filters.push(`providers.name ILIKE $${paramCount++}`);
    args.push(`%${query.provider}%`);
  }
  if (query.rocket) {
    filters.push(`rockets.name ILIKE $${paramCount++}`);
    args.push(`%${query.rocket}%`);
  }
  if (query.site) {
    filters.push(`launch_sites.name ILIKE $${paramCount++}`);
    args.push(`%${query.site}%`);
  }
  if (query.orbit) {
    filters.push(`orbits.code ILIKE $${paramCount++}`);
    args.push(`%${query.orbit}%`);
  }
  if (query.after) {
    filters.push(`launches.launch_date >= $${paramCount++}`);
    args.push(query.after);
  }
  if (query.before) {
    filters.push(`launches.launch_date <= $${paramCount++}`);
    args.push(query.before);
  }
  if (query.status || query.outcome) {
    const status = query.status || query.outcome;
    filters.push(`launches.outcome = $${paramCount++}`);
    args.push(status);
  }
  if (query.featured === 'true') {
    filters.push(`launches.is_featured = $${paramCount++}`);
    args.push(true);
  }
  if (query.mission_type) {
    filters.push(`mission_types.name ILIKE $${paramCount++}`);
    args.push(`%${query.mission_type}%`);
  }

  return { filters, args };
}

/**
 * GET /api/launches
 * Get all launches with optional filtering
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { filters, args } = buildFilters(req.query);
  
  let sql = `
    SELECT 
      launches.*,
      providers.name as provider,
      rockets.name as rocket,
      orbits.code as orbit,
      launch_sites.name as site,
      launch_sites.country as site_country,
      launch_pads.name as pad_name,
      mission_types.name as mission_type
    FROM launches
    LEFT JOIN providers ON launches.provider_id = providers.id
    LEFT JOIN rockets ON launches.rocket_id = rockets.id
    LEFT JOIN orbits ON launches.orbit_id = orbits.id
    LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
    LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
    LEFT JOIN mission_types ON launches.mission_type_id = mission_types.id
  `;

  if (filters.length) {
    sql += ' WHERE ' + filters.join(' AND ');
  }

  sql += ' ORDER BY launches.launch_date ASC';

  // Pagination
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  sql += ` LIMIT $${args.length + 1} OFFSET $${args.length + 2}`;
  args.push(limit, offset);

  const { rows } = await pool.query(sql, args);

  // Get total count for pagination (simplified - just count launches with same filters)
  let countSql = 'SELECT COUNT(DISTINCT launches.id) as count FROM launches';
  
  // Add joins for filters that reference joined tables
  const needsJoins = filters.some(f => 
    f.includes('providers.name') || 
    f.includes('rockets.name') || 
    f.includes('launch_sites.name') || 
    f.includes('orbits.code') ||
    f.includes('launch_pads.name') ||
    f.includes('mission_types.name')
  );

  if (needsJoins) {
    countSql += `
      LEFT JOIN providers ON launches.provider_id = providers.id
      LEFT JOIN rockets ON launches.rocket_id = rockets.id
      LEFT JOIN orbits ON launches.orbit_id = orbits.id
      LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
      LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
      LEFT JOIN mission_types ON launches.mission_type_id = mission_types.id
    `;
  }

  if (filters.length) {
    countSql += ' WHERE ' + filters.join(' AND ');
  }

  const { rows: countRows } = await pool.query(
    countSql,
    args.slice(0, -2) // Remove limit and offset
  );

  res.json({
    data: rows,
    pagination: {
      total: parseInt(countRows[0].count),
      limit,
      offset,
      has_more: offset + rows.length < parseInt(countRows[0].count)
    }
  });
}));

/**
 * GET /api/launches/upcoming
 * Get upcoming launches
 */
router.get('/upcoming', optionalAuth, asyncHandler(async (req, res) => {
  req.query.after = new Date().toISOString();
  // Reuse the main GET handler
  const { filters, args } = buildFilters(req.query);
  
  let sql = `
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
    WHERE launches.launch_date >= NOW()
  `;

  if (filters.length) {
    sql += ' AND ' + filters.join(' AND ');
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
  req.query.before = new Date().toISOString();
  const { filters, args } = buildFilters(req.query);
  
  let sql = `
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
    WHERE launches.launch_date < NOW()
  `;

  if (filters.length) {
    sql += ' AND ' + filters.join(' AND ');
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
 * GET /api/launches/:id
 * Get a single launch by ID with all related data
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get launch with basic joins
  const { rows: launchRows } = await pool.query(`
    SELECT 
      launches.*,
      providers.name as provider,
      rockets.name as rocket,
      orbits.code as orbit,
      launch_sites.name as site,
      launch_sites.country as site_country,
      launch_pads.name as pad_name,
      mission_types.name as mission_type
    FROM launches
    LEFT JOIN providers ON launches.provider_id = providers.id
    LEFT JOIN rockets ON launches.rocket_id = rockets.id
    LEFT JOIN orbits ON launches.orbit_id = orbits.id
    LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
    LEFT JOIN launch_pads ON launches.launch_pad_id = launch_pads.id
    LEFT JOIN mission_types ON launches.mission_type_id = mission_types.id
    WHERE launches.id = $1
  `, [id]);

  if (!launchRows.length) {
    return res.status(404).json({ error: 'Launch not found', code: 'NOT_FOUND' });
  }

  const launch = launchRows[0];

  // Get payloads
  const { rows: payloadRows } = await pool.query(`
    SELECT payloads.*
    FROM payloads
    JOIN launch_payloads ON payloads.id = launch_payloads.payload_id
    WHERE launch_payloads.launch_id = $1
  `, [id]);
  launch.payloads = payloadRows;

  // Get recovery info
  const { rows: recoveryRows } = await pool.query(`
    SELECT * FROM recoveries WHERE launch_id = $1
  `, [id]);
  launch.recovery = recoveryRows[0] || null;

  // Get launch windows
  const { rows: windowRows } = await pool.query(`
    SELECT * FROM launch_windows WHERE launch_id = $1
  `, [id]);
  launch.windows = windowRows;

  // Get hazards
  const { rows: hazardRows } = await pool.query(`
    SELECT * FROM launch_hazards WHERE launch_id = $1
  `, [id]);
  launch.hazards = hazardRows;

  // Get crew members
  const { rows: crewRows } = await pool.query(`
    SELECT 
      astronauts.*,
      astronaut_missions.role
    FROM astronauts
    JOIN astronaut_missions ON astronauts.id = astronaut_missions.astronaut_id
    WHERE astronaut_missions.launch_id = $1
  `, [id]);
  launch.crew = crewRows;

  res.json(launch);
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

