/**
 * @file Domain Types
 * @description JSDoc type definitions for business domain concepts
 *
 * Import generated types from schemas:
 * @typedef {import('./generated/entities/user').User} User
 * @typedef {import('./generated/entities/item').Item} Item
 *
 * Or define manual types below for concepts not in schemas.
 */

// ============================================================================
// Status Enums (matches database CHECK constraints)
// ============================================================================

/**
 * User role values
 * @typedef {'user' | 'admin'} UserRole
 */

/**
 * Item status values
 * @typedef {'draft' | 'active' | 'archived'} ItemStatus
 */

// ============================================================================
// Pagination
// ============================================================================

/**
 * Pagination parameters
 * @typedef {Object} PaginationParams
 * @property {number} [limit=20] - Maximum results
 * @property {number} [offset=0] - Results offset
 */

/**
 * Paginated response wrapper
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]} items - Result items
 * @property {Object} pagination - Pagination info
 * @property {number} pagination.limit - Limit used
 * @property {number} pagination.offset - Offset used
 * @property {number} pagination.total - Total count
 * @property {boolean} pagination.hasMore - More results available
 */

// ============================================================================
// Database Row Types (what PostgreSQL returns)
// ============================================================================

/**
 * User row from database
 * @typedef {Object} UserRow
 * @property {string} id - UUID
 * @property {string} email - User email
 * @property {string | null} name - Display name
 * @property {string} password_hash - Argon2 hash
 * @property {UserRole} role - User role
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

/**
 * Item row from database
 * @typedef {Object} ItemRow
 * @property {string} id - UUID
 * @property {string} user_id - Owner UUID
 * @property {string} name - Item name
 * @property {string | null} description - Item description
 * @property {ItemStatus} status - Item status
 * @property {Record<string, unknown>} metadata - JSON metadata
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

// ============================================================================
// Auth Types
// ============================================================================

/**
 * JWT payload structure
 * @typedef {Object} JWTPayload
 * @property {string} sub - User ID
 * @property {string} email - User email
 * @property {UserRole} role - User role
 * @property {number} iat - Issued at timestamp
 * @property {number} exp - Expiration timestamp
 */

/**
 * Auth tokens response
 * @typedef {Object} AuthTokens
 * @property {string} accessToken - Short-lived access token
 * @property {string} refreshToken - Long-lived refresh token
 * @property {number} expiresIn - Access token TTL in seconds
 */

export {};