/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and attaches user information to request object
 */

const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');

const pool = getPool();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to authenticate requests using JWT
 * Adds req.user with user information if token is valid
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided',
        code: 'UNAUTHORIZED' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user from database
    const { rows } = await pool.query(
      'SELECT id, username, email, is_active, email_verified FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'UNAUTHORIZED' 
      });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN' 
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    console.error('Authentication error:', err);
    res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR' 
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Attaches req.user if token is valid, otherwise req.user is null
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const { rows } = await pool.query(
      'SELECT id, username, email, is_active, email_verified FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (rows.length && rows[0].is_active) {
      req.user = rows[0];
    } else {
      req.user = null;
    }
    
    next();
  } catch (err) {
    // If token is invalid, just continue without user
    req.user = null;
    next();
  }
};

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = async (userId) => {
  const token = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  return token;
};

/**
 * Verify refresh token and return new access token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if token exists in database and is not expired
    const { rows } = await pool.query(
      'SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (!rows.length) {
      throw new Error('Refresh token not found or expired');
    }

    const userId = rows[0].user_id;

    // Generate new access token
    return generateAccessToken(userId);
  } catch (err) {
    throw new Error('Invalid refresh token');
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  generateAccessToken,
  generateRefreshToken,
  refreshAccessToken,
};

