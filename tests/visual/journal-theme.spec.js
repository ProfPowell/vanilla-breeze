/**
 * Journal theme — computed-style checks.
 *
 * Server-independent: reads _extreme-journal.css from disk, injects it, sets
 * data-theme/data-mode on the document element, and asserts the resolved tokens.
 * Lightness is parsed from the oklch() value so the checks survive minor tuning.
 */
import { test, expect } from 'playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(import.meta.dirname, '../..');
const themeCss = readFileSync(join(root, 'src/tokens/themes/_extreme-journal.css'), 'utf8');

// First number after `oklch(` is the lightness (0..1).
function lightnessOf(value) {
  const m = /oklch\(\s*([0-9.]+)/.exec(value);
  return m ? parseFloat(m[1]) : NaN;
}

async function readTokens(page, { mode } = {}) {
  return page.evaluate(
    ({ css, mode }) => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
      const el = document.documentElement;
      el.setAttribute('data-theme', 'journal');
      if (mode) el.setAttribute('data-mode', mode);
      else el.removeAttribute('data-mode');
      const cs = getComputedStyle(el);
      const get = (n) => cs.getPropertyValue(n).trim();
      return {
        background: get('--color-background'),
        text: get('--color-text'),
        primary: get('--color-primary'),
        accent: get('--color-accent'),
        pageImage: get('--page-bg-image'),
        pageSize: get('--page-bg-size'),
      };
    },
    { css: themeCss, mode }
  );
}

test('light: paper background, ink text, deep-mint primary, dot-grid page bg', async ({ page }) => {
  await page.setContent('<!doctype html><title>t</title>');
  const t = await readTokens(page);
  expect(lightnessOf(t.background)).toBeGreaterThan(0.9); // paper
  expect(lightnessOf(t.text)).toBeLessThan(0.45); // ink
  const pl = lightnessOf(t.primary);
  expect(pl).toBeGreaterThan(0.45); // deep mint, not the pastel (~0.86)
  expect(pl).toBeLessThan(0.65);
  expect(t.pageImage).toContain('radial-gradient'); // dot grid
  expect(t.pageSize).toContain('22px');
});
