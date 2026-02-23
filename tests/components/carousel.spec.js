/**
 * Carousel Web Component Behavior Tests
 *
 * Tests navigation, indicators, and keyboard controls
 * for the carousel-wc component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/carousel-basic.html';

test.describe('carousel-wc', () => {

  test('renders carousel with slides', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const carousel = page.locator('carousel-wc');
    await expect(carousel).toBeVisible();
  });

  test('has navigation controls', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // Look for prev/next buttons
    const buttons = page.locator('carousel-wc button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('carousel is keyboard accessible', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const carousel = page.locator('carousel-wc');
    await carousel.focus();

    // Should be focusable
    await expect(carousel).toBeFocused();
  });

});
