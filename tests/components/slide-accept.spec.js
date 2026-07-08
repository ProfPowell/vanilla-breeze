/**
 * Slide Accept Web Component Behavior Tests
 *
 * Tests upgrade lifecycle, handle rendering, keyboard interaction,
 * reconnect safety, and threshold attribute parsing.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/slide-accept-basic.html';

test.describe('slide-accept — baseline', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('slide-accept[data-upgraded]');

    const upgraded = page.locator('slide-accept[data-upgraded]');
    await expect(upgraded.first()).toBeVisible();
  });

  test('has a handle element', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('slide-accept[data-upgraded]');

    const handle = page.locator('slide-accept .slide-handle');
    await expect(handle.first()).toBeVisible();
    await expect(handle.first()).toHaveAttribute('role', 'slider');
  });
});

test.describe('slide-accept — keyboard', () => {

  test('ArrowRight moves the handle', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('slide-accept[data-upgraded]');

    const handle = page.locator('slide-accept .slide-handle').first();
    await handle.focus();

    // Initial position
    const before = await handle.getAttribute('aria-valuenow');
    expect(Number(before)).toBe(0);

    await page.keyboard.press('ArrowRight');

    const after = await handle.getAttribute('aria-valuenow');
    expect(Number(after)).toBeGreaterThan(0);
  });
});

test.describe('slide-accept — lifecycle', () => {

  test('reconnect does not duplicate the handle', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('slide-accept[data-upgraded]');

    const handleCount = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.querySelector('slide-accept');
        const parent = el.parentElement;

        // Disconnect and reconnect
        parent.removeChild(el);
        parent.appendChild(el);

        // Wait for reconnect upgrade
        requestAnimationFrame(() => {
          const handles = el.querySelectorAll('.slide-handle');
          resolve(handles.length);
        });
      });
    });

    expect(handleCount).toBe(1);
  });
});

test.describe('slide-accept — threshold', () => {

  test('threshold="0" is honored', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('slide-accept[data-upgraded]');

    const activated = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.createElement('slide-accept');
        el.setAttribute('threshold', '0');
        el.setAttribute('label', 'Zero threshold');
        el.textContent = 'Zero threshold';
        document.body.appendChild(el);

        // Wait for upgrade
        const check = () => {
          if (el.hasAttribute('data-upgraded')) {
            // With threshold 0, pressing ArrowRight should activate immediately
            // since any position >= 0 meets the threshold
            const handle = el.querySelector('.slide-handle');
            handle.focus();
            handle.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'ArrowRight', bubbles: true
            }));

            // Give time for activation
            setTimeout(() => {
              resolve(el.hasAttribute('data-activated'));
            }, 100);
          } else {
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      });
    });

    expect(activated).toBe(true);
  });
});
