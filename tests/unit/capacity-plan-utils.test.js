/**
 * Unit tests for src/web-components/capacity-plan/_capacity-utils.js
 *
 * Pure helpers: workItemCost, sumWorkCosts, computeLedger, barProportions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  workItemCost,
  sumWorkCosts,
  computeLedger,
  barProportions,
} from '../../src/web-components/capacity-plan/_capacity-utils.js';

// Tiny fake DOM elements (just need .dataset.capacityCost / .getAttribute)
const fake = (cost) => ({
  dataset: cost == null ? {} : { capacityCost: String(cost) },
  getAttribute: () => null,
});

describe('workItemCost', () => {
  it('reads numeric data-capacity-cost', () => {
    assert.equal(workItemCost(fake(3)), 3);
  });
  it('returns 0 for missing attribute', () => {
    assert.equal(workItemCost(fake(null)), 0);
  });
  it('returns 0 for non-numeric value', () => {
    assert.equal(workItemCost(fake('abc')), 0);
  });
  it('returns 0 for negative or zero', () => {
    assert.equal(workItemCost(fake(0)), 0);
    assert.equal(workItemCost(fake(-1)), 0);
  });
  it('returns 0 for null element', () => {
    assert.equal(workItemCost(null), 0);
  });
});

describe('sumWorkCosts', () => {
  it('sums all valid costs', () => {
    assert.equal(sumWorkCosts([fake(3), fake(2), fake(5)]), 10);
  });
  it('skips invalid items', () => {
    assert.equal(sumWorkCosts([fake(3), fake('x'), fake(2)]), 5);
  });
  it('returns 0 for empty / nullish', () => {
    assert.equal(sumWorkCosts([]), 0);
    assert.equal(sumWorkCosts(null), 0);
  });
});

describe('computeLedger', () => {
  it('subtracts quality + features from capacity', () => {
    const r = computeLedger({ capacityPoints: 12, qualitySum: 5, featureSum: 4 });
    assert.deepEqual(r, { capacity: 12, quality: 5, features: 4, slack: 3 });
  });
  it('produces negative slack when over budget', () => {
    const r = computeLedger({ capacityPoints: 10, qualitySum: 7, featureSum: 5 });
    assert.equal(r.slack, -2);
  });
  it('uses Infinity when capacity is unbounded', () => {
    const r = computeLedger({ capacityPoints: Infinity, qualitySum: 5, featureSum: 4 });
    assert.equal(r.slack, Infinity);
  });
  it('clamps negative inputs to 0', () => {
    const r = computeLedger({ capacityPoints: 10, qualitySum: -3, featureSum: -1 });
    assert.equal(r.quality, 0);
    assert.equal(r.features, 0);
    assert.equal(r.slack, 10);
  });
});

describe('barProportions', () => {
  it('gives slack the remainder when in budget', () => {
    const bars = barProportions({ capacity: 10, quality: 4, features: 3 });
    assert.equal(Math.round(bars.quality), 40);
    assert.equal(Math.round(bars.features), 30);
    assert.equal(Math.round(bars.slack), 30);
  });
  it('overflow scales against actual spend when over budget', () => {
    const bars = barProportions({ capacity: 10, quality: 8, features: 6 });
    // total spend = 14; quality = 8/14 * 100; features = 6/14 * 100; slack = 0
    assert.ok(Math.abs(bars.quality - (8 / 14) * 100) < 0.01);
    assert.equal(bars.slack, 0);
  });
  it('returns 100 slack when capacity is Infinity and no spend', () => {
    const bars = barProportions({ capacity: Infinity, quality: 0, features: 0 });
    assert.deepEqual(bars, { quality: 0, features: 0, slack: 100 });
  });
  it('shows quality + features full when capacity is Infinity and spend exists', () => {
    const bars = barProportions({ capacity: Infinity, quality: 6, features: 4 });
    assert.equal(bars.quality, 60);
    assert.equal(bars.features, 40);
    assert.equal(bars.slack, 0);
  });
});
