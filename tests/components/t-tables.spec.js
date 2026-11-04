/**
 * Native tables — T review fixes (table, thead, tbody, tfoot, tr, th, td,
 * data-sortable, card mode, scroll region).
 *
 * Covers: data-sortable keeps the columnheader role and injects a real
 * <button data-sort-button>; data-sort-value / data-value overrides; both
 * selected attribute forms; non-colour state bar (+ RTL flip); disabled is a
 * muted colour, not opacity; stripes skip hidden rows; tfoot th; row headers
 * read as cells; sticky header honours --sticky-offset; frozen cells carry the
 * row tint; card mode keeps semantics and derives labels; the scroll region
 * is keyboard-scrollable; forced colors; print breaks.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__t-tables-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      <script type="module">
        import '/src/utils/data-sortable-init.js';
        import '/src/native-elements/table/card-init.js';
        window.__ready = true;
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => /** @type {any} */ (window).__ready);
}

const SORTABLE = `
  <table data-sortable id="t">
    <caption>People</caption>
    <thead><tr>
      <th scope="col" data-sort="name">Name</th>
      <th scope="col" data-sort="price" data-sort-type="number">Price</th>
    </tr></thead>
    <tbody>
      <tr><td>Bea</td><td data-sort-value="20">$20.00</td></tr>
      <tr><td>Al</td><td data-value="5">five dollars</td></tr>
      <tr><td>Cy</td><td data-sort-value="100">$100.00</td></tr>
    </tbody>
  </table>`;

test.describe('data-sortable', () => {
  test('th keeps the columnheader role and gets a real sort button', async ({ page }) => {
    await load(page, SORTABLE);
    const th = page.locator('th[data-sort="name"]');
    await expect(th).not.toHaveAttribute('role', /.+/);
    await expect(th).not.toHaveAttribute('tabindex', /.+/);
    await expect(th).not.toHaveAttribute('style', /.+/);
    await expect(th).toHaveAttribute('aria-sort', 'none');
    await expect(th.locator('> button[data-sort-button][type="button"]')).toHaveText('Name');
    await expect(page.getByRole('columnheader', { name: 'Name' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Name' })).toHaveCount(1);
  });

  test('Enter on the button sorts; aria-sort stays on the th', async ({ page }) => {
    await load(page, SORTABLE);
    await page.getByRole('button', { name: 'Name' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('th[data-sort="name"]')).toHaveAttribute('aria-sort', 'ascending');
    await expect(page.locator('#t tbody tr').first().locator('td').first()).toHaveText('Al');
  });

  test('clicking the th padding sorts too', async ({ page }) => {
    await load(page, SORTABLE);
    const th = page.locator('th[data-sort="name"]');
    await th.click({ position: { x: 2, y: 2 } });
    await expect(th).toHaveAttribute('aria-sort', 'ascending');
  });

  test('data-sort-value and data-value both override cell text', async ({ page }) => {
    await load(page, SORTABLE);
    await page.getByRole('button', { name: 'Price' }).click();
    const names = await page.locator('#t tbody tr td:first-child').allTextContents();
    expect(names).toEqual(['Al', 'Bea', 'Cy']);
  });

  test('re-scan does not double-wrap', async ({ page }) => {
    await load(page, SORTABLE);
    const count = await page.evaluate(async () => {
      const { initDataSortable } = await import('/src/utils/data-sortable-init.js');
      initDataSortable(document.getElementById('t'));
      return document.querySelectorAll('#t button[data-sort-button]').length;
    });
    expect(count).toBe(2);
  });
});

const STATES = `
  <table id="s">
    <caption>States</caption>
    <thead><tr><th scope="col">Name</th><th scope="col">Note</th></tr></thead>
    <tbody>
      <tr id="plain"><th scope="row">Plain</th><td>x</td></tr>
      <tr id="sel" data-selected><td>Sel</td><td>x</td></tr>
      <tr id="state-sel" data-state-selected><td>State sel</td><td>x</td></tr>
      <tr id="hi" data-highlight><td>Hi</td><td>x</td></tr>
      <tr id="dis" data-disabled inert><td>Dis</td><td><a href="#x">link</a></td></tr>
    </tbody>
    <tfoot><tr><th scope="row" id="foot-th">Total</th><td id="foot-td">1</td></tr></tfoot>
  </table>`;

test.describe('row states and cells', () => {
  test('data-selected and data-state-selected paint the same tint and bar', async ({ page }) => {
    await load(page, STATES);
    const read = (id) => page.evaluate((i) => {
      const tr = document.getElementById(i);
      return {
        bg: getComputedStyle(tr).backgroundColor,
        bar: getComputedStyle(tr.firstElementChild).boxShadow,
      };
    }, id);
    const a = await read('sel');
    const b = await read('state-sel');
    expect(a).toEqual(b);
    expect(a.bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(a.bar).toContain('inset');
    expect(a.bar).toMatch(/ 4px 0px 0px/);
    const plain = await read('plain');
    expect(plain.bar).not.toContain('4px 0px 0px');
  });

  test('state bar sits on the inline-start edge in RTL', async ({ page }) => {
    await load(page, STATES, { dir: 'rtl' });
    const bar = await page.evaluate(() => getComputedStyle(document.querySelector('#sel > :first-child')).boxShadow);
    expect(bar).toMatch(/-4px 0px 0px/);
  });

  test('disabled rows are muted colour at full opacity', async ({ page }) => {
    await load(page, STATES);
    const r = await page.evaluate(() => {
      const tr = document.getElementById('dis');
      const muted = getComputedStyle(document.body).getPropertyValue('--color-text-muted');
      const probe = document.createElement('span');
      probe.style.color = muted;
      document.body.append(probe);
      return { opacity: getComputedStyle(tr).opacity, color: getComputedStyle(tr).color, muted: getComputedStyle(probe).color };
    });
    expect(r.opacity).toBe('1');
    expect(r.color).toBe(r.muted);
    // inert takes the link out of the tab order
    await expect(page.locator('#dis a')).not.toBeFocused();
    const focusable = await page.evaluate(() => { const a = document.querySelector('#dis a'); a.focus(); return document.activeElement === a; });
    expect(focusable).toBe(false);
  });

  test('tfoot th matches tfoot td', async ({ page }) => {
    await load(page, STATES);
    const r = await page.evaluate(() => {
      const s = (id) => { const c = getComputedStyle(document.getElementById(id)); return { bg: c.backgroundColor, top: c.borderTopWidth, bottom: c.borderBottomStyle, weight: c.fontWeight }; };
      return { th: s('foot-th'), td: s('foot-td') };
    });
    expect(r.th).toEqual(r.td);
    expect(r.th.bottom).toBe('none');
  });

  test('row headers read as cells, column headers keep the band', async ({ page }) => {
    await load(page, STATES);
    const r = await page.evaluate(() => ({
      rowTh: getComputedStyle(document.querySelector('#plain > th')).backgroundColor,
      colTh: getComputedStyle(document.querySelector('thead th')).backgroundColor,
      rowThBorder: getComputedStyle(document.querySelector('#plain > th')).borderBottomWidth,
      tdBorder: getComputedStyle(document.querySelector('#plain > td')).borderBottomWidth,
    }));
    expect(r.rowTh).toBe('rgba(0, 0, 0, 0)');
    expect(r.colTh).not.toBe('rgba(0, 0, 0, 0)');
    expect(r.rowThBorder).toBe(r.tdBorder);
  });
});

test('stripes skip hidden and detail rows', async ({ page }) => {
  await load(page, `
    <table class="striped"><caption>Stripes</caption>
      <thead><tr><th scope="col">N</th></tr></thead>
      <tbody>
        <tr><td>1</td></tr>
        <tr data-state-hidden><td>hidden</td></tr>
        <tr><td>2</td></tr>
        <tr data-expand-content hidden><td>detail</td></tr>
        <tr><td>3</td></tr>
        <tr><td>4</td></tr>
      </tbody>
    </table>`);
  const bgs = await page.evaluate(() => [...document.querySelectorAll('tbody tr')]
    .filter((tr) => getComputedStyle(tr).display !== 'none')
    .map((tr) => getComputedStyle(tr).backgroundColor));
  expect(bgs).toHaveLength(4);
  expect(bgs[0]).not.toBe('rgba(0, 0, 0, 0)');
  expect(bgs[1]).toBe('rgba(0, 0, 0, 0)');
  expect(bgs[2]).toBe(bgs[0]);
  expect(bgs[3]).toBe('rgba(0, 0, 0, 0)');
});

test.describe('sticky', () => {
  test('sticky header honours --sticky-offset', async ({ page }) => {
    await load(page, `<table data-sticky="header"><caption>S</caption>
      <thead><tr><th scope="col">A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>`,
    { head: '<style>:root { --sticky-offset: 48px; }</style>' });
    const top = await page.evaluate(() => getComputedStyle(document.querySelector('thead th')).insetBlockStart);
    expect(top).toBe('48px');
  });

  test('inside a scroll region the header pins at 0', async ({ page }) => {
    await load(page, `<section data-table-scroll tabindex="0" aria-labelledby="c"><table data-sticky="header"><caption id="c">S</caption>
      <thead><tr><th scope="col">A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></section>`,
    { head: '<style>:root { --sticky-offset: 48px; }</style>' });
    const top = await page.evaluate(() => getComputedStyle(document.querySelector('thead th')).insetBlockStart);
    expect(top).toBe('0px');
  });

  test('frozen cells carry the row tint over an opaque surface', async ({ page }) => {
    await load(page, `<table data-sticky="column"><caption>S</caption>
      <thead><tr><th scope="col">A</th><th scope="col">B</th></tr></thead>
      <tbody><tr data-selected><td id="c">1</td><td>2</td></tr></tbody></table>`);
    const r = await page.evaluate(() => {
      const c = getComputedStyle(document.getElementById('c'));
      return { image: c.backgroundImage, color: c.backgroundColor, shadow: c.boxShadow };
    });
    expect(r.image).toContain('linear-gradient');
    expect(r.image).not.toContain('rgba(0, 0, 0, 0)');
    expect(r.color).not.toBe('rgba(0, 0, 0, 0)');
    // state bar and frozen edge compose
    expect(r.shadow).toMatch(/inset/);
    expect(r.shadow).toMatch(/ 1px 0px 0px/);
  });

  test('two-column frozen edge flips in RTL', async ({ page }) => {
    const html = `<table data-sticky-column="2"><caption>S</caption>
      <thead><tr><th scope="col">A</th><th scope="col">B</th><th scope="col">C</th></tr></thead>
      <tbody><tr><td>1</td><td id="c2">2</td><td>3</td></tr></tbody></table>`;
    await load(page, html, { dir: 'rtl' });
    const shadow = await page.evaluate(() => getComputedStyle(document.getElementById('c2')).boxShadow);
    expect(shadow).toMatch(/-1px 0px 0px/);
  });
});

test.describe('scroll region', () => {
  test('is focusable, named, and scrolls from the keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 600 });
    await load(page, `<section data-table-scroll tabindex="0" aria-labelledby="cap">
      <table><caption id="cap">Wide</caption>
        <thead><tr>${'<th scope="col">Column heading</th>'.repeat(10)}</tr></thead>
        <tbody><tr>${'<td>value value</td>'.repeat(10)}</tr></tbody></table></section>`,
    { head: '<style>[data-table-scroll] table { min-inline-size: 80rem; }</style>' });
    await expect(page.getByRole('region', { name: 'Wide' })).toHaveCount(1);
    const region = page.locator('[data-table-scroll]');
    await region.focus();
    await expect(region).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    // the table itself is not the scroller
    const tableDisplay = await page.evaluate(() => getComputedStyle(document.querySelector('table')).display);
    expect(tableDisplay).toBe('table');
  });
});

const CARD = `
  <section id="narrow">
    <table data-responsive="card" id="card">
      <caption>Orders</caption>
      <thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Total</th></tr></thead>
      <tbody>
        <tr><th scope="row">#1</th><td>Alice</td><td data-label="Amount">$5</td></tr>
      </tbody>
      <tfoot><tr><th scope="row">Sum</th><td></td><td>$5</td></tr></tfoot>
    </table>
  </section>`;

test.describe('card mode', () => {
  test('keeps table semantics and derives labels from headers', async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 700 });
    await load(page, CARD, { head: '<style>#narrow { container-type: inline-size; inline-size: 360px; }</style>' });
    const r = await page.evaluate(() => {
      const t = document.getElementById('card');
      return {
        tableRole: t.getAttribute('role'),
        groups: [...t.querySelectorAll('thead, tbody, tfoot')].map((g) => g.getAttribute('role')),
        rowRoles: [...t.querySelectorAll('tr')].map((r) => r.getAttribute('role')),
        headRoles: [...t.querySelectorAll('thead th')].map((c) => c.getAttribute('role')),
        rowHeader: t.querySelector('tbody th').getAttribute('role'),
        labels: [...t.querySelectorAll('tbody tr > *')].map((c) => c.getAttribute('data-label')),
        theadDisplay: getComputedStyle(t.tHead).display,
        tbodyDisplay: getComputedStyle(t.tBodies[0]).display,
        footDisplay: getComputedStyle(t.tFoot.rows[0]).display,
      };
    });
    expect(r.tableRole).toBe('table');
    expect(r.groups).toEqual(['rowgroup', 'rowgroup', 'rowgroup']);
    expect(r.rowRoles).toEqual(['row', 'row', 'row']);
    expect(r.headRoles).toEqual(['columnheader', 'columnheader', 'columnheader']);
    expect(r.rowHeader).toBe('rowheader');
    // authored label wins; missing labels come from the column header
    expect(r.labels).toEqual(['Order', 'Customer', 'Amount']);
    expect(r.theadDisplay).not.toBe('none');
    expect(r.tbodyDisplay).toBe('block');
    expect(r.footDisplay).toBe('block');
    await expect(page.getByRole('columnheader', { name: 'Customer' })).toHaveCount(1);
    await expect(page.getByRole('cell', { name: 'Alice' })).toHaveCount(1);
  });

  test('rows added later are decorated', async ({ page }) => {
    await load(page, CARD);
    await page.evaluate(() => {
      const tr = document.createElement('tr');
      tr.innerHTML = '<th scope="row">#2</th><td>Bob</td><td>$7</td>';
      document.querySelector('#card tbody').append(tr);
    });
    await expect(page.locator('#card tbody tr').nth(1)).toHaveAttribute('role', 'row');
    await expect(page.locator('#card tbody tr').nth(1).locator('td').first()).toHaveAttribute('data-label', 'Customer');
  });
});

test('forced colors: selected cells use Highlight and a real border bar', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, STATES);
  const r = await page.evaluate(() => {
    const c = getComputedStyle(document.querySelector('#sel > :first-child'));
    return { adjust: c.forcedColorAdjust, border: c.borderInlineStartWidth, style: c.borderInlineStartStyle };
  });
  expect(r.adjust).toBe('none');
  expect(r.style).toBe('solid');
  expect(r.border).toBe('4px');
});

test('print: tables may break across pages, rows may not', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await load(page, STATES);
  const r = await page.evaluate(() => ({
    table: getComputedStyle(document.querySelector('table')).breakInside,
    tr: getComputedStyle(document.querySelector('tbody tr')).breakInside,
    adjust: getComputedStyle(document.getElementById('sel')).printColorAdjust,
  }));
  expect(r.table).toBe('auto');
  expect(r.tr).toBe('avoid');
  expect(r.adjust).toBe('exact');
});
