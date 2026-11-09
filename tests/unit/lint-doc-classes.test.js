/**
 * Unit tests for scripts/lint-doc-classes.mjs (npm run lint:doc-classes):
 * class extraction from docs/demo HTML, class definitions from CSS and JS,
 * the allowlist format and the baseline ratchet.
 *
 * Run: node --test tests/unit/lint-doc-classes.test.js
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

import {
  cssClasses,
  jsClasses,
  extractClasses,
  localStyleClasses,
  parseAllowlist,
  applyBaseline,
  toBaseline,
  analyzeFile,
  selectorClasses,
  selectorValueClasses,
  freeCssClasses,
  definedClasses,
  packsUsed,
  lint,
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

describe('analyzeFile: same-file definitions', () => {
  it('counts classes from a CSS code-block sample (unescaped) for samples', () => {
    const html = '<code-block language="css">.promo &gt; .tile { }</code-block><code-block language="html">&lt;p class=&quot;tile&quot;&gt;</code-block>';
    const a = analyzeFile(html);
    assert.deepEqual([...a.sampleCss].sort(), ['promo', 'tile']);
    assert.deepEqual([...a.liveCss], []);
    assert.deepEqual(a.uses.map((u) => [u.name, u.sample]), [['tile', true]]);
  });

  it('counts a <style> inside an HTML sample as sample CSS', () => {
    const a = analyzeFile('<code-block language="html" data-escape><style>.badge-x { }</style><b class="badge-x">x</b></code-block>');
    assert.deepEqual([...a.sampleCss], ['badge-x']);
    assert.deepEqual([...a.liveCss], []);
  });

  it('counts classes the page script and JS samples read as hooks', () => {
    const html = "<script>document.querySelector('.live-hook'); el.closest('li.row')</script>"
      + '<code-block language="js">el.classList.toggle(&#39;is-open&#39;); root.querySelectorAll(&quot;.item&quot;)</code-block>';
    assert.deepEqual([...analyzeFile(html).hooks].sort(), ['is-open', 'item', 'live-hook', 'row']);
  });

  it('counts .class tokens in selector-valued data-* attributes', () => {
    const html = '<form data-select-all=".row-select"></form><code-block>&lt;x data-target=&quot;input.pick, li &gt; .opt&quot;&gt;</code-block>';
    assert.deepEqual([...analyzeFile(html).hooks].sort(), ['opt', 'pick', 'row-select']);
  });

  it('does not read filenames, domains or prose as selectors', () => {
    assert.deepEqual(selectorValueClasses('logo.svg'), []);
    assert.deepEqual(selectorValueClasses('example.com'), []);
    assert.deepEqual(selectorValueClasses('Hello. World'), []);
    assert.deepEqual(selectorValueClasses('1.5'), []);
    assert.deepEqual(selectorValueClasses('.card [data-x] > a.link'), ['card', 'link']);
  });

  it('splits live <style> from sample CSS', () => {
    const html = '<style>.demo-only { }</style><p class="demo-only">live</p>'
      + '<code-block language="html" data-escape><p class="demo-only">sample</p></code-block>';
    const a = analyzeFile(html);
    assert.deepEqual([...a.liveCss], ['demo-only']);
    assert.deepEqual([...a.sampleCss], []);
    assert.deepEqual(a.uses.map((u) => u.sample), [false, true]);
  });

  it('treats <pre> bodies as samples', () => {
    const a = analyzeFile('<pre><code class="language-css">.from-pre { }</code></pre>');
    assert.deepEqual([...a.sampleCss], ['from-pre']);
  });
});

describe('selector scoping', () => {
  it('marks classes under a custom element or another class as scoped', () => {
    const got = selectorClasses('tool-tip > pop-over.hover-card .text-muted');
    assert.deepEqual(got.map((c) => [c.name, c.free, c.subject]), [['hover-card', false, false], ['text-muted', false, true]]);
    assert.deepEqual(got[1].scope.sort(), ['.hover-card', 'pop-over', 'tool-tip']);
  });

  it('does not scope by elements, attributes, :not() or compound-mates', () => {
    for (const sel of ['main article .lead', '[data-mode="dark"] .lead', ':root:not(.x) .lead', 'p.lead.big']) {
      assert.ok(selectorClasses(sel).find((c) => c.name === 'lead')?.free, sel);
    }
  });

  it('resolves nesting before scoping', () => {
    const css = '.card { & .title { } &.raised { } .body { } } nav-bar { .badge { } } @media (width > 1px) { .free { } }';
    assert.deepEqual([...freeCssClasses(css)].sort(), ['card', 'free', 'raised']);
  });
});

describe('lint over a fixture repo', () => {
  /** @type {string} */
  let root;
  const put = (/** @type {string} */ rel, /** @type {string} */ text) => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  };
  const run = (/** @type {string[]} */ rels, allow = '') => lint(rels.map((r) => join(root, r)), { root, allow: parseAllowlist(allow) })
    .map((f) => `${f.file.split('/').pop()}:${f.kind}:${f.name}`);

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'lint-doc-classes-'));
    put('src/base.css', '.button { } .button.small { } drop-down .danger { }');
    put('src/tokens/themes/_retro.css', '.retro-only { }');
    put('src/packs/kawaii/kawaii.css', '.kawaii-sparkle { }');
    put('demos/docs.css', '.docs-chrome { }');
    put('site/src/pages/docs/a.html', [
      '<style>.page-card { } .shared-demo { } .kitchen .button { } .docs-chrome { }</style>',
      '<p class="button small page-card retro-only kawaii-sparkle danger">x</p>',
      '<drop-down><button class="danger">ok</button></drop-down>',
    ].join('\n'));
    put('site/src/pages/docs/b.html', '<style>.shared-demo { } .button { }</style><p class="shared-demo">');
    put('site/src/pages/docs/packs/kawaii.html', '<p class="kawaii-sparkle">x</p>');
  });
  after(() => rmSync(root, { recursive: true, force: true }));

  it('excludes theme and pack classes from the defined set', () => {
    const defined = definedClasses(root);
    assert.ok(defined.has('button') && defined.has('small'));
    assert.ok(!defined.has('retro-only'));
    assert.ok(!defined.has('kawaii-sparkle'));
    assert.ok(!defined.has('danger'), 'scoped under drop-down only');
  });

  it('flags theme- and pack-only classes', () => {
    const got = run(['site/src/pages/docs/a.html']).filter((f) => f.includes(':undefined:'));
    assert.deepEqual(got, ['a.html:undefined:retro-only', 'a.html:undefined:kawaii-sparkle']);
  });

  it('accepts a scoped class only in a file that uses its scope element', () => {
    put('demos/examples/demos/no-scope.html', '<button class="danger">x</button>');
    put('demos/examples/demos/with-scope.html', '<drop-down><button class="danger">x</button></drop-down>');
    assert.deepEqual(run(['demos/examples/demos/no-scope.html', 'demos/examples/demos/with-scope.html']), ['no-scope.html:undefined:danger']);
  });

  it('accepts pack classes on the pack docs page or a page loading the pack', () => {
    assert.deepEqual(run(['site/src/pages/docs/packs/kawaii.html']), []);
    assert.deepEqual([...packsUsed('demos/x.html', '<link href="/src/packs/kawaii/kawaii.css">')], ['kawaii']);
  });

  it('reports page-local duplicates and shadows, not descendant reuse', () => {
    const got = run(['site/src/pages/docs/a.html', 'site/src/pages/docs/b.html']).filter((f) => !f.includes(':undefined:'));
    assert.deepEqual(got.sort(), [
      'a.html:dup:shared-demo',
      'a.html:shadow:docs-chrome',
      'b.html:dup:shared-demo',
      'b.html:shadow:button',
    ]);
  });

  it('allowlists page-local findings by kind:name', () => {
    const got = run(['site/src/pages/docs/b.html'], 'site/src/pages/docs/b.html: dup:shared-demo shadow:button');
    assert.deepEqual(got, []);
  });

  it('keys page-local findings by kind in the baseline', () => {
    const findings = [{ file: 'a.html', name: 'x', line: 1, kind: 'dup' }, { file: 'a.html', name: 'x', line: 2, kind: 'undefined' }];
    assert.deepEqual(toBaseline(findings), { 'a.html': ['dup:x', 'x'] });
    assert.deepEqual(applyBaseline(findings, { 'a.html': ['dup:x'] }).fresh.map((f) => f.kind), ['undefined']);
  });
});
