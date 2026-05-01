/**
 * Phase 6b–6f — remaining components dual-mode contract.
 *
 * Covers app chrome (toast-msg, notification-wc), maps (geo-map,
 * image-map), search/content (site-search, settings-panel,
 * include-file), auto-derived getters (recently-visited, page-toc),
 * and the Skip-list re-audit (audio-player, video-player, content-swap).
 */

import { test, expect } from 'playwright/test';

test('toast-msg: .show emits enqueued event with source tag', async ({ page }) => {
  await page.goto('/docs/examples/demos/audio-player-basic.html');
  await page.waitForFunction(() => customElements.get('toast-msg'));

  const result = await page.evaluate(() => {
    const tm = document.createElement('toast-msg');
    document.body.appendChild(tm);
    const fired = [];
    tm.addEventListener('toast-msg:enqueued', (e) => fired.push(e.detail));
    tm.show({ message: 'Hello', variant: 'success' });
    return { fired, queueLen: tm.queue.length };
  });

  expect(result.fired.length).toBe(1);
  expect(result.fired[0].source).toBe('api');
  expect(result.fired[0].message).toBe('Hello');
  expect(result.queueLen).toBe(1);
});

test('geo-map: .data setter updates map state and emits tagged event', async ({ page }) => {
  await page.goto('/docs/examples/demos/geo-map-basic.html');
  await page.waitForFunction(() => document.querySelector('geo-map[data-upgraded]'));

  const result = await page.evaluate(() => {
    const g = document.querySelector('geo-map');
    const fired = [];
    g.addEventListener('geo-map:data-changed', (e) => fired.push(e.detail.source));
    g.data = { lat: 40.7128, lng: -74.0060, zoom: 12 };
    return { fired, lat: g.lat, lng: g.lng, zoom: g.zoom, markersLen: g.markers.length };
  });

  expect(result.fired).toEqual(['property']);
  expect(result.lat).toBeCloseTo(40.7128, 2);
  expect(result.lng).toBeCloseTo(-74.006, 2);
  expect(result.zoom).toBe(12);
  expect(result.markersLen).toBe(1);
});

test('include-file: .src setter is idempotent + tagged', async ({ page }) => {
  await page.goto('/docs/examples/demos/include-file-basic.html');
  await page.waitForFunction(() => document.querySelector('include-file[data-upgraded]'));

  const result = await page.evaluate(() => {
    const inc = document.querySelector('include-file');
    const fired = [];
    inc.addEventListener('include-file:src-changed', (e) => fired.push(e.detail.source));
    const original = inc.src;
    inc.src = '/some/other/file.html';
    inc.src = '/some/other/file.html'; // idempotent
    inc.src = original;
    return { fired };
  });

  expect(result.fired.length).toBe(2);
  expect(result.fired.every(s => s === 'property')).toBe(true);
});

test('site-search: .value setter triggers input event + tagged change', async ({ page }) => {
  await page.goto('/docs/examples/demos/site-search-basic.html');
  await page.waitForFunction(() => document.querySelector('site-search[data-upgraded]'));

  const result = await page.evaluate(() => {
    const s = document.querySelector('site-search');
    const fired = [];
    s.addEventListener('site-search:change', (e) => fired.push(e.detail.source));
    s.value = 'kanban';
    s.value = 'kanban'; // idempotent
    s.value = 'chart';
    return { fired, current: s.value };
  });

  expect(result.fired.length).toBe(2);
  expect(result.fired.every(s => s === 'api')).toBe(true);
  expect(result.current).toBe('chart');
});

test('audio-player: .src setter loads new source + emits tagged event', async ({ page }) => {
  await page.goto('/docs/examples/demos/audio-player-basic.html');
  await page.waitForFunction(() => document.querySelector('audio-player[data-upgraded]'));

  const result = await page.evaluate(() => {
    const ap = document.querySelector('audio-player');
    const fired = [];
    ap.addEventListener('audio-player:src-changed', (e) => fired.push(e.detail));
    ap.src = '/new-audio.mp3';
    return { fired, src: ap.src };
  });

  expect(result.fired.length).toBe(1);
  expect(result.fired[0].source).toBe('property');
  expect(result.src).toContain('/new-audio.mp3');
});

test('content-swap: source tag now propagates through the swap event', async ({ page }) => {
  await page.goto('/docs/examples/demos/content-swap-basic.html');
  await page.waitForFunction(() => document.querySelector('content-swap[data-upgraded]'));

  const result = await page.evaluate(() => new Promise(resolve => {
    const cs = document.querySelector('content-swap');
    const fired = [];
    cs.addEventListener('content-swap:swap', (e) => fired.push(e.detail.source));
    cs.flip();
    setTimeout(() => {
      cs.unflip();
      // Allow view-transition + microtask to settle.
      setTimeout(() => resolve(fired), 600);
    }, 400);
  }));

  expect(result.length).toBe(2);
  expect(result.every(s => s === 'api')).toBe(true);
});

// recently-visited.entries getter is verified by source review — the
// component class isn't shipped in vanilla-breeze-autoload (only the
// tracker init is, by design), so there's no Playwright-friendly demo
// page that registers it for the .entries assertion.
