/**
 * Validation Utility Functions
 * 
 * Common validation helpers for request data
 */

/**
 * Validate required fields
 * @param {object} data - Data to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {object|null} Error object or null if valid
 */
function validateRequired(data, requiredFields) {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    return {
      error: `Missing required fields: ${missing.join(', ')}`,
      code: 'VALIDATION_ERROR',
      missing_fields: missing
    };
  }

  return null;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {object} options - Validation options
 * @returns {object|null} Error object or null if valid
 */
function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumbers = false,
    requireSpecial = false
  } = options;

  if (!password || typeof password !== 'string') {
    return {
      error: 'Password is required',
      code: 'VALIDATION_ERROR'
    };
  }

  if (password.length < minLength) {
    return {
      error: `Password must be at least ${minLength} characters`,
      code: 'VALIDATION_ERROR'
    };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      error: 'Password must contain at least one uppercase letter',
      code: 'VALIDATION_ERROR'
    };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return {
      error: 'Password must contain at least one lowercase letter',
      code: 'VALIDATION_ERROR'
    };
  }

  if (requireNumbers && !/\d/.test(password)) {
    return {
      error: 'Password must contain at least one number',
      code: 'VALIDATION_ERROR'
    };
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      error: 'Password must contain at least one special character',
      code: 'VALIDATION_ERROR'
    };
  }

  return null;
}

/**
 * Validate date range
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {object|null} Error object or null if valid
 */
function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) return null; // Optional validation

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return {
      error: 'Invalid start date',
      code: 'VALIDATION_ERROR'
    };
  }

  if (isNaN(end.getTime())) {
    return {
      error: 'Invalid end date',
      code: 'VALIDATION_ERROR'
    };
  }

  if (start > end) {
    return {
      error: 'Start date must be before end date',
      code: 'VALIDATION_ERROR'
    };
  }

  return null;
}

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized string
 */
function sanitizeString(str, maxLength = null) {
  if (!str || typeof str !== 'string') return '';
  
  let sanitized = str.trim();
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate pagination parameters
 * @param {object} query - Query parameters
 * @returns {object} { page, limit, offset }
 */
function validatePagination(query) {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 20, 100); // Max 100
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

module.exports = {
  validateRequired,
  isValidEmail,
  validatePassword,
  validateDateRange,
  sanitizeString,
  validatePagination,
};

