/**
 * Unit tests for the ambient pack's built-in calendars and motif icons:
 *   - every calendar entry has a safe id, a rule that expands, and a known icon
 *   - calendarFor() defaults to markers, merges sets, and lets a site replace an entry
 *   - ambient.icons.css is current with its generator, and every icon has an occasion rule
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CALENDARS, calendarFor, expandCalendar, resolveOccasions } from '../../src/packs/ambient/ambient.resolve.js';
import { ICONS, generate } from '../../scripts/generate-ambient-icons.mjs';

const PACK = join(import.meta.dirname, '..', '..', 'src', 'packs', 'ambient');

describe('built-in calendars', () => {
  it('has the three sets', () => {
    assert.deepEqual(Object.keys(CALENDARS).sort(), ['civic-us', 'geek', 'markers']);
  });

  for (const [name, entries] of Object.entries(CALENDARS)) {
    it(`${name}: ids are unique and safe, rules expand, icons are known`, () => {
      const ids = entries.map((e) => e.id);
      assert.equal(new Set(ids).size, ids.length, 'duplicate id');
      for (const entry of entries) {
        assert.match(entry.id, /^[a-z0-9][a-z0-9-]*$/);
        // 2028 is a leap year, so leap-day expands too
        assert.ok(expandCalendar([entry], [2028]).length >= 1, `${entry.id} does not expand`);
        if (entry.icon) assert.ok(entry.icon in ICONS, `${entry.id}: unknown icon ${entry.icon}`);
      }
    });
  }

  it('resolves known dates', () => {
    const on = (ymd, calendars) => resolveOccasions(new Date(`${ymd}T12:00:00Z`), calendarFor({ calendars }), { tz: 'UTC' });
    assert.deepEqual(on('2026-03-14', ['geek']), { ids: ['pi-day'], day: true, icon: 'pi' });
    assert.deepEqual(on('2026-09-13', ['geek']), { ids: ['programmers-day'], day: true, icon: undefined });
    assert.deepEqual(on('2026-11-26', ['civic-us']), { ids: ['thanksgiving'], day: true, icon: 'leaf' });
    assert.deepEqual(on('2026-10-27', ['civic-us']), { ids: ['halloween'], day: false, icon: 'ghost' });
    assert.deepEqual(on('2026-12-31', ['markers']), { ids: ['new-year'], day: false, icon: 'sparkles' });
    assert.deepEqual(on('2026-08-10', ['markers', 'geek', 'civic-us']), { ids: [], day: false, icon: undefined });
  });
});

describe('calendarFor', () => {
  it('defaults to markers', () => {
    assert.deepEqual(calendarFor(), CALENDARS.markers);
    assert.deepEqual(calendarFor({ calendars: [] }), []);
  });

  it('merges sets by id and ignores unknown names', () => {
    const merged = calendarFor({ calendars: ['markers', 'civic-us', 'constructor', 'nope'] });
    assert.equal(merged.filter((e) => e.id === 'new-year').length, 1);
    assert.equal(merged.find((e) => e.id === 'new-year')?.priority, 40, 'the later set wins');
    assert.equal(merged.length, CALENDARS.markers.length + CALENDARS['civic-us'].length - 1);
  });

  it('adds site entries, which replace a built-in one with the same id', () => {
    const calendar = [{ id: 'blog-birthday', rule: '03-01', icon: 'cake' }, { id: 'pi-day', rule: '03-14', icon: 'cake' }];
    const merged = calendarFor({ calendars: ['geek'], calendar });
    assert.equal(merged.find((e) => e.id === 'pi-day')?.icon, 'cake');
    assert.ok(merged.some((e) => e.id === 'blog-birthday'));
  });
});

describe('motif icons', () => {
  const effects = readFileSync(join(PACK, 'ambient.effects.css'), 'utf8');

  it('ambient.icons.css is current with scripts/generate-ambient-icons.mjs', () => {
    assert.equal(readFileSync(join(PACK, 'ambient.icons.css'), 'utf8'), generate());
  });

  it('every icon has an occasion rule and a token', () => {
    const css = generate();
    for (const name of Object.keys(ICONS)) {
      assert.ok(css.includes(`--ambient-icon-${name}: url("data:image/svg+xml,`), `${name}: no token`);
      assert.ok(effects.includes(`[data-occasion-icon="${name}"]) { --ambient-icon: var(--ambient-icon-${name}); }`), `${name}: no occasion rule`);
    }
  });

  it('every icon the effects stylesheet uses exists', () => {
    for (const [, name] of effects.matchAll(/var\(--ambient-icon-([a-z-]+)\)/g)) {
      assert.ok(name in ICONS, `unknown icon ${name}`);
    }
  });
});
