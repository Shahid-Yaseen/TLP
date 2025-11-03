/**
 * Authentication Routes
 * 
 * Handles user registration, login, token refresh, and email verification
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, generateAccessToken, generateRefreshToken, refreshAccessToken } = require('../middleware/auth');
const { getPool } = require('../config/database');

const pool = getPool();

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

  // Generate email verification token (simple for now, can enhance later)
  const email_verification_token = require('crypto').randomBytes(32).toString('hex');

  // Create user
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password_hash, first_name, last_name, email_verification_token)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, username, email, first_name, last_name, created_at`,
    [username, email, password_hash, first_name || null, last_name || null, email_verification_token]
  );

  // TODO: Send verification email

  res.status(201).json({
    user: rows[0],
    message: 'Registration successful. Please verify your email.'
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
 * POST /api/auth/verify-email
 * Verify email address using verification token
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
 * Resend verification email
 */
router.post('/resend-verification', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Generate new verification token
  const email_verification_token = require('crypto').randomBytes(32).toString('hex');

  await pool.query(
    'UPDATE users SET email_verification_token = $1 WHERE id = $2',
    [email_verification_token, userId]
  );

  // TODO: Send verification email

  res.json({ message: 'Verification email sent' });
}));

module.exports = router;

