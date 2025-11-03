/**
 * Spacebase (TLPedia) Routes
 * 
 * Handles all Spacebase/TLPedia endpoints (astronauts, agencies, rockets, engines, spacecraft, facilities)
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { getPool } = require('../config/database');

const pool = getPool();

// ==================== ASTRONAUTS ====================

/**
 * GET /api/astronauts
 * Get all astronauts with filtering
 */
router.get('/astronauts', optionalAuth, asyncHandler(async (req, res) => {
  const filters = [];
  const args = [];
  let paramCount = 1;

  if (req.query.status) {
    filters.push(`astronauts.status = $${paramCount++}`);
    args.push(req.query.status);
  }

  if (req.query.nationality) {
    filters.push(`astronauts.nationality ILIKE $${paramCount++}`);
    args.push(`%${req.query.nationality}%`);
  }

  if (req.query.agency_id) {
    filters.push(`astronauts.agency_id = $${paramCount++}`);
    args.push(parseInt(req.query.agency_id));
  }

  if (req.query.search) {
    filters.push(`(
      astronauts.full_name ILIKE $${paramCount++}
      OR astronauts.first_name ILIKE $${paramCount++}
      OR astronauts.last_name ILIKE $${paramCount++}
    )`);
    const searchTerm = `%${req.query.search}%`;
    args.push(searchTerm, searchTerm, searchTerm);
  }

  let sql = `
    SELECT 
      astronauts.*,
      agencies.name as agency_name,
      agencies.abbreviation as agency_abbreviation
    FROM astronauts
    LEFT JOIN agencies ON astronauts.agency_id = agencies.id
  `;

  if (filters.length) {
    sql += ' WHERE ' + filters.join(' AND ');
  }

  sql += ' ORDER BY astronauts.full_name ASC';

  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  args.push(limit, offset);

  const { rows } = await pool.query(sql, args);

  res.json({
    data: rows,
    pagination: {
      limit,
      offset,
      has_more: rows.length === limit
    }
  });
}));

/**
 * GET /api/astronauts/:id
 * Get a single astronaut by ID with missions and achievements
 */
router.get('/astronauts/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(`
    SELECT 
      astronauts.*,
      agencies.name as agency_name,
      agencies.abbreviation as agency_abbreviation,
      agencies.country as agency_country
    FROM astronauts
    LEFT JOIN agencies ON astronauts.agency_id = agencies.id
    WHERE astronauts.id = $1
  `, [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Astronaut not found', code: 'NOT_FOUND' });
  }

  const astronaut = rows[0];

  // Get missions
  const { rows: missionRows } = await pool.query(`
    SELECT 
      launches.*,
      astronaut_missions.role,
      providers.name as provider,
      rockets.name as rocket
    FROM launches
    JOIN astronaut_missions ON launches.id = astronaut_missions.launch_id
    LEFT JOIN providers ON launches.provider_id = providers.id
    LEFT JOIN rockets ON launches.rocket_id = rockets.id
    WHERE astronaut_missions.astronaut_id = $1
    ORDER BY launches.launch_date DESC
  `, [id]);
  astronaut.missions = missionRows;

  res.json(astronaut);
}));

/**
 * GET /api/astronauts/stats
 * Get astronaut statistics
 */
router.get('/astronauts/stats', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT 
      COUNT(*) as total_astronauts,
      COUNT(*) FILTER (WHERE status = 'active') as active,
      COUNT(*) FILTER (WHERE status = 'retired') as retired,
      COUNT(*) FILTER (WHERE status = 'deceased') as deceased,
      COUNT(DISTINCT nationality) as nationalities_count,
      COUNT(DISTINCT agency_id) as agencies_count
    FROM astronauts
  `);
  res.json(rows[0]);
}));

/**
 * GET /api/astronauts/featured
 * Get featured astronaut (Astro of the Day)
 */
router.get('/astronauts/featured', optionalAuth, asyncHandler(async (req, res) => {
  // Simple implementation: get a random active astronaut
  // In production, this could be scheduled to change daily
  const { rows } = await pool.query(`
    SELECT 
      astronauts.*,
      agencies.name as agency_name
    FROM astronauts
    LEFT JOIN agencies ON astronauts.agency_id = agencies.id
    WHERE astronauts.status = 'active'
    ORDER BY RANDOM()
    LIMIT 1
  `);

  if (!rows.length) {
    return res.status(404).json({ error: 'No active astronauts found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

// ==================== AGENCIES ====================

/**
 * GET /api/agencies
 * Get all agencies
 */
router.get('/agencies', optionalAuth, asyncHandler(async (req, res) => {
  const filters = [];
  const args = [];
  let paramCount = 1;

  if (req.query.country) {
    filters.push(`agencies.country ILIKE $${paramCount++}`);
    args.push(`%${req.query.country}%`);
  }

  if (req.query.search) {
    filters.push(`(
      agencies.name ILIKE $${paramCount++}
      OR agencies.abbreviation ILIKE $${paramCount++}
    )`);
    const searchTerm = `%${req.query.search}%`;
    args.push(searchTerm, searchTerm);
  }

  let sql = 'SELECT * FROM agencies';
  if (filters.length) {
    sql += ' WHERE ' + filters.join(' AND ');
  }
  sql += ' ORDER BY agencies.name ASC';

  const { rows } = await pool.query(sql, args);
  res.json(rows);
}));

/**
 * GET /api/agencies/:id
 * Get a single agency by ID
 */
router.get('/agencies/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM agencies WHERE id = $1', [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Agency not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * POST /api/spacebase/agencies
 * Create a new agency (Admin only)
 */
router.post('/agencies', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const {
    name,
    abbreviation,
    country,
    founded_date,
    description,
    logo_url,
    website_url,
    headquarters_location,
    headquarters_coordinates,
    metadata
  } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Missing required field: name',
      code: 'VALIDATION_ERROR'
    });
  }

  const { rows } = await pool.query(`
    INSERT INTO agencies (
      name, abbreviation, country, founded_date, description,
      logo_url, website_url, headquarters_location,
      headquarters_coordinates, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
    name,
    abbreviation || null,
    country || null,
    founded_date || null,
    description || null,
    logo_url || null,
    website_url || null,
    headquarters_location || null,
    headquarters_coordinates ? JSON.stringify(headquarters_coordinates) : null,
    metadata ? JSON.stringify(metadata) : null
  ]);

  res.status(201).json(rows[0]);
}));

/**
 * PATCH /api/spacebase/agencies/:id
 * Update an agency (Admin only)
 */
router.patch('/agencies/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowedFields = [
    'name', 'abbreviation', 'country', 'founded_date', 'description',
    'logo_url', 'website_url', 'headquarters_location',
    'headquarters_coordinates', 'metadata'
  ];

  const updates = Object.keys(req.body).filter(key => allowedFields.includes(key));
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update', code: 'VALIDATION_ERROR' });
  }

  const setClause = updates.map((field, index) => {
    if (field === 'headquarters_coordinates' || field === 'metadata') {
      return `${field} = $${index + 2}::jsonb`;
    }
    return `${field} = $${index + 2}`;
  }).join(', ');

  const values = updates.map(field => {
    if ((field === 'headquarters_coordinates' || field === 'metadata') && typeof req.body[field] === 'object') {
      return JSON.stringify(req.body[field]);
    }
    return req.body[field];
  });
  values.unshift(id);

  const { rows } = await pool.query(
    `UPDATE agencies SET ${setClause} WHERE id = $1 RETURNING *`,
    values
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Agency not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * DELETE /api/spacebase/agencies/:id
 * Delete an agency (Admin only)
 */
router.delete('/agencies/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if agency exists
  const { rows: agencyRows } = await pool.query('SELECT * FROM agencies WHERE id = $1', [id]);
  
  if (!agencyRows.length) {
    return res.status(404).json({ error: 'Agency not found', code: 'NOT_FOUND' });
  }

  // Check for dependencies - astronauts
  const { rows: astronautRows } = await pool.query(
    'SELECT COUNT(*) as count FROM astronauts WHERE agency_id = $1',
    [id]
  );
  
  if (parseInt(astronautRows[0].count) > 0) {
    return res.status(400).json({
      error: 'Cannot delete agency: it is referenced by astronauts',
      code: 'DEPENDENCY_ERROR'
    });
  }

  // Check for dependencies - engines (manufacturer)
  const { rows: engineRows } = await pool.query(
    'SELECT COUNT(*) as count FROM engines WHERE manufacturer_id = $1',
    [id]
  );
  
  if (parseInt(engineRows[0].count) > 0) {
    return res.status(400).json({
      error: 'Cannot delete agency: it is referenced by engines',
      code: 'DEPENDENCY_ERROR'
    });
  }

  // Delete the agency
  const { rowCount } = await pool.query('DELETE FROM agencies WHERE id = $1', [id]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Agency not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true, id: parseInt(id) });
}));

// ==================== ROCKETS ====================

/**
 * GET /api/rockets
 * Get all rockets
 */
router.get('/rockets', optionalAuth, asyncHandler(async (req, res) => {
  const filters = [];
  const args = [];
  let paramCount = 1;

  if (req.query.provider_id) {
    filters.push(`rockets.provider_id = $${paramCount++}`);
    args.push(parseInt(req.query.provider_id));
  }

  if (req.query.search) {
    filters.push(`rockets.name ILIKE $${paramCount++}`);
    args.push(`%${req.query.search}%`);
  }

  let sql = `
    SELECT 
      rockets.*,
      providers.name as provider_name
    FROM rockets
    LEFT JOIN providers ON rockets.provider_id = providers.id
  `;

  if (filters.length) {
    sql += ' WHERE ' + filters.join(' AND ');
  }

  sql += ' ORDER BY rockets.name ASC';

  const { rows } = await pool.query(sql, args);
  res.json(rows);
}));

/**
 * GET /api/rockets/:id
 * Get a single rocket by ID with engines
 */
router.get('/rockets/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rows: rocketRows } = await pool.query(`
    SELECT 
      rockets.*,
      providers.name as provider_name
    FROM rockets
    LEFT JOIN providers ON rockets.provider_id = providers.id
    WHERE rockets.id = $1
  `, [id]);

  if (!rocketRows.length) {
    return res.status(404).json({ error: 'Rocket not found', code: 'NOT_FOUND' });
  }

  const rocket = rocketRows[0];

  // Get engines
  const { rows: engineRows } = await pool.query(`
    SELECT 
      engines.*,
      rocket_engines.stage_number,
      rocket_engines.engine_count
    FROM engines
    JOIN rocket_engines ON engines.id = rocket_engines.engine_id
    WHERE rocket_engines.rocket_id = $1
    ORDER BY rocket_engines.stage_number ASC
  `, [id]);
  rocket.engines = engineRows;

  res.json(rocket);
}));

// ==================== ENGINES ====================

/**
 * GET /api/engines
 * Get all engines
 */
router.get('/engines', optionalAuth, asyncHandler(async (req, res) => {
  const filters = [];
  const args = [];
  let paramCount = 1;

  if (req.query.manufacturer_id) {
    filters.push(`engines.manufacturer_id = $${paramCount++}`);
    args.push(parseInt(req.query.manufacturer_id));
  }

  if (req.query.engine_type) {
    filters.push(`engines.engine_type = $${paramCount++}`);
    args.push(req.query.engine_type);
  }

  if (req.query.search) {
    filters.push(`engines.name ILIKE $${paramCount++}`);
    args.push(`%${req.query.search}%`);
  }

  let sql = `
    SELECT 
      engines.*,
      agencies.name as manufacturer_name,
      agencies.abbreviation as manufacturer_abbreviation
    FROM engines
    LEFT JOIN agencies ON engines.manufacturer_id = agencies.id
  `;

  if (filters.length) {
    sql += ' WHERE ' + filters.join(' AND ');
  }

  sql += ' ORDER BY engines.name ASC';

  const { rows } = await pool.query(sql, args);
  res.json(rows);
}));

/**
 * GET /api/engines/:id
 * Get a single engine by ID
 */
router.get('/engines/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(`
    SELECT 
      engines.*,
      agencies.name as manufacturer_name,
      agencies.abbreviation as manufacturer_abbreviation
    FROM engines
    LEFT JOIN agencies ON engines.manufacturer_id = agencies.id
    WHERE engines.id = $1
  `, [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Engine not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

// ==================== SPACECRAFT ====================

/**
 * GET /api/spacecraft
 * Get all spacecraft
 */
router.get('/spacecraft', optionalAuth, asyncHandler(async (req, res) => {
  const filters = [];
  const args = [];
  let paramCount = 1;

  if (req.query.manufacturer_id) {
    filters.push(`spacecraft.manufacturer_id = $${paramCount++}`);
    args.push(parseInt(req.query.manufacturer_id));
  }

  if (req.query.spacecraft_type) {
    filters.push(`spacecraft.spacecraft_type = $${paramCount++}`);
    args.push(req.query.spacecraft_type);
  }

  if (req.query.status) {
    filters.push(`spacecraft.status = $${paramCount++}`);
    args.push(req.query.status);
  }

  if (req.query.search) {
    filters.push(`spacecraft.name ILIKE $${paramCount++}`);
    args.push(`%${req.query.search}%`);
  }

  let sql = `
    SELECT 
      spacecraft.*,
      agencies.name as manufacturer_name
    FROM spacecraft
    LEFT JOIN agencies ON spacecraft.manufacturer_id = agencies.id
  `;

  if (filters.length) {
    sql += ' WHERE ' + filters.join(' AND ');
  }

  sql += ' ORDER BY spacecraft.name ASC';

  const { rows } = await pool.query(sql, args);
  res.json(rows);
}));

/**
 * GET /api/spacecraft/:id
 * Get a single spacecraft by ID
 */
router.get('/spacecraft/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(`
    SELECT 
      spacecraft.*,
      agencies.name as manufacturer_name,
      agencies.abbreviation as manufacturer_abbreviation
    FROM spacecraft
    LEFT JOIN agencies ON spacecraft.manufacturer_id = agencies.id
    WHERE spacecraft.id = $1
  `, [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Spacecraft not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

// ==================== FACILITIES ====================

/**
 * GET /api/facilities
 * Get all facilities
 */
router.get('/facilities', optionalAuth, asyncHandler(async (req, res) => {
  const filters = [];
  const args = [];
  let paramCount = 1;

  if (req.query.agency_id) {
    filters.push(`facilities.agency_id = $${paramCount++}`);
    args.push(parseInt(req.query.agency_id));
  }

  if (req.query.facility_type) {
    filters.push(`facilities.facility_type = $${paramCount++}`);
    args.push(req.query.facility_type);
  }

  if (req.query.search) {
    filters.push(`(
      facilities.name ILIKE $${paramCount++}
      OR facilities.location ILIKE $${paramCount++}
    )`);
    const searchTerm = `%${req.query.search}%`;
    args.push(searchTerm, searchTerm);
  }

  let sql = `
    SELECT 
      facilities.*,
      agencies.name as agency_name
    FROM facilities
    LEFT JOIN agencies ON facilities.agency_id = agencies.id
  `;

  if (filters.length) {
    sql += ' WHERE ' + filters.join(' AND ');
  }

  sql += ' ORDER BY facilities.name ASC';

  const { rows } = await pool.query(sql, args);
  res.json(rows);
}));

/**
 * GET /api/facilities/:id
 * Get a single facility by ID
 */
router.get('/facilities/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(`
    SELECT 
      facilities.*,
      agencies.name as agency_name
    FROM facilities
    LEFT JOIN agencies ON facilities.agency_id = agencies.id
    WHERE facilities.id = $1
  `, [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Facility not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

module.exports = router;

