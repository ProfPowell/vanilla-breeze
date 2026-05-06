/**
 * Unit tests for src/web-components/quality-target/_quality-utils.js
 *
 * Combines + replaces the prior nfr-compass-utils.test.js (defaults,
 * weight merging, validation) and nfr-radar-utils.test.js (geometry).
 * Adds tests for the new dialog state machine helpers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ILITIES,
  DEFAULT_COST_WEIGHTS,
  LEVELS,
  ilityLabel,
  ilityAbbr,
  mergeCostWeights,
  criticalSum,
  criticalKeys,
  parseJsonAttr,
  validateVector,
  canSaveAxis,
  formatAxisTooltip,
  axisAngles,
  envelopeRatio,
  vectorPoints,
  envelopePoints,
  axisOuterPoints,
} from '../../src/web-components/quality-target/_quality-utils.js';

const ELEVEN = [
  'performance', 'accessibility', 'security', 'reliability',
  'maintainability', 'observability', 'compatibility', 'scalability',
  'portability', 'internationalization', 'privacy',
];

// ── Defaults ───────────────────────────────────────────────────────

describe('default constants', () => {
  it('ships exactly 11 default ilities (cost dropped, lives in iron-triangle)', () => {
    assert.equal(DEFAULT_ILITIES.length, 11);
    assert.ok(!DEFAULT_ILITIES.includes('cost'));
    assert.ok(DEFAULT_ILITIES.includes('performance'));
  });
  it('default cost weights sum to 40 at all-Critical', () => {
    const sum = DEFAULT_ILITIES.reduce((s, k) => s + DEFAULT_COST_WEIGHTS[k], 0);
    assert.equal(sum, 40);
  });
  it('LEVELS enumerates four ordered levels', () => {
    assert.deepEqual([...LEVELS], ['critical', 'important', 'acceptable', 'not-relevant']);
  });
});

describe('ilityLabel + ilityAbbr', () => {
  it('title-cases known ility keys', () => {
    assert.equal(ilityLabel('performance'), 'Performance');
    assert.equal(ilityLabel('internationalization'), 'Internationalization');
  });
  it('humanizes unknown keys', () => {
    assert.equal(ilityLabel('developer-experience'), 'Developer Experience');
  });
  it('abbreviates the standard 11 for radar legibility', () => {
    assert.equal(ilityAbbr('accessibility'), 'a11y');
    assert.equal(ilityAbbr('internationalization'), 'i18n');
  });
  it('passes through unknown ilities unabbreviated', () => {
    assert.equal(ilityAbbr('seo'), 'seo');
  });
});

// ── Cost weights ───────────────────────────────────────────────────

describe('mergeCostWeights', () => {
  it('returns defaults when no overrides', () => {
    const w = mergeCostWeights(['performance', 'security']);
    assert.equal(w.performance, 5);
    assert.equal(w.security, 5);
  });
  it('overrides selected weights', () => {
    const w = mergeCostWeights(DEFAULT_ILITIES, { performance: 8, scalability: 8 });
    assert.equal(w.performance, 8);
    assert.equal(w.scalability, 8);
    assert.equal(w.security, 5);
  });
  it('supplies neutral weight 1 for unknown custom ilities', () => {
    assert.equal(mergeCostWeights(['seo']).seo, 1);
  });
  it('floors negative or fractional overrides', () => {
    assert.equal(mergeCostWeights(['performance'], { performance: -3 }).performance, 0);
    assert.equal(mergeCostWeights(['performance'], { performance: 5.7 }).performance, 5);
  });
  it('returns a frozen object', () => {
    const w = mergeCostWeights(['performance']);
    assert.throws(() => { w.performance = 99; });
  });
});

describe('criticalSum + criticalKeys', () => {
  const weights = { performance: 5, security: 5, accessibility: 3 };
  it('sums only the Criticals', () => {
    const v = { performance: 'critical', security: 'critical', accessibility: 'important' };
    assert.equal(criticalSum(v, weights), 10);
  });
  it('returns 0 for empty vectors', () => {
    assert.equal(criticalSum({}, weights), 0);
  });
  it('lists critical keys', () => {
    const v = { performance: 'critical', security: 'critical', accessibility: 'important' };
    assert.deepEqual(criticalKeys(v).sort(), ['performance', 'security']);
  });
});

// ── parseJsonAttr ──────────────────────────────────────────────────

describe('parseJsonAttr', () => {
  it('parses a valid JSON object', () => {
    assert.deepEqual(parseJsonAttr('{"performance":8}'), { performance: 8 });
  });
  it('returns {} for invalid JSON', () => {
    assert.deepEqual(parseJsonAttr('not json'), {});
  });
  it('returns {} for arrays / primitives / null', () => {
    assert.deepEqual(parseJsonAttr('[1,2,3]'), {});
    assert.deepEqual(parseJsonAttr('42'), {});
    assert.deepEqual(parseJsonAttr(''), {});
    assert.deepEqual(parseJsonAttr(null), {});
  });
});

// ── validateVector ─────────────────────────────────────────────────

describe('validateVector', () => {
  const baseWeights = { performance: 5, security: 5, accessibility: 3 };

  it('accepts a fully-rationaled, in-budget vector', () => {
    const r = validateVector({
      vector: { performance: 'critical' },
      rationales: { performance: 'sub-200ms TTI is our differentiator' },
      costWeights: baseWeights,
      capacityPoints: 10,
    });
    assert.deepEqual(r, { valid: true, errors: [], criticalSum: 5 });
  });
  it('rejects a Critical without a rationale', () => {
    const r = validateVector({
      vector: { performance: 'critical' },
      rationales: {}, costWeights: baseWeights, capacityPoints: 10,
    });
    assert.equal(r.valid, false);
    assert.match(r.errors[0], /performance/);
  });
  it('rejects a too-short rationale', () => {
    const r = validateVector({
      vector: { security: 'critical' },
      rationales: { security: 'short' },
      costWeights: baseWeights, capacityPoints: 10,
    });
    assert.equal(r.valid, false);
    assert.match(r.errors[0], /at least 10/);
  });
  it('rejects over-budget without overrunRationale', () => {
    const r = validateVector({
      vector: { performance: 'critical', security: 'critical', accessibility: 'critical' },
      rationales: {
        performance: 'sub-200ms TTI is our differentiator',
        security: 'we handle PHI; SOC 2 audit pending',
        accessibility: 'public agency, WCAG AA mandate',
      },
      costWeights: baseWeights, capacityPoints: 10,
    });
    assert.equal(r.valid, false);
    assert.match(r.errors[0], /Over budget by 3 points/);
  });
  it('accepts over-budget with overrunRationale', () => {
    const r = validateVector({
      vector: { performance: 'critical', security: 'critical', accessibility: 'critical' },
      rationales: {
        performance: 'sub-200ms TTI is our differentiator',
        security: 'we handle PHI; SOC 2 audit pending',
        accessibility: 'public agency, WCAG AA mandate',
      },
      costWeights: baseWeights, capacityPoints: 10,
      overrunRationale: 'compliance audit drives all three together — demoting any breaks the others',
    });
    assert.equal(r.valid, true);
    assert.equal(r.criticalSum, 13);
  });
  it('treats Infinity capacity as unbounded', () => {
    const r = validateVector({
      vector: { performance: 'critical', security: 'critical' },
      rationales: {
        performance: 'sub-200ms TTI is our differentiator',
        security: 'we handle PHI; SOC 2 audit pending',
      },
      costWeights: baseWeights, capacityPoints: Infinity,
    });
    assert.equal(r.valid, true);
  });
});

// ── canSaveAxis (per-axis dialog state) ────────────────────────────

describe('canSaveAxis', () => {
  it('rejects when no level picked', () => {
    const r = canSaveAxis({ level: null, rationale: '' });
    assert.deepEqual(r, { ok: false, reason: 'pick-level' });
  });
  it('rejects critical without long-enough rationale', () => {
    const r = canSaveAxis({ level: 'critical', rationale: 'short' });
    assert.deepEqual(r, { ok: false, reason: 'rationale-too-short' });
  });
  it('accepts critical with long-enough rationale', () => {
    const r = canSaveAxis({ level: 'critical', rationale: 'sub-200ms TTI is the differentiator' });
    assert.deepEqual(r, { ok: true });
  });
  it('accepts non-critical levels regardless of rationale', () => {
    assert.deepEqual(canSaveAxis({ level: 'important',    rationale: '' }), { ok: true });
    assert.deepEqual(canSaveAxis({ level: 'acceptable',   rationale: '' }), { ok: true });
    assert.deepEqual(canSaveAxis({ level: 'not-relevant', rationale: '' }), { ok: true });
  });
  it('honors a custom minRationale', () => {
    const r = canSaveAxis({ level: 'critical', rationale: 'short5', minRationale: 4 });
    assert.deepEqual(r, { ok: true });
  });
});

// ── formatAxisTooltip ──────────────────────────────────────────────

describe('formatAxisTooltip', () => {
  it('emits "Name — Level · cost pts"', () => {
    assert.equal(
      formatAxisTooltip({ ility: 'performance', level: 'critical', costWeight: 5 }),
      'Performance — Critical · 5 pts',
    );
  });
  it('says "unset" when no level', () => {
    assert.equal(
      formatAxisTooltip({ ility: 'security', level: null, costWeight: 5 }),
      'Security — unset · 5 pts',
    );
  });
  it('emits "?" when costWeight missing', () => {
    assert.equal(
      formatAxisTooltip({ ility: 'security', level: 'important' }),
      'Security — Important · ? pts',
    );
  });
});

// ── Geometry ───────────────────────────────────────────────────────

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
  it('returns a fraction with finite budget', () => {
    const r = envelopeRatio({ costWeights: weights, capacityPoints: 6.5, ilities: ['performance', 'security', 'accessibility'] });
    assert.ok(Math.abs(r - 6.5 / 13) < 1e-9);
  });
  it('caps at 1 when budget exceeds total weights', () => {
    assert.equal(envelopeRatio({ costWeights: weights, capacityPoints: 100, ilities: ['performance', 'security', 'accessibility'] }), 1);
  });
  it('returns null when capacity is Infinity', () => {
    assert.equal(envelopeRatio({ costWeights: weights, capacityPoints: Infinity, ilities: ELEVEN }), null);
  });
  it('returns 0 when total weights sum to 0', () => {
    assert.equal(envelopeRatio({ costWeights: {}, capacityPoints: 5, ilities: ELEVEN }), 0);
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
    assert.ok(Math.abs(dist(find('accessibility')) - 60) < 1);
    assert.ok(Math.abs(dist(find('security')) - 30) < 1);
    assert.equal(dist(find('reliability')), 0);
  });
  it('returns origin points when vector is empty', () => {
    const pts = vectorPoints({ ilities: ELEVEN, vector: {}, radius: 100 });
    for (const p of pts) {
      assert.equal(Math.abs(p.x), 0);
      assert.equal(Math.abs(p.y), 0);
    }
  });
  it('preserves ility identity in input array order', () => {
    const list = ['x', 'y', 'z'];
    const pts = vectorPoints({ ilities: list, vector: {}, radius: 10 });
    assert.deepEqual(pts.map(p => p.ility), list);
  });
});

describe('envelopePoints', () => {
  const weights = Object.fromEntries(ELEVEN.map(k => [k, 4]));
  it('returns null for Infinity capacity', () => {
    assert.equal(envelopePoints({ ilities: ELEVEN, costWeights: weights, capacityPoints: Infinity, radius: 90 }), null);
  });
  it('places 11 points uniformly on the envelope ring', () => {
    const pts = envelopePoints({ ilities: ELEVEN, costWeights: weights, capacityPoints: 22, radius: 90 });
    const expected = 90 * (22 / 44);
    for (const p of pts) {
      assert.ok(Math.abs(Math.hypot(p.x, p.y) - expected) < 0.5);
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
