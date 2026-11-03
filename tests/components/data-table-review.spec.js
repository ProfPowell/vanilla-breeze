/**
 * data-table — review fixes (beads 8kf7, 8s1z, rb3n, qim5, o3es).
 *
 * Covers: the sort indicator following aria-sort; <button> sort headers
 * (APG sortable table) with keyboard activation; the polite live region
 * (sort, filter count, no results, selection); the real no-results element
 * with its data-label override; pagination focus restoration; expansion
 * content rows hidden with their parent; refresh() parity with setup;
 * goToPage without pagination; heatmap dark-mode contrast; bulk bar scoping.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { scheme = 'light' } = {}) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__data-table-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/data-table/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('data-table'));
  await page.waitForSelector('data-table[data-upgraded]');
}

const rows = (n) => Array.from({ length: n }, (_, i) =>
  `<tr><td>Name ${String(i + 1).padStart(2, '0')}</td><td data-sort-value="${i + 1}">$${(i + 1) * 1000}</td></tr>`).join('');

const BASIC = `
  <data-table id="dt">
    <table data-filterable data-paginate="3">
      <thead><tr><th data-sort="string">Name</th><th data-sort="number">Price</th></tr></thead>
      <tbody>${rows(8)}</tbody>
    </table>
  </data-table>`;

const status = (page) => page.locator('#dt [data-table-status]');
const indicator = (page, i) => page.evaluate((idx) => {
  const btn = document.querySelectorAll('#dt th[data-sort] > button')[idx];
  return getComputedStyle(btn, '::after').content;
}, i);

test.describe('sort headers and indicator', () => {
  test('headers wrap a <button>; th keeps aria-sort and is not itself focusable', async ({ page }) => {
    await load(page, BASIC);
    const info = await page.evaluate(() => [...document.querySelectorAll('#dt th[data-sort]')].map((th) => ({
      tabindex: th.getAttribute('tabindex'),
      role: th.getAttribute('role'),
      ariaSort: th.getAttribute('aria-sort'),
      buttons: th.querySelectorAll(':scope > button[type="button"]').length,
      label: th.querySelector('button')?.textContent,
    })));
    expect(info).toEqual([
      { tabindex: null, role: null, ariaSort: 'none', buttons: 1, label: 'Name' },
      { tabindex: null, role: null, ariaSort: 'none', buttons: 1, label: 'Price' },
    ]);
  });

  test('reconnect does not double-wrap the header button', async ({ page }) => {
    await load(page, BASIC);
    const n = await page.evaluate(() => {
      const dt = document.getElementById('dt');
      const main = dt.parentElement;
      for (let i = 0; i < 3; i++) { dt.remove(); main.append(dt); }
      return document.querySelectorAll('#dt th button').length;
    });
    expect(n).toBe(2);
  });

  test('computed ::after arrow follows aria-sort', async ({ page }) => {
    await load(page, BASIC);
    expect(await indicator(page, 1)).toContain('⇅');
    const price = page.locator('#dt th[data-sort]').nth(1);
    // Price is authored ascending, so the first activation sorts descending
    await price.locator('button').click();
    await expect(price).toHaveAttribute('aria-sort', 'descending');
    expect(await indicator(page, 1)).toContain('↓');
    await price.locator('button').click();
    await expect(price).toHaveAttribute('aria-sort', 'ascending');
    expect(await indicator(page, 1)).toContain('↑');
    expect(await indicator(page, 0)).toContain('⇅');
  });

  test('keyboard: Tab to the header button, Enter and Space sort; focus ring visible', async ({ page }) => {
    await load(page, BASIC);
    await page.locator('#dt [data-filter-input]').focus();
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return { tag: el.tagName, inTh: el.parentElement?.tagName, outline: getComputedStyle(el).outlineStyle };
    });
    expect(focused.tag).toBe('BUTTON');
    expect(focused.inTh).toBe('TH');
    expect(focused.outline).not.toBe('none');
    const name = page.locator('#dt th[data-sort]').first();
    await page.keyboard.press('Enter');
    await expect(name).toHaveAttribute('aria-sort', 'descending');
    await page.keyboard.press(' ');
    await expect(name).toHaveAttribute('aria-sort', 'ascending');
  });

  test('clicking header padding (outside the button) still sorts', async ({ page }) => {
    await load(page, BASIC);
    const th = page.locator('#dt th[data-sort]').first();
    await th.click({ position: { x: 2, y: 2 } });
    await expect(th).toHaveAttribute('aria-sort', /ascending|descending/);
  });
});

test.describe('live region announcements', () => {
  test('sort direction is announced', async ({ page }) => {
    await load(page, BASIC);
    await expect(status(page)).toHaveAttribute('aria-live', 'polite');
    await expect(status(page)).toHaveAttribute('role', 'status');
    await expect(status(page)).toHaveCSS('position', 'absolute'); // .visually-hidden
    await page.locator('#dt th[data-sort]').first().locator('button').click();
    await expect(status(page)).toHaveText(/Sorted by Name, descending/);
  });

  test('filter count, no results (real element + label override)', async ({ page }) => {
    await load(page, BASIC.replace('<data-table id="dt">', '<data-table id="dt" data-label-no-results="Nothing here">'));
    const empty = page.locator('#dt [data-table-empty]');
    await expect(empty).toBeHidden();
    await page.locator('#dt [data-filter-input]').fill('Name 0');
    await expect(status(page)).toHaveText(/8 of 8 rows shown/);
    await page.locator('#dt [data-filter-input]').fill('Name 01');
    await expect(status(page)).toHaveText(/1 of 8 rows shown/);
    await page.locator('#dt [data-filter-input]').fill('zzz');
    await expect(status(page)).toHaveText(/Nothing here/);
    await expect(empty).toBeVisible();
    await expect(empty).toHaveText('Nothing here');
    // No CSS-generated pseudo-content on tbody any more
    const pseudo = await page.evaluate(() => getComputedStyle(document.querySelector('#dt tbody'), '::after').content);
    expect(pseudo).toBe('none');
    await page.evaluate(() => document.getElementById('dt').setFilter(''));
    await expect(empty).toBeHidden();
    await expect(status(page)).toHaveText(/All 8 rows shown/);
  });

  test('selection count is announced', async ({ page }) => {
    await load(page, `
      <data-table id="dt">
        <table>
          <thead><tr><th><input type="checkbox" data-action="select-all" aria-label="Select all"></th><th>Name</th></tr></thead>
          <tbody>
            <tr data-selectable><td><input type="checkbox" data-action="select-row" aria-label="Select A"></td><td>A</td></tr>
            <tr data-selectable><td><input type="checkbox" data-action="select-row" aria-label="Select B"></td><td>B</td></tr>
          </tbody>
        </table>
      </data-table>`);
    await page.getByLabel('Select A', { exact: true }).check();
    await expect(status(page)).toHaveText(/1 row selected/);
    await page.getByLabel('Select all', { exact: true }).check();
    await expect(status(page)).toHaveText(/2 rows selected/);
  });
});

test.describe('pagination focus', () => {
  test('focus moves to the new current-page button after a page click', async ({ page }) => {
    await load(page, BASIC);
    await page.locator('#dt [data-pagination-page]', { hasText: '2' }).focus();
    await page.keyboard.press('Enter');
    const f = await page.evaluate(() => ({
      text: document.activeElement.textContent,
      current: document.activeElement.getAttribute('aria-current'),
    }));
    expect(f).toEqual({ text: '2', current: 'page' });
  });

  test('Next keeps focus; when it disables, focus falls to the current page', async ({ page }) => {
    await load(page, BASIC);
    const next = page.locator('#dt [data-pagination-next]');
    await next.focus();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => document.activeElement.hasAttribute('data-pagination-next'))).toBe(true);
    await page.keyboard.press('Enter'); // page 3 of 3 — Next disables
    const f = await page.evaluate(() => ({
      text: document.activeElement.textContent,
      current: document.activeElement.getAttribute('aria-current'),
    }));
    expect(f).toEqual({ text: '3', current: 'page' });
  });

  test('goToPage without pagination is a no-op (no NaN page)', async ({ page }) => {
    await load(page, `<data-table id="dt"><table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></data-table>`);
    const r = await page.evaluate(() => {
      const dt = document.getElementById('dt');
      dt.goToPage(5);
      return { page: dt.currentPage, total: dt.totalPages };
    });
    expect(r).toEqual({ page: 1, total: 1 });
  });
});

const EXPAND = `
  <data-table id="dt">
    <table data-filterable data-paginate="2">
      <thead><tr><th></th><th data-sort="string">Name</th></tr></thead>
      <tbody>
        <tr data-expandable data-state-expanded><td><button type="button" data-action="toggle-expand" aria-label="Details for Alpha">+</button></td><td>Alpha</td></tr>
        <tr data-expand-content id="alpha-detail"><td colspan="2">Alpha detail</td></tr>
        <tr data-expandable><td><button type="button" data-action="toggle-expand" aria-label="Details for Bravo">+</button></td><td>Bravo</td></tr>
        <tr data-expand-content hidden><td colspan="2">Bravo detail</td></tr>
        <tr><td></td><td>Charlie</td></tr>
        <tr><td></td><td>Delta</td></tr>
      </tbody>
    </table>
  </data-table>`;

test.describe('expansion content rows', () => {
  test('toggle buttons get aria-expanded from authored state', async ({ page }) => {
    await load(page, EXPAND);
    await expect(page.getByLabel('Details for Alpha')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByLabel('Details for Bravo')).toHaveAttribute('aria-expanded', 'false');
  });

  test('detail row hides when its parent is filtered out or paged away', async ({ page }) => {
    await load(page, EXPAND);
    const detail = page.locator('#alpha-detail');
    await expect(detail).toBeVisible();
    await page.evaluate(() => document.getElementById('dt').setFilter('bravo'));
    await expect(detail).toBeHidden();
    await page.evaluate(() => document.getElementById('dt').setFilter(''));
    await expect(detail).toBeVisible();
    await page.evaluate(() => document.getElementById('dt').goToPage(2));
    await expect(detail).toBeHidden();
    // Detail row stays directly after its parent after sorting
    await page.evaluate(() => document.getElementById('dt').goToPage(1));
    await page.locator('#dt th[data-sort] button').click();
    const adjacent = await page.evaluate(() => {
      const alpha = [...document.querySelectorAll('#dt tbody tr')].find((tr) => tr.textContent.includes('Alpha') && tr.hasAttribute('data-expandable'));
      return alpha.nextElementSibling?.id;
    });
    expect(adjacent).toBe('alpha-detail');
  });

  test('refresh() matches setup: detail rows are not counted as data rows', async ({ page }) => {
    await load(page, EXPAND);
    const r = await page.evaluate(() => {
      const dt = document.getElementById('dt');
      const before = { total: dt.totalCount, pages: dt.totalPages };
      const tr = document.createElement('tr');
      tr.innerHTML = '<td></td><td>Echo</td>';
      dt.querySelector('tbody').append(tr);
      dt.refresh();
      return { before, after: { total: dt.totalCount, pages: dt.totalPages } };
    });
    expect(r).toEqual({ before: { total: 4, pages: 2 }, after: { total: 5, pages: 3 } });
  });
});

test.describe('styling', () => {
  test('heatmap cells keep AA text contrast in dark mode', async ({ page }) => {
    await load(page, `
      <data-table id="dt">
        <table>
          <thead><tr><th>Option</th><th data-heatmap="high-good">Score</th></tr></thead>
          <tbody><tr><td>A</td><td>1</td></tr><tr><td>B</td><td>5</td></tr><tr><td>C</td><td>9</td></tr></tbody>
        </table>
      </data-table>`, { scheme: 'dark' });
    const ratios = await page.evaluate(() => {
      const toRgb = (c) => {
        const cv = document.createElement('canvas').getContext('2d');
        cv.fillStyle = c; cv.fillRect(0, 0, 1, 1);
        const [r, g, b] = cv.getImageData(0, 0, 1, 1).data;
        return [r, g, b];
      };
      const lum = ([r, g, b]) => {
        const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      return [...document.querySelectorAll('#dt td[data-heat-level]')].map((td) => {
        const cs = getComputedStyle(td);
        const a = lum(toRgb(cs.color)); const b = lum(toRgb(cs.backgroundColor));
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
    });
    expect(ratios).toHaveLength(3);
    for (const r of ratios) expect(r).toBeGreaterThanOrEqual(4.5);
  });

  test('bulk actions bar only shows for the table that has selected rows', async ({ page }) => {
    const table = (id) => `
      <data-table id="${id}">
        <nav data-bulk-actions aria-label="Bulk actions ${id}"><span data-selected-count>0</span> selected</nav>
        <table>
          <thead><tr><th>Select</th><th>Name</th></tr></thead>
          <tbody><tr data-selectable><td><input type="checkbox" data-action="select-row" aria-label="Select ${id}"></td><td>Row</td></tr></tbody>
        </table>
      </data-table>`;
    await load(page, table('one') + table('two'));
    await page.getByLabel('Select one').check();
    await expect(page.locator('#one [data-bulk-actions]')).toBeVisible();
    await expect(page.locator('#two [data-bulk-actions]')).toBeHidden();
  });
});
