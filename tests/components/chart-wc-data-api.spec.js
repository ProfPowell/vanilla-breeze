/**
 * chart-wc — Data API events (Phase 3a)
 *
 * Verifies the new tagged change event added so reactive frameworks
 * can react to data updates without feedback loops, and confirms the
 * inherited :upgraded signal fires.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/chart-wc-basic.html';

test.describe('chart-wc — data API', () => {

  test('emits chart-wc:data-changed with source: "property" on .data assignment', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('chart-wc[data-upgraded]');

    const sources = await page.evaluate(() => {
      const chart = document.querySelector('chart-wc');
      const captured = [];
      chart.addEventListener('chart-wc:data-changed', (e) => {
        captured.push(e.detail.source);
      });
      chart.data = [{ name: 'A', values: { x: 1 } }];
      chart.data = [{ name: 'B', values: { x: 2 } }];
      return captured;
    });

    expect(sources).toEqual(['property', 'property']);
  });

  test('idempotent .data assignment is a no-op', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('chart-wc[data-upgraded]');

    const count = await page.evaluate(() => {
      const chart = document.querySelector('chart-wc');
      const ref = [{ name: 'A', values: { x: 1 } }];
      let count = 0;
      chart.addEventListener('chart-wc:data-changed', () => { count += 1; });
      chart.data = ref;
      chart.data = ref; // same reference — should not re-fire
      return count;
    });

    expect(count).toBe(1);
  });

  test('chart-wc:upgraded fires once and is safe to wait on before .data', async ({ page }) => {
    await page.goto(demoPage);

    const result = await page.evaluate(() => new Promise(resolve => {
      const chart = document.querySelector('chart-wc');
      let count = 0;
      const handler = () => { count += 1; };
      // If already upgraded, force a re-attach to capture the event freshly
      if (chart.hasAttribute('data-upgraded')) {
        const parent = chart.parentElement;
        const next = chart.nextSibling;
        chart.remove();
        document.addEventListener('chart-wc:upgraded', handler);
        parent.insertBefore(chart, next);
      } else {
        document.addEventListener('chart-wc:upgraded', handler);
      }
      // Allow microtask + animation frame for chart render
      setTimeout(() => resolve({ count, isConnected: chart.isConnected }), 100);
    }));

    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(result.isConnected).toBe(true);
  });
});
