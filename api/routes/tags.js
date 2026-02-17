/**
 * Article Tags Routes
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { getPool } = require('../config/database');
const { generateUniqueSlug } = require('../utils/db');

const pool = getPool();

/**
 * GET /api/news/tags
 * Get all article tags (supports ids, limit, offset for admin dataProvider)
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { ids, limit, offset, q } = req.query;
  let sql = 'SELECT * FROM article_tags';
  const params = [];
  let paramCount = 1;
  const filters = [];

  if (ids) {
    const idList = ids.split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));
    if (idList.length > 0) {
      filters.push(`id = ANY($${paramCount++}::int[])`);
      params.push(idList);
    }
  }

  if (q) {
    filters.push(`name ILIKE $${paramCount++}`);
    params.push(`%${q}%`);
  }

  if (filters.length > 0) {
    sql += ` WHERE ${filters.join(' AND ')}`;
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
    let countSql = 'SELECT COUNT(*) FROM article_tags';
    if (filters.length > 0) {
      countSql += ` WHERE ${filters.join(' AND ').replace(/\$\d+/g, (match) => {
        // This is a bit complex due to param mapping, 
        // but since we only care about the count, we can just use the same params
        return match;
      })}`;
    }
    const countResult = await pool.query(countSql, params.slice(0, filters.length));
    const total = parseInt(countResult.rows[0].count, 10);
    return res.json({ data: rows, total });
  }

  res.json(rows);
}));

/**
 * GET /api/news/tags/:id
 * Get a single tag by ID or slug
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isNumeric = !isNaN(id);

  let sql = 'SELECT * FROM article_tags WHERE';
  if (isNumeric) {
    sql += ' id = $1';
  } else {
    sql += ' slug = $1';
  }

  const { rows } = await pool.query(sql, [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Tag not found', code: 'NOT_FOUND' });
  }

  // Get article count
  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*) as count FROM article_tags_articles WHERE tag_id = $1',
    [rows[0].id]
  );
  rows[0].articles_count = parseInt(countRows[0].count);

  res.json(rows[0]);
}));

/**
 * POST /api/news/tags
 * Create a new tag (Admin only)
 */
router.post('/', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { name, slug } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Missing required field: name',
      code: 'VALIDATION_ERROR'
    });
  }

  const finalSlug = slug || await generateUniqueSlug(pool, 'article_tags', 'slug', name);

  const { rows } = await pool.query(`
    INSERT INTO article_tags (name, slug)
    VALUES ($1, $2)
    RETURNING *
  `, [name, finalSlug]);

  res.status(201).json(rows[0]);
}));

/**
 * PATCH /api/news/tags/:id
 * Update a tag (Admin only)
 */
router.patch('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (slug !== undefined) updates.slug = slug;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update', code: 'VALIDATION_ERROR' });
  }

  const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = Object.values(updates);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE article_tags SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Tag not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * DELETE /api/news/tags/:id
 * Delete a tag (Admin only)
 */
router.delete('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query('DELETE FROM article_tags WHERE id = $1', [id]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Tag not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true });
}));

module.exports = router;

