// @ts-nocheck -- unit test fakes intentionally diverge from DOM types
/**
 * Unit tests for src/lib/announce.js — the shared live-region announcer.
 *
 * Uses a minimal fake document (no DOM library): elements track attributes,
 * children, connection and textContent; that is all announce() touches.
 */

import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

class FakeElement {
  constructor(tag, doc) {
    this.tagName = tag.toUpperCase();
    this.ownerDocument = doc;
    this.attributes = new Map();
    this.children = [];
    this.parent = null;
    this.textContent = '';
    this.style = { cssText: '' };
  }
  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.has(k) ? this.attributes.get(k) : null; }
  hasAttribute(k) { return this.attributes.has(k); }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  remove() {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter((c) => c !== this);
    this.parent = null;
  }
  get isConnected() {
    let n = this;
    while (n.parent) n = n.parent;
    return n === this.ownerDocument.documentElement;
  }
  closest(sel) {
    const m = /^\[([\w-]+)\]$/.exec(sel);
    for (let n = this; n; n = n.parent) if (m && n.hasAttribute(m[1])) return n;
    return null;
  }
}

function makeDocument() {
  const doc = {};
  doc.createElement = (tag) => new FakeElement(tag, doc);
  doc.documentElement = new FakeElement('html', doc);
  doc.body = doc.documentElement.appendChild(new FakeElement('body', doc));
  return doc;
}

let announce;
let readLabel;

beforeEach(async () => {
  globalThis.document = makeDocument();
  mock.timers.enable({ apis: ['setTimeout'] });
  ({ announce, readLabel } = await import('../../src/lib/announce.js'));
});

afterEach(() => {
  mock.timers.reset();
  delete globalThis.document;
});

describe('announce', () => {
  it('creates one polite status region on body and writes after a tick', () => {
    const region = announce('Copied');
    assert.equal(region.parent, document.body);
    assert.equal(region.getAttribute('role'), 'status');
    assert.equal(region.getAttribute('aria-live'), 'polite');
    assert.equal(region.getAttribute('aria-atomic'), 'true');
    assert.equal(region.textContent, '', 'region exists empty before the message is written');
    mock.timers.tick(60);
    assert.equal(region.textContent, 'Copied');
  });

  it('reuses the region and re-announces a repeated message', () => {
    const a = announce('Copied');
    mock.timers.tick(60);
    const b = announce('Copied');
    assert.equal(a, b);
    assert.equal(b.textContent, '', 'cleared so the repeat is a change');
    mock.timers.tick(60);
    assert.equal(b.textContent, 'Copied');
    assert.equal(document.body.children.length, 1);
  });

  it('keeps separate regions per politeness', () => {
    const polite = announce('Saved');
    const assertive = announce('Failed', { politeness: 'assertive' });
    assert.notEqual(polite, assertive);
    assert.equal(assertive.getAttribute('role'), 'alert');
    assert.equal(assertive.getAttribute('aria-live'), 'assertive');
  });

  it('only the last of rapid calls is written', () => {
    const region = announce('One');
    announce('Two');
    mock.timers.tick(60);
    assert.equal(region.textContent, 'Two');
  });

  it('clears the text later so a virtual cursor does not find stale text', () => {
    const region = announce('Copied');
    mock.timers.tick(60);
    mock.timers.tick(7000);
    assert.equal(region.textContent, '');
  });

  it('recreates the region after it was removed from the document', () => {
    const first = announce('A');
    first.remove();
    const second = announce('B');
    assert.notEqual(first, second);
    assert.equal(second.parent, document.body);
  });

  it('ignores empty messages', () => {
    assert.equal(announce(''), null);
    assert.equal(announce('   '), null);
    assert.equal(document.body.children.length, 0);
  });

  it('appends to a given root', () => {
    const dialog = document.body.appendChild(document.createElement('dialog'));
    const region = announce('Inside', { root: dialog });
    assert.equal(region.parent, dialog);
  });
});

describe('readLabel', () => {
  it('reads the nearest data-label-<name>, else the fallback', () => {
    const section = document.body.appendChild(document.createElement('section'));
    section.setAttribute('data-label-copied', 'Copié');
    const button = section.appendChild(document.createElement('button'));
    assert.equal(readLabel(button, 'copied', 'Copied'), 'Copié');
    assert.equal(readLabel(button, 'pasted', 'Pasted'), 'Pasted');
    assert.equal(readLabel(null, 'x', 'Fallback'), 'Fallback');
  });

  it('fills {tokens}', () => {
    assert.equal(readLabel(null, 'count', '{n} selected', { n: 3 }), '3 selected');
  });
});
