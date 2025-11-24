/**
 * Authentication Routes
 * 
 * Handles user registration, login, token refresh, and email verification
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, generateAccessToken, generateRefreshToken, refreshAccessToken } = require('../middleware/auth');
const { getPool } = require('../config/database');
const { sendVerificationCode } = require('../services/emailService');

const pool = getPool();

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password, first_name, last_name } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({
      error: 'Missing required fields: username, email, password',
      code: 'VALIDATION_ERROR'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters',
      code: 'VALIDATION_ERROR'
    });
  }

  // Check if user exists
  const { rows: existingUsers } = await pool.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );

  if (existingUsers.length > 0) {
    return res.status(409).json({
      error: 'User with this email or username already exists',
      code: 'DUPLICATE'
    });
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Generate 6-digit verification code
  const verification_code = generateVerificationCode();
  const verification_code_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Generate email verification token (for backward compatibility)
  const email_verification_token = crypto.randomBytes(32).toString('hex');

  // Create user
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password_hash, first_name, last_name, email_verification_token, verification_code, verification_code_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, username, email, first_name, last_name, created_at`,
    [username, email, password_hash, first_name || null, last_name || null, email_verification_token, verification_code, verification_code_expires_at]
  );

  // Send verification email with 6-digit code
  try {
    await sendVerificationCode(email, verification_code, username);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't fail registration if email fails, but log it
    // User can request resend later
  }

  res.status(201).json({
    user: rows[0],
    message: 'Registration successful. Please check your email for the verification code.'
  });
}));

/**
 * POST /api/auth/login
 * Login user and return JWT tokens
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
      code: 'VALIDATION_ERROR'
    });
  }

  // Find user
  const { rows } = await pool.query(
    'SELECT id, username, email, password_hash, is_active, email_verified FROM users WHERE email = $1',
    [email]
  );

  if (!rows.length) {
    return res.status(401).json({
      error: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS'
    });
  }

  const user = rows[0];

  if (!user.is_active) {
    return res.status(403).json({
      error: 'Account is deactivated',
      code: 'ACCOUNT_DEACTIVATED'
    });
  }

  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    return res.status(401).json({
      error: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check if email is verified - user must verify email before logging in
  if (!user.email_verified) {
    return res.status(403).json({
      error: 'Please verify your email address before logging in. Check your inbox for the verification code.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  // Update last login
  await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = await generateRefreshToken(user.id);

  // Get user roles
  const { rows: roleRows } = await pool.query(
    `SELECT r.name 
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [user.id]
  );

  const roles = roleRows.map(row => row.name);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      email_verified: user.email_verified,
      roles
    },
    access_token: accessToken,
    refresh_token: refreshToken
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      error: 'Refresh token is required',
      code: 'VALIDATION_ERROR'
    });
  }

  try {
    const accessToken = await refreshAccessToken(refresh_token);
    res.json({
      access_token: accessToken,
      refresh_token: refresh_token // Return same refresh token (or generate new one if rotating)
    });
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
}));

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token)
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const refreshToken = req.body.refresh_token;

  if (refreshToken) {
    // Delete refresh token from database
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  }

  res.json({ message: 'Logged out successfully' });
}));

/**
 * POST /api/auth/verify-code
 * Verify email address using 6-digit verification code
 */
router.post('/verify-code', asyncHandler(async (req, res) => {
  const { code, email } = req.body;

  if (!code || !email) {
    return res.status(400).json({
      error: 'Verification code and email are required',
      code: 'VALIDATION_ERROR'
    });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({
      error: 'Verification code must be 6 digits',
      code: 'VALIDATION_ERROR'
    });
  }

  // Find user with matching code and email
  const { rows } = await pool.query(
    `SELECT id, verification_code_expires_at 
     FROM users 
     WHERE email = $1 AND verification_code = $2 AND email_verified = false`,
    [email, code]
  );

  if (!rows.length) {
    return res.status(400).json({
      error: 'Invalid verification code',
      code: 'INVALID_CODE'
    });
  }

  const user = rows[0];

  // Check if code has expired
  if (new Date() > new Date(user.verification_code_expires_at)) {
    return res.status(400).json({
      error: 'Verification code has expired. Please request a new one.',
      code: 'CODE_EXPIRED'
    });
  }

  // Verify the email
  await pool.query(
    `UPDATE users 
     SET email_verified = true, 
         verification_code = NULL, 
         verification_code_expires_at = NULL,
         email_verification_token = NULL 
     WHERE id = $1`,
    [user.id]
  );

  // Get full user info for token generation
  const { rows: userRows } = await pool.query(
    'SELECT id, username, email, email_verified FROM users WHERE id = $1',
    [user.id]
  );

  const verifiedUser = userRows[0];

  // Generate tokens and log user in automatically after verification
  const accessToken = generateAccessToken(verifiedUser.id);
  const refreshToken = await generateRefreshToken(verifiedUser.id);

  // Get user roles
  const { rows: roleRows } = await pool.query(
    `SELECT r.name 
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [verifiedUser.id]
  );

  const roles = roleRows.map(row => row.name);

  res.json({
    message: 'Email verified successfully',
    user: {
      id: verifiedUser.id,
      username: verifiedUser.username,
      email: verifiedUser.email,
      email_verified: verifiedUser.email_verified,
      roles
    },
    access_token: accessToken,
    refresh_token: refreshToken
  });
}));

/**
 * POST /api/auth/verify-email
 * Verify email address using verification token (legacy support)
 */
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      error: 'Verification token is required',
      code: 'VALIDATION_ERROR'
    });
  }

  const { rows } = await pool.query(
    'UPDATE users SET email_verified = true, email_verification_token = NULL WHERE email_verification_token = $1 RETURNING id',
    [token]
  );

  if (!rows.length) {
    return res.status(400).json({
      error: 'Invalid or expired verification token',
      code: 'INVALID_TOKEN'
    });
  }

  res.json({ message: 'Email verified successfully' });
}));

/**
 * POST /api/auth/resend-verification
 * Resend verification email with new 6-digit code
 */
router.post('/resend-verification', asyncHandler(async (req, res) => {
  const { email } = req.body;
  let userId;

  // If authenticated, use the authenticated user's ID
  // Otherwise, require email in body
  if (req.headers.authorization) {
    try {
      const auth = require('../middleware/auth');
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      userId = decoded.userId;
    } catch (err) {
      // If token is invalid, fall through to email-based lookup
    }
  }

  if (!userId && !email) {
    return res.status(400).json({
      error: 'Email is required',
      code: 'VALIDATION_ERROR'
    });
  }

  // Get user info
  let user;
  if (userId) {
    const { rows } = await pool.query(
      'SELECT id, email, username, email_verified FROM users WHERE id = $1',
      [userId]
    );
    if (!rows.length) {
      return res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND'
      });
    }
    user = rows[0];
  } else {
    const { rows } = await pool.query(
      'SELECT id, email, username, email_verified FROM users WHERE email = $1',
      [email]
    );
    if (!rows.length) {
      return res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND'
      });
    }
    user = rows[0];
  }

  if (user.email_verified) {
    return res.status(400).json({
      error: 'Email is already verified',
      code: 'ALREADY_VERIFIED'
    });
  }

  // Generate new 6-digit verification code
  const verification_code = generateVerificationCode();
  const verification_code_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Generate new verification token (for backward compatibility)
  const email_verification_token = crypto.randomBytes(32).toString('hex');

  await pool.query(
    `UPDATE users 
     SET verification_code = $1, 
         verification_code_expires_at = $2,
         email_verification_token = $3 
     WHERE id = $4`,
    [verification_code, verification_code_expires_at, email_verification_token, user.id]
  );

  // Send verification email
  try {
    await sendVerificationCode(user.email, verification_code, user.username);
    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    res.status(500).json({
      error: 'Failed to send verification email',
      code: 'EMAIL_ERROR'
    });
  }
}));

module.exports = router;

