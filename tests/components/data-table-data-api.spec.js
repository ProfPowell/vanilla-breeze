/**
 * data-table — Data API (HTML-first / JS-first dual contract)
 *
 * Verifies the new .rows / .columns property surface added in Phase 3b
 * and the formal preservation guarantee for <tr> nodes whose ids persist
 * across diffs (so selection / expansion / inline-edit state survives).
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/data-table-basic.html';

test.describe('data-table — data API', () => {

  test('seeds .columns from <thead> and exposes the spec', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('data-table[data-upgraded]');

    const cols = await page.evaluate(() => {
      const dt = document.querySelector('data-table');
      return dt.columns.map(c => c.label);
    });

    expect(cols.length).toBeGreaterThan(0);
    expect(cols).toContain('Name');
  });

  test('.rows assignment renders <tr> nodes from data when seeded with ids', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('data-table[data-upgraded]');

    const result = await page.evaluate(() => {
      const dt = document.querySelector('data-table');

      // Tag existing rows with ids so the diff has something to match against
      // (the demo's HTML didn't include data-id; in real usage authors add them).
      const tbody = dt.querySelector('tbody');
      [...tbody.querySelectorAll(':scope > tr:not([data-expand-content])')].forEach((tr, i) => {
        tr.setAttribute('data-id', `seed-${i}`);
      });
      // Re-init so seed picks up the ids.
      dt.removeAttribute('data-upgraded');
      dt.disconnectedCallback();
      dt.connectedCallback();

      // Now assign new rows: keep first two seed ids, drop the rest, add three new.
      const cols = dt.columns;
      const colKeys = cols.map(c => c.key);
      const next = [
        { id: 'seed-0' },
        { id: 'seed-1' },
        { id: 'NEW-1', [colKeys[0]]: 'Alice', [colKeys[1]]: 'a@x', [colKeys[2]]: 'Eng' },
        { id: 'NEW-2', [colKeys[0]]: 'Bob',   [colKeys[1]]: 'b@x', [colKeys[2]]: 'Sales' },
        { id: 'NEW-3', [colKeys[0]]: 'Cal',   [colKeys[1]]: 'c@x', [colKeys[2]]: 'Eng' },
      ];

      // Capture existing nodes for preservation check
      const before = new Map();
      for (const tr of tbody.querySelectorAll('tr[data-id]')) {
        before.set(tr.getAttribute('data-id'), tr);
      }

      // Listen for the change event
      let captured = null;
      dt.addEventListener('data-table:rows-changed', (e) => { captured = e.detail; });

      dt.rows = next;

      // After diff: seed-0 / seed-1 should be the same node refs; NEW-* should be present
      const after = new Map();
      for (const tr of tbody.querySelectorAll('tr[data-id]')) {
        after.set(tr.getAttribute('data-id'), tr);
      }

      return {
        eventSource: captured?.source,
        eventCount: captured?.rows?.length,
        seed0Preserved: after.get('seed-0') === before.get('seed-0'),
        seed1Preserved: after.get('seed-1') === before.get('seed-1'),
        newRendered: ['NEW-1', 'NEW-2', 'NEW-3'].every(id => after.has(id)),
        allIds: [...after.keys()],
      };
    });

    expect(result.eventSource).toBe('api');
    expect(result.eventCount).toBe(5);
    expect(result.seed0Preserved).toBe(true);
    expect(result.seed1Preserved).toBe(true);
    expect(result.newRendered).toBe(true);
    expect(result.allIds).toEqual(['seed-0', 'seed-1', 'NEW-1', 'NEW-2', 'NEW-3']);
  });

  test('custom renderRow function is honored', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('data-table[data-upgraded]');

    const customClass = await page.evaluate(() => {
      const dt = document.querySelector('data-table');
      dt.renderRow = (row) => {
        const tr = document.createElement('tr');
        tr.className = 'custom-renderer';
        tr.innerHTML = `<td colspan="3">${row.label}</td>`;
        return tr;
      };
      dt.rows = [{ id: 'X', label: 'Custom row' }];
      return dt.querySelector('tr.custom-renderer')?.textContent;
    });

    expect(customClass).toBe('Custom row');
  });
});
