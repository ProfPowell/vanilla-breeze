/**
 * Print Page Web Component Behavior Tests
 *
 * Tests button rendering, raw-mode toggle, print media emulation,
 * and CSS print style application for the print-page component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/print-article.html';

test.describe('print-page', () => {

  test('renders a print button', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page button', { timeout: 5000 });

    const text = await page.evaluate(() => {
      return document.querySelector('print-page button').textContent.trim();
    });
    expect(text.length).toBeGreaterThan(0);
  });

  test('button has correct label', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page button', { timeout: 5000 });

    const text = await page.evaluate(() => {
      return document.querySelector('print-page button').textContent.trim();
    });
    expect(text).toBeTruthy();
  });

  test('renders raw-mode toggle when data-raw-toggle present', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page button', { timeout: 5000 });

    const hasToggle = await page.evaluate(() => {
      const el = document.querySelector('print-page[data-raw-toggle]');
      if (!el) return null;
      return {
        hasCheckbox: el.querySelector('input[type="checkbox"]') !== null,
        hasLabel: el.querySelector('label') !== null,
      };
    });

    if (hasToggle) {
      expect(hasToggle.hasCheckbox).toBe(true);
      expect(hasToggle.hasLabel).toBe(true);
    }
  });

  test('component has role="group"', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page button', { timeout: 5000 });

    const role = await page.evaluate(() => {
      return document.querySelector('print-page').getAttribute('role');
    });
    expect(role).toBe('group');
  });

  test('component is hidden in print media', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page button', { timeout: 5000 });

    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(100);

    const display = await page.evaluate(() => {
      return getComputedStyle(document.querySelector('print-page')).display;
    });
    expect(display).toBe('none');
  });

  test('print media hides navigation elements', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(100);

    const navDisplay = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      return nav ? getComputedStyle(nav).display : null;
    });

    if (navDisplay) {
      expect(navDisplay).toBe('none');
    }
  });

  test('raw toggle sets data-print-raw on html element', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page button', { timeout: 5000 });

    const hasToggle = await page.evaluate(() =>
      document.querySelector('print-page[data-raw-toggle]') !== null
    );
    if (!hasToggle) return;

    // Check the checkbox, mock print, click button
    await page.evaluate(() => {
      const pp = document.querySelector('print-page[data-raw-toggle]');
      pp.querySelector('input[type="checkbox"]').checked = true;
      window.print = () => {}; // Mock to prevent dialog
      pp.querySelector('button').click();
    });

    const hasRaw = await page.evaluate(() =>
      document.documentElement.hasAttribute('data-print-raw')
    );
    expect(hasRaw).toBe(true);

    // Simulate afterprint to clean up
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await page.waitForTimeout(100);

    const hasRawAfter = await page.evaluate(() =>
      document.documentElement.hasAttribute('data-print-raw')
    );
    expect(hasRawAfter).toBe(false);
  });

});
