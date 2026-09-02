/**
 * Line-level guards in vb-conformance.js are scoped to the tag they judge
 * (vanilla-breeze-lp55). Each of these used to test the WHOLE LINE, so any
 * element sharing a physical line with the exempt tag was silently exempt
 * too — real in minified or generated markup, and it once defeated a test
 * that wrote its fixture document on one line.
 *
 * Run: node --test tests/unit/conformance-tag-scope.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const dir = mkdtempSync(join(tmpdir(), 'vb-conf-scope-'));

/** Run the checker over ONE physical line of body markup. */
function check(html) {
  const file = join(dir, `case-${Math.random().toString(36).slice(2)}.html`);
  writeFileSync(file, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title></head>\n<body>${html}</body></html>`);
  try {
    return execFileSync('node', ['scripts/quality/vb-conformance.js', file], { encoding: 'utf8' });
  } catch (err) {
    return `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
}

describe('vb/no-inline-style exemption is per tag', () => {
  it('still exempts a <link> that carries a style attribute', () => {
    const out = check('<link rel="preload" href="/x.css" style="display:none">');
    assert.ok(!out.includes('vb/no-inline-style'), out);
  });
  it('flags a styled element that shares the line with a <link>', () => {
    const out = check('<link rel="stylesheet" href="/x.css"><span style="color:red">x</span>');
    assert.match(out, /vb\/no-inline-style/, out);
  });
  it('flags a styled element that shares the line with a <meta>', () => {
    const out = check('<meta name="x" content="y"><p style="margin:0">x</p>');
    assert.match(out, /vb\/no-inline-style/, out);
  });
});

describe('vb/no-class-for-state exemption is per tag', () => {
  it('exempts <output class="error"> itself', () => {
    const out = check('<output class="error">x</output>');
    assert.ok(!out.includes('vb/no-class-for-state'), out);
  });
  it('flags a state class on another element that shares the line with an <output>', () => {
    const out = check('<output class="hint">x</output><span class="error">y</span>');
    assert.match(out, /vb\/no-class-for-state/, out);
  });
  it('examines every class attribute on the line, not just the first', () => {
    const out = check('<span class="tag">a</span><span class="active">b</span>');
    assert.match(out, /vb\/no-class-for-state/, out);
  });
});

describe('vb/icon-wc-required judges each <svg> by its own tag', () => {
  it('accepts an svg with role="img" even when the attribute is on a later line', () => {
    const out = check('<svg\n  role="img"><title>t</title></svg>');
    assert.ok(!out.includes('vb/icon-wc-required'), out);
  });
  it('flags an svg without an opt-out that shares the line with an opted-out one', () => {
    const out = check('<svg aria-hidden="true"></svg><svg></svg>');
    assert.match(out, /vb\/icon-wc-required/, out);
  });
});
