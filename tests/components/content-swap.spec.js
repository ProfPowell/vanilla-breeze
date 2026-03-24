/**
 * Content Swap Web Component Behavior Tests
 *
 * Tests swap behavior, lifecycle safety, focus management,
 * trigger models, and inert state.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/content-swap-basic.html';

test.describe('content-swap — baseline', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('content-swap[data-upgraded]');

    const swap = page.locator('content-swap').first();
    await expect(swap).toBeVisible();
  });

  test('has front and back faces', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('content-swap[data-upgraded]');

    const front = page.locator('content-swap [data-face="front"]').first();
    const back = page.locator('content-swap [data-face="back"]').first();

    await expect(front).toHaveCount(1);
    await expect(back).toHaveCount(1);
  });

  test('back face is inert when not swapped', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('content-swap[data-upgraded]');

    const result = await page.evaluate(() => {
      const swap = document.querySelector('content-swap');
      const front = swap.querySelector('[data-face="front"]');
      const back = swap.querySelector('[data-face="back"]');
      return {
        frontInert: front.inert,
        backInert: back.inert,
      };
    });

    expect(result.frontInert).toBe(false);
    expect(result.backInert).toBe(true);
  });
});

test.describe('content-swap — swap behavior', () => {

  test('clicking swaps to show back face', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('content-swap[data-upgraded]');

    const swap = page.locator('content-swap').first();

    // Find a trigger — either a [data-swap] button or the whole element
    const trigger = page.locator('content-swap [data-swap]').first();
    const hasTrigger = await trigger.count();

    if (hasTrigger > 0) {
      await trigger.click();
    } else {
      await swap.click();
    }

    await expect(swap).toHaveAttribute('swapped', '');
  });

  test('second swap returns to front face', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('content-swap[data-upgraded]');

    const swap = page.locator('content-swap').first();
    const trigger = page.locator('content-swap [data-swap]').first();
    const hasTrigger = await trigger.count();
    const clickTarget = hasTrigger > 0 ? trigger : swap;

    await clickTarget.click();
    await expect(swap).toHaveAttribute('swapped', '');

    // Find trigger on back face or use element again
    const backTrigger = page.locator('content-swap [data-face="back"] [data-swap]').first();
    const hasBackTrigger = await backTrigger.count();
    const secondTarget = hasBackTrigger > 0 ? backTrigger : clickTarget;

    await secondTarget.click();
    await expect(swap).not.toHaveAttribute('swapped');
  });

  test('inert state flips with swap', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('content-swap[data-upgraded]');

    const result = await page.evaluate(() => {
      const swap = document.querySelector('content-swap');
      // Programmatic swap
      swap.flip();

      return {
        frontInert: swap.querySelector('[data-face="front"]').inert,
        backInert: swap.querySelector('[data-face="back"]').inert,
        swapped: swap.hasAttribute('swapped'),
      };
    });

    expect(result.swapped).toBe(true);
    expect(result.frontInert).toBe(true);
    expect(result.backInert).toBe(false);
  });
});

test.describe('content-swap — public API', () => {

  test('flip() shows back, unflip() shows front', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('content-swap[data-upgraded]');

    const result = await page.evaluate(() => {
      const swap = document.querySelector('content-swap');
      swap.flip();
      const afterFlip = swap.swapped;
      swap.unflip();
      const afterUnflip = swap.swapped;
      return { afterFlip, afterUnflip };
    });

    expect(result.afterFlip).toBe(true);
    expect(result.afterUnflip).toBe(false);
  });

  test('toggle() alternates state', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('content-swap[data-upgraded]');

    const result = await page.evaluate(() => {
      const swap = document.querySelector('content-swap');
      const initial = swap.swapped;
      swap.toggle();
      const first = swap.swapped;
      swap.toggle();
      const second = swap.swapped;
      return { initial, first, second };
    });

    expect(result.first).toBe(!result.initial);
    expect(result.second).toBe(result.initial);
  });

  test('dispatches content-swap:swap event', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('content-swap[data-upgraded]');

    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const swap = document.querySelector('content-swap');
        swap.addEventListener('content-swap:swap', (e) => {
          resolve({ swapped: e.detail.swapped });
        });
        swap.flip();
      });
    });

    expect(result.swapped).toBe(true);
  });
});

test.describe('content-swap — lifecycle', () => {

  test('reconnect does not duplicate listeners', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('content-swap[data-upgraded]');

    const eventCount = await page.evaluate(() => {
      return new Promise(resolve => {
        const swap = document.querySelector('content-swap');
        const parent = swap.parentElement;

        parent.removeChild(swap);
        parent.appendChild(swap);

        requestAnimationFrame(() => {
          let count = 0;
          swap.addEventListener('content-swap:swap', () => count++);
          swap.toggle();

          setTimeout(() => resolve(count), 200);
        });
      });
    });

    expect(eventCount).toBe(1);
  });
});

test.describe('content-swap — focus', () => {

  test('pointer swap does not force focus movement', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('content-swap[data-upgraded]');

    const result = await page.evaluate(() => {
      const swap = document.querySelector('content-swap');
      const initialFocus = document.activeElement;

      // Simulate a pointer-triggered swap via the API
      swap.flip();

      // Focus should not have been hijacked to inside the back face
      // (unless there's an autofocus element)
      const backFace = swap.querySelector('[data-face="back"]');
      const hasAutofocus = backFace.querySelector('[autofocus]') !== null;
      const focusInBack = backFace.contains(document.activeElement);

      return {
        hasAutofocus,
        focusInBack,
      };
    });

    // If no autofocus, focus should NOT have moved into back face
    if (!result.hasAutofocus) {
      expect(result.focusInBack).toBe(false);
    }
  });
});
