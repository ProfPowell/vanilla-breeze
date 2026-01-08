/**
 * @file Configuration
 * @description Environment-based configuration with validation
 */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Require environment variable (throws in production if missing)
 * @param {string} name - Environment variable name
 * @param {string | null} [devDefault] - Default value for development
 * @returns {string} Environment variable value
 * @throws {Error} If variable is missing in production
 */
function requireEnv(name, devDefault = null) {
  const value = process.env[name];
  if (!value) {
    if (isDev && devDefault !== null) {
      return devDefault;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Optional environment variable with default
 * @param {string} name - Environment variable name
 * @param {string} defaultValue - Default value if not set
 * @returns {string} Environment variable value or default
 */
function optionalEnv(name, defaultValue) {
  return process.env[name] || defaultValue;
}

/**
 * @typedef {Object} DbConfig
 * @property {string} url - Database connection URL
 */

/**
 * @typedef {Object} JwtConfig
 * @property {string} secret - JWT signing secret
 * @property {string} expiresIn - Access token expiration
 * @property {string} refreshExpiresIn - Refresh token expiration
 */

/**
 * @typedef {Object} RateLimitConfig
 * @property {number} windowMs - Rate limit window in milliseconds
 * @property {number} max - Maximum requests per window
 */

/**
 * @typedef {Object} CorsConfig
 * @property {string} origin - Allowed CORS origin
 */

/**
 * @typedef {Object} Argon2Config
 * @property {number} memoryCost - Memory cost parameter
 * @property {number} timeCost - Time cost parameter
 * @property {number} parallelism - Parallelism parameter
 */

/**
 * @typedef {Object} Config
 * @property {string} env - Current environment
 * @property {boolean} isDev - Whether in development mode
 * @property {number} port - Server port
 * @property {DbConfig} db - Database configuration
 * @property {JwtConfig} jwt - JWT configuration
 * @property {RateLimitConfig} rateLimit - Rate limiting configuration
 * @property {CorsConfig} cors - CORS configuration
 * @property {Argon2Config} argon2 - Password hashing configuration
 */

/** @type {Config} */
export const config = {
  env: process.env.NODE_ENV || 'development',
  isDev,
  port: parseInt(optionalEnv('PORT', '{{PORT}}'), 10),

  db: {
    url: requireEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/{{PROJECT_NAME}}'),
  },

  jwt: {
    secret: requireEnv('JWT_SECRET', 'dev-secret-change-in-production'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '15m'),
    refreshExpiresIn: optionalEnv('REFRESH_TOKEN_EXPIRES_IN', '7d'),
  },

  rateLimit: {
    windowMs: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '60000'), 10),
    max: parseInt(optionalEnv('RATE_LIMIT_MAX', '100'), 10),
  },

  cors: {
    origin: optionalEnv('CORS_ORIGIN', 'http://localhost:3000'),
  },

  argon2: {
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  },
};
