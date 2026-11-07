/**
 * VB effects runtime boots its own observer and is one instance per document
 * (vanilla-breeze-6xxy).
 *
 * VB.observe() was only called from main.js and main-autoload.js. The
 * production docs load vanilla-breeze-core.js, which never called it, so a
 * [data-effect] element inserted after load never activated. vb.js now boots
 * the observer itself once the DOM is ready, and stores the runtime on
 * globalThis so a second bundle that includes the module (extras.js and the
 * effects pack overlap) registers into the same instance instead of minting a
 * second registry and observer.
 */

import { test, expect } from 'playwright/test';

test('a data-effect element inserted after load activates on a core-only page', async ({ page }) => {
  // Docs pages load core + extras; no entry on this page calls VB.observe().
  await page.goto('/docs/typography/');
  await page.waitForFunction(() => Boolean(window.VB?._effects?.size));

  const processed = await page.evaluate(async () => {
    const el = document.createElement('span');
    el.setAttribute('data-effect', 'shimmer');
    el.textContent = 'late';
    document.querySelector('main').append(el);
    await new Promise((r) => setTimeout(r, 200));
    // Processed state lives in a WeakSet (an attribute was copied by clones).
    return /** @type {any} */ (globalThis).__vbEffectsRuntime._processed.has(el);
  });
  expect(processed).toBe(true);
});

test('the runtime is a single shared instance', async ({ page }) => {
  await page.goto('/docs/typography/');
  await page.waitForFunction(() => Boolean(window.VB));
  const same = await page.evaluate(() => window.VB === globalThis.__vbEffectsRuntime && window.VB._autoBooted === true);
  expect(same).toBe(true);
});

/**
 * The self-booted observer runs while vb.js evaluates — before
 * vb-triggers.js and the effect modules register (vanilla-breeze-t5r2).
 * Elements processed in that window must still get their trigger wired and
 * their effect's DOM must survive the observer seeing it move.
 */
test('data-trigger="scroll" elements processed before the trigger registered still activate', async ({ page }) => {
  await page.goto('/docs/examples/demos/slide-in-basic.html');
  await page.waitForFunction(() => Boolean(window.VB?._triggers?.size));
  const inView = page.locator('[data-trigger="scroll"]').first();
  await inView.scrollIntoViewIfNeeded();
  await expect(inView).toHaveAttribute('data-effect-active', '');
  // The hidden pre-state (translateX(-40px)) must not widen the document.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test('an effect that wraps its element keeps its control after the observer sees the move', async ({ page }) => {
  await page.goto('/docs/examples/demos/animate-image-basic.html');
  await page.waitForFunction(() => Boolean(window.VB?._effects?.has('animate-image')));
  await page.waitForTimeout(200);
  // Three images: two plain <img> and one inside a <picture> (the wrapper
  // then holds the whole <picture>, so its <source>s stay its children).
  await expect(page.locator('.animate-image-toggle')).toHaveCount(3);
  await expect(page.locator('.animate-image-wrapper img[data-effect~="animate-image"]')).toHaveCount(3);
  await expect(page.locator('.animate-image-wrapper > picture > img')).toHaveCount(1);
});
