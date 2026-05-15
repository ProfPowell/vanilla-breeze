/**
 * data-toggle behavior tests. Pure logic (parseToggleSpec, nextValue,
 * isBooleanAttr, isAriaTwoState) is in tests/unit/data-toggle.test.js.
 */

import { test, expect } from 'playwright/test';

const demo = '/docs/snippets/demos/data-toggle-basic.html';

test.describe('data-toggle — boolean external target', () => {
  test('clicking flips the hidden attribute on the target', async ({ page }) => {
    await page.goto(demo);
    const button = page.locator('button[data-toggle="hidden"]');
    const target = page.locator('#sidebar-1');

    // Check the attribute presence directly, not visibility — the panel
    // may have its own visibility CSS that complicates toBeHidden.
    await expect(target).not.toHaveAttribute('hidden');
    await button.click();
    await expect(target).toHaveAttribute('hidden', '');
    await button.click();
    await expect(target).not.toHaveAttribute('hidden');
  });

  test('aria-controls is set to the target id', async ({ page }) => {
    await page.goto(demo);
    const button = page.locator('button[data-toggle="hidden"]');
    await expect(button).toHaveAttribute('aria-controls', 'sidebar-1');
  });
});

test.describe('data-toggle — ARIA two-state self-target', () => {
  test('aria-pressed flips on click', async ({ page }) => {
    await page.goto(demo);
    const button = page.locator('button[data-toggle="aria-pressed"]');

    // Initial state (not pressed) — aria-pressed may be missing or "false".
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('data-toggle — custom on/off cycle', () => {
  test('cycles data-state between on / off; reflects aria-expanded', async ({ page }) => {
    await page.goto(demo);
    const button = page.locator('button[data-toggle="data-state"]');
    const target = page.locator('#tray-1');

    // Demo starts with data-state="closed".
    await expect(target).toHaveAttribute('data-state', 'closed');
    await expect(button).toHaveAttribute('aria-expanded', 'false');

    await button.click();
    await expect(target).toHaveAttribute('data-state', 'open');
    await expect(button).toHaveAttribute('aria-expanded', 'true');

    await button.click();
    await expect(target).toHaveAttribute('data-state', 'closed');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('data-toggle — class shorthand', () => {
  test('toggles the class on the target', async ({ page }) => {
    await page.goto(demo);
    const button = page.locator('button[data-toggle="class:expanded"]');
    const target = page.locator('#card-1');

    await expect(target).not.toHaveClass(/expanded/);
    await button.click();
    await expect(target).toHaveClass(/expanded/);
    await button.click();
    await expect(target).not.toHaveClass(/expanded/);
  });
});

test.describe('data-toggle — events', () => {
  test('emits toggle:change with detail', async ({ page }) => {
    await page.goto(demo);
    const detail = page.evaluate(() => new Promise((resolve) => {
      document.addEventListener('toggle:change', (e) => resolve(e.detail), { once: true });
    }));
    await page.locator('button[data-toggle="hidden"]').click();
    // First click: hidden was absent → now present (element becomes hidden).
    expect(await detail).toMatchObject({ spec: 'hidden', present: true });
  });
});

test.describe('data-toggle — keyboard', () => {
  test('Space activates the button', async ({ page }) => {
    await page.goto(demo);
    const button = page.locator('button[data-toggle="aria-pressed"]');
    await button.focus();
    await page.keyboard.press(' ');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
