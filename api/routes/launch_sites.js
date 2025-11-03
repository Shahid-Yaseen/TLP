/**
 * Launch Sites Routes (Reference Data)
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');
const { getPool } = require('../config/database');

const pool = getPool();

/**
 * GET /api/launch-sites
 * Get all launch sites
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM launch_sites ORDER BY name ASC');
  res.json(rows);
}));

/**
 * GET /api/launch-sites/:id
 * Get a single launch site
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM launch_sites WHERE id = $1', [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Launch site not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

module.exports = router;

