/**
 * Error Handling Middleware
 */

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          error: 'Resource already exists',
          code: 'DUPLICATE',
          details: err.detail
        });
      case '23503': // Foreign key violation
        return res.status(400).json({
          error: 'Invalid reference',
          code: 'FOREIGN_KEY_VIOLATION',
          details: err.detail
        });
      case '23502': // Not null violation
        return res.status(400).json({
          error: 'Required field missing',
          code: 'NOT_NULL_VIOLATION',
          details: err.detail
        });
      default:
        console.error('Database error details:', {
          code: err.code,
          message: err.message,
          detail: err.detail,
          hint: err.hint,
          position: err.position
        });
        return res.status(500).json({
          error: 'Database error',
          code: 'DB_ERROR',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined,
          dbCode: process.env.NODE_ENV === 'development' ? err.code : undefined
        });
    }
  }

  // JWT errors
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

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors || err.message
    });
  }

  // Default error
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * 404 handler
 */
const notFound = (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
};

