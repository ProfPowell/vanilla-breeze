/**
 * Card Grid Consistency Tests
 *
 * Verifies that cards within a grid row have consistent heights across
 * all core themes. For each theme, the test navigates to the card-grid
 * surface page, applies the theme, measures every card's bounding box,
 * groups cards into rows by Y position, and asserts that all cards in
 * a given row share the same height (within a 2px tolerance).
 *
 * A dark-mode subset is tested separately for themes whose dark palettes
 * are most likely to alter layout (brutalist, cyber, terminal, 8bit).
 */
import { test, expect } from 'playwright/test';

const CORE_THEMES = [
  'default', 'ocean', 'forest', 'modern', 'minimal', 'classic',
  'swiss', 'brutalist', 'cyber', 'terminal', 'kawaii', '8bit',
  'nord', 'dracula', 'glassmorphism', 'art-deco', 'catppuccin-mocha',
  'vaporwave', 'neumorphism', 'a11y-high-contrast',
];

const DARK_MODE_THEMES = ['brutalist', 'cyber', 'terminal', '8bit'];

const SURFACE_PATH = '/demos/tools/theme-lab/surfaces/card-grid.html';

/**
 * Apply a theme and color mode to the page's root element.
 */
async function applyTheme(page, theme, mode = 'light') {
  await page.evaluate(({ theme, mode }) => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', mode);
  }, { theme, mode });
}

/**
 * Measure all cards in the first grid section, group them into rows by
 * Y position, and assert equal heights within each row.
 *
 * Cards whose top edges are within `yTolerance` pixels of each other are
 * considered to be in the same row. Cards within a row must all share the
 * same height within `heightTolerance` pixels.
 */
async function assertCardRowAlignment(page, { yTolerance = 5, heightTolerance = 2 } = {}) {
  const grid = page.locator('[data-layout="grid"]').first();
  const cards = await grid.locator('.card').all();

  expect(cards.length).toBeGreaterThan(0);

  // Collect bounding boxes for every card
  const boxes = [];
  for (const card of cards) {
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    boxes.push(box);
  }

  // Group cards into rows by Y position
  const rows = [];
  for (const box of boxes) {
    const existingRow = rows.find(row =>
      Math.abs(row[0].y - box.y) <= yTolerance
    );
    if (existingRow) {
      existingRow.push(box);
    } else {
      rows.push([box]);
    }
  }

  // Assert consistent heights within each row
  for (const row of rows) {
    if (row.length < 2) continue;

    const referenceHeight = row[0].height;
    for (let i = 1; i < row.length; i++) {
      expect(
        Math.abs(row[i].height - referenceHeight),
        `Row at y~${Math.round(row[0].y)}: card ${i} height (${row[i].height}px) ` +
        `differs from first card (${referenceHeight}px) by more than ${heightTolerance}px`
      ).toBeLessThanOrEqual(heightTolerance);
    }
  }
}

test.describe('Card grid consistency', () => {
  for (const theme of CORE_THEMES) {
    test(`cards align in ${theme} theme`, async ({ page }) => {
      await page.goto(SURFACE_PATH, { waitUntil: 'networkidle' });
      await applyTheme(page, theme, 'light');
      await page.waitForLoadState('networkidle');

      await assertCardRowAlignment(page);
    });
  }
});

test.describe('Card grid consistency — dark mode', () => {
  for (const theme of DARK_MODE_THEMES) {
    test(`cards align in ${theme} theme (dark)`, async ({ page }) => {
      await page.goto(SURFACE_PATH, { waitUntil: 'networkidle' });
      await applyTheme(page, theme, 'dark');
      await page.waitForLoadState('networkidle');

      await assertCardRowAlignment(page);
    });
  }
});
