/**
 * Item Service
 * Business logic for item CRUD operations
 */

import { db } from '../db/client.js';
import * as queries from '../db/queries/items.js';
import { NotFoundError, ForbiddenError } from '../lib/errors.js';

/**
 * Find item by ID
 * @param {string} id - Item UUID
 * @returns {Promise<Object>} Item object
 */
export async function findById(id) {
  const result = await db.query(queries.findById, [id]);
  if (result.rows.length === 0) {
    throw new NotFoundError('Item not found');
  }
  return result.rows[0];
}

/**
 * Find item by ID, ensuring user ownership
 * @param {string} id - Item UUID
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Item object
 */
export async function findByIdForUser(id, userId) {
  const result = await db.query(queries.findByIdAndUser, [id, userId]);
  if (result.rows.length === 0) {
    // Check if item exists at all
    const exists = await db.query(queries.findById, [id]);
    if (exists.rows.length === 0) {
      throw new NotFoundError('Item not found');
    }
    throw new ForbiddenError('Access denied');
  }
  return result.rows[0];
}

/**
 * Create a new item
 * @param {string} userId - Owner user UUID
 * @param {Object} data - Item data
 * @param {string} data.name - Item name
 * @param {string} [data.description] - Item description
 * @param {string} [data.status='draft'] - Item status
 * @param {Object} [data.metadata={}] - Item metadata
 * @returns {Promise<Object>} Created item
 */
export async function create(userId, { name, description = null, status = 'draft', metadata = {} }) {
  const result = await db.query(queries.create, [
    userId,
    name,
    description,
    status,
    JSON.stringify(metadata)
  ]);
  return result.rows[0];
}

/**
 * Update an item
 * @param {string} id - Item UUID
 * @param {string} userId - User UUID (for ownership check)
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated item
 */
export async function update(id, userId, { name = null, description = null, status = null, metadata = null }) {
  const result = await db.query(queries.update, [
    id,
    userId,
    name,
    description,
    status,
    metadata ? JSON.stringify(metadata) : null
  ]);

  if (result.rows.length === 0) {
    // Check if item exists at all
    const exists = await db.query(queries.findById, [id]);
    if (exists.rows.length === 0) {
      throw new NotFoundError('Item not found');
    }
    throw new ForbiddenError('Access denied');
  }

  return result.rows[0];
}

/**
 * Delete an item
 * @param {string} id - Item UUID
 * @param {string} userId - User UUID (for ownership check)
 */
export async function remove(id, userId) {
  const result = await db.query(queries.remove, [id, userId]);

  if (result.rowCount === 0) {
    // Check if item exists at all
    const exists = await db.query(queries.findById, [id]);
    if (exists.rows.length === 0) {
      throw new NotFoundError('Item not found');
    }
    throw new ForbiddenError('Access denied');
  }
}

/**
 * List items for a user with pagination
 * @param {string} userId - User UUID
 * @param {Object} options - Query options
 * @param {number} [options.limit=20] - Max results
 * @param {number} [options.offset=0] - Offset
 * @param {string} [options.status] - Filter by status
 * @returns {Promise<{items: Object[], total: number}>}
 */
export async function listForUser(userId, { limit = 20, offset = 0, status = null } = {}) {
  let itemsResult;
  let countResult;

  if (status) {
    [itemsResult, countResult] = await Promise.all([
      db.query(queries.listByUserAndStatus, [userId, status, limit, offset]),
      db.query(queries.countByUserAndStatus, [userId, status])
    ]);
  } else {
    [itemsResult, countResult] = await Promise.all([
      db.query(queries.listByUser, [userId, limit, offset]),
      db.query(queries.countByUser, [userId])
    ]);
  }

  return {
    items: itemsResult.rows,
    total: parseInt(countResult.rows[0].total, 10)
  };
}