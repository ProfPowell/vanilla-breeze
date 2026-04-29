/**
 * Chart WC Component Tests
 *
 * Tests rendering from all five data sources, all chart types,
 * progressive enhancement behavior, and lifecycle management.
 */

import {test, expect} from 'playwright/test';

const basicPage = '/docs/examples/demos/chart-wc-basic.html';
const tablePage = '/docs/examples/demos/chart-wc-table.html';
const dynamicPage = '/docs/examples/demos/chart-wc-dynamic.html';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForChart(page, selector = 'chart-wc') {
  await page.waitForSelector(`${selector}[data-upgraded]`, {timeout: 5000});
}

async function waitForAllCharts(page) {
  await page.waitForFunction(() => {
    const charts = document.querySelectorAll('chart-wc');
    return charts.length > 0 && [...charts].every((c) => c.hasAttribute('data-upgraded'));
  }, {timeout: 10000});
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

test.describe('chart-wc — initialization', () => {

  test('component gets data-upgraded attribute', async ({page}) => {
    await page.goto(basicPage);
    await waitForChart(page);

    const chart = page.locator('chart-wc').first();
    await expect(chart).toHaveAttribute('data-upgraded', '');
  });

  test('renders SVG inside the component', async ({page}) => {
    await page.goto(basicPage);
    await waitForChart(page);

    const svg = page.locator('chart-wc [data-chart-svg] svg').first();
    await expect(svg).toBeVisible();
  });

  test('SVG container has aria-hidden', async ({page}) => {
    await page.goto(basicPage);
    await waitForChart(page);

    const container = page.locator('chart-wc [data-chart-svg]').first();
    await expect(container).toHaveAttribute('aria-hidden', 'true');
  });
});

// ---------------------------------------------------------------------------
// JSON attribute data source
// ---------------------------------------------------------------------------

test.describe('chart-wc — JSON attribute', () => {

  test('all eight chart types render', async ({page}) => {
    await page.goto(basicPage);
    await waitForAllCharts(page);

    const charts = page.locator('chart-wc');
    const count = await charts.count();
    expect(count).toBe(8);

    for (let i = 0; i < count; i++) {
      // The wrapper [data-chart-svg] is one element per chart-wc; the chart
      // engine renders many nested SVGs inside it, so assert visibility on
      // the wrapper to avoid strict-mode multi-match failures.
      const wrapper = charts.nth(i).locator('[data-chart-svg]');
      await expect(wrapper).toBeVisible();
    }
  });

  test('pie chart renders correctly', async ({page}) => {
    await page.goto(basicPage);
    await waitForAllCharts(page);

    const pieChart = page.locator('chart-wc[data-type="pie"]');
    await expect(pieChart.locator('[data-chart-svg]')).toBeVisible();
  });

  test('ring chart renders with center hole', async ({page}) => {
    await page.goto(basicPage);
    await waitForAllCharts(page);

    const ringChart = page.locator('chart-wc[data-type="ring"]');
    // The chart renders 11+ nested SVGs into [data-chart-svg]'s shadow root
    // (Playwright pierces open shadow DOM); assert visibility on the wrapper
    // itself rather than picking one of the inner SVGs.
    await expect(ringChart.locator('[data-chart-svg]')).toBeVisible();

    // Ring mode renders one circle.svc-center; pie mode renders none.
    await expect(ringChart.locator('circle.svc-center')).toHaveCount(1);
    await expect(
      page.locator('chart-wc[data-type="pie"]').locator('circle.svc-center'),
    ).toHaveCount(0);
  });

  test('scatter chart renders', async ({page}) => {
    await page.goto(basicPage);
    await waitForAllCharts(page);

    const scatterChart = page.locator('chart-wc[data-type="scatter"]');
    await expect(scatterChart.locator('[data-chart-svg]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Table data source (progressive enhancement)
// ---------------------------------------------------------------------------

test.describe('chart-wc — table source', () => {

  test('table-sourced chart renders SVG', async ({page}) => {
    await page.goto(tablePage);
    await waitForChart(page);

    const wrapper = page.locator('chart-wc [data-chart-svg]').first();
    await expect(wrapper).toBeVisible();
  });

  test('source table gets visually-hidden class', async ({page}) => {
    await page.goto(tablePage);
    await waitForChart(page);

    // chart-wc was migrated from bespoke .sr-only to the site-wide
    // .visually-hidden utility (see commit 9dbe34e5).
    const table = page.locator('chart-wc table').first();
    await expect(table).toHaveClass(/visually-hidden/);
  });

  test('source table has aria-hidden=false (still accessible)', async ({page}) => {
    await page.goto(tablePage);
    await waitForChart(page);

    const table = page.locator('chart-wc table').first();
    await expect(table).toHaveAttribute('aria-hidden', 'false');
  });

  test('column chart from table renders', async ({page}) => {
    await page.goto(tablePage);
    await waitForAllCharts(page);

    const columnChart = page.locator('chart-wc').nth(1);
    await expect(columnChart.locator('[data-chart-svg]')).toBeVisible();
  });

  test('data-chart-ignore excludes column', async ({page}) => {
    await page.goto(tablePage);
    await waitForAllCharts(page);

    // The last chart has data-chart-ignore on the ID column
    const chart = page.locator('chart-wc').last();
    await expect(chart.locator('[data-chart-svg]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Script and template data sources
// ---------------------------------------------------------------------------

test.describe('chart-wc — script & template sources', () => {

  test('script block data source renders', async ({page}) => {
    await page.goto(dynamicPage);
    await waitForChart(page);

    const chart = page.locator('chart-wc').first();
    await expect(chart.locator('[data-chart-svg]')).toBeVisible();
  });

  test('template data source renders', async ({page}) => {
    await page.goto(dynamicPage);
    await waitForAllCharts(page);

    const chart = page.locator('chart-wc').nth(1);
    await expect(chart.locator('[data-chart-svg]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Dynamic property API
// ---------------------------------------------------------------------------

test.describe('chart-wc — dynamic property', () => {

  test('JS property sets data and renders', async ({page}) => {
    await page.goto(dynamicPage);
    await waitForAllCharts(page);

    const dynamicChart = page.locator('#dynamic-chart');
    await expect(dynamicChart.locator('[data-chart-svg]')).toBeVisible();
  });

  test('updating data re-renders the chart', async ({page}) => {
    await page.goto(dynamicPage);
    await waitForAllCharts(page);

    // Click the traffic data button
    await page.click('#btn-traffic');
    await page.waitForTimeout(200);

    await expect(
      page.locator('#dynamic-chart [data-chart-svg]'),
    ).toBeVisible();
  });

  test('random data button updates chart', async ({page}) => {
    await page.goto(dynamicPage);
    await waitForAllCharts(page);

    await page.click('#btn-random');
    await page.waitForTimeout(200);

    await expect(
      page.locator('#dynamic-chart [data-chart-svg]'),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

test.describe('chart-wc — events', () => {

  test('chart-wc:render event fires', async ({page}) => {
    await page.goto(dynamicPage);
    await waitForAllCharts(page);

    // The initial render event may have already fired by the time the test
    // attaches a listener. Trigger a fresh render via refresh() and catch
    // that one — the queueRender() microtask runs after the listener binds.
    const rendered = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const chart = document.getElementById('event-chart');
        if (!chart) return reject(new Error('event-chart not found'));
        const timer = setTimeout(
          () => reject(new Error('chart-wc:render did not fire within 5s')),
          5000,
        );
        chart.addEventListener('chart-wc:render', (e) => {
          clearTimeout(timer);
          resolve(e.detail);
        }, {once: true});
        chart.refresh();
      });
    });

    expect(rendered).toHaveProperty('type');
    expect(rendered).toHaveProperty('seriesCount');
  });
});
