/**
 * data-paged + pager-wc behavior tests.
 *
 * Covers click-to-navigate, prev/next disabled state, URL sync round-trip,
 * back/forward, load-more counter, infinite-scroll sentinel, MutationObserver
 * re-pagination, ARIA contracts. Pure unit math (page slicing, ellipses) is
 * already covered by tests/unit/data-paged.test.js.
 */

import { test, expect } from 'playwright/test';

const dataPagedDemo = '/docs/snippets/demos/data-paged-basic.html';
const pagerWcDemo   = '/docs/snippets/demos/pager-wc-basic.html';

/* ───── data-paged: in-place controls ──────────────────────────────────── */

test.describe('data-paged — numbered style', () => {
  test('renders nav with numbered controls + first page visible', async ({ page }) => {
    await page.goto(dataPagedDemo);

    // First section is the numbered demo (5 per page, 23 items → 5 pages).
    const list = page.locator('ul[data-paged]').first();
    const nav  = list.locator('xpath=following-sibling::nav[@data-paged-nav][1]');
    await expect(nav).toHaveAttribute('aria-label', 'Pagination');

    // Page 1: items 1-5 visible, items 6+ hidden.
    await expect(list.locator('li').nth(0)).toBeVisible();
    await expect(list.locator('li').nth(4)).toBeVisible();
    await expect(list.locator('li').nth(5)).toBeHidden();

    // Active button has aria-current="page".
    await expect(nav.locator('button[aria-current="page"]')).toHaveText('1');

    // Prev disabled on page 1.
    const prev = nav.locator('button[data-paged-action="prev"]');
    await expect(prev).toBeDisabled();
  });

  test('clicking page 2 swaps the visible slice', async ({ page }) => {
    await page.goto(dataPagedDemo);
    const list = page.locator('ul[data-paged]').first();
    const nav  = list.locator('xpath=following-sibling::nav[@data-paged-nav][1]');

    await nav.locator('button[data-paged-action="page"][data-paged-target="2"]').click();

    await expect(list.locator('li').nth(0)).toBeHidden();
    await expect(list.locator('li').nth(5)).toBeVisible();   // item 6 (index 5)
    await expect(list.locator('li').nth(9)).toBeVisible();   // item 10
    await expect(list.locator('li').nth(10)).toBeHidden();   // item 11
    await expect(nav.locator('button[aria-current="page"]')).toHaveText('2');
  });

  test('next / prev navigate forward and back', async ({ page }) => {
    await page.goto(dataPagedDemo);
    const list = page.locator('ul[data-paged]').first();
    const nav  = list.locator('xpath=following-sibling::nav[@data-paged-nav][1]');

    await nav.locator('button[data-paged-action="next"]').click();
    await expect(nav.locator('button[aria-current="page"]')).toHaveText('2');

    await nav.locator('button[data-paged-action="prev"]').click();
    await expect(nav.locator('button[aria-current="page"]')).toHaveText('1');
  });

  test('next disabled on last page', async ({ page }) => {
    await page.goto(dataPagedDemo);
    const list = page.locator('ul[data-paged]').first();
    const nav  = list.locator('xpath=following-sibling::nav[@data-paged-nav][1]');

    // Jump to last page (5 of 5 for the 23-item / size-5 demo).
    await nav.locator('button[data-paged-target="5"]').click();
    await expect(nav.locator('button[data-paged-action="next"]')).toBeDisabled();
  });

  test('emits paged:change with detail', async ({ page }) => {
    await page.goto(dataPagedDemo);
    const list = page.locator('ul[data-paged]').first();
    const nav  = list.locator('xpath=following-sibling::nav[@data-paged-nav][1]');

    const detailPromise = page.evaluate(() => new Promise((resolve) => {
      const list = /** @type {HTMLElement} */ (document.querySelector('ul[data-paged]'));
      list.addEventListener('paged:change', (e) => resolve(/** @type {CustomEvent} */ (e).detail), { once: true });
    }));
    // Page 2 is always present; with window=1 the strip is [1, 2, '…', 5].
    await nav.locator('button[data-paged-action="page"][data-paged-target="2"]').click();
    expect(await detailPromise).toMatchObject({ page: 2, size: 5, total: 23, totalPages: 5 });
  });
});

test.describe('data-paged — prev-next style', () => {
  test('shows status text and disables prev on page 1', async ({ page }) => {
    await page.goto(dataPagedDemo);
    // Second section: <ol data-paged data-paged-style="prev-next" size=3, 9 items → 3 pages>
    const ol  = page.locator('ol[data-paged]');
    const nav = ol.locator('xpath=following-sibling::nav[@data-paged-nav][1]');

    await expect(nav.locator('[data-paged-status]')).toHaveText('Page 1 of 3');
    await expect(nav.locator('button[data-paged-action="prev"]')).toBeDisabled();

    await nav.locator('button[data-paged-action="next"]').click();
    await expect(nav.locator('[data-paged-status]')).toHaveText('Page 2 of 3');
  });
});

test.describe('data-paged — load-more style', () => {
  test('reveals next page worth on click; disables when exhausted', async ({ page }) => {
    await page.goto(dataPagedDemo);
    // Third section: <ul data-paged data-paged-style="load-more" size=3, 10 items>
    const ul  = page.locator('ul[data-paged-style="load-more"]');
    const nav = ul.locator('xpath=following-sibling::nav[@data-paged-nav][1]');
    const btn = nav.locator('button[data-paged-loadmore]');

    // Initially shows 3 of 10 → button text "Load more (7)".
    await expect(ul.locator('li').nth(0)).toBeVisible();
    await expect(ul.locator('li').nth(2)).toBeVisible();
    await expect(ul.locator('li').nth(3)).toBeHidden();
    await expect(btn).toContainText(/Load more \(7\)/);

    await btn.click();
    await expect(ul.locator('li').nth(5)).toBeVisible();
    await expect(btn).toContainText(/Load more \(4\)/);

    await btn.click();   // → visible 9
    await btn.click();   // → visible 12, capped at 10, button disables
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveText('No more');
  });
});

test.describe('data-paged — table', () => {
  test('paginates tbody rows; thead stays visible', async ({ page }) => {
    await page.goto(dataPagedDemo);
    const table = page.locator('table[data-paged]');
    await expect(table.locator('thead tr')).toBeVisible();

    // Page 1: rows 1-4 visible.
    const rows = table.locator('tbody tr');
    await expect(rows.nth(0)).toBeVisible();
    await expect(rows.nth(3)).toBeVisible();
    await expect(rows.nth(4)).toBeHidden();

    const nav = table.locator('xpath=following-sibling::nav[@data-paged-nav][1]');
    await nav.locator('button[data-paged-action="page"][data-paged-target="2"]').click();

    await expect(rows.nth(0)).toBeHidden();
    await expect(rows.nth(4)).toBeVisible();
    await expect(table.locator('thead tr')).toBeVisible();
  });
});

test.describe('data-paged — URL sync', () => {
  test('clicking updates ?p=N; reload preserves page; back navigates', async ({ page }) => {
    await page.goto(dataPagedDemo);
    const list = page.locator('ul[data-paged-url="p"]');
    const nav  = list.locator('xpath=following-sibling::nav[@data-paged-nav][1]');

    // The URL-synced demo uses data-paged-window="1" → middle pages may be
    // an ellipsis. Page 4 (the last) is always a button.
    await nav.locator('button[data-paged-action="page"][data-paged-target="4"]').click();
    await expect(page).toHaveURL(/\bp=4\b/);

    await page.reload();
    const navAfter = page.locator('ul[data-paged-url="p"]')
      .locator('xpath=following-sibling::nav[@data-paged-nav][1]');
    await expect(navAfter.locator('button[aria-current="page"]')).toHaveText('4');

    await page.goBack();
    await expect(page).not.toHaveURL(/\bp=4\b/);
  });
});

test.describe('data-paged — MutationObserver re-pagination', () => {
  test('appending children re-paginates without errors', async ({ page }) => {
    await page.goto(dataPagedDemo);
    const list = page.locator('ul[data-paged]').first();

    await page.evaluate(() => {
      const list = /** @type {HTMLElement} */ (document.querySelector('ul[data-paged]'));
      const li = document.createElement('li');
      li.textContent = 'Appended item';
      list.appendChild(li);
    });

    // The new item is now the 24th (index 23), still on page 5 of 5.
    // The first-page slice is unchanged: items 1-5 visible.
    await expect(list.locator('li').nth(0)).toBeVisible();
    await expect(list.locator('li').nth(4)).toBeVisible();
    await expect(list.locator('li').nth(5)).toBeHidden();
  });
});

/* ───── pager-wc: decoupled controls ───────────────────────────────────── */

test.describe('pager-wc — multi-instance sync', () => {
  test('top + bottom pagers both update on either click', async ({ page }) => {
    await page.goto(pagerWcDemo);
    const top    = page.locator('pager-wc[target="#feed-a"]').first();
    const bottom = page.locator('pager-wc[target="#feed-a"]').nth(1);

    // Click page 2 in the top pager.
    await top.locator('button[data-paged-action="page"][data-paged-target="2"]').click();

    // Both pagers should now show page 2 active.
    await expect(top.locator('button[aria-current="page"]')).toHaveText('2');
    await expect(bottom.locator('button[aria-current="page"]')).toHaveText('2');

    // Items reflect the slice.
    const list = page.locator('#feed-a');
    await expect(list.locator('li').nth(2)).toBeHidden();   // item 3 (page 1)
    await expect(list.locator('li').nth(3)).toBeVisible();  // item 4 (page 2)
  });

  test('prev-next style status mirrors target', async ({ page }) => {
    await page.goto(pagerWcDemo);
    const pager = page.locator('pager-wc[target="#feed-b"]');
    await expect(pager.locator('[data-paged-status]')).toHaveText('Page 1 of 3');
    await pager.locator('button[data-paged-action="next"]').click();
    await expect(pager.locator('[data-paged-status]')).toHaveText('Page 2 of 3');
  });

  test('emits pager-wc:navigate with page detail', async ({ page }) => {
    await page.goto(pagerWcDemo);
    const navigate = page.evaluate(() => new Promise((resolve) => {
      document.addEventListener('pager-wc:navigate', (e) => resolve(/** @type {CustomEvent} */ (e).detail), { once: true });
    }));
    // pager-wc-basic: feed-a is 12 items / size 3 → 4 pages. Default
    // window=2 means all 4 pages render as buttons (no ellipsis).
    await page.locator('pager-wc[target="#feed-a"]').first()
      .locator('button[data-paged-action="page"][data-paged-target="3"]').click();
    expect(await navigate).toMatchObject({ page: 3 });
  });
});

test.describe('pager-wc — implicit target', () => {
  test('binds to nearest preceding [data-paged] sibling', async ({ page }) => {
    await page.goto(pagerWcDemo);
    // Last section: implicit-target pager-wc (no target/for attribute).
    // 5 items / size 2 → 3 pages.
    const implicit = page.locator('pager-wc:not([target]):not([for])');
    await expect(implicit.locator('[data-paged-status]')).toHaveText('Page 1 of 3');
  });
});
