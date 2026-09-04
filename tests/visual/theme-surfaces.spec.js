/**
 * Per-theme visual regression (vanilla-breeze-iwuq).
 *
 * Screenshots demos/examples/demos/theme-surfaces.html — one page of every
 * common surface — under every theme the CDN ships plus the bundled ones,
 * in light and dark mode, and the form-validation demo in light mode. This
 * replaces the theme-lab surfaces coverage lost in the pack decomposition
 * and is the check that the cascade work (themes in @layer bundle-theme,
 * tokens-layer cleanup, cursor hook, scale rename) can be re-run against.
 *
 * Themes are applied the way the theme loader does it: data-theme on <html>
 * plus a <link> to /cdn/themes/<name>.css for the on-demand themes (the
 * bundled personality and a11y themes need no link). Desktop only — the
 * mobile project is skipped; theme diffs do not depend on the viewport.
 *
 * Run:    npx playwright test tests/visual/theme-surfaces.spec.js
 * Update: npx playwright test tests/visual/theme-surfaces.spec.js --update-snapshots
 */

import { test, expect } from 'playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const manifest = JSON.parse(readFileSync(join(import.meta.dirname, '../../dist/cdn/themes/manifest.json'), 'utf8'));
const CDN_THEMES = Object.keys(manifest).sort();
const BUNDLED = ['default', 'modern', 'minimal', 'classic', 'a11y-high-contrast', 'a11y-large-text', 'a11y-dyslexia'];
// modern/minimal/classic are bundled AND shipped as CDN files — list them once.
const THEMES = [...new Set([...BUNDLED, ...CDN_THEMES])];

async function applyTheme(page, theme, mode) {
  await page.evaluate(async ([t, m, cdn]) => {
    document.documentElement.dataset.mode = m;
    if (t !== 'default') document.documentElement.dataset.theme = t;
    if (cdn) {
      await new Promise((done) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `/cdn/themes/${t}.css`;
        link.onload = done;
        link.onerror = done;
        document.head.append(link);
      });
    }
    await document.fonts.ready;
  }, [theme, mode, CDN_THEMES.includes(theme)]);
  await page.waitForTimeout(400);
}

test.describe('theme surfaces', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 600, 'desktop only');

  for (const theme of THEMES) {
    for (const mode of ['light', 'dark']) {
      test(`${theme} ${mode}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: mode });
        await page.goto('/docs/examples/demos/theme-surfaces.html');
        await page.waitForLoadState('networkidle');
        await applyTheme(page, theme, mode);
        await expect(page).toHaveScreenshot(`surfaces-${theme}-${mode}.png`, { fullPage: true, animations: 'disabled' });
      });
    }
    test(`${theme} form-validation`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
      await page.goto('/docs/examples/demos/form-validation.html');
      await page.waitForLoadState('networkidle');
      await applyTheme(page, theme, 'light');
      await expect(page).toHaveScreenshot(`form-${theme}.png`, { fullPage: true, animations: 'disabled' });
    });
  }
});
