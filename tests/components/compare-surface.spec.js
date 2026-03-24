/**
 * Compare Surface Web Component Behavior Tests
 *
 * Tests lifecycle, position contract, keyboard interaction,
 * and two-child enforcement.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/compare-surface-basic.html';

test.describe('compare-surface — baseline', () => {

  test('renders with data-upgraded and divider', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('compare-surface[data-upgraded]');

    const divider = page.locator('compare-surface .comparison-divider').first();
    await expect(divider).toHaveCount(1);
    await expect(divider).toHaveAttribute('role', 'slider');
  });

  test('divider has ARIA slider attributes', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('compare-surface[data-upgraded]');

    const divider = page.locator('compare-surface .comparison-divider').first();
    await expect(divider).toHaveAttribute('aria-valuemin', '0');
    await expect(divider).toHaveAttribute('aria-valuemax', '100');
    await expect(divider).toHaveAttribute('tabindex', '0');

    const valuenow = await divider.getAttribute('aria-valuenow');
    const num = Number(valuenow);
    expect(num).toBeGreaterThanOrEqual(0);
    expect(num).toBeLessThanOrEqual(100);
  });
});

test.describe('compare-surface — position contract', () => {

  test('position="0" is honored (not replaced with 50)', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('compare-surface[data-upgraded]');

    const result = await page.evaluate(() => {
      // Create a fresh compare-surface with position="0"
      const cs = document.createElement('compare-surface');
      cs.setAttribute('position', '0');
      const img1 = document.createElement('div');
      img1.textContent = 'Before';
      const img2 = document.createElement('div');
      img2.textContent = 'After';
      cs.appendChild(img1);
      cs.appendChild(img2);
      document.body.appendChild(cs);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const divider = cs.querySelector('.comparison-divider');
          resolve({
            valuenow: divider?.getAttribute('aria-valuenow'),
            hostPosition: cs.getAttribute('position'),
          });
          cs.remove();
        });
      });
    });

    expect(result.valuenow).toBe('0');
    expect(result.hostPosition).toBe('0');
  });

  test('position reflects back to host attribute on change', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('compare-surface[data-upgraded]');

    const result = await page.evaluate(() => {
      const cs = document.querySelector('compare-surface');
      cs.position = 75;
      return cs.getAttribute('position');
    });

    expect(result).toBe('75');
  });
});

test.describe('compare-surface — keyboard', () => {

  test('ArrowRight increases position', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('compare-surface[data-upgraded]');

    const divider = page.locator('compare-surface .comparison-divider').first();
    const before = Number(await divider.getAttribute('aria-valuenow'));

    await divider.focus();
    await page.keyboard.press('ArrowRight');

    const after = Number(await divider.getAttribute('aria-valuenow'));
    expect(after).toBe(before + 1);
  });

  test('ArrowLeft decreases position', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('compare-surface[data-upgraded]');

    const divider = page.locator('compare-surface .comparison-divider').first();

    await divider.focus();
    // Move right first so we can move left
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const before = Number(await divider.getAttribute('aria-valuenow'));

    await page.keyboard.press('ArrowLeft');
    const after = Number(await divider.getAttribute('aria-valuenow'));
    expect(after).toBe(before - 1);
  });

  test('Shift+Arrow moves by 10', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('compare-surface[data-upgraded]');

    const divider = page.locator('compare-surface .comparison-divider').first();
    const before = Number(await divider.getAttribute('aria-valuenow'));

    await divider.focus();
    await page.keyboard.press('Shift+ArrowRight');

    const after = Number(await divider.getAttribute('aria-valuenow'));
    expect(after).toBe(Math.min(100, before + 10));
  });
});

test.describe('compare-surface — lifecycle', () => {

  test('reconnect does not duplicate divider', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('compare-surface[data-upgraded]');

    const dividerCount = await page.evaluate(() => {
      const cs = document.querySelector('compare-surface');
      const parent = cs.parentElement;

      parent.removeChild(cs);
      parent.appendChild(cs);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const count = cs.querySelectorAll('.comparison-divider').length;
          resolve(count);
        });
      });
    });

    expect(dividerCount).toBe(1);
  });

  test('keyboard still works after reconnect', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('compare-surface[data-upgraded]');

    await page.evaluate(() => {
      const cs = document.querySelector('compare-surface');
      const parent = cs.parentElement;
      parent.removeChild(cs);
      parent.appendChild(cs);
    });

    await page.waitForSelector('compare-surface[data-upgraded]');

    const divider = page.locator('compare-surface .comparison-divider').first();
    const before = Number(await divider.getAttribute('aria-valuenow'));

    await divider.focus();
    await page.keyboard.press('ArrowRight');

    const after = Number(await divider.getAttribute('aria-valuenow'));
    expect(after).toBe(before + 1);
  });
});

test.describe('compare-surface — children contract', () => {

  test('does not upgrade with fewer than 2 children', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('compare-surface[data-upgraded]');

    const result = await page.evaluate(() => {
      const cs = document.createElement('compare-surface');
      cs.appendChild(document.createElement('div'));
      document.body.appendChild(cs);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          resolve({
            upgraded: cs.hasAttribute('data-upgraded'),
            hasDivider: cs.querySelector('.comparison-divider') !== null,
          });
          cs.remove();
        });
      });
    });

    expect(result.upgraded).toBe(false);
    expect(result.hasDivider).toBe(false);
  });
});
