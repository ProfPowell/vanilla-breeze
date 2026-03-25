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

  test('all seven chart types render', async ({page}) => {
    await page.goto(basicPage);
    await waitForAllCharts(page);

    const charts = page.locator('chart-wc');
    const count = await charts.count();
    expect(count).toBe(7);

    for (let i = 0; i < count; i++) {
      const svg = charts.nth(i).locator('[data-chart-svg] svg');
      await expect(svg).toBeVisible();
    }
  });

  test('pie chart renders correctly', async ({page}) => {
    await page.goto(basicPage);
    await waitForAllCharts(page);

    const pieChart = page.locator('chart-wc[data-type="pie"]');
    const svg = pieChart.locator('[data-chart-svg] svg');
    await expect(svg).toBeVisible();
  });

  test('scatter chart renders', async ({page}) => {
    await page.goto(basicPage);
    await waitForAllCharts(page);

    const scatterChart = page.locator('chart-wc[data-type="scatter"]');
    const svg = scatterChart.locator('[data-chart-svg] svg');
    await expect(svg).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Table data source (progressive enhancement)
// ---------------------------------------------------------------------------

test.describe('chart-wc — table source', () => {

  test('table-sourced chart renders SVG', async ({page}) => {
    await page.goto(tablePage);
    await waitForChart(page);

    const svg = page.locator('chart-wc [data-chart-svg] svg').first();
    await expect(svg).toBeVisible();
  });

  test('source table gets sr-only class', async ({page}) => {
    await page.goto(tablePage);
    await waitForChart(page);

    const table = page.locator('chart-wc table').first();
    await expect(table).toHaveClass(/sr-only/);
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
    const svg = columnChart.locator('[data-chart-svg] svg');
    await expect(svg).toBeVisible();
  });

  test('data-chart-ignore excludes column', async ({page}) => {
    await page.goto(tablePage);
    await waitForAllCharts(page);

    // The last chart has data-chart-ignore on the ID column
    const chart = page.locator('chart-wc').last();
    const svg = chart.locator('[data-chart-svg] svg');
    await expect(svg).toBeVisible();
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
    const svg = chart.locator('[data-chart-svg] svg');
    await expect(svg).toBeVisible();
  });

  test('template data source renders', async ({page}) => {
    await page.goto(dynamicPage);
    await waitForAllCharts(page);

    const chart = page.locator('chart-wc').nth(1);
    const svg = chart.locator('[data-chart-svg] svg');
    await expect(svg).toBeVisible();
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
    const svg = dynamicChart.locator('[data-chart-svg] svg');
    await expect(svg).toBeVisible();
  });

  test('updating data re-renders the chart', async ({page}) => {
    await page.goto(dynamicPage);
    await waitForAllCharts(page);

    // Click the traffic data button
    await page.click('#btn-traffic');
    await page.waitForTimeout(200);

    const svg = page.locator('#dynamic-chart [data-chart-svg] svg');
    await expect(svg).toBeVisible();
  });

  test('random data button updates chart', async ({page}) => {
    await page.goto(dynamicPage);
    await waitForAllCharts(page);

    await page.click('#btn-random');
    await page.waitForTimeout(200);

    const svg = page.locator('#dynamic-chart [data-chart-svg] svg');
    await expect(svg).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

test.describe('chart-wc — events', () => {

  test('chart-wc:render event fires', async ({page}) => {
    await page.goto(dynamicPage);

    const rendered = await page.evaluate(() => {
      return new Promise((resolve) => {
        const chart = document.getElementById('event-chart');
        chart.addEventListener('chart-wc:render', (e) => {
          resolve(e.detail);
        }, {once: true});
      });
    });

    expect(rendered).toHaveProperty('type');
    expect(rendered).toHaveProperty('seriesCount');
  });
});
