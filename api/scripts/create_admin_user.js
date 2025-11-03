#!/usr/bin/env node

/**
 * Create Admin User Script
 * 
 * Creates or updates an admin user for testing
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { getPool } = require('../config/database');

const pool = getPool();

async function createAdminUser() {
  try {
    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // Create or update admin user
    const { rows: userRows } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@test.com']
    );
    
    let userId;
    if (userRows.length > 0) {
      userId = userRows[0].id;
      await pool.query(
        'UPDATE users SET password_hash = $1, is_active = true, email_verified = true WHERE id = $2',
        [passwordHash, userId]
      );
      console.log('✅ Updated existing admin user');
    } else {
      const { rows } = await pool.query(
        'INSERT INTO users (username, email, password_hash, is_active, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['admin', 'admin@test.com', passwordHash, true, true]
      );
      userId = rows[0].id;
      console.log('✅ Created admin user');
    }
    
    // Assign admin role
    const { rows: roleRows } = await pool.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    if (roleRows.length > 0) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, roleRows[0].id]
      );
      console.log('✅ Assigned admin role');
      console.log('\n📝 Admin credentials:');
      console.log('   Email: admin@test.com');
      console.log('   Password: admin123');
    } else {
      console.log('⚠️  Admin role not found. Run: npm run seed:roles');
    }
    
    await pool.end();
    console.log('\n✨ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };

