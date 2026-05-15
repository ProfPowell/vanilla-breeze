/**
 * data-sortable behavior tests. Pure logic (compareBy, sortIndices,
 * cycleDirection, parseKey) is covered in tests/unit/data-sortable.test.js.
 */

import { test, expect } from 'playwright/test';

const demo = '/docs/snippets/demos/data-sortable-basic.html';

test.describe('data-sortable — table mode', () => {
  test('clicking a header cycles asc → desc → none and reorders rows', async ({ page }) => {
    await page.goto(demo);
    const table = page.locator('table[data-sortable]');
    const nameHeader = table.locator('th[data-sort="name"]');
    const rows = table.locator('tbody tr');

    // First click → asc by name. First row should be "Alice".
    await nameHeader.click();
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(rows.first().locator('td').first()).toHaveText('Alice');

    // Second click → desc. First row should be "Eve".
    await nameHeader.click();
    await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    await expect(rows.first().locator('td').first()).toHaveText('Eve');

    // Third click → none. aria-sort goes back to "none".
    await nameHeader.click();
    await expect(nameHeader).toHaveAttribute('aria-sort', 'none');
  });

  test('numeric column sorts as numbers, not strings', async ({ page }) => {
    await page.goto(demo);
    const table = page.locator('table[data-sortable]');
    const scoreHeader = table.locator('th[data-sort="score"]');
    const rows = table.locator('tbody tr');

    await scoreHeader.click();   // asc
    const firstScore = await rows.first().locator('td').nth(2).textContent();
    expect(parseInt(firstScore || '0', 10)).toBe(74);   // Charlie's score

    await scoreHeader.click();   // desc
    const topScore = await rows.first().locator('td').nth(2).textContent();
    expect(parseInt(topScore || '0', 10)).toBe(95);     // Diana's score
  });

  test('date column uses <time datetime> not text content', async ({ page }) => {
    await page.goto(demo);
    const table = page.locator('table[data-sortable]');
    const joinedHeader = table.locator('th[data-sort="joined"]');
    const rows = table.locator('tbody tr');

    await joinedHeader.click();   // asc — earliest first → Diana (2025-07-22)
    await expect(rows.first().locator('td').first()).toHaveText('Diana');
  });

  test('keyboard activation: Enter triggers sort', async ({ page }) => {
    await page.goto(demo);
    const nameHeader = page.locator('table[data-sortable] th[data-sort="name"]');
    await nameHeader.focus();
    await page.keyboard.press('Enter');
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });
});

test.describe('data-sortable — list mode (external select)', () => {
  test('selecting an option reorders the list', async ({ page }) => {
    await page.goto(demo);
    const list = page.locator('#projects');
    const select = page.locator('select[data-sort-target="#projects"]');

    await select.selectOption('name');
    await expect(list.locator('li').first()).toContainText('Aurora');

    await select.selectOption('-name');
    await expect(list.locator('li').first()).toContainText('Delta');
  });

  test('numeric option sorts numerically', async ({ page }) => {
    await page.goto(demo);
    const list = page.locator('#projects');
    const select = page.locator('select[data-sort-target="#projects"]');
    await select.selectOption('-priority');
    // Highest priority first — Aurora(3), Delta(3), Bonsai(2), Comet(1)
    await expect(list.locator('li').nth(0)).toContainText(/Aurora|Delta/);
    await expect(list.locator('li').nth(1)).toContainText(/Aurora|Delta/);
    await expect(list.locator('li').nth(3)).toContainText('Comet');
  });

  test('emits sort:change with detail', async ({ page }) => {
    await page.goto(demo);
    const detail = page.evaluate(() => new Promise((resolve) => {
      const list = document.querySelector('#projects');
      list.addEventListener('sort:change', (e) => resolve(e.detail), { once: true });
    }));
    await page.locator('select[data-sort-target="#projects"]').selectOption('name');
    expect(await detail).toMatchObject({ key: 'name', direction: 'asc' });
  });
});

test.describe('data-sortable — composes with data-paged', () => {
  test('sorting a paged list re-paginates from page 1', async ({ page }) => {
    await page.goto(demo);
    const list = page.locator('#paged-list');
    const nav  = list.locator('xpath=following-sibling::nav[@data-paged-nav][1]');

    // Navigate to page 2 first.
    await nav.locator('button[data-paged-action="page"][data-paged-target="2"]').click();
    await expect(nav.locator('button[aria-current="page"]')).toHaveText('2');

    // Now sort by name — should land back on page 1 with new order.
    await page.locator('select[data-sort-target="#paged-list"]').selectOption('name');
    await expect(nav.locator('button[aria-current="page"]')).toHaveText('1');

    // Page 1 (3 visible items) should start with Apple, Banana, Cherry.
    await expect(list.locator('li').nth(0)).toContainText('Apple');
    await expect(list.locator('li').nth(1)).toContainText('Banana');
    await expect(list.locator('li').nth(2)).toContainText('Cherry');
    await expect(list.locator('li').nth(3)).toBeHidden();
  });
});
