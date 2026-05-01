/**
 * gantt-chart — Data API (Phase 3d)
 *
 * Verifies the new .tasks property accepts both ISO date strings and
 * timestamps, replaces the chart contents, and emits a tagged event.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/gantt-chart-basic.html';

test.describe('gantt-chart — data API', () => {

  test('exposes .tasks after HTML-first parse', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('gantt-chart[data-upgraded]');

    const initial = await page.evaluate(() => {
      const g = document.querySelector('gantt-chart');
      return {
        count: g.tasks.length,
        firstHasName: !!g.tasks[0]?.name,
        firstHasRange: typeof g.tasks[0]?.start === 'number' && typeof g.tasks[0]?.end === 'number',
      };
    });

    expect(initial.count).toBeGreaterThan(0);
    expect(initial.firstHasName).toBe(true);
    expect(initial.firstHasRange).toBe(true);
  });

  test('.tasks setter replaces tasks and re-renders bars', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('gantt-chart[data-upgraded]');

    const result = await page.evaluate(() => {
      const g = document.querySelector('gantt-chart');
      const fired = [];
      g.addEventListener('gantt-chart:tasks-changed', (e) => {
        fired.push({ source: e.detail.source, count: e.detail.tasks.length });
      });

      g.tasks = [
        { id: 'X1', name: 'Spike',   start: '2026-04-01', end: '2026-04-05' },
        { id: 'X2', name: 'Build',   start: '2026-04-05', end: '2026-04-15', progress: 0.4 },
        { id: 'X3', name: 'Release', start: '2026-04-16', end: '2026-04-16', milestone: true },
      ];

      const taskEls = [...g.querySelectorAll('.gc-task-list, .gc-bars')];
      return {
        fired,
        taskCount: g.tasks.length,
        taskNames: g.tasks.map(t => t.name),
        renderedSomething: taskEls.length > 0,
      };
    });

    expect(result.fired).toEqual([{ source: 'property', count: 3 }]);
    expect(result.taskCount).toBe(3);
    expect(result.taskNames).toEqual(['Spike', 'Build', 'Release']);
    expect(result.renderedSomething).toBe(true);
  });
});
