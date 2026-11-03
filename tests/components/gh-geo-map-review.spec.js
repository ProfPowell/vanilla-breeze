/**
 * geo-map — review fixes (vanilla-breeze-wja7).
 *
 * Covers: marker colour / content never parsed as markup; per-provider and
 * custom attribution; resize re-layout covering the box (incl. hidden →
 * visible); batched .data setter; on-screen zoom + keyboard + pinch;
 * accessible name from <address>, label-in-name; activation race;
 * loading="consent" makes no tile requests until activated; reconnect
 * does not duplicate; template placeholders.
 *
 * Tests the working tree: /src is served from disk, tiles from a local stub.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');
const TILE = readFileSync(join(REPO, 'tests/element-visual/fixtures/static/geo-tile.svg'));
const STUB = '/__geo-tile/{z}/{x}/{y}.svg';

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ head?: string }} [opts]
 * @returns {Promise<string[]>} live list of tile URLs requested
 */
async function load(page, body, { head = '' } = {}) {
  /** @type {string[]} */
  const tiles = [];
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const tile = (route) => {
    tiles.push(route.request().url());
    return route.fulfill({ contentType: 'image/svg+xml', body: TILE });
  };
  await page.route('**/__geo-tile/**', tile);
  await page.route('https://tile.openstreetmap.org/**', tile);
  await page.route('https://basemaps.cartocdn.com/**', tile);
  const url = `/__geo-map-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      <script type="module">import '/src/web-components/geo-map/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('geo-map'));
  return tiles;
}

const ready = (page, sel = 'geo-map') => page.waitForSelector(`${sel}[data-ready]`, { state: 'attached' });

test('marker colour and slotted text are never parsed as markup', async ({ page }) => {
  await load(page, `
    <geo-map id="m" lat="40.7" lng="-73.9" tile-url="${STUB}"
      marker-color='red" onload="window.__pwned=1'>
      <address>&lt;img src=x onerror="window.__pwned=2"&gt; HQ</address>
    </geo-map>`);
  await ready(page, '#m');
  const r = await page.evaluate(async () => {
    const m = /** @type {any} */ (document.getElementById('m'));
    const root = m.shadowRoot;
    const before = {
      pathFill: root.querySelector('[part="marker"] path').getAttribute('fill'),
      custom: root.querySelector('[part="marker"]').style.getPropertyValue('--_marker-color'),
      label: root.querySelector('[part="viewport"]').getAttribute('aria-label'),
      imgs: root.querySelectorAll('img:not([part="tiles"] img)').length,
      markerColor: m.markerColor,
    };
    m.data = { markerColor: 'blue"><script>window.__pwned=3</script>' };
    await new Promise((res) => requestAnimationFrame(res));
    const afterBad = root.querySelector('[part="marker"]').style.getPropertyValue('--_marker-color');
    m.data = { markerColor: 'rebeccapurple' };
    const afterGood = root.querySelector('[part="marker"]').style.getPropertyValue('--_marker-color');
    const fill = getComputedStyle(root.querySelector('[part="marker"] .pin')).fill;
    return { ...before, afterBad, afterGood, fill, pwned: /** @type {any} */ (window).__pwned ?? null, scripts: root.querySelectorAll('script').length };
  });
  expect(r.pathFill).toBeNull();
  expect(r.custom).toBe('');
  expect(r.markerColor).toBe('');
  expect(r.label).toBe('Map of <img src=x onerror="window.__pwned=2"> HQ');
  expect(r.imgs).toBe(0);
  expect(r.afterBad).toBe('');
  expect(r.afterGood).toBe('rebeccapurple');
  expect(r.fill).toBe('rgb(102, 51, 153)');
  expect(r.pwned).toBeNull();
  expect(r.scripts).toBe(0);
});

test('default pin colour follows --geo-map-marker-color', async ({ page }) => {
  await load(page, `<geo-map id="m" lat="40.7" lng="-73.9" tile-url="${STUB}" style="--geo-map-marker-color: rgb(1, 2, 3)"></geo-map>`);
  const fill = await page.evaluate(() => getComputedStyle(
    document.getElementById('m').shadowRoot.querySelector('[part="marker"] .pin')).fill);
  expect(fill).toBe('rgb(1, 2, 3)');
});

test('attribution per provider, custom tile-url credit, and slotted credit', async ({ page }) => {
  await load(page, `
    <geo-map id="osm" lat="40.7" lng="-73.9"></geo-map>
    <geo-map id="carto" lat="40.7" lng="-73.9" provider="carto-light"></geo-map>
    <geo-map id="custom" lat="40.7" lng="-73.9" tile-url="${STUB}" attribution="© Example Tiles" attribution-href="https://tiles.example.com/terms"></geo-map>
    <geo-map id="bad" lat="40.7" lng="-73.9" tile-url="${STUB}" attribution="© X" attribution-href="javascript:alert(1)"></geo-map>
    <geo-map id="none" lat="40.7" lng="-73.9" tile-url="${STUB}"></geo-map>
    <geo-map id="slotted" lat="40.7" lng="-73.9" tile-url="${STUB}"><small slot="attribution">© Slotted Co</small></geo-map>`);
  const r = await page.evaluate(() => {
    const info = (id) => {
      const root = document.getElementById(id).shadowRoot;
      const part = root.querySelector('[part="attribution"]');
      const slot = part.querySelector('slot');
      return {
        hidden: part.hidden,
        links: [...part.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]),
        text: part.textContent.trim(),
        assigned: slot.assignedElements().map((e) => e.textContent),
      };
    };
    return Object.fromEntries(['osm', 'carto', 'custom', 'bad', 'none', 'slotted'].map((id) => [id, info(id)]));
  });
  expect(r.osm.links).toEqual([['© OpenStreetMap contributors', 'https://www.openstreetmap.org/copyright']]);
  expect(r.carto.links.map((l) => l[0])).toEqual(['© OpenStreetMap contributors', '© CARTO']);
  expect(r.carto.links[1][1]).toBe('https://carto.com/attributions');
  expect(r.custom.links).toEqual([['© Example Tiles', 'https://tiles.example.com/terms']]);
  expect(r.bad.links).toEqual([]);
  expect(r.bad.text).toBe('© X');
  expect(r.none.hidden).toBe(true);
  expect(r.slotted.hidden).toBe(false);
  expect(r.slotted.assigned).toEqual(['© Slotted Co']);
});

/** Union of tile rects must contain the viewport rect. */
async function coverage(page, id) {
  return page.evaluate((id) => {
    const m = document.getElementById(id);
    const vp = m.shadowRoot.querySelector('[part="viewport"]').getBoundingClientRect();
    const rects = [...m.shadowRoot.querySelectorAll('[part="tiles"] img')].map((i) => i.getBoundingClientRect());
    const minX = Math.min(...rects.map((r) => r.left));
    const minY = Math.min(...rects.map((r) => r.top));
    const maxX = Math.max(...rects.map((r) => r.right));
    const maxY = Math.max(...rects.map((r) => r.bottom));
    return { covers: minX <= vp.left + 0.5 && minY <= vp.top + 0.5 && maxX >= vp.right - 0.5 && maxY >= vp.bottom - 0.5, count: rects.length, w: vp.width };
  }, id);
}

test('resize re-lays out the tiles to cover the box, including hidden → visible', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await load(page, `
    <geo-map id="r" lat="40.7484" lng="-73.9857" zoom="15" tile-url="${STUB}" style="inline-size: 300px; --geo-map-height: 200px"></geo-map>
    <geo-map id="h" lat="40.7484" lng="-73.9857" zoom="15" tile-url="${STUB}" hidden></geo-map>`);
  await ready(page, '#r');
  const small = await coverage(page, 'r');
  expect(small.covers).toBe(true);

  await page.evaluate(() => {
    const m = document.getElementById('r');
    m.style.inlineSize = '1300px';
    m.style.setProperty('--geo-map-height', '700px');
  });
  await page.waitForFunction(() => document.getElementById('r').shadowRoot.querySelectorAll('[part="tiles"] img').length > 9);
  const big = await coverage(page, 'r');
  expect(big.covers).toBe(true);
  expect(big.w).toBe(1300);
  // Centre stays on the coordinate: marker sits at the viewport centre
  const centred = await page.evaluate(() => {
    const root = document.getElementById('r').shadowRoot;
    const vp = root.querySelector('[part="viewport"]').getBoundingClientRect();
    const mk = root.querySelector('[part="marker"]').getBoundingClientRect();
    return Math.abs((mk.left + mk.width / 2) - (vp.left + vp.width / 2)) < 2 && Math.abs(mk.bottom - (vp.top + vp.height / 2)) < 2;
  });
  expect(centred).toBe(true);

  // Hidden map loads nothing until shown
  expect(await page.evaluate(() => document.getElementById('h').shadowRoot.querySelectorAll('[part="tiles"] img').length)).toBe(0);
  await page.evaluate(() => { document.getElementById('h').hidden = false; });
  await ready(page, '#h');
  expect((await coverage(page, 'h')).covers).toBe(true);
});

test('.data setter compares every field and renders once per assignment', async ({ page }) => {
  await load(page, `<geo-map id="d" lat="40.7" lng="-73.9" zoom="12" tile-url="${STUB}"></geo-map>`);
  await ready(page, '#d');
  const r = await page.evaluate(async () => {
    const m = /** @type {any} */ (document.getElementById('d'));
    let renders = 0;
    new MutationObserver((recs) => { renders += recs.length; }).observe(m.shadowRoot, { childList: true });
    const fired = [];
    m.addEventListener('geo-map:data-changed', (e) => fired.push(e.detail));
    m.data = { lat: 51.5, lng: -0.12, zoom: 14, marker: true, markerColor: '#2563eb' };
    await Promise.resolve();
    const afterFull = renders;
    m.data = { lat: 51.5, lng: -0.12, zoom: 14 }; // same — no-op
    await Promise.resolve();
    const afterSame = renders;
    m.data = { markerColor: 'rgb(0, 128, 0)' }; // only the colour changed
    await Promise.resolve();
    return {
      afterFull, afterSame, afterColour: renders, fired: fired.length,
      colour: m.shadowRoot.querySelector('[part="marker"]').style.getPropertyValue('--_marker-color'),
      data: m.data,
    };
  });
  expect(r.afterFull).toBe(1);
  expect(r.afterSame).toBe(1);
  expect(r.afterColour).toBe(2);
  expect(r.fired).toBe(2);
  expect(r.colour).toBe('rgb(0, 128, 0)');
  expect(r.data).toEqual({ lat: 51.5, lng: -0.12, zoom: 14, marker: true, markerColor: 'rgb(0, 128, 0)' });
});

/** Activate via the overlay and wait for interactive mode. */
async function activate(page, id) {
  await page.locator(`#${id}`).locator('[part="overlay"]').click({ position: { x: 20, y: 20 } });
  await page.waitForFunction((id) => document.getElementById(id).active, id);
}

test('on-screen zoom / recenter / exit buttons and keyboard control the map', async ({ page }) => {
  await load(page, `<geo-map id="z" lat="40.7484" lng="-73.9857" zoom="15" tile-url="${STUB}"><address>Empire State Building</address></geo-map>`);
  await ready(page, '#z');
  await page.evaluate(() => {
    /** @type {any} */ (window).moves = [];
    document.getElementById('z').addEventListener('geo-map:move', (e) => /** @type {any} */ (window).moves.push(e.detail));
  });
  await activate(page, 'z');
  const map = page.locator('#z');
  await expect(map.getByRole('button', { name: 'Zoom in' })).toBeVisible();
  await map.getByRole('button', { name: 'Zoom in' }).click();
  await map.getByRole('button', { name: 'Zoom in' }).click();
  await map.getByRole('button', { name: 'Zoom out' }).click();
  let moves = await page.evaluate(() => /** @type {any} */ (window).moves.map((m) => m.zoom));
  expect(moves).toEqual([16, 17, 16]);

  await map.locator('[part="viewport"]').focus();
  await page.keyboard.press('-');
  await page.keyboard.press('ArrowRight');
  moves = await page.evaluate(() => /** @type {any} */ (window).moves);
  expect(moves.at(-2).zoom).toBe(15);
  expect(moves.at(-1).lng).toBeGreaterThan(-73.9857);

  await map.getByRole('button', { name: 'Recenter map' }).click();
  const last = await page.evaluate(() => /** @type {any} */ (window).moves.at(-1));
  expect(last.zoom).toBe(15);
  expect(last.lng).toBeCloseTo(-73.9857, 3);

  // Live region announces (debounced)
  await expect(map.locator('[part="status"]')).toHaveText(/zoom 15/);

  await map.getByRole('button', { name: 'Exit map' }).click();
  expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('z')).active)).toBe(false);
  await expect(map.getByRole('button', { name: 'Activate interactive map' })).toBeFocused();
});

test('interactive mode exposes a named map region with instructions', async ({ page }) => {
  await load(page, `<geo-map id="a" lat="40.7" lng="-73.9" tile-url="${STUB}" data-label-instructions="Utilisez les flèches"><address>Bureau</address></geo-map>`);
  await ready(page, '#a');
  await activate(page, 'a');
  const r = await page.evaluate(() => {
    const root = document.getElementById('a').shadowRoot;
    const vp = root.querySelector('[part="viewport"]');
    const help = root.getElementById(vp.getAttribute('aria-describedby'));
    return {
      role: vp.getAttribute('role'), rd: vp.getAttribute('aria-roledescription'),
      label: vp.getAttribute('aria-label'), help: help?.textContent, focused: root.activeElement === vp,
      live: root.querySelector('[part="status"]').getAttribute('role'),
    };
  });
  expect(r).toEqual({ role: 'region', rd: 'map', label: 'Map of Bureau', help: 'Utilisez les flèches', focused: true, live: 'status' });
});

test('two-pointer pinch zooms in and out', async ({ page }) => {
  await load(page, `<geo-map id="p" lat="40.7484" lng="-73.9857" zoom="15" tile-url="${STUB}"></geo-map>`);
  await ready(page, '#p');
  await activate(page, 'p');
  const zooms = await page.evaluate(() => {
    const m = document.getElementById('p');
    const vp = m.shadowRoot.querySelector('[part="viewport"]');
    const r = vp.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const out = [];
    m.addEventListener('geo-map:move', (e) => out.push(/** @type {CustomEvent} */ (e).detail.zoom));
    const fire = (type, id, x) => vp.dispatchEvent(new PointerEvent(type, {
      pointerId: id, pointerType: 'touch', isPrimary: id === 1, clientX: x, clientY: cy, bubbles: true, cancelable: true, composed: true,
    }));
    // Spread apart: 40px → 100px
    fire('pointerdown', 1, cx - 20); fire('pointerdown', 2, cx + 20);
    for (let d = 20; d <= 50; d += 5) { fire('pointermove', 1, cx - d); fire('pointermove', 2, cx + d); }
    fire('pointerup', 1, cx - 50); fire('pointerup', 2, cx + 50);
    // Pinch together: 100px → 30px
    fire('pointerdown', 1, cx - 50); fire('pointerdown', 2, cx + 50);
    for (let d = 50; d >= 15; d -= 5) { fire('pointermove', 1, cx - d); fire('pointermove', 2, cx + d); }
    fire('pointerup', 1, cx - 15); fire('pointerup', 2, cx + 15);
    return out;
  });
  expect(zooms).toContain(16);
  expect(Math.max(...zooms)).toBeGreaterThanOrEqual(16);
  expect(zooms.at(-1)).toBeLessThan(Math.max(...zooms));
});

test('accessible name comes from address, label, or place — never bare coordinates', async ({ page }) => {
  await load(page, `
    <script type="application/ld+json">{"@type":"Place","name":"The Hi-Dive","geo":{"latitude":39.73,"longitude":-104.98}}</script>
    <geo-map id="addr" lat="40.7" lng="-73.9" tile-url="${STUB}"><address><strong>Empire State</strong>
      Building</address></geo-map>
    <geo-map id="lbl" lat="40.7" lng="-73.9" tile-url="${STUB}" label="Our office"><address>ignored</address></geo-map>
    <geo-map id="place" place="The Hi-Dive" tile-url="${STUB}"></geo-map>
    <geo-map id="bare" lat="40.7" lng="-73.9" tile-url="${STUB}" data-label-map="Carte"></geo-map>`);
  const names = await page.evaluate(() => Object.fromEntries(['addr', 'lbl', 'place', 'bare'].map((id) => [id,
    document.getElementById(id).shadowRoot.querySelector('[part="viewport"]').getAttribute('aria-label')])));
  expect(names).toEqual({ addr: 'Map of Empire State Building', lbl: 'Our office', place: 'Map of The Hi-Dive', bare: 'Carte' });
});

test('activate button name is its visible text (label in name)', async ({ page }) => {
  await load(page, `<geo-map id="b" lat="40.7" lng="-73.9" tile-url="${STUB}" data-label-activate="Explorer la carte"></geo-map>`);
  const btn = page.locator('#b').locator('[part="activate"]');
  await expect(btn).not.toHaveAttribute('aria-label', /.*/);
  await expect(btn).toHaveText('Explorer la carte');
  await expect(page.locator('#b').getByRole('button', { name: 'Explorer la carte' })).toHaveCount(1);
});

test('activation race: double activation creates one interaction; disconnect during import cancels', async ({ page }) => {
  await load(page, `
    <geo-map id="x" lat="40.7" lng="-73.9" tile-url="${STUB}"></geo-map>
    <geo-map id="y" lat="40.7" lng="-73.9" tile-url="${STUB}"></geo-map>`);
  const r = await page.evaluate(async () => {
    const x = document.getElementById('x');
    const y = document.getElementById('y');
    let xActs = 0; let yActs = 0;
    x.addEventListener('geo-map:activate', () => xActs++);
    y.addEventListener('geo-map:activate', () => yActs++);
    const xo = /** @type {HTMLElement} */ (x.shadowRoot.querySelector('[part="overlay"]'));
    xo.click(); xo.click(); xo.click();
    const yo = /** @type {HTMLElement} */ (y.shadowRoot.querySelector('[part="overlay"]'));
    yo.click();
    y.remove();
    await new Promise((res) => setTimeout(res, 300));
    return {
      xActs, yActs,
      xActive: /** @type {any} */ (x).active,
      yActive: /** @type {any} */ (y).active,
      xContainers: x.shadowRoot.querySelectorAll('[part="container"]').length,
    };
  });
  expect(r).toEqual({ xActs: 1, yActs: 0, xActive: true, yActive: false, xContainers: 1 });
});

test('loading="consent" requests no tiles until the user activates', async ({ page }) => {
  const tiles = await load(page, `<geo-map id="c" lat="40.7" lng="-73.9" loading="consent"><address>Consent HQ</address></geo-map>`);
  const map = page.locator('#c');
  await page.waitForSelector('#c[data-upgraded]');
  await page.waitForTimeout(300);
  expect(tiles).toEqual([]);
  await expect(map.locator('[part="consent-note"]')).toHaveText('Loads map images from tile.openstreetmap.org');
  await map.getByRole('button', { name: 'Load map' }).click();
  await page.waitForFunction(() => /** @type {any} */ (document.getElementById('c')).active);
  await expect.poll(() => tiles.length).toBeGreaterThan(0);
  expect(tiles.every((u) => u.startsWith('https://tile.openstreetmap.org/'))).toBe(true);
});

test('carto-auto follows data-mode', async ({ page }) => {
  const tiles = await load(page, `<geo-map id="ca" lat="40.7" lng="-73.9" provider="carto-auto"></geo-map>`, {
    head: '<script>document.documentElement.dataset.mode = "dark";</script>',
  });
  await ready(page, '#ca');
  expect(tiles.some((u) => u.includes('/dark_all/'))).toBe(true);
  const before = tiles.length;
  await page.evaluate(() => { document.documentElement.dataset.mode = 'light'; });
  await expect.poll(() => tiles.slice(before).some((u) => u.includes('/light_all/'))).toBe(true);
});

test('reconnect does not duplicate shadow content, tiles or observers', async ({ page }) => {
  await load(page, `<section id="host"><geo-map id="rc" lat="40.7" lng="-73.9" tile-url="${STUB}"><address>Here</address></geo-map></section>`);
  await ready(page, '#rc');
  const before = await page.evaluate(() => document.getElementById('rc').shadowRoot.querySelectorAll('[part="tiles"] img').length);
  const r = await page.evaluate(async () => {
    const m = document.getElementById('rc');
    const host = document.getElementById('host');
    for (let i = 0; i < 3; i++) { m.remove(); host.append(m); }
    await new Promise((res) => setTimeout(res, 200));
    const root = m.shadowRoot;
    return {
      containers: root.querySelectorAll('[part="container"]').length,
      overlays: root.querySelectorAll('[part="overlay"]').length,
      controls: root.querySelectorAll('[part="controls"]').length,
      tiles: root.querySelectorAll('[part="tiles"] img').length,
      styles: root.adoptedStyleSheets.length + root.querySelectorAll('style').length,
    };
  });
  expect(r).toEqual({ containers: 1, overlays: 1, controls: 1, tiles: before, styles: 1 });
});

test('tile URL templates replace every placeholder, rotate {s}, honour {r}', async ({ page }) => {
  await load(page, '');
  const r = await page.evaluate(async () => {
    const { fillTemplate } = await import('/src/web-components/geo-map/tile-math.js');
    return {
      all: fillTemplate('/{z}/{x}/{y}?z={z}&x={x}', 3, 1, 2, 1),
      subs: [fillTemplate('https://{s}.t/{z}', 1, 0, 0, 1), fillTemplate('https://{s}.t/{z}', 1, 1, 0, 1), fillTemplate('https://{s}.t/{z}', 1, 1, 1, 1)],
      retina: fillTemplate('/{z}/{x}/{y}{r}.png', 1, 0, 0, 2),
      normal: fillTemplate('/{z}/{x}/{y}{r}.png', 1, 0, 0, 1),
    };
  });
  expect(r.all).toBe('/3/1/2?z=3&x=1');
  expect(r.subs).toEqual(['https://a.t/1', 'https://b.t/1', 'https://c.t/1']);
  expect(r.retina).toBe('/1/0/0@2x.png');
  expect(r.normal).toBe('/1/0/0.png');
});

test('a fixed tile URL (compendium stub) reaches data-ready and fires geo-map:ready once', async ({ page }) => {
  await load(page, `<geo-map id="f" lat="40.7484" lng="-73.9857" zoom="15" static-only tile-url="/__geo-tile/stub.svg" attribution="© OpenStreetMap contributors"></geo-map>`);
  await page.evaluate(() => {
    /** @type {any} */ (window).readies = 0;
    document.getElementById('f').addEventListener('geo-map:ready', () => { /** @type {any} */ (window).readies++; });
  });
  await ready(page, '#f');
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => /** @type {any} */ (window).readies)).toBeLessThanOrEqual(1);
  await expect(page.locator('geo-map[data-ready], geo-map[loading=consent][data-upgraded]').first()).toBeAttached();
});

test('eager map activates without stealing focus and stays static after Escape', async ({ page }) => {
  await load(page, `<button id="before">Before</button><geo-map id="e" lat="40.7" lng="-73.9" interactive="eager" tile-url="${STUB}"></geo-map>`);
  await page.locator('#before').focus();
  await page.waitForFunction(() => /** @type {any} */ (document.getElementById('e')).active);
  await expect(page.locator('#before')).toBeFocused();
  await page.locator('#e').locator('[part="viewport"]').focus();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('e')).active)).toBe(false);
});
