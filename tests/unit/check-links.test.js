/**
 * scripts/check-links.mjs (vanilla-breeze-2zsd): the site link / content gate.
 * Builds a tiny fake site and plants one of each failure it must catch,
 * plus the look-alikes it must NOT flag.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { checkSite, codeBlockMismatches, fragmentTargets, headingSlug, isDemoPage, parseLevels, uniqueSlug } from '../../scripts/check-links.mjs';

// Runtime implementation (vanilla-breeze-wja7). Importing logic.js would pull
// in HTMLElement/customElements, so extract the pure helpers from source and
// evaluate them — the parity test then compares the two real implementations.
const runtimeSrc = readFileSync(new URL('../../src/web-components/heading-links/logic.js', import.meta.url), 'utf8');
const runtime = (() => {
  const grab = (name) => {
    const start = runtimeSrc.indexOf(`export function ${name}(`);
    let depth = 0;
    for (let i = runtimeSrc.indexOf('{', start); i < runtimeSrc.length; i++) {
      if (runtimeSrc[i] === '{') depth++;
      else if (runtimeSrc[i] === '}' && --depth === 0) return runtimeSrc.slice(start + 7, i + 1);
    }
    throw new Error(`no ${name}`);
  };
  const match = (/** @type {RegExp} */ re) => {
    const m = re.exec(runtimeSrc);
    if (!m) throw new Error(`pattern not found in heading-links logic.js: ${re}`);
    return m[1];
  };
  // The skip list is shared with page-toc (src/web-components/_shared/toc-skip.js).
  const skipSrc = readFileSync(new URL('../../src/web-components/_shared/toc-skip.js', import.meta.url), 'utf8');
  const skip = /export const SKIP_CONTEXT = '([^']+)'/.exec(skipSrc)?.[1];
  if (!skip) throw new Error('SKIP_CONTEXT not found in _shared/toc-skip.js');
  const defaults = match(/const DEFAULT_LEVELS = (\[[^\]]+\])/);
  return new Function(`const DEFAULT_LEVELS = ${defaults};
    ${grab('headingSlug')} ${grab('uniqueSlug')} ${grab('parseLevels')}
    return { headingSlug, uniqueSlug, parseLevels, SKIP: ${JSON.stringify(skip)} };`)();
})();

const base = join(tmpdir(), `vb-check-links-${process.pid}`);
const dist = join(base, 'dist');
const src = join(base, 'src');

function put(root, path, html) {
  const file = join(root, path);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, html);
}
const page = (body) => `<!DOCTYPE html><html><head><title>t</title></head><body>${body}</body></html>`;

before(() => {
  put(dist, 'index.html', page('<a href="/docs/a/">a</a>'));
  put(dist, 'docs/a/index.html', page(`
    <heading-links levels="h2,h3"><h2>Getting Started</h2><h2 id="custom">X</h2></heading-links>
    <h2>Outside Heading Links</h2>
    <section id="real"></section>
    <a href="/docs/missing/">missing page</a>
    <a href="#real">ok static id</a>
    <a href="#getting-started">ok heading-links id</a>
    <a href="#outside-heading-links">bad: no heading-links here</a>
    <a href="#nope">bad anchor</a>
    <a href="/go/feed">function route, skipped</a>
    <code-block><a href="/inside/code/">shown as code</a></code-block>
    <img src="/img/missing.png" alt="">`));
  put(dist, 'docs/examples/demos/x.html', page(`
    <a href="/dashboard">placeholder link, ignored</a>
    <script type="module" src="/cdn/gone.js"></script>`));
  put(src, 'docs/a.html', '<code-block>one</code-block><code-block>two</code-block>');
});
after(() => rmSync(base, { recursive: true, force: true }));

describe('check-links', () => {
  test('headingSlug matches heading-links', () => {
    assert.equal(headingSlug('  Getting Started!  '), 'getting-started');
    assert.equal(headingSlug('Element vs attribute — pick what fits'), 'element-vs-attribute-pick-what-fits');
  });

  test('headingSlug is Unicode-aware and never empty', () => {
    assert.equal(headingSlug('日本語の見出し'), '日本語の見出し');
    assert.equal(headingSlug('Café crème'), 'café-crème');
    assert.equal(headingSlug('🎉🚀'), 'section');
    assert.equal(headingSlug('  -- Hello -- '), 'hello');
    assert.equal(headingSlug('snake_case Ü'), 'snake_case-ü');
  });

  test('slug, dedupe and levels mirror heading-links logic.js exactly', () => {
    const fixtures = ['Usage', 'Usage', 'Example', 'Example!', '日本語の見出し', 'Café crème', 'Cafe\u0301 cre\u0300me',
      '🎉', '✨✨', 'Ελληνικά Κεφάλαιο', 'Русский раздел', 'हिन्दी शीर्षक', 'مرحبا بالعالم', 'a'.repeat(60),
      'x '.repeat(30), 'Element vs attribute — pick what fits', '  Getting Started!  ', 'A_b-c'];
    const runOne = (impl) => {
      const taken = new Set(['example']);
      return fixtures.map((t) => {
        const id = impl.uniqueSlug(impl.headingSlug(t), (x) => taken.has(x));
        taken.add(id);
        return id;
      });
    };
    const ours = runOne({ headingSlug, uniqueSlug });
    assert.deepEqual(ours, runOne(runtime));
    assert.ok(ours.every(Boolean));
    assert.equal(new Set(ours).size, ours.length);
    assert.deepEqual(ours.slice(0, 4), ['usage', 'usage-1', 'example-1', 'example-2']);
    for (const v of [null, '', 'h2', ' H4 , h3 ', 'h7,div', 'h2,h2', 'h2 > a']) {
      assert.deepEqual(parseLevels(v), runtime.parseLevels(v), String(v));
    }
    assert.ok(readFileSync(new URL('../../scripts/check-links.mjs', import.meta.url), 'utf8')
      .includes(`const HEADING_LINKS_SKIP = '${runtime.SKIP}'`), 'skip contexts match');
  });

  test('fragmentTargets models generated ids, dedupe and skipped contexts', () => {
    const ids = fragmentTargets(page(`
      <h2 id="usage">static</h2>
      <heading-links levels="h2, bogus">
        <h2>Usage</h2><h2>Usage</h2><h2>🎉</h2><h2>🎉</h2><h2>日本語</h2>
        <browser-window><h2>Demo only</h2></browser-window>
        <h3>Not a level</h3>
        <heading-links levels="h3"><h2>Inner h2</h2><h3>Inner h3</h3></heading-links>
      </heading-links>`));
    for (const id of ['usage', 'usage-1', 'usage-2', 'section', 'section-1', '日本語', 'inner-h3']) assert.ok(ids.has(id), id);
    for (const id of ['demo-only', 'not-a-level', 'inner-h2']) assert.ok(!ids.has(id), id);
  });

  test('isDemoPage', () => {
    assert.ok(isDemoPage('/docs/examples/demos/x.html'));
    assert.ok(isDemoPage('/docs/alpenglow/faq/'));
    assert.ok(!isDemoPage('/docs/a/'));
  });

  test('flags exactly the planted problems', () => {
    const { broken } = checkSite(dist);
    const got = broken.map((b) => `${b.why} ${b.href}`).sort();
    assert.deepEqual(got, [
      'missing /cdn/gone.js',
      'missing /docs/missing/',
      'missing /img/missing.png',
      'no-anchor #nope',
      'no-anchor #outside-heading-links',
    ]);
  });

  test('collects external URLs only from docs pages', () => {
    put(dist, 'docs/b/index.html', page('<a href="https://example.net/x#y">ext</a>'));
    const { external } = checkSite(dist);
    assert.ok(external.has('https://example.net/x'));
  });

  test('code-block count mismatch is reported', () => {
    const m = codeBlockMismatches(src, dist);
    assert.deepEqual(m, [{ page: 'docs/a.html', source: 2, built: 1 }]);
  });
});
