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

  test('the theme select is named once, by its label, with no group around it', async ({ page }) => {
    await page.goto(inlinePage);
    await waitForUpgrade(page);

    const select = page.locator('theme-picker select.theme-select');
    await expect(select).not.toHaveAttribute('aria-label');
    await expect(select).not.toHaveAttribute('aria-labelledby');
    await expect(select).toHaveAccessibleName('Theme');
    const sources = await select.evaluate((el) => {
      const sel = /** @type {HTMLSelectElement} */ (el);
      const panel = sel.closest('.panel');
      /* Every grouping ancestor between the select and the panel */
      const groups = [];
      for (let n = sel.parentElement; n && n !== panel; n = n.parentElement) {
        if (n.matches('fieldset, [role="group"], [role="radiogroup"]')) groups.push(n.tagName);
      }
      return {
        labels: [...sel.labels].map((l) => ({ text: l.textContent.trim(), visible: l.getClientRects().length > 0 })),
        groups,
        title: sel.hasAttribute('title'),
        /* The mode radios keep their fieldset */
        modeGroup: !!panel.querySelector('fieldset[role="radiogroup"] > legend'),
      };
    });
    expect(sources.labels).toEqual([{ text: 'Theme', visible: true }]);
    expect(sources.groups).toEqual([]);
    expect(sources.title).toBe(false);
    expect(sources.modeGroup).toBe(true);
  });
});
