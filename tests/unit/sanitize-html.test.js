/**
 * Unit tests for sanitize-html module
 *
 * The HTML-string API is exercised against a spec-compliant parser: a thin
 * DOM adapter over parse5 (the WHATWG parsing algorithm, foreign content
 * included), so the mXSS corpus checks real parse → sanitize → serialise →
 * re-parse round trips. sanitizeSVG keeps its hand-built element-tree mock.
 * Real insertion (handlers must not fire) is covered in the browser by
 * tests/components/mn-sanitizer.spec.js.
 *
 * Run with: node --test tests/unit/sanitize-html.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MXSS_CORPUS } from './fixtures/mxss-corpus.js';

// --- parse5-backed DOM adapter (only what the sanitizer touches) ---

/** @type {any} */
let parse5 = null;
try { parse5 = await import('parse5'); } catch { /* optional: skip parser tests */ }

const HTML_NS = 'http://www.w3.org/1999/xhtml';
const wrappers = new WeakMap();
const TYPE = { '#text': 3, '#comment': 8, '#document-fragment': 11 };

/** @param {any} node */
function wrap(node) {
  if (!node) return null;
  let w = wrappers.get(node);
  if (!w) { w = new P5Node(node); wrappers.set(node, w); }
  return w;
}

/** @param {any} a */
const qname = (a) => (a.prefix ? `${a.prefix}:${a.name}` : a.name);

class P5Node {
  /** @param {any} node */
  constructor(node) { this.n = node; }
  get nodeType() { return TYPE[this.n.nodeName] ?? 1; }
  get localName() { return this.nodeType === 1 ? this.n.tagName : undefined; }
  get tagName() { return this.localName; }
  get namespaceURI() { return this.n.namespaceURI; }
  get parentNode() { return wrap(this.n.parentNode); }
  get childNodes() { return this.n.childNodes ? this.n.childNodes.map(wrap) : []; }
  get children() { return this.childNodes.filter((c) => c.nodeType === 1); }
  get content() { return this.n.content ? wrap(this.n.content) : undefined; }
  get attributes() { return (this.n.attrs || []).map((a) => ({ name: qname(a), value: a.value })); }
  get textContent() {
    if (this.nodeType === 3) return this.n.value;
    if (this.nodeType === 8) return this.n.data;
    return this.childNodes.map((c) => c.textContent).join('');
  }
  /** @param {string} name */
  #find(name) { return (this.n.attrs || []).find((a) => qname(a).toLowerCase() === name.toLowerCase()); }
  /** @param {string} name */
  getAttribute(name) { return this.#find(name)?.value ?? null; }
  /** @param {string} name @param {string} value */
  setAttribute(name, value) {
    const a = this.#find(name);
    if (a) a.value = String(value); else this.n.attrs.push({ name, value: String(value) });
  }
  /** @param {string} name */
  removeAttribute(name) {
    const a = this.#find(name);
    if (a) this.n.attrs.splice(this.n.attrs.indexOf(a), 1);
  }
  remove() {
    const parent = this.n.parentNode;
    if (!parent) return;
    parent.childNodes.splice(parent.childNodes.indexOf(this.n), 1);
    this.n.parentNode = null;
  }
  /** @returns {P5Node[]} */
  #descendants() {
    const out = [];
    const walk = (/** @type {P5Node} */ w) => { for (const c of w.children) { out.push(c); walk(c); } };
    walk(this);
    return out;
  }
  /** @param {string} sel */
  querySelectorAll(sel) { return sel === '*' ? this.#descendants() : this.#descendants().filter((e) => e.localName === sel); }
  /** @param {string} sel */
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }
  /** @param {P5Node} other */
  contains(other) {
    for (let n = other; n; n = n.parentNode) if (n === this) return true;
    return false;
  }
  /** @param {...P5Node} nodes */
  append(...nodes) {
    for (const w of nodes) {
      const moving = w.nodeType === 11 ? [...w.n.childNodes] : [w.n];
      if (w.nodeType === 11) w.n.childNodes = [];
      else w.remove();
      for (const m of moving) { m.parentNode = this.n.content || this.n; (this.n.content || this.n).childNodes.push(m); }
    }
  }
  get innerHTML() { return parse5.serialize(this.n); }
  set innerHTML(html) {
    const frag = parse5.parseFragment(html);
    const target = this.n.content || this.n;
    target.childNodes = frag.childNodes;
    for (const c of target.childNodes) c.parentNode = target;
  }
}

if (parse5) {
  globalThis.document = /** @type {any} */ ({
    createElement(tag) {
      return wrap({
        nodeName: tag, tagName: tag, attrs: [], namespaceURI: HTML_NS, childNodes: [], parentNode: null,
        content: tag === 'template' ? { nodeName: '#document-fragment', childNodes: [] } : undefined,
      });
    },
  });
}

const { sanitizeHTML, sanitizeSVG, isDangerousUrl } = await import('../../src/lib/sanitize-html.js');

/**
 * Re-parse sanitized markup with the spec parser and list anything that
 * could execute or carry an mXSS payload.
 * @param {string} html
 */
function findDanger(html) {
  const bad = [];
  const walk = (/** @type {any} */ n) => {
    for (const c of n.childNodes || []) {
      if (c.tagName) {
        if (/^(script|style|iframe|noscript|xmp|noembed|noframes|plaintext|mglyph|malignmark|foreignobject|title)$/i.test(c.tagName)
          && !(c.tagName === 'title' && c.namespaceURI === 'http://www.w3.org/2000/svg')) bad.push(c.tagName);
        for (const a of c.attrs) if (/^on/i.test(a.name)) bad.push(`${c.tagName}[${a.name}]`);
      }
      if (c.nodeName === '#comment') bad.push('#comment');
      walk(c);
      if (c.content) walk(c.content);
    }
  };
  walk(parse5.parseFragment(html));
  return bad;
}

describe('sanitizeHTML', () => {
  it('returns empty string for falsy / non-string input', () => {
    assert.equal(sanitizeHTML(''), '');
    assert.equal(sanitizeHTML(/** @type {*} */ (null)), '');
    assert.equal(sanitizeHTML(/** @type {*} */ (undefined)), '');
    assert.equal(sanitizeHTML(/** @type {*} */ (42)), '');
    assert.equal(sanitizeHTML(/** @type {*} */ ({})), '');
  });

  it('keeps ordinary markup', { skip: !parse5 }, () => {
    assert.equal(sanitizeHTML('<p class="c"><a href="/ok">ok</a> <em>x</em></p>'), '<p class="c"><a href="/ok">ok</a> <em>x</em></p>');
  });

  it('kills the confirmed MathML mglyph/style mXSS', { skip: !parse5 }, () => {
    const out = sanitizeHTML('<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>');
    assert.doesNotMatch(out, /<style|<img|onerror|mglyph/i);
  });

  for (const [name, payload] of MXSS_CORPUS) {
    it(`mXSS corpus: ${name}`, { skip: !parse5 }, () => {
      const out = sanitizeHTML(payload);
      assert.deepEqual(findDanger(out), [], out);
      // Stable under re-parse: the round trip cannot mutate into something new
      assert.equal(sanitizeHTML(out), out);
    });
  }

  it('drops <style>, style attributes and form-hijack attributes', { skip: !parse5 }, () => {
    assert.equal(sanitizeHTML('<style>body{display:none}</style><p style="position:fixed;inset:0">x</p>'), '<p>x</p>');
    assert.equal(
      sanitizeHTML('<button form="f" formaction="https://evil.example" formmethod="post" formtarget="_top" popovertarget="m" commandfor="d" command="close">b</button>'),
      '<button type="button">b</button>',
    );
    assert.equal(sanitizeHTML('<input type="submit" autofocus>'), '<input type="button">');
  });

  it('prefixes id/name and rewrites in-fragment references only', { skip: !parse5 }, () => {
    assert.equal(
      sanitizeHTML('<h2 id="x">X</h2><a href="#x">in</a><a href="#top">page</a><label for="x">l</label><p aria-labelledby="x outside">p</p><input name="q">'),
      '<h2 id="user-content-x">X</h2><a href="#user-content-x">in</a><a href="#top">page</a><label for="user-content-x">l</label><p aria-labelledby="user-content-x">p</p><input name="user-content-q">',
    );
  });

  it('fragment profile keeps ids and safe style attributes', { skip: !parse5 }, () => {
    assert.equal(
      sanitizeHTML('<p id="a" style="color: red">x</p><p style="position: fixed">y</p>', { keepIds: true, keepStyle: true }),
      '<p id="a" style="color: red">x</p><p>y</p>',
    );
  });

  it('removes comments', { skip: !parse5 }, () => {
    assert.equal(sanitizeHTML('<p>a<!-- hidden --></p>'), '<p>a</p>');
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
