/**
 * Items Endpoint Tests
 * Tests for items CRUD endpoints
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { get, post, patch, del } from '../helpers/request.js';
import { truncateTables, closeDb } from '../helpers/db.js';

describe('Items Endpoints', () => {
  let accessToken;

  before(async () => {
    await truncateTables();

    // Create a test user and get token
    const { body } = await post('/api/v1/auth/register', {
      email: 'items@example.com',
      password: 'Password123'
    });
    accessToken = body.accessToken;
  });

  after(async () => {
    await closeDb();
  });

  describe('POST /api/v1/items', () => {
    it('creates a new item', async () => {
      const { status, body } = await post('/api/v1/items', {
        name: 'Test Item',
        description: 'A test item',
        status: 'draft'
      }, { token: accessToken });

      assert.strictEqual(status, 201);
      assert.ok(body.id);
      assert.strictEqual(body.name, 'Test Item');
      assert.strictEqual(body.status, 'draft');
    });

    it('returns 400 for missing name', async () => {
      const { status, body } = await post('/api/v1/items', {
        description: 'No name'
      }, { token: accessToken });

      assert.strictEqual(status, 400);
    });

    it('returns 401 without token', async () => {
      const { status } = await post('/api/v1/items', {
        name: 'Unauthorized Item'
      });

      assert.strictEqual(status, 401);
    });
  });

  describe('GET /api/v1/items', () => {
    beforeEach(async () => {
      // Create some items
      await post('/api/v1/items', { name: 'Item 1', status: 'active' }, { token: accessToken });
      await post('/api/v1/items', { name: 'Item 2', status: 'draft' }, { token: accessToken });
    });

    it('lists items for current user', async () => {
      const { status, body } = await get('/api/v1/items', { token: accessToken });

      assert.strictEqual(status, 200);
      assert.ok(Array.isArray(body.items));
      assert.ok(body.pagination);
      assert.ok(body.pagination.total >= 2);
    });

    it('filters by status', async () => {
      const { status, body } = await get('/api/v1/items?status=active', { token: accessToken });

      assert.strictEqual(status, 200);
      assert.ok(body.items.every(item => item.status === 'active'));
    });

    it('supports pagination', async () => {
      const { status, body } = await get('/api/v1/items?limit=1&offset=0', { token: accessToken });

      assert.strictEqual(status, 200);
      assert.strictEqual(body.items.length, 1);
      assert.ok(body.pagination.hasMore);
    });
  });

  describe('GET /api/v1/items/:id', () => {
    let itemId;

    before(async () => {
      const { body } = await post('/api/v1/items', {
        name: 'Get Test Item'
      }, { token: accessToken });
      itemId = body.id;
    });

    it('returns the item', async () => {
      const { status, body } = await get(`/api/v1/items/${itemId}`, { token: accessToken });

      assert.strictEqual(status, 200);
      assert.strictEqual(body.id, itemId);
      assert.strictEqual(body.name, 'Get Test Item');
    });

    it('returns 404 for non-existent item', async () => {
      const { status } = await get('/api/v1/items/00000000-0000-0000-0000-000000000000', {
        token: accessToken
      });

      assert.strictEqual(status, 404);
    });
  });

  describe('PATCH /api/v1/items/:id', () => {
    let itemId;

    beforeEach(async () => {
      const { body } = await post('/api/v1/items', {
        name: 'Update Test Item',
        status: 'draft'
      }, { token: accessToken });
      itemId = body.id;
    });

    it('updates the item', async () => {
      const { status, body } = await patch(`/api/v1/items/${itemId}`, {
        name: 'Updated Name',
        status: 'active'
      }, { token: accessToken });

      assert.strictEqual(status, 200);
      assert.strictEqual(body.name, 'Updated Name');
      assert.strictEqual(body.status, 'active');
    });

    it('returns 404 for non-existent item', async () => {
      const { status } = await patch('/api/v1/items/00000000-0000-0000-0000-000000000000', {
        name: 'New Name'
      }, { token: accessToken });

      assert.strictEqual(status, 404);
    });
  });

  describe('DELETE /api/v1/items/:id', () => {
    let itemId;

    beforeEach(async () => {
      const { body } = await post('/api/v1/items', {
        name: 'Delete Test Item'
      }, { token: accessToken });
      itemId = body.id;
    });

    it('deletes the item', async () => {
      const { status } = await del(`/api/v1/items/${itemId}`, { token: accessToken });

      assert.strictEqual(status, 204);

      // Verify deletion
      const { status: getStatus } = await get(`/api/v1/items/${itemId}`, { token: accessToken });
      assert.strictEqual(getStatus, 404);
    });

    it('returns 404 for non-existent item', async () => {
      const { status } = await del('/api/v1/items/00000000-0000-0000-0000-000000000000', {
        token: accessToken
      });

      assert.strictEqual(status, 404);
    });
  });
});