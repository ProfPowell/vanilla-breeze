/**
 * Print Page Web Component Behavior Tests
 *
 * Tests button rendering, raw-mode toggle, print media emulation,
 * and CSS print style application for the print-page component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/print-article.html';

test.describe('print-page', () => {

  test('renders a print button', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page button', { timeout: 5000 });

    // Default variant is "icon": label lives in aria-label, not text content
    const label = await page.evaluate(() => {
      const button = document.querySelector('print-page button');
      return (button.getAttribute('aria-label') || button.textContent).trim();
    });
    expect(label.length).toBeGreaterThan(0);
  });

  test('button has correct label', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page button', { timeout: 5000 });

    // Authored text content becomes the button's accessible name
    const label = await page.evaluate(() => {
      const button = document.querySelector('print-page button');
      return (button.getAttribute('aria-label') || button.textContent).trim();
    });
    expect(label).toBe('Print this article');
  });

  test('renders raw-mode toggle when raw-toggle present', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page button', { timeout: 5000 });

    const hasToggle = await page.evaluate(() => {
      const el = document.querySelector('print-page[raw-toggle]');
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

  test('role="group" only when raw-toggle is present', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page button', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const withToggle = document.querySelector('print-page[raw-toggle]');
      const withoutToggle = document.querySelector('print-page:not([raw-toggle])');
      return {
        toggleRole: withToggle?.getAttribute('role') ?? null,
        plainRole: withoutToggle?.getAttribute('role') ?? null,
      };
    });

    if (result.toggleRole !== null) {
      expect(result.toggleRole).toBe('group');
    }
    if (result.plainRole !== null) {
      expect(result.plainRole).not.toBe('group');
    }
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
      document.querySelector('print-page[raw-toggle]') !== null
    );
    if (!hasToggle) return;

    // Check the checkbox, mock print, click button
    await page.evaluate(() => {
      const pp = document.querySelector('print-page[raw-toggle]');
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

  test('raw cleanup fallback works without afterprint', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page button', { timeout: 5000 });

    const hasToggle = await page.evaluate(() =>
      document.querySelector('print-page[raw-toggle]') !== null
    );
    if (!hasToggle) return;

    await page.evaluate(() => {
      const pp = document.querySelector('print-page[raw-toggle]');
      pp.querySelector('input[type="checkbox"]').checked = true;
      window.print = () => {}; // Mock
      pp.querySelector('button').click();
      // Do NOT fire afterprint — rely on timeout fallback
    });

    const hasRaw = await page.evaluate(() =>
      document.documentElement.hasAttribute('data-print-raw')
    );
    expect(hasRaw).toBe(true);

    // Wait for timeout fallback (5s) + margin
    await page.waitForTimeout(5500);

    const hasRawAfter = await page.evaluate(() =>
      document.documentElement.hasAttribute('data-print-raw')
    );
    expect(hasRawAfter).toBe(false);
  });
});

test.describe('print-page — lifecycle', () => {

  test('reconnect preserves the original label', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page[data-upgraded]');

    const result = await page.evaluate(() => {
      const pp = document.querySelector('print-page');
      const accessibleName = (el) =>
        (el?.getAttribute('aria-label') || el?.textContent || '').trim();
      const originalLabel = accessibleName(pp.querySelector('button'));

      const parent = pp.parentElement;
      parent.removeChild(pp);
      parent.appendChild(pp);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const newLabel = accessibleName(pp.querySelector('button'));
          resolve({ originalLabel, newLabel });
        });
      });
    });

    expect(result.originalLabel.length).toBeGreaterThan(0);
    expect(result.newLabel).toBe(result.originalLabel);
  });

  test('reconnect does not duplicate controls', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('print-page[data-upgraded]');

    const counts = await page.evaluate(() => {
      const pp = document.querySelector('print-page');
      const parent = pp.parentElement;

      parent.removeChild(pp);
      parent.appendChild(pp);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          resolve({
            buttons: pp.querySelectorAll('button').length,
            checkboxes: pp.querySelectorAll('input[type="checkbox"]').length,
          });
        });
      });
    });

    expect(counts.buttons).toBe(1);
    // Checkbox should be 0 or 1, not more
    expect(counts.checkboxes).toBeLessThanOrEqual(1);
  });
});
