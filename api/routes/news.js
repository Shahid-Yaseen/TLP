/**
 * News Routes
 * 
 * Handles all news article-related endpoints
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { role, permission } = require('../middleware/authorize');
const { getPool } = require('../config/database');

const pool = getPool();

/**
 * GET /api/news
 * Get all published news articles with filtering
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const filters = [];
  const args = [];
  let paramCount = 1;

  // Always filter by published status for public access
  filters.push(`news_articles.status = $${paramCount++}`);
  args.push('published');

  if (req.query.category) {
    filters.push(`news_categories.slug = $${paramCount++} OR news_categories.id = $${paramCount++}`);
    const category = isNaN(req.query.category) ? req.query.category : parseInt(req.query.category);
    args.push(category, category);
  }

  if (req.query.tag) {
    filters.push(`EXISTS (
      SELECT 1 FROM article_tags_articles ata
      JOIN article_tags at ON ata.tag_id = at.id
      WHERE ata.article_id = news_articles.id 
      AND (at.slug = $${paramCount++} OR at.id = $${paramCount++})
    )`);
    const tag = isNaN(req.query.tag) ? req.query.tag : parseInt(req.query.tag);
    args.push(tag, tag);
  }

  if (req.query.author_id) {
    filters.push(`news_articles.author_id = $${paramCount++}`);
    args.push(parseInt(req.query.author_id));
  }

  if (req.query.featured === 'true') {
    filters.push(`news_articles.is_featured = $${paramCount++}`);
    args.push(true);
  }

  if (req.query.trending === 'true') {
    filters.push(`news_articles.is_trending = $${paramCount++}`);
    args.push(true);
  }

  if (req.query.date_from) {
    filters.push(`news_articles.published_at >= $${paramCount++}`);
    args.push(req.query.date_from);
  }

  if (req.query.date_to) {
    filters.push(`news_articles.published_at <= $${paramCount++}`);
    args.push(req.query.date_to);
  }

  if (req.query.search) {
    filters.push(`(
      news_articles.title ILIKE $${paramCount++} 
      OR news_articles.subtitle ILIKE $${paramCount++}
      OR news_articles.excerpt ILIKE $${paramCount++}
    )`);
    const searchTerm = `%${req.query.search}%`;
    args.push(searchTerm, searchTerm, searchTerm);
  }

  let sql = `
    SELECT 
      news_articles.id,
      news_articles.title,
      news_articles.subtitle,
      news_articles.slug,
      news_articles.featured_image_url,
      news_articles.hero_image_url,
      news_articles.excerpt,
      news_articles.status,
      news_articles.published_at,
      news_articles.views_count,
      news_articles.is_featured,
      news_articles.is_trending,
      news_articles.created_at,
      authors.id as author_id,
      authors.full_name as author_name,
      authors.profile_image_url as author_image,
      news_categories.id as category_id,
      news_categories.name as category_name,
      news_categories.slug as category_slug
    FROM news_articles
    LEFT JOIN authors ON news_articles.author_id = authors.id
    LEFT JOIN news_categories ON news_articles.category_id = news_categories.id
    WHERE ${filters.join(' AND ')}
    ORDER BY news_articles.published_at DESC
  `;

  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  args.push(limit, offset);

  const { rows } = await pool.query(sql, args);

  // Get tags for each article
  for (const article of rows) {
    const { rows: tagRows } = await pool.query(`
      SELECT at.id, at.name, at.slug
      FROM article_tags at
      JOIN article_tags_articles ata ON at.id = ata.tag_id
      WHERE ata.article_id = $1
    `, [article.id]);
    article.tags = tagRows;
  }

  // Get total count (without limit/offset)
  const countSql = `
    SELECT COUNT(DISTINCT news_articles.id) as count
    FROM news_articles
    LEFT JOIN authors ON news_articles.author_id = authors.id
    LEFT JOIN news_categories ON news_articles.category_id = news_categories.id
    WHERE ${filters.join(' AND ')}
  `;
  const { rows: countRows } = await pool.query(
    countSql,
    args.slice(0, -2) // Remove limit and offset
  );

  res.json({
    data: rows,
    pagination: {
      total: parseInt(countRows[0].count),
      limit,
      offset,
      has_more: offset + rows.length < parseInt(countRows[0].count)
    }
  });
}));

/**
 * GET /api/news/:id
 * Get a single article by ID or slug with full content
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isNumeric = !isNaN(id);

  let sql = `
    SELECT 
      news_articles.*,
      authors.*,
      news_categories.name as category_name,
      news_categories.slug as category_slug
    FROM news_articles
    LEFT JOIN authors ON news_articles.author_id = authors.id
    LEFT JOIN news_categories ON news_articles.category_id = news_categories.id
    WHERE ${isNumeric ? 'news_articles.id = $1' : 'news_articles.slug = $1'}
  `;

  const { rows } = await pool.query(sql, [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Article not found', code: 'NOT_FOUND' });
  }

  const article = rows[0];

  // Increment view count (if published)
  if (article.status === 'published' && (!req.user || req.user.id !== article.author_id)) {
    await pool.query(
      'UPDATE news_articles SET views_count = views_count + 1 WHERE id = $1',
      [article.id]
    );
    article.views_count = (article.views_count || 0) + 1;
  }

  // Get tags
  const { rows: tagRows } = await pool.query(`
    SELECT at.id, at.name, at.slug
    FROM article_tags at
    JOIN article_tags_articles ata ON at.id = ata.tag_id
    WHERE ata.article_id = $1
  `, [article.id]);
  article.tags = tagRows;

  // Get related content
  const { rows: relatedRows } = await pool.query(`
    SELECT 
      rc.related_type,
      rc.related_id,
      rc.relationship_type,
      rc.priority
    FROM related_content rc
    WHERE rc.source_type = 'article' AND rc.source_id = $1
    ORDER BY rc.priority DESC
    LIMIT 10
  `, [article.id]);
  article.related_content = relatedRows;

  // Get comments count (approved only)
  const { rows: commentRows } = await pool.query(`
    SELECT COUNT(*) as count
    FROM comments
    WHERE article_id = $1 AND is_approved = true
  `, [article.id]);
  article.comments_count = parseInt(commentRows[0].count);

  res.json(article);
}));

/**
 * GET /api/news/featured
 * Get featured articles
 */
router.get('/featured', optionalAuth, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const { rows } = await pool.query(`
    SELECT 
      news_articles.id,
      news_articles.title,
      news_articles.subtitle,
      news_articles.slug,
      news_articles.featured_image_url,
      news_articles.excerpt,
      news_articles.published_at,
      authors.full_name as author_name
    FROM news_articles
    LEFT JOIN authors ON news_articles.author_id = authors.id
    WHERE news_articles.is_featured = true 
      AND news_articles.status = 'published'
    ORDER BY news_articles.published_at DESC
    LIMIT $1
  `, [limit]);
  res.json(rows);
}));

/**
 * GET /api/news/trending
 * Get trending articles
 */
router.get('/trending', optionalAuth, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const { rows } = await pool.query(`
    SELECT 
      news_articles.id,
      news_articles.title,
      news_articles.subtitle,
      news_articles.slug,
      news_articles.featured_image_url,
      news_articles.excerpt,
      news_articles.published_at,
      authors.full_name as author_name
    FROM news_articles
    LEFT JOIN authors ON news_articles.author_id = authors.id
    WHERE news_articles.is_trending = true 
      AND news_articles.status = 'published'
    ORDER BY news_articles.views_count DESC, news_articles.published_at DESC
    LIMIT $1
  `, [limit]);
  res.json(rows);
}));

/**
 * GET /api/news/latest
 * Get latest articles
 */
router.get('/latest', optionalAuth, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const { rows } = await pool.query(`
    SELECT 
      news_articles.id,
      news_articles.title,
      news_articles.subtitle,
      news_articles.slug,
      news_articles.featured_image_url,
      news_articles.excerpt,
      news_articles.published_at,
      authors.full_name as author_name
    FROM news_articles
    LEFT JOIN authors ON news_articles.author_id = authors.id
    WHERE news_articles.status = 'published'
    ORDER BY news_articles.published_at DESC
    LIMIT $1
  `, [limit]);
  res.json(rows);
}));

/**
 * POST /api/news
 * Create a new article (Writer/Admin only)
 */
router.post('/', authenticate, role('admin', 'writer'), asyncHandler(async (req, res) => {
  const {
    title,
    subtitle,
    slug,
    author_id,
    category_id,
    featured_image_url,
    hero_image_url,
    content,
    excerpt,
    status,
    metadata,
    tag_ids
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      error: 'Missing required fields: title, content',
      code: 'VALIDATION_ERROR'
    });
  }

  // Writers can only create drafts
  const { rows: roleRows } = await pool.query(
    `SELECT r.name FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [req.user.id]
  );
  const userRoles = roleRows.map(r => r.name);
  const finalStatus = userRoles.includes('admin') ? (status || 'draft') : 'draft';

  // Generate slug if not provided
  let finalSlug = slug || title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Ensure slug is unique
  let slugExists = true;
  let slugSuffix = 1;
  const originalSlug = finalSlug;
  while (slugExists) {
    const { rows } = await pool.query('SELECT id FROM news_articles WHERE slug = $1', [finalSlug]);
    if (rows.length === 0) {
      slugExists = false;
    } else {
      finalSlug = `${originalSlug}-${slugSuffix++}`;
    }
  }

  // Create article
  const { rows } = await pool.query(`
    INSERT INTO news_articles (
      title, subtitle, slug, author_id, category_id,
      featured_image_url, hero_image_url, content, excerpt,
      status, published_at, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    title,
    subtitle || null,
    finalSlug,
    author_id || req.user.id,
    category_id || null,
    featured_image_url || null,
    hero_image_url || null,
    content,
    excerpt || null,
    finalStatus,
    finalStatus === 'published' ? new Date() : null,
    JSON.stringify(metadata || {})
  ]);

  const article = rows[0];

  // Add tags if provided
  if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
    for (const tagId of tag_ids) {
      await pool.query(
        'INSERT INTO article_tags_articles (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [article.id, tagId]
      );
    }
  }

  res.status(201).json(article);
}));

/**
 * PATCH /api/news/:id
 * Update an article (Writer can update own drafts, Admin can update anything)
 */
router.patch('/:id', authenticate, role('admin', 'writer'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if article exists and user has permission
  const { rows: articleRows } = await pool.query(
    'SELECT id, author_id, status FROM news_articles WHERE id = $1',
    [id]
  );

  if (!articleRows.length) {
    return res.status(404).json({ error: 'Article not found', code: 'NOT_FOUND' });
  }

  const article = articleRows[0];

  // Writers can only update their own drafts
  const { rows: roleRows } = await pool.query(
    `SELECT r.name FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [req.user.id]
  );
  const userRoles = roleRows.map(r => r.name);

  if (!userRoles.includes('admin') && (article.author_id !== req.user.id || article.status !== 'draft')) {
    return res.status(403).json({
      error: 'You can only edit your own draft articles',
      code: 'FORBIDDEN'
    });
  }

  // Build update query
  const allowedFields = [
    'title', 'subtitle', 'slug', 'category_id', 'featured_image_url',
    'hero_image_url', 'content', 'excerpt', 'status', 'metadata'
  ];
  const updates = Object.keys(req.body).filter(key => allowedFields.includes(key));

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update', code: 'VALIDATION_ERROR' });
  }

  // Writers can't change status to published
  if (!userRoles.includes('admin') && req.body.status === 'published') {
    return res.status(403).json({
      error: 'Only admins can publish articles',
      code: 'FORBIDDEN'
    });
  }

  const setClause = updates.map((field, index) => {
    if (field === 'metadata') {
      return `${field} = $${index + 2}::jsonb`;
    }
    return `${field} = $${index + 2}`;
  }).join(', ');

  const values = updates.map(field => {
    if (field === 'metadata' && typeof req.body[field] === 'object') {
      return JSON.stringify(req.body[field]);
    }
    if (field === 'status' && req.body[field] === 'published') {
      // Set published_at if publishing
      return req.body[field];
    }
    return req.body[field];
  });
  values.unshift(id);

  // Add published_at if status is being changed to published
  if (req.body.status === 'published') {
    const { rows: checkRows } = await pool.query(
      'SELECT published_at FROM news_articles WHERE id = $1',
      [id]
    );
    if (!checkRows[0].published_at) {
      setClause += ', published_at = NOW()';
    }
  }

  const { rows } = await pool.query(
    `UPDATE news_articles SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  );

  res.json(rows[0]);
}));

/**
 * DELETE /api/news/:id
 * Delete an article (Admin only)
 */
router.delete('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query('DELETE FROM news_articles WHERE id = $1', [id]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Article not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true });
}));

/**
 * POST /api/news/:id/publish
 * Publish a draft article (Admin only)
 */
router.post('/:id/publish', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(`
    UPDATE news_articles 
    SET status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Article not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

module.exports = router;

