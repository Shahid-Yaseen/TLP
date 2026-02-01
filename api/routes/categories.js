/**
 * News Categories Routes
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { getPool } = require('../config/database');
const { slugify, generateUniqueSlug } = require('../utils/db');

const pool = getPool();

/**
 * GET /api/news/categories
 * Get all news categories (supports ids, limit, offset for admin dataProvider)
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { ids, limit, offset } = req.query;
  let sql = 'SELECT * FROM news_categories';
  const params = [];
  let paramCount = 1;

  if (ids) {
    const idList = ids.split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));
    if (idList.length > 0) {
      sql += ` WHERE id = ANY($${paramCount++}::int[])`;
      params.push(idList);
    }
  }

  sql += ' ORDER BY name ASC';

  if (limit !== undefined && offset !== undefined) {
    const lim = Math.min(parseInt(limit, 10) || 100, 100);
    const off = Math.max(parseInt(offset, 10) || 0, 0);
    sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(lim, off);
  }

  const { rows } = await pool.query(sql, params);

  if (limit !== undefined && offset !== undefined) {
    let countSql = 'SELECT COUNT(*) FROM news_categories';
    const countParams = [];
    if (ids && params.length > 0) {
      countSql = 'SELECT COUNT(*) FROM news_categories WHERE id = ANY($1::int[])';
      countParams.push(params[0]);
    }
    const countResult = await pool.query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count, 10);
    return res.json({ data: rows, total });
  }

  res.json(rows);
}));

/**
 * GET /api/news/categories/:id
 * Get a single category by ID or slug
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isNumeric = !isNaN(id);

  let sql = 'SELECT * FROM news_categories WHERE';
  if (isNumeric) {
    sql += ' id = $1';
  } else {
    sql += ' slug = $1';
  }

  const { rows } = await pool.query(sql, [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Category not found', code: 'NOT_FOUND' });
  }

  // Get article count
  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*) as count FROM news_articles WHERE category_id = $1',
    [rows[0].id]
  );
  rows[0].articles_count = parseInt(countRows[0].count);

  res.json(rows[0]);
}));

/**
 * POST /api/news/categories
 * Create a new category (Admin only)
 */
router.post('/', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { name, slug, description } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Missing required field: name',
      code: 'VALIDATION_ERROR'
    });
  }

  const finalSlug = slug || await generateUniqueSlug(pool, 'news_categories', 'slug', name);

  const { rows } = await pool.query(`
    INSERT INTO news_categories (name, slug, description)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [name, finalSlug, description || null]);

  res.status(201).json(rows[0]);
}));

/**
 * PATCH /api/news/categories/:id
 * Update a category (Admin only)
 */
router.patch('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug, description } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (slug !== undefined) updates.slug = slug;
  if (description !== undefined) updates.description = description;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update', code: 'VALIDATION_ERROR' });
  }

  const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = Object.values(updates);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE news_categories SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Category not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * DELETE /api/news/categories/:id
 * Delete a category (Admin only)
 */
router.delete('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query('DELETE FROM news_categories WHERE id = $1', [id]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Category not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true });
}));

module.exports = router;

