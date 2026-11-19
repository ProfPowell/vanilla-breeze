/**
 * Unit tests for src/packs/ambient/ambient.resolve.js
 * Pure resolvers: date → season, daypart, occasions; WMO code → weather.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  zonedParts, resolveSeason, resolveDaypart, sunTimes, activeOccasions, expandCalendar, resolveOccasions, mapWeatherCode,
} from '../../src/packs/ambient/ambient.resolve.js';

const LA = { tz: 'America/Los_Angeles' };
const at = (iso) => new Date(iso);

describe('zonedParts', () => {
  it('reads the date and time in the place, whatever the runner zone', () => {
    // 04:30 UTC on 16 Nov is 20:30 on 15 Nov in Los Angeles (PST, UTC-8)
    assert.deepEqual(zonedParts(at('2026-11-16T04:30:00Z'), LA.tz), { y: 2026, m: 11, min: 20 * 60 + 30, ymd: '2026-11-15' });
    assert.equal(zonedParts(at('2026-11-16T04:30:00Z'), 'Asia/Tokyo').ymd, '2026-11-16');
    assert.equal(zonedParts(at('2026-11-16T04:30:00Z'), 'UTC').min, 4 * 60 + 30);
  });

  it('reports midnight as minute 0, not 24:00', () => {
    assert.equal(zonedParts(at('2026-03-01T00:00:00Z'), 'UTC').min, 0);
  });
});

describe('resolveSeason', () => {
  const north = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
  const south = ['summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter', 'winter', 'winter', 'spring', 'spring', 'spring', 'summer'];

  it('gives the meteorological season for every month in both hemispheres', () => {
    for (let month = 1; month <= 12; month++) {
      const date = at(`2026-${String(month).padStart(2, '0')}-15T12:00:00Z`);
      assert.equal(resolveSeason(date, { tz: 'UTC' }), north[month - 1], `north month ${month}`);
      assert.equal(resolveSeason(date, { tz: 'UTC', hemisphere: 'south' }), south[month - 1], `south month ${month}`);
    }
  });

  it('uses the month in the place: 1 March in Tokyo is still February in Los Angeles', () => {
    const instant = at('2026-02-28T20:00:00Z');
    assert.equal(resolveSeason(instant, { tz: 'Asia/Tokyo' }), 'spring');
    assert.equal(resolveSeason(instant, LA), 'winter');
  });

  it('takes a custom month to label map, and gives null for a month it lacks', () => {
    const seasons = { 6: 'monsoon', 7: 'monsoon' };
    assert.equal(resolveSeason(at('2026-06-10T12:00:00Z'), { tz: 'UTC', seasons }), 'monsoon');
    assert.equal(resolveSeason(at('2026-01-10T12:00:00Z'), { tz: 'UTC', seasons }), null);
  });
});

describe('resolveDaypart', () => {
  const utc = { tz: 'UTC' };
  const day = (hm) => at(`2026-01-15T${hm}:00Z`); // winter: sunrise 07:00, sunset 17:00

  it('finds each part and its boundaries from the season table', () => {
    assert.equal(resolveDaypart(day('06:14'), utc), 'night');
    assert.equal(resolveDaypart(day('06:15'), utc), 'dawn');
    assert.equal(resolveDaypart(day('07:44'), utc), 'dawn');
    assert.equal(resolveDaypart(day('07:45'), utc), 'day');
    assert.equal(resolveDaypart(day('16:14'), utc), 'day');
    assert.equal(resolveDaypart(day('16:15'), utc), 'dusk');
    assert.equal(resolveDaypart(day('17:44'), utc), 'dusk');
    assert.equal(resolveDaypart(day('17:45'), utc), 'night');
    assert.equal(resolveDaypart(day('00:00'), utc), 'night');
  });

  it('uses sunrise and sunset from a feed when given', () => {
    const sun = { sunrise: '06:18', sunset: '16:47' };
    assert.deepEqual(sunTimes(day('12:00'), utc, sun), [378, 1007]);
    assert.equal(resolveDaypart(day('05:40'), utc, sun), 'dawn');
    assert.equal(resolveDaypart(day('16:10'), utc, sun), 'dusk');
    assert.equal(resolveDaypart(day('17:40'), utc, sun), 'night');
  });

  it('follows the wall clock across a daylight-saving change', () => {
    // US clocks go forward on 8 March 2026; 07:00 PDT is 14:00 UTC
    assert.equal(resolveDaypart(at('2026-03-09T13:30:00Z'), LA), 'dawn'); // 06:30 PDT, spring sunrise 06:15
    assert.equal(resolveDaypart(at('2026-03-07T14:30:00Z'), LA), 'dawn'); // 06:30 PST the day before
  });
});

describe('expandCalendar', () => {
  const one = (rule, years = [2026], extra = {}) => expandCalendar([{ id: 'x', rule, ...extra }], years);

  it('expands a fixed date', () => {
    assert.deepEqual(one('10-31'), [{ id: 'x', from: '2026-10-31', to: '2026-10-31', start: '2026-10-31', end: '2026-10-31' }]);
  });

  it('applies lead and trail, and carries priority, icon and effect', () => {
    assert.deepEqual(one('10-31', [2026], { lead: 7, trail: 1, priority: 50, icon: 'pumpkin', effect: 'confetti' }), [
      { id: 'x', from: '2026-10-24', to: '2026-11-01', start: '2026-10-31', end: '2026-10-31', p: 50, icon: 'pumpkin', effect: 'confetti' },
    ]);
  });

  it('expands a range that wraps the year', () => {
    assert.deepEqual(one('12-24..01-01').map((w) => [w.start, w.end]), [['2026-12-24', '2027-01-01']]);
    assert.deepEqual(one('06-01..06-03').map((w) => [w.start, w.end]), [['2026-06-01', '2026-06-03']]);
  });

  it('expands nth and last weekdays', () => {
    assert.equal(one('11:4:thu')[0].start, '2026-11-26'); // Thanksgiving 2026
    assert.equal(one('5:-1:mon')[0].start, '2026-05-25'); // Memorial Day 2026
    assert.equal(one('1:1:thu')[0].start, '2026-01-01');
    assert.deepEqual(one('2:5:mon'), [], 'February 2026 has no fifth Monday');
  });

  it('expands a day of year', () => {
    assert.equal(one('doy:256')[0].start, '2026-09-13');
    assert.equal(one('doy:256', [2028])[0].start, '2028-09-12'); // leap year
    assert.deepEqual(one('doy:366'), []);
  });

  it('has leap day only in a leap year', () => {
    assert.deepEqual(one('02-29', [2026, 2027, 2028]).map((w) => w.start), ['2028-02-29']);
  });

  it('takes explicit dates within the requested years', () => {
    assert.deepEqual(one({ dates: ['2026-02-17', '2027-02-06', '2030-02-03'] }, [2026, 2027]).map((w) => w.start), ['2026-02-17', '2027-02-06']);
  });

  it('skips unknown rules and unsafe ids', () => {
    assert.deepEqual(one('whenever'), []);
    assert.deepEqual(expandCalendar([{ id: 'Bad Id"', rule: '10-31' }], [2026]), []);
    assert.deepEqual(expandCalendar(/** @type {any} */ (null), [2026]), []);
  });
});

describe('activeOccasions and resolveOccasions', () => {
  const calendar = [
    { id: 'halloween', rule: '10-31', lead: 7, priority: 50 },
    { id: 'autumn-fair', rule: '10-20..10-31', priority: 50 },
    { id: 'low', rule: '10-30', lead: 3, priority: 1 },
    { id: 'new-year', rule: '12-31..01-01', lead: 2 },
  ];
  const on = (ymd) => resolveOccasions(at(`${ymd}T12:00:00Z`), calendar, { tz: 'UTC' });

  it('is active through the lead-up and sets day only on the date', () => {
    assert.deepEqual(on('2026-10-23'), { ids: ['autumn-fair'], day: true, icon: undefined });
    assert.deepEqual(on('2026-11-01'), { ids: [], day: false, icon: undefined });
    const lead = resolveOccasions(at('2026-10-25T12:00:00Z'), [calendar[0]], { tz: 'UTC' });
    assert.deepEqual(lead, { ids: ['halloween'], day: false, icon: undefined });
    const day = resolveOccasions(at('2026-10-31T12:00:00Z'), [calendar[0]], { tz: 'UTC' });
    assert.deepEqual(day, { ids: ['halloween'], day: true, icon: undefined });
  });

  it('sorts by priority, breaks ties by nearness, and keeps two', () => {
    // 28 Oct: autumn-fair (in range, distance 0) beats halloween (3 days off) at equal priority; low is dropped
    assert.deepEqual(on('2026-10-28').ids, ['autumn-fair', 'halloween']);
  });

  it('finds a year-wrapping range on both sides of the new year', () => {
    assert.deepEqual(on('2026-12-29'), { ids: ['new-year'], day: false, icon: undefined });
    assert.deepEqual(on('2027-01-01'), { ids: ['new-year'], day: true, icon: undefined });
    assert.deepEqual(on('2026-01-01'), { ids: ['new-year'], day: true, icon: undefined });
  });

  it('uses the date in the place', () => {
    // 31 Oct 06:00 UTC is still 30 Oct in Los Angeles
    const result = resolveOccasions(at('2026-10-31T06:00:00Z'), [{ id: 'halloween', rule: '10-31' }], LA);
    assert.deepEqual(result, { ids: [], day: false, icon: undefined });
  });

  it('accepts no windows', () => {
    assert.deepEqual(activeOccasions(null, '2026-01-01'), { ids: [], day: false, icon: undefined });
  });
});

describe('mapWeatherCode', () => {
  it('maps every code in the table', () => {
    /** @type {Array<[number[], object]>} */
    const table = [
      [[0, 1], { weather: 'clear' }],
      [[2, 3], { weather: 'cloudy' }],
      [[45, 48], { weather: 'fog' }],
      [[51, 53, 55, 56, 57], { weather: 'rain', intensity: 'light' }],
      [[61, 63, 66, 80, 81], { weather: 'rain' }],
      [[65, 67, 82], { weather: 'rain', intensity: 'heavy' }],
      [[71, 73, 77, 85], { weather: 'snow' }],
      [[75, 86], { weather: 'snow', intensity: 'heavy' }],
      [[95, 96, 99], { weather: 'storm' }],
    ];
    for (const [codes, expected] of table) {
      for (const code of codes) assert.deepEqual(mapWeatherCode(code), expected, `code ${code}`);
    }
  });

  it('reports wind for clear or cloudy skies at 40 km/h and above', () => {
    assert.deepEqual(mapWeatherCode(1, 40), { weather: 'wind' });
    assert.deepEqual(mapWeatherCode(3, 39), { weather: 'cloudy' });
    assert.deepEqual(mapWeatherCode(61, 60), { weather: 'rain' });
  });

  it('gives null for an unknown code', () => {
    for (const code of [4, 44, 58, 100, -1, 1.5, NaN, undefined, 'rain']) assert.equal(mapWeatherCode(/** @type {any} */ (code)), null, String(code));
  });
});
