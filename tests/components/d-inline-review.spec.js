/**
 * datalist / data / del / ins / dfn — D-element review fixes
 * (vanilla-breeze-c4mc, -8kf7, -8s1z, -rb3n, -o3es).
 *
 * Covers: the datalist arrow only on text-like inputs (range track and
 * colour swatch untouched), RTL arrow side, arrow colour following
 * currentColor in data-mode dark; <data> tabular-nums default + mono
 * opt-in, ticker selector + --vb-ticker-decimals, formatter value
 * handling (no title, empty value, re-format on change); block del/ins
 * auto-detection, data-announce generated content, author reveal;
 * dfn weight in <dt>, CJK dfn/cite upright.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', mode = '', lang = 'en', scripts = [] } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__d-inline-${Math.random().toString(36).slice(2)}.html`;
  const modeAttr = mode ? ` data-mode="${mode}"` : '';
  const imports = scripts.map((s) => `import '${s}';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" dir="${dir}"${modeAttr}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${imports ? `<script type="module">${imports}</script>` : ''}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const pseudo = (page, sel, which, prop) =>
  page.$eval(sel, (el, [w, p]) => getComputedStyle(el, w).getPropertyValue(p), [which, prop]);
const style = (page, sel, prop) =>
  page.$eval(sel, (el, p) => getComputedStyle(el).getPropertyValue(p), prop);

/* ---------------------------------------------------------------- datalist */

const DATALIST = `
  <label for="t">Text</label><input id="t" type="text" list="l">
  <label for="u">Untyped</label><input id="u" list="l">
  <label for="r">Range</label><input id="r" type="range" list="ticks" min="0" max="10">
  <label for="rp">Range plain</label><input id="rp" type="range" min="0" max="10">
  <label for="c">Colour</label><input id="c" type="color" list="pal" value="#ff0000">
  <label for="cp">Colour plain</label><input id="cp" type="color" value="#ff0000">
  <label for="d">Date</label><input id="d" type="date" list="dates">
  <label for="na">No arrow</label><input id="na" type="text" list="l" class="no-arrow">
  <datalist id="l"><option value="A"></option></datalist>
  <datalist id="ticks"><option value="0"></option><option value="10"></option></datalist>
  <datalist id="pal"><option value="#00ff00"></option></datalist>
  <datalist id="dates"><option value="2026-01-01"></option></datalist>`;

test('range and colour inputs with list keep their own styling', async ({ page }) => {
  await load(page, DATALIST);
  // Range track is the range gradient, identical to a range without list
  const rangeBg = await style(page, '#r', 'background-image');
  expect(rangeBg).toBe(await style(page, '#rp', 'background-image'));
  expect(rangeBg).toContain('linear-gradient');
  expect(await style(page, '#r', 'background-size')).toBe(await style(page, '#rp', 'background-size'));
  // Colour swatch padding is unaffected
  for (const prop of ['padding-inline-end', 'padding-inline-start', 'background-image']) {
    expect(await style(page, '#c', prop)).toBe(await style(page, '#cp', prop));
  }
  // Date input gets no arrow
  expect(await style(page, '#d', 'background-image')).toBe('none');
});

test('text-like inputs with list get the arrow; no-arrow removes it', async ({ page }) => {
  await load(page, DATALIST);
  for (const sel of ['#t', '#u']) {
    const bg = await style(page, sel, 'background-image');
    expect(bg).toContain('linear-gradient(45deg');
    expect(bg).toContain('linear-gradient(135deg');
  }
  expect(await style(page, '#na', 'background-image')).toBe('none');
});

test('arrow sits on the inline-end side in RTL', async ({ page }) => {
  await load(page, DATALIST, { dir: 'ltr' });
  const ltr = await style(page, '#t', 'background-position-x');
  await load(page, DATALIST, { dir: 'rtl' });
  const rtl = await style(page, '#t', 'background-position-x');
  expect(ltr).toMatch(/^calc\(100%|^right|100%/);
  expect(rtl).not.toBe(ltr);
  // RTL positions are measured from the left (no 100% term)
  expect(rtl).not.toContain('100%');
});

test('arrow colour follows currentColor in data-mode dark', async ({ page }) => {
  const read = () => page.$eval('#t', (el) => {
    const cs = getComputedStyle(el);
    return { color: cs.color, bg: cs.backgroundImage };
  });
  await load(page, DATALIST, { mode: 'light' });
  const light = await read();
  await load(page, DATALIST, { mode: 'dark' });
  const dark = await read();
  // currentColor resolves to the input's text colour inside the gradient
  expect(light.bg).toContain(light.color);
  expect(dark.bg).toContain(dark.color);
  // and that colour switches with data-mode (the old SVG was fixed grey)
  expect(dark.color).not.toBe(light.color);
});

/* ---------------------------------------------------------------- data */

test('data defaults to tabular-nums in the prose font; mono is opt-in', async ({ page }) => {
  await load(page, `
    <p id="p">Price <data id="d" value="5">5</data>
    <data id="m" value="SKU-1" data-variant="mono">SKU-1</data>
    <data id="tk" value="10" data-effect="ticker">10</data></p>`);
  expect(await style(page, '#d', 'font-variant-numeric')).toBe('tabular-nums');
  expect(await style(page, '#d', 'font-family')).toBe(await style(page, '#p', 'font-family'));
  expect(await style(page, '#m', 'font-family')).not.toBe(await style(page, '#p', 'font-family'));
  expect(await style(page, '#tk', 'font-variant-numeric')).toBe('tabular-nums');
});

test('format-number: no title, empty value left alone, re-formats on value change', async ({ page }) => {
  await load(page, `
    <data id="a" value="1234567" data-format-number data-locale="en-US">1,234,567</data>
    <data id="e" value="" data-format-number data-locale="en-US">n/a</data>
    <data id="b" value="2048" data-format-bytes>2 KB</data>
    <data id="be" value=" " data-format-bytes>unknown</data>`,
  { scripts: ['/src/utils/format-number-init.js', '/src/utils/format-bytes-init.js'] });
  await page.waitForSelector('#a[data-format-number-init]');
  await page.waitForSelector('#b[data-format-bytes-init]');
  expect(await page.$eval('#a', (el) => el.hasAttribute('title'))).toBe(false);
  expect(await page.$eval('#b', (el) => el.hasAttribute('title'))).toBe(false);
  expect(await page.textContent('#e')).toBe('n/a');
  expect(await page.textContent('#be')).toBe('unknown');
  await page.$eval('#a', (el) => el.setAttribute('value', '42.5'));
  await expect(page.locator('#a')).toHaveText('42.5');
  await page.$eval('#b', (el) => el.setAttribute('value', '1048576'));
  await expect(page.locator('#b')).toHaveText('1 MB');
});

test('ticker honours --vb-ticker-decimals', async ({ page }) => {
  await load(page, `<style>#t { --vb-ticker-decimals: 2; }</style><data id="t" value="99" data-effect="ticker">99</data>`,
    { scripts: ['/src/main.js'] });
  await expect(page.locator('#t')).toHaveText('99.00', { timeout: 5000 });
});

/* ---------------------------------------------------------------- del / ins */

test('del/ins wrapping block content become styled blocks', async ({ page }) => {
  await load(page, `
    <del id="d"><p>Removed paragraph.</p></del>
    <ins id="i"><p>Added paragraph.</p></ins>
    <p>Inline <del id="di">x</del></p>`);
  for (const sel of ['#d', '#i']) {
    expect(await style(page, sel, 'display')).toBe('block');
    expect(await style(page, sel, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
    expect(parseFloat(await style(page, sel, 'border-inline-start-width'))).toBeGreaterThan(0);
  }
  // The child paragraph sits fully inside the tinted block
  const inside = await page.$eval('#d', (el) => {
    const a = el.getBoundingClientRect();
    const b = el.querySelector('p').getBoundingClientRect();
    return b.top >= a.top && b.bottom <= a.bottom;
  });
  expect(inside).toBe(true);
  expect(await style(page, '#di', 'display')).toBe('inline');
});

test('data-announce generates start/end text (on the element or an ancestor)', async ({ page }) => {
  await load(page, `
    <p><del id="d" data-announce>old</del></p>
    <section data-announce><p><ins id="i">new</ins></p></section>
    <p><del id="plain">x</del></p>
    <p data-announce><del id="r" data-reason="typo">teh</del></p>`);
  expect(await pseudo(page, '#d', '::before', 'content')).toContain('deletion start');
  expect(await pseudo(page, '#d', '::after', 'content')).toContain('deletion end');
  expect(await pseudo(page, '#i', '::before', 'content')).toContain('insertion start');
  expect(await pseudo(page, '#i', '::after', 'content')).toContain('insertion end');
  // visually hidden
  expect(await pseudo(page, '#d', '::before', 'position')).toBe('absolute');
  expect(await pseudo(page, '#plain', '::before', 'content')).toBe('none');
  // A visible reason tag stays visible and carries the announcement as alt text
  expect(await pseudo(page, '#r', '::before', 'position')).not.toBe('absolute');
  expect(await pseudo(page, '#r', '::before', 'content')).toContain('deletion start');
});

test('data-announce words can be translated with custom properties', async ({ page }) => {
  await load(page, `<style>#w { --del-announce-start: "début de suppression"; }</style>
    <p id="w" data-announce><del id="d">vieux</del></p>`);
  expect(await pseudo(page, '#d', '::before', 'content')).toContain('début de suppression');
});

test('data-author is revealed on keyboard focus', async ({ page }) => {
  await load(page, `<p><ins id="i" data-author="Ana" tabindex="0">new</ins></p>`);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await pseudo(page, '#i', '::after', 'opacity')).toBe('0');
  await page.focus('#i');
  await expect.poll(() => pseudo(page, '#i', '::after', 'opacity')).toBe('1');
  expect(await pseudo(page, '#i', '::after', 'transition-duration')).toBe('0s');
});

/* ---------------------------------------------------------------- dfn */

test('dfn inside dt keeps the dt weight', async ({ page }) => {
  await load(page, `
    <dl><dt id="dt"><dfn id="in-dt">Term</dfn></dt><dd>Def</dd></dl>
    <p><dfn id="prose">Term</dfn> means something.</p>`);
  expect(await style(page, '#in-dt', 'font-weight')).toBe(await style(page, '#dt', 'font-weight'));
  expect(Number(await style(page, '#in-dt', 'font-weight'))).toBeGreaterThanOrEqual(600);
  expect(await style(page, '#prose', 'font-weight')).toBe('500');
  expect(await style(page, '#prose', 'font-style')).toBe('italic');
});

test('CJK dfn and cite are upright with an alternative cue', async ({ page }) => {
  await load(page, `
    <p lang="ja"><dfn id="ja">漸進的強化</dfn>とは<cite id="cj">吾輩は猫である</cite></p>
    <p lang="zh"><cite id="cq" data-variant="quoted">论语</cite></p>
    <p><cite id="en">Moby-Dick</cite></p>`);
  expect(await style(page, '#ja', 'font-style')).toBe('normal');
  expect(Number(await style(page, '#ja', 'font-weight'))).toBeGreaterThanOrEqual(600);
  expect(await style(page, '#cj', 'font-style')).toBe('normal');
  expect(await style(page, '#cj', 'text-decoration-style')).toBe('wavy');
  expect(await style(page, '#cq', 'text-decoration-line')).toBe('none');
  expect(await style(page, '#en', 'font-style')).toBe('italic');
});

test('dfn[id]:target is highlighted', async ({ page }) => {
  await load(page, `<p><dfn id="term-x">X</dfn> is a letter.</p>`);
  await page.evaluate(() => { location.hash = 'term-x'; });
  await expect.poll(() => style(page, '#term-x', 'outline-style')).toBe('solid');
});
