/**
 * Countries Routes
 * 
 * Handles all country-related endpoints
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { getPool } = require('../config/database');

const pool = getPool();

/**
 * GET /api/countries
 * Get all countries
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { search, limit, offset } = req.query;
  
  let sql = 'SELECT id, name, alpha_2_code, alpha_3_code FROM countries';
  const args = [];
  let paramCount = 1;

  if (search) {
    sql += ` WHERE name ILIKE $${paramCount++} OR alpha_2_code ILIKE $${paramCount++} OR alpha_3_code ILIKE $${paramCount++}`;
    const searchTerm = `%${search}%`;
    args.push(searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY name ASC';

  if (limit) {
    sql += ` LIMIT $${paramCount++}`;
    args.push(parseInt(limit));
  }

  if (offset) {
    sql += ` OFFSET $${paramCount++}`;
    args.push(parseInt(offset));
  }

  const { rows } = await pool.query(sql, args);
  res.json(rows);
}));

/**
 * GET /api/countries/:id
 * Get a single country by ID
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isNumeric = /^\d+$/.test(id);
  
  const sql = isNumeric
    ? 'SELECT * FROM countries WHERE id = $1'
    : 'SELECT * FROM countries WHERE alpha_2_code = $1 OR alpha_3_code = $1';
  
  const { rows } = await pool.query(sql, [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Country not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

module.exports = router;

