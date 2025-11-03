/**
 * Roles & Permissions Routes
 * 
 * Handles role and permission management (Admin only)
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { getPool } = require('../config/database');

const pool = getPool();

/**
 * GET /api/roles
 * Get all roles with their permissions
 */
router.get('/', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM roles ORDER BY name ASC');

  // Get permissions for each role
  for (const roleData of rows) {
    const { rows: permissionRows } = await pool.query(
      `SELECT p.id, p.name, p.resource, p.action
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1
       ORDER BY p.resource, p.name`,
      [roleData.id]
    );
    roleData.permissions = permissionRows;
  }

  res.json(rows);
}));

/**
 * GET /api/roles/:id
 * Get a single role with permissions
 */
router.get('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);

  if (!rows.length) {
    return res.status(404).json({ error: 'Role not found', code: 'NOT_FOUND' });
  }

  const roleData = rows[0];

  // Get permissions
  const { rows: permissionRows } = await pool.query(
    `SELECT p.id, p.name, p.resource, p.action
     FROM role_permissions rp
     JOIN permissions p ON rp.permission_id = p.id
     WHERE rp.role_id = $1
     ORDER BY p.resource, p.name`,
    [id]
  );
  roleData.permissions = permissionRows;

  res.json(roleData);
}));

/**
 * POST /api/roles
 * Create a new role
 */
router.post('/', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { name, description, permission_ids } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Missing required field: name',
      code: 'VALIDATION_ERROR'
    });
  }

  await pool.query('BEGIN');

  try {
    // Create role
    const { rows: roleRows } = await pool.query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );

    const roleData = roleRows[0];

    // Assign permissions if provided
    if (Array.isArray(permission_ids) && permission_ids.length > 0) {
      const values = permission_ids.map((pid, idx) => `($1, $${idx + 2})`).join(', ');
      const params = [roleData.id, ...permission_ids];
      
      await pool.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}
         ON CONFLICT DO NOTHING`,
        params
      );
    }

    await pool.query('COMMIT');

    // Fetch role with permissions
    const { rows: permissionRows } = await pool.query(
      `SELECT p.id, p.name, p.resource, p.action
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [roleData.id]
    );
    roleData.permissions = permissionRows;

    res.status(201).json(roleData);
  } catch (err) {
    await pool.query('ROLLBACK');
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({
        error: 'Role with this name already exists',
        code: 'DUPLICATE_ENTRY'
      });
    }
    throw err;
  }
}));

/**
 * PATCH /api/roles/:id
 * Update a role
 */
router.patch('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, permission_ids } = req.body;

  await pool.query('BEGIN');

  try {
    // Update role basic info
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = Object.values(updates);
      values.push(id);

      await pool.query(
        `UPDATE roles SET ${setClause} WHERE id = $${values.length} RETURNING *`,
        values
      );
    }

    // Update permissions if provided
    if (Array.isArray(permission_ids)) {
      // Delete existing permissions
      await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);

      // Add new permissions
      if (permission_ids.length > 0) {
        const values = permission_ids.map((pid, idx) => `($1, $${idx + 2})`).join(', ');
        const params = [id, ...permission_ids];
        
        await pool.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`,
          params
        );
      }
    }

    await pool.query('COMMIT');

    // Fetch updated role with permissions
    const { rows } = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    const roleData = rows[0];

    const { rows: permissionRows } = await pool.query(
      `SELECT p.id, p.name, p.resource, p.action
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [id]
    );
    roleData.permissions = permissionRows;

    res.json(roleData);
  } catch (err) {
    await pool.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Role with this name already exists',
        code: 'DUPLICATE_ENTRY'
      });
    }
    throw err;
  }
}));

/**
 * DELETE /api/roles/:id
 * Delete a role
 */
router.delete('/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if role is assigned to any users
  const { rows: userRows } = await pool.query(
    'SELECT COUNT(*) as count FROM user_roles WHERE role_id = $1',
    [id]
  );

  if (parseInt(userRows[0].count) > 0) {
    return res.status(400).json({
      error: 'Cannot delete role that is assigned to users',
      code: 'ROLE_IN_USE'
    });
  }

  const { rowCount } = await pool.query('DELETE FROM roles WHERE id = $1', [id]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Role not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true });
}));

/**
 * POST /api/users/:id/roles
 * Assign roles to a user
 */
router.post('/users/:id/roles', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role_ids } = req.body;

  if (!Array.isArray(role_ids)) {
    return res.status(400).json({
      error: 'role_ids must be an array',
      code: 'VALIDATION_ERROR'
    });
  }

  // Verify user exists
  const { rows: userRows } = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
  if (!userRows.length) {
    return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }

  // Remove existing roles and add new ones
  await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

  if (role_ids.length > 0) {
    const values = role_ids.map((rid, idx) => `($1, $${idx + 2})`).join(', ');
    const params = [id, ...role_ids];
    
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ${values}`,
      params
    );
  }

  res.json({ success: true, role_ids });
}));

/**
 * DELETE /api/users/:id/roles/:role_id
 * Remove a role from a user
 */
router.delete('/users/:id/roles/:role_id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id, role_id } = req.params;
  
  const { rowCount } = await pool.query(
    'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
    [id, role_id]
  );

  if (rowCount === 0) {
    return res.status(404).json({ error: 'User role not found', code: 'NOT_FOUND' });
  }

  res.json({ deleted: true });
}));

module.exports = router;

