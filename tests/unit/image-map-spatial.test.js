/**
 * Unit tests for src/web-components/image-map/_spatial.js
 * Pure function: nearest hotspot in an arrow-key direction.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { nearestInDirection } from '../../src/web-components/image-map/_spatial.js';

const box = (x, y, width = 10, height = 10) => ({ x, y, width, height });

// 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right
const grid = [box(0, 0), box(50, 0), box(0, 50), box(50, 50)];

describe('image-map nearestInDirection', () => {
  it('moves along each axis of a grid', () => {
    assert.equal(nearestInDirection(grid, 0, 'right'), 1);
    assert.equal(nearestInDirection(grid, 0, 'down'), 2);
    assert.equal(nearestInDirection(grid, 3, 'left'), 2);
    assert.equal(nearestInDirection(grid, 3, 'up'), 1);
  });

  it('returns -1 when nothing lies in that direction', () => {
    assert.equal(nearestInDirection(grid, 0, 'left'), -1);
    assert.equal(nearestInDirection(grid, 0, 'up'), -1);
    assert.equal(nearestInDirection([box(0, 0)], 0, 'right'), -1);
    assert.equal(nearestInDirection(grid, 9, 'right'), -1);
  });

  it('prefers a direct neighbour over a closer diagonal one', () => {
    // From 0: box 1 is straight right at 40; box 2 is right 25, down 25
    // (plain distance 35.4, so it would win without the off-axis weight).
    const boxes = [box(0, 0), box(40, 0), box(25, 25)];
    assert.equal(nearestInDirection(boxes, 0, 'right'), 1);
    assert.equal(nearestInDirection(boxes, 0, 'down'), 2);
  });

  it('ignores DOM order and uses centres of differently sized boxes', () => {
    const boxes = [box(80, 0), box(0, 0, 20, 100), box(40, 40)];
    assert.equal(nearestInDirection(boxes, 0, 'left'), 2);
    assert.equal(nearestInDirection(boxes, 2, 'left'), 1);
    assert.equal(nearestInDirection(boxes, 1, 'right'), 2);
  });

  it('skips empty slots (disabled hotspots)', () => {
    const boxes = [box(0, 0), null, box(60, 0)];
    assert.equal(nearestInDirection(boxes, 0, 'right'), 2);
    assert.equal(nearestInDirection(boxes, 1, 'right'), -1);
  });
});
