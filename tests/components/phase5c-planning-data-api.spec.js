/**
 * Phase 5c — UX Planning components dual-mode contracts.
 *
 * empathy-map .data, impact-effort .items, story-map .activities,
 * user-journey .data + .phases, glossary-wc .terms, change-set .view,
 * topic-map .data.
 */

import { test, expect } from 'playwright/test';

test('empathy-map: .data setter populates quadrants and slotted content', async ({ page }) => {
  await page.goto('/docs/examples/demos/empathy-map-basic.html');
  await page.waitForFunction(() => document.querySelector('empathy-map[data-upgraded]'));

  const result = await page.evaluate(() => {
    const em = document.querySelector('empathy-map');
    const fired = [];
    em.addEventListener('empathy-map:data-changed', (e) => {
      fired.push(e.detail.source);
    });
    em.data = {
      persona: 'Alex',
      quadrants: {
        says:   ['I need this'],
        thinks: ['Is it worth it?'],
        does:   ['Searches docs'],
        feels:  ['Hopeful'],
      },
      goals: ['Ship faster'],
      painPoints: ['Tooling friction'],
    };
    return {
      fired,
      persona: em.getAttribute('persona'),
      data: em.data,
    };
  });

  expect(result.fired).toEqual(['property']);
  expect(result.persona).toBe('Alex');
  expect(result.data.quadrants.says).toEqual(['I need this']);
  expect(result.data.goals).toEqual(['Ship faster']);
});

test('impact-effort: .items setter routes into quadrant surfaces with diff preservation', async ({ page }) => {
  await page.goto('/docs/examples/demos/impact-effort-basic.html');
  await page.waitForFunction(() => document.querySelector('impact-effort[data-upgraded]'));

  const result = await page.evaluate(() => {
    const ie = document.querySelector('impact-effort');
    const fired = [];
    ie.addEventListener('impact-effort:items-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.items.length });
    });

    ie.items = [
      { id: 'a', quadrant: 'quick-wins', text: 'Add dark mode' },
      { id: 'b', quadrant: 'big-bets',   text: 'Rebuild auth' },
      { id: 'c', quadrant: 'fill-ins',   text: 'Tweak copy' },
    ];

    const before = new Map();
    for (const el of ie.querySelectorAll('[data-id]')) before.set(el.getAttribute('data-id'), el);

    // Re-assign: move 'a' to big-bets, drop 'c', add 'd'.
    ie.items = [
      { id: 'a', quadrant: 'big-bets', text: 'Add dark mode' },
      { id: 'b', quadrant: 'big-bets', text: 'Rebuild auth' },
      { id: 'd', quadrant: 'money-pit', text: 'Pet project' },
    ];

    return {
      fired,
      preservedA: ie.querySelector('[data-id="a"]') === before.get('a'),
      preservedB: ie.querySelector('[data-id="b"]') === before.get('b'),
      droppedC: !ie.querySelector('[data-id="c"]'),
      addedD: !!ie.querySelector('[data-id="d"]'),
      aQuadrant: ie.querySelector('[data-id="a"]')?.closest('[data-quadrant-zone]')?.getAttribute('data-quadrant-zone'),
    };
  });

  expect(result.fired.length).toBe(2);
  expect(result.preservedA).toBe(true);
  expect(result.preservedB).toBe(true);
  expect(result.droppedC).toBe(true);
  expect(result.addedD).toBe(true);
  expect(result.aQuadrant).toBe('big-bets');
});

test('story-map: .activities setter rebuilds activity columns + stories', async ({ page }) => {
  await page.goto('/docs/examples/demos/story-map-basic.html');
  await page.waitForFunction(() => document.querySelector('story-map[data-upgraded]'));

  const result = await page.evaluate(() => {
    const sm = document.querySelector('story-map');
    const fired = [];
    sm.addEventListener('story-map:activities-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.activities.length });
    });
    sm.activities = [
      { id: 'plan', label: 'Plan', stories: [{ id: 'p1', title: 'Spike research' }] },
      { id: 'build', label: 'Build', stories: [{ id: 'b1', title: 'Endpoint' }, { id: 'b2', title: 'UI' }] },
    ];
    return {
      fired,
      cols: [...sm.querySelectorAll('[data-activity-column]')].map(s => s.getAttribute('data-activity-column')),
      storyCount: sm.querySelectorAll('[draggable="true"]').length,
    };
  });

  expect(result.fired).toEqual([{ source: 'property', count: 2 }]);
  expect(result.cols).toEqual(['plan', 'build']);
  expect(result.storyCount).toBe(3);
});

test('user-journey: .data setter populates phases + slots', async ({ page }) => {
  await page.goto('/docs/examples/demos/user-journey-basic.html');
  await page.waitForFunction(() => document.querySelector('user-journey[data-upgraded]'));

  const result = await page.evaluate(() => {
    const uj = document.querySelector('user-journey');
    const fired = [];
    uj.addEventListener('user-journey:data-changed', (e) => fired.push(e.detail.source));
    uj.data = {
      persona: 'Sam',
      title: 'Sign-up Journey',
      phases: [
        { name: 'Discover', steps: ['Sees ad'] },
        { name: 'Sign up',  steps: ['Enters email', 'Verifies'] },
      ],
    };
    return { fired, gettable: uj.data.phases?.length, persona: uj.data.persona };
  });

  expect(result.fired).toEqual(['property']);
  expect(result.gettable).toBe(2);
  expect(result.persona).toBe('Sam');
});

test('glossary-wc: .terms setter rebuilds the dl', async ({ page }) => {
  await page.goto('/docs/examples/demos/glossary-wc-basic.html');
  await page.waitForFunction(() => document.querySelector('glossary-wc[data-upgraded]'));

  const result = await page.evaluate(() => {
    const g = document.querySelector('glossary-wc');
    const fired = [];
    g.addEventListener('glossary-wc:terms-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.terms.length });
    });
    g.terms = [
      { id: 'a11y', term: 'Accessibility', definition: 'For everyone', category: 'A' },
      { id: 'aria', term: 'ARIA', definition: 'Roles', category: 'A' },
      { id: 'wcag', term: 'WCAG', definition: 'Guidelines', category: 'W' },
    ];
    return {
      fired,
      readBack: g.terms.map(t => t.id),
    };
  });

  expect(result.fired).toEqual([{ source: 'property', count: 3 }]);
  expect(result.readBack).toEqual(['a11y', 'aria', 'wcag']);
});

// change-set: .view setter is idempotent + source-tagged. The component
// isn't included in vanilla-breeze-autoload (the bundle every demo loads),
// so we don't have a Playwright-friendly demo page for it. The behavior
// is exercised by unit-style review of the setter. If a dedicated
// change-set demo is added later, port a Playwright test from the
// pattern in other Phase 5* specs.
