/**
 * TLP Platform API Server
 * 
 * Main entry point for the backend API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const launchesRoutes = require('./routes/launches');
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const spacebaseRoutes = require('./routes/spacebase');
const statisticsRoutes = require('./routes/statistics');
const usersRoutes = require('./routes/users');
const providersRoutes = require('./routes/providers');
const orbitsRoutes = require('./routes/orbits');
const launchSitesRoutes = require('./routes/launch_sites');
const authorsRoutes = require('./routes/authors');
const categoriesRoutes = require('./routes/categories');
const tagsRoutes = require('./routes/tags');
const eventsRoutes = require('./routes/events');
const rolesRoutes = require('./routes/roles');
const permissionsRoutes = require('./routes/permissions');
const crewRoutes = require('./routes/crew');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { getPool, closePool } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get shared database pool
const pool = getPool();

// Health check routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TLP API'
  });
});

app.get('/db-health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ 
      status: 'db-ok',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'db-error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/launches', launchesRoutes);
app.use('/api/auth', authRoutes);
// Register more specific routes BEFORE general /api/news to avoid route conflicts
app.use('/api/news/categories', categoriesRoutes);
app.use('/api/news/tags', tagsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/spacebase', spacebaseRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/featured', statisticsRoutes); // Featured content uses statistics router
app.use('/api/users', usersRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/orbits', orbitsRoutes);
app.use('/api/launch-sites', launchSitesRoutes);
app.use('/api/authors', authorsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/crew', crewRoutes);

// Legacy /launches route for backward compatibility (will be removed later)
app.get('/launches', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT launches.*, providers.name as provider, rockets.name as rocket, 
             orbits.code as orbit, launch_sites.name as site
      FROM launches
      LEFT JOIN providers ON launches.provider_id = providers.id
      LEFT JOIN rockets ON launches.rocket_id = rockets.id
      LEFT JOIN orbits ON launches.orbit_id = orbits.id
      LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
      ORDER BY launches.launch_date ASC LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('═'.repeat(60));
  console.log('🚀 TLP Platform API Server');
  console.log('═'.repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DB_DATABASE || 'tlp_db'}@${process.env.DB_HOST || 'localhost'}`);
  console.log('═'.repeat(60));
  console.log('Available endpoints:');
  console.log('  GET  /health - API health check');
  console.log('  GET  /db-health - Database health check');
  console.log('');
  console.log('  📡 Launches:');
  console.log('    GET  /api/launches - Get all launches');
  console.log('    GET  /api/launches/:id - Get launch by ID');
  console.log('');
  console.log('  🔐 Authentication:');
  console.log('    POST /api/auth/register - Register new user');
  console.log('    POST /api/auth/login - Login user');
  console.log('');
  console.log('  📰 News:');
  console.log('    GET  /api/news - Get all articles');
  console.log('    GET  /api/news/:id - Get article by ID/slug');
  console.log('');
  console.log('  🚀 Spacebase:');
  console.log('    GET  /api/spacebase/astronauts - Get all astronauts');
  console.log('    GET  /api/spacebase/rockets - Get all rockets');
  console.log('    GET  /api/spacebase/agencies - Get all agencies');
  console.log('');
  console.log('  📊 Statistics:');
  console.log('    GET  /api/statistics/launches - Launch statistics');
  console.log('    GET  /api/featured - Featured content');
  console.log('');
  console.log('  ... see API_ENDPOINTS.md for full list');
  console.log('═'.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await closePool();
  process.exit(0);
});

module.exports = app;
