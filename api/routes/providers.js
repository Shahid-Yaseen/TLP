/**
 * Providers Routes (Reference Data)
 * 
 * Simple CRUD for providers/launch providers
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');
const { getPool } = require('../config/database');

const pool = getPool();

/**
 * GET /api/providers
 * Get all providers
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM providers ORDER BY name ASC');
  res.json(rows);
}));

/**
 * GET /api/providers/:id
 * Get a single provider
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM providers WHERE id = $1', [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Provider not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

module.exports = router;

