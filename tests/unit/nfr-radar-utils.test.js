/**
 * Unit tests for src/web-components/nfr-radar/_radar-geometry.js
 *
 * Pure functions — no DOM. Covers axis spacing, envelope ratio,
 * vector point ratios per level, and edge cases (Infinity capacity,
 * empty weights, zero-capacity, non-default ility lists).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  axisAngles,
  envelopeRatio,
  envelopePoints,
  vectorPoints,
  axisOuterPoints,
} from '../../src/web-components/nfr-radar/_radar-geometry.js';

const ELEVEN = [
  'performance', 'accessibility', 'security', 'reliability',
  'maintainability', 'observability', 'compatibility', 'scalability',
  'portability', 'internationalization', 'privacy',
];

describe('axisAngles', () => {
  it('starts at the top (-π/2) and is evenly spaced', () => {
    const a = axisAngles(11);
    assert.equal(a.length, 11);
    assert.equal(a[0], -Math.PI / 2);
    const step = (2 * Math.PI) / 11;
    for (let i = 1; i < 11; i++) {
      assert.ok(Math.abs(a[i] - (a[0] + step * i)) < 1e-9);
    }
  });

  it('handles arbitrary axis counts', () => {
    assert.equal(axisAngles(6).length, 6);
    assert.equal(axisAngles(3).length, 3);
  });
});

describe('envelopeRatio', () => {
  const weights = { performance: 5, security: 5, accessibility: 3 };

  it('returns a fraction when the budget is finite and weights are positive', () => {
    const r = envelopeRatio({ costWeights: weights, capacityPoints: 6.5, ilities: ['performance', 'security', 'accessibility'] });
    assert.ok(Math.abs(r - 6.5 / 13) < 1e-9);
  });

  it('caps at 1 when the budget exceeds total weights', () => {
    const r = envelopeRatio({ costWeights: weights, capacityPoints: 100, ilities: ['performance', 'security', 'accessibility'] });
    assert.equal(r, 1);
  });

  it('returns null when capacity is Infinity', () => {
    const r = envelopeRatio({ costWeights: weights, capacityPoints: Infinity, ilities: ELEVEN });
    assert.equal(r, null);
  });

  it('returns 0 when total weights sum to 0', () => {
    const r = envelopeRatio({ costWeights: {}, capacityPoints: 5, ilities: ELEVEN });
    assert.equal(r, 0);
  });
});

describe('vectorPoints', () => {
  it('places critical at full radius, important at 0.6, acceptable at 0.3, not-relevant at 0', () => {
    const pts = vectorPoints({
      ilities: ELEVEN,
      vector: {
        performance: 'critical',
        accessibility: 'important',
        security: 'acceptable',
        reliability: 'not-relevant',
      },
      radius: 100,
    });
    const dist = p => Math.hypot(p.x, p.y);
    const find = name => pts.find(p => p.ility === name);
    assert.ok(Math.abs(dist(find('performance')) - 100) < 1);
    assert.ok(Math.abs(dist(find('accessibility')) - 60)  < 1);
    assert.ok(Math.abs(dist(find('security')) - 30)       < 1);
    assert.equal(dist(find('reliability')), 0);
  });

  it('returns origin points when vector is empty', () => {
    const pts = vectorPoints({ ilities: ELEVEN, vector: {}, radius: 100 });
    for (const p of pts) {
      assert.equal(Math.abs(p.x), 0);
      assert.equal(Math.abs(p.y), 0);
    }
  });

  it('honors a custom ility list with custom axis count', () => {
    const list = ['accessibility', 'performance', 'seo'];
    const pts = vectorPoints({ ilities: list, vector: { performance: 'critical' }, radius: 50 });
    assert.equal(pts.length, 3);
    const perf = pts.find(p => p.ility === 'performance');
    // Second axis at 120deg from top; distance = radius
    assert.ok(Math.hypot(perf.x, perf.y) > 49 && Math.hypot(perf.x, perf.y) < 51);
  });

  it('preserves ility identity in the same order as input array', () => {
    const list = ['x', 'y', 'z'];
    const pts = vectorPoints({ ilities: list, vector: {}, radius: 10 });
    assert.deepEqual(pts.map(p => p.ility), list);
  });
});

describe('envelopePoints', () => {
  const weights = Object.fromEntries(ELEVEN.map(k => [k, 4]));   // total = 44

  it('returns null when capacity is Infinity', () => {
    assert.equal(envelopePoints({ ilities: ELEVEN, costWeights: weights, capacityPoints: Infinity, radius: 90 }), null);
  });

  it('returns 11 points at uniform distance from origin', () => {
    const pts = envelopePoints({ ilities: ELEVEN, costWeights: weights, capacityPoints: 22, radius: 90 });
    assert.equal(pts.length, 11);
    const expected = 90 * (22 / 44);   // 45
    for (const p of pts) {
      assert.ok(Math.abs(Math.hypot(p.x, p.y) - expected) < 0.5);
    }
  });

  it('caps the envelope ring at radius when capacity exceeds total weight', () => {
    const pts = envelopePoints({ ilities: ELEVEN, costWeights: weights, capacityPoints: 100, radius: 90 });
    for (const p of pts) {
      assert.ok(Math.abs(Math.hypot(p.x, p.y) - 90) < 0.5);
    }
  });
});

describe('axisOuterPoints', () => {
  it('puts every point on a circle of given radius', () => {
    const pts = axisOuterPoints({ ilities: ELEVEN, radius: 100 });
    for (const p of pts) {
      assert.ok(Math.abs(Math.hypot(p.x, p.y) - 100) < 1);
    }
  });
});
