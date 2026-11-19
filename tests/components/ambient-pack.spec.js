/**
 * Ambient pack, in the browser:
 *   - the inline head script sets season, daypart and occasion before the
 *     module runs, corrects baked attributes, and does nothing without the opt-in
 *   - the module keeps state current, expands calendar rules, previews, and
 *     wires the visitor opt-out (also offered by <settings-panel>)
 *   - tokens follow state while primary and text colours stay put, and body
 *     text keeps AA on the washed surface in every state
 *
 * The head script is the built file (dist/cdn/packs/ambient.head.js), inlined
 * as a site would; everything else is the working tree, served from /src.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');
const HEAD = readFileSync(join(REPO, 'dist/cdn/packs/ambient.head.js'), 'utf8');
const AA = 4.5;

/** 28 October 2026, 12:00 UTC: autumn, day. */
const NOON = '2026-10-28T12:00:00Z';

/**
 * @param {import('playwright/test').Page} page
 * @param {object} [opts]
 * @param {string} [opts.html] attributes on <html>
 * @param {object} [opts.config] #ambient-config contents
 * @param {boolean} [opts.module] load the core module
 * @param {string} [opts.body]
 * @param {string} [opts.time] fixed clock
 * @param {string} [opts.query]
 * @param {string} [opts.scheme]
 * @param {string} [opts.head] extra head markup
 * @param {string[]} [opts.modules] extra /src modules
 */
async function load(page, {
  html = 'data-ambient="season daypart weather occasion"', config = { tz: 'UTC' }, module = true, body = '',
  time = NOON, query = '', scheme = 'light', head = '', modules = [],
} = {}) {
  // Reduced motion: the 600 ms token transition is off, so a state can be
  // measured as soon as it is set.
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date(time) });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = '/__ambient-fixture.html';
  const imports = [...modules, ...(module ? ['/src/packs/ambient/ambient.core.js'] : [])];
  await page.route(`**${url}*`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${html}><head><meta charset="utf-8"><title>Ambient fixture</title>
      <script type="application/json" id="ambient-config">${JSON.stringify(config)}</script>
      <script>${HEAD}</script>
      <script>window.__atHead = [...document.documentElement.attributes].map((a) => a.name + '=' + a.value).join(' ');</script>
      <link rel="stylesheet" href="/src/main.css">
      <link rel="stylesheet" href="/src/packs/ambient/ambient.theme.css">
      <link rel="stylesheet" href="/src/packs/ambient/ambient.effects.css">
      ${head}
      ${imports.map((src) => `<script type="module" src="${src}"></script>`).join('\n')}
      </head><body data-ambient-surface><main><p id="text">Body text on the page.</p><hr data-ornament>${body}</main></body></html>`,
  }));
  await page.goto(url + query, { waitUntil: 'load' });
}

const attrs = (page) => page.evaluate(() => Object.fromEntries(
  ['season', 'daypart', 'weather', 'weather-intensity', 'occasion', 'occasion-day', 'occasion-icon']
    .map((n) => [n, document.documentElement.getAttribute(`data-${n}`)]),
));
const ambient = (page, fn, arg) => page.evaluate(async ({ fn, arg }) => {
  const { Ambient } = await import('/src/packs/ambient/ambient.core.js');
  // eslint-disable-next-line no-new-func
  return new Function('Ambient', 'arg', `return (${fn})(Ambient, arg)`)(Ambient, arg);
}, { fn: fn.toString(), arg });

/** A colour custom property or computed colour, as sRGB bytes. */
function rgbOf({ selector, prop }) {
  const el = document.querySelector(selector);
  const probe = document.body.appendChild(document.createElement('i'));
  probe.style.color = prop.startsWith('--') ? `var(${prop})` : getComputedStyle(el)[prop];
  if (prop.startsWith('--')) el.appendChild(probe);
  const css = getComputedStyle(probe).color;
  probe.remove();
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
}
const rgb = (page, selector, prop) => page.evaluate(rgbOf, { selector, prop });
const contrast = (a, b) => {
  const lum = (c) => c.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/* ---------------- head script ---------------- */

test.describe('head script', () => {
  test('sets season and daypart from the clock before the stylesheets, with no module', async ({ page }) => {
    await load(page, { module: false });
    const atHead = await page.evaluate(() => window.__atHead);
    expect(atHead).toContain('data-season=autumn');
    expect(atHead).toContain('data-daypart=day');
    expect(await attrs(page)).toMatchObject({ season: 'autumn', daypart: 'day', weather: null, occasion: null });
  });

  test('corrects attributes a build baked earlier', async ({ page }) => {
    await load(page, { module: false, html: 'data-ambient="season daypart" data-season="summer" data-daypart="night"' });
    expect(await attrs(page)).toMatchObject({ season: 'autumn', daypart: 'day' });
  });

  test('resolves in the configured time zone and hemisphere', async ({ page }) => {
    // 12:00 UTC is 23:00 in Sydney (AEDT), where October is spring
    await load(page, { module: false, config: { tz: 'Australia/Sydney', hemisphere: 'south' } });
    expect(await attrs(page)).toMatchObject({ season: 'spring', daypart: 'night' });
  });

  test('sets only the signals that are enabled', async ({ page }) => {
    await load(page, { module: false, html: 'data-ambient="season" data-daypart="dusk"' });
    expect(await attrs(page)).toMatchObject({ season: 'autumn', daypart: null });
  });

  test('applies dated occasion windows and the day flag', async ({ page }) => {
    const occasions = [
      { id: 'halloween', from: '2026-10-24', to: '2026-10-31', start: '2026-10-31', end: '2026-10-31', p: 50, icon: 'ghost' },
      { id: 'fair', from: '2026-10-28', to: '2026-10-28', start: '2026-10-28', end: '2026-10-28', p: 10, icon: 'star' },
      { id: 'past', from: '2026-09-01', to: '2026-09-02', start: '2026-09-01', end: '2026-09-02' },
    ];
    await load(page, { module: false, config: { tz: 'UTC', occasions }, html: 'data-ambient="occasion" data-occasion="stale"' });
    expect(await attrs(page)).toMatchObject({ occasion: 'halloween fair', 'occasion-day': '', 'occasion-icon': 'ghost' });
  });

  test('leaves baked occasions alone when the config has only rules', async ({ page }) => {
    await load(page, { module: false, config: { tz: 'UTC', calendar: [{ id: 'x', rule: '10-28' }] }, html: 'data-ambient="occasion" data-occasion="baked"' });
    expect((await attrs(page)).occasion).toBe('baked');
  });

  test('a pinned signal is not resolved', async ({ page }) => {
    await load(page, { module: false, config: { tz: 'UTC', pin: { season: 'winter' } } });
    expect(await attrs(page)).toMatchObject({ season: 'winter', daypart: 'day' });
  });

  test('does nothing without data-ambient, with data-ambient="off", or with a broken config', async ({ page }) => {
    await load(page, { module: false, html: 'data-season="summer"' });
    expect((await attrs(page)).season).toBe('summer');
    await load(page, { module: false, html: 'data-ambient="off" data-season="summer"' });
    expect((await attrs(page)).season).toBe('summer');
    await load(page, { module: false, config: { tz: 'Not/AZone' }, html: 'data-ambient="season" data-season="summer"' });
    expect((await attrs(page)).season).toBe('summer');
  });

  test('removes all state for a visitor who opted out', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('vb-ambient', 'off'));
    await load(page, { module: false, html: 'data-ambient="season daypart occasion" data-season="summer" data-occasion="baked" data-occasion-day data-occasion-icon="ghost"' });
    expect(await attrs(page)).toEqual({ season: null, daypart: null, weather: null, 'weather-intensity': null, occasion: null, 'occasion-day': null, 'occasion-icon': null });
  });
});

/* ---------------- module ---------------- */

test.describe('module', () => {
  test('exposes a frozen state and writes no attribute for weather it does not know', async ({ page }) => {
    await load(page);
    const state = await ambient(page, (A) => ({ ...A.state, frozen: Object.isFrozen(A.state) }));
    expect(state).toMatchObject({ season: 'autumn', daypart: 'day', weather: null, intensity: null, occasions: [], occasionDay: false, frozen: true });
    expect(await attrs(page)).toMatchObject({ weather: null, 'weather-intensity': null });
  });

  test('re-resolves once at the next daypart boundary', async ({ page }) => {
    // Autumn sunset is 18:00, so dusk starts at 17:15
    await load(page, { time: '2026-10-28T17:10:00Z' });
    expect((await attrs(page)).daypart).toBe('day');
    await page.evaluate(() => {
      window.__changes = [];
      document.addEventListener('ambient:change', (e) => window.__changes.push(e.detail.changed));
    });
    await page.clock.fastForward('06:00');
    expect((await attrs(page)).daypart).toBe('dusk');
    expect(await page.evaluate(() => window.__changes)).toEqual([['daypart']]);
  });

  test('expands calendar rules after load when the page has no build step', async ({ page }) => {
    const calendar = [{ id: 'halloween', rule: '10-31', lead: 7, priority: 50 }, { id: 'today', rule: '10-28', icon: 'cake' }];
    await load(page, { config: { tz: 'UTC', calendar } });
    await expect(page.locator('html')).toHaveAttribute('data-occasion', 'halloween today');
    await expect(page.locator('html')).toHaveAttribute('data-occasion-day', '');
    await expect(page.locator('html')).toHaveAttribute('data-occasion-icon', 'cake');
  });

  test('built-in calendars: markers by default, others by name', async ({ page }) => {
    await load(page, { time: '2026-12-31T12:00:00Z' });
    await expect(page.locator('html')).toHaveAttribute('data-occasion', 'new-year');
    await expect(page.locator('html')).toHaveAttribute('data-occasion-icon', 'sparkles');


    await load(page, { time: '2026-03-14T12:00:00Z', config: { tz: 'UTC', calendars: ['geek'] } });
    await expect(page.locator('html')).toHaveAttribute('data-occasion', 'pi-day');
    await expect(page.locator('html')).toHaveAttribute('data-occasion-icon', 'pi');
  });

  test('override previews a state, rejects unknown values, and null clears it', async ({ page }) => {
    await load(page);
    await ambient(page, (A) => A.override({ season: 'winter', daypart: 'night', weather: 'snow', intensity: 'heavy', occasions: ['halloween', 'Bad Id'], occasionDay: true }));
    expect(await attrs(page)).toEqual({ season: 'winter', daypart: 'night', weather: 'snow', 'weather-intensity': 'heavy', occasion: 'halloween', 'occasion-day': '', 'occasion-icon': null });
    await ambient(page, (A) => A.override({ season: 'monsoon', weather: 'frogs', intensity: 'heavy' }));
    expect(await attrs(page)).toMatchObject({ season: null, weather: null, 'weather-intensity': null });
    await ambient(page, (A) => A.override(null));
    expect(await attrs(page)).toMatchObject({ season: 'autumn', daypart: 'day', weather: null, occasion: null });
  });

  test('override does not set a signal the author left out', async ({ page }) => {
    await load(page, { html: 'data-ambient="season"' });
    await ambient(page, (A) => A.override({ daypart: 'night', weather: 'rain' }));
    expect(await attrs(page)).toMatchObject({ season: 'autumn', daypart: null, weather: null });
  });

  test('?ambient= previews on localhost', async ({ page }) => {
    await load(page, { query: '?ambient=winter,night,snow,light,halloween' });
    expect(await attrs(page)).toEqual({ season: 'winter', daypart: 'night', weather: 'snow', 'weather-intensity': 'light', occasion: 'halloween', 'occasion-day': '', 'occasion-icon': null });
  });

  test('opt-out button removes state, persists across a reload, and comes back', async ({ page }) => {
    const body = '<button type="button" id="t" data-ambient-toggle aria-pressed="true">Ambient styling</button>';
    await load(page, { body });
    const toggle = page.locator('#t');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(await attrs(page)).toMatchObject({ season: null, daypart: null });
    expect(await page.evaluate(() => localStorage.getItem('vb-ambient'))).toBe('off');

    await page.reload();
    expect(await page.evaluate(() => window.__atHead)).not.toContain('data-season');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(await attrs(page)).toMatchObject({ season: 'autumn', daypart: 'day' });
    expect(await page.evaluate(() => localStorage.getItem('vb-ambient'))).toBeNull();
  });

  test('settings-panel offers the opt-out only on a page that uses the pack', async ({ page }) => {
    const panel = '<settings-panel id="sp"></settings-panel>';
    await load(page, { body: panel, modules: ['/src/web-components/settings-panel/logic.js'] });
    const sw = page.locator('#sp input[data-ambient-pref]');
    await expect(sw).toHaveCount(1);
    await expect(sw).toBeChecked();
    await sw.evaluate((el) => { el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(await attrs(page)).toMatchObject({ season: null, daypart: null });
    expect(await ambient(page, (A) => A.enabled)).toBe(false);

    await page.evaluate(() => localStorage.clear());
    await load(page, { html: '', body: panel, modules: ['/src/web-components/settings-panel/logic.js'] });
    await page.waitForFunction(() => customElements.get('settings-panel'));
    await expect(page.locator('#sp input[data-ambient-pref]')).toHaveCount(0);
  });
});

/* ---------------- tokens ---------------- */

test.describe('tokens', () => {
  test('the accent follows the season; primary and text colours do not move', async ({ page }) => {
    await load(page, { html: '' });
    const plain = { primary: await rgb(page, 'body', '--color-primary'), text: await rgb(page, '#text', 'color'), bg: await rgb(page, 'body', 'backgroundColor') };

    await load(page);
    const seen = new Set();
    for (const season of ['winter', 'spring', 'summer', 'autumn']) {
      await ambient(page, (A, s) => A.override({ season: s }), season);
      expect(await rgb(page, 'body', '--color-primary'), season).toEqual(plain.primary);
      expect(await rgb(page, '#text', 'color'), season).toEqual(plain.text);
      seen.add((await rgb(page, 'body', '--color-ambient')).join());
    }
    expect(seen.size).toBe(4);
    // Autumn is warm: more red than blue
    const [r, , b] = await rgb(page, 'body', '--color-ambient');
    expect(r).toBeGreaterThan(b);
    // The ornament takes the accent
    const ornament = await page.evaluate(() => getComputedStyle(document.querySelector('hr'), '::before').color);
    expect(ornament).not.toBe(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted')));
  });

  test('without data-ambient the page is the plain theme', async ({ page }) => {
    await load(page, { html: '', module: false });
    const plain = {
      bg: await rgb(page, 'body', 'backgroundColor'),
      ambient: await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-ambient')),
      surface: await rgb(page, 'body', '--color-surface'),
    };
    expect(plain.ambient).toBe('');
    expect(plain.bg).toEqual(plain.surface);
  });

  test('data-ambient="off" resets a subtree', async ({ page }) => {
    await load(page, { body: '<section id="off" data-ambient="off"><p>Plain</p></section>' });
    expect(await rgb(page, '#off', '--color-ambient')).toEqual(await rgb(page, 'body', '--color-primary'));
    expect(await rgb(page, 'body', '--color-ambient')).not.toEqual(await rgb(page, 'body', '--color-primary'));
  });

  test('forced colours reset the tokens', async ({ page }) => {
    await load(page);
    const tokens = () => page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return ['--color-ambient', '--color-primary', '--color-ambient-surface', '--color-surface'].map((t) => cs.getPropertyValue(t).trim());
    });
    const [ambientBefore, primaryBefore] = await tokens();
    expect(ambientBefore).not.toBe(primaryBefore);
    // Probed colours are themselves forced, so compare the token values
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    const [ambientNow, primaryNow, surfaceNow, baseSurface] = await tokens();
    expect(ambientNow).toBe(primaryNow);
    expect(surfaceNow).toBe(baseSurface);
  });

  for (const theme of ['default', 'swiss', 'organic', 'terminal']) {
    for (const scheme of ['light', 'dark']) {
      test(`body text keeps AA on the washed surface in every state: ${theme}, ${scheme}`, async ({ page }) => {
        await load(page, {
          scheme,
          html: `data-ambient="season daypart weather" data-mode="${scheme}"${theme === 'default' ? '' : ` data-theme="${theme}"`}`,
          head: theme === 'default' ? '' : `<link rel="stylesheet" href="/cdn/themes/${theme}.css">`,
        });
        for (const season of ['winter', 'spring', 'summer', 'autumn']) {
          for (const daypart of ['dawn', 'day', 'night']) {
            for (const weather of [null, 'rain', 'snow']) {
              await ambient(page, (A, s) => A.override(s), { season, daypart, weather });
              const label = `${season} ${daypart} ${weather}`;
              const ratio = contrast(await rgb(page, '#text', 'color'), await rgb(page, 'body', 'backgroundColor'));
              expect(ratio, label).toBeGreaterThanOrEqual(AA);
            }
          }
        }
        // The wash is there: the background is not the bare surface in at least one state
        await ambient(page, (A) => A.override({ season: 'autumn', daypart: 'day', weather: 'snow' }));
        expect(await rgb(page, 'body', 'backgroundColor')).not.toEqual(await rgb(page, 'body', '--color-surface'));
      });
    }
  }
});

/* ---------------- motifs ---------------- */

test.describe('motifs', () => {
  const SLOTS = '<p id="line">Text <span id="mark" data-ambient-slot="mark" aria-hidden="true"></span></p><hr id="rule" data-ornament data-ambient-slot><section data-ambient="off"><span id="off" data-ambient-slot="mark" aria-hidden="true"></span></section>';
  const mask = (page, sel, pseudo) => page.evaluate(({ sel, pseudo }) => {
    const cs = getComputedStyle(document.querySelector(sel), pseudo || undefined);
    return { display: cs.display, mask: cs.maskImage, width: cs.width, content: cs.content };
  }, { sel, pseudo });
  /** The icon name inside a mask's data URI, by matching the generated tokens. */
  const iconOf = (page, sel, pseudo) => page.evaluate(({ sel, pseudo }) => {
    const image = getComputedStyle(document.querySelector(sel), pseudo || undefined).maskImage;
    const root = getComputedStyle(document.documentElement);
    const names = ['snowflake', 'sprout', 'sun', 'leaf', 'moon', 'cloud', 'drops', 'fog', 'wind', 'storm', 'sparkles', 'cake', 'heart', 'ghost', 'star', 'flag', 'pi', 'gift'];
    const norm = (v) => v.replace(/\s+/g, '').replace(/^url\(["']?|["']?\)$/g, '');
    return names.find((n) => norm(root.getPropertyValue(`--ambient-icon-${n}`)) === norm(image)) || image;
  }, { sel, pseudo });

  test('a mark takes no space without state and shows the season icon with it', async ({ page }) => {
    await load(page, { html: '', module: false, body: SLOTS });
    expect((await mask(page, '#mark')).display).toBe('none');
    expect((await mask(page, '#rule', '::before')).mask).toBe('none');

    await load(page, { body: SLOTS });
    const mark = await mask(page, '#mark');
    expect(mark.display).toBe('inline-block');
    expect(mark.width).toBe(await page.evaluate(() => getComputedStyle(document.querySelector('#line')).fontSize));
    expect(await iconOf(page, '#mark')).toBe('leaf');
    expect(await iconOf(page, '#rule', '::before')).toBe('leaf');
    // The mark is filled with the accent
    expect(await rgb(page, '#mark', 'backgroundColor')).toEqual(await rgb(page, 'body', '--color-ambient'));
  });

  test('icon precedence is occasion, then weather, then season', async ({ page }) => {
    await load(page, { body: SLOTS });
    const set = async (state) => { await ambient(page, (A, s) => A.override(s), state); return iconOf(page, '#mark'); };
    expect(await set({ season: 'winter' })).toBe('snowflake');
    expect(await set({ season: 'spring' })).toBe('sprout');
    expect(await set({ season: 'summer' })).toBe('sun');
    expect(await set({ season: 'summer', weather: 'rain' })).toBe('drops');
    expect(await set({ season: 'summer', weather: 'clear', daypart: 'night' })).toBe('moon');
    expect(await set({ season: 'summer', weather: 'clear', daypart: 'day' })).toBe('sun');
    expect(await set({ season: 'winter', weather: 'fog' })).toBe('fog');
    expect(await set({ season: 'winter', weather: 'storm' })).toBe('storm');
    expect(await set({ season: 'summer', weather: 'rain', occasions: ['party'], occasionIcon: 'cake' })).toBe('cake');
    // An occasion with no icon leaves the weather icon
    expect(await set({ season: 'summer', weather: 'rain', occasions: ['towel-day'] })).toBe('drops');
  });

  test('a subtree that opted out, the tint level, forced colours and print show no motif', async ({ page }) => {
    await load(page, { body: SLOTS });
    expect((await mask(page, '#off')).display).toBe('none');

    await page.evaluate(() => document.documentElement.setAttribute('data-ambient-level', 'tint'));
    expect((await mask(page, '#mark')).display).toBe('none');
    expect((await mask(page, '#rule', '::before')).mask).toBe('none');
    // The tint itself stays
    expect(await rgb(page, 'body', '--color-ambient')).not.toEqual(await rgb(page, 'body', '--color-primary'));
    await page.evaluate(() => document.documentElement.removeAttribute('data-ambient-level'));
    expect((await mask(page, '#mark')).display).toBe('inline-block');

    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    expect((await mask(page, '#mark')).display).toBe('none');
    await page.emulateMedia({ forcedColors: 'none', media: 'print', reducedMotion: 'reduce' });
    expect((await mask(page, '#mark')).display).toBe('none');
    expect((await mask(page, '#rule', '::before')).mask).toBe('none');
  });

  test('a rule without the slot keeps its ornament', async ({ page }) => {
    await load(page, { body: '<hr id="plain" data-ornament>' });
    const plain = await mask(page, '#plain', '::before');
    expect(plain.mask).toBe('none');
    expect(plain.content).not.toBe('""');
  });
});
