/**
 * Unit tests for src/web-components/nfr-compass/_nfr-utils.js
 *
 * Pure functions — no DOM. Covers default constants, weight merging,
 * critical-sum arithmetic, validation, and JSON-attribute parsing.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ILITIES,
  DEFAULT_COST_WEIGHTS,
  LEVELS,
  ilityLabel,
  mergeCostWeights,
  criticalSum,
  criticalKeys,
  parseJsonAttr,
  validateVector,
} from '../../src/web-components/nfr-compass/_nfr-utils.js';

describe('default constants', () => {
  it('ships exactly 11 default ilities (cost dropped)', () => {
    assert.equal(DEFAULT_ILITIES.length, 11);
    assert.ok(!DEFAULT_ILITIES.includes('cost'));
    assert.ok(DEFAULT_ILITIES.includes('performance'));
  });

  it('has a default cost weight for every default ility', () => {
    for (const ility of DEFAULT_ILITIES) {
      assert.ok(Number.isFinite(DEFAULT_COST_WEIGHTS[ility]),
        `missing default weight for ${ility}`);
    }
  });

  it('default weights sum to 40 at all-Critical', () => {
    const sum = DEFAULT_ILITIES.reduce((s, k) => s + DEFAULT_COST_WEIGHTS[k], 0);
    assert.equal(sum, 40);
  });

  it('LEVELS enumerates four ordered levels', () => {
    assert.deepEqual([...LEVELS], ['critical', 'important', 'acceptable', 'not-relevant']);
  });
});

describe('ilityLabel', () => {
  it('title-cases known keys', () => {
    assert.equal(ilityLabel('performance'), 'Performance');
    assert.equal(ilityLabel('internationalization'), 'Internationalization');
  });

  it('humanizes unknown keys', () => {
    assert.equal(ilityLabel('developer-experience'), 'Developer Experience');
    assert.equal(ilityLabel('seo'), 'Seo');
  });
});

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
    assert.equal(w.security, 5); // unchanged
  });

  it('supplies neutral weight 1 for unknown custom ilities', () => {
    const w = mergeCostWeights(['seo']);
    assert.equal(w.seo, 1);
  });

  it('floors negative or fractional overrides', () => {
    const w = mergeCostWeights(['performance'], { performance: -3 });
    assert.equal(w.performance, 0);
    const w2 = mergeCostWeights(['performance'], { performance: 5.7 });
    assert.equal(w2.performance, 5);
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

  it('returns 0 for an empty vector', () => {
    assert.equal(criticalSum({}, weights), 0);
  });

  it('lists critical keys', () => {
    const v = { performance: 'critical', security: 'critical', accessibility: 'important' };
    assert.deepEqual(criticalKeys(v).sort(), ['performance', 'security']);
  });
});

describe('parseJsonAttr', () => {
  it('parses a valid JSON object', () => {
    assert.deepEqual(parseJsonAttr('{"performance":8}'), { performance: 8 });
  });

  it('returns {} for invalid JSON', () => {
    assert.deepEqual(parseJsonAttr('not json'), {});
  });

  it('returns {} for arrays / primitives', () => {
    assert.deepEqual(parseJsonAttr('[1,2,3]'), {});
    assert.deepEqual(parseJsonAttr('42'), {});
  });

  it('returns {} for empty / null', () => {
    assert.deepEqual(parseJsonAttr(''), {});
    assert.deepEqual(parseJsonAttr(null), {});
  });
});

describe('validateVector', () => {
  const baseWeights = { performance: 5, security: 5, accessibility: 3 };

  it('accepts a fully-rationaled, in-budget vector', () => {
    const result = validateVector({
      vector: { performance: 'critical' },
      rationales: { performance: 'sub-200ms TTI is our differentiator' },
      costWeights: baseWeights,
      capacityPoints: 10,
    });
    assert.deepEqual(result, { valid: true, errors: [], criticalSum: 5 });
  });

  it('rejects a Critical without a rationale', () => {
    const result = validateVector({
      vector: { performance: 'critical' },
      rationales: {},
      costWeights: baseWeights,
      capacityPoints: 10,
    });
    assert.equal(result.valid, false);
    assert.match(result.errors[0], /performance/);
  });

  it('rejects a too-short rationale', () => {
    const result = validateVector({
      vector: { security: 'critical' },
      rationales: { security: 'short' },
      costWeights: baseWeights,
      capacityPoints: 10,
      minRationale: 10,
    });
    assert.equal(result.valid, false);
    assert.match(result.errors[0], /at least 10/);
  });

  it('rejects over-budget without overrunRationale', () => {
    const result = validateVector({
      vector: { performance: 'critical', security: 'critical', accessibility: 'critical' },
      rationales: {
        performance: 'sub-200ms TTI is our differentiator',
        security: 'we handle PHI; SOC 2 audit pending',
        accessibility: 'we serve a public agency, WCAG AA mandate',
      },
      costWeights: baseWeights,
      capacityPoints: 10,
    });
    assert.equal(result.valid, false);
    assert.match(result.errors[0], /Over budget by 3 points/);
  });

  it('accepts over-budget with overrunRationale', () => {
    const result = validateVector({
      vector: { performance: 'critical', security: 'critical', accessibility: 'critical' },
      rationales: {
        performance: 'sub-200ms TTI is our differentiator',
        security: 'we handle PHI; SOC 2 audit pending',
        accessibility: 'we serve a public agency, WCAG AA mandate',
      },
      costWeights: baseWeights,
      capacityPoints: 10,
      overrunRationale: 'compliance audit drives all three together — demoting any breaks the others',
    });
    assert.equal(result.valid, true);
    assert.equal(result.criticalSum, 13);
  });

  it('treats Infinity capacity as unbounded (over-budget never triggers)', () => {
    const result = validateVector({
      vector: { performance: 'critical', security: 'critical' },
      rationales: {
        performance: 'sub-200ms TTI is our differentiator',
        security: 'we handle PHI; SOC 2 audit pending',
      },
      costWeights: baseWeights,
      capacityPoints: Infinity,
    });
    assert.equal(result.valid, true);
  });
});
