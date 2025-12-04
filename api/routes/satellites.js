/**
 * Satellite API Routes
 * Endpoints for fetching satellite data from cache
 */

const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const satellite = require('satellite.js');
const { refreshCache } = require('../services/celestrakService');

const EARTH_RADIUS_KM = 6371;

/**
 * GET /api/satellites
 * Get filtered satellites with pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      type,
      constellation,
      status,
      location, // LEO, MEO, GEO
      search,
      limit = 1000,
      offset = 0
    } = req.query;

    const pool = getPool();
    let query = 'SELECT * FROM satellites_cache WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Apply filters
    if (type) {
      query += ` AND object_type = $${paramIndex}`;
      params.push(type.toUpperCase());
      paramIndex++;
    }

    if (constellation) {
      query += ` AND constellation = $${paramIndex}`;
      params.push(constellation.toUpperCase());
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status.toUpperCase());
      paramIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR international_designator ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Location filter based on altitude (from orbital_data)
    if (location) {
      const locationUpper = location.toUpperCase();
      if (locationUpper === 'LEO') {
        query += ` AND (orbital_data->>'perigee')::numeric < 2000`;
      } else if (locationUpper === 'MEO') {
        query += ` AND (orbital_data->>'perigee')::numeric >= 2000 AND (orbital_data->>'perigee')::numeric < 35786`;
      } else if (locationUpper === 'GEO') {
        query += ` AND (orbital_data->>'perigee')::numeric >= 35786`;
      }
    }

    // Add pagination
    query += ` ORDER BY norad_id LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(query, params);

    // Parse orbital_data JSONB
    const satellites = result.rows.map(row => ({
      ...row,
      orbital_data: typeof row.orbital_data === 'string' 
        ? JSON.parse(row.orbital_data) 
        : row.orbital_data
    }));

    res.json({
      success: true,
      data: satellites,
      count: satellites.length,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
  } catch (error) {
    console.error('[Satellites API] Error fetching satellites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch satellites',
      message: error.message
    });
  }
});

/**
 * GET /api/satellites/statistics
 * Get counts by status
 */
router.get('/statistics', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM satellites_cache
      GROUP BY status
    `);

    const stats = {
      ACTIVE: 0,
      INACTIVE: 0,
      DEBRIS: 0,
      OTHER: 0
    };

    result.rows.forEach(row => {
      const status = row.status?.toUpperCase();
      if (status in stats) {
        stats[status] = parseInt(row.count, 10);
      } else {
        stats.OTHER += parseInt(row.count, 10);
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Satellites API] Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/satellites/:norad_id
 * Get single satellite with full details
 */
router.get('/:norad_id', async (req, res) => {
  try {
    const { norad_id } = req.params;
    const pool = getPool();

    const result = await pool.query(
      'SELECT * FROM satellites_cache WHERE norad_id = $1',
      [parseInt(norad_id, 10)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Satellite not found'
      });
    }

    const sat = result.rows[0];
    
    // Parse orbital_data
    sat.orbital_data = typeof sat.orbital_data === 'string'
      ? JSON.parse(sat.orbital_data)
      : sat.orbital_data;

    // Calculate current position and velocity
    const now = new Date();
    const satrec = satellite.twoline2satrec(sat.tle_line1, sat.tle_line2);
    const positionAndVelocity = satellite.propagate(satrec, now);

    if (positionAndVelocity.position && !positionAndVelocity.error) {
      const positionEci = positionAndVelocity.position;
      const velocityEci = positionAndVelocity.velocity;
      const gmst = satellite.gstime(now);
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);

      sat.current_position = {
        altitude: Math.round(positionGd.height * 100) / 100,
        latitude: positionGd.latitude * (180 / Math.PI),
        longitude: positionGd.longitude * (180 / Math.PI)
      };

      const speed = Math.sqrt(
        velocityEci.x * velocityEci.x +
        velocityEci.y * velocityEci.y +
        velocityEci.z * velocityEci.z
      ) / 1000; // m/s to km/s

      sat.current_speed = Math.round(speed * 100) / 100;
    }

    res.json({
      success: true,
      data: sat
    });
  } catch (error) {
    console.error('[Satellites API] Error fetching satellite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch satellite',
      message: error.message
    });
  }
});

/**
 * GET /api/satellites/positions
 * Get current 3D positions for multiple satellites
 */
router.get('/positions', async (req, res) => {
  try {
    const { norad_ids, timestamp } = req.query;
    
    if (!norad_ids) {
      return res.status(400).json({
        success: false,
        error: 'norad_ids parameter is required'
      });
    }

    const noradIdArray = Array.isArray(norad_ids) 
      ? norad_ids.map(id => parseInt(id, 10))
      : norad_ids.split(',').map(id => parseInt(id.trim(), 10));

    const targetTime = timestamp ? new Date(timestamp) : new Date();
    const pool = getPool();

    const result = await pool.query(
      `SELECT norad_id, tle_line1, tle_line2 FROM satellites_cache 
       WHERE norad_id = ANY($1)`,
      [noradIdArray]
    );

    const positions = [];

    for (const row of result.rows) {
      try {
        const satrec = satellite.twoline2satrec(row.tle_line1, row.tle_line2);
        const positionAndVelocity = satellite.propagate(satrec, targetTime);

        if (positionAndVelocity.position && !positionAndVelocity.error) {
          const positionEci = positionAndVelocity.position;
          
          // Convert ECI to scene coordinates (scaled)
          // Scale: 1 unit = 1000 km
          const x = positionEci.x / 1000;
          const y = positionEci.y / 1000;
          const z = positionEci.z / 1000;

          positions.push({
            norad_id: row.norad_id,
            x,
            y,
            z,
            timestamp: targetTime.toISOString()
          });
        }
      } catch (error) {
        console.error(`[Satellites API] Error calculating position for ${row.norad_id}:`, error.message);
      }
    }

    res.json({
      success: true,
      data: positions,
      count: positions.length
    });
  } catch (error) {
    console.error('[Satellites API] Error fetching positions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch positions',
      message: error.message
    });
  }
});

/**
 * POST /api/satellites/refresh
 * Admin endpoint to trigger cache refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    // TODO: Add admin authentication check
    console.log('[Satellites API] Cache refresh requested');
    
    // Run refresh asynchronously
    refreshCache()
      .then(result => {
        console.log('[Satellites API] Cache refresh completed:', result);
      })
      .catch(error => {
        console.error('[Satellites API] Cache refresh failed:', error);
      });

    res.json({
      success: true,
      message: 'Cache refresh started. This may take several minutes.'
    });
  } catch (error) {
    console.error('[Satellites API] Error starting cache refresh:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start cache refresh',
      message: error.message
    });
  }
});

module.exports = router;

