/**
 * Trending Topics Routes
 * Used for the news page "TRENDING | SPACEX | ARTEMIS 2 | ..." bar
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
 * GET /api/news/trending-topics
 * Get active trending topics (for public news page bar), dynamically calculated based on tag frequency
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  // Calculate trending topics based on tag frequency in the last 30 days
  const { rows } = await pool.query(
    `SELECT at.id, at.name, at.slug, COUNT(ata.article_id) as priority
     FROM article_tags at
     JOIN article_tags_articles ata ON at.id = ata.tag_id
     JOIN news_articles na ON ata.article_id = na.id
     WHERE na.status = 'published'
       AND na.published_at > NOW() - INTERVAL '30 days'
     GROUP BY at.id, at.name, at.slug
     ORDER BY priority DESC, at.name ASC
     LIMIT 10`
  );

  // If no dynamic tags found (e.g. no articles in 30 days), fallback to active trending_topics table
  if (rows.length === 0) {
    const { rows: fallbackRows } = await pool.query(
      `SELECT id, name, slug, topic_type, priority, is_active, created_at
       FROM trending_topics
       WHERE is_active = true
       ORDER BY priority DESC, name ASC`
    );
    return res.json(fallbackRows);
  }

  // Format to match trending_topics structure
  const formattedRows = rows.map(row => ({
    id: row.id,
    name: row.name.toUpperCase(),
    slug: row.slug,
    topic_type: 'tag',
    priority: parseInt(row.priority, 10),
    is_active: true
  }));

  res.json(formattedRows);
}));

/**
 * GET /api/news/trending-topics/:id
 * Get a single trending topic by ID or slug
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isNumeric = !isNaN(id);
  const sql = isNumeric
    ? 'SELECT * FROM trending_topics WHERE id = $1'
    : 'SELECT * FROM trending_topics WHERE slug = $1';
  const { rows } = await pool.query(sql, [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Trending topic not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * POST /api/news/trending-topics
 * Create a trending topic (Admin only)
 */
router.post('/', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { name, slug, topic_type, related_entity_id, entity_type, priority, is_active } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Missing required field: name',
      code: 'VALIDATION_ERROR'
    });
  }

  const finalSlug = slug || await generateUniqueSlug(pool, 'trending_topics', 'slug', name);
  const priorityVal = priority !== undefined ? parseInt(priority, 10) : 0;
  const active = is_active !== undefined ? Boolean(is_active) : true;

  const { rows } = await pool.query(
    `INSERT INTO trending_topics (name, slug, topic_type, related_entity_id, entity_type, priority, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, finalSlug, topic_type || null, related_entity_id || null, entity_type || null, priorityVal, active]
  );

  res.status(201).json(rows[0]);
}));

/**
 * PATCH /api/news/trending-topics/:id
 * Update a trending topic (Admin only)
 */
router.patch('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug, topic_type, related_entity_id, entity_type, priority, is_active } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (slug !== undefined) updates.slug = slug;
  if (topic_type !== undefined) updates.topic_type = topic_type;
  if (related_entity_id !== undefined) updates.related_entity_id = related_entity_id;
  if (entity_type !== undefined) updates.entity_type = entity_type;
  if (priority !== undefined) updates.priority = parseInt(priority, 10);
  if (is_active !== undefined) updates.is_active = Boolean(is_active);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update', code: 'VALIDATION_ERROR' });
  }

  const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = Object.values(updates);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE trending_topics SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Trending topic not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * DELETE /api/news/trending-topics/:id
 * Delete a trending topic (Admin only)
 */
router.delete('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query('DELETE FROM trending_topics WHERE id = $1', [id]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Trending topic not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true });
}));

module.exports = router;
