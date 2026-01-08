/**
 * Test Database Helpers
 * Setup and teardown utilities for tests
 */

import { db } from '../../src/db/client.js';

/**
 * Truncate all tables (for test isolation)
 */
export async function truncateTables() {
  await db.query(`
    TRUNCATE TABLE items, users RESTART IDENTITY CASCADE
  `);
}

/**
 * Close database connection
 */
export async function closeDb() {
  await db.pool.end();
}

/**
 * Create a test user
 * @param {Object} overrides - Override default values
 * @returns {Promise<Object>} Created user
 */
export async function createTestUser(overrides = {}) {
  const defaults = {
    email: `test-${Date.now()}@example.com`,
    password_hash: '$argon2id$v=19$m=65536,t=3,p=4$testpasswordhash',
    name: 'Test User',
    role: 'user'
  };

  const data = { ...defaults, ...overrides };

  const result = await db.query(`
    INSERT INTO users (email, password_hash, name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, name, role, created_at, updated_at
  `, [data.email, data.password_hash, data.name, data.role]);

  return result.rows[0];
}

/**
 * Create a test item
 * @param {string} userId - Owner user ID
 * @param {Object} overrides - Override default values
 * @returns {Promise<Object>} Created item
 */
export async function createTestItem(userId, overrides = {}) {
  const defaults = {
    name: `Test Item ${Date.now()}`,
    description: 'A test item',
    status: 'draft',
    metadata: {}
  };

  const data = { ...defaults, ...overrides };

  const result = await db.query(`
    INSERT INTO items (user_id, name, description, status, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [userId, data.name, data.description, data.status, JSON.stringify(data.metadata)]);

  return result.rows[0];
}
