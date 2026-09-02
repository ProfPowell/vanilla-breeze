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
    return el.hasAttribute('data-effect-processed');
  });
  expect(processed).toBe(true);
});

test('the runtime is a single shared instance', async ({ page }) => {
  await page.goto('/docs/typography/');
  await page.waitForFunction(() => Boolean(window.VB));
  const same = await page.evaluate(() => window.VB === globalThis.__vbEffectsRuntime && window.VB._autoBooted === true);
  expect(same).toBe(true);
});
