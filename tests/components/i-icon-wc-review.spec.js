/**
 * icon-wc — review fixes (vanilla-breeze-9vrm).
 *
 * Covers: stale fetches dropped when name changes mid-flight; label added or
 * removed after load (both directions); filled sets paint with the file's own
 * fill; fetched SVG sanitized; ancestor data-icon-set respected + live change;
 * data-icon-path live change; negative cache; set manifest consulted before
 * fetching; opt-in RTL mirroring; reconnect neither refetches nor rebuilds.
 *
 * Tests the working tree: /src is served from disk, /cdn/icons from src/icons
 * (with set manifests generated from the directory listing).
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');
const ICONS = join(REPO, 'src', 'icons');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ html?: string, svgs?: Record<string, { body: string, delay?: number }> }} [opts]
 * @returns {Promise<string[]>} live list of requested /cdn/icons paths
 */
async function load(page, body, { html = '', svgs = {} } = {}) {
  /** @type {string[]} */
  const requests = [];
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/cdn/icons/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    requests.push(pathname);
    const rel = pathname.slice(pathname.indexOf('/cdn/icons/') + '/cdn/icons/'.length);
    const fixture = svgs[rel];
    if (fixture) {
      if (fixture.delay) await new Promise((r) => setTimeout(r, fixture.delay));
      return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: fixture.body });
    }
    const manifest = rel.match(/^([\w-]+)\.json$/);
    if (manifest) {
      const dir = join(ICONS, manifest[1]);
      if (!existsSync(dir)) return route.fulfill({ status: 404, body: '' });
      const names = readdirSync(dir).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4));
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(names) });
    }
    const file = join(ICONS, rel);
    if (!rel.endsWith('.svg') || !existsSync(file)) return route.fulfill({ status: 404, body: 'nope' });
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', path: file });
  });
  const url = `/__icon-wc-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${html}><head><meta charset="utf-8">
      <script type="module">import '/src/web-components/icon-wc/icon-wc.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('icon-wc'));
  return requests;
}

/** @param {import('playwright/test').Page} page @param {string} sel */
const svgOf = (page, sel) => page.waitForFunction(
  (s) => document.querySelector(s)?.shadowRoot?.querySelector('svg') ? true : null, sel,
);

const count = (reqs, suffix) => reqs.filter((r) => r.endsWith(suffix)).length;

test('name change mid-fetch drops the stale result', async ({ page }) => {
  await load(page, '<icon-wc id="i"></icon-wc>', {
    svgs: {
      'lucide/slow.svg': { body: '<svg xmlns="http://www.w3.org/2000/svg" data-n="slow" viewBox="0 0 24 24"></svg>', delay: 600 },
      'lucide/fast.svg': { body: '<svg xmlns="http://www.w3.org/2000/svg" data-n="fast" viewBox="0 0 24 24"></svg>' },
    },
  });
  await page.evaluate(() => {
    const i = document.getElementById('i');
    i.setAttribute('name', 'slow');
    setTimeout(() => i.setAttribute('name', 'fast'), 50);
  });
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => {
    const svgs = document.getElementById('i').shadowRoot.querySelectorAll('svg');
    return { n: svgs.length, which: svgs[0]?.getAttribute('data-n') };
  });
  expect(r).toEqual({ n: 1, which: 'fast' });
});

test('label toggles role/aria-label/aria-hidden in both directions', async ({ page }) => {
  await load(page, '<icon-wc id="i" name="star"></icon-wc><icon-wc id="j" name="star" label="Favourite"></icon-wc>');
  await svgOf(page, '#i');
  await svgOf(page, '#j');
  const read = (id) => page.evaluate((x) => {
    const svg = document.getElementById(x).shadowRoot.querySelector('svg');
    return { role: svg.getAttribute('role'), label: svg.getAttribute('aria-label'), hidden: svg.getAttribute('aria-hidden') };
  }, id);
  const decorative = { role: null, label: null, hidden: 'true' };
  const named = (l) => ({ role: 'img', label: l, hidden: null });

  expect(await read('i')).toEqual(decorative);
  expect(await read('j')).toEqual(named('Favourite'));
  await page.evaluate(() => document.getElementById('i').setAttribute('label', 'Starred'));
  expect(await read('i')).toEqual(named('Starred'));
  await page.evaluate(() => document.getElementById('i').removeAttribute('label'));
  expect(await read('i')).toEqual(decorative);
  await page.evaluate(() => document.getElementById('j').removeAttribute('label'));
  expect(await read('j')).toEqual(decorative);
});

test('filled sets paint with fill; stroked sets keep their strokes', async ({ page }) => {
  await load(page, `<p style="color: rgb(200, 0, 0)">
    <icon-wc id="ph" set="phosphor" name="bell"></icon-wc>
    <icon-wc id="bo" set="bold" name="bell"></icon-wc>
    <icon-wc id="lu" name="bell"></icon-wc>
    <icon-wc id="ta" set="tabler" name="bell"></icon-wc>
    <icon-wc id="ma" set="mage" name="bell"></icon-wc></p>`);
  for (const id of ['ph', 'bo', 'lu', 'ta', 'ma']) await svgOf(page, `#${id}`);
  const paint = await page.evaluate(() => Object.fromEntries(['ph', 'bo', 'lu', 'ta', 'ma'].map((id) => {
    const svg = document.getElementById(id).shadowRoot.querySelector('svg');
    const path = svg.querySelector('path');
    const cs = getComputedStyle(path);
    return [id, { fill: cs.fill, stroke: cs.stroke }];
  })));
  const red = 'rgb(200, 0, 0)';
  expect(paint.ph).toEqual({ fill: red, stroke: 'none' });
  expect(paint.bo).toEqual({ fill: red, stroke: 'none' });
  expect(paint.lu).toEqual({ fill: 'none', stroke: red });
  expect(paint.ta.stroke).toBe(red);
  expect(paint.ma.stroke).toBe(red);
});

test('fetched SVG is sanitized before insertion', async ({ page }) => {
  const evil = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" onload="window.__pwned='root'">
    <script>window.__pwned='script'</script>
    <image href="data:x" onerror="window.__pwned='image'"/>
    <foreignObject width="10" height="10"><img xmlns="http://www.w3.org/1999/xhtml" src="data:x" onerror="window.__pwned='fo'"/></foreignObject>
    <a href="javascript:window.__pwned='a'" xlink:href="javascript:window.__pwned='xa'"><path d="M0 0h24v24H0z"/></a>
  </svg>`;
  await load(page, '<icon-wc id="i" name="evil"></icon-wc>', { svgs: { 'lucide/evil.svg': { body: evil } } });
  await svgOf(page, '#i');
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const svg = document.getElementById('i').shadowRoot.querySelector('svg');
    const all = [svg, ...svg.querySelectorAll('*')];
    return {
      pwned: /** @type {any} */ (window).__pwned ?? null,
      bad: svg.querySelectorAll('script, foreignObject').length,
      handlers: all.flatMap((el) => [...el.attributes].filter((a) => a.name.startsWith('on')).map((a) => a.name)),
      jsHrefs: all.flatMap((el) => [...el.attributes].filter((a) => /href$/.test(a.name) && /javascript:/i.test(a.value)).map((a) => a.name)),
      path: !!svg.querySelector('path'),
    };
  });
  expect(r).toEqual({ pwned: null, bad: 0, handlers: [], jsHrefs: [], path: true });
});

test('ancestor data-icon-set is respected and re-resolved live', async ({ page }) => {
  const reqs = await load(page, '<section id="s" data-icon-set="phosphor"><icon-wc id="i" name="bell"></icon-wc></section><icon-wc id="o" name="bell"></icon-wc>');
  await svgOf(page, '#i');
  await svgOf(page, '#o');
  expect(await page.evaluate(() => document.getElementById('i').set)).toBe('phosphor');
  expect(count(reqs, '/phosphor/bell.svg')).toBe(1);
  await page.evaluate(() => document.getElementById('s').setAttribute('data-icon-set', 'tabler'));
  await page.waitForFunction(() => document.getElementById('i').shadowRoot.querySelector('svg')?.getAttribute('stroke') === 'currentColor');
  expect(count(reqs, '/tabler/bell.svg')).toBe(1);
  // The icon outside the section is untouched: still one lucide request
  expect(count(reqs, '/lucide/bell.svg')).toBe(1);
});

test('<html data-icon-path> sets the base and is re-resolved live', async ({ page }) => {
  const reqs = await load(page, '<icon-wc id="i" name="star"></icon-wc>', { html: 'data-icon-path="/vb/cdn/icons"' });
  await svgOf(page, '#i');
  expect(reqs).toContain('/vb/cdn/icons/lucide/star.svg');
  expect(await page.evaluate(() => document.getElementById('i').iconPath)).toBe('/vb/cdn/icons/lucide/star.svg');
  await page.evaluate(() => document.documentElement.setAttribute('data-icon-path', '/alt/cdn/icons'));
  await expect.poll(() => reqs.includes('/alt/cdn/icons/lucide/star.svg')).toBe(true);
});

test('misses are negative-cached: one request per missing icon', async ({ page }) => {
  const reqs = await load(page, '<icon-wc name="no-such-icon"></icon-wc><icon-wc name="no-such-icon"></icon-wc>');
  await page.waitForFunction(() => document.querySelectorAll('icon-wc[data-error]').length === 2);
  await page.evaluate(() => {
    const i = document.createElement('icon-wc');
    i.id = 'late';
    i.setAttribute('name', 'no-such-icon');
    document.querySelector('main').append(i);
  });
  await page.waitForSelector('#late[data-error]');
  expect(count(reqs, '/lucide/no-such-icon.svg')).toBe(1);
});

test('set manifest is consulted once; names absent from it go straight to Lucide', async ({ page }) => {
  const reqs = await load(page, '<icon-wc id="a" set="phosphor" name="check"></icon-wc><icon-wc id="b" set="phosphor" name="check"></icon-wc><icon-wc id="c" set="phosphor" name="star"></icon-wc>');
  for (const id of ['a', 'b', 'c']) await svgOf(page, `#${id}`);
  expect(count(reqs, '/phosphor.json')).toBe(1);
  expect(count(reqs, '/phosphor/check.svg')).toBe(0);
  expect(count(reqs, '/lucide/check.svg')).toBe(1);
  expect(count(reqs, '/phosphor/star.svg')).toBe(1);
  expect(await page.evaluate(() => document.getElementById('a').hasAttribute('data-error'))).toBe(false);
});

test('data-flip-rtl mirrors the glyph only in RTL', async ({ page }) => {
  await load(page, `<p dir="rtl"><icon-wc id="rf" name="arrow-right" data-flip-rtl></icon-wc><icon-wc id="rn" name="arrow-right"></icon-wc></p>
    <p dir="ltr"><icon-wc id="lf" name="arrow-right" data-flip-rtl></icon-wc></p>`);
  for (const id of ['rf', 'rn', 'lf']) await svgOf(page, `#${id}`);
  const t = await page.evaluate(() => Object.fromEntries(['rf', 'rn', 'lf'].map((id) => [
    id, getComputedStyle(document.getElementById(id).shadowRoot.querySelector('svg')).transform,
  ])));
  expect(t).toEqual({ rf: 'matrix(-1, 0, 0, 1, 0, 0)', rn: 'none', lf: 'none' });
});

test('reconnect keeps the rendered svg and does not refetch', async ({ page }) => {
  const reqs = await load(page, '<icon-wc id="i" name="star" label="Star"></icon-wc><p id="p"></p>');
  await svgOf(page, '#i');
  const before = reqs.length;
  const r = await page.evaluate(() => {
    const i = document.getElementById('i');
    const svg = i.shadowRoot.querySelector('svg');
    document.getElementById('p').append(i);
    const afterMove = i.shadowRoot.querySelector('svg');
    return { same: svg === afterMove, upgraded: i.hasAttribute('data-upgraded'), label: afterMove?.getAttribute('aria-label') };
  });
  await page.waitForTimeout(200);
  expect(r).toEqual({ same: true, upgraded: true, label: 'Star' });
  expect(reqs.length).toBe(before);
});

test('set change swaps the svg in place without a rebuild', async ({ page }) => {
  await load(page, '<icon-wc id="i" name="bell"></icon-wc>');
  await svgOf(page, '#i');
  const r = await page.evaluate(async () => {
    const i = document.getElementById('i');
    const style = i.shadowRoot.querySelector('style');
    i.setAttribute('set', 'phosphor');
    // The old glyph stays until the new one arrives
    const during = i.shadowRoot.querySelectorAll('svg').length;
    await new Promise((res) => {
      const t = setInterval(() => {
        if (i.shadowRoot.querySelector('svg')?.getAttribute('fill') === 'currentColor') { clearInterval(t); res(); }
      }, 20);
    });
    return { during, sameStyle: style === i.shadowRoot.querySelector('style'), svgs: i.shadowRoot.querySelectorAll('svg').length };
  });
  expect(r).toEqual({ during: 1, sameStyle: true, svgs: 1 });
});
