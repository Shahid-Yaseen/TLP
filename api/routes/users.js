/**
 * User Management Routes
 * 
 * Handles user management endpoints (Admin only)
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { getPool } = require('../config/database');

const pool = getPool();

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT 
      users.id,
      users.username,
      users.email,
      users.first_name,
      users.last_name,
      CONCAT(COALESCE(users.first_name, ''), ' ', COALESCE(users.last_name, '')) as full_name,
      users.bio,
      users.location,
      users.profile_image_url,
      users.is_active,
      users.email_verified,
      users.last_login,
      users.created_at
    FROM users
    WHERE users.id = $1`,
    [req.user.id]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }

  // Get user roles
  const { rows: roleRows } = await pool.query(
    `SELECT r.name 
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [req.user.id]
  );

  const user = rows[0];
  user.roles = roleRows.map(row => ({ name: row.name }));

  res.json(user);
}));

/**
 * PATCH /api/users/me
 * Update current user profile
 */
router.patch('/me', authenticate, asyncHandler(async (req, res) => {
  const allowedFields = ['first_name', 'last_name', 'bio', 'location', 'profile_image_url'];
  const updates = Object.keys(req.body).filter(key => allowedFields.includes(key));
  
  if (updates.length === 0) {
    return res.status(400).json({ 
      error: 'No valid fields to update',
      code: 'VALIDATION_ERROR' 
    });
  }

  const setClause = updates.map((field, index) => `${field} = $${index + 1}`).join(', ');
  const values = updates.map(field => req.body[field]);
  values.push(req.user.id);

  const { rows } = await pool.query(
    `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${updates.length + 1} RETURNING 
      id, username, email, first_name, last_name, 
      CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) as full_name,
      bio, location, profile_image_url, is_active, email_verified, created_at`,
    values
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get('/', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const filters = [];
  const args = [];
  let paramCount = 1;

  if (req.query.role) {
    filters.push(`EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = users.id AND r.name = $${paramCount++}
    )`);
    args.push(req.query.role);
  }

  if (req.query.active !== undefined) {
    filters.push(`users.is_active = $${paramCount++}`);
    args.push(req.query.active === 'true');
  }

  if (req.query.search) {
    filters.push(`(
      users.username ILIKE $${paramCount++}
      OR users.email ILIKE $${paramCount++}
    )`);
    const searchTerm = `%${req.query.search}%`;
    args.push(searchTerm, searchTerm);
  }

  let sql = 'SELECT * FROM users';
  if (filters.length) {
    sql += ' WHERE ' + filters.join(' AND ');
  }
  sql += ' ORDER BY users.created_at DESC';

  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  args.push(limit, offset);

  const { rows } = await pool.query(sql, args);

  // Get roles for each user
  for (const user of rows) {
    const { rows: roleRows } = await pool.query(
      `SELECT r.name 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );
    user.roles = roleRows.map(row => row.name);
  }

  res.json({
    data: rows,
    pagination: {
      limit,
      offset,
      has_more: rows.length === limit
    }
  });
}));

/**
 * GET /api/users/:id
 * Get a single user by ID (Admin only)
 */
router.get('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }

  // Get roles
  const { rows: roleRows } = await pool.query(
    `SELECT r.name, r.id as role_id
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [id]
  );

  const user = rows[0];
  user.roles = roleRows;

  res.json(user);
}));

/**
 * PATCH /api/users/:id
 * Update a user (Admin only)
 */
router.patch('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowedFields = [
    'username', 'email', 'first_name', 'last_name', 'profile_image_url',
    'is_active', 'email_verified'
  ];

  const updates = Object.keys(req.body).filter(key => allowedFields.includes(key));
  
  if (updates.length === 0) {
    return res.status(400).json({ 
      error: 'No valid fields to update',
      code: 'VALIDATION_ERROR' 
    });
  }

  const setClause = updates.map((field, index) => `${field} = $${index + 1}`).join(', ');
  const values = updates.map(field => req.body[field]);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${updates.length + 1} RETURNING *`,
    values
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * DELETE /api/users/:id
 * Deactivate a user (Admin only)
 */
router.delete('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
    [id]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true });
}));

module.exports = router;

