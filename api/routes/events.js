/**
 * Events Routes
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { getPool } = require('../config/database');

const pool = getPool();

/**
 * GET /api/events
 * Get all events
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const filters = [];
  const args = [];
  let paramCount = 1;

  if (req.query.event_type) {
    filters.push(`events.event_type = $${paramCount++}`);
    args.push(req.query.event_type);
  }

  if (req.query.status) {
    filters.push(`events.status = $${paramCount++}`);
    args.push(req.query.status);
  }

  if (req.query.date_from) {
    filters.push(`events.event_date >= $${paramCount++}`);
    args.push(req.query.date_from);
  }

  if (req.query.date_to) {
    filters.push(`events.event_date <= $${paramCount++}`);
    args.push(req.query.date_to);
  }

  if (req.query.related_launch_id) {
    filters.push(`events.related_launch_id = $${paramCount++}`);
    args.push(parseInt(req.query.related_launch_id));
  }

  let sql = 'SELECT * FROM events';
  if (filters.length) {
    sql += ' WHERE ' + filters.join(' AND ');
  }
  sql += ' ORDER BY events.event_date DESC';

  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  args.push(limit, offset);

  const { rows } = await pool.query(sql, args);
  res.json(rows);
}));

/**
 * GET /api/events/:id
 * Get a single event by ID
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Event not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * POST /api/events
 * Create a new event (Admin/Writer only)
 */
router.post('/', authenticate, role('admin', 'writer'), asyncHandler(async (req, res) => {
  const {
    name,
    event_type,
    status,
    event_date,
    end_date,
    location,
    description,
    related_launch_id,
    media
  } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Missing required field: name',
      code: 'VALIDATION_ERROR'
    });
  }

  const { rows } = await pool.query(`
    INSERT INTO events (
      name, event_type, status, event_date, end_date,
      location, description, related_launch_id, media
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    name,
    event_type || null,
    status || 'TBD',
    event_date || null,
    end_date || null,
    location || null,
    description || null,
    related_launch_id || null,
    JSON.stringify(media || {})
  ]);

  res.status(201).json(rows[0]);
}));

/**
 * PATCH /api/events/:id
 * Update an event (Admin/Writer only)
 */
router.patch('/:id', authenticate, role('admin', 'writer'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowedFields = [
    'name', 'event_type', 'status', 'event_date', 'end_date',
    'location', 'description', 'related_launch_id', 'media'
  ];

  const updates = Object.keys(req.body).filter(key => allowedFields.includes(key));
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update', code: 'VALIDATION_ERROR' });
  }

  const setClause = updates.map((field, index) => {
    if (field === 'media' && typeof req.body[field] === 'object') {
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
    `UPDATE events SET ${setClause} WHERE id = $1 RETURNING *`,
    values
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Event not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * DELETE /api/events/:id
 * Delete an event (Admin only)
 */
router.delete('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query('DELETE FROM events WHERE id = $1', [id]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Event not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true });
}));

module.exports = router;

