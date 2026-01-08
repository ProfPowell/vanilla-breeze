# Scaffold Backend Command

Generate a complete Node.js backend project structure with Express, PostgreSQL, and proper configuration.

## Usage

```
/scaffold-backend [name]
```

## Arguments

- `$ARGUMENTS` - Project name (default: `backend`)

## Examples

```
/scaffold-backend
/scaffold-backend api
/scaffold-backend my-service
```

## Generated Structure

```
[name]/
├── src/
│   ├── index.js              # Server entry point
│   ├── config/
│   │   └── index.js          # Environment configuration
│   ├── api/
│   │   ├── routes.js         # Route definitions
│   │   ├── middleware/
│   │   │   ├── auth.js       # Authentication middleware
│   │   │   ├── validate.js   # Request validation
│   │   │   └── error.js      # Error handling
│   │   └── handlers/
│   │       └── health.js     # Health check endpoint
│   ├── services/             # Business logic (empty)
│   ├── db/
│   │   ├── client.js         # PostgreSQL client
│   │   └── queries/          # SQL query files (empty)
│   └── lib/
│       ├── logger.js         # Structured logging
│       └── errors.js         # Custom error classes
├── test/
│   └── api/
│       └── health.test.js    # Sample test
├── .env.example              # Environment template
├── package.json              # Dependencies
└── openapi.yaml              # API documentation stub
```

## Steps to Execute

### 1. Create Directory Structure

```bash
mkdir -p [name]/src/{config,api/{middleware,handlers},services,db/queries,lib}
mkdir -p [name]/test/api
```

### 2. Generate Core Files

#### src/index.js

```javascript
import express from 'express';
import { config } from './config/index.js';
import { setupRoutes } from './api/routes.js';
import { errorHandler } from './api/middleware/error.js';
import { logger } from './lib/logger.js';
import { db } from './db/client.js';

const app = express();

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start
    });
  });
  next();
});

// Routes
setupRoutes(app);

// Error handling
app.use(errorHandler);

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down...');
  await db.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start
const port = config.port;
app.listen(port, () => {
  logger.info({ message: `Server started`, port });
});
```

#### src/config/index.js

```javascript
function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing: ${name}`);
  return value;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  db: {
    host: requireEnv('DB_HOST'),
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: requireEnv('DB_NAME'),
    user: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
    ssl: process.env.DB_SSL === 'true',
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10)
  },
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  }
};
```

#### .env.example

```bash
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=
DB_SSL=false
DB_MAX_CONNECTIONS=10

JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=1h
```

#### package.json

```json
{
  "name": "[name]",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "test": "node --test test/**/*.test.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "jsonwebtoken": "^9.0.0",
    "argon2": "^0.31.0"
  }
}
```

### 3. Create Supporting Files

Generate the middleware, error classes, logger, database client, and health endpoint following the nodejs-backend skill patterns.

### 4. Initialize Git

```bash
cd [name]
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
```

### 5. Output Summary

```
Created backend project: [name]

Next steps:
1. cd [name]
2. npm install
3. Copy .env.example to .env and configure
4. npm run dev

Files created:
- src/index.js (server entry)
- src/config/index.js (configuration)
- src/api/routes.js (route setup)
- src/api/middleware/*.js (auth, validation, errors)
- src/db/client.js (PostgreSQL)
- src/lib/*.js (logger, errors)
- package.json
- .env.example
- openapi.yaml
```

## Customization Options

If user specifies options:

- `--no-db`: Skip database setup
- `--no-auth`: Skip authentication middleware
- `--fastify`: Use Fastify instead of Express

## Notes

- Uses ES modules (`"type": "module"`)
- Follows nodejs-backend skill patterns
- Includes health check endpoint at `/health`
- Ready for deployment with proper shutdown handling
- OpenAPI stub for documentation
