/**
 * Seed: Initial users
 * Creates admin and test user with known IDs
 */

import * as argon2 from 'argon2';
import { config } from '../../config/index.js';

// Fixed UUIDs for consistent seeding
const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000002';

export async function seed(db) {
  // Hash passwords with argon2
  const adminPassword = await argon2.hash('admin123', config.argon2);
  const userPassword = await argon2.hash('user123', config.argon2);

  // Insert admin user
  await db.query(`
    INSERT INTO users (id, email, password_hash, name, role)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      name = EXCLUDED.name,
      role = EXCLUDED.role
  `, [ADMIN_ID, 'admin@example.com', adminPassword, 'Admin User', 'admin']);

  // Insert test user
  await db.query(`
    INSERT INTO users (id, email, password_hash, name, role)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      name = EXCLUDED.name,
      role = EXCLUDED.role
  `, [TEST_USER_ID, 'user@example.com', userPassword, 'Test User', 'user']);

  // Insert sample items for test user
  await db.query(`
    INSERT INTO items (user_id, name, description, status)
    VALUES
      ($1, 'First Item', 'This is a sample active item', 'active'),
      ($1, 'Draft Item', 'This item is still in draft', 'draft'),
      ($1, 'Archived Item', 'This item has been archived', 'archived')
    ON CONFLICT DO NOTHING
  `, [TEST_USER_ID]);
}
