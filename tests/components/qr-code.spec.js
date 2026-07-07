/**
 * QR Code Web Component Behavior Tests
 *
 * Tests rendering, source preservation, reconnect safety,
 * attribute reactivity, and accessible baseline.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/qr-code-basic.html';

test.describe('qr-code — baseline', () => {

  test('renders with data-upgraded and canvas', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('qr-code[data-upgraded]');

    const canvas = page.locator('qr-code canvas').first();
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toHaveAttribute('role', 'img');
  });

  test('canvas has aria-label with encoded value', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('qr-code[data-upgraded]');

    const label = await page.locator('qr-code canvas').first().getAttribute('aria-label');
    expect(label).toMatch(/^QR code: /);
    expect(label.length).toBeGreaterThan(10);
  });

  test('preserves encoded value as sr-only text', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('qr-code[data-upgraded]');

    const srText = await page.evaluate(() => {
      const qr = document.querySelector('qr-code');
      const span = qr.querySelector('.sr-only');
      return span?.textContent ?? '';
    });

    expect(srText.length).toBeGreaterThan(0);
  });
});

test.describe('qr-code — source preservation', () => {

  test('value from attribute survives reconnect', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('qr-code[data-upgraded]');

    const result = await page.evaluate(() => {
      const qr = document.querySelector('qr-code[value]');
      if (!qr) return { found: false };

      const originalLabel = qr.querySelector('canvas').getAttribute('aria-label');
      const parent = qr.parentElement;

      parent.removeChild(qr);
      parent.appendChild(qr);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const newLabel = qr.querySelector('canvas')?.getAttribute('aria-label');
          resolve({
            found: true,
            originalLabel,
            newLabel,
            hasCanvas: qr.querySelector('canvas') !== null,
          });
        });
      });
    });

    if (result.found) {
      expect(result.newLabel).toBe(result.originalLabel);
      expect(result.hasCanvas).toBe(true);
    }
  });

  test('value from textContent survives reconnect', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('qr-code[data-upgraded]');

    const result = await page.evaluate(() => {
      // Create a QR code using textContent as source
      const qr = document.createElement('qr-code');
      qr.textContent = 'https://test.example.com';
      document.body.appendChild(qr);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const label1 = qr.querySelector('canvas')?.getAttribute('aria-label');
          const parent = qr.parentElement;

          // Disconnect + reconnect
          parent.removeChild(qr);
          parent.appendChild(qr);

          requestAnimationFrame(() => {
            const label2 = qr.querySelector('canvas')?.getAttribute('aria-label');
            qr.remove();
            resolve({ label1, label2 });
          });
        });
      });
    });

    expect(result.label1).toBe('QR code: https://test.example.com');
    expect(result.label2).toBe(result.label1);
  });
});

test.describe('qr-code — attribute reactivity', () => {

  test('changing value attribute re-renders', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('qr-code[data-upgraded]');

    const result = await page.evaluate(() => {
      const qr = document.querySelector('qr-code[value]');
      if (!qr) return null;

      const before = qr.querySelector('canvas').getAttribute('aria-label');
      qr.setAttribute('value', 'https://new-url.example.com');

      // attributeChangedCallback is synchronous
      const after = qr.querySelector('canvas').getAttribute('aria-label');
      return { before, after };
    });

    if (result) {
      expect(result.after).toBe('QR code: https://new-url.example.com');
      expect(result.after).not.toBe(result.before);
    }
  });

  test('changing size attribute re-renders at new size', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('qr-code[data-upgraded]');

    const result = await page.evaluate(() => {
      const qr = document.querySelector('qr-code');
      qr.setAttribute('size', '300');
      const canvas = qr.querySelector('canvas');
      return { width: canvas.width, height: canvas.height };
    });

    expect(result.width).toBe(300);
    expect(result.height).toBe(300);
  });
});

test.describe('qr-code — lifecycle', () => {

  test('reconnect does not duplicate canvas', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('qr-code[data-upgraded]');

    const canvasCount = await page.evaluate(() => {
      const qr = document.querySelector('qr-code');
      const parent = qr.parentElement;

      parent.removeChild(qr);
      parent.appendChild(qr);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          resolve(qr.querySelectorAll('canvas').length);
        });
      });
    });

    expect(canvasCount).toBe(1);
  });
});

test.describe('qr-code — public API', () => {

  test('toDataURL returns a data URL', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('qr-code[data-upgraded]');

    const dataUrl = await page.evaluate(() => {
      return document.querySelector('qr-code').toDataURL();
    });

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
