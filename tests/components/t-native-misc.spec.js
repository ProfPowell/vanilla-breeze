/**
 * T-review native misc: time[data-format-date], textarea[data-grow],
 * textarea[data-count], video-player captions state.
 *
 * Covers: date-only datetime values never shift a day west of UTC and keep
 * their precision; element-level [lang]; relative refresh survives a
 * remove + reinsert; data-grow starts at rows and scrolls past data-max-rows
 * (field-sizing path) and hides overflow only on the JS fallback; counter
 * text "{count} of {max} characters" via Intl.NumberFormat + data-label-limit;
 * AA warning token; counter and grow refresh on form reset; video-player
 * captions button follows a default captions track.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const VTT = join(REPO, 'demos/snippets/demos/assets/track-captions-en.vtt');

async function load(page, body, { lang = 'en', modules = [], init = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__t3/captions.vtt', (route) => route.fulfill({
    path: VTT, contentType: 'text/vtt',
  }));
  const url = `/__t3-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '${m}';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${init ? `<script>${init}</script>` : ''}
      <script type="module">${imports}</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const FORMAT_DATE = '/src/utils/format-date-init.js';
const GROW = '/src/utils/textarea-grow-init.js';
const COUNT = '/src/utils/textarea-count-init.js';

test.describe('data-format-date', () => {
  test.use({ timezoneId: 'America/Los_Angeles', locale: 'en-US' });

  test('date-only values keep their day and precision west of UTC', async ({ page }) => {
    await load(page, `
      <time id="d" datetime="2026-02-09" data-format-date>Feb 9, 2026</time>
      <time id="full" datetime="2026-02-09" data-format-date="full">x</time>
      <time id="m" datetime="2026-02" data-format-date="long">x</time>
      <time id="y" datetime="2026" data-format-date>x</time>
      <time id="t" datetime="2026-02-09" data-format-date data-format-time="short">x</time>`,
    { modules: [FORMAT_DATE] });
    await expect(page.locator('#d')).toHaveText('Feb 9, 2026');
    await expect(page.locator('#full')).toHaveText('Monday, February 9, 2026');
    await expect(page.locator('#m')).toHaveText('February 2026');
    await expect(page.locator('#y')).toHaveText('2026');
    // A date-only value has no time: data-format-time is ignored.
    await expect(page.locator('#t')).toHaveText('Feb 9, 2026');
    await expect(page.locator('#d')).toHaveAttribute('title', 'Feb 9, 2026');
  });

  test('date-time values still format in the local zone', async ({ page }) => {
    await load(page, `<time id="dt" datetime="2026-02-09T03:00:00Z" data-format-date>x</time>`,
      { modules: [FORMAT_DATE] });
    // 03:00 UTC is the previous evening in Los Angeles.
    await expect(page.locator('#dt')).toHaveText('Feb 8, 2026');
  });

  test('nearest [lang] ancestor sets the locale', async ({ page }) => {
    await load(page, `
      <section lang="de"><time id="de" datetime="2026-02-09" data-format-date="long">x</time></section>
      <time id="en" datetime="2026-02-09" data-format-date="long">x</time>
      <section lang="de"><time id="fr" datetime="2026-02-09" data-format-date="long" data-locale="fr-FR">x</time></section>`,
    { modules: [FORMAT_DATE] });
    await expect(page.locator('#de')).toHaveText('9. Februar 2026');
    await expect(page.locator('#en')).toHaveText('February 9, 2026');
    await expect(page.locator('#fr')).toHaveText('9 février 2026');
  });

  test('relative refresh survives remove + reinsert', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-07-06T12:00:00Z') });
    await load(page, `<ul id="list"><li><time id="r" datetime="2026-07-06T11:59:00Z" data-format-date="relative">x</time></li></ul>`,
      { modules: [FORMAT_DATE] });
    const r = page.locator('#r');
    await expect(r).toHaveText('1 minute ago');
    await page.evaluate(async () => {
      const li = document.querySelector('#list li');
      li.remove();
      await new Promise((res) => queueMicrotask(res));
      await Promise.resolve();
      document.getElementById('list').append(li);
    });
    await expect(r).toHaveAttribute('data-format-date-init', '');
    await page.clock.runFor(5 * 60_000);
    await expect(r).toHaveText('6 minutes ago');
  });
});

test.describe('textarea data-grow', () => {
  test('starts at rows and scrolls past data-max-rows (field-sizing path)', async ({ page }) => {
    await load(page, `<label for="g">Grow</label>
      <textarea id="g" data-grow rows="2" data-max-rows="3"></textarea>`, { modules: [GROW] });
    const g = page.locator('#g');
    await expect(g).toHaveAttribute('data-grow-init', '');
    const m = await g.evaluate((el) => {
      const cs = getComputedStyle(el);
      const lh = parseFloat(cs.lineHeight);
      const chrome = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
        + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
      const start = el.getBoundingClientRect().height;
      /** @type {HTMLTextAreaElement} */ (el).value = Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n');
      const grown = el.getBoundingClientRect().height;
      return {
        fieldSizing: cs.fieldSizing, lh, chrome, start, grown,
        overflowY: getComputedStyle(el).overflowY,
        scrolls: el.scrollHeight > el.clientHeight,
      };
    });
    expect(m.fieldSizing).toBe('content');
    expect(Math.abs(m.start - (2 * m.lh + m.chrome))).toBeLessThan(2);
    expect(Math.abs(m.grown - (3 * m.lh + m.chrome))).toBeLessThan(2);
    expect(m.overflowY).toBe('auto');
    expect(m.scrolls).toBe(true);
  });

  test('JS fallback hides overflow until max rows, then scrolls', async ({ page }) => {
    await load(page, `<label for="g">Grow</label>
      <textarea id="g" data-grow rows="2" data-max-rows="3"></textarea>`,
    { modules: [GROW], init: `CSS.supports = () => false;` });
    const g = page.locator('#g');
    await expect(g).toHaveAttribute('data-grow-init', 'fallback');
    expect(await g.evaluate((el) => getComputedStyle(el).overflowY)).toBe('hidden');
    await g.fill(Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n'));
    expect(await g.evaluate((el) => getComputedStyle(el).overflowY)).toBe('auto');
  });

  test('re-measures after form reset (JS fallback)', async ({ page }) => {
    await load(page, `<form id="f"><label for="g">Grow</label>
      <textarea id="g" data-grow rows="2">short</textarea><button type="reset">Reset</button></form>`,
    { modules: [GROW], init: `CSS.supports = () => false;` });
    const g = page.locator('#g');
    await expect(g).toHaveAttribute('data-grow-init', 'fallback');
    const start = await g.evaluate((el) => el.getBoundingClientRect().height);
    await g.fill(Array.from({ length: 12 }, (_, i) => `line ${i}`).join('\n'));
    const grown = await g.evaluate((el) => el.getBoundingClientRect().height);
    expect(grown).toBeGreaterThan(start + 50);
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect.poll(() => g.evaluate((el) => Math.round(el.getBoundingClientRect().height)))
      .toBe(Math.round(start));
  });
});

test.describe('textarea data-count', () => {
  test('limited counter says what it counts and uses the AA warning token', async ({ page }) => {
    await load(page, `<form-field><label for="c">Bio</label>
      <textarea id="c" maxlength="20" data-count></textarea></form-field>
      <span id="probe-warn" style="color: var(--color-warning-text)">w</span>
      <span id="probe-err" style="color: var(--color-error-text)">e</span>`, { modules: [COUNT] });
    const counter = page.locator('.textarea-counter');
    await expect(counter).toHaveText('0 of 20 characters');
    await page.locator('#c').fill('x'.repeat(17));
    await expect(counter).toHaveText('17 of 20 characters');
    await expect(counter).toHaveAttribute('data-state', 'warning');
    const [warn, probeWarn] = await Promise.all([
      counter.evaluate((el) => getComputedStyle(el).color),
      page.locator('#probe-warn').evaluate((el) => getComputedStyle(el).color),
    ]);
    expect(warn).toBe(probeWarn);
    await page.locator('#c').fill('x'.repeat(20));
    await expect(counter).toHaveAttribute('data-state', 'error');
    const [err, probeErr] = await Promise.all([
      counter.evaluate((el) => getComputedStyle(el).color),
      page.locator('#probe-err').evaluate((el) => getComputedStyle(el).color),
    ]);
    expect(err).toBe(probeErr);
  });

  test('numbers follow the nearest lang and data-label-limit templates', async ({ page }) => {
    await load(page, `<section lang="de">
      <label for="a">A</label><textarea id="a" maxlength="2000" data-count>${'x'.repeat(1234)}</textarea>
      <label for="b">B</label><textarea id="b" maxlength="2000" data-count data-label-limit="{count} von {max} Zeichen">${'x'.repeat(1234)}</textarea>
      <label for="w">W</label><textarea id="w" data-count="words" data-maxwords="1">eins</textarea>
      </section>`, { modules: [COUNT] });
    await expect(page.locator('#a + .textarea-counter')).toHaveText('1.234 of 2.000 characters');
    await expect(page.locator('#b + .textarea-counter')).toHaveText('1.234 von 2.000 Zeichen');
    // The default noun agrees with {max}: one word.
    await expect(page.locator('#w + .textarea-counter')).toHaveText('1 of 1 word');
  });

  test('counter refreshes on form reset and on a dispatched input event', async ({ page }) => {
    await load(page, `<form id="f"><label for="c">Bio</label>
      <textarea id="c" maxlength="10" data-count>abc</textarea><button type="reset">Reset</button></form>`,
    { modules: [COUNT] });
    const counter = page.locator('.textarea-counter');
    await expect(counter).toHaveText('3 of 10 characters');
    await page.locator('#c').fill('abcdefghi');
    await expect(counter).toHaveText('9 of 10 characters');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(counter).toHaveText('3 of 10 characters');
    await expect(counter).not.toHaveAttribute('data-state', 'warning');
    await page.locator('#c').evaluate((el) => {
      /** @type {HTMLTextAreaElement} */ (el).value = 'abcdef';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(counter).toHaveText('6 of 10 characters');
  });
});

test.describe('video-player captions', () => {
  const PLAYER = (attrs = '') => `<video-player ${attrs}>
      <video><track kind="captions" src="/__t3/captions.vtt" srclang="en" label="English" default></video>
    </video-player>`;

  test('a default captions track starts pressed; first click turns captions off', async ({ page }) => {
    await load(page, PLAYER(), { modules: ['/src/web-components/video-player/logic.js'] });
    await page.waitForSelector('video-player[data-upgraded]');
    const btn = page.locator('video-player').locator('.captions-btn');
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('video-player')).toHaveAttribute('captions', '');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('video-player')).not.toHaveAttribute('captions', '');
    expect(await page.evaluate(() => document.querySelector('video').textTracks[0].mode)).toBe('hidden');
  });

  test('[captions] turns on a static non-default track', async ({ page }) => {
    await load(page, `<video-player captions>
      <video><track kind="captions" src="/__t3/captions.vtt" srclang="en" label="English"></video>
    </video-player>`, { modules: ['/src/web-components/video-player/logic.js'] });
    await page.waitForSelector('video-player[data-upgraded]');
    await expect(page.locator('video-player .captions-btn')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.querySelector('video').textTracks[0].mode)).toBe('showing');
  });
});
