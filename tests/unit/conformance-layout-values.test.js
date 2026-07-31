/**
 * vb/layout-attr-value rejects values outside the parsed vocabulary, and
 * vb/no-inline-style tolerates a custom-property-only style attribute so
 * the documented escape hatch is not a conformance error.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const dir = mkdtempSync(join(tmpdir(), 'vb-conf-'));

/**
 * Run the conformance checker over one snippet.
 *
 * @param {string} html
 * @returns {string} combined stdout
 */
function check(html) {
  const file = join(dir, `case-${Math.random().toString(36).slice(2)}.html`);
  // Head and body are on separate lines: vb-conformance scans line-by-line,
  // and vb/no-inline-style skips any line containing a <meta> or <link> tag
  // (a pre-existing guard, unrelated to this rule). Cramming the whole
  // document onto one line would put the test snippet on the same physical
  // line as <meta charset>, silently defeating every no-inline-style case
  // below — not a behavior of the rule under test, just a line-scanning
  // artifact. Real markup never puts <meta> and page content on one line.
  writeFileSync(
    file,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title></head>\n<body>${html}</body></html>`
  );
  try {
    return execFileSync('node', ['scripts/quality/vb-conformance.js', file], { encoding: 'utf8' });
  } catch (err) {
    return `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
}

describe('vb/layout-attr-value', () => {
  it('accepts a value in the vocabulary', () => {
    const out = check('<section data-layout="grid" data-layout-min="m">x</section>');
    assert.ok(!out.includes('vb/layout-attr-value'), out);
  });

  it('flags a raw length', () => {
    const out = check('<section data-layout="grid" data-layout-min="220px">x</section>');
    assert.match(out, /vb\/layout-attr-value/);
    assert.match(out, /220px/);
  });

  it('flags a keyword typo', () => {
    const out = check('<section data-layout="cluster" data-layout-justify="flex-end">x</section>');
    assert.match(out, /vb\/layout-attr-value/);
  });

  it('flags an attribute name that does not exist', () => {
    const out = check('<section data-layout="grid" data-layout-min-width="280px">x</section>');
    assert.match(out, /vb\/layout-attr-value/);
  });
});

describe('vb/layout-attr-value presence-only attributes', () => {
  it('accepts a presence attribute with no value at all', () => {
    const out = check('<section data-layout="cover" data-layout-centered>x</section>');
    assert.ok(!out.includes('vb/layout-attr-value'), out);
  });

  it('accepts a presence attribute with an explicit empty value', () => {
    // The false positive: [data-layout-centered] matches any value,
    // including "", in the browser. data-layout-centered="" is exactly as
    // valid as bare data-layout-centered and must not be flagged.
    const out = check('<section data-layout="cover" data-layout-centered="">x</section>');
    assert.ok(!out.includes('vb/layout-attr-value'), out);
  });

  it('still flags a raw length on a value-taking attribute that also has a local presence selector', () => {
    // gap has a bare [data-layout="center"][data-layout-gap] selector, but
    // it is a real, widely-reused token vocabulary — an unrecognized value
    // must still be caught (this is the effects-kitchen-sink.html bug
    // fixed in this same batch: data-layout-gap="0" instead of "none").
    const out = check('<main data-layout="stack" data-layout-gap="0">x</main>');
    assert.match(out, /vb\/layout-attr-value/);
  });
});

describe('vb/layout-attr-value escape-hatch suggestion', () => {
  it('suggests the custom property for an attribute that actually has one', () => {
    const out = check('<section data-layout="grid" data-layout-min="220px">x</section>');
    assert.match(out, /--layout-min/);
  });

  it('does not suggest a custom property for an attribute with no escape hatch', () => {
    // --layout-justify does not exist anywhere in the CSS. Suggesting it
    // would tell the author to write a style attribute that silently does
    // nothing — the exact failure class this rule exists to catch.
    const out = check('<section data-layout="cluster" data-layout-justify="flex-end">x</section>');
    assert.match(out, /vb\/layout-attr-value/);
    assert.doesNotMatch(out, /--layout-/);
    // The valid values must still be named so there is real guidance left.
    assert.match(out, /between/);
  });
});

describe('vb/no-inline-style escape hatch', () => {
  it('allows a style attribute holding only custom properties', () => {
    const out = check('<section data-layout="grid" style="--layout-min: 220px">x</section>');
    assert.ok(!out.includes('vb/no-inline-style'), out);
  });

  it('still flags a real declaration', () => {
    const out = check('<section style="color: red">x</section>');
    assert.match(out, /vb\/no-inline-style/);
  });

  it('still flags custom properties mixed with a real declaration', () => {
    const out = check('<section style="--layout-min: 220px; color: red">x</section>');
    assert.match(out, /vb\/no-inline-style/);
  });
});
