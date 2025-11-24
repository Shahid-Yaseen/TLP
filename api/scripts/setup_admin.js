const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

(async () => {
  try {
    // Check/create admin role
    const roleResult = await pool.query("SELECT id FROM roles WHERE name = 'admin'");
    let roleId;
    
    if (roleResult.rows.length === 0) {
      const insertResult = await pool.query(
        "INSERT INTO roles (name, description) VALUES ('admin', 'Administrator role') RETURNING id"
      );
      roleId = insertResult.rows[0].id;
      console.log('✅ Created admin role');
    } else {
      roleId = roleResult.rows[0].id;
      console.log('✅ Admin role already exists');
    }

    // Get admin user
    const userResult = await pool.query("SELECT id FROM users WHERE email = 'admin@test.com'");
    
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, roleId]
      );
      console.log('✅ Assigned admin role to user');
      console.log('\n📝 Admin Login Credentials:');
      console.log('   Email: admin@test.com');
      console.log('   Password: admin123');
      console.log('\n🌐 Admin Dashboard URL: http://localhost:3001/admin');
    } else {
      console.log('⚠️  Admin user not found. Run: node scripts/create_admin_user.js');
    }

    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();

