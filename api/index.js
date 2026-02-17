/**
 * TLP Platform API Server
 * 
 * Main entry point for the backend API
 */

// Load .env file with explicit path
const path = require('path');
const fs = require('fs');

// Try multiple paths for .env file
const possiblePaths = [
  path.join(__dirname, '.env'),                  // api/.env (same directory as index.js)
  '/opt/tlp/api/.env',                           // Absolute path on server
  path.join(process.cwd(), '.env'),             // Current working directory
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`✅ Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  // Try default location
  require('dotenv').config();
  console.log('⚠️  Using default dotenv.config() - .env file may not be found');
}

// Debug: Show loaded DB config (without password)
console.log('🔍 Database Configuration:');
console.log('  DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('  DB_PORT:', process.env.DB_PORT || 'NOT SET');
console.log('  DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('  DB_DATABASE:', process.env.DB_DATABASE || 'NOT SET');
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');
console.log('');
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

// Import routes
const launchesRoutes = require('./routes/launches');
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const pollsRoutes = require('./routes/polls');
const spacebaseRoutes = require('./routes/spacebase');
const statisticsRoutes = require('./routes/statistics');
const usersRoutes = require('./routes/users');
const providersRoutes = require('./routes/providers');
const orbitsRoutes = require('./routes/orbits');
const launchSitesRoutes = require('./routes/launch_sites');
const authorsRoutes = require('./routes/authors');
const categoriesRoutes = require('./routes/categories');
const tagsRoutes = require('./routes/tags');
const trendingTopicsRoutes = require('./routes/trendingTopics');
const eventsRoutes = require('./routes/events');
const rolesRoutes = require('./routes/roles');
const permissionsRoutes = require('./routes/permissions');
const crewRoutes = require('./routes/crew');
const uploadRoutes = require('./routes/upload');
const satellitesRoutes = require('./routes/satellites');
const countriesRoutes = require('./routes/countries');
const stockTickersRoutes = require('./routes/stockTickers');
const subscriptionsRoutes = require('./routes/subscriptions');
const missionRoutes = require('./routes/mission');
const stockSync = require('./services/stockSync');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { getPool, closePool } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

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
app.use('/api/news/trending-topics', trendingTopicsRoutes);
app.use('/api/polls', pollsRoutes);
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
app.use('/api/upload', uploadRoutes);
app.use('/api/satellites', satellitesRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/stock-tickers', stockTickersRoutes);
app.use('/api', subscriptionsRoutes);
app.use('/api/mission', missionRoutes);

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
// Listen on 0.0.0.0 to accept connections from all network interfaces (including mobile devices)
app.listen(PORT, '0.0.0.0', () => {
  console.log('═'.repeat(60));
  console.log('🚀 TLP Platform API Server');
  console.log('═'.repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Listening on all interfaces (0.0.0.0:${PORT})`);
  console.log(`   Accessible from: http://localhost:${PORT}`);
  console.log(`   Accessible from network: http://YOUR_IP:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DB_DATABASE || 'tlp_db'}@${process.env.DB_HOST || 'localhost'}`);
  console.log('═'.repeat(60));
  console.log('Available endpoints:');
  console.log('  GET  /health - API health check');
  console.log('  GET  /db-health - Database health check');
  console.log('');

  // Automatically set up cron job for launch sync (only in production, non-blocking)
  if (process.env.NODE_ENV === 'production' || process.env.AUTO_SETUP_CRON === 'true') {
    const setupScript = path.join(__dirname, 'scripts', 'setup_cron_on_deploy.sh');
    if (fs.existsSync(setupScript)) {
      // Run in background, don't block server startup
      setTimeout(() => {
        console.log('🔄 Setting up automatic launch sync cron job...');
        exec(`bash ${setupScript}`, { cwd: __dirname, timeout: 10000 }, (error, stdout, stderr) => {
          if (error) {
            // Don't log errors that might spam - just note it
            if (!error.message.includes('timeout')) {
              console.log('⚠️  Cron setup: Run manually with: npm run setup:cron');
            }
          } else {
            console.log('✅ Cron job configured automatically');
            if (stdout) console.log(stdout.trim());
          }
        });
      }, 2000); // Wait 2 seconds after server starts
    }
  }
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

// Initialize stock ticker sync
stockSync.initStockSync();

module.exports = app;

