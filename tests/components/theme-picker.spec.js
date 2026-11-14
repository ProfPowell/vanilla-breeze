/**
 * Theme Picker Web Component Behavior Tests
 *
 * Tests lifecycle (upgrade guard, reconnect), inline variant visibility,
 * and mode toggle functionality.
 */

import { test, expect } from 'playwright/test';

const inlinePage = '/docs/examples/demos/theme-picker-inline.html';

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
    /* Always visible, so it is a named group rather than a dialog */
    const panel = picker.locator('.panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('role', 'group');
    await expect(panel).toHaveAttribute('aria-label', /\S/);
  });

  test('reconnect does not duplicate the panel', async ({ page }) => {
    await page.goto(inlinePage);
    await waitForUpgrade(page);

    const panelCountBefore = await page.evaluate(() => {
      const picker = document.querySelector('theme-picker');
      return picker.querySelectorAll('.panel[role="group"]').length;
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
      return picker.querySelectorAll('.panel[role="group"]').length;
    });

    expect(panelCountAfter).toBe(panelCountBefore);
  });

  test('mode toggle changes the theme mode', async ({ page }) => {
    await page.goto(inlinePage);
    await waitForUpgrade(page);

    /* Click the "dark" mode option — the styled label is the click surface
       (it covers the radio input) */
    const darkOption = page.locator('theme-picker label.seg', {
      has: page.locator('input[type="radio"][value="dark"]'),
    });
    await darkOption.click();

    /* The html element should reflect the mode change */
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  });

  test('the theme select is named once, by its legend', async ({ page }) => {
    await page.goto(inlinePage);
    await waitForUpgrade(page);

    const select = page.locator('theme-picker select.theme-select');
    await expect(select).not.toHaveAttribute('aria-label');
    await expect(select).toHaveAccessibleName('Theme');
    /* The one name source is the legend of the surrounding fieldset */
    const sources = await select.evaluate((el) => {
      const legend = el.closest('fieldset')?.querySelector('legend');
      return {
        labelledBy: el.getAttribute('aria-labelledby'),
        legendId: legend?.id,
        labels: /** @type {HTMLSelectElement} */ (el).labels.length,
        title: el.hasAttribute('title'),
      };
    });
    expect(sources.labelledBy).toBeTruthy();
    expect(sources.labelledBy).toBe(sources.legendId);
    expect(sources.labels).toBe(0);
    expect(sources.title).toBe(false);
  });
});
