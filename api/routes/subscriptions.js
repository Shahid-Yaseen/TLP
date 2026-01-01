/**
 * Subscriptions Routes
 * 
 * Handles email subscriptions from coming soon pages
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { getPool } = require('../config/database');
const { sendUpdateEmail } = require('../services/emailService');

const pool = getPool();

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * POST /api/subscribe
 * Subscribe email (public endpoint)
 */
router.post('/subscribe', asyncHandler(async (req, res) => {
  const { email, source_page } = req.body;

  // Validation
  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
      code: 'VALIDATION_ERROR'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Invalid email format',
      code: 'VALIDATION_ERROR'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if subscription already exists
    const { rows: existing } = await pool.query(
      'SELECT id, is_active FROM subscriptions WHERE email = $1',
      [normalizedEmail]
    );

    if (existing.length > 0) {
      const subscription = existing[0];
      
      if (subscription.is_active) {
        // Already subscribed
        return res.status(200).json({
          success: true,
          message: 'You are already subscribed!',
          already_subscribed: true
        });
      } else {
        // Reactivate subscription
        await pool.query(
          `UPDATE subscriptions 
           SET is_active = true, 
               subscribed_at = NOW(), 
               unsubscribed_at = NULL,
               source_page = COALESCE($1, source_page),
               updated_at = NOW()
           WHERE id = $2`,
          [source_page || null, subscription.id]
        );

        return res.status(200).json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.',
          reactivated: true
        });
      }
    }

    // Create new subscription
    const { rows: newSubscription } = await pool.query(
      `INSERT INTO subscriptions (email, source_page, subscribed_at, is_active)
       VALUES ($1, $2, NOW(), true)
       RETURNING id, email, subscribed_at, source_page`,
      [normalizedEmail, source_page || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Successfully subscribed! We\'ll notify you when this page is ready.',
      subscription: newSubscription[0]
    });
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed!',
        already_subscribed: true
      });
    }

    console.error('Error creating subscription:', error);
    throw error;
  }
}));

/**
 * GET /api/subscribers
 * Get all subscribers (admin only)
 */
router.get('/subscribers', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { page = 1, perPage = 50, limit, offset, status, search, email, is_active, source_page } = req.query;
  
  // Handle both react-admin format (perPage, offset) and custom format (page, limit)
  const actualLimit = limit || perPage || 50;
  const actualOffset = offset !== undefined ? parseInt(offset) : (parseInt(page) - 1) * parseInt(actualLimit);

  let query = 'SELECT id, email, subscribed_at, unsubscribed_at, is_active, source_page, created_at, updated_at FROM subscriptions';
  const queryParams = [];
  const conditions = [];

  // Filter by status (is_active)
  if (is_active !== undefined) {
    conditions.push('is_active = $' + (queryParams.length + 1));
    queryParams.push(is_active === 'true' || is_active === true);
  } else if (status === 'active') {
    conditions.push('is_active = true');
  } else if (status === 'inactive') {
    conditions.push('is_active = false');
  }

  // Search by email (from filter or search param)
  const emailFilter = email || search;
  if (emailFilter) {
    conditions.push('email ILIKE $' + (queryParams.length + 1));
    queryParams.push(`%${emailFilter}%`);
  }

  // Filter by source_page
  if (source_page) {
    conditions.push('source_page = $' + (queryParams.length + 1));
    queryParams.push(source_page);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY subscribed_at DESC';
  query += ' LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
  queryParams.push(parseInt(actualLimit), actualOffset);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM subscriptions';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }
  const countParams = queryParams.slice(0, -2); // Remove limit and offset

  const [subscribersResult, countResult] = await Promise.all([
    pool.query(query, queryParams),
    pool.query(countQuery, countParams)
  ]);

  const total = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(total / actualLimit);

  return res.json({
    success: true,
    data: subscribersResult.rows,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(actualLimit),
      total,
      totalPages
    }
  });
}));

/**
 * GET /api/subscribers/stats
 * Get subscription statistics (admin only)
 */
router.get('/subscribers/stats', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const stats = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE is_active = true) as active_count,
      COUNT(*) FILTER (WHERE is_active = false) as inactive_count,
      COUNT(*) as total_count,
      COUNT(DISTINCT source_page) as source_pages_count
    FROM subscriptions
  `);

  const bySource = await pool.query(`
    SELECT 
      source_page,
      COUNT(*) as count
    FROM subscriptions
    WHERE is_active = true
    GROUP BY source_page
    ORDER BY count DESC
  `);

  return res.json({
    success: true,
    stats: stats.rows[0],
    bySource: bySource.rows
  });
}));

/**
 * POST /api/subscribers/send-update
 * Send update email to all active subscribers (admin only)
 */
router.post('/subscribers/send-update', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { subject, message } = req.body;

  // Validation
  if (!subject || !message) {
    return res.status(400).json({
      error: 'Subject and message are required',
      code: 'VALIDATION_ERROR'
    });
  }

  // Get all active subscribers
  const { rows: subscribers } = await pool.query(
    'SELECT email FROM subscriptions WHERE is_active = true'
  );

  if (subscribers.length === 0) {
    return res.status(400).json({
      error: 'No active subscribers found',
      code: 'NO_SUBSCRIBERS'
    });
  }

  // Convert message to HTML if it's plain text
  const htmlMessage = message.includes('<') ? message : message.replace(/\n/g, '<br>');
  
  // Send emails to all subscribers
  const emailPromises = subscribers.map(subscriber => 
    sendUpdateEmail(subscriber.email, subject, htmlMessage, message)
  );

  const results = await Promise.allSettled(emailPromises);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  // Log failed emails
  const failedEmails = [];
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      failedEmails.push({
        email: subscribers[index].email,
        error: result.reason?.message || 'Unknown error'
      });
    }
  });

  return res.json({
    success: true,
    message: `Update email sent to ${successful} subscribers`,
    stats: {
      total: subscribers.length,
      successful,
      failed
    },
    failed_emails: failedEmails.length > 0 ? failedEmails : undefined
  });
}));

module.exports = router;

