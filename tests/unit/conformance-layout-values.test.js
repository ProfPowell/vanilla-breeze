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

describe('vb/layout-attr-value regression: bare-guard attributes stay validated', () => {
  // threshold, overlap, and subgrid each pair a bare "applies regardless of
  // value" guard selector with real [data-layout-X="token"] rules. An
  // earlier version of readPresenceAttrs treated the bare guard as proof
  // the attribute had no vocabulary and fully exempted all three from
  // validation — data-layout-threshold="99rem" and data-layout-overlap="99px"
  // went completely unflagged, unprotecting two of the three attributes
  // this whole vocabulary effort exists to tokenize. These lock the fix.

  it('flags a raw length on threshold and accepts a real token', () => {
    const bad = check('<section data-layout="switcher" data-layout-threshold="99rem">x</section>');
    assert.match(bad, /vb\/layout-attr-value/, bad);

    const good = check('<section data-layout="switcher" data-layout-threshold="m">x</section>');
    assert.ok(!good.includes('vb/layout-attr-value'), good);
  });

  it('flags a raw length on overlap and accepts a real token', () => {
    const bad = check('<section data-layout="cluster" data-layout-overlap="99px">x</section>');
    assert.match(bad, /vb\/layout-attr-value/, bad);

    const good = check('<section data-layout="cluster" data-layout-overlap="s">x</section>');
    assert.ok(!good.includes('vb/layout-attr-value'), good);
  });

  it('flags an out-of-range count on subgrid; accepts a real count and the bare form', () => {
    const bad = check('<section data-layout="grid" data-layout-subgrid="9">x</section>');
    assert.match(bad, /vb\/layout-attr-value/, bad);

    const good = check('<section data-layout="grid" data-layout-subgrid="2">x</section>');
    assert.ok(!good.includes('vb/layout-attr-value'), good);

    // Bare form (no "=" at all) never enters the value-checking regex in
    // the first place — it's the [data-layout-subgrid] default (span 3).
    const bare = check('<section data-layout="grid" data-layout-subgrid>x</section>');
    assert.ok(!bare.includes('vb/layout-attr-value'), bare);
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
  it('allows a style attribute holding only escape-hatch custom properties', () => {
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

  it('flags a custom property that is not one of the three documented escape hatches', () => {
    // --_gap is a VB-private internal (the underscore prefix marks it as
    // such), and --size-m is a real design token but not a layout escape
    // hatch. The exemption is for ESCAPE_HATCH_PROPS specifically, not
    // "any custom property" — a bare `startsWith('--')` check blesses
    // exactly the silent no-op this rule exists to catch (a style
    // attribute nothing reads).
    const out = check('<section style="--_gap: 40px; --size-m: 100px">x</section>');
    assert.match(out, /vb\/no-inline-style/, out);
  });

  it('flags a second style attribute on the same line even when the first is exempt', () => {
    // Regression: a bare line.match() (no /g) returns only the first
    // style="..." on the line, so an exempt first attribute used to
    // blanket-exempt the whole line — including a genuinely-styled sibling
    // element sharing the line. matchAll must evaluate each independently.
    const out = check(
      '<section style="--layout-min: 220px"><span style="color: red">x</span></section>'
    );
    assert.match(out, /vb\/no-inline-style/, out);
  });
});
