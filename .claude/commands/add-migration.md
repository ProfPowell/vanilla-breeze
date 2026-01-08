# Add Migration Command

Generate a timestamped database migration file with up/down functions.

## Usage

```
/add-migration [name]
```

## Arguments

- `$ARGUMENTS` - Migration name in snake_case
  - Examples: `create_users`, `add_user_roles`, `create_tasks_table`

## Examples

```
/add-migration create_users
/add-migration add_email_verified_to_users
/add-migration create_tasks
```

## Steps to Execute

### 1. Parse Arguments

Extract the migration name and generate:
- Timestamp prefix: `YYYYMMDDHHMMSS` or sequential number `001`, `002`, etc.
- Filename: `{prefix}_{name}.js`

### 2. Determine Next Sequence Number

Check existing migrations in `src/db/migrations/`:

```javascript
// Find existing migrations and get next number
const files = await glob('src/db/migrations/*.js');
const numbers = files.map(f => parseInt(f.match(/^(\d+)_/)?.[1] || '0'));
const next = Math.max(0, ...numbers) + 1;
const prefix = String(next).padStart(3, '0');
```

### 3. Generate Migration File

Create file at `src/db/migrations/{prefix}_{name}.js`:

```javascript
// src/db/migrations/{prefix}_{name}.js

/**
 * Migration: {description}
 * @param {import('pg').Pool} db - Database pool
 */
export async function up(db) {
  await db.query(`
    -- TODO: Add migration SQL
  `);
}

/**
 * Rollback migration
 * @param {import('pg').Pool} db - Database pool
 */
export async function down(db) {
  await db.query(`
    -- TODO: Add rollback SQL
  `);
}

export const description = '{description}';
```

### 4. Provide Template Based on Name

Detect migration type from name and provide appropriate template:

**create_* (Create Table)**

```javascript
export async function up(db) {
  await db.query(`
    CREATE TABLE {table_name} (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      -- TODO: Add columns
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- TODO: Add indexes
    -- CREATE INDEX idx_{table_name}_column ON {table_name}(column);

    COMMENT ON TABLE {table_name} IS 'TODO: Table description';
  `);
}

export async function down(db) {
  await db.query(`DROP TABLE IF EXISTS {table_name} CASCADE`);
}
```

**add_*_to_* (Add Column)**

```javascript
export async function up(db) {
  await db.query(`
    ALTER TABLE {table_name}
    ADD COLUMN {column_name} {type} {constraints};

    -- Optional: Add index
    -- CREATE INDEX idx_{table_name}_{column_name} ON {table_name}({column_name});
  `);
}

export async function down(db) {
  await db.query(`
    ALTER TABLE {table_name}
    DROP COLUMN IF EXISTS {column_name};
  `);
}
```

**remove_*_from_* (Remove Column)**

```javascript
export async function up(db) {
  await db.query(`
    ALTER TABLE {table_name}
    DROP COLUMN IF EXISTS {column_name};
  `);
}

export async function down(db) {
  await db.query(`
    ALTER TABLE {table_name}
    ADD COLUMN {column_name} {type} {constraints};
  `);
}
```

**add_index_* (Add Index)**

```javascript
export async function up(db) {
  await db.query(`
    CREATE INDEX idx_{table}_{column} ON {table}({column});
  `);
}

export async function down(db) {
  await db.query(`
    DROP INDEX IF EXISTS idx_{table}_{column};
  `);
}
```

### 5. Create Directory If Needed

```bash
mkdir -p src/db/migrations
```

### 6. Output Summary

```
Created migration: src/db/migrations/{prefix}_{name}.js

Next steps:
1. Edit the migration to add your SQL
2. Run: node src/db/migrate.js
3. Test rollback: node src/db/migrate.js rollback
```

## Generated Files

For `/add-migration create_users`:

```
src/db/migrations/001_create_users.js
```

## Migration Best Practices

Include these reminders in output:

1. **Make migrations reversible** - Always implement both `up` and `down`
2. **One logical change per migration** - Don't mix table creation with data changes
3. **Use transactions** - The runner wraps each migration in BEGIN/COMMIT
4. **Test rollback** - Always verify `down` works correctly
5. **Add comments** - Use `COMMENT ON` for documentation
6. **Index foreign keys** - Always index columns used in JOINs

## Notes

- Migration files should be committed to version control
- Never edit a migration after it's been run in production
- Create a new migration to fix issues with previous migrations
- Use sequential numbers (001, 002) for simpler ordering
- Include description export for logging
