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

