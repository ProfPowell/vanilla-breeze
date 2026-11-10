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

test.describe('chart-wc — ring hole follows the theme', () => {
  // The hole's fill came from Pie.js's center.style default (#fff), compiled
  // into the shadow stylesheet as `.svc-center { fill: #fff }`, which beats
  // the circle's own fill attribute — so the hole stayed white in dark mode.
  const RING = `<chart-wc data-type="ring" data-title="Storage"
    data-values='{"Documents":42,"Photos":28,"Free":30}'></chart-wc>`;

  for (const mode of ['light', 'dark']) {
    test(`hole fill equals --color-surface in ${mode} mode`, async ({ page }) => {
      await page.addInitScript((m) => {
        document.addEventListener('DOMContentLoaded', () => { document.documentElement.dataset.mode = m; });
      }, mode);
      await load(page, RING);
      const { hole, surface } = await page.evaluate(() => {
        const host = document.querySelector('chart-wc [data-chart-svg]');
        const circle = host.shadowRoot.querySelector('circle.svc-center');
        const probe = document.createElement('span');
        probe.style.color = 'var(--color-surface)';
        host.parentElement.append(probe);
        const surface = getComputedStyle(probe).color;
        probe.remove();
        // Normalise both through `color` so oklch()/rgb() spellings compare.
        const norm = document.createElement('span');
        norm.style.color = getComputedStyle(circle).fill;
        host.parentElement.append(norm);
        const hole = getComputedStyle(norm).color;
        norm.remove();
        return { hole, surface };
      });
      expect(hole).toBe(surface);
      if (mode === 'dark') expect(hole).not.toMatch(/^(rgb\(255, 255, 255\)|oklch\(1 0 0\))$/);
    });
  }
});

// ---------------------------------------------------------------------------
// Tutorial-found bugs: legend/tooltip switches, narrow legend, tooltip without
// a legend, last x label on line/area, dark-mode colours.
// ---------------------------------------------------------------------------

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const week = (name, vals) => ({ name, values: Object.fromEntries(DAYS.map((d, i) => [d, vals[i]])) });
const WEEK = JSON.stringify([week('Desktop', [44, 55, 49, 70, 69, 33, 29]), week('Mobile', [30, 35, 41, 52, 60, 48, 40])]);
const weekChart = (type, attrs = '') =>
  `<chart-wc data-type="${type}" data-title="Page views by day" ${attrs} data-values='${WEEK}'></chart-wc>`;

/** Run fn against the chart's shadow root. */
const inChart = (page, selector, fn) => page.locator(selector).evaluate(
  (host, src) => new Function('root', `return (${src})(root)`)(host.querySelector('[data-chart-svg]').shadowRoot),
  fn.toString(),
);
const parts = (root) => ({
  legend: !!root.querySelector('chart-legend'),
  tooltip: !!root.querySelector('#svc-tooltip-box'),
});

test.describe('chart-wc — legend and tooltip switches', () => {
  test('both are on by default and with the bare attribute', async ({ page }) => {
    await load(page, `<section>${weekChart('column', 'id="plain"')}${weekChart('column', 'id="bare" data-legend data-tooltip')}</section>`);
    expect(await inChart(page, '#plain', parts)).toEqual({ legend: true, tooltip: true });
    expect(await inChart(page, '#bare', parts)).toEqual({ legend: true, tooltip: true });
  });

  test('="false" turns each off, and wins over data-config', async ({ page }) => {
    await load(page, `<section>
      ${weekChart('column', 'id="nolegend" data-legend="false"')}
      ${weekChart('column', 'id="notip" data-tooltip="false"')}
      ${weekChart('column', `id="wins" data-legend="false" data-config='{"legend":{"enabled":true}}'`)}
    </section>`);
    expect(await inChart(page, '#nolegend', parts)).toEqual({ legend: false, tooltip: true });
    expect(await inChart(page, '#notip', parts)).toEqual({ legend: true, tooltip: false });
    expect(await inChart(page, '#wins', parts)).toEqual({ legend: false, tooltip: true });
  });

  test('the table\'s own data-legend="false" is honoured; chart-wc\'s attribute wins', async ({ page }) => {
    const table = (attrs) => `<table ${attrs}><caption>T</caption>
      <thead><tr><th></th><th>A</th><th>B</th></tr></thead>
      <tbody><tr><th>Q1</th><td>4</td><td>3</td></tr><tr><th>Q2</th><td>5</td><td>6</td></tr></tbody></table>`;
    await load(page, `<section>
      <chart-wc id="t-off" data-type="column">${table('data-legend="false"')}</chart-wc>
      <chart-wc id="t-on" data-type="column" data-legend>${table('data-legend="false"')}</chart-wc>
    </section>`);
    expect((await inChart(page, '#t-off', parts)).legend).toBe(false);
    expect((await inChart(page, '#t-on', parts)).legend).toBe(true);
  });
});

test.describe('chart-wc — legend placement', () => {
  const place = (root) => {
    const legend = root.querySelector('chart-legend').getBoundingClientRect();
    const canvas = root.querySelector('chart-canvas').getBoundingClientRect();
    const figure = root.querySelector('figure').getBoundingClientRect();
    return {
      under: legend.top >= canvas.bottom - 1,
      beside: legend.left >= canvas.right - 1,
      canvasFills: canvas.width / figure.width,
      inside: legend.bottom <= figure.bottom + 1 && legend.right <= figure.right + 1,
    };
  };

  for (const type of ['column', 'line', 'area', 'pie']) {
    test(`${type}: stacks under the plot in a 300px parent, sits beside it at 800px`, async ({ page }) => {
      const chart = type === 'pie'
        ? '<chart-wc data-type="pie" data-values=\'{"Chrome":65,"Safari":18,"Firefox":8}\'></chart-wc>'
        : weekChart(type);
      await load(page, `<section id="narrow" style="inline-size:300px">${chart}</section>
        <section id="wide" style="inline-size:800px">${chart}</section>`);
      const narrow = await inChart(page, '#narrow chart-wc', place);
      expect(narrow.under).toBe(true);
      expect(narrow.inside).toBe(true);
      expect(narrow.canvasFills).toBeGreaterThan(0.9);
      const wide = await inChart(page, '#wide chart-wc', place);
      expect(wide.beside).toBe(true);
      expect(wide.under).toBe(false);
    });
  }
});

test.describe('chart-wc — tooltip without a legend', () => {
  for (const type of ['column', 'bar', 'line', 'area']) {
    test(`${type}: mousemove shows values and does not throw`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      // The reported repro: legend off through data-config.
      await load(page, `<section style="inline-size:600px">${weekChart(type, `data-config='{"legend":{"enabled":false}}'`)}</section>`);
      expect((await inChart(page, 'chart-wc', parts)).legend).toBe(false);
      const box = await page.locator('chart-wc chart-plot').boundingBox();
      for (let i = 1; i < 8; i++) {
        await page.mouse.move(box.x + (box.width * i) / 8, box.y + box.height / 2);
      }
      expect(errors).toEqual([]);
      const text = await inChart(page, 'chart-wc', (root) => root.querySelector('#svc-tooltip-label').textContent);
      expect(text).toContain('Desktop');
      expect(text).toContain('Mobile');
    });
  }

  test('with a legend, an unchecked series still leaves the tooltip', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await load(page, `<section style="inline-size:600px">${weekChart('column')}</section>`);
    await page.locator('chart-wc chart-legend input').nth(1).click();
    const box = await page.locator('chart-wc chart-plot').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width / 2 + 5, box.y + box.height / 2);
    const text = await inChart(page, 'chart-wc', (root) => root.querySelector('#svc-tooltip-label').textContent);
    expect(errors).toEqual([]);
    expect(text).toContain('Desktop');
    expect(text).not.toContain('Mobile');
  });
});

test.describe('chart-wc — x-axis labels', () => {
  const labels = (root) => [...root.querySelectorAll('.svc-scale-label-x')]
    .map((el) => `${el.textContent}@${el.style.left}`);

  for (const type of ['line', 'area', 'column']) {
    test(`${type}: seven categories get seven labels`, async ({ page }) => {
      await load(page, `<section style="inline-size:800px">${weekChart(type)}</section>`);
      const found = await inChart(page, 'chart-wc', labels);
      expect(found.map((l) => l.split('@')[0])).toEqual(DAYS);
      if (type !== 'column') {
        expect(found[0]).toBe('Mon@0%');
        expect(found[6]).toBe('Sun@100%');
      }
    });
  }

  test('line: the last label, tick and guide are drawn and the label stays inside the chart', async ({ page }) => {
    await load(page, `<section style="inline-size:300px">${weekChart('line', 'data-legend="false"')}</section>`);
    const r = await inChart(page, 'chart-wc', (root) => {
      const all = [...root.querySelectorAll('.svc-scale-label-x')];
      const last = all.at(-1);
      const range = document.createRange();
      range.selectNodeContents(last);
      return {
        text: last.textContent,
        opacity: getComputedStyle(last).opacity,
        textRight: range.getBoundingClientRect().right,
        figureRight: root.querySelector('figure').getBoundingClientRect().right,
        ticks: root.querySelectorAll('line.svc-ticks-x').length,
        guides: root.querySelectorAll('line.svc-guides-x').length,
      };
    });
    expect(r.text).toBe('Sun');
    expect(r.opacity).toBe('1');
    expect(r.textRight).toBeLessThanOrEqual(r.figureRight + 0.5);
    expect(r.ticks).toBe(7);
    expect(r.guides).toBe(6);
  });

  test('line: more categories than scale.maxItems keeps labels on their own points', async ({ page }) => {
    const keys = Array.from({ length: 20 }, (_, i) => `K${i}`);
    const data = JSON.stringify([{ name: 'S', values: Object.fromEntries(keys.map((k, i) => [k, i])) }]);
    await load(page, `<section style="inline-size:1200px"><chart-wc data-type="line" data-values='${data}'></chart-wc></section>`);
    const found = await inChart(page, 'chart-wc', labels);
    // step is 2: every second key, each at index / 19 of the width.
    expect(found[0]).toBe('K0@0%');
    expect(found[1]).toBe('K2@10.53%');
    expect(found.at(-1)).toBe('K18@94.74%');
    expect(found).toHaveLength(10);
  });
});

test.describe('chart-wc — colours follow the theme', () => {
  for (const mode of ['light', 'dark']) {
    test(`${mode}: title, labels, grid, ticks and axis use theme tokens`, async ({ page }) => {
      await page.addInitScript((m) => {
        document.addEventListener('DOMContentLoaded', () => { document.documentElement.dataset.mode = m; });
      }, mode);
      await load(page, `<section style="inline-size:800px">${weekChart('column')}</section>`);
      const c = await page.evaluate(() => {
        const host = document.querySelector('chart-wc');
        const root = host.querySelector('[data-chart-svg]').shadowRoot;
        const norm = (value) => {
          const probe = document.createElement('span');
          probe.style.color = value;
          host.append(probe);
          const out = getComputedStyle(probe).color;
          probe.remove();
          return out;
        };
        const lum = (value) => {
          const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
          ctx.fillStyle = value;
          ctx.fillRect(0, 0, 1, 1);
          const [r, g, b] = [...ctx.getImageData(0, 0, 1, 1).data].map((v) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const contrast = (a, b) => {
          const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
          return (hi + 0.05) / (lo + 0.05);
        };
        const css = (sel, prop) => norm(getComputedStyle(root.querySelector(sel))[prop]);
        const surface = norm('var(--color-surface)');
        const title = css('.svc-title', 'color');
        const grid = css('line.svc-guides', 'stroke');
        return {
          title, grid,
          titleToken: norm('var(--color-text)'),
          gridToken: norm('var(--color-border)'),
          label: css('.svc-scale-label-y', 'color'),
          labelToken: norm('var(--color-text-muted)'),
          tick: css('line.svc-ticks', 'stroke'),
          axis: css('line.svc-axis', 'stroke'),
          axisToken: norm('var(--color-border-strong)'),
          titleContrast: contrast(title, surface),
          gridContrast: contrast(grid, surface),
          // Grid lines are painted before the bars, so the bars cover them.
          gridUnderBars: !!(root.querySelector('.svc-y-guides').compareDocumentPosition(root.querySelector('svg.svc-plot'))
            & Node.DOCUMENT_POSITION_FOLLOWING),
        };
      });
      expect(c.title).toBe(c.titleToken);
      expect(c.grid).toBe(c.gridToken);
      expect(c.tick).toBe(c.gridToken);
      expect(c.label).toBe(c.labelToken);
      expect(c.axis).toBe(c.axisToken);
      expect(c.titleContrast).toBeGreaterThan(7);
      // Quiet in both modes: the old #e4e4e4 was about 15:1 on the dark surface.
      expect(c.gridContrast).toBeLessThan(2);
      expect(c.gridUnderBars).toBe(true);
    });
  }

  test('a --chart-* property on the host still overrides the theme token', async ({ page }) => {
    await load(page, `<section style="inline-size:800px">${weekChart('column', 'style="--chart-grid-color: rgb(255, 0, 0); --chart-title-color: rgb(0, 0, 255)"')}</section>`);
    const c = await inChart(page, 'chart-wc', (root) => ({
      grid: getComputedStyle(root.querySelector('line.svc-guides')).stroke,
      title: getComputedStyle(root.querySelector('.svc-title')).color,
    }));
    expect(c.grid).toBe('rgb(255, 0, 0)');
    expect(c.title).toBe('rgb(0, 0, 255)');
  });
});
