/**
 * Unit tests for the social-links element files
 *
 * Run with: node --test tests/unit/social-links.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dir = new URL('../../src/web-components/social-links/', import.meta.url);
const read = (f) => readFileSync(new URL(f, dir), 'utf8');

describe('social-links api.json', () => {
  const api = JSON.parse(read('api.json'));
  const attr = (n) => api.attributes.find((a) => a.name === n);

  it('describes the element', () => {
    assert.equal(api.element, 'social-links');
  });
  it('lists services, variant and color', () => {
    assert.ok(attr('services'));
    assert.ok(attr('color'));
    assert.deepEqual(attr('variant').values, ['icon', 'label', 'icon-label']);
    for (const a of api.attributes) assert.ok(a.kind && a.purpose, a.name);
  });
});

describe('social-links styles.css', () => {
  const css = read('styles.css');

  it('has a mask rule per service', () => {
    for (const s of ['bluesky', 'mastodon', 'github', 'linkedin', 'youtube', 'link']) {
      const re = new RegExp(`\\.social-icon\\[data-service="${s}"\\][^{]*\\{[^}]*mask[^}]*data:image/svg\\+xml`);
      assert.match(css, re, s);
    }
  });
  it('paints icons with currentColor', () => {
    assert.match(css, /background:\s*currentColor/);
  });
  it('supports variants, color and empty state', () => {
    assert.match(css, /social-links\[variant="icon"\]/);
    assert.match(css, /social-links\[variant="label"\]/);
    assert.match(css, /social-links\[color\]/);
    assert.match(css, /social-links:not\(:has\(li\)\)/);
  });
  it('uses var(--…) tokens for colour and space', () => {
    const noUrls = css.replace(/url\("data:[^"]*"\)/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const decls = noUrls.match(/(?:color|gap|padding|margin|inset)[a-z-]*\s*:[^;]+;/g) ?? [];
    for (const d of decls.filter((x) => !/^(margin:\s*-1px|padding:\s*0);$/.test(x.trim()))) {
      assert.doesNotMatch(d, /#[0-9a-f]{3,8}\b|\b\d+(\.\d+)?(px|rem|em)\b(?![^()]*\))/i, d);
    }
  });
});

describe('social-links logic.js', () => {
  const js = read('logic.js');
  it('observes the three attributes', () => {
    assert.match(js, /observedAttributes\s*=\s*\['services',\s*'variant',\s*'color'\]/);
  });
  it('registers once and does not fetch', () => {
    assert.match(js, /registerComponent\('social-links'/);
    assert.doesNotMatch(js, /fetch\(/);
  });
});
