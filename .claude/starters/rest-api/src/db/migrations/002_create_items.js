/**
 * Migration: Create items table
 * Example resource for CRUD demonstrations
 */

export const description = 'Create items table for example CRUD resource';

export async function up(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_items_user_id ON items (user_id)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_items_status ON items (status)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC)
  `);

  await db.query(`
    DROP TRIGGER IF EXISTS items_updated_at ON items
  `);

  await db.query(`
    CREATE TRIGGER items_updated_at
      BEFORE UPDATE ON items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at()
  `);
}

export async function down(db) {
  await db.query('DROP TRIGGER IF EXISTS items_updated_at ON items');
  await db.query('DROP TABLE IF EXISTS items');
}
