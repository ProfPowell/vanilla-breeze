/**
 * Carousel Web Component Behavior Tests
 *
 * Tests navigation, indicators, and keyboard controls
 * for the carousel-wc component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/carousel-basic.html';

test.describe('carousel-wc', () => {

  test('renders carousel with slides', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const carousel = page.locator('carousel-wc').first();
    await expect(carousel).toBeVisible();
  });

  test('has navigation controls', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // Look for prev/next buttons
    const buttons = page.locator('carousel-wc').first().locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('carousel is keyboard accessible', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // Focus goes to the internal track element (tabindex="0"), not the outer element
    const track = page.locator('carousel-wc').first().locator('.carousel-track');
    await track.focus();
    await expect(track).toBeFocused();
  });

});
