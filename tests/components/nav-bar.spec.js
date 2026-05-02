/**
 * nav-bar — dual-mode contract & active-link sync.
 *
 * Verifies HTML-first wrap, popstate auto-sync, .current explicit
 * ownership, .items rebuild + idempotency, and source-tagged events.
 */

import { test, expect } from 'playwright/test';

const DEMO = '/docs/examples/demos/nav-bar-basic.html';

test('HTML-first: aria-current applied to best pathname match', async ({ page }) => {
  await page.goto(DEMO);
  await page.waitForFunction(() => document.querySelector('#nav-html-first[data-upgraded]'));

  // Demo runs at /docs/examples/demos/nav-bar-basic.html — best match
  // is /docs/elements/ via prefix? No — it's /docs/ (longest prefix).
  // /docs/elements/ does NOT prefix-match /docs/examples/...; only /docs/ does.
  const result = await page.evaluate(() => {
    const nav = document.querySelector('#nav-html-first');
    const active = nav.querySelector('a[aria-current="page"]');
    return { active: active?.getAttribute('href') ?? null, role: nav.getAttribute('role') };
  });

  expect(result.active).toBe('/docs/');
  expect(result.role).toBe('navigation');
});

test('popstate triggers re-match with source: popstate', async ({ page }) => {
  await page.goto(DEMO);
  await page.waitForFunction(() => document.querySelector('#nav-html-first[data-upgraded]'));

  const result = await page.evaluate(() => new Promise(resolve => {
    const nav = document.querySelector('#nav-html-first');
    const events = [];
    nav.addEventListener('nav-bar:current-changed', (e) => events.push(e.detail));

    // Simulate SPA navigation: pushState then dispatch popstate
    history.pushState({}, '', '/changelog/');
    window.dispatchEvent(new PopStateEvent('popstate'));

    queueMicrotask(() => {
      const active = nav.querySelector('a[aria-current="page"]');
      resolve({ events, activeHref: active?.getAttribute('href') ?? null });
    });
  }));

  expect(result.events.length).toBeGreaterThanOrEqual(1);
  expect(result.events[result.events.length - 1].source).toBe('popstate');
  expect(result.activeHref).toBe('/changelog/');
});

test('.current setter takes ownership and disables popstate auto-sync', async ({ page }) => {
  await page.goto(DEMO);
  await page.waitForFunction(() => document.querySelector('#nav-html-first[data-upgraded]'));

  const result = await page.evaluate(() => {
    const nav = document.querySelector('#nav-html-first');
    const events = [];
    nav.addEventListener('nav-bar:current-changed', (e) => events.push(e.detail));

    // Take ownership: should set aria-current on /docs/elements/ link.
    nav.current = '/docs/elements/';
    const afterSet = nav.querySelector('a[aria-current="page"]')?.getAttribute('href');

    // popstate now should be ignored
    history.pushState({}, '', '/changelog/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    const afterPopstate = nav.querySelector('a[aria-current="page"]')?.getAttribute('href');

    // Releasing ownership re-enables auto-mode and re-matches.
    nav.releaseCurrent();
    const afterRelease = nav.querySelector('a[aria-current="page"]')?.getAttribute('href');

    return {
      events: events.map(e => ({ source: e.source, current: e.current })),
      afterSet, afterPopstate, afterRelease,
    };
  });

  expect(result.afterSet).toBe('/docs/elements/');
  expect(result.afterPopstate).toBe('/docs/elements/'); // unchanged — explicit owns it
  expect(result.afterRelease).toBe('/changelog/');     // pathname is now /changelog/
  // First event = property; later event(s) include the pathname re-match.
  expect(result.events[0].source).toBe('property');
  expect(result.events[result.events.length - 1].source).toBe('pathname');
});

test('.items setter rebuilds children with default renderer', async ({ page }) => {
  await page.goto(DEMO);
  // Demo populates #nav-js-first asynchronously on upgraded; wait for it.
  await page.waitForFunction(() => document.querySelectorAll('#nav-js-first > a').length === 3);

  const result = await page.evaluate(() => {
    const nav = document.querySelector('#nav-js-first');
    const links = nav.querySelectorAll(':scope > a');
    return {
      count: links.length,
      hrefs: Array.from(links).map(a => a.getAttribute('href')),
      labels: Array.from(links).map(a => a.textContent.trim()),
      hasIcon: !!links[1]?.querySelector('icon-wc'),
      badgeText: links[2]?.querySelector('.badge')?.textContent,
    };
  });

  expect(result.count).toBe(3);
  expect(result.hrefs).toEqual(['/', '/dashboard/', '/settings/']);
  expect(result.labels[0]).toContain('Home');
  expect(result.hasIcon).toBe(true);
  expect(result.badgeText).toBe('3');
});

test('.items setter is idempotent (no re-fire on equal assignment)', async ({ page }) => {
  await page.goto(DEMO);
  // Wait for demo's initial items assignment to land before attaching listener,
  // so we only count the test's own assignments.
  await page.waitForFunction(() => document.querySelectorAll('#nav-js-first > a').length === 3);

  const result = await page.evaluate(() => {
    const nav = document.querySelector('#nav-js-first');
    const fired = [];
    nav.addEventListener('nav-bar:items-changed', (e) => fired.push(e.detail.source));

    const sameItems = [
      { href: '/',           label: 'Home' },
      { href: '/dashboard/', label: 'Dashboard', icon: 'gauge' },
      { href: '/settings/',  label: 'Settings', badge: '3' },
    ];
    nav.items = sameItems;        // deep-equal → no-op
    nav.items = sameItems;        // again, no-op
    nav.items = [{ href: '/', label: 'Just Home' }]; // fires once
    return fired;
  });

  expect(result.length).toBe(1);
  expect(result[0]).toBe('property');
});

test('data-match="exact" disables prefix matching', async ({ page }) => {
  await page.goto(DEMO);
  await page.waitForFunction(() => document.querySelector('#nav-exact[data-upgraded]'));

  const result = await page.evaluate(() => {
    const nav = document.querySelector('#nav-exact');
    const active = nav.querySelector('a[aria-current="page"]');
    return { activeHref: active?.getAttribute('href') ?? null };
  });

  // Demo URL is /docs/examples/demos/nav-bar-basic.html — no link
  // matches exactly, so nothing should be marked active.
  expect(result.activeHref).toBeNull();
});
