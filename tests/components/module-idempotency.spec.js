/**
 * Module-scope side effects must be idempotent per document.
 *
 * A module bundled into more than one chunk is a different URL each time, so
 * the browser evaluates it once per chunk. Any side effect at module scope —
 * an interval, a global listener, a one-shot DOM pass — then happens N times.
 * time-relative.js is bundled into vanilla-breeze.js AND four per-component
 * chunks, so a page autoloading all four ran five 60s intervals, each scanning
 * the whole document and rewriting the same elements.
 *
 * Each test evaluates the module twice under different URLs (a cache-busting
 * query string makes the second import a distinct module record, exactly as a
 * second bundle copy would be) and asserts the work happened once.
 */

import { test, expect } from 'playwright/test';

/** Serve a bare page from a real URL so module evaluation is not shared. */
async function blankPage(page, body = '') {
  const url = '/__idempotency-fixture.html';
  await page.route(`**${url}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>fixture</title></head><body>${body}</body></html>`,
    }),
  );
  await page.goto(url, { waitUntil: 'load' });
}

test.describe('module side effects are guarded per document', () => {
  test('time-relative registers a single interval across two evaluations', async ({ page }) => {
    await blankPage(page, '<time data-relative datetime="2020-01-01T00:00:00Z">x</time>');

    const intervals = await page.evaluate(async () => {
      const created = [];
      const realSetInterval = window.setInterval;
      // @ts-ignore — test shim
      window.setInterval = (...args) => {
        created.push(args[1]);
        return realSetInterval(...args);
      };

      await import('/src/lib/time-relative.js');
      await import('/src/lib/time-relative.js?second-copy');

      window.setInterval = realSetInterval;
      return created;
    });

    expect(intervals).toEqual([60_000]);
  });

  test('time-relative still formats the element', async ({ page }) => {
    await blankPage(page, '<time data-relative datetime="2020-01-01T00:00:00Z">x</time>');
    await page.evaluate(() => import('/src/lib/time-relative.js'));

    await expect(page.locator('time[data-relative]')).not.toHaveText('x');
  });

  test('recently-visited does not double-track or stack listeners', async ({ page }) => {
    await blankPage(page);

    const added = await page.evaluate(async () => {
      const seen = [];
      const realAdd = window.addEventListener.bind(window);
      window.addEventListener = (type, ...rest) => {
        if (type === 'pageshow' || type === 'hashchange') seen.push(type);
        // @ts-ignore — test shim
        return realAdd(type, ...rest);
      };

      await import('/src/utils/recently-visited-init.js');
      await import('/src/utils/recently-visited-init.js?second-copy');

      return seen;
    });

    expect(added.sort()).toEqual(['hashchange', 'pageshow']);
  });

  test('flipboard builds one board when the effect is applied twice', async ({ page }) => {
    await blankPage(page, '<p data-effect="flipboard">DEPARTURES</p>');

    const cells = await page.evaluate(async () => {
      const { VB } = await import('/src/lib/vb.js');
      await import('/src/effects/flipboard.js');
      const el = document.querySelector('[data-effect="flipboard"]');

      VB.observe();
      // Re-apply: a second VB instance would do exactly this.
      VB.observe();
      await new Promise((r) => setTimeout(r, 300));

      return {
        boards: el.querySelectorAll('.vb-flap-char').length,
        guarded: el.hasAttribute('data-effect-flipboard-init'),
      };
    });

    expect(cells.guarded).toBe(true);
    // "DEPARTURES" is 10 characters — one cell each, not twenty.
    expect(cells.boards).toBe(10);
  });
});
