/**
 * User Service
 * Business logic for user operations
 */

import * as argon2 from 'argon2';
import { db } from '../db/client.js';
import * as queries from '../db/queries/users.js';
import { config } from '../config/index.js';
import { NotFoundError, ConflictError, BadRequestError } from '../lib/errors.js';

/**
 * Find user by ID
 * @param {string} id - User UUID
 * @returns {Promise<Object>} User object (without password)
 */
export async function findById(id) {
  const result = await db.query(queries.findById, [id]);
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }
  return result.rows[0];
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object>} User object (without password)
 */
export async function findByEmail(email) {
  const result = await db.query(queries.findByEmail, [email]);
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }
  return result.rows[0];
}

/**
 * Find user by email with password hash (for authentication)
 * @param {string} email - User email
 * @returns {Promise<Object>} User object with password_hash
 */
export async function findByEmailWithPassword(email) {
  const result = await db.query(queries.findByEmailWithPassword, [email]);
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
}

/**
 * Create a new user
 * @param {Object} data - User data
 * @param {string} data.email - User email
 * @param {string} data.password - Plain text password
 * @param {string} [data.name] - User name
 * @param {string} [data.role='user'] - User role
 * @returns {Promise<Object>} Created user
 */
export async function create({ email, password, name = null, role = 'user' }) {
  // Check if email already exists
  const existing = await db.query(queries.findByEmail, [email]);
  if (existing.rows.length > 0) {
    throw new ConflictError('Email already registered');
  }

  // Validate password strength
  validatePassword(password);

  // Hash password
  const passwordHash = await argon2.hash(password, config.argon2);

  // Create user
  const result = await db.query(queries.create, [email, passwordHash, name, role]);
  return result.rows[0];
}

/**
 * Update user profile
 * @param {string} id - User UUID
 * @param {Object} data - Update data
 * @param {string} [data.name] - New name
 * @param {string} [data.email] - New email
 * @returns {Promise<Object>} Updated user
 */
export async function update(id, { name = null, email = null }) {
  // If changing email, check for conflicts
  if (email) {
    const existing = await db.query(queries.findByEmail, [email]);
    if (existing.rows.length > 0 && existing.rows[0].id !== id) {
      throw new ConflictError('Email already in use');
    }
  }

  const result = await db.query(queries.update, [id, name, email]);
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }
  return result.rows[0];
}

/**
 * Update user password
 * @param {string} id - User UUID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
export async function updatePassword(id, currentPassword, newPassword) {
  // Get user with password
  const result = await db.query(queries.findByIdWithPassword, [id]);
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = result.rows[0];

  // Verify current password
  const valid = await argon2.verify(user.password_hash, currentPassword);
  if (!valid) {
    throw new BadRequestError('Current password is incorrect');
  }

  // Validate new password
  validatePassword(newPassword);

  // Hash and update
  const passwordHash = await argon2.hash(newPassword, config.argon2);
  await db.query(queries.updatePassword, [id, passwordHash]);
}

/**
 * Validate password against user
 * @param {Object} user - User with password_hash
 * @param {string} password - Plain text password
 * @returns {Promise<boolean>} True if valid
 */
export async function validateUserPassword(user, password) {
  if (!user?.password_hash) {
    return false;
  }
  return argon2.verify(user.password_hash, password);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @throws {BadRequestError} If password is weak
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters');
  }
  if (password.length > 128) {
    throw new BadRequestError('Password must be at most 128 characters');
  }
  if (!/[a-z]/.test(password)) {
    throw new BadRequestError('Password must contain a lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    throw new BadRequestError('Password must contain an uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new BadRequestError('Password must contain a digit');
  }
}

/**
 * List users with pagination
 * @param {Object} options - Pagination options
 * @param {number} [options.limit=20] - Max results
 * @param {number} [options.offset=0] - Offset
 * @returns {Promise<{users: Object[], total: number}>}
 */
export async function list({ limit = 20, offset = 0 } = {}) {
  const [usersResult, countResult] = await Promise.all([
    db.query(queries.list, [limit, offset]),
    db.query(queries.count)
  ]);

  return {
    users: usersResult.rows,
    total: parseInt(countResult.rows[0].total, 10)
  };
}
