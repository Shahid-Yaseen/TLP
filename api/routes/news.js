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
 * For authenticated admin users, show all articles regardless of status
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const filters = [];
  const args = [];
  let paramCount = 1;

  // Only filter by published status for public access
  // Authenticated admin users can see all articles
  let isAdmin = false;
  if (req.user) {
    // Fetch user roles if not already attached
    if (!req.user.roles) {
      const { rows: roleRows } = await pool.query(
        `SELECT r.name 
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1`,
        [req.user.id]
      );
      req.user.roles = roleRows.map(row => row.name);
    }
    // Check if user is admin (handle both array of strings and array of objects)
    const roles = Array.isArray(req.user.roles) ? req.user.roles : [];
    isAdmin = roles.some(r => {
      const roleName = typeof r === 'string' ? r : r.name;
      return roleName === 'admin' || roleName === 'Admin';
    });
  }

  if (!isAdmin) {
    filters.push(`news_articles.status = $${paramCount++}`);
    args.push('published');
  }

  if (req.query.category) {
    const category = req.query.category;
    if (isNaN(category)) {
      // Category is a slug/name, only match by slug
      filters.push(`news_categories.slug = $${paramCount++}`);
      args.push(category);
    } else {
      // Category is numeric, match by ID
      filters.push(`news_categories.id = $${paramCount++}`);
      args.push(parseInt(category));
    }
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

  if (req.query.country_id) {
    filters.push(`news_articles.country_id = $${paramCount++}`);
    args.push(parseInt(req.query.country_id));
  }

  if (req.query.country) {
    filters.push(`countries.slug = $${paramCount++}`);
    args.push(req.query.country);
  }

  if (req.query.featured !== undefined) {
    filters.push(`news_articles.is_featured = $${paramCount++}`);
    args.push(req.query.featured === 'true');
  }

  if (req.query.trending !== undefined) {
    filters.push(`news_articles.is_trending = $${paramCount++}`);
    args.push(req.query.trending === 'true');
  }

  if (req.query.is_interview !== undefined) {
    filters.push(`news_articles.is_interview = $${paramCount++}`);
    args.push(req.query.is_interview === 'true');
  }

  if (req.query.is_top_story !== undefined) {
    filters.push(`news_articles.is_top_story = $${paramCount++}`);
    args.push(req.query.is_top_story === 'true');
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
    SELECT DISTINCT
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
      news_articles.is_interview,
      news_articles.is_top_story,
      news_articles.created_at,
      authors.id as author_id,
      authors.full_name as author_name,
      authors.profile_image_url as author_image,
      news_categories.id as category_id,
      news_categories.name as category_name,
      news_categories.slug as category_slug,
      countries.id as country_id,
      countries.name as country_name,
      countries.alpha_2_code as country_code
    FROM news_articles
    LEFT JOIN authors ON news_articles.author_id = authors.id
    LEFT JOIN news_categories ON news_articles.category_id = news_categories.id
    LEFT JOIN countries ON news_articles.country_id = countries.id
    ${filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''}
    ORDER BY news_articles.published_at DESC NULLS LAST, news_articles.created_at DESC
  `;

  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  args.push(limit, offset);

  let rows;
  try {
    const result = await pool.query(sql, args);
    rows = result.rows;
  } catch (queryError) {
    console.error('Main query error:', queryError.message);
    console.error('SQL:', sql);
    console.error('Args:', args);
    throw queryError;
  }

  // Get tags for each article (handle gracefully if tables don't exist)
  for (const article of rows) {
    try {
      const { rows: tagRows } = await pool.query(`
        SELECT at.id, at.name, at.slug
        FROM article_tags at
        JOIN article_tags_articles ata ON at.id = ata.tag_id
        WHERE ata.article_id = $1
      `, [article.id]);
      article.tags = tagRows || [];
    } catch (tagError) {
      // If tags table doesn't exist or query fails, just set empty array
      console.warn(`Warning: Could not fetch tags for article ${article.id}:`, tagError.message);
      article.tags = [];
    }
  }

  // Get total count (without limit/offset)
  // Build count args (exclude limit and offset which are the last 2 elements)
  const countArgs = args.length > 2 ? args.slice(0, -2) : [];
  const countSql = `
    SELECT COUNT(DISTINCT news_articles.id) as count
    FROM news_articles
    LEFT JOIN authors ON news_articles.author_id = authors.id
    LEFT JOIN news_categories ON news_articles.category_id = news_categories.id
    ${filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''}
  `;
  let countResult;
  try {
    countResult = await pool.query(countSql, countArgs);
  } catch (countError) {
    console.error('Count query error:', countError.message);
    console.error('Count SQL:', countSql);
    console.error('Count args:', countArgs);
    console.error('Count error code:', countError.code);
    console.error('Count error detail:', countError.detail);
    throw countError;
  }

  res.json({
    data: rows,
    pagination: {
      total: parseInt(countResult.rows[0]?.count || 0),
      limit,
      offset,
      has_more: offset + rows.length < parseInt(countResult.rows[0]?.count || 0)
    }
  });
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
 * GET /api/news/:id
 * Get a single article by ID or slug with full content
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isNumeric = !isNaN(id);

  let sql = `
    SELECT 
      news_articles.*,
      authors.id as author_id,
      authors.first_name as author_first_name,
      authors.last_name as author_last_name,
      authors.full_name as author_name,
      authors.email as author_email,
      authors.title as author_title,
      authors.bio as author_bio,
      authors.profile_image_url as author_image,
      authors.social_links as author_social_links,
      authors.created_at as author_created_at,
      news_categories.id as category_id,
      news_categories.name as category_name,
      news_categories.slug as category_slug,
      news_categories.description as category_description,
      countries.id as country_id,
      countries.name as country_name,
      countries.alpha_2_code as country_code
    FROM news_articles
    LEFT JOIN authors ON news_articles.author_id = authors.id
    LEFT JOIN news_categories ON news_articles.category_id = news_categories.id
    LEFT JOIN countries ON news_articles.country_id = countries.id
    WHERE ${isNumeric ? 'news_articles.id = $1' : 'news_articles.slug = $1'}
  `;

  const { rows } = await pool.query(sql, [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Article not found', code: 'NOT_FOUND' });
  }

  const row = rows[0];
  // Ensure the article id is preserved (not overwritten by author/category id)
  const article = {
    ...row,
    id: row.id // Use the actual article ID from the database, not the request parameter
  };

  // Increment view count (if published)
  if (article.status === 'published' && (!req.user || req.user.id !== article.author_id)) {
    await pool.query(
      'UPDATE news_articles SET views_count = views_count + 1 WHERE id = $1',
      [article.id]
    );
    article.views_count = (article.views_count || 0) + 1;
  }

  // Get tags (handle gracefully if tables don't exist)
  try {
    const { rows: tagRows } = await pool.query(`
      SELECT at.id, at.name, at.slug
      FROM article_tags at
      JOIN article_tags_articles ata ON at.id = ata.tag_id
      WHERE ata.article_id = $1
    `, [article.id]);
    article.tags = tagRows || [];
  } catch (tagError) {
    // If tags table doesn't exist or query fails, just set empty array
    console.warn(`Warning: Could not fetch tags for article ${article.id}:`, tagError.message);
    article.tags = [];
  }

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

  // Get related launch IDs
  const { rows: launchRows } = await pool.query(`
    SELECT launch_id
    FROM article_launch_relationships
    WHERE article_id = $1
  `, [article.id]);
  article.related_launch_ids = launchRows.map(row => row.launch_id);

  // Get polls
  const { rows: pollRows } = await pool.query(`
    SELECT id, question, created_at, updated_at
    FROM polls
    WHERE article_id = $1
    ORDER BY created_at ASC
  `, [article.id]);

  article.polls = [];
  for (const poll of pollRows) {
    const { rows: optionRows } = await pool.query(`
      SELECT id, option_text, votes_count, display_order
      FROM poll_options
      WHERE poll_id = $1
      ORDER BY display_order ASC
    `, [poll.id]);

    article.polls.push({
      ...poll,
      options: optionRows.map(opt => ({
        id: opt.id,
        text: opt.option_text,
        votes_count: opt.votes_count
      }))
    });
  }

  res.json(article);
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
    sub_category_id,
    featured_image_url,
    hero_image_url,
    content,
    excerpt,
    status,
    metadata,
    tag_ids,
    is_featured,
    is_trending,
    is_interview,
    is_top_story,
    country_id,
    poll_data,
    polls,
    related_launch_ids,
    summary
  } = req.body;

  console.log('POST /api/news - Received data:', JSON.stringify(req.body, null, 2));
  console.log('POST /api/news - author_id value:', author_id, 'type:', typeof author_id);

  if (!title || !content) {
    console.log('Validation failed: missing title or content');
    return res.status(400).json({
      error: 'Missing required fields: title, content',
      code: 'VALIDATION_ERROR'
    });
  }

  // Validate author_id if provided - ensure it exists in authors table
  let finalAuthorId = null;
  // Handle empty string, null, undefined, or 0 as no author
  if (author_id && author_id !== '' && author_id !== '0' && author_id !== 0) {
    const authorIdNum = parseInt(author_id);
    if (!isNaN(authorIdNum) && authorIdNum > 0) {
      const { rows: authorRows } = await pool.query('SELECT id FROM authors WHERE id = $1', [authorIdNum]);
      if (authorRows.length > 0) {
        finalAuthorId = authorIdNum;
      } else {
        console.log(`Invalid author_id: ${author_id} - not found in authors table`);
        // Don't return error, just set to null
        finalAuthorId = null;
      }
    }
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

  // Validate country_id if provided
  let finalCountryId = null;
  if (country_id && country_id !== '' && country_id !== '0' && country_id !== 0) {
    const countryIdNum = parseInt(country_id);
    if (!isNaN(countryIdNum) && countryIdNum > 0) {
      const { rows: countryRows } = await pool.query('SELECT id FROM countries WHERE id = $1', [countryIdNum]);
      if (countryRows.length > 0) {
        finalCountryId = countryIdNum;
      }
    }
  }

  // Validate sub_category_id if provided
  let finalSubCategoryId = null;
  if (sub_category_id && sub_category_id !== '' && sub_category_id !== '0' && sub_category_id !== 0) {
    const subCategoryIdNum = parseInt(sub_category_id);
    if (!isNaN(subCategoryIdNum) && subCategoryIdNum > 0) {
      const { rows: subCatRows } = await pool.query('SELECT id FROM news_categories WHERE id = $1', [subCategoryIdNum]);
      if (subCatRows.length > 0) {
        finalSubCategoryId = subCategoryIdNum;
      }
    }
  }

  // Create article
  const { rows } = await pool.query(`
    INSERT INTO news_articles (
      title, subtitle, slug, author_id, category_id, sub_category_id, country_id,
      featured_image_url, hero_image_url, content, excerpt,
      status, published_at, metadata, is_featured, is_trending, is_interview, is_top_story,
      summary
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *
  `, [
    title,
    subtitle || null,
    finalSlug,
    finalAuthorId || null,  // Use validated author_id (null if invalid or not provided)
    (category_id && category_id !== '' && category_id !== '0' && category_id !== 0) ? category_id : null,
    finalSubCategoryId || null,
    finalCountryId || null,
    featured_image_url || null,
    hero_image_url || null,
    content,
    excerpt || null,
    finalStatus,
    finalStatus === 'published' ? new Date() : null,
    JSON.stringify(metadata || {}),
    Boolean(is_featured) || false,
    Boolean(is_trending) || false,
    Boolean(is_interview) || false,
    Boolean(is_top_story) || false,
    summary || null
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

  // Create polls if provided
  const pollsToCreate = [...(Array.isArray(polls) ? polls : [])];
  if (poll_data && poll_data.question && Array.isArray(poll_data.options) && poll_data.options.length >= 2) {
    pollsToCreate.push(poll_data);
  }

  if (pollsToCreate.length > 0) {
    for (const poll_item of pollsToCreate) {
      if (poll_item.question && poll_item.options && Array.isArray(poll_item.options) && poll_item.options.length >= 2) {
        const { rows: pollRows } = await pool.query(`
          INSERT INTO polls (question, article_id)
          VALUES ($1, $2)
          RETURNING *
        `, [poll_item.question, article.id]);

        const poll = pollRows[0];

        // Create poll options
        for (let i = 0; i < poll_item.options.length; i++) {
          const optionText = typeof poll_item.options[i] === 'string'
            ? poll_item.options[i]
            : (poll_item.options[i].text || poll_item.options[i].option_text);

          if (optionText) {
            await pool.query(`
              INSERT INTO poll_options (poll_id, option_text, display_order)
              VALUES ($1, $2, $3)
            `, [poll.id, optionText, i]);
          }
        }
      }
    }
  }

  // Add related launches if provided
  if (related_launch_ids && Array.isArray(related_launch_ids) && related_launch_ids.length > 0) {
    for (const launchId of related_launch_ids) {
      await pool.query(`
        INSERT INTO article_launch_relationships (article_id, launch_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [article.id, launchId]).catch(err => {
        // Table might not exist yet, log but don't fail
        console.log('Could not insert launch relationship:', err.message);
      });
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
    'title', 'subtitle', 'slug', 'category_id', 'country_id', 'featured_image_url',
    'hero_image_url', 'content', 'excerpt', 'status', 'metadata',
    'is_featured', 'is_trending', 'is_interview', 'is_top_story', 'summary',
    'sub_category_id'
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

  let setClause = updates.map((field, index) => {
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
      return req.body[field];
    }
    return req.body[field];
  });
  values.unshift(id);

  // Add published_at when status is being set to published (no extra placeholder; NOW() is SQL)
  if (req.body.status === 'published') {
    const { rows: checkRows } = await pool.query(
      'SELECT published_at FROM news_articles WHERE id = $1',
      [id]
    );
    if (checkRows[0] && !checkRows[0].published_at) {
      setClause += ', published_at = NOW()';
    }
  }

  const { rows } = await pool.query(
    `UPDATE news_articles SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  );

  const updatedArticle = rows[0];

  // Update tags if provided
  if (req.body.tag_ids && Array.isArray(req.body.tag_ids)) {
    await pool.query('DELETE FROM article_tags_articles WHERE article_id = $1', [id]);
    for (const tagId of req.body.tag_ids) {
      await pool.query(
        'INSERT INTO article_tags_articles (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, tagId]
      );
    }
  }

  // Update related launches if provided
  if (req.body.related_launch_ids && Array.isArray(req.body.related_launch_ids)) {
    await pool.query('DELETE FROM article_launch_relationships WHERE article_id = $1', [id]);
    for (const launchId of req.body.related_launch_ids) {
      await pool.query(
        'INSERT INTO article_launch_relationships (article_id, launch_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, launchId]
      );
    }
  }

  // Update polls if provided
  const pollsToUpdate = req.body.polls && Array.isArray(req.body.polls) ? [...req.body.polls] : [];
  if (req.body.poll_data && req.body.poll_data.question && Array.isArray(req.body.poll_data.options) && req.body.poll_data.options.length >= 2) {
    pollsToUpdate.push(req.body.poll_data);
  }

  if (pollsToUpdate.length > 0 || (req.body.polls && req.body.polls.length === 0)) {
    // Note: Simple approach is to delete all and recreate, but this loses old votes.
    // For now, if it's an admin tool and they are editing the poll, recreating is common.
    await pool.query('DELETE FROM polls WHERE article_id = $1', [id]);

    for (const poll_item of pollsToUpdate) {
      if (poll_item.question && poll_item.options && Array.isArray(poll_item.options) && poll_item.options.length >= 2) {
        const { rows: pollRows } = await pool.query(`
          INSERT INTO polls (question, article_id)
          VALUES ($1, $2)
          RETURNING *
        `, [poll_item.question, id]);

        const poll = pollRows[0];

        for (let i = 0; i < poll_item.options.length; i++) {
          const optionText = typeof poll_item.options[i] === 'string'
            ? poll_item.options[i]
            : (poll_item.options[i].text || poll_item.options[i].option_text);

          if (optionText) {
            await pool.query(`
              INSERT INTO poll_options (poll_id, option_text, display_order)
              VALUES ($1, $2, $3)
            `, [poll.id, optionText, i]);
          }
        }
      }
    }
  }

  res.json(updatedArticle);
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

