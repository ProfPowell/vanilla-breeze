/**
 * Star Rating Web Component Behavior Tests
 *
 * Tests upgrade lifecycle, star rendering, value updates,
 * cross-instance isolation, and reconnect safety.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/rating-basic.html';

test.describe('star-rating — baseline', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('star-rating[data-upgraded]');

    const upgraded = page.locator('star-rating[data-upgraded]');
    await expect(upgraded.first()).toBeVisible();
  });

  test('has star inputs (radios)', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('star-rating[data-upgraded]');

    const radios = page.locator('star-rating[data-upgraded] input[type="radio"]');
    const count = await radios.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

test.describe('star-rating — interaction', () => {

  test('clicking a star updates the value', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('star-rating[data-upgraded]');

    // Use the first interactive star-rating (name="wc-rating")
    const rating = page.locator('star-rating[name="wc-rating"]');
    const thirdStar = rating.locator('input[type="radio"][value="3"]');
    await thirdStar.click({ force: true });

    const value = await rating.evaluate(el => el.value);
    expect(value).toBe(3);
  });
});

test.describe('star-rating — isolation', () => {

  test('two instances do not interfere with each other', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('star-rating[data-upgraded]');

    // Pick two different interactive star-rating instances
    const ratingA = page.locator('star-rating[name="wc-rating"]');
    const ratingB = page.locator('star-rating[name="wc-half"]');

    // Click star 4 in instance A
    await ratingA.locator('input[type="radio"][value="4"]').click({ force: true });

    // Instance B should still hold its pre-set value (3.5), not be affected by A
    const valueB = await ratingB.evaluate(el => el.value);
    expect(valueB).toBe(3.5);

    // Instance A should have the value we just set
    const valueA = await ratingA.evaluate(el => el.value);
    expect(valueA).toBe(4);
  });
});

test.describe('star-rating — lifecycle', () => {

  test('reconnect does not duplicate the star fieldset', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('star-rating[data-upgraded]');

    const fieldsetCount = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.querySelector('star-rating[name="wc-rating"]');
        const parent = el.parentElement;

        // Disconnect and reconnect
        parent.removeChild(el);
        parent.appendChild(el);

        // Wait for reconnect upgrade
        requestAnimationFrame(() => {
          const fieldsets = el.querySelectorAll('fieldset');
          resolve(fieldsets.length);
        });
      });
    });

    expect(fieldsetCount).toBe(1);
  });
});
