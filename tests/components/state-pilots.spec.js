/**
 * CustomStateSet pilot tests (vanilla-breeze-obrh)
 *
 * One test per pilot component covering the new internal :state() flag:
 *   - audio-player :state(scrub-active)
 *   - content-swap :state(transition-running)
 *   - combo-box    :state(no-matches)
 *
 * These flags are internal and not part of the public attribute surface;
 * tests use el.matches(':state(name)') via page.evaluate per the convention
 * in admin/specs/component-state-conventions.md.
 */

import { test, expect } from 'playwright/test';

// ---------------------------------------------------------------------------
// audio-player :state(scrub-active)
// ---------------------------------------------------------------------------

test.describe('audio-player — :state(scrub-active)', () => {

  test('pointerdown on the timeline sets the state; pointerup clears it', async ({ page }) => {
    await page.goto('/docs/examples/demos/audio-player-basic.html');
    await page.waitForSelector('audio-player[data-upgraded]');

    const result = await page.evaluate(() => {
      const player = /** @type {any} */ (document.querySelector('audio-player'));
      const timeline = player.shadowRoot.querySelector('input.timeline');

      const initial = player.matches(':state(scrub-active)');
      timeline.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      const duringDrag = player.matches(':state(scrub-active)');
      timeline.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      const afterRelease = player.matches(':state(scrub-active)');

      return { initial, duringDrag, afterRelease };
    });

    expect(result.initial).toBe(false);
    expect(result.duringDrag).toBe(true);
    expect(result.afterRelease).toBe(false);
  });

  test('pointercancel also clears the state', async ({ page }) => {
    await page.goto('/docs/examples/demos/audio-player-basic.html');
    await page.waitForSelector('audio-player[data-upgraded]');

    const result = await page.evaluate(() => {
      const player = /** @type {any} */ (document.querySelector('audio-player'));
      const timeline = player.shadowRoot.querySelector('input.timeline');
      timeline.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      const duringDrag = player.matches(':state(scrub-active)');
      timeline.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
      const afterCancel = player.matches(':state(scrub-active)');
      return { duringDrag, afterCancel };
    });

    expect(result.duringDrag).toBe(true);
    expect(result.afterCancel).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// content-swap :state(transition-running)
// ---------------------------------------------------------------------------

test.describe('content-swap — :state(transition-running)', () => {

  test('state is cleared after a swap completes', async ({ page }) => {
    await page.goto('/docs/examples/demos/content-swap-basic.html');
    await page.waitForSelector('content-swap[data-upgraded]');

    const result = await page.evaluate(async () => {
      const swap = /** @type {any} */ (document.querySelector('content-swap'));
      const initial = swap.matches(':state(transition-running)');
      swap.toggle();
      // Wait for any view-transition to settle. Two animation frames is more
      // than enough for the fallback path; for the live transition the
      // .finished promise will have resolved by the time animations pause.
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      // Belt-and-braces: also wait for the longest plausible transition.
      await new Promise(r => setTimeout(r, 600));
      const afterSwap = swap.matches(':state(transition-running)');
      return { initial, afterSwap };
    });

    expect(result.initial).toBe(false);
    expect(result.afterSwap).toBe(false);
  });

  test('state is set synchronously when the swap is initiated', async ({ page }) => {
    await page.goto('/docs/examples/demos/content-swap-basic.html');
    await page.waitForSelector('content-swap[data-upgraded]');

    // Capture the state immediately after toggle() returns. With or without
    // View Transitions support, setRunning(true) runs before startSwapTransition
    // returns, so the state must be observable in the same task.
    const captured = await page.evaluate(() => {
      const swap = /** @type {any} */ (document.querySelector('content-swap'));
      swap.toggle();
      return swap.matches(':state(transition-running)');
    });

    expect(captured).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// combo-box :state(no-matches)
// ---------------------------------------------------------------------------

test.describe('combo-box — :state(no-matches)', () => {

  test('typing a query that matches nothing sets the state; clearing it removes the state', async ({ page }) => {
    await page.goto('/docs/examples/demos/combobox-basic.html');
    await page.waitForSelector('combo-box[data-upgraded]');

    const result = await page.evaluate(async () => {
      const cb = /** @type {any} */ (document.querySelector('combo-box'));
      const input = cb.querySelector('input') || cb.shadowRoot?.querySelector('input');
      if (!input) return { error: 'no input found' };

      // Open the listbox so #filterOptions runs.
      input.focus();
      input.click();

      input.value = 'zzzzzz-no-such-option';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const noMatch = cb.matches(':state(no-matches)');

      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const cleared = cb.matches(':state(no-matches)');

      return { noMatch, cleared };
    });

    expect(result.error).toBeUndefined();
    expect(result.noMatch).toBe(true);
    expect(result.cleared).toBe(false);
  });
});
