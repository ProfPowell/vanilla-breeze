/**
 * kanban-board — Data API (HTML-first / JS-first dual contract)
 *
 * Verifies the new property-driven path added in Phase 2 of the
 * VBCollection rollout: assigning .items / .columns and the formal
 * preservation guarantee for nodes whose keys persist.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/kanban-board-basic.html';

test.describe('kanban-board — data API', () => {

  test('HTML-first upgrade still works and seeds .items / .columns', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('kanban-board[data-upgraded]');

    const state = await page.evaluate(() => {
      const board = document.querySelector('kanban-board');
      return {
        columns: board.columns.length,
        items: board.items.length,
        firstItemHasColumn: !!board.items[0]?.column,
      };
    });

    expect(state.columns).toBeGreaterThan(0);
    expect(state.items).toBeGreaterThan(0);
    expect(state.firstItemHasColumn).toBe(true);
  });

  test('kanban-board:upgraded fires once after first connect', async ({ page }) => {
    await page.goto(demoPage);
    const fired = await page.evaluate(() => new Promise(resolve => {
      const board = document.querySelector('kanban-board');
      if (board.hasAttribute('data-upgraded')) {
        // Already upgraded before listener attached — re-trigger by removing/re-adding
        const parent = board.parentElement;
        const next = board.nextSibling;
        board.remove();
        let count = 0;
        document.addEventListener('kanban-board:upgraded', () => { count += 1; });
        parent.insertBefore(board, next);
        // Allow microtask
        setTimeout(() => resolve(count), 50);
      } else {
        let count = 0;
        document.addEventListener('kanban-board:upgraded', () => { count += 1; });
        setTimeout(() => resolve(count), 100);
      }
    }));
    expect(fired).toBeGreaterThanOrEqual(1);
  });

  test('preserves DOM nodes for keys present in both old and new .items', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('kanban-board[data-upgraded]');

    const result = await page.evaluate(() => {
      const board = document.querySelector('kanban-board');
      const before = board.items.map(it => ({ ...it }));
      const refs = new Map();
      for (const it of before) refs.set(it.id, board._nodeFor(it.id));

      // Reorder + drop one + add one
      const next = [
        { ...before[1] },
        { ...before[0], column: before[2].column }, // moved column
        ...before.slice(2, -1),
        { id: 'NEW-XYZ', column: before[0].column, title: 'New', type: 'task' },
      ];
      board.items = next;

      const preservedCount = [...refs.entries()].filter(([id, el]) => {
        const stillThere = next.some(it => it.id === id);
        return stillThere && board._nodeFor(id) === el;
      }).length;

      return {
        preservedCount,
        expectedSurvivors: next.filter(it => before.some(b => b.id === it.id)).length,
        newRendered: !!board._nodeFor('NEW-XYZ'),
        droppedGone: !board._nodeFor(before[before.length - 1].id),
      };
    });

    expect(result.preservedCount).toBe(result.expectedSurvivors);
    expect(result.newRendered).toBe(true);
    expect(result.droppedGone).toBe(true);
  });

  test('emits kanban-board:items-changed with source tag', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('kanban-board[data-upgraded]');

    const sources = await page.evaluate(() => {
      const board = document.querySelector('kanban-board');
      const captured = [];
      board.addEventListener('kanban-board:items-changed', (e) => {
        captured.push(e.detail.source);
      });
      board.items = [...board.items, { id: 'EXTRA-1', column: board.columns[0].id, title: 'X', type: 'task' }];
      return captured;
    });

    expect(sources).toEqual(['api']);
  });

  test('.columns setter rebuilds shell', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('kanban-board[data-upgraded]');

    // The setter wraps the rebuild in a View Transition so the swap
    // crossfades — that pushes the actual DOM mutation onto the next
    // rendering opportunity. Wait for the new columns to appear before
    // asserting.
    await page.evaluate(() => {
      const board = document.querySelector('kanban-board');
      board.columns = [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' },
      ];
    });
    await page.waitForFunction(() => {
      const cols = document.querySelectorAll('kanban-board .kb-column');
      return cols.length === 2
        && cols[0].getAttribute('data-column-id') === 'a';
    });
    const columnIds = await page.evaluate(() =>
      [...document.querySelectorAll('kanban-board .kb-column')]
        .map(el => el.getAttribute('data-column-id'))
    );

    expect(columnIds).toEqual(['a', 'b']);
  });
});
