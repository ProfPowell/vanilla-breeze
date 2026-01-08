# Scaffold Database Command

Initialize complete database structure with migrations, seeds, and documentation.

## Usage

```
/scaffold-database
```

## Arguments

None required. Creates structure in the current backend project.

## Examples

```
/scaffold-database
```

## Generated Structure

```
src/db/
├── client.js           # PostgreSQL connection pool
├── migrate.js          # Migration runner
├── seed.js             # Seed runner
├── migrations/         # Migration files
│   └── .gitkeep
├── seeds/              # Seed files
│   └── .gitkeep
├── queries/            # SQL query modules
│   └── .gitkeep
└── schema.sql          # Schema documentation
```

## Steps to Execute

### 1. Create Directory Structure

```bash
mkdir -p src/db/migrations src/db/seeds src/db/queries
touch src/db/migrations/.gitkeep src/db/seeds/.gitkeep src/db/queries/.gitkeep
```

### 2. Generate Database Client

Create `src/db/client.js`:

```javascript
// src/db/client.js
import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

/**
 * PostgreSQL connection pool
 */
export const db = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
  max: config.db.max || 10
});

// Log connection events in development
if (config.env === 'development') {
  db.on('connect', () => console.log('DB: Client connected'));
  db.on('error', (err) => console.error('DB: Error', err.message));
}

/**
 * Execute parameterized query
 * @param {string} sql - SQL query
 * @param {any[]} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(sql, params = []) {
  return db.query(sql, params);
}

/**
 * Execute queries in transaction
 * @param {Function} fn - Function receiving client
 * @returns {Promise<any>}
 */
export async function transaction(fn) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### 3. Generate Migration Runner

Create `src/db/migrate.js`:

```javascript
// src/db/migrate.js
import { db } from './client.js';
import { readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'migrations');

/**
 * Ensure migrations tracking table exists
 */
async function ensureMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations() {
  const { rows } = await db.query('SELECT name FROM migrations ORDER BY id');
  return new Set(rows.map(r => r.name));
}

/**
 * Run all pending migrations
 */
export async function migrate() {
  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();

  const files = await readdir(migrationsDir);
  const migrations = files
    .filter(f => f.endsWith('.js') && !f.startsWith('.'))
    .sort();

  let count = 0;
  for (const file of migrations) {
    if (executed.has(file)) continue;

    console.log(`Migrating: ${file}`);
    const migration = await import(join(migrationsDir, file));

    await db.query('BEGIN');
    try {
      await migration.up(db);
      await db.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      await db.query('COMMIT');
      console.log(`  ✓ ${migration.description || 'Complete'}`);
      count++;
    } catch (error) {
      await db.query('ROLLBACK');
      console.error(`  ✗ Failed: ${error.message}`);
      process.exit(1);
    }
  }

  if (count === 0) {
    console.log('No pending migrations');
  } else {
    console.log(`\nCompleted ${count} migration(s)`);
  }
}

/**
 * Rollback last migration
 */
export async function rollback() {
  await ensureMigrationsTable();

  const { rows } = await db.query(
    'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
  );

  if (rows.length === 0) {
    console.log('No migrations to rollback');
    return;
  }

  const file = rows[0].name;
  console.log(`Rolling back: ${file}`);

  const migration = await import(join(migrationsDir, file));

  await db.query('BEGIN');
  try {
    await migration.down(db);
    await db.query('DELETE FROM migrations WHERE name = $1', [file]);
    await db.query('COMMIT');
    console.log('  ✓ Rollback complete');
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(`  ✗ Rollback failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Show migration status
 */
export async function status() {
  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();

  const files = await readdir(migrationsDir);
  const migrations = files
    .filter(f => f.endsWith('.js') && !f.startsWith('.'))
    .sort();

  console.log('Migration Status:\n');
  for (const file of migrations) {
    const status = executed.has(file) ? '✓' : '○';
    console.log(`  ${status} ${file}`);
  }
}

// CLI handler
const command = process.argv[2];
switch (command) {
  case 'rollback':
    rollback().then(() => process.exit(0));
    break;
  case 'status':
    status().then(() => process.exit(0));
    break;
  default:
    migrate().then(() => process.exit(0));
}
```

### 4. Generate Seed Runner

Create `src/db/seed.js`:

```javascript
// src/db/seed.js
import { db } from './client.js';
import { readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedsDir = join(__dirname, 'seeds');

/**
 * Run all seed files
 */
export async function seed() {
  const files = await readdir(seedsDir);
  const seeds = files
    .filter(f => f.endsWith('.js') && !f.startsWith('.'))
    .sort();

  if (seeds.length === 0) {
    console.log('No seed files found');
    return;
  }

  console.log('Running seeds:\n');
  for (const file of seeds) {
    console.log(`  Seeding: ${file}`);
    const seedModule = await import(join(seedsDir, file));
    await seedModule.seed(db);
    console.log(`    ✓ ${seedModule.description || 'Complete'}`);
  }

  console.log('\nSeeding complete');
}

/**
 * Reset and reseed (dangerous!)
 */
export async function reset() {
  console.log('⚠️  This will delete all data and reseed.');
  console.log('    Use only in development!\n');

  // Truncate all tables except migrations
  const { rows } = await db.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != 'migrations'
  `);

  for (const { tablename } of rows) {
    console.log(`  Truncating: ${tablename}`);
    await db.query(`TRUNCATE TABLE ${tablename} CASCADE`);
  }

  await seed();
}

// CLI handler
const command = process.argv[2];
switch (command) {
  case 'reset':
    reset().then(() => process.exit(0));
    break;
  default:
    seed().then(() => process.exit(0));
}
```

### 5. Generate Schema Documentation

Create `src/db/schema.sql`:

```sql
-- schema.sql
-- Database Schema Documentation
--
-- This file documents the database structure.
-- Do NOT run this file directly - use migrations.
--
-- Generated: [current date]
--
-- To update: Run /scaffold-database or manually document changes

-- ============================================
-- MIGRATIONS TABLE (auto-created)
-- ============================================
-- Tracks which migrations have been executed

CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ADD YOUR TABLES BELOW
-- ============================================
-- Document each table with:
-- 1. Table comment explaining purpose
-- 2. All columns with types and constraints
-- 3. Indexes
-- 4. Foreign key relationships

-- Example:
--
-- CREATE TABLE users (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   email VARCHAR(255) NOT NULL UNIQUE,
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
--
-- CREATE INDEX idx_users_email ON users(email);
```

### 6. Update package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "db:migrate": "node src/db/migrate.js",
    "db:rollback": "node src/db/migrate.js rollback",
    "db:status": "node src/db/migrate.js status",
    "db:seed": "node src/db/seed.js",
    "db:reset": "node src/db/seed.js reset"
  }
}
```

### 7. Update .env.example

Ensure database variables are documented:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_dev
DB_USER=postgres
DB_PASSWORD=
DB_SSL=false
DB_MAX_CONNECTIONS=10
```

### 8. Output Summary

```
Database structure created:

  src/db/
  ├── client.js       # PostgreSQL connection pool
  ├── migrate.js      # Migration runner
  ├── seed.js         # Seed runner
  ├── migrations/     # Put migration files here
  ├── seeds/          # Put seed files here
  ├── queries/        # Put query modules here
  └── schema.sql      # Document your schema here

Added npm scripts:
  npm run db:migrate   # Run pending migrations
  npm run db:rollback  # Rollback last migration
  npm run db:status    # Show migration status
  npm run db:seed      # Run seed files
  npm run db:reset     # Truncate and reseed (dev only)

Next steps:
1. Configure database in .env
2. Create first migration: /add-migration create_users
3. Run migrations: npm run db:migrate
4. Add seed data: /add-seed users
```

## Notes

- Uses ES modules (`import`/`export`)
- Migrations run in transactions for safety
- Seeds are for development data only
- schema.sql is documentation, not executable
- Reset command truncates tables - dev only!
