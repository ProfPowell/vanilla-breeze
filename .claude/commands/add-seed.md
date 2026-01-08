# Add Seed Command

Generate a database seed file with faker.js integration for development data.

## Usage

```
/add-seed [table]
```

## Arguments

- `$ARGUMENTS` - Table name to seed
  - Examples: `users`, `products`, `tasks`

## Examples

```
/add-seed users
/add-seed products
/add-seed tasks
```

## Steps to Execute

### 1. Determine Next Sequence Number

Check existing seeds in `src/db/seeds/`:

```javascript
const files = await glob('src/db/seeds/*.js');
const numbers = files.map(f => parseInt(f.match(/^(\d+)_/)?.[1] || '0'));
const next = Math.max(0, ...numbers) + 1;
const prefix = String(next).padStart(3, '0');
```

### 2. Generate Seed File

Create `src/db/seeds/{prefix}_{table}.js`:

```javascript
// src/db/seeds/{prefix}_{table}.js
import { faker } from '@faker-js/faker';

/**
 * Seed {table} table
 * @param {import('pg').Pool} db - Database pool
 */
export async function seed(db) {
  // Fixed record for testing (consistent ID)
  await db.query(`
    INSERT INTO {table} (id, /* columns */)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      /* values */
    )
    ON CONFLICT (id) DO NOTHING
  `);

  // Generate fake records
  const records = Array.from({ length: 50 }, () => ({
    // Use faker to generate realistic data
  }));

  for (const record of records) {
    await db.query(`
      INSERT INTO {table} (/* columns */)
      VALUES (/* $1, $2, ... */)
      ON CONFLICT DO NOTHING
    `, [/* record values */]);
  }

  console.log('Seeded 51 {table}');
}

export const description = 'Seed {table} with test data';
```

### 3. Table-Specific Templates

**users**

```javascript
import { faker } from '@faker-js/faker';

export async function seed(db) {
  // Admin user (always same for testing)
  await db.query(`
    INSERT INTO users (id, email, name, password_hash, role, email_verified)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'admin@example.com',
      'Admin User',
      '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$hashedpassword',
      'admin',
      TRUE
    )
    ON CONFLICT (email) DO NOTHING
  `);

  // Test user
  await db.query(`
    INSERT INTO users (id, email, name, password_hash, role, email_verified)
    VALUES (
      '00000000-0000-0000-0000-000000000002',
      'user@example.com',
      'Test User',
      '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$hashedpassword',
      'user',
      TRUE
    )
    ON CONFLICT (email) DO NOTHING
  `);

  // Random users
  const users = Array.from({ length: 48 }, () => ({
    email: faker.internet.email().toLowerCase(),
    name: faker.person.fullName(),
    password_hash: '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$hashedpassword',
    role: faker.helpers.arrayElement(['user', 'user', 'user', 'moderator']),
    email_verified: faker.datatype.boolean()
  }));

  for (const user of users) {
    await db.query(`
      INSERT INTO users (email, name, password_hash, role, email_verified)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, [user.email, user.name, user.password_hash, user.role, user.email_verified]);
  }

  console.log('Seeded 50 users (admin + test + 48 random)');
}

export const description = 'Seed users with admin and test accounts';
```

**products**

```javascript
import { faker } from '@faker-js/faker';

export async function seed(db) {
  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];

  const products = Array.from({ length: 100 }, () => ({
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
    category: faker.helpers.arrayElement(categories),
    sku: faker.string.alphanumeric(8).toUpperCase(),
    stock: faker.number.int({ min: 0, max: 100 }),
    is_active: faker.datatype.boolean({ probability: 0.9 })
  }));

  for (const product of products) {
    await db.query(`
      INSERT INTO products (name, description, price, category, sku, stock, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (sku) DO NOTHING
    `, [product.name, product.description, product.price, product.category,
        product.sku, product.stock, product.is_active]);
  }

  console.log('Seeded 100 products');
}

export const description = 'Seed products with fake commerce data';
```

**tasks**

```javascript
import { faker } from '@faker-js/faker';

export async function seed(db) {
  // Get user IDs
  const { rows: users } = await db.query('SELECT id FROM users LIMIT 10');

  if (users.length === 0) {
    console.log('No users found - run users seed first');
    return;
  }

  const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  const priorities = [0, 1, 2, 2, 2, 3, 3, 4]; // Weighted toward medium

  const tasks = Array.from({ length: 200 }, () => {
    const status = faker.helpers.arrayElement(statuses);
    return {
      user_id: faker.helpers.arrayElement(users).id,
      title: faker.hacker.phrase(),
      description: faker.lorem.paragraph(),
      status,
      priority: faker.helpers.arrayElement(priorities),
      due_date: status === 'completed' ? null :
        faker.date.soon({ days: 30 }).toISOString().split('T')[0]
    };
  });

  for (const task of tasks) {
    await db.query(`
      INSERT INTO tasks (user_id, title, description, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [task.user_id, task.title, task.description, task.status,
        task.priority, task.due_date]);
  }

  console.log('Seeded 200 tasks');
}

export const description = 'Seed tasks for existing users';
```

### 4. Create Directory If Needed

```bash
mkdir -p src/db/seeds
```

### 5. Output Summary

```
Created seed: src/db/seeds/{prefix}_{table}.js

Next steps:
1. Edit the seed file to match your schema
2. Run: npm run db:seed
3. Or reset and reseed: npm run db:reset

Tip: Fixed IDs like '00000000-0000-0000-0000-000000000001'
     make testing predictable.
```

## Notes

- Seeds run in alphabetical order (use numbered prefixes)
- Include fixed records for testing (consistent IDs)
- Use `ON CONFLICT DO NOTHING` to allow re-running
- Seeds are for development only - never run in production
- Requires @faker-js/faker: `npm install @faker-js/faker`
