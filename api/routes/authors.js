/**
 * Authors Routes
 * 
 * Handles author/journalist endpoints
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { getPool } = require('../config/database');

const pool = getPool();

/**
 * GET /api/authors
 * Get all authors
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM authors ORDER BY full_name ASC');
  res.json(rows);
}));

/**
 * GET /api/authors/:id
 * Get a single author by ID or slug (generated from full_name)
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isNumeric = !isNaN(id) && !isNaN(parseFloat(id));
  
  let query;
  let params;
  
  if (isNumeric) {
    // If numeric, search by ID
    query = 'SELECT * FROM authors WHERE id = $1';
    params = [parseInt(id)];
  } else {
    // If not numeric, search by slug (generated from full_name)
    // Try multiple matching strategies
    const slugLower = id.toLowerCase().trim();
    const nameFromSlug = id.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    // Match by slug pattern: LOWER(REPLACE(full_name, ' ', '-')) = slug
    // Also try matching the full name directly
    query = `
      SELECT * FROM authors 
      WHERE LOWER(REPLACE(full_name, ' ', '-')) = $1 
         OR LOWER(full_name) = $2
         OR LOWER(full_name) = $3
    `;
    params = [
      slugLower,
      nameFromSlug.toLowerCase(),
      slugLower.replace(/-/g, ' ') // slug with spaces instead of hyphens
    ];
  }
  
  try {
    const { rows } = await pool.query(query, params);

    if (!rows.length) {
      return res.status(404).json({ error: 'Author not found', code: 'NOT_FOUND' });
    }

    const author = rows[0];
    const authorId = author.id;

    // Get article count
    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*) as count FROM news_articles WHERE author_id = $1 AND status = $2',
      [authorId, 'published']
    );
    author.articles_count = parseInt(countRows[0].count);

    res.json(author);
  } catch (error) {
    console.error('Error fetching author:', error);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
}));

/**
 * POST /api/authors
 * Create a new author (Admin only)
 */
router.post('/', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const {
    first_name,
    last_name,
    full_name,
    email,
    title,
    bio,
    profile_image_url,
    book_info,
    social_links
  } = req.body;

  if (!first_name || !last_name || !full_name) {
    return res.status(400).json({
      error: 'Missing required fields: first_name, last_name, full_name',
      code: 'VALIDATION_ERROR'
    });
  }

  const { rows } = await pool.query(`
    INSERT INTO authors (
      first_name, last_name, full_name, email, title, bio,
      profile_image_url, book_info, social_links
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    first_name,
    last_name,
    full_name,
    email || null,
    title || null,
    bio || null,
    profile_image_url || null,
    JSON.stringify(book_info || {}),
    JSON.stringify(social_links || {})
  ]);

  res.status(201).json(rows[0]);
}));

/**
 * PATCH /api/authors/:id
 * Update an author (Admin only)
 */
router.patch('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowedFields = [
    'first_name', 'last_name', 'full_name', 'email', 'title',
    'bio', 'profile_image_url', 'book_info', 'social_links'
  ];

  const updates = Object.keys(req.body).filter(key => allowedFields.includes(key));
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update', code: 'VALIDATION_ERROR' });
  }

  const setClause = updates.map((field, index) => {
    if (field === 'book_info' || field === 'social_links') {
      return `${field} = $${index + 2}::jsonb`;
    }
    return `${field} = $${index + 2}`;
  }).join(', ');

  const values = updates.map(field => {
    if ((field === 'book_info' || field === 'social_links') && typeof req.body[field] === 'object') {
      return JSON.stringify(req.body[field]);
    }
    return req.body[field];
  });
  values.unshift(id);

  const { rows } = await pool.query(
    `UPDATE authors SET ${setClause} WHERE id = $1 RETURNING *`,
    values
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Author not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * DELETE /api/authors/:id
 * Delete an author (Admin only)
 */
router.delete('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query('DELETE FROM authors WHERE id = $1', [id]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Author not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true });
}));

module.exports = router;

