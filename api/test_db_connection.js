require('dotenv').config();
const { Pool } = require('pg');

console.log('Testing DB connection with config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: '[hidden]',
  database: process.env.DB_DATABASE,
});

(async () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  try {
    const { rows } = await pool.query('SELECT NOW()');
    console.log('DB CONNECTED:', rows);
    process.exit(0);
  } catch (err) {
    console.error('DB ERROR:', err);
    process.exit(1);
  }
})();

