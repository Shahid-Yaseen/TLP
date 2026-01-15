/**
 * Crew Members Routes
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { getPool } = require('../config/database');

const pool = getPool();

function cleanPublicImageUrl(url) {
  if (!url || typeof url !== 'string') return url;

  let cleaned = url.trim();

  // Remove any incorrectly prepended server IP first
  // Pattern: http://IP_ADDRESShttps://domain or http://IP_ADDRESShttp://domain or http://IP_ADDRESShttps//domain
  cleaned = cleaned.replace(/^https?:\/\/[\d.]+(https?:\/\/)/, '$1');
  cleaned = cleaned.replace(/^https?:\/\/[\d.]+(https?\/\/)/, 'https://');
  cleaned = cleaned.replace(/^https?:\/\/[\d.]+(http?\/\/)/, 'http://');

  // Fix malformed protocols (https// -> https://) anywhere in the string
  cleaned = cleaned.replace(/https\/\//g, 'https://');
  cleaned = cleaned.replace(/http\/\//g, 'http://');

  // If still not an absolute URL, return as-is (it might be a relative URL)
  return cleaned;
}

/**
 * GET /api/crew
 * Get all crew members
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const filters = [];
  const args = [];
  let paramCount = 1;

  if (req.query.category) {
    filters.push(`crew_members.category = $${paramCount++}`);
    args.push(req.query.category);
  }

  if (req.query.active !== undefined) {
    filters.push(`crew_members.is_active = $${paramCount++}`);
    args.push(req.query.active === 'true');
  }

  let sql = 'SELECT * FROM crew_members';
  if (filters.length) {
    sql += ' WHERE ' + filters.join(' AND ');
  }
  sql += ' ORDER BY crew_members.category, crew_members.full_name ASC';

  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  args.push(limit, offset);

  const { rows } = await pool.query(sql, args);

  const sanitizedRows = rows.map((row) => ({
    ...row,
    profile_image_url: cleanPublicImageUrl(row.profile_image_url),
  }));

  res.json({
    data: sanitizedRows,
    pagination: {
      limit,
      offset,
      has_more: rows.length === limit
    }
  });
}));

/**
 * GET /api/crew/:id
 * Get a single crew member by ID
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM crew_members WHERE id = $1', [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Crew member not found', code: 'NOT_FOUND' });
  }

  const crewMember = rows[0];
  crewMember.profile_image_url = cleanPublicImageUrl(crewMember.profile_image_url);
  res.json(crewMember);
}));

/**
 * POST /api/crew
 * Create a new crew member (Admin only)
 */
router.post('/', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const {
    first_name,
    last_name,
    full_name,
    location,
    category,
    title,
    bio,
    profile_image_url,
    coordinates,
    metadata
  } = req.body;

  if (!first_name || !last_name || !full_name) {
    return res.status(400).json({
      error: 'Missing required fields: first_name, last_name, full_name',
      code: 'VALIDATION_ERROR'
    });
  }

  const { rows } = await pool.query(`
    INSERT INTO crew_members (
      first_name, last_name, full_name, location, category,
      title, bio, profile_image_url, coordinates, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
    first_name,
    last_name,
    full_name,
    location || null,
    category || null,
    title || null,
    bio || null,
    profile_image_url || null,
    JSON.stringify(coordinates || {}),
    JSON.stringify(metadata || {})
  ]);

  res.status(201).json(rows[0]);
}));

/**
 * PATCH /api/crew/:id
 * Update a crew member (Admin only)
 */
router.patch('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowedFields = [
    'first_name', 'last_name', 'full_name', 'location', 'category',
    'title', 'bio', 'profile_image_url', 'coordinates', 'metadata', 'is_active'
  ];

  const updates = Object.keys(req.body).filter(key => allowedFields.includes(key));
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update', code: 'VALIDATION_ERROR' });
  }

  const setClause = updates.map((field, index) => {
    if ((field === 'coordinates' || field === 'metadata') && typeof req.body[field] === 'object') {
      return `${field} = $${index + 2}::jsonb`;
    }
    return `${field} = $${index + 2}`;
  }).join(', ');

  const values = updates.map(field => {
    if ((field === 'coordinates' || field === 'metadata') && typeof req.body[field] === 'object') {
      return JSON.stringify(req.body[field]);
    }
    return req.body[field];
  });
  values.unshift(id);

  const { rows } = await pool.query(
    `UPDATE crew_members SET ${setClause} WHERE id = $1 RETURNING *`,
    values
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Crew member not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * DELETE /api/crew/:id
 * Delete a crew member (Admin only)
 */
router.delete('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query('DELETE FROM crew_members WHERE id = $1', [id]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Crew member not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true });
}));

module.exports = router;

