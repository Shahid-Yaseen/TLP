/**
 * Statistics and Featured Content Routes
 * 
 * Handles launch statistics, featured content, and aggregate data
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');
const { getPool } = require('../config/database');

const pool = getPool();

/**
 * GET /api/statistics/launches/detailed
 * Get comprehensive launch statistics for admin dashboard
 * Returns all metrics needed for charts and detailed analysis
 */
router.get('/launches/detailed', optionalAuth, asyncHandler(async (req, res) => {
  try {
    // Overall metrics
    // Check if raw_data column exists first
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'launches' AND column_name = 'raw_data'
    `);
    const hasRawDataColumn = columnCheck.rows.length > 0;
    
    const rawDataFilter = hasRawDataColumn 
      ? `COUNT(*) FILTER (WHERE raw_data IS NOT NULL) as launches_with_raw_data,`
      : `0 as launches_with_raw_data,`;
    
    const overallMetrics = await pool.query(`
      SELECT 
        COUNT(*) as total_launches,
        COUNT(*) FILTER (WHERE outcome = 'success') as total_successes,
        COUNT(*) FILTER (WHERE outcome = 'failure') as total_failures,
        COUNT(*) FILTER (WHERE outcome = 'partial') as total_partial_failures,
        COUNT(*) FILTER (WHERE outcome = 'TBD' OR outcome IS NULL) as total_tbd,
        COUNT(*) FILTER (WHERE is_featured = true) as featured_launches,
        ${rawDataFilter}
        COUNT(*) FILTER (WHERE launch_date >= NOW() - INTERVAL '7 days') as launches_last_7_days,
        COUNT(*) FILTER (WHERE launch_date >= NOW() - INTERVAL '30 days') as launches_last_30_days,
        COUNT(*) FILTER (WHERE launch_date >= NOW() - INTERVAL '90 days') as launches_last_90_days,
        ROUND(
          (COUNT(*) FILTER (WHERE outcome = 'success')::NUMERIC / 
           NULLIF(COUNT(*) FILTER (WHERE outcome IN ('success', 'failure', 'partial')), 0)) * 100, 
          2
        ) as success_rate
      FROM launches
    `);

    // Statistics by year
    const byYear = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM launch_date)::INTEGER as year,
        COUNT(*) as total_launches,
        COUNT(*) FILTER (WHERE outcome = 'success') as successes,
        COUNT(*) FILTER (WHERE outcome = 'failure') as failures,
        COUNT(*) FILTER (WHERE outcome = 'partial') as partial_failures,
        COUNT(*) FILTER (WHERE outcome = 'TBD' OR outcome IS NULL) as tbd
      FROM launches
      WHERE launch_date IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM launch_date)
      ORDER BY year DESC
      LIMIT 20
    `);

    // Statistics by month (last 12 months)
    const byMonth = await pool.query(`
      SELECT 
        TO_CHAR(launch_date, 'YYYY-MM') as month,
        EXTRACT(YEAR FROM launch_date)::INTEGER as year,
        EXTRACT(MONTH FROM launch_date)::INTEGER as month_num,
        COUNT(*) as total_launches,
        COUNT(*) FILTER (WHERE outcome = 'success') as successes,
        COUNT(*) FILTER (WHERE outcome = 'failure') as failures
      FROM launches
      WHERE launch_date >= NOW() - INTERVAL '12 months'
        AND launch_date IS NOT NULL
      GROUP BY TO_CHAR(launch_date, 'YYYY-MM'), EXTRACT(YEAR FROM launch_date), EXTRACT(MONTH FROM launch_date)
      ORDER BY year DESC, month_num DESC
    `);

    // Statistics by day of week
    const byDayOfWeek = await pool.query(`
      SELECT 
        EXTRACT(DOW FROM launch_date)::INTEGER as day_of_week,
        TO_CHAR(launch_date, 'Day') as day_name,
        COUNT(*) as total_launches
      FROM launches
      WHERE launch_date IS NOT NULL
      GROUP BY EXTRACT(DOW FROM launch_date), TO_CHAR(launch_date, 'Day')
      ORDER BY day_of_week
    `);

    // Statistics by provider
    const byProvider = await pool.query(`
      SELECT 
        providers.id,
        providers.name as provider_name,
        providers.abbrev as provider_abbrev,
        COUNT(*) as total_launches,
        COUNT(*) FILTER (WHERE launches.outcome = 'success') as successes,
        COUNT(*) FILTER (WHERE launches.outcome = 'failure') as failures,
        COUNT(*) FILTER (WHERE launches.outcome = 'partial') as partial_failures,
        ROUND(
          (COUNT(*) FILTER (WHERE launches.outcome = 'success')::NUMERIC / 
           NULLIF(COUNT(*) FILTER (WHERE launches.outcome IN ('success', 'failure', 'partial')), 0)) * 100, 
          2
        ) as success_rate
      FROM launches
      JOIN providers ON launches.provider_id = providers.id
      GROUP BY providers.id, providers.name, providers.abbrev
      ORDER BY total_launches DESC
      LIMIT 20
    `);

    // Statistics by rocket
    const byRocket = await pool.query(`
      SELECT 
        rockets.id,
        rockets.name as rocket_name,
        COUNT(*) as total_launches,
        COUNT(*) FILTER (WHERE launches.outcome = 'success') as successes,
        COUNT(*) FILTER (WHERE launches.outcome = 'failure') as failures,
        ROUND(
          (COUNT(*) FILTER (WHERE launches.outcome = 'success')::NUMERIC / 
           NULLIF(COUNT(*) FILTER (WHERE launches.outcome IN ('success', 'failure', 'partial')), 0)) * 100, 
          2
        ) as success_rate
      FROM launches
      JOIN rockets ON launches.rocket_id = rockets.id
      GROUP BY rockets.id, rockets.name
      ORDER BY total_launches DESC
      LIMIT 20
    `);

    // Statistics by launch site
    const bySite = await pool.query(`
      SELECT 
        launch_sites.id,
        launch_sites.name as site_name,
        launch_sites.country as site_country,
        COUNT(*) as total_launches,
        COUNT(*) FILTER (WHERE launches.outcome = 'success') as successes,
        COUNT(*) FILTER (WHERE launches.outcome = 'failure') as failures
      FROM launches
      JOIN launch_sites ON launches.site_id = launch_sites.id
      GROUP BY launch_sites.id, launch_sites.name, launch_sites.country
      ORDER BY total_launches DESC
      LIMIT 20
    `);

    // Statistics by orbit
    const byOrbit = await pool.query(`
      SELECT 
        orbits.id,
        orbits.code as orbit_code,
        orbits.description as orbit_name,
        COUNT(*) as total_launches,
        COUNT(*) FILTER (WHERE launches.outcome = 'success') as successes,
        COUNT(*) FILTER (WHERE launches.outcome = 'failure') as failures
      FROM launches
      JOIN orbits ON launches.orbit_id = orbits.id
      GROUP BY orbits.id, orbits.code, orbits.description
      ORDER BY total_launches DESC
    `);

    // Launch attempt statistics
    const attemptStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE orbital_launch_attempt_count IS NOT NULL) as launches_with_attempt_count,
        AVG(orbital_launch_attempt_count) FILTER (WHERE orbital_launch_attempt_count IS NOT NULL) as avg_orbital_attempts,
        MAX(orbital_launch_attempt_count) as max_orbital_attempts,
        AVG(location_launch_attempt_count) FILTER (WHERE location_launch_attempt_count IS NOT NULL) as avg_location_attempts,
        AVG(pad_launch_attempt_count) FILTER (WHERE pad_launch_attempt_count IS NOT NULL) as avg_pad_attempts,
        AVG(agency_launch_attempt_count) FILTER (WHERE agency_launch_attempt_count IS NOT NULL) as avg_agency_attempts
      FROM launches
    `);

    // Data completeness metrics
    const rawDataCompleteness = hasRawDataColumn
      ? `COUNT(*) FILTER (WHERE raw_data IS NOT NULL) as has_raw_data,`
      : `0 as has_raw_data,`;
    
    const dataCompleteness = await pool.query(`
      SELECT 
        COUNT(*) as total_launches,
        ${rawDataCompleteness}
        COUNT(*) FILTER (WHERE status_json IS NOT NULL) as has_status_json,
        COUNT(*) FILTER (WHERE rocket_json IS NOT NULL) as has_rocket_json,
        COUNT(*) FILTER (WHERE mission_json IS NOT NULL) as has_mission_json,
        COUNT(*) FILTER (WHERE pad_json IS NOT NULL) as has_pad_json,
        COUNT(*) FILTER (WHERE image_json IS NOT NULL) as has_image_json,
        COUNT(*) FILTER (WHERE external_id IS NOT NULL) as has_external_id,
        COUNT(*) FILTER (WHERE slug IS NOT NULL) as has_slug,
        COUNT(*) FILTER (WHERE details IS NOT NULL) as has_details,
        COUNT(*) FILTER (WHERE mission_description IS NOT NULL) as has_mission_description
      FROM launches
    `);

    // Status distribution
    const statusDistribution = await pool.query(`
      SELECT 
        launch_statuses.id,
        launch_statuses.name as status_name,
        launch_statuses.abbrev as status_abbrev,
        COUNT(*) as count
      FROM launches
      LEFT JOIN launch_statuses ON launches.status_id = launch_statuses.id
      GROUP BY launch_statuses.id, launch_statuses.name, launch_statuses.abbrev
      ORDER BY count DESC
    `);

    // Timeline trends with growth
    const timelineTrends = await pool.query(`
      WITH monthly_data AS (
        SELECT 
          TO_CHAR(launch_date, 'YYYY-MM') as month,
          EXTRACT(YEAR FROM launch_date)::INTEGER as year,
          EXTRACT(MONTH FROM launch_date)::INTEGER as month_num,
          COUNT(*) as launches
        FROM launches
        WHERE launch_date >= NOW() - INTERVAL '24 months'
          AND launch_date IS NOT NULL
        GROUP BY TO_CHAR(launch_date, 'YYYY-MM'), EXTRACT(YEAR FROM launch_date), EXTRACT(MONTH FROM launch_date)
      )
      SELECT 
        month,
        year,
        month_num,
        launches,
        LAG(launches) OVER (ORDER BY year, month_num) as previous_month_launches,
        CASE 
          WHEN LAG(launches) OVER (ORDER BY year, month_num) > 0 
          THEN ROUND(((launches - LAG(launches) OVER (ORDER BY year, month_num))::NUMERIC / 
                      LAG(launches) OVER (ORDER BY year, month_num)) * 100, 2)
          ELSE NULL
        END as growth_percentage
      FROM monthly_data
      ORDER BY year DESC, month_num DESC
    `);

    // Earliest and latest launches
    const dateRange = await pool.query(`
      SELECT 
        MIN(launch_date) as earliest_launch,
        MAX(launch_date) as latest_launch,
        COUNT(*) FILTER (WHERE launch_date < NOW()) as historical_launches,
        COUNT(*) FILTER (WHERE launch_date >= NOW()) as upcoming_launches
      FROM launches
      WHERE launch_date IS NOT NULL
    `);

    res.json({
      overall: overallMetrics.rows[0] || {},
      by_year: byYear.rows,
      by_month: byMonth.rows,
      by_day_of_week: byDayOfWeek.rows,
      by_provider: byProvider.rows,
      by_rocket: byRocket.rows,
      by_site: bySite.rows,
      by_orbit: byOrbit.rows,
      attempt_statistics: attemptStats.rows[0] || {},
      data_completeness: dataCompleteness.rows[0] || {},
      status_distribution: statusDistribution.rows,
      timeline_trends: timelineTrends.rows,
      date_range: dateRange.rows[0] || {},
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching detailed launch statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics', 
      message: error.message 
    });
  }
}));

/**
 * GET /api/statistics/launches
 * Get launch statistics with optional filtering
 */
router.get('/launches', optionalAuth, asyncHandler(async (req, res) => {
  const { year, provider_id, group_by } = req.query;

  let sql = '';
  let params = [];

  if (group_by === 'year') {
    // Statistics grouped by year
    sql = `
      SELECT 
        EXTRACT(YEAR FROM launch_date)::INTEGER as year,
        COUNT(*) as total_launches,
        COUNT(*) FILTER (WHERE outcome = 'success') as total_successes,
        COUNT(*) FILTER (WHERE outcome = 'failure') as total_failures,
        COUNT(*) FILTER (WHERE outcome = 'partial') as total_partial_failures
      FROM launches
      WHERE 1=1
    `;

    if (provider_id) {
      sql += ' AND provider_id = $1';
      params.push(parseInt(provider_id));
    }

    sql += ' GROUP BY EXTRACT(YEAR FROM launch_date) ORDER BY year DESC';
  } else if (group_by === 'provider') {
    // Statistics grouped by provider
    sql = `
      SELECT 
        providers.id,
        providers.name as provider_name,
        COUNT(*) as total_launches,
        COUNT(*) FILTER (WHERE launches.outcome = 'success') as total_successes,
        COUNT(*) FILTER (WHERE launches.outcome = 'failure') as total_failures,
        COUNT(*) FILTER (WHERE launches.outcome = 'partial') as total_partial_failures
      FROM launches
      JOIN providers ON launches.provider_id = providers.id
      WHERE 1=1
    `;

    if (year) {
      sql += ' AND EXTRACT(YEAR FROM launch_date) = $1';
      params.push(parseInt(year));
    }

    sql += ' GROUP BY providers.id, providers.name ORDER BY total_launches DESC';
  } else {
    // Overall statistics
    sql = `
      SELECT 
        COUNT(*) as total_launches,
        COUNT(*) FILTER (WHERE outcome = 'success') as total_successes,
        COUNT(*) FILTER (WHERE outcome = 'failure') as total_failures,
        COUNT(*) FILTER (WHERE outcome = 'partial') as total_partial_failures,
        COUNT(*) FILTER (WHERE outcome = 'TBD' OR outcome IS NULL) as total_tbd
      FROM launches
      WHERE 1=1
    `;

    if (year) {
      sql += ' AND EXTRACT(YEAR FROM launch_date) = $1';
      params.push(parseInt(year));
    }

    if (provider_id) {
      sql += year ? ' AND provider_id = $2' : ' AND provider_id = $1';
      params.push(parseInt(provider_id));
    }
  }

  const { rows } = await pool.query(sql, params);

  if (group_by) {
    res.json({ data: rows });
  } else {
    res.json(rows[0] || {
      total_launches: 0,
      total_successes: 0,
      total_failures: 0,
      total_partial_failures: 0,
      total_tbd: 0
    });
  }
}));

/**
 * GET /api/featured
 * Get featured content by section
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { section, content_type, active } = req.query;

  const filters = [];
  const args = [];
  let paramCount = 1;

  if (section) {
    filters.push(`featured_content.featured_section = $${paramCount++}`);
    args.push(section);
  }

  if (content_type) {
    filters.push(`featured_content.content_type = $${paramCount++}`);
    args.push(content_type);
  }

  // Default to active only if not specified
  const isActive = active !== 'false';
  if (isActive) {
    filters.push(`featured_content.is_active = $${paramCount++}`);
    args.push(true);
  }

  // Check date range
  filters.push(`(
    featured_content.start_date IS NULL OR featured_content.start_date <= NOW()
  )`);
  filters.push(`(
    featured_content.end_date IS NULL OR featured_content.end_date >= NOW()
  )`);

  let sql = `
    SELECT 
      featured_content.*
    FROM featured_content
    WHERE ${filters.join(' AND ')}
    ORDER BY featured_content.priority DESC, featured_content.created_at DESC
  `;

  const { rows } = await pool.query(sql, args);

  // Fetch actual content for each featured entry
  for (const featured of rows) {
    let contentQuery = '';
    let contentParams = [];

    switch (featured.content_type) {
      case 'launch':
        contentQuery = `
          SELECT launches.*, providers.name as provider, rockets.name as rocket
          FROM launches
          LEFT JOIN providers ON launches.provider_id = providers.id
          LEFT JOIN rockets ON launches.rocket_id = rockets.id
          WHERE launches.id = $1
        `;
        break;
      case 'article':
        contentQuery = `
          SELECT news_articles.*, authors.full_name as author_name
          FROM news_articles
          LEFT JOIN authors ON news_articles.author_id = authors.id
          WHERE news_articles.id = $1
        `;
        break;
      case 'event':
        contentQuery = 'SELECT * FROM events WHERE id = $1';
        break;
      default:
        featured.content = null;
        continue;
    }

    contentParams = [featured.content_id];
    const { rows: contentRows } = await pool.query(contentQuery, contentParams);
    featured.content = contentRows[0] || null;
  }

  res.json({
    data: rows,
    section: section || 'all',
    count: rows.length
  });
}));

/**
 * GET /api/featured/:section
 * Get featured content for a specific section
 */
router.get('/:section', optionalAuth, asyncHandler(async (req, res) => {
  req.query.section = req.params.section;
  // Use the main GET handler
  const { section } = req.params;
  const { content_type, active } = req.query;

  const filters = [`featured_content.featured_section = $1`];
  const args = [section];
  let paramCount = 2;

  if (content_type) {
    filters.push(`featured_content.content_type = $${paramCount++}`);
    args.push(content_type);
  }

  const isActive = active !== 'false';
  if (isActive) {
    filters.push(`featured_content.is_active = $${paramCount++}`);
    args.push(true);
  }

  filters.push(`(featured_content.start_date IS NULL OR featured_content.start_date <= NOW())`);
  filters.push(`(featured_content.end_date IS NULL OR featured_content.end_date >= NOW())`);

  const { rows } = await pool.query(`
    SELECT featured_content.*
    FROM featured_content
    WHERE ${filters.join(' AND ')}
    ORDER BY featured_content.priority DESC, featured_content.created_at DESC
  `, args);

  // Fetch actual content
  for (const featured of rows) {
    let contentQuery = '';
    switch (featured.content_type) {
      case 'launch':
        contentQuery = `
          SELECT launches.*, providers.name as provider, rockets.name as rocket
          FROM launches
          LEFT JOIN providers ON launches.provider_id = providers.id
          LEFT JOIN rockets ON launches.rocket_id = rockets.id
          WHERE launches.id = $1
        `;
        break;
      case 'article':
        contentQuery = `
          SELECT news_articles.*, authors.full_name as author_name
          FROM news_articles
          LEFT JOIN authors ON news_articles.author_id = authors.id
          WHERE news_articles.id = $1
        `;
        break;
      case 'event':
        contentQuery = 'SELECT * FROM events WHERE id = $1';
        break;
      default:
        featured.content = null;
        continue;
    }

    const { rows: contentRows } = await pool.query(contentQuery, [featured.content_id]);
    featured.content = contentRows[0] || null;
  }

  res.json({ data: rows, section, count: rows.length });
}));

module.exports = router;

