/**
 * Consent Banner Web Component Behavior Tests
 *
 * Tests consent flow: show, accept/reject, localStorage persistence,
 * trigger re-open, and position variants.
 */

import { test, expect } from 'playwright/test';

const simplePage = '/demos/snippets/demos/consent-banner-simple.html';
const granularPage = '/demos/snippets/demos/consent-banner-granular.html';
const positionsPage = '/demos/snippets/demos/consent-banner-positions.html';

/* Each test gets a fresh browser context (isolated localStorage). */

test.describe('consent-banner — simple', () => {

  test('dialog is visible on first load', async ({ page }) => {
    await page.goto(simplePage);
    await page.waitForLoadState('networkidle');

    const dialog = page.locator('consent-banner dialog');
    await expect(dialog).toBeVisible();
  });

  test('accept stores consent and removes banner', async ({ page }) => {
    await page.goto(simplePage);
    await page.waitForLoadState('networkidle');

    await page.click('button[value="accept"]');

    /* Banner should be gone from the DOM */
    await expect(page.locator('consent-banner')).toHaveCount(0);

    /* localStorage should have consent */
    const stored = await page.evaluate(() => localStorage.getItem('demo-simple'));
    const parsed = JSON.parse(stored);
    expect(parsed.action).toBe('accept');
    expect(parsed.timestamp).toBeGreaterThan(0);
  });

  test('reject stores consent and removes banner', async ({ page }) => {
    await page.goto(simplePage);
    await page.waitForLoadState('networkidle');

    await page.click('button[value="reject"]');

    await expect(page.locator('consent-banner')).toHaveCount(0);

    const stored = await page.evaluate(() => localStorage.getItem('demo-simple'));
    expect(JSON.parse(stored).action).toBe('reject');
  });

  test('banner does not reappear after consent', async ({ page }) => {
    await page.goto(simplePage);
    await page.waitForLoadState('networkidle');
    await page.click('button[value="accept"]');

    /* Reload page */
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('consent-banner')).toHaveCount(0);
  });

  test('dispatches consent-banner:change event', async ({ page }) => {
    await page.goto(simplePage);
    await page.waitForLoadState('networkidle');

    const eventPromise = page.evaluate(() => {
      return new Promise(resolve => {
        document.addEventListener('consent-banner:change', (e) => {
          resolve(e.detail);
        }, { once: true });
      });
    });

    await page.click('button[value="accept"]');
    const detail = await eventPromise;
    expect(detail.action).toBe('accept');
  });
});

test.describe('consent-banner — granular', () => {

  test('save stores individual checkbox preferences', async ({ page }) => {
    await page.goto(granularPage);
    await page.waitForLoadState('networkidle');

    /* Check analytics, leave marketing unchecked */
    await page.check('input[name="analytics"]');
    await page.click('button[value="save"]');

    const stored = await page.evaluate(() => localStorage.getItem('demo-granular'));
    const parsed = JSON.parse(stored);
    expect(parsed.action).toBe('save');
    expect(parsed.preferences.necessary).toBe(true);
    expect(parsed.preferences.analytics).toBe(true);
    expect(parsed.preferences.marketing).toBe(false);
  });

  test('accept marks all preferences true', async ({ page }) => {
    await page.goto(granularPage);
    await page.waitForLoadState('networkidle');

    await page.click('button[value="accept"]');

    const stored = await page.evaluate(() => localStorage.getItem('demo-granular'));
    const parsed = JSON.parse(stored);
    expect(parsed.preferences.analytics).toBe(true);
    expect(parsed.preferences.marketing).toBe(true);
  });

  test('reject only keeps necessary true', async ({ page }) => {
    await page.goto(granularPage);
    await page.waitForLoadState('networkidle');

    await page.click('button[value="reject"]');

    const stored = await page.evaluate(() => localStorage.getItem('demo-granular'));
    const parsed = JSON.parse(stored);
    expect(parsed.preferences.necessary).toBe(true);
    expect(parsed.preferences.analytics).toBe(false);
    expect(parsed.preferences.marketing).toBe(false);
  });

  test('trigger re-opens with stored preferences', async ({ page }) => {
    await page.goto(granularPage);
    await page.waitForLoadState('networkidle');

    /* Accept all first */
    await page.click('button[value="accept"]');
    await expect(page.locator('consent-banner dialog')).not.toBeVisible();

    /* Click manage cookies trigger */
    await page.click('#manage-cookies');
    await expect(page.locator('consent-banner dialog')).toBeVisible();

    /* Checkboxes should reflect stored preferences */
    await expect(page.locator('input[name="analytics"]')).toBeChecked();
    await expect(page.locator('input[name="marketing"]')).toBeChecked();
  });
});

test.describe('consent-banner — positions', () => {

  test('bottom banner has fixed positioning', async ({ page }) => {
    await page.goto(positionsPage);
    await page.waitForLoadState('networkidle');
    await page.click('#show-bottom');

    const dialog = page.locator('consent-banner dialog[open]');
    await expect(dialog).toBeVisible();

    const position = await dialog.evaluate(el => getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });

  test('top banner has fixed positioning at top', async ({ page }) => {
    await page.goto(positionsPage);
    await page.waitForLoadState('networkidle');
    await page.click('#show-top');

    const dialog = page.locator('consent-banner[data-position="top"] dialog[open]');
    await expect(dialog).toBeVisible();

    const position = await dialog.evaluate(el => getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });

  test('center banner opens as modal', async ({ page }) => {
    await page.goto(positionsPage);
    await page.waitForLoadState('networkidle');
    await page.click('#show-center');

    const dialog = page.locator('consent-banner[data-position="center"] dialog[open]');
    await expect(dialog).toBeVisible();
  });
});
