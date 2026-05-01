/**
 * calendar-wc — Data API (Phase 3c)
 *
 * Verifies the new .events property accepts both a date-keyed object and
 * a flat array, emits calendar-wc:events-changed with source tag, and
 * triggers a re-render so dots/event chips appear.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/calendar-wc-basic.html';

test.describe('calendar-wc — data API', () => {

  test('accepts date-keyed object via .events and re-renders', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('calendar-wc[data-upgraded]');

    const result = await page.evaluate(() => {
      const cal = document.querySelector('calendar-wc');
      // Pick a visible day from the current view
      const visibleCell = cal.querySelector('td:has(button[data-date]):not([data-outside-month])');
      const iso = visibleCell?.querySelector('button[data-date]')?.getAttribute('data-date');
      if (!iso) return { ok: false, reason: 'no visible day cell' };

      const fired = [];
      cal.addEventListener('calendar-wc:events-changed', (e) => {
        fired.push({ source: e.detail.source, count: Object.keys(e.detail.events).length });
      });

      cal.events = { [iso]: [{ label: 'Standup', time: '09:00' }] };

      const cell = cal.querySelector(`button[data-date="${iso}"]`)?.closest('td');
      return {
        ok: true,
        iso,
        cellHasEventsAttr: cell?.hasAttribute('data-events'),
        eventCount: cell?.getAttribute('data-event-count'),
        fired,
      };
    });

    expect(result.ok).toBe(true);
    expect(result.cellHasEventsAttr).toBe(true);
    expect(result.eventCount).toBe('1');
    expect(result.fired).toEqual([{ source: 'property', count: 1 }]);
  });

  test('accepts flat event array and groups by date field', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('calendar-wc[data-upgraded]');

    const result = await page.evaluate(() => {
      const cal = document.querySelector('calendar-wc');
      const cells = [...cal.querySelectorAll('td:has(button[data-date]):not([data-outside-month])')];
      const isoA = cells[0]?.querySelector('button[data-date]')?.getAttribute('data-date');
      const isoB = cells[1]?.querySelector('button[data-date]')?.getAttribute('data-date');
      if (!isoA || !isoB) return { ok: false };

      cal.events = [
        { id: 'e1', date: isoA, label: 'Morning' },
        { id: 'e2', date: isoA, label: 'Afternoon' },
        { id: 'e3', date: isoB, label: 'All day' },
      ];

      return {
        ok: true,
        groupedKeys: Object.keys(cal.events),
        countA: cal.events[isoA]?.length,
        countB: cal.events[isoB]?.length,
        cellAEventCount: cal.querySelector(`button[data-date="${isoA}"]`)?.closest('td')?.getAttribute('data-event-count'),
        cellBEventCount: cal.querySelector(`button[data-date="${isoB}"]`)?.closest('td')?.getAttribute('data-event-count'),
      };
    });

    expect(result.ok).toBe(true);
    expect(result.groupedKeys.length).toBe(2);
    expect(result.countA).toBe(2);
    expect(result.countB).toBe(1);
    expect(result.cellAEventCount).toBe('2');
    expect(result.cellBEventCount).toBe('1');
  });
});
