/**
 * Authorization Middleware (RBAC)
 * 
 * Role-Based Access Control middleware for checking user permissions
 */

const { getPool } = require('../config/database');

const pool = getPool();

/**
 * Check if user has a specific role
 * Usage: authorize.role('admin')
 */
const role = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      });
    }

    try {
      // Get user roles
      const { rows: roleRows } = await pool.query(
        `SELECT r.name 
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1`,
        [req.user.id]
      );

      const userRoles = roleRows.map(row => row.name);

      // Check if user has any of the allowed roles
      const hasRole = allowedRoles.some(role => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
          required_roles: allowedRoles 
        });
      }

      // Attach roles to request for use in controllers
      req.user.roles = userRoles;
      next();
    } catch (err) {
      console.error('Authorization error:', err);
      res.status(500).json({ 
        error: 'Authorization check failed',
        code: 'AUTHZ_ERROR' 
      });
    }
  };
};

/**
 * Check if user has a specific permission
 * Usage: authorize.permission('publish_article')
 */
const permission = (...requiredPermissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      });
    }

    try {
      // Get user permissions through roles
      const { rows: permRows } = await pool.query(
        `SELECT DISTINCT p.name 
         FROM user_roles ur
         JOIN role_permissions rp ON ur.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE ur.user_id = $1`,
        [req.user.id]
      );

      const userPermissions = permRows.map(row => row.name);

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(perm => 
        userPermissions.includes(perm)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
          required_permissions: requiredPermissions 
        });
      }

      req.user.permissions = userPermissions;
      next();
    } catch (err) {
      console.error('Permission check error:', err);
      res.status(500).json({ 
        error: 'Permission check failed',
        code: 'PERM_ERROR' 
      });
    }
  };
};

/**
 * Check if user owns the resource or has admin role
 * Usage: authorize.owner('userId') or authorize.owner(req.body.user_id)
 */
const owner = (userIdField = 'user_id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      });
    }

    try {
      // Get user roles
      const { rows: roleRows } = await pool.query(
        `SELECT r.name 
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1`,
        [req.user.id]
      );

      const userRoles = roleRows.map(row => row.name);

      // Admin can access anything
      if (userRoles.includes('admin')) {
        req.user.roles = userRoles;
        return next();
      }

      // Get resource user ID from params or body
      const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];

      if (!resourceUserId) {
        return res.status(400).json({ 
          error: 'Resource user ID not found',
          code: 'BAD_REQUEST' 
        });
      }

      // Check if user owns the resource
      if (parseInt(resourceUserId) === req.user.id) {
        req.user.roles = userRoles;
        return next();
      }

      return res.status(403).json({ 
        error: 'Access denied. You can only access your own resources.',
        code: 'FORBIDDEN' 
      });
    } catch (err) {
      console.error('Ownership check error:', err);
      res.status(500).json({ 
        error: 'Ownership check failed',
        code: 'OWNER_ERROR' 
      });
    }
  };
};

/**
 * Combine multiple authorization checks
 * Usage: authorize.any([role('admin'), permission('edit_article')])
 */
const any = (checks) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      });
    }

    // Try each check - if any passes, allow access
    for (const check of checks) {
      try {
        await new Promise((resolve, reject) => {
          check(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        return next(); // One check passed
      } catch (err) {
        // Continue to next check
        continue;
      }
    }

    // All checks failed
    return res.status(403).json({ 
      error: 'Insufficient permissions',
      code: 'FORBIDDEN' 
    });
  };
};

module.exports = {
  role,
  permission,
  owner,
  any,
};

