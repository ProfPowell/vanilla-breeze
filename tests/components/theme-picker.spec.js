/**
 * Theme Picker Web Component Behavior Tests
 *
 * Tests lifecycle (upgrade guard, reconnect), inline variant visibility,
 * and mode toggle functionality.
 */

import { test, expect } from 'playwright/test';

const inlinePage = '/demos/examples/demos/theme-picker-inline.html';

const waitForUpgrade = (page) =>
  page.waitForSelector('theme-picker[data-upgraded]', { timeout: 10_000 });

test.describe('theme-picker', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(inlinePage);
    await waitForUpgrade(page);

    await expect(page.locator('theme-picker')).toHaveAttribute('data-upgraded', '');
  });

  test('inline variant is visible', async ({ page }) => {
    await page.goto(inlinePage);
    await waitForUpgrade(page);

    const picker = page.locator('theme-picker[variant="inline"]');
    await expect(picker).toBeVisible();

    /* The panel should be visible immediately (no trigger needed) */
    const panel = picker.locator('.panel[role="dialog"]');
    await expect(panel).toBeVisible();
  });

  test('reconnect does not duplicate the panel', async ({ page }) => {
    await page.goto(inlinePage);
    await waitForUpgrade(page);

    const panelCountBefore = await page.evaluate(() => {
      const picker = document.querySelector('theme-picker');
      return picker.querySelectorAll('.panel[role="dialog"]').length;
    });

    /* Remove and re-append the element */
    await page.evaluate(() => {
      const picker = document.querySelector('theme-picker');
      const parent = picker.parentElement;
      parent.removeChild(picker);
      parent.appendChild(picker);
    });

    await waitForUpgrade(page);

    const panelCountAfter = await page.evaluate(() => {
      const picker = document.querySelector('theme-picker');
      return picker.querySelectorAll('.panel[role="dialog"]').length;
    });

    expect(panelCountAfter).toBe(panelCountBefore);
  });

  test('mode toggle changes the theme mode', async ({ page }) => {
    await page.goto(inlinePage);
    await waitForUpgrade(page);

    /* Click the "dark" mode radio */
    const darkRadio = page.locator('theme-picker input[type="radio"][value="dark"]');
    await darkRadio.click();

    /* The html element should reflect the mode change */
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  });
});
