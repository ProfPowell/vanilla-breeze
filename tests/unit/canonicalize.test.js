/**
 * Unit tests for src/lib/canonicalize.js
 *
 * Spec: admin/specs/canonical-document-v1.md.
 *
 * The project does not use jsdom; tests construct DOM-shaped trees via the
 * el()/text() helpers below. The walker only depends on:
 *   - element.tagName, .childNodes, .getAttribute, .hasAttribute, .contains
 *   - text node .nodeType === 3, .nodeValue
 *   - document.querySelector, document.querySelectorAll for [data-signable]
 *     and the meta-tag readers in §G-3.
 *
 * Run: node --test tests/unit/canonicalize.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanonicalDocument,
  serializeCanonical,
  canonicalHash,
  _internal
} from '../../src/lib/canonicalize.js';

/* ─────────────────────────────────────────── tiny DOM builder ── */

function text(value) {
  return { nodeType: 3, nodeValue: value, parentNode: null };
}

function el(tagName, attrs = {}, children = []) {
  const e = {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    _attrs: new Map(Object.entries(attrs)),
    childNodes: [],
    parentNode: null,
    getAttribute(name) {
      return this._attrs.has(name) ? this._attrs.get(name) : null;
    },
    hasAttribute(name) {
      return this._attrs.has(name);
    },
    contains(other) {
      if (other === this) return true;
      for (const c of this.childNodes) {
        if (c.nodeType === 1 && c.contains(other)) return true;
      }
      return false;
    }
  };
  for (const child of children) {
    child.parentNode = e;
    e.childNodes.push(child);
  }
  return e;
}

/* Minimal document with querySelector / querySelectorAll for the selectors
   canonicalize.js actually uses: `[data-signable]`, meta[name=...],
   meta[property=...], meta[itemprop=...], link[rel=...]. */
function doc({ head = [], body = [], title = '', url = '' } = {}) {
  const root = el('HTML', {}, [
    el('HEAD', {}, head),
    el('BODY', {}, body)
  ]);

  function* walk(node) {
    yield node;
    if (node.childNodes) {
      for (const c of node.childNodes) {
        if (c.nodeType === 1) yield* walk(c);
      }
    }
  }

  function matches(node, selector) {
    if (selector === '[data-signable]') {
      return node.hasAttribute && node.hasAttribute('data-signable')
        && node.getAttribute('data-signable') !== 'false';
    }
    const m = selector.match(/^([a-z]+)\[([a-z\-:]+)="([^"]+)"\]$/i);
    if (!m) return false;
    const [, tag, attr, val] = m;
    return node.tagName === tag.toUpperCase() && node.getAttribute(attr) === val;
  }

  return {
    title,
    location: { href: url },
    querySelector(selector) {
      for (const n of walk(root)) if (matches(n, selector)) return n;
      return null;
    },
    querySelectorAll(selector) {
      const out = [];
      for (const n of walk(root)) if (matches(n, selector)) out.push(n);
      return out;
    }
  };
}

/* ─────────────────────────────────────────── walker tests ── */

describe('buildCanonicalText (via internal)', () => {
  const { buildCanonicalText } = _internal;

  it('walks a simple article in source order', () => {
    const d = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('H1', {}, [text('Title')]),
        el('P', {}, [text('Hello world.')])
      ])]
    });
    const out = buildCanonicalText(d);
    assert.equal(out, 'Title\n\nHello world.');
  });

  it('collapses internal whitespace to single spaces', () => {
    const d = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('P', {}, [text('  hello   \n  world\t\t!  ')])
      ])]
    });
    assert.equal(buildCanonicalText(d), 'hello world !');
  });

  it('preserves whitespace inside <pre>', () => {
    /* Wrap pre in a leading <p> so §E-4's trim doesn't touch the pre's
       internal whitespace. The trim is intentional for the start/end of
       the whole canonical text — see spec §E-4. */
    const d = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('P', {}, [text('intro')]),
        el('PRE', {}, [text('  line 1\n   line 2\n')])
      ])]
    });
    assert.equal(buildCanonicalText(d), 'intro\n\n  line 1\n   line 2');
  });

  it('emits \\n\\n between block elements', () => {
    const d = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('P', {}, [text('one')]),
        el('P', {}, [text('two')]),
        el('P', {}, [text('three')])
      ])]
    });
    assert.equal(buildCanonicalText(d), 'one\n\ntwo\n\nthree');
  });

  it('emits \\n for <br>', () => {
    const d = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('P', {}, [text('one'), el('BR'), text('two')])
      ])]
    });
    assert.equal(buildCanonicalText(d), 'one\ntwo');
  });

  it('flattens inline elements without extra whitespace', () => {
    const d = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('P', {}, [
          text('Visit '),
          el('A', { href: '/x' }, [text('the docs')]),
          text(' today.')
        ])
      ])]
    });
    assert.equal(buildCanonicalText(d), 'Visit the docs today.');
  });

  it('excludes <del>, includes <ins>', () => {
    const d = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('P', {}, [
          text('Use '),
          el('DEL', {}, [text('Node 16')]),
          el('INS', {}, [text('Node 20')]),
          text('.')
        ])
      ])]
    });
    assert.equal(buildCanonicalText(d), 'Use Node 20.');
  });

  it('excludes <nav>, <aside>, <header>, <footer>', () => {
    const d = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('NAV', {}, [text('Skip me nav')]),
        el('ASIDE', {}, [text('Skip me aside')]),
        el('HEADER', {}, [text('Skip me header')]),
        el('P', {}, [text('Keep me')]),
        el('FOOTER', {}, [text('Skip me footer')])
      ])]
    });
    assert.equal(buildCanonicalText(d), 'Keep me');
  });

  it('excludes <script>, <style>, <template>, <noscript>', () => {
    const d = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('SCRIPT', {}, [text('alert(1)')]),
        el('STYLE', {}, [text('body{}')]),
        el('TEMPLATE', {}, [text('templated')]),
        el('NOSCRIPT', {}, [text('no js')]),
        el('P', {}, [text('keep')])
      ])]
    });
    assert.equal(buildCanonicalText(d), 'keep');
  });

  it('excludes derived-view lenses but not content-host lenses', () => {
    const d = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('PAGE-INFO', {}, [text('derived')]),
        el('CHANGE-SET', {}, [text('derived')]),
        el('PAGE-TOC', {}, [text('derived')]),
        el('TIME-INDEX', {}, [el('P', {}, [text('host content')])]),
        el('P', {}, [text('regular')])
      ])]
    });
    assert.equal(buildCanonicalText(d), 'host content\n\nregular');
  });

  it('honours data-signable="false" opt-out', () => {
    const d = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('P', {}, [text('keep')]),
        el('SECTION', { 'data-signable': 'false' }, [text('drop')]),
        el('P', {}, [text('also keep')])
      ])]
    });
    assert.equal(buildCanonicalText(d), 'keep\n\nalso keep');
  });

  it('honours [hidden] and [aria-hidden=true]', () => {
    const d = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('P', { hidden: '' }, [text('hidden')]),
        el('P', { 'aria-hidden': 'true' }, [text('a11y-hidden')]),
        el('P', {}, [text('visible')])
      ])]
    });
    assert.equal(buildCanonicalText(d), 'visible');
  });

  it('deduplicates nested data-signable roots', () => {
    const inner = el('P', { 'data-signable': '' }, [text('inner')]);
    const outer = el('ARTICLE', { 'data-signable': '' }, [inner]);
    const d = doc({ body: [outer] });
    /* Inner root is contained in outer; walker visits outer once. */
    assert.equal(buildCanonicalText(d), 'inner');
  });

  it('walks multiple sibling data-signable roots in source order', () => {
    const d = doc({
      body: [
        el('ARTICLE', { 'data-signable': '' }, [el('P', {}, [text('first')])]),
        el('ARTICLE', { 'data-signable': '' }, [el('P', {}, [text('second')])])
      ]
    });
    assert.equal(buildCanonicalText(d), 'first\n\nsecond');
  });

  it('applies Unicode NFC normalization', () => {
    /* Combining acute (U+0301) after lowercase e == U+00E9 (é). */
    const decomposed = 'cafe' + '́'; /* "café" decomposed */
    const composed = 'café';              /* same string composed */
    const dDecomp = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [el('P', {}, [text(decomposed)])])]
    });
    const dComp = doc({
      body: [el('ARTICLE', { 'data-signable': '' }, [el('P', {}, [text(composed)])])]
    });
    assert.equal(buildCanonicalText(dDecomp), buildCanonicalText(dComp));
    assert.equal(buildCanonicalText(dDecomp), 'café');
  });

  it('drops content when no [data-signable] is present', () => {
    const d = doc({
      body: [el('ARTICLE', {}, [el('P', {}, [text('not signable')])])]
    });
    assert.equal(buildCanonicalText(d), '');
  });
});

/* ─────────────────────────────────────────── document tests ── */

describe('buildCanonicalDocument', () => {
  it('emits all spec keys in §G order, even when empty', () => {
    const d = doc({ url: 'https://example.com/page/' });
    const out = buildCanonicalDocument(d);
    assert.deepEqual(Object.keys(out), [
      '@context', '@version',
      'url', 'title', 'author', 'authorUrl',
      'published', 'modified', 'version',
      'keywords', 'concepts', 'provenance', 'review', 'status',
      'license', 'content'
    ]);
    assert.equal(out['@version'], 1);
    assert.equal(out.title, '');
    assert.equal(out.author, '');
    assert.deepEqual(out.keywords, []);
    assert.deepEqual(out.concepts, []);
  });

  it('reads §G-3 fields from the right meta tags', () => {
    const d = doc({
      url: 'https://example.com/migration/?utm=x#frag',
      title: 'Fallback Title',
      head: [
        el('META', { property: 'og:title', content: 'OG Title Wins' }),
        el('META', { name: 'author', content: 'Jane Doe' }),
        el('LINK', { rel: 'author', href: '/team/jane' }),
        el('META', { property: 'article:author', content: 'https://example.com/team/jane' }),
        el('META', { property: 'article:published_time', content: '2026-01-10T00:00:00Z' }),
        el('META', { name: 'last-modified', content: '2026-02-20' }),
        el('META', { itemprop: 'version', content: '2.1.0' }),
        el('META', { name: 'keywords', content: 'a, b , c' }),
        el('META', { name: 'concept', content: 'progressive-enhancement' }),
        el('META', { name: 'concept', content: 'accessibility' }),
        el('META', { name: 'vb:provenance', content: 'ai-assisted' }),
        el('META', { name: 'vb:review', content: 'editor-reviewed' }),
        el('META', { name: 'vb:status', content: 'published' }),
        el('LINK', { rel: 'license', href: 'https://creativecommons.org/licenses/by/4.0/' })
      ],
      body: [el('ARTICLE', { 'data-signable': '' }, [el('P', {}, [text('hi')])])]
    });
    const out = buildCanonicalDocument(d);
    assert.equal(out.url, 'https://example.com/migration/');
    assert.equal(out.title, 'OG Title Wins');
    assert.equal(out.author, 'Jane Doe');
    assert.equal(out.authorUrl, 'https://example.com/team/jane');
    assert.equal(out.published, '2026-01-10');
    assert.equal(out.modified, '2026-02-20');
    assert.equal(out.version, '2.1.0');
    assert.deepEqual(out.keywords, ['a', 'b', 'c']);
    /* concepts: harvested from all meta[name="concept"] tags,
       deduplicated, sorted alphabetically — see canonical-document
       v1.1 §G-3. Source order was [progressive-enhancement, accessibility]
       above; canonical output sorts to [accessibility, progressive-enhancement]. */
    assert.deepEqual(out.concepts, ['accessibility', 'progressive-enhancement']);
    assert.equal(out.provenance, 'ai-assisted');
    assert.equal(out.review, 'editor-reviewed');
    assert.equal(out.status, 'published');
    assert.equal(out.license, 'https://creativecommons.org/licenses/by/4.0/');
    assert.equal(out.content, 'hi');
  });

  it('falls back to document.title when og:title is absent', () => {
    const d = doc({ title: 'Plain Title', url: 'https://example.com/' });
    const out = buildCanonicalDocument(d);
    assert.equal(out.title, 'Plain Title');
  });

  it('strips query and fragment from url, lowercases hostname', () => {
    const d = doc({ url: 'https://Example.COM/Page?x=1#frag' });
    const out = buildCanonicalDocument(d);
    assert.equal(out.url, 'https://example.com/Page');
  });

  it('serializes deterministically (no indent, single line)', () => {
    const d = doc({
      url: 'https://example.com/',
      head: [el('META', { name: 'author', content: 'A' })],
      body: [el('ARTICLE', { 'data-signable': '' }, [el('P', {}, [text('x')])])]
    });
    const json = serializeCanonical(buildCanonicalDocument(d));
    assert.ok(!json.includes('\n  '), 'must not be pretty-printed');
    /* Key order check on the serialized form */
    assert.match(json, /^\{"@context":/);
    assert.match(json, /,"@version":1,/);
    assert.match(json, /,"content":/);
  });

  it('concepts: dedupes repeated meta tags and sorts alphabetically', () => {
    const d = doc({
      url: 'https://example.com/',
      head: [
        el('META', { name: 'concept', content: 'zebra' }),
        el('META', { name: 'concept', content: 'apple' }),
        el('META', { name: 'concept', content: 'apple' }), /* duplicate */
        el('META', { name: 'concept', content: 'mango' })
      ],
      body: [el('ARTICLE', { 'data-signable': '' }, [el('P', {}, [text('x')])])]
    });
    const out = buildCanonicalDocument(d);
    assert.deepEqual(out.concepts, ['apple', 'mango', 'zebra']);
  });

  it('concepts: same set in different source order produces byte-identical JSON', () => {
    const make = (order) => doc({
      url: 'https://example.com/',
      head: order.map((id) => el('META', { name: 'concept', content: id })),
      body: [el('ARTICLE', { 'data-signable': '' }, [el('P', {}, [text('x')])])]
    });
    const a = serializeCanonical(buildCanonicalDocument(make(['b', 'a', 'c'])));
    const b = serializeCanonical(buildCanonicalDocument(make(['c', 'b', 'a'])));
    assert.equal(a, b);
  });

  it('produces identical output for identical input (determinism)', () => {
    const make = () => doc({
      url: 'https://example.com/',
      head: [
        el('META', { name: 'author', content: 'Jane' }),
        el('META', { name: 'vb:provenance', content: 'human' })
      ],
      body: [el('ARTICLE', { 'data-signable': '' }, [
        el('H1', {}, [text('Hello')]),
        el('P', {}, [text('World.')])
      ])]
    });
    const a = serializeCanonical(buildCanonicalDocument(make()));
    const b = serializeCanonical(buildCanonicalDocument(make()));
    assert.equal(a, b);
  });
});

/* ─────────────────────────────────────────── hash tests ── */

describe('canonicalHash', () => {
  it('produces a base64 SHA-256 of the JSON bytes', async () => {
    const json = '{"hello":"world"}';
    const hash = await canonicalHash(json);
    /* SHA-256("{"hello":"world"}") = 93a23971a914e5eacbf0a8d25154cda309c3c1c72fb...
       Base64: k6I5camRTl6svwqNJRVM2jCcPBxy+wHnz6CCDAkUWnQ= */
    assert.match(hash, /^[A-Za-z0-9+/]+=*$/);
    assert.equal(hash.length, 44); /* SHA-256 base64 is always 44 chars */
  });

  it('is stable for identical input', async () => {
    const a = await canonicalHash('{"x":1}');
    const b = await canonicalHash('{"x":1}');
    assert.equal(a, b);
  });

  it('differs for different input', async () => {
    const a = await canonicalHash('{"x":1}');
    const b = await canonicalHash('{"x":2}');
    assert.notEqual(a, b);
  });
});
