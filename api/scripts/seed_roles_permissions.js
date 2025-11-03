#!/usr/bin/env node

/**
 * Seed Roles and Permissions
 * 
 * Creates initial roles and permissions for the RBAC system.
 * Run this after running migrations.
 * 
 * Usage: node scripts/seed_roles_permissions.js
 */

require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'tlp_db',
});

const ROLES = [
  { name: 'admin', description: 'Administrator with full access' },
  { name: 'writer', description: 'Can create and edit articles (own drafts only)' },
  { name: 'moderator', description: 'Can moderate comments and content' },
  { name: 'user', description: 'Standard user with read-only access' },
];

const PERMISSIONS = [
  // Article permissions
  { name: 'create_article', resource: 'articles', action: 'create' },
  { name: 'edit_article', resource: 'articles', action: 'update' },
  { name: 'edit_own_article', resource: 'articles', action: 'update_own' },
  { name: 'publish_article', resource: 'articles', action: 'publish' },
  { name: 'delete_article', resource: 'articles', action: 'delete' },

  // Launch permissions
  { name: 'create_launch', resource: 'launches', action: 'create' },
  { name: 'edit_launch', resource: 'launches', action: 'update' },
  { name: 'delete_launch', resource: 'launches', action: 'delete' },

  // User management permissions
  { name: 'manage_users', resource: 'users', action: 'manage' },
  { name: 'manage_roles', resource: 'roles', action: 'manage' },
  { name: 'manage_permissions', resource: 'permissions', action: 'manage' },

  // Comment permissions
  { name: 'moderate_comments', resource: 'comments', action: 'moderate' },
  { name: 'approve_comments', resource: 'comments', action: 'approve' },
  { name: 'delete_comments', resource: 'comments', action: 'delete' },

  // Spacebase permissions
  { name: 'manage_spacebase', resource: 'spacebase', action: 'manage' },
  { name: 'manage_astronauts', resource: 'astronauts', action: 'manage' },
  { name: 'manage_rockets', resource: 'rockets', action: 'manage' },
  { name: 'manage_agencies', resource: 'agencies', action: 'manage' },

  // Featured content permissions
  { name: 'manage_featured', resource: 'featured_content', action: 'manage' },

  // Events permissions
  { name: 'manage_events', resource: 'events', action: 'manage' },
];

// Role-Permission mappings
const ROLE_PERMISSIONS = {
  admin: [
    'create_article',
    'edit_article',
    'edit_own_article',
    'publish_article',
    'delete_article',
    'create_launch',
    'edit_launch',
    'delete_launch',
    'manage_users',
    'manage_roles',
    'manage_permissions',
    'moderate_comments',
    'approve_comments',
    'delete_comments',
    'manage_spacebase',
    'manage_astronauts',
    'manage_rockets',
    'manage_agencies',
    'manage_featured',
    'manage_events',
  ],
  writer: [
    'create_article',
    'edit_own_article',
  ],
  moderator: [
    'moderate_comments',
    'approve_comments',
    'delete_comments',
  ],
  user: [], // No special permissions
};

async function seed() {
  try {
    await pool.query('BEGIN');

    console.log('🌱 Seeding roles and permissions...\n');

    // Insert roles
    const roleMap = {};
    for (const role of ROLES) {
      const { rows } = await pool.query(
        'INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id, name',
        [role.name, role.description]
      );
      roleMap[rows[0].name] = rows[0].id;
      console.log(`✅ Role: ${role.name} (ID: ${rows[0].id})`);
    }

    // Insert permissions
    const permissionMap = {};
    for (const permission of PERMISSIONS) {
      const { rows } = await pool.query(
        'INSERT INTO permissions (name, resource, action) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET resource = EXCLUDED.resource, action = EXCLUDED.action RETURNING id, name',
        [permission.name, permission.resource, permission.action]
      );
      permissionMap[rows[0].name] = rows[0].id;
    }
    console.log(`\n✅ Created ${PERMISSIONS.length} permissions\n`);

    // Assign permissions to roles
    for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleMap[roleName];
      if (!roleId) {
        console.warn(`⚠️  Role ${roleName} not found, skipping permissions`);
        continue;
      }

      for (const permissionName of permissionNames) {
        const permissionId = permissionMap[permissionName];
        if (!permissionId) {
          console.warn(`⚠️  Permission ${permissionName} not found, skipping`);
          continue;
        }

        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [roleId, permissionId]
        );
      }
      console.log(`✅ Assigned ${permissionNames.length} permissions to ${roleName}`);
    }

    await pool.query('COMMIT');
    console.log('\n✨ Roles and permissions seeded successfully!');
    console.log('\nRole Summary:');
    console.log('  - admin: Full system access');
    console.log('  - writer: Can create/edit own articles');
    console.log('  - moderator: Can moderate comments');
    console.log('  - user: Read-only access');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seed().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { seed };

