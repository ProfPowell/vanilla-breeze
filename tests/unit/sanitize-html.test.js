/**
 * Unit tests for sanitize-html module
 *
 * Tests the pure function contract. Uses minimal DOM mock since the project
 * doesn't use jsdom. Full XSS vector testing belongs in Playwright component tests.
 *
 * Run with: node --test tests/unit/sanitize-html.test.js
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// --- Minimal DOM mock for template-based sanitizer ---

class MockAttribute {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
}

class MockElement {
  constructor(tagName) {
    this.tagName = tagName;
    this._attributes = new Map();
    this._children = [];
    this.innerHTML = '';
  }

  get attributes() {
    return [...this._attributes.values()];
  }

  getAttribute(name) {
    return this._attributes.get(name)?.value ?? null;
  }

  setAttribute(name, value) {
    this._attributes.set(name, new MockAttribute(name, String(value)));
  }

  removeAttribute(name) {
    this._attributes.delete(name);
  }

  remove() {
    // Mark as removed
    this._removed = true;
  }

  querySelectorAll() {
    return [];
  }
}

class MockDocumentFragment {
  constructor() {
    this._children = [];
  }

  querySelectorAll() {
    return [];
  }
}

class MockTemplate {
  constructor() {
    this.content = new MockDocumentFragment();
    this._innerHTML = '';
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = val;
  }
}

// Install minimal globals
globalThis.document = globalThis.document ?? {
  createElement(tag) {
    if (tag === 'template') return new MockTemplate();
    return new MockElement(tag);
  }
};

const { sanitizeHTML } = await import('../../src/lib/sanitize-html.js');

describe('sanitizeHTML', () => {
  it('returns empty string for falsy input', () => {
    assert.equal(sanitizeHTML(''), '');
    assert.equal(sanitizeHTML(/** @type {*} */ (null)), '');
    assert.equal(sanitizeHTML(/** @type {*} */ (undefined)), '');
  });

  it('returns empty string for non-string input', () => {
    assert.equal(sanitizeHTML(/** @type {*} */ (42)), '');
    assert.equal(sanitizeHTML(/** @type {*} */ ({})), '');
  });

  it('returns string for valid HTML input (mock passes through innerHTML)', () => {
    // In the mock, template.innerHTML round-trips — real sanitization
    // is tested in Playwright component tests with a real browser DOM
    const result = sanitizeHTML('<p>Hello</p>');
    assert.equal(typeof result, 'string');
  });
});
