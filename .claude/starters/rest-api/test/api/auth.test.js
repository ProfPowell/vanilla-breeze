/**
 * Auth Endpoint Tests
 * Tests for authentication endpoints
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { get, post } from '../helpers/request.js';
import { truncateTables, closeDb } from '../helpers/db.js';

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await truncateTables();
  });

  after(async () => {
    await closeDb();
  });

  describe('POST /api/v1/auth/register', () => {
    it('creates a new user and returns tokens', async () => {
      const { status, body } = await post('/api/v1/auth/register', {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User'
      });

      assert.strictEqual(status, 201);
      assert.ok(body.user);
      assert.strictEqual(body.user.email, 'test@example.com');
      assert.strictEqual(body.user.name, 'Test User');
      assert.ok(body.accessToken);
      assert.ok(body.refreshToken);
    });

    it('returns 400 for missing email', async () => {
      const { status, body } = await post('/api/v1/auth/register', {
        password: 'Password123'
      });

      assert.strictEqual(status, 400);
      assert.strictEqual(body.error.code, 'BAD_REQUEST');
    });

    it('returns 400 for weak password', async () => {
      const { status, body } = await post('/api/v1/auth/register', {
        email: 'test@example.com',
        password: 'weak'
      });

      assert.strictEqual(status, 400);
      assert.ok(body.error.message.includes('Password'));
    });

    it('returns 409 for duplicate email', async () => {
      // First registration
      await post('/api/v1/auth/register', {
        email: 'test@example.com',
        password: 'Password123'
      });

      // Duplicate registration
      const { status, body } = await post('/api/v1/auth/register', {
        email: 'test@example.com',
        password: 'Password456'
      });

      assert.strictEqual(status, 409);
      assert.strictEqual(body.error.code, 'CONFLICT');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await post('/api/v1/auth/register', {
        email: 'login@example.com',
        password: 'Password123'
      });
    });

    it('returns tokens for valid credentials', async () => {
      const { status, body } = await post('/api/v1/auth/login', {
        email: 'login@example.com',
        password: 'Password123'
      });

      assert.strictEqual(status, 200);
      assert.ok(body.user);
      assert.ok(body.accessToken);
      assert.ok(body.refreshToken);
    });

    it('returns 401 for invalid password', async () => {
      const { status, body } = await post('/api/v1/auth/login', {
        email: 'login@example.com',
        password: 'WrongPassword'
      });

      assert.strictEqual(status, 401);
      assert.strictEqual(body.error.code, 'UNAUTHORIZED');
    });

    it('returns 401 for non-existent email', async () => {
      const { status, body } = await post('/api/v1/auth/login', {
        email: 'notfound@example.com',
        password: 'Password123'
      });

      assert.strictEqual(status, 401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('returns new tokens for valid refresh token', async () => {
      // Register and get tokens
      const register = await post('/api/v1/auth/register', {
        email: 'refresh@example.com',
        password: 'Password123'
      });

      // Use refresh token
      const { status, body } = await post('/api/v1/auth/refresh', {
        refreshToken: register.body.refreshToken
      });

      assert.strictEqual(status, 200);
      assert.ok(body.accessToken);
      assert.ok(body.refreshToken);
    });

    it('returns 400 for missing refresh token', async () => {
      const { status, body } = await post('/api/v1/auth/refresh', {});

      assert.strictEqual(status, 400);
    });

    it('returns 401 for invalid refresh token', async () => {
      const { status, body } = await post('/api/v1/auth/refresh', {
        refreshToken: 'invalid-token'
      });

      assert.strictEqual(status, 401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns current user for authenticated request', async () => {
      const register = await post('/api/v1/auth/register', {
        email: 'me@example.com',
        password: 'Password123',
        name: 'Me User'
      });

      const { status, body } = await get('/api/v1/auth/me', {
        token: register.body.accessToken
      });

      assert.strictEqual(status, 200);
      assert.strictEqual(body.email, 'me@example.com');
      assert.strictEqual(body.name, 'Me User');
    });

    it('returns 401 without token', async () => {
      const { status } = await get('/api/v1/auth/me');

      assert.strictEqual(status, 401);
    });
  });
});