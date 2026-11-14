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

    // Stop button starts disabled (no audio playing), so it can't receive focus.
    // Verify the voice select is focusable instead.
    const voiceSelect = reader.locator('select');
    await voiceSelect.focus();
    await expect(voiceSelect).toBeFocused();
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


  test('Escape hides the icon toolbar only when focus is inside the reader', async ({ page }) => {
    await page.goto('/docs/examples/demos/text-reader-icon.html');
    await page.waitForSelector('text-reader[variant="icon"][data-upgraded]');

    const reader = page.locator('text-reader[variant="icon"]').first();
    const toolbar = reader.locator('[data-text-reader-toolbar]');
    // Speech can't run headless, so show the toolbar the way the component does.
    const show = () => toolbar.evaluate((el) => {
      el.hidden = false;
      if (el.popover && !el.matches(':popover-open')) el.showPopover();
    });
    await page.evaluate(() => {
      const outside = document.createElement('button');
      outside.id = 'outside-reader';
      outside.textContent = 'Outside';
      document.body.prepend(outside);
      window.__escPrevented = [];
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.__escPrevented.push(e.defaultPrevented);
      });
    });

    // Focus elsewhere on the page: the toolbar stays and the key is untouched.
    await show();
    await page.locator('#outside-reader').focus();
    await page.keyboard.press('Escape');
    expect(await toolbar.evaluate((el) => el.hidden)).toBe(false);

    // Focus inside the toolbar: it hides and focus moves to the trigger.
    await toolbar.locator('button:not([hidden]):not([disabled])').first().focus();
    await page.keyboard.press('Escape');
    expect(await toolbar.evaluate((el) => el.hidden)).toBe(true);
    expect(await reader.evaluate((el) => el.contains(document.activeElement)
      && !document.activeElement.closest('[data-text-reader-toolbar]'))).toBe(true);

    // Toolbar already hidden: Escape on the trigger is not consumed.
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => window.__escPrevented)).toEqual([false, true, false]);
  });
});
