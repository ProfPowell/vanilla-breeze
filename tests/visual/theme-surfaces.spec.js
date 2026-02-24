/**
 * Theme Surface Visual Regression Tests
 *
 * Tiered approach:
 *   - Core themes (20): full screenshot comparison with baselines
 *   - Remaining themes: smoke test (page loads, no JS errors)
 *   - Both tiers test light + dark modes across desktop + mobile viewports
 *
 * Run:   npx playwright test tests/visual/theme-surfaces.spec.js
 * Update baselines: npx playwright test tests/visual/theme-surfaces.spec.js --update-snapshots
 */

import { test, expect } from 'playwright/test';
import { readdirSync } from 'fs';
import { join } from 'path';
import themeRegistry from '../../site/src/_data/themeRegistry.js';

const surfacesDir = join(import.meta.dirname, '../../demos/tools/theme-lab/surfaces');
const surfaces = readdirSync(surfacesDir)
  .filter(f => f.endsWith('.html') && !f.startsWith('_'))
  .sort();

// Core themes — baselines committed, full regression-tested
const CORE_THEMES = [
  'default', 'ocean', 'forest', 'modern', 'minimal', 'classic',
  'swiss', 'brutalist', 'cyber', 'terminal', 'kawaii', '8bit',
  'nord', 'dracula', 'glassmorphism', 'art-deco', 'catppuccin-mocha',
  'vaporwave', 'neumorphism', 'a11y-high-contrast',
];

// All theme IDs from the registry
const ALL_THEMES = themeRegistry.map(t => t.id);

// Smoke-only themes = everything not in core
const SMOKE_THEMES = ALL_THEMES.filter(id => !CORE_THEMES.includes(id));

const modes = ['light', 'dark'];

// Kill animations/transitions for deterministic screenshots
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
`;

// ─── Core Visual Regression Tests ──────────────────────────────────
// 20 themes × 6 surfaces × 2 modes × 2 viewports = 480 baselines

// Surfaces with JS-driven random effects (scramble, typewriter) need looser tolerance
const DYNAMIC_SURFACES = ['interactive-components.html'];

test.describe('Core theme regression', () => {
  for (const surface of surfaces) {
    for (const theme of CORE_THEMES) {
      for (const mode of modes) {
        test(`${surface} / ${theme} / ${mode}`, async ({ page }) => {
          const params = new URLSearchParams({ theme, mode });
          await page.goto(`/docs/tools/theme-lab/surfaces/${surface}?${params}`);
          await page.waitForLoadState('networkidle');
          await page.addStyleTag({ content: FREEZE_CSS });
          await page.waitForTimeout(300);

          const tolerance = DYNAMIC_SURFACES.includes(surface) ? 0.08 : 0.03;
          await expect(page).toHaveScreenshot(
            `surface-${surface.replace('.html', '')}-${theme}-${mode}.png`,
            { fullPage: true, maxDiffPixelRatio: tolerance }
          );
        });
      }
    }
  }
});

// ─── Smoke Tests ──────────────────────────────────────────────────
// Remaining themes — verify pages load without JS errors (no baselines)

test.describe('Smoke test (non-core themes)', () => {
  for (const surface of surfaces) {
    for (const theme of SMOKE_THEMES) {
      for (const mode of modes) {
        test(`smoke: ${surface} / ${theme} / ${mode}`, async ({ page }) => {
          const errors = [];
          page.on('pageerror', err => errors.push(err.message));

          const params = new URLSearchParams({ theme, mode });
          const response = await page.goto(
            `/docs/tools/theme-lab/surfaces/${surface}?${params}`
          );
          await page.waitForLoadState('networkidle');

          expect(response.status()).toBeLessThan(400);
          expect(errors).toEqual([]);
        });
      }
    }
  }
});
