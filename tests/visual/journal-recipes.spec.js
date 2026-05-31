/**
 * Journal component recipes — computed-style checks.
 * Server-independent: injects the journal theme CSS + pack CSS from disk, sets
 * data-theme="journal" on the document element, renders markup, and asserts the
 * recipes' computed styles (including pseudo-elements).
 */
import { test, expect } from 'playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(import.meta.dirname, '../..');
const themeCss = readFileSync(join(root, 'src/tokens/themes/_extreme-journal.css'), 'utf8');
const packCss = readFileSync(join(root, 'src/packs/journal/journal.effects.css'), 'utf8');

async function mount(page, bodyHtml, { mode } = {}) {
  await page.setContent('<!doctype html><title>t</title>' + bodyHtml);
  await page.evaluate(
    ({ themeCss, packCss, mode }) => {
      for (const css of [themeCss, packCss]) {
        const s = document.createElement('style');
        s.textContent = css;
        document.head.appendChild(s);
      }
      const el = document.documentElement;
      el.setAttribute('data-theme', 'journal');
      if (mode) el.setAttribute('data-mode', mode);
    },
    { themeCss, packCss, mode }
  );
}

// Computed style of an element (or its pseudo-element).
function css(page, selector, prop, pseudo = null) {
  return page.evaluate(
    ({ selector, prop, pseudo }) =>
      getComputedStyle(document.querySelector(selector), pseudo).getPropertyValue(prop),
    { selector, prop, pseudo }
  );
}

test('highlighter: <mark> uses a gradient; tints vary', async ({ page }) => {
  await mount(page, '<mark id="a">x</mark><mark id="b" data-tint="mint">y</mark>');
  const a = await css(page, '#a', 'background-image');
  const b = await css(page, '#b', 'background-image');
  expect(a).toContain('gradient');
  expect(a).not.toBe(b); // butter (default) vs mint
});

test('doodle divider: masked squiggle, not the literal attr text', async ({ page }) => {
  await mount(page, '<hr id="d" data-ornament="doodle">');
  // Chromium resolves `mask` to mask-image; the squiggle is a data-URI url().
  const mask = await css(page, '#d', 'mask-image');
  expect(mask).toContain('url('); // a mask image (the squiggle), not text
  const before = await page.evaluate(
    () => getComputedStyle(document.querySelector('#d'), '::before').content
  );
  expect(before).not.toContain('doodle'); // base attr-text is neutralized
});

test('sticky note: rotated callout with a curl corner', async ({ page }) => {
  await mount(page, '<div id="s" data-callout="sticky">note</div>');
  expect(await css(page, '#s', 'transform')).not.toBe('none'); // rotate(-2deg) -> matrix(...)
  const curl = await page.evaluate(
    () => getComputedStyle(document.querySelector('#s'), '::after').clipPath
  );
  expect(curl).not.toBe('none'); // curl corner
});

test('taped photo: tape corners + rotation', async ({ page }) => {
  await mount(
    page,
    '<figure id="p" data-journal="photo"><img src="data:," alt=""><figcaption>c</figcaption></figure>'
  );
  expect(await css(page, '#p', 'transform')).not.toBe('none');
  const tape = await page.evaluate(
    () => getComputedStyle(document.querySelector('#p'), '::before').content
  );
  expect(tape).toBe('""'); // Chromium serializes the applied content:"" as the string '""'
});
