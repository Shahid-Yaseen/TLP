/**
 * Application Constants
 * 
 * Centralized configuration constants
 */

module.exports = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_LAUNCH_PAGE_SIZE: 100,

  // JWT
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

  // Password validation
  MIN_PASSWORD_LENGTH: 8,

  // Article statuses
  ARTICLE_STATUS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
  },

  // Launch outcomes
  LAUNCH_OUTCOME: {
    SUCCESS: 'success',
    FAILURE: 'failure',
    PARTIAL: 'partial',
    TBD: 'TBD',
  },

  // User roles
  ROLES: {
    ADMIN: 'admin',
    WRITER: 'writer',
    MODERATOR: 'moderator',
    USER: 'user',
  },

  // Astronaut statuses
  ASTRONAUT_STATUS: {
    ACTIVE: 'active',
    RETIRED: 'retired',
    DECEASED: 'deceased',
  },

  // Stream statuses
  STREAM_STATUS: {
    LIVE: 'live',
    OFFLINE: 'offline',
    COMING_SOON: 'coming_soon',
  },

  // Event statuses
  EVENT_STATUS: {
    TBD: 'TBD',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    NEVER: 'never',
  },

  // Featured sections
  FEATURED_SECTIONS: {
    HOMEPAGE: 'homepage',
    NEWS: 'news',
    LAUNCH_CENTER: 'launch_center',
    SPACEBASE: 'spacebase',
  },

  // Content types for featured content
  CONTENT_TYPES: {
    LAUNCH: 'launch',
    ARTICLE: 'article',
    EVENT: 'event',
    ASTRONAUT: 'astronaut',
    ROCKET: 'rocket',
  },
};

