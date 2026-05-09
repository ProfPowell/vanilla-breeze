/**
 * Unit tests for src/lib/ai/extract.js
 *
 * The project tests pure DOM logic with a tiny fake DOM rather than jsdom.
 * `extractContextText` only needs `cloneNode`, `querySelectorAll`, `remove`,
 * and `textContent` — the FakeNode below covers exactly that surface.
 *
 * Run with: node --test tests/unit/ai/extract.test.js
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { extractContextText } from '../../../src/lib/ai/extract.js';

class FakeNode {
  /** @param {string} tag @param {string|null} className @param {string|null} text */
  constructor(tag = 'div', className = null, text = null) {
    this.tagName = tag.toUpperCase();
    this.className = className || '';
    this._children = [];
    this._text = text;
    this.parentElement = null;
  }
  appendChild(node) {
    node.parentElement = this;
    this._children.push(node);
    return node;
  }
  remove() {
    if (!this.parentElement) return;
    this.parentElement._children = this.parentElement._children.filter(c => c !== this);
    this.parentElement = null;
  }
  cloneNode(_deep) {
    const c = new FakeNode(this.tagName, this.className, this._text);
    for (const ch of this._children) {
      const ck = ch.cloneNode(true);
      ck.parentElement = c;
      c._children.push(ck);
    }
    return c;
  }
  /**
   * Tiny selector engine: comma-separated list of either `tag` or `.class`.
   */
  querySelectorAll(selector) {
    const parts = selector.split(',').map(s => s.trim()).filter(Boolean);
    const out = [];
    const matches = (n) => parts.some(p => {
      if (p.startsWith('.')) return n.className.split(/\s+/).includes(p.slice(1));
      return n.tagName === p.toUpperCase();
    });
    const walk = (n) => {
      for (const ch of n._children) {
        if (matches(ch)) out.push(ch);
        walk(ch);
      }
    };
    walk(this);
    return out;
  }
  get textContent() {
    if (this._text !== null) return this._text;
    return this._children.map(c => c.textContent).join('');
  }
}

/* ------------------------------------------------------------------------- */

describe('extractContextText — input handling', () => {
  it('returns empty for null/undefined targets', () => {
    assert.equal(extractContextText(null), '');
    assert.equal(extractContextText(undefined), '');
  });

  it('returns empty when a string selector matches nothing', () => {
    // Stub a minimal document for this test only.
    const previous = globalThis.document;
    globalThis.document = { querySelector: () => null };
    try {
      assert.equal(extractContextText('#missing'), '');
    } finally {
      if (previous === undefined) delete globalThis.document; else globalThis.document = previous;
    }
  });

  it("returns empty for malformed selectors (querySelector throws)", () => {
    const previous = globalThis.document;
    globalThis.document = { querySelector: () => { throw new Error('bad'); } };
    try {
      assert.equal(extractContextText('!!!bad'), '');
    } finally {
      if (previous === undefined) delete globalThis.document; else globalThis.document = previous;
    }
  });
});

describe('extractContextText — element extraction', () => {
  it('reads textContent of a simple element', () => {
    const root = new FakeNode('article');
    root.appendChild(new FakeNode('p', null, 'Hello world.'));
    assert.equal(extractContextText(root), 'Hello world.');
  });

  it('strips embedded ai-chat / ai-summary shells by default', () => {
    const root = new FakeNode('article');
    root.appendChild(new FakeNode('p', null, 'Real prose.'));
    const ui = new FakeNode('div', 'ai-chat-shell', null);
    ui.appendChild(new FakeNode('span', null, 'leaked UI text'));
    root.appendChild(ui);
    const own = new FakeNode('ai-chat', null, 'self-reference');
    root.appendChild(own);

    const out = extractContextText(root);
    assert.equal(out, 'Real prose.');
    assert.doesNotMatch(out, /leaked UI text|self-reference/);
  });

  it('respects custom stripSelectors', () => {
    const root = new FakeNode('article');
    root.appendChild(new FakeNode('p', null, 'Keep this.'));
    const ad = new FakeNode('aside', 'sponsored', 'sponsor copy');
    root.appendChild(ad);
    assert.equal(
      extractContextText(root, { stripSelectors: '.sponsored' }),
      'Keep this.',
    );
  });

  it('does not mutate the original element', () => {
    const root = new FakeNode('article');
    root.appendChild(new FakeNode('p', null, 'Body.'));
    const ui = new FakeNode('div', 'ais-ui', 'tool ui');
    root.appendChild(ui);
    extractContextText(root);
    assert.equal(root._children.length, 2, 'original tree must be intact');
    assert.equal(root.textContent, 'Body.tool ui');
  });

  it('collapses runs of whitespace and trims edges', () => {
    const root = new FakeNode('article', null, '  one   two\n\n  three   ');
    assert.equal(extractContextText(root), 'one two three');
  });
});
