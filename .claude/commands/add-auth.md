# Add Auth Command

Scaffold complete authentication flow with JWT tokens, including login, register, logout, and password reset endpoints.

## Usage

```
/add-auth [type]
```

## Arguments

- `$ARGUMENTS` - Authentication type
  - `jwt` - JWT token authentication (default)
  - `session` - Session-based with cookies
  - `full` - Complete flow with email verification and password reset

## Examples

```
/add-auth
/add-auth jwt
/add-auth session
/add-auth full
```

## Generated Structure

```
src/
├── api/
│   ├── handlers/
│   │   └── auth.js           # Auth route handlers
│   └── middleware/
│       └── auth.js           # Auth middleware (may exist)
├── services/
│   └── auth.js               # Auth business logic
├── lib/
│   └── auth.js               # JWT/password utilities
└── db/
    └── migrations/
        └── XXX_create_users.js  # Users table if needed
```

## Steps to Execute

### 1. Check for Existing Users Table

Look for users migration. If not found, create one:

```javascript
// src/db/migrations/001_create_users.js
export async function up(db) {
  await db.query(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      email_verification_token VARCHAR(255),
      password_reset_token VARCHAR(255),
      password_reset_expires TIMESTAMPTZ,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_email_verification_token ON users(email_verification_token)
      WHERE email_verification_token IS NOT NULL;
    CREATE INDEX idx_users_password_reset_token ON users(password_reset_token)
      WHERE password_reset_token IS NOT NULL;
  `);
}

export async function down(db) {
  await db.query(`DROP TABLE IF EXISTS users CASCADE`);
}

export const description = 'Create users table with auth fields';
```

### 2. Generate Auth Library

Create `src/lib/auth.js`:

```javascript
// src/lib/auth.js
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import crypto from 'crypto';
import { config } from '../config/index.js';

/**
 * Hash password using Argon2id
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });
}

/**
 * Verify password against hash
 * @param {string} hash - Stored hash
 * @param {string} password - Plain text password
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(hash, password) {
  return argon2.verify(hash, password);
}

/**
 * Generate JWT access token
 * @param {object} payload - Token payload
 * @returns {string}
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn || '15m',
    issuer: config.jwt.issuer || 'api'
  });
}

/**
 * Generate JWT refresh token
 * @param {object} payload - Token payload
 * @returns {string}
 */
export function generateRefreshToken(payload) {
  return jwt.sign(
    { sub: payload.sub, type: 'refresh' },
    config.jwt.refreshSecret || config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn || '7d' }
  );
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} - Decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret, {
    issuer: config.jwt.issuer || 'api'
  });
}

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {object}
 */
export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, config.jwt.refreshSecret || config.jwt.secret);
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload;
}

/**
 * Generate random token for email verification, password reset
 * @returns {string}
 */
export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (password.length > 128) {
    errors.push('Password must be at most 128 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }

  return { valid: errors.length === 0, errors };
}
```

### 3. Generate Auth Service

Create `src/services/auth.js`:

```javascript
// src/services/auth.js
import { query } from '../db/client.js';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  validatePassword
} from '../lib/auth.js';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError
} from '../lib/errors.js';

/**
 * Register new user
 * @param {{ email: string, name: string, password: string }} data
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
export async function register({ email, name, password }) {
  // Validate password
  const validation = validatePassword(password);
  if (!validation.valid) {
    throw new BadRequestError('Invalid password', validation.errors);
  }

  // Check for existing user
  const { rows: existing } = await query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  if (existing.length > 0) {
    throw new ConflictError('Email already registered');
  }

  // Create user
  const passwordHash = await hashPassword(password);
  const { rows } = await query(`
    INSERT INTO users (email, name, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, email, name, role, created_at
  `, [email.toLowerCase(), name, passwordHash]);

  const user = rows[0];

  // Generate tokens
  const accessToken = generateAccessToken({ sub: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ sub: user.id });

  return { user, accessToken, refreshToken };
}

/**
 * Login user
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
export async function login({ email, password }) {
  // Find user
  const { rows } = await query(`
    SELECT id, email, name, role, password_hash, email_verified
    FROM users
    WHERE email = $1
  `, [email.toLowerCase()]);

  if (rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const user = rows[0];

  // Verify password
  const valid = await verifyPassword(user.password_hash, password);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update last login
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  // Generate tokens
  const accessToken = generateAccessToken({ sub: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ sub: user.id });

  // Return user without password
  delete user.password_hash;

  return { user, accessToken, refreshToken };
}

/**
 * Refresh access token
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string }>}
 */
export async function refresh(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);

  const { rows } = await query(
    'SELECT id, role FROM users WHERE id = $1',
    [payload.sub]
  );

  if (rows.length === 0) {
    throw new UnauthorizedError('User not found');
  }

  const user = rows[0];
  const accessToken = generateAccessToken({ sub: user.id, role: user.role });

  return { accessToken };
}

/**
 * Request password reset
 * @param {{ email: string }} data
 * @returns {Promise<{ message: string, token?: string }>}
 */
export async function requestPasswordReset({ email }) {
  const { rows } = await query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  // Always return success to prevent email enumeration
  if (rows.length === 0) {
    return { message: 'If the email exists, a reset link has been sent' };
  }

  const token = generateToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(`
    UPDATE users
    SET password_reset_token = $1, password_reset_expires = $2
    WHERE id = $3
  `, [token, expires, rows[0].id]);

  // In production, send email here
  // await sendPasswordResetEmail(email, token);

  return {
    message: 'If the email exists, a reset link has been sent',
    token // Only return in development
  };
}

/**
 * Reset password with token
 * @param {{ token: string, password: string }} data
 * @returns {Promise<{ message: string }>}
 */
export async function resetPassword({ token, password }) {
  const validation = validatePassword(password);
  if (!validation.valid) {
    throw new BadRequestError('Invalid password', validation.errors);
  }

  const { rows } = await query(`
    SELECT id FROM users
    WHERE password_reset_token = $1
      AND password_reset_expires > NOW()
  `, [token]);

  if (rows.length === 0) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(password);

  await query(`
    UPDATE users
    SET password_hash = $1,
        password_reset_token = NULL,
        password_reset_expires = NULL,
        updated_at = NOW()
    WHERE id = $2
  `, [passwordHash, rows[0].id]);

  return { message: 'Password reset successful' };
}

/**
 * Get current user
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getCurrentUser(userId) {
  const { rows } = await query(`
    SELECT id, email, name, role, email_verified, created_at, updated_at
    FROM users
    WHERE id = $1
  `, [userId]);

  if (rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  return rows[0];
}
```

### 4. Generate Auth Handlers

Create `src/api/handlers/auth.js`:

```javascript
// src/api/handlers/auth.js
import * as authService from '../../services/auth.js';

/**
 * POST /api/auth/register
 */
export async function register(req, res) {
  const { email, name, password } = req.body;

  const result = await authService.register({ email, name, password });

  res.status(201).json({
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken
  });
}

/**
 * POST /api/auth/login
 */
export async function login(req, res) {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  res.json({
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken
  });
}

/**
 * POST /api/auth/refresh
 */
export async function refresh(req, res) {
  const { refreshToken } = req.body;

  const result = await authService.refresh(refreshToken);

  res.json({ accessToken: result.accessToken });
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  // For JWT, logout is client-side (discard tokens)
  // For sessions, destroy session here
  res.json({ message: 'Logged out successfully' });
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req, res) {
  const { email } = req.body;

  const result = await authService.requestPasswordReset({ email });

  res.json(result);
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPassword(req, res) {
  const { token, password } = req.body;

  const result = await authService.resetPassword({ token, password });

  res.json(result);
}

/**
 * GET /api/auth/me
 */
export async function me(req, res) {
  const user = await authService.getCurrentUser(req.user.sub);

  res.json({ user });
}
```

### 5. Generate Auth Middleware (if not exists)

Update or create `src/api/middleware/auth.js`:

```javascript
// src/api/middleware/auth.js
import { verifyToken } from '../../lib/auth.js';
import { UnauthorizedError, ForbiddenError } from '../../lib/errors.js';

/**
 * Require authentication
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing authorization header');
  }

  const token = authHeader.slice(7);

  try {
    req.user = verifyToken(token);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expired');
    }
    throw new UnauthorizedError('Invalid token');
  }
}

/**
 * Optional authentication (sets req.user if token present)
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(authHeader.slice(7));
    } catch {
      // Invalid token, continue without user
    }
  }

  next();
}

/**
 * Require specific role(s)
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
}
```

### 6. Add Routes

Add to `src/api/routes.js`:

```javascript
import * as authHandlers from './handlers/auth.js';
import { authenticate } from './middleware/auth.js';

export function setupRoutes(app) {
  // Auth routes
  app.post('/api/auth/register', authHandlers.register);
  app.post('/api/auth/login', authHandlers.login);
  app.post('/api/auth/refresh', authHandlers.refresh);
  app.post('/api/auth/logout', authHandlers.logout);
  app.post('/api/auth/forgot-password', authHandlers.forgotPassword);
  app.post('/api/auth/reset-password', authHandlers.resetPassword);
  app.get('/api/auth/me', authenticate, authHandlers.me);

  // ... other routes
}
```

### 7. Update .env.example

```bash
# JWT
JWT_SECRET=change-this-to-random-string-in-production
JWT_REFRESH_SECRET=another-random-string-for-refresh-tokens
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=myapp
```

### 8. Output Summary

```
Authentication scaffolded:

Files created:
  src/lib/auth.js              # JWT and password utilities
  src/services/auth.js         # Auth business logic
  src/api/handlers/auth.js     # Route handlers
  src/api/middleware/auth.js   # Auth middleware

Routes added:
  POST /api/auth/register      # Create account
  POST /api/auth/login         # Login
  POST /api/auth/refresh       # Refresh token
  POST /api/auth/logout        # Logout
  POST /api/auth/forgot-password  # Request reset
  POST /api/auth/reset-password   # Reset with token
  GET  /api/auth/me            # Get current user

Dependencies needed:
  npm install jsonwebtoken argon2

Next steps:
1. Run migration for users table
2. Add JWT secrets to .env
3. Test auth endpoints
```

## Notes

- Passwords hashed with Argon2id (most secure)
- JWT tokens with short access (15m) and long refresh (7d)
- Password reset tokens expire in 1 hour
- Email enumeration prevented on forgot-password
- Add rate limiting to auth endpoints in production
