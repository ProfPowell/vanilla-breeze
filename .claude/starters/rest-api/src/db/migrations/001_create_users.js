/**
 * Migration: Create users table
 */

export const description = 'Create users table with authentication fields';

export async function up(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)
  `);

  // Trigger to auto-update updated_at
  await db.query(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await db.query(`
    DROP TRIGGER IF EXISTS users_updated_at ON users
  `);

  await db.query(`
    CREATE TRIGGER users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at()
  `);
}

export async function down(db) {
  await db.query('DROP TRIGGER IF EXISTS users_updated_at ON users');
  await db.query('DROP TABLE IF EXISTS users');
}
