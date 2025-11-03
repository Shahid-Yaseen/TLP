/**
 * Permissions Routes
 * 
 * Handles permission management (Admin only)
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { getPool } = require('../config/database');

const pool = getPool();

/**
 * GET /api/permissions
 * Get all permissions
 */
router.get('/', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM permissions ORDER BY resource, action, name ASC'
  );
  res.json(rows);
}));

/**
 * GET /api/permissions/:id
 * Get a single permission
 */
router.get('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM permissions WHERE id = $1', [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Permission not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * POST /api/permissions
 * Create a new permission
 */
router.post('/', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { name, resource, action } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Missing required field: name',
      code: 'VALIDATION_ERROR'
    });
  }

  const { rows } = await pool.query(
    'INSERT INTO permissions (name, resource, action) VALUES ($1, $2, $3) RETURNING *',
    [name, resource || null, action || null]
  );

  res.status(201).json(rows[0]);
}));

/**
 * PATCH /api/permissions/:id
 * Update a permission
 */
router.patch('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, resource, action } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (resource !== undefined) updates.resource = resource;
  if (action !== undefined) updates.action = action;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update', code: 'VALIDATION_ERROR' });
  }

  const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = Object.values(updates);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE permissions SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Permission not found', code: 'NOT_FOUND' });
  }

  res.json(rows[0]);
}));

/**
 * DELETE /api/permissions/:id
 * Delete a permission
 */
router.delete('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if permission is assigned to any roles
  const { rows } = await pool.query(
    'SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = $1',
    [id]
  );

  if (parseInt(rows[0].count) > 0) {
    return res.status(400).json({
      error: 'Cannot delete permission that is assigned to roles',
      code: 'PERMISSION_IN_USE'
    });
  }

  const { rowCount } = await pool.query('DELETE FROM permissions WHERE id = $1', [id]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Permission not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true });
}));

module.exports = router;

