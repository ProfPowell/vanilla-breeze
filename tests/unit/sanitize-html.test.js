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

const { sanitizeHTML, sanitizeSVG, isDangerousUrl } = await import('../../src/lib/sanitize-html.js');

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

// --- Minimal element tree for sanitizeSVG (walks localName/attributes/children) ---

class TreeNode {
  /**
   * @param {string} localName
   * @param {Record<string, string>} [attrs]
   * @param {TreeNode[]} [children]
   * @param {string} [text]
   */
  constructor(localName, attrs = {}, children = [], text = '') {
    this.localName = localName;
    this.tagName = localName;
    this._attrs = new Map(Object.entries(attrs));
    this.children = [];
    this.parent = null;
    this.textContent = text;
    for (const c of children) { c.parent = this; this.children.push(c); }
  }
  get attributes() { return [...this._attrs].map(([name, value]) => ({ name, value })); }
  getAttribute(n) { return this._attrs.has(n) ? this._attrs.get(n) : null; }
  removeAttribute(n) { this._attrs.delete(n); }
  remove() {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter((c) => c !== this);
    this.parent = null;
  }
  querySelectorAll() {
    /** @type {TreeNode[]} */
    const out = [];
    const walk = (n) => { for (const c of n.children) { out.push(c); walk(c); } };
    walk(this);
    return out;
  }
  find(name) { return this.querySelectorAll().filter((n) => n.localName === name); }
}

const el = (name, attrs, children, text) => new TreeNode(name, attrs, children, text);

describe('sanitizeSVG', () => {
  it('returns the same element and mutates it in place', () => {
    const svg = el('svg', { viewBox: '0 0 24 24' });
    assert.equal(sanitizeSVG(/** @type {any} */ (svg)), svg);
  });

  it('strips on* handlers on the root and descendants', () => {
    const path = el('path', { d: 'M0 0', onclick: 'alert(1)', onmouseover: 'x' });
    const svg = el('svg', { onload: 'alert(0)', viewBox: '0 0 24 24' }, [path]);
    sanitizeSVG(/** @type {any} */ (svg));
    assert.deepEqual(svg.attributes.map((a) => a.name), ['viewBox']);
    assert.deepEqual(path.attributes.map((a) => a.name), ['d']);
  });

  it('removes script, foreignObject, iframe, object and embed', () => {
    const svg = el('svg', {}, [
      el('script', {}, [], 'alert(1)'),
      el('foreignObject', {}, [el('iframe', { src: 'https://evil.example' })]),
      el('object'), el('embed'),
      el('g', {}, [el('script')]),
      el('path', { d: 'M0 0' }),
    ]);
    sanitizeSVG(/** @type {any} */ (svg));
    for (const n of ['script', 'foreignObject', 'iframe', 'object', 'embed']) {
      assert.equal(svg.find(n).length, 0, n);
    }
    assert.equal(svg.find('path').length, 1);
    assert.equal(svg.find('g').length, 1);
  });

  it('strips javascript: and data: hrefs (incl. xlink:href and obfuscation) but keeps fragment refs', () => {
    const a1 = el('a', { href: 'javascript:alert(1)' });
    const a2 = el('a', { 'xlink:href': ' JaVa\tScRiPt:alert(1)' });
    const use1 = el('use', { href: 'data:image/svg+xml,<svg/>' });
    const use2 = el('use', { href: '#icon-ok' });
    const svg = el('svg', {}, [a1, a2, use1, use2]);
    sanitizeSVG(/** @type {any} */ (svg));
    assert.equal(a1.getAttribute('href'), null);
    assert.equal(a2.getAttribute('xlink:href'), null);
    assert.equal(use1.getAttribute('href'), null);
    assert.equal(use2.getAttribute('href'), '#icon-ok');
  });

  it('removes animate/set elements that target href', () => {
    const svg = el('svg', {}, [
      el('a', {}, [
        el('set', { attributeName: 'href', to: 'javascript:alert(1)' }),
        el('animate', { attributeName: 'xlink:href', values: 'javascript:alert(1)' }),
        el('animate', { attributeName: 'opacity', values: '0;1' }),
      ]),
    ]);
    sanitizeSVG(/** @type {any} */ (svg));
    assert.equal(svg.find('set').length, 0);
    assert.equal(svg.find('animate').length, 1);
  });

  it('removes <style> carrying @import or script URLs; keeps plain styles', () => {
    const svg = el('svg', {}, [
      el('style', {}, [], '@import url(https://evil.example/x.css)'),
      el('style', {}, [], '.a { fill: red }'),
    ]);
    sanitizeSVG(/** @type {any} */ (svg));
    assert.equal(svg.find('style').length, 1);
  });

  it('ignores non-element input', () => {
    assert.equal(sanitizeSVG(/** @type {any} */ (null)), null);
  });
});

describe('isDangerousUrl', () => {
  it('flags script schemes with whitespace/control-char obfuscation', () => {
    assert.equal(isDangerousUrl('javascript:alert(1)'), true);
    assert.equal(isDangerousUrl(' java\nscript:alert(1)'), true);
    assert.equal(isDangerousUrl('\u0001javascript:x'), true);
    assert.equal(isDangerousUrl('VBScript:x'), true);
  });
  it('blocks data: on navigation attributes, allows media data: on src', () => {
    assert.equal(isDangerousUrl('data:text/html,<script>'), true);
    assert.equal(isDangerousUrl('data:image/png;base64,AAAA'), true);
    assert.equal(isDangerousUrl('data:image/png;base64,AAAA', true), false);
    assert.equal(isDangerousUrl('data:text/html,x', true), true);
    assert.equal(isDangerousUrl('a.png 1x, javascript:x 2x', true), true);
  });
  it('passes ordinary URLs', () => {
    assert.equal(isDangerousUrl('/docs/'), false);
    assert.equal(isDangerousUrl('https://example.com/?q=javascript:'), false);
    assert.equal(isDangerousUrl('#frag'), false);
  });
});
