/**
 * Database Utility Functions
 * 
 * Common database operations and helpers
 */

const { Pool } = require('pg');

/**
 * Create a database connection pool
 */
function createPool() {
  return new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
}

/**
 * Build pagination query parts
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @returns {object} { limit, offset }
 */
function getPagination(page = 1, pageSize = 20) {
  const limit = Math.min(parseInt(pageSize) || 20, 100); // Max 100 items
  const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;
  return { limit, offset };
}

/**
 * Build pagination response
 * @param {number} total - Total items
 * @param {number} limit - Items per page
 * @param {number} offset - Current offset
 * @param {number} count - Current page item count
 */
function buildPaginationResponse(total, limit, offset, count) {
  return {
    total: parseInt(total),
    limit,
    offset,
    page: Math.floor(offset / limit) + 1,
    total_pages: Math.ceil(total / limit),
    has_more: offset + count < total,
    has_previous: offset > 0
  };
}

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - Text to slugify
 * @returns {string} Slug
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores/hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate unique slug by appending number if exists
 * @param {Pool} pool - Database pool
 * @param {string} table - Table name
 * @param {string} slugColumn - Column name for slug
 * @param {string} baseSlug - Base slug
 * @param {number} excludeId - ID to exclude from check (for updates)
 * @returns {Promise<string>} Unique slug
 */
async function generateUniqueSlug(pool, table, slugColumn, baseSlug, excludeId = null) {
  let slug = slugify(baseSlug);
  let counter = 1;
  const originalSlug = slug;

  while (true) {
    let query = `SELECT id FROM ${table} WHERE ${slugColumn} = $1`;
    const params = [slug];

    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }

    const { rows } = await pool.query(query, params);

    if (rows.length === 0) {
      return slug;
    }

    slug = `${originalSlug}-${counter++}`;
  }
}

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate random token
 * @param {number} length - Token length in bytes (default 32)
 * @returns {string} Hex token
 */
function generateToken(length = 32) {
  return require('crypto').randomBytes(length).toString('hex');
}

module.exports = {
  createPool,
  getPagination,
  buildPaginationResponse,
  slugify,
  generateUniqueSlug,
  isValidEmail,
  generateToken,
};

