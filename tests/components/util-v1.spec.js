/**
 * util-v1 — format/math utility review fixes (u1-format-math).
 *
 * data-format-date: relative title is the absolute date; datetime / lang /
 *   style changes re-format; clones are formatted; 350 days is "last year";
 *   data-time-zone.
 * data-format-number / data-format-bytes: nearest [lang]; lang and option
 *   changes re-format; clones; localised byte units; negative, sub-byte and
 *   bad precision values.
 * ticker: last frame === static data-format-number output; nearest [lang];
 *   aria-busy while counting; duration capped.
 * data-math: alttext, copy failure announced, clones keep a working copy
 *   button and are not rendered twice, equations numbered in document order.
 * Docs: no unrendered template placeholders, Related sections, no
 *   <div class="example">.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');
const DATE = '/src/utils/format-date-init.js';
const NUMBER = '/src/utils/format-number-init.js';
const BYTES = '/src/utils/format-bytes-init.js';
const MATH = '/src/utils/math-init.js';

async function load(page, body, { modules = [], head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__util-v1-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '${m}';`).join('');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en-US"><head><meta charset="utf-8">${head}
      <script type="module">${imports} window.__ready = true;</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => /** @type {any} */ (window).__ready);
}

/* ------------------------------------------------------------ format-date */

test.describe('data-format-date', () => {
  test('relative title is the absolute date, not the authored placeholder', async ({ page }) => {
    await load(page, `<time id="r" datetime="2026-02-09T10:00:00Z" data-format-date="relative" data-time-zone="UTC">Loading</time>
      <time id="own" title="Mine" datetime="2026-02-09T10:00:00Z" data-format-date="relative">x</time>`,
    { modules: [DATE] });
    const r = page.locator('#r');
    await expect(r).toHaveText(/ago|last|yesterday/);
    const expected = await page.evaluate(() => new Intl.DateTimeFormat('en-US',
      { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date('2026-02-09T10:00:00Z')));
    await expect(r).toHaveAttribute('title', expected);
    await expect(page.locator('#own')).toHaveAttribute('title', 'Mine');
  });

  test('datetime, style and lang changes re-format', async ({ page }) => {
    await load(page, `<section id="s"><time id="d" datetime="2026-02-09" data-format-date="long">x</time></section>`,
      { modules: [DATE] });
    const d = page.locator('#d');
    await expect(d).toHaveText('February 9, 2026');
    await d.evaluate((el) => el.setAttribute('datetime', '2027-03-01'));
    await expect(d).toHaveText('March 1, 2027');
    await d.evaluate((el) => el.setAttribute('data-format-date', 'short'));
    await expect(d).toHaveText('3/1/27');
    await page.locator('#s').evaluate((el) => el.setAttribute('lang', 'de'));
    await expect(d).toHaveText('01.03.27');
  });

  test('a clone with a new datetime is formatted and gets its own refresh', async ({ page }) => {
    await load(page, `<time id="a" datetime="2026-02-09" data-format-date="long">x</time>`, { modules: [DATE] });
    await expect(page.locator('#a')).toHaveText('February 9, 2026');
    await page.evaluate(() => {
      const c = /** @type {Element} */ (document.getElementById('a').cloneNode(true));
      c.id = 'c';
      c.setAttribute('datetime', '2025-12-25');
      c.textContent = 'clone';
      document.body.append(c);
    });
    await expect(page.locator('#c')).toHaveText('December 25, 2025');
  });

  test('350 days ago reads as last year, not 12 months', async ({ page }) => {
    await load(page, '<p id="host"></p>', { modules: [DATE] });
    await page.evaluate(() => {
      const t = document.createElement('time');
      t.id = 't';
      t.setAttribute('datetime', new Date(Date.now() - 350 * 86400000).toISOString());
      t.setAttribute('data-format-date', 'relative');
      document.getElementById('host').append(t);
    });
    await expect(page.locator('#t')).toHaveText('last year');
  });

  test('data-time-zone formats an instant in that zone; a bad zone is ignored', async ({ page }) => {
    await load(page, `
      <time id="p" datetime="2026-02-09T13:30:00Z" data-format-date="medium" data-format-time="short" data-time-zone="Europe/Paris">x</time>
      <time id="bad" datetime="2026-02-09" data-format-date="long" data-time-zone="Nowhere/Land">x</time>`,
    { modules: [DATE] });
    await expect(page.locator('#p')).toHaveText(/2:30\s?PM/);
    await expect(page.locator('#bad')).toHaveText('February 9, 2026');
  });

  test('yearless dates, times and durations are left as written', async ({ page }) => {
    await load(page, `
      <time id="md" datetime="09-22" data-format-date="long">22 September</time>
      <time id="t" datetime="14:30" data-format-date="long">2:30 pm</time>
      <time id="dur" datetime="PT2H" data-format-date="long">2 hours</time>
      <time id="ok" datetime="2026-09-22" data-format-date="long">x</time>`,
    { modules: [DATE] });
    await expect(page.locator('#ok')).toHaveText('September 22, 2026');
    await expect(page.locator('#md')).toHaveText('22 September');
    await expect(page.locator('#t')).toHaveText('2:30 pm');
    await expect(page.locator('#dur')).toHaveText('2 hours');
  });
});

/* ---------------------------------------------------------- format-number */

test.describe('data-format-number', () => {
  test('uses the nearest [lang] and re-formats on lang / option changes', async ({ page }) => {
    await load(page, `<section id="s" lang="de"><data id="n" value="1234567.5" data-format-number>x</data></section>
      <data id="c" value="48200" data-format-number="currency">x</data>`, { modules: [NUMBER] });
    await expect(page.locator('#n')).toHaveText('1.234.567,5');
    await page.locator('#s').evaluate((el) => el.setAttribute('lang', 'en-US'));
    await expect(page.locator('#n')).toHaveText('1,234,567.5');
    await expect(page.locator('#c')).toHaveText('$48,200.00');
    await page.locator('#c').evaluate((el) => el.setAttribute('data-currency', 'EUR'));
    await expect(page.locator('#c')).toHaveText('€48,200.00');
    await page.locator('#c').evaluate((el) => el.setAttribute('data-format-number', 'compact'));
    await expect(page.locator('#c')).toHaveText('48K');
  });

  test('a clone is formatted on insert', async ({ page }) => {
    await load(page, `<data id="a" value="1000" data-format-number>1,000</data>`, { modules: [NUMBER] });
    await expect(page.locator('#a')).toHaveAttribute('data-format-number-init', '');
    await page.evaluate(() => {
      const c = /** @type {Element} */ (document.getElementById('a').cloneNode(true));
      c.id = 'c';
      c.setAttribute('value', '0.995');
      c.setAttribute('data-format-number', 'percent');
      document.body.append(c);
    });
    // Percent rounds to whole numbers by default; data-fraction-digits fixes the decimals
    await expect(page.locator('#c')).toHaveText('100%');
    await page.locator('#c').evaluate((el) => el.setAttribute('data-fraction-digits', '1'));
    await expect(page.locator('#c')).toHaveText('99.5%');
  });
});

/* ----------------------------------------------------------- format-bytes */

test.describe('data-format-bytes', () => {
  test('unit labels are localised by Intl and follow the nearest [lang]', async ({ page }) => {
    await load(page, `
      <data id="en" value="1572864" data-format-bytes="1">x</data>
      <data id="fr" value="1572864" data-format-bytes="1" data-locale="fr">x</data>
      <section lang="de"><data id="de" value="1572864" data-format-bytes="1">x</data></section>
      <data id="dec" value="1500" data-format-bytes="1" data-unit="decimal">x</data>`, { modules: [BYTES] });
    const expected = await page.evaluate(() => ['en-US', 'fr', 'de'].map((l) =>
      new Intl.NumberFormat(l, { style: 'unit', unit: 'megabyte', unitDisplay: 'short', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(1.5)));
    await expect(page.locator('#en')).toHaveText(expected[0]);
    await expect(page.locator('#fr')).toHaveText(expected[1]);
    await expect(page.locator('#fr')).toHaveText(/Mo/);
    await expect(page.locator('#de')).toHaveText(expected[2]);
    await expect(page.locator('#dec')).toHaveText('1.5 kB');
  });

  test('zero, sub-byte, negative and bad precision values do not break', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await load(page, `
      <data id="z" value="0" data-format-bytes>x</data>
      <data id="half" value="0.5" data-format-bytes="1">x</data>
      <data id="neg" value="-1572864" data-format-bytes="1">x</data>
      <data id="p" value="2048" data-format-bytes="-1">x</data>
      <data id="big" value="2048" data-format-bytes="99">x</data>`, { modules: [BYTES] });
    await expect(page.locator('#z')).toHaveText('0 bytes');
    await expect(page.locator('#half')).toHaveText('0.5 bytes');
    await expect(page.locator('#neg')).toHaveText('-1.5 MB');
    await expect(page.locator('#p')).toHaveText('2 kB');
    await expect(page.locator('#big')).toHaveText(/^2\.0{20} kB$/);
    expect(errors).toEqual([]);
  });

  test('a clone is formatted on insert', async ({ page }) => {
    await load(page, `<data id="a" value="1024" data-format-bytes>1 KB</data>`, { modules: [BYTES] });
    await expect(page.locator('#a')).toHaveText('1 kB');
    await page.evaluate(() => {
      const c = /** @type {Element} */ (document.getElementById('a').cloneNode(true));
      c.id = 'c';
      c.setAttribute('value', '1048576');
      document.body.append(c);
    });
    await expect(page.locator('#c')).toHaveText('1 MB');
  });
});

/* ----------------------------------------------------------------- ticker */

test.describe('ticker', () => {
  test('last frame equals the static data-format-number output', async ({ page }) => {
    await load(page, `
      <style>data { --vb-ticker-duration: 200ms; }</style>
      <data id="compact" value="1500000" data-effect="ticker" data-format-number="compact">1.5M</data>
      <data id="pct" value="0.85" data-effect="ticker" data-format-number="percent">85%</data>
      <data id="cur" value="48200" data-effect="ticker" data-format-number="currency" data-currency="USD">$48,200.00</data>
      <section lang="de"><data id="de" value="24521" data-effect="ticker" data-format-number>24.521</data></section>`,
    { head: '<script type="module" src="/src/main.js"></script>' });
    await expect(page.locator('#compact')).toHaveText('1.5M', { timeout: 5000 });
    await expect(page.locator('#pct')).toHaveText('85%');
    await expect(page.locator('#cur')).toHaveText('$48,200.00');
    await expect(page.locator('#de')).toHaveText('24.521');
  });

  test('aria-busy while counting, removed when settled; duration capped at 5s', async ({ page }) => {
    await load(page, `
      <style>#t { --vb-ticker-duration: 1500ms; } #long { --vb-ticker-duration: 60s; }</style>
      <data id="t" value="5000" data-effect="ticker">5,000</data>
      <data id="long" value="10" data-effect="ticker">10</data>`,
    { head: '<script type="module" src="/src/main.js"></script>' });
    await expect(page.locator('#t')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#t')).toHaveText('5,000', { timeout: 5000 });
    await expect(page.locator('#t')).not.toHaveAttribute('aria-busy', /.*/);
    // 60s is capped to 5s
    await expect(page.locator('#long')).toHaveText('10', { timeout: 7000 });
    await expect(page.locator('#long')).not.toHaveAttribute('aria-busy', /.*/);
  });
});

/* --------------------------------------------------------------- data-math */

const EQ = (latex, attrs = '') => `<code data-math="numbered" ${attrs}
  data-mathml="&lt;math&gt;&lt;mi&gt;${latex}&lt;/mi&gt;&lt;/math&gt;">${latex}</code>`;

test.describe('data-math', () => {
  test('rendered <math> gets alttext from the LaTeX source unless it has one', async ({ page }) => {
    await load(page, `<code id="a" data-math data-mathml="&lt;math&gt;&lt;mi&gt;x&lt;/mi&gt;&lt;/math&gt;">x^2</code>
      <code id="b" data-math data-mathml="&lt;math alttext='x squared'&gt;&lt;mi&gt;x&lt;/mi&gt;&lt;/math&gt;">x^2</code>`,
    { modules: [MATH] });
    const alts = await page.$$eval('[data-math-rendered] math', (els) => els.map((m) => m.getAttribute('alttext')));
    expect(alts).toEqual(['x^2', 'x squared']);
  });

  test('a refused copy is announced and shown on the button', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async () => { throw new Error('denied'); } },
      });
      document.execCommand = () => false; // the legacy fallback refuses too
    });
    await load(page, `<code data-math="copyable" data-label-copy-failed="Échec de la copie"
      data-mathml="&lt;math&gt;&lt;mi&gt;x&lt;/mi&gt;&lt;/math&gt;">x</code>`, { modules: [MATH] });
    const button = page.locator('button[data-math-copy]');
    await button.click();
    await expect(page.locator('[data-vb-announcer="assertive"]')).toHaveText('Échec de la copie');
    await expect(button).toHaveAttribute('data-state', 'failed');
    await expect(button).toHaveText('Copy LaTeX', { timeout: 4000 });
  });

  test('a cloned rendered equation keeps a working copy button and is not rendered twice', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (t) => { /** @type {any} */ (window).__copied = t; } },
      });
    });
    await load(page, `<section id="orig"><code data-math="copyable"
      data-mathml="&lt;math&gt;&lt;mi&gt;y&lt;/mi&gt;&lt;/math&gt;">y = mx + b</code></section>`, { modules: [MATH] });
    await expect(page.locator('#orig [data-math-rendered]')).toHaveCount(1);
    await page.evaluate(() => {
      const c = /** @type {Element} */ (document.getElementById('orig').cloneNode(true));
      c.id = 'copy';
      document.body.append(c);
    });
    await page.waitForTimeout(50);
    await expect(page.locator('#copy [data-math-rendered]')).toHaveCount(1);
    await page.locator('#copy button[data-math-copy]').click();
    await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__copied)).toBe('y = mx + b');
    await expect(page.locator('[data-vb-announcer="polite"]')).toHaveText('Copied to clipboard');
  });

  test('equation numbers follow document order across inserts and removals', async ({ page }) => {
    await load(page, `<article id="a">${EQ('a', 'id="eq-a"')}${EQ('b', 'id="eq-b"')}</article>`, { modules: [MATH] });
    const numbers = () => page.$$eval('[data-math-numbered]', (els) => els.map((e) => e.getAttribute('data-equation-number')));
    await expect.poll(numbers).toEqual(['1', '2']);
    // Late insert at the top renumbers the rest
    await page.evaluate((html) => document.getElementById('a').insertAdjacentHTML('afterbegin', html), EQ('z', 'id="eq-z"'));
    await expect.poll(numbers).toEqual(['1', '2', '3']);
    expect(await page.locator('#eq-z').getAttribute('data-equation-number')).toBe('1');
    // Removal closes the gap; the registry follows
    await page.evaluate(() => document.getElementById('eq-z').remove());
    await expect.poll(numbers).toEqual(['1', '2']);
    const registry = await page.evaluate(() => /** @type {any} */ (window).VBMath.equations.map((e) => `${e.id}:${e.number}`));
    expect(registry).toEqual(['eq-a:1', 'eq-b:2']);
  });
});

/* ------------------------------------------------------------------- docs */

const PAGES = ['data-format-date', 'data-format-number', 'data-format-bytes', 'data-math'];

test.describe('attribute docs', () => {
  for (const name of PAGES) {
    test(`${name} page: no template placeholders, Related section, no div examples`, () => {
      const html = readFileSync(join(REPO, 'site/src/pages/docs/attributes', `${name}.html`), 'utf8');
      expect(html).not.toMatch(/\$\{relativeDates/);
      expect(html).not.toMatch(/Loading\.\.\./);
      expect(html).not.toMatch(/<div class="example">/);
      expect(html).toMatch(/<h2>Related<\/h2>/);
    });
  }

  test('data-ticker page points at data-effect="ticker" without inline-style syntax', () => {
    const html = readFileSync(join(REPO, 'site/src/pages/docs/attributes/data-ticker.html'), 'utf8');
    expect(html).toMatch(/\/docs\/attributes\/data-effect\/#ticker/);
    expect(html).not.toMatch(/style="--vb-ticker/);
  });
});

test('relative-time demo stamps real datetimes and formats every time', async ({ page }) => {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__util-v1-relative-demo.html', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: readFileSync(join(REPO, 'demos/examples/demos/format-date-relative.html'), 'utf8'),
  }));
  await page.goto('/__util-v1-relative-demo.html', { waitUntil: 'load' });
  const times = page.locator('time[data-format-date]');
  await expect(times.first()).toHaveAttribute('data-format-date-init', '');
  await expect.poll(() => times.evaluateAll((els) => els.every((t) =>
    !Number.isNaN(Date.parse(t.getAttribute('datetime') ?? '')) && t.title && !/Loading/.test(t.textContent ?? '')))).toBe(true);
  await expect(times.first()).toHaveText('5 minutes ago');
  await expect(times.nth(4)).toHaveText('in 1 hour');
});
