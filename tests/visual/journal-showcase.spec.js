/**
 * Journal showcase — integration + page-wiring checks.
 *
 * Part A (cascade): injects the BUILT full VB CSS + journal theme + journal pack
 * from dist/ (so @layer order matches production), sets data-theme="journal",
 * renders representative markup, and asserts the recipes win — including the
 * doodle <hr> overriding VB's base ornament rule (sub-project B's deferred clang).
 *
 * Part B (wiring): statically reads the showcase HTML and asserts it wires the
 * theme, pack, border-wc, rough filters, and the key recipes — no server needed.
 */
import { test, expect } from 'playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(import.meta.dirname, '../..');
const vbCss = readFileSync(join(root, 'dist/cdn/vanilla-breeze.css'), 'utf8');
const themeCss = readFileSync(join(root, 'dist/cdn/themes/journal.css'), 'utf8');
const packCss = readFileSync(join(root, 'dist/cdn/packs/journal.full.css'), 'utf8');
const pageHtml = readFileSync(
  join(root, 'demos/examples/demos/journal-theme-showcase.html'),
  'utf8'
);

async function mountFullStack(page, bodyHtml) {
  await page.setContent('<!doctype html><title>t</title>' + bodyHtml);
  await page.evaluate(
    ({ vbCss, themeCss, packCss }) => {
      // DOM order = cascade/layer order: VB base, then theme tokens, then pack.
      for (const css of [vbCss, themeCss, packCss]) {
        const s = document.createElement('style');
        s.textContent = css;
        document.head.appendChild(s);
      }
      document.documentElement.setAttribute('data-theme', 'journal');
    },
    { vbCss, themeCss, packCss }
  );
}

function css(page, selector, prop, pseudo = null) {
  return page.evaluate(
    ({ selector, prop, pseudo }) =>
      getComputedStyle(document.querySelector(selector), pseudo).getPropertyValue(prop),
    { selector, prop, pseudo }
  );
}

test('cascade: recipes win under full VB; doodle overrides the base ornament', async ({ page }) => {
  await mountFullStack(
    page,
    '<div id="pg" data-journal="page"></div>' +
      '<div id="s" data-callout="sticky">n</div>' +
      '<mark id="m">x</mark>' +
      '<hr id="d" data-ornament="doodle">'
  );
  expect(await css(page, '#pg', 'background-image')).toContain('radial-gradient');
  expect(await css(page, '#s', 'transform')).not.toBe('none');
  expect(await css(page, '#m', 'background-image')).toContain('gradient');
  // B's deferred clang: pack's bundle-effects layer must beat VB's base hr[data-ornament]::before
  const ornament = await page.evaluate(
    () => getComputedStyle(document.querySelector('#d'), '::before').content
  );
  expect(ornament).not.toContain('doodle'); // base attr-text is overridden
  const mask = await css(page, '#d', 'mask-image');
  expect(mask).toContain('url('); // squiggle mask applied
});

test('wiring: the showcase page loads theme, pack, border-wc, rough filters, recipes', async () => {
  expect(pageHtml).toContain('data-theme="journal"');
  expect(pageHtml).toContain('/cdn/packs/journal.full.css');
  expect(pageHtml).toContain('@profpowell/border-wc@'); // wired (version-agnostic)
  expect(pageHtml).toContain('id="vb-rough-light"');
  expect(pageHtml).toContain('.jr-sketch { filter: var(--filter-rough-light)'); // the real style rule, not the doc <code>
  expect(pageHtml).toContain('data-journal="page"');
  expect(pageHtml).toContain('effect="washi"');
  expect(pageHtml).toContain('data-ornament="doodle"');
  expect(pageHtml).toContain('data-journal="rapid-log"');
  expect(pageHtml).toContain('data-journal="tracker"');
  expect(pageHtml).toContain('data-callout="sticky"');
  expect(pageHtml).toContain('data-journal="photo"');
});
