/**
 * Unit tests for scripts/lint-doc-classes.mjs (npm run lint:doc-classes):
 * class extraction from docs/demo HTML, class definitions from CSS and JS,
 * the allowlist format and the baseline ratchet.
 *
 * Run: node --test tests/unit/lint-doc-classes.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  cssClasses,
  jsClasses,
  extractClasses,
  localStyleClasses,
  parseAllowlist,
  applyBaseline,
  toBaseline,
} from '../../scripts/lint-doc-classes.mjs';

const names = (html) => extractClasses(html).map((f) => f.name);

describe('extractClasses', () => {
  it('reads double- and single-quoted class attributes', () => {
    assert.deepEqual(names('<p class="lead muted">x</p><a class=\'button ghost\'>y</a>'), ['lead', 'muted', 'button', 'ghost']);
  });

  it('reads raw markup inside code-block samples', () => {
    const html = '<code-block language="html" data-escape><nav class="pills"><a href="#">A</a></nav></code-block>';
    assert.deepEqual(names(html), ['pills']);
  });

  it('reads escaped samples (class=&quot;…&quot;)', () => {
    assert.deepEqual(names('<pre><code>&lt;button class=&quot;secondary small&quot;&gt;</code></pre>'), ['secondary', 'small']);
  });

  it('ignores attributes that merely end in "class"', () => {
    assert.deepEqual(names('<p data-class="a" :class="b" x-class="c">z</p>'), []);
  });

  it('skips template expressions but keeps literal tokens beside them', () => {
    assert.deepEqual(names('<a class="section-card ${item.kind}">x</a>'), ['section-card']);
    assert.deepEqual(names('<a class="{{ cls }}">x</a>'), []);
  });

  it('reads className and classList calls in scripts', () => {
    const html = "<script>el.className = 'card raised'; el.classList.add('is-open', \"active\"); el.classList.toggle('x');</script>";
    assert.deepEqual(names(html).sort(), ['active', 'card', 'is-open', 'raised', 'x']);
  });

  it('reports line numbers', () => {
    const found = extractClasses('<p>\n\n<span class="lead">x</span>');
    assert.deepEqual(found, [{ name: 'lead', line: 3 }]);
  });
});

describe('cssClasses', () => {
  it('collects class selectors, including compound and nested ones', () => {
    const css = 'button.secondary, nav.pills > a { } .card:hover .title { } & .inner { }';
    assert.deepEqual([...cssClasses(css)].sort(), ['card', 'inner', 'pills', 'secondary', 'title']);
  });

  it('ignores decimals, comments, strings and url() bodies', () => {
    const css = '/* .commented */ a { margin: .5rem 1.25em; content: ".quoted"; background: url(img/a.b.png); }';
    assert.deepEqual([...cssClasses(css)], []);
  });

  it('reads classes from a page <style> block', () => {
    assert.deepEqual([...localStyleClasses('<style>.attribute-entry { }</style><p class="x">')], ['attribute-entry']);
  });
});

describe('jsClasses', () => {
  it('collects classes VB scripts read or write', () => {
    const js = "host.classList.contains('loop'); el.className = 'md-editable-preview'; el.closest('.reel'); root.querySelectorAll(`li.done`)";
    assert.deepEqual([...jsClasses(js)].sort(), ['done', 'loop', 'md-editable-preview', 'reel']);
  });
});

describe('parseAllowlist', () => {
  const allow = parseAllowlist([
    '# comment',
    'notranslate   # Google Translate',
    'language-*',
    'site/src/pages/docs/a.html: pick notify',
  ].join('\n'));

  it('matches exact names and prefix wildcards everywhere', () => {
    assert.ok(allow.has('notranslate', 'any.html'));
    assert.ok(allow.has('language-js', 'any.html'));
    assert.ok(!allow.has('lang', 'any.html'));
  });

  it('limits file-scoped entries to their file', () => {
    assert.ok(allow.has('pick', 'site/src/pages/docs/a.html'));
    assert.ok(!allow.has('pick', 'site/src/pages/docs/b.html'));
  });
});

describe('baseline', () => {
  const findings = [
    { file: 'b.html', name: 'old', line: 1 },
    { file: 'a.html', name: 'old', line: 4 },
    { file: 'a.html', name: 'old', line: 9 },
    { file: 'a.html', name: 'new', line: 2 },
  ];

  it('builds a sorted, de-duplicated baseline', () => {
    assert.deepEqual(toBaseline(findings), { 'a.html': ['new', 'old'], 'b.html': ['old'] });
  });

  it('fails only on uses not in the baseline and reports fixed entries', () => {
    const { fresh, fixed } = applyBaseline(findings, { 'a.html': ['old', 'gone'], 'b.html': ['old'] });
    assert.deepEqual(fresh.map((f) => `${f.file}:${f.name}`), ['a.html:new']);
    assert.deepEqual(fixed, [{ file: 'a.html', name: 'gone' }]);
  });

  it('only reports fixed entries for files that were checked', () => {
    const { fixed } = applyBaseline([], { 'a.html': ['old'], 'c.html': ['x'] }, new Set(['a.html']));
    assert.deepEqual(fixed, [{ file: 'a.html', name: 'old' }]);
  });
});
