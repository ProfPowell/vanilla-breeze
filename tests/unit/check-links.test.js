/**
 * scripts/check-links.mjs (vanilla-breeze-2zsd): the site link / content gate.
 * Builds a tiny fake site and plants one of each failure it must catch,
 * plus the look-alikes it must NOT flag.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { checkSite, codeBlockMismatches, headingSlug, isDemoPage } from '../../scripts/check-links.mjs';

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
