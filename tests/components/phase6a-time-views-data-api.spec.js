/**
 * Phase 6a — day-view + week-view dual-mode contracts.
 */

import { test, expect } from 'playwright/test';

test('day-view: .events setter rebuilds calendar-event children', async ({ page }) => {
  await page.goto('/docs/examples/demos/day-view-basic.html');
  await page.waitForFunction(() => document.querySelector('day-view[data-upgraded]'));

  const result = await page.evaluate(() => {
    const dv = document.querySelector('day-view');
    const fired = [];
    dv.addEventListener('day-view:events-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.events.length });
    });
    dv.events = [
      { time: '09:00', text: 'Standup',  category: 'meeting' },
      { time: '14:00', text: 'Review',   category: 'meeting', duration: '60' },
      { time: '16:30', text: 'Deep work' },
    ];
    return {
      fired,
      childCount: dv.querySelectorAll('calendar-event').length,
      readBack: dv.events.map(e => e.text),
    };
  });

  expect(result.fired).toEqual([{ source: 'property', count: 3 }]);
  expect(result.childCount).toBe(3);
  // text contains the time prefix because the <time> + text are siblings
  expect(result.readBack[0]).toContain('Standup');
  expect(result.readBack[1]).toContain('Review');
  expect(result.readBack[2]).toContain('Deep work');
});

test('week-view: .events setter rebuilds calendar-event children with date keys', async ({ page }) => {
  await page.goto('/docs/examples/demos/week-view-basic.html');
  await page.waitForFunction(() => document.querySelector('week-view[data-upgraded]'));

  const result = await page.evaluate(() => {
    const wv = document.querySelector('week-view');
    const start = wv.dataset.startDate || '2026-04-27';
    const fired = [];
    wv.addEventListener('week-view:events-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.events.length });
    });
    wv.events = [
      { date: start, time: '10:00', text: 'Plan' },
      { date: start, time: '14:00', text: 'Build' },
    ];
    return {
      fired,
      childCount: wv.querySelectorAll('calendar-event').length,
      readBack: wv.events.map(e => `${e.date}:${e.time}:${e.text}`),
    };
  });

  expect(result.fired).toEqual([{ source: 'property', count: 2 }]);
  expect(result.childCount).toBe(2);
  expect(result.readBack[0]).toContain('Plan');
  expect(result.readBack[1]).toContain('Build');
});
