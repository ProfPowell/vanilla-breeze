/**
 * Unit tests for wireframe utility pure functions
 *
 * Run with: node --test tests/unit/wireframe.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Replicate pure functions from src/lib/wireframe.js to avoid DOM deps

/**
 * Escape quotes for CSS content property
 * @param {string} text
 * @returns {string}
 */
function escapeLabelText(text) {
  if (!text) return '';
  return text.replace(/"/g, '\\"');
}

/**
 * Format dimension string from image natural dimensions
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
function formatDimensions(width, height) {
  if (!width || !height) return '';
  return `${width}\u00d7${height}`;
}

/**
 * Combine label text with dimensions
 * @param {string} label
 * @param {string} dims
 * @returns {string}
 */
function combineLabelAndDims(label, dims) {
  if (!label && !dims) return '';
  if (!label) return dims;
  if (!dims) return label;
  return `${label} \u2014 ${dims}`;
}

describe('escapeLabelText', () => {
  it('passes through simple text unchanged', () => {
    assert.equal(escapeLabelText('Hero Image'), 'Hero Image');
  });

  it('escapes double quotes', () => {
    assert.equal(escapeLabelText('The "hero" image'), 'The \\"hero\\" image');
  });

  it('escapes multiple quotes', () => {
    assert.equal(escapeLabelText('"A" and "B"'), '\\"A\\" and \\"B\\"');
  });

  it('handles empty string', () => {
    assert.equal(escapeLabelText(''), '');
  });

  it('handles null/undefined', () => {
    assert.equal(escapeLabelText(null), '');
    assert.equal(escapeLabelText(undefined), '');
  });

  it('preserves single quotes', () => {
    assert.equal(escapeLabelText("it's fine"), "it's fine");
  });

  it('preserves angle brackets', () => {
    assert.equal(escapeLabelText('<header>'), '<header>');
  });

  it('preserves unicode characters', () => {
    assert.equal(escapeLabelText('Caf\u00e9 logo'), 'Caf\u00e9 logo');
  });
});

describe('formatDimensions', () => {
  it('formats width and height with multiply sign', () => {
    assert.equal(formatDimensions(1920, 1080), '1920\u00d71080');
  });

  it('formats small dimensions', () => {
    assert.equal(formatDimensions(1, 1), '1\u00d71');
  });

  it('returns empty for zero width', () => {
    assert.equal(formatDimensions(0, 100), '');
  });

  it('returns empty for zero height', () => {
    assert.equal(formatDimensions(100, 0), '');
  });

  it('returns empty for both zero', () => {
    assert.equal(formatDimensions(0, 0), '');
  });

  it('returns empty for NaN width', () => {
    assert.equal(formatDimensions(NaN, 100), '');
  });

  it('returns empty for undefined dimensions', () => {
    assert.equal(formatDimensions(undefined, undefined), '');
  });
});

describe('combineLabelAndDims', () => {
  it('combines label and dimensions with em dash', () => {
    assert.equal(
      combineLabelAndDims('Hero image', '1920\u00d71080'),
      'Hero image \u2014 1920\u00d71080'
    );
  });

  it('returns only label when no dims', () => {
    assert.equal(combineLabelAndDims('Hero image', ''), 'Hero image');
  });

  it('returns only dims when no label', () => {
    assert.equal(combineLabelAndDims('', '1920\u00d71080'), '1920\u00d71080');
  });

  it('returns empty when both empty', () => {
    assert.equal(combineLabelAndDims('', ''), '');
  });

  it('handles null label', () => {
    assert.equal(combineLabelAndDims(null, '400\u00d7200'), '400\u00d7200');
  });

  it('handles null dims', () => {
    assert.equal(combineLabelAndDims('Logo', null), 'Logo');
  });
});

console.log('Running wireframe unit tests...');
