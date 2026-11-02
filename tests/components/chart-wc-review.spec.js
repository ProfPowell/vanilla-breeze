/**
 * chart-wc — review fixes (vanilla-breeze-i89g, pohq).
 *
 * - the hidden source table stays in the accessibility tree
 * - non-table sources get a generated (visually hidden) data table
 * - print shows the table and hides the SVG
 * - nothing inside the aria-hidden SVG is focusable
 * - a failed render leaves the table visible
 * - a long hidden table does not inflate document scroll height
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__chart-wc-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <link rel="stylesheet" href="/src/charts-standalone.css">
      <script type="module">import '/src/web-components/chart-wc/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('chart-wc'));
  await page.waitForFunction(() => [...document.querySelectorAll('chart-wc')]
    .every((c) => c.querySelector('[data-chart-svg]')?.shadowRoot?.querySelector('svg')));
}

const TABLE = `<chart-wc data-type="column">
  <table>
    <caption>Quarterly Results</caption>
    <thead><tr><th></th><th>Revenue</th><th>Expenses</th></tr></thead>
    <tbody>
      <tr><th>Q1</th><td>45</td><td>32</td></tr>
      <tr><th>Q2</th><td>52</td><td>35</td></tr>
    </tbody>
  </table>
</chart-wc>`;

const VALUES = `<chart-wc data-type="line" data-title="Weekly Users" data-label-x="Day"
  data-values='[{"name":"Desktop","values":{"Mon":120,"Tue":180}},{"name":"Mobile","values":{"Mon":80,"Tue":120}}]'></chart-wc>`;

test.describe('chart-wc — text alternative', () => {
  test('hidden source table caption and cells are in the accessibility tree', async ({ page }) => {
    await load(page, TABLE);
    await expect(page.locator('chart-wc > table')).toHaveClass(/visually-hidden/);
    const snap = await page.locator('main').ariaSnapshot();
    expect(snap).toContain('table "Quarterly Results"');
    expect(snap).toMatch(/cell "45"/);
    expect(snap).toMatch(/rowheader "Q2"/);
    await expect(page.getByRole('table', { name: 'Quarterly Results' })).toBeAttached();
  });

  test('data-values gets a generated, visually hidden data table', async ({ page }) => {
    await load(page, VALUES);
    const table = page.getByRole('table', { name: 'Weekly Users' });
    await expect(table).toBeAttached();
    await expect(page.locator('chart-wc > table[data-chart-generated]')).toHaveClass(/visually-hidden/);
    const snap = await page.locator('main').ariaSnapshot();
    expect(snap).toMatch(/columnheader "Desktop"/);
    expect(snap).toMatch(/rowheader "Tue"/);
    expect(snap).toMatch(/cell "180"/);
  });

  test('.data and pie objects tabulate; table follows data changes', async ({ page }) => {
    await load(page, '<chart-wc data-type="pie" data-title="Share" data-values=\'{"Chrome":65,"Safari":18}\'></chart-wc>');
    let snap = await page.locator('main').ariaSnapshot();
    expect(snap).toMatch(/rowheader "Safari"/);
    await page.evaluate(() => { document.querySelector('chart-wc').data = { Firefox: 8 }; });
    await expect(page.getByRole('rowheader', { name: 'Firefox' })).toBeAttached();
    snap = await page.locator('main').ariaSnapshot();
    expect(snap).not.toMatch(/Safari/);
    await expect(page.locator('chart-wc > table')).toHaveCount(1);
  });

  test('a long hidden table does not inflate document height', async ({ page }) => {
    const rows = Array.from({ length: 300 }, (_, i) => `<tr><th>r${i}</th><td>${i}</td></tr>`).join('');
    await load(page, `<chart-wc data-type="line"><table><caption>Big</caption>
      <thead><tr><th></th><th>v</th></tr></thead><tbody>${rows}</tbody></table></chart-wc>`);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(h).toBeLessThan(1500);
    await expect(page.getByRole('rowheader', { name: 'r299' })).toBeAttached();
  });
});

test.describe('chart-wc — focus', () => {
  test('no focusable element inside the aria-hidden SVG (tooltip + pie)', async ({ page }) => {
    await load(page, `${VALUES.replace('data-type="line"', 'data-type="line" data-tooltip data-legend')}
      <chart-wc data-type="pie" data-tooltip data-values='{"A":1,"B":2}'></chart-wc>`);
    const tabbable = await page.evaluate(() => [...document.querySelectorAll('chart-wc [data-chart-svg]')]
      .flatMap((w) => [...w.shadowRoot.querySelectorAll('[tabindex]')])
      .filter((el) => el.tabIndex >= 0).length);
    expect(tabbable).toBe(0);
  });
});

test.describe('chart-wc — print', () => {
  test('print shows the data table and hides the SVG', async ({ page }) => {
    await load(page, `${TABLE}${VALUES}`);
    await page.emulateMedia({ media: 'print' });
    const r = await page.evaluate(() => [...document.querySelectorAll('chart-wc')].map((c) => {
      const t = c.querySelector(':scope > table');
      const cell = t.querySelector('td');
      return {
        tableH: t.getBoundingClientRect().height,
        cellVisible: cell.getBoundingClientRect().height > 0 && getComputedStyle(cell).display !== 'none',
        svg: getComputedStyle(c.querySelector('[data-chart-svg]')).display,
      };
    }));
    for (const c of r) {
      expect(c.tableH).toBeGreaterThan(20);
      expect(c.cellVisible).toBe(true);
      expect(c.svg).toBe('none');
    }
  });
});

test.describe('chart-wc — failure', () => {
  test('table stays visible when chart construction throws', async ({ page }) => {
    await page.addInitScript(() => {
      // Break SVC's mount (container.innerHTML = svg) inside chart-wc's shadow root.
      const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
      Object.defineProperty(Element.prototype, 'innerHTML', {
        configurable: true,
        get() { return desc.get.call(this); },
        set(v) {
          const root = this.getRootNode();
          if (v && root instanceof ShadowRoot && root.host.hasAttribute('data-chart-svg')) throw new Error('boom');
          desc.set.call(this, v);
        },
      });
    });
    await page.route('**/src/**', (route) => route.fulfill({
      path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
    }));
    await page.route('**/__chart-fail.html', (route) => route.fulfill({
      status: 200, contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
        <link rel="stylesheet" href="/src/main.css"><link rel="stylesheet" href="/src/charts-standalone.css">
        <script type="module">import '/src/web-components/chart-wc/logic.js';</script>
        </head><body><main>${TABLE}</main></body></html>`,
    }));
    const errors = [];
    await page.exposeFunction('__err', (m) => errors.push(m));
    await page.addInitScript(() => document.addEventListener('chart-wc:error', (e) => window.__err(e.detail.message)));
    await page.goto('/__chart-fail.html');
    await expect.poll(() => errors.length).toBeGreaterThan(0);
    await expect(page.locator('chart-wc > table')).not.toHaveClass(/visually-hidden/);
    await expect(page.locator('chart-wc > table')).toBeVisible();
  });
});
