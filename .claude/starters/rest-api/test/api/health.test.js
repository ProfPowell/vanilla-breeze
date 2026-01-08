/**
 * Health Check Tests
 * Tests for /health and /ready endpoints
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { get } from '../helpers/request.js';

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const { status, body } = await get('/health');

      assert.strictEqual(status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(body.timestamp);
    });
  });

  describe('GET /ready', () => {
    it('returns 200 when database is connected', async () => {
      const { status, body } = await get('/ready');

      assert.strictEqual(status, 200);
      assert.strictEqual(body.status, 'ready');
      assert.strictEqual(body.checks.database, true);
      assert.ok(body.timestamp);
    });
  });
});
