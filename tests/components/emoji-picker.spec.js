/**
 * Emoji Picker Web Component Behavior Tests
 *
 * Tests lifecycle, open/close behavior, insertion, and ARIA contracts.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/emoji-basic.html';

test.describe('emoji-picker — baseline', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    const picker = page.locator('emoji-picker').first();
    await expect(picker).toBeVisible();
  });

  test('has a trigger button with aria-haspopup', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    const trigger = page.locator('emoji-picker [data-trigger]').first();
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('picker panel is hidden initially', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    const panel = page.locator('emoji-picker .picker').first();
    await expect(panel).toBeHidden();
  });
});

test.describe('emoji-picker — open/close', () => {

  test('clicking trigger opens the picker', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    const trigger = page.locator('emoji-picker [data-trigger]').first();
    await trigger.click();

    const emojiPicker = page.locator('emoji-picker').first();
    await expect(emojiPicker).toHaveAttribute('open', '');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('picker panel becomes visible when open', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    const trigger = page.locator('emoji-picker [data-trigger]').first();
    await trigger.click();

    const panel = page.locator('emoji-picker .picker').first();
    await expect(panel).toBeVisible();
  });

  test('Escape closes the picker', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    const trigger = page.locator('emoji-picker [data-trigger]').first();
    await trigger.click();

    const emojiPicker = page.locator('emoji-picker').first();
    await expect(emojiPicker).toHaveAttribute('open', '');

    await page.keyboard.press('Escape');
    await expect(emojiPicker).not.toHaveAttribute('open');
  });

  test('open attribute is output-only (reflected state)', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    // Setting open attribute externally should not open the picker
    const result = await page.evaluate(() => {
      const ep = document.querySelector('emoji-picker');
      ep.setAttribute('open', '');
      const panel = ep.querySelector('.picker');
      return panel?.hidden;
    });

    // Panel should still be hidden — the attribute is output-only
    expect(result).toBe(true);
  });
});

test.describe('emoji-picker — search', () => {

  test('search input is focused when picker opens', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    const trigger = page.locator('emoji-picker [data-trigger]').first();
    await trigger.click();

    const searchInput = page.locator('emoji-picker input[type="search"]').first();
    await expect(searchInput).toBeFocused();
  });

  test('typing filters the emoji grid', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    const trigger = page.locator('emoji-picker [data-trigger]').first();
    await trigger.click();

    const searchInput = page.locator('emoji-picker input[type="search"]').first();
    const gridBefore = await page.locator('emoji-picker .grid button').count();

    await searchInput.fill('heart');
    await page.waitForTimeout(200);

    const gridAfter = await page.locator('emoji-picker .grid button').count();
    expect(gridAfter).toBeLessThan(gridBefore);
    expect(gridAfter).toBeGreaterThan(0);
  });
});

test.describe('emoji-picker — selection', () => {

  test('clicking emoji dispatches emoji-picker:select', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    const trigger = page.locator('emoji-picker [data-trigger]').first();
    await trigger.click();

    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const ep = document.querySelector('emoji-picker');
        ep.addEventListener('emoji-picker:select', (e) => {
          resolve({
            hasEmoji: !!e.detail.emoji,
            hasShortcode: !!e.detail.shortcode,
          });
        });
        const firstEmoji = ep.querySelector('.grid button');
        if (firstEmoji) firstEmoji.click();
        else resolve({ hasEmoji: false, hasShortcode: false });
      });
    });

    expect(result.hasEmoji).toBe(true);
    expect(result.hasShortcode).toBe(true);
  });

  test('selecting emoji closes the picker', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    const trigger = page.locator('emoji-picker [data-trigger]').first();
    await trigger.click();

    const emojiPicker = page.locator('emoji-picker').first();
    await expect(emojiPicker).toHaveAttribute('open', '');

    // Click first emoji
    const firstEmoji = page.locator('emoji-picker .grid button').first();
    await firstEmoji.click();

    await expect(emojiPicker).not.toHaveAttribute('open');
  });

  test('emoji inserts into target textarea', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    // Find the picker that targets a textarea
    const result = await page.evaluate(() => {
      const ep = document.querySelector('emoji-picker[for]');
      if (!ep) return { inserted: false };

      const targetId = ep.getAttribute('for');
      const target = document.getElementById(targetId);
      if (!target) return { inserted: false };

      // Clear target
      target.value = '';

      // Open and select first emoji
      ep.open();

      return new Promise(resolve => {
        ep.addEventListener('emoji-picker:select', () => {
          resolve({
            inserted: target.value.length > 0,
            value: target.value,
          });
        });
        const firstEmoji = ep.querySelector('.grid button');
        if (firstEmoji) firstEmoji.click();
        else resolve({ inserted: false });
      });
    });

    expect(result.inserted).toBe(true);
  });
});

test.describe('emoji-picker — lifecycle', () => {

  test('reconnect does not duplicate picker panel', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    const panelCount = await page.evaluate(() => {
      return new Promise(resolve => {
        const ep = document.querySelector('emoji-picker');
        const parent = ep.parentElement;

        parent.removeChild(ep);
        parent.appendChild(ep);

        // Wait for async setup
        setTimeout(() => {
          const count = ep.querySelectorAll('.picker').length;
          resolve(count);
        }, 500);
      });
    });

    expect(panelCount).toBe(1);
  });

  test('picker still works after reconnect', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('emoji-picker[data-upgraded]');

    await page.evaluate(() => {
      const ep = document.querySelector('emoji-picker');
      const parent = ep.parentElement;
      parent.removeChild(ep);
      parent.appendChild(ep);
    });

    // Wait for async re-connect
    await page.waitForSelector('emoji-picker[data-upgraded]', { timeout: 5000 });

    const trigger = page.locator('emoji-picker [data-trigger]').first();
    await trigger.click();

    const emojiPicker = page.locator('emoji-picker').first();
    await expect(emojiPicker).toHaveAttribute('open', '');
  });
});
