/**
 * Orbits Routes (Reference Data)
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');
const { getPool } = require('../config/database');

const pool = getPool();

/**
 * GET /api/orbits
 * Get all orbits
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM orbits ORDER BY code ASC');
  res.json(rows);
}));

/**
 * GET /api/orbits/:id
 * Get a single orbit
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM orbits WHERE id = $1', [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Orbit not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

module.exports = router;

