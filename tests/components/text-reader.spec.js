/**
 * Text Reader Web Component Behavior Tests
 *
 * Tests control rendering, ARIA attributes, keyboard accessibility,
 * and UI state management for the text-reader component.
 * Note: Actual TTS synthesis cannot be tested in headless CI.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/text-reader-basic.html';

test.describe('text-reader', () => {

  test('renders control bar with all controls', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const reader = page.locator('text-reader').first();
    await expect(reader).toBeVisible();

    // Controls group
    const controls = reader.locator('[part="controls"]');
    await expect(controls).toHaveCount(1);
    await expect(controls).toHaveAttribute('role', 'group');
    await expect(controls).toHaveAttribute('aria-label', 'Article reader');
  });

  test('play button visible, pause hidden, stop disabled initially', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const reader = page.locator('text-reader').first();

    const playBtn = reader.locator('[part~="play"]');
    const pauseBtn = reader.locator('[part~="pause"]');
    const stopBtn = reader.locator('[part~="stop"]');

    await expect(playBtn).toBeVisible();
    await expect(pauseBtn).toBeHidden();
    await expect(stopBtn).toBeDisabled();
  });

  test('all buttons have ARIA labels', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const reader = page.locator('text-reader').first();

    const playBtn = reader.locator('[part~="play"]');
    const pauseBtn = reader.locator('[part~="pause"]');
    const stopBtn = reader.locator('[part~="stop"]');

    await expect(playBtn).toHaveAttribute('aria-label', 'Play');
    await expect(pauseBtn).toHaveAttribute('aria-label', 'Pause');
    await expect(stopBtn).toHaveAttribute('aria-label', 'Stop');
  });

  test('voice select is present with aria-label', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const reader = page.locator('text-reader').first();
    const voiceSelect = reader.locator('select');

    await expect(voiceSelect).toHaveCount(1);
    await expect(voiceSelect).toHaveAttribute('aria-label', 'Voice');
  });

  test('speed slider is present with aria-label', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const reader = page.locator('text-reader').first();
    const speedInput = reader.locator('input[type="range"]');

    await expect(speedInput).toHaveCount(1);
    await expect(speedInput).toHaveAttribute('aria-label', 'Speed');
  });

  test('speed slider updates display value on input', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const reader = page.locator('text-reader').first();
    const speedInput = reader.locator('input[type="range"]');
    const speedValue = reader.locator('[data-speed-value]');

    // Initial value
    await expect(speedValue).toHaveText('1\u00d7');

    // Change speed to 1.5
    await speedInput.fill('1.5');
    await speedInput.dispatchEvent('input');
    await expect(speedValue).toHaveText('1.5\u00d7');
  });

  test('controls are keyboard focusable', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const reader = page.locator('text-reader').first();
    const playBtn = reader.locator('[part~="play"]');

    await playBtn.focus();
    await expect(playBtn).toBeFocused();

    // Tab to next control (stop button — pause is hidden)
    await page.keyboard.press('Tab');
    const stopBtn = reader.locator('[part~="stop"]');
    await expect(stopBtn).toBeFocused();
  });

  test('multiple text-reader instances render independently', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const readers = page.locator('text-reader');
    const count = await readers.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Each has its own controls
    for (let i = 0; i < count; i++) {
      const controls = readers.nth(i).locator('[part="controls"]');
      await expect(controls).toHaveCount(1);
    }
  });

  test('element is a block-level display', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const reader = page.locator('text-reader').first();
    const display = await reader.evaluate(el => getComputedStyle(el).display);
    expect(display).toBe('block');
  });

});
