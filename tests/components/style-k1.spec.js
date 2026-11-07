/**
 * Styling attributes — data-numbered / data-section-numbers, data-drop-cap,
 * data-prose, data-ornament (style review S1, fix agent K1).
 *
 * Asserts what is painted, not custom-property values: counter prefixes by
 * their painted width (see PROBE), drop caps and floats through layout boxes
 * and the resolved ::first-letter colour, across light/dark, RTL and the
 * organic/swiss/editorial themes.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', theme = '', mode = 'light', lang = 'en' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__style-k1-${Math.random().toString(36).slice(2)}.html`;
  const themeLink = theme ? `<link rel="stylesheet" href="/src/tokens/themes/_extreme-${theme}.css">` : '';
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" dir="${dir}" data-mode="${mode}"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${themeLink}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
}

/*
 * Counters cannot be read from script, and Chromium leaves counter values out
 * of accessible names. So the probe sets --numbered-style/--numbered-sub-style
 * to an additive counter style that paints the value N as N "x"s, aligns the
 * labelled elements to the start, and measures each ::before by where the
 * element's first real character lands; that offset is compared with the
 * width of the expected prefix in the ::before's own font.
 */
const PROBE = `<style>
  @counter-style k1-probe { system: additive; additive-symbols: 1 "x"; }
  .probe { --numbered-style: k1-probe; --numbered-sub-style: k1-probe; }
  .probe :is(h2, h3, h4, figcaption, caption) { text-align: start !important; text-indent: 0 !important; }
</style>`;

/** Painted ::before prefixes, in document order, as the expected string they match (or the raw offset). */
async function prefixes(page, selector, candidates) {
  return page.locator(selector).evaluateAll((els, cands) => els.map((el) => {
    const cs = getComputedStyle(el);
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
    });
    const t = walker.nextNode();
    const i = t.textContent.search(/\S/);
    const r = document.createRange();
    r.setStart(t, i);
    r.setEnd(t, i + 1);
    const c = r.getClientRects()[0];
    const b = el.getBoundingClientRect();
    const rtl = cs.direction === 'rtl';
    const offset = rtl
      ? (b.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight)) - c.right
      : c.left - (b.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft));
    if (offset < 0.5) return '';
    const ps = getComputedStyle(el, '::before');
    const width = (text) => {
      const span = document.createElement('span');
      for (const k of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'wordSpacing',
        'fontVariantNumeric', 'fontFeatureSettings', 'textTransform', 'fontStretch']) span.style[k] = ps[k];
      span.style.whiteSpace = 'pre';
      span.textContent = text;
      el.append(span);
      const w = span.getBoundingClientRect().width;
      span.remove();
      return w;
    };
    const hit = cands.find((cand) => Math.abs(width(cand) - offset) < 0.6);
    return hit ?? `?${offset.toFixed(1)}`;
  }), candidates);
}

const NB = ' ';
const x = (n) => 'x'.repeat(n);
const SECTIONED = `${PROBE}
  <article data-numbered class="probe">
    <h2>Intro</h2>
    <section>
      <h2>In section</h2>
      <h3>Sub</h3>
      <aside><h3>Aside note</h3><p>x</p></aside>
      <h3>Sub two</h3>
      <figure><img alt="one" width="40" height="20" src="data:,"><figcaption>One</figcaption></figure>
      <figure><img alt="uncaptioned" width="40" height="20" src="data:,"></figure>
    </section>
    <section>
      <h2>After</h2>
      <table><caption>Data</caption><tr><td>1</td></tr></table>
      <table><tr><td>uncaptioned</td></tr></table>
      <table><caption>More</caption><tr><td>2</td></tr></table>
      <figure>
        <figure><img alt="b" width="40" height="20" src="data:,"><figcaption>Before</figcaption></figure>
        <figure><img alt="a" width="40" height="20" src="data:,"><figcaption>After</figcaption></figure>
        <figcaption>Pair</figcaption>
      </figure>
    </section>
  </article>`;

const h = (...n) => `${n.map(x).join('.')}.${NB}`;
const HEADINGS = [h(1), h(2), h(2, 1), '', h(2, 2), h(3)];

for (const theme of ['', 'organic', 'editorial']) {
  test(`data-numbered counts across sections and asides (${theme || 'default'})`, async ({ page }) => {
    await load(page, SECTIONED, { theme });
    const cands = [...new Set([...HEADINGS, h(1, 1), h(1, 2), h(2), h(2, 3)])].filter(Boolean);
    expect(await prefixes(page, 'article :is(h2, h3)', cands)).toEqual(HEADINGS);
    const fig = (n) => `Figure${NB}${x(n)}:${NB}`;
    const tab = (n) => `Table${NB}${x(n)}:${NB}`;
    const sub = (n) => `(${x(n)})${NB}`;
    expect(await prefixes(page, 'article table > caption', [tab(1), tab(2), tab(3)])).toEqual([tab(1), tab(2)]);
    expect(await prefixes(page, 'article figure:not(figure figure) > figcaption', [fig(1), fig(2), fig(3)]))
      .toEqual([fig(1), fig(2)]);
    expect(await prefixes(page, 'article figure figure > figcaption', [sub(1), sub(2), sub(3)]))
      .toEqual([sub(1), sub(2)]);
    // Sections inside the numbered article are no longer query containers.
    const ct = await page.locator('article section').first().evaluate((el) => getComputedStyle(el).containerType);
    expect(ct).toBe('normal');
    expect(await page.locator('article').first().evaluate((el) => getComputedStyle(el).containerType)).toBe('normal');
  });
}

test('sections outside numbered articles stay query containers', async ({ page }) => {
  await load(page, '<article><section><h2>x</h2></section></article>');
  const ct = await page.locator('section').evaluate((el) => getComputedStyle(el).containerType);
  expect(ct).toBe('inline-size');
});

test('data-numbered: --numbered-style paints other numerals (RTL)', async ({ page }) => {
  await load(page, `
    <article data-numbered lang="ar" dir="rtl" class="ar">
      <section><h2>أ</h2><h3>ب</h3></section><section><h2>ج</h2></section>
    </article>
    <style>.ar { --numbered-style: arabic-indic; } .ar :is(h2, h3) { text-align: start !important; }</style>`);
  const cands = [`١.${NB}`, `٢.${NB}`, `١.١.${NB}`, `1.${NB}`, `2.${NB}`, `1.1.${NB}`];
  expect(await prefixes(page, 'article :is(h2, h3)', cands)).toEqual([`١.${NB}`, `١.١.${NB}`, `٢.${NB}`]);
});

test('data-section-numbers counts across sections, skips asides', async ({ page }) => {
  await load(page, `${PROBE}
    <article data-section-numbers class="probe">
      <section><h2>Definitions</h2><h3>Account</h3><aside><h2>Note</h2></aside><h3>Content</h3></section>
      <section><h2>Use</h2><h3>Limits</h3></section>
    </article>`);
  const sec = (a, b = 0) => `§${NB}${x(a)}${x(b)} `;
  // "xx" (§2) and "x"+"x" (§1b) paint alike, so h2 and h3 are probed separately.
  expect(await prefixes(page, 'article h2', [sec(1), sec(2), sec(3)])).toEqual([sec(1), '', sec(2)]);
  expect(await prefixes(page, 'article h3', [sec(1, 1), sec(1, 2), sec(2, 1), sec(1, 3)]))
    .toEqual([sec(1, 1), sec(1, 2), sec(2, 1)]);
});

/* ---------------------------------------------------------------- drop cap */

const PARA = 'The night shift ended late. When the first rays of morning light crept through the cathedral windows, they illuminated row upon row of hand-set lead type, each letter cast in reverse and locked into its chase, and the compositors rested at last, their aprons black with ink and their hands sore from the cases, while the press stood ready.';

/**
 * Painted drop cap, read from the text after the first letter: a cap pushes
 * the first lines away from the edge it sits on. Returns how many lines are
 * indented and on which side.
 */
async function capBox(page, sel) {
  return page.locator(sel).evaluate((p) => {
    const text = [...p.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    const start = text.textContent.search(/\S/);
    const r = document.createRange();
    r.setStart(text, start + 1);
    r.setEnd(text, text.textContent.length);
    const b = p.getBoundingClientRect();
    // One rect per line (merge fragments that share a top).
    const lines = [];
    for (const rect of r.getClientRects()) {
      const same = lines.find((l) => Math.abs(l.top - rect.top) < 2);
      if (same) { same.left = Math.min(same.left, rect.left); same.right = Math.max(same.right, rect.right); }
      else lines.push({ top: rect.top, left: rect.left, right: rect.right });
    }
    lines.sort((x, y) => x.top - y.top);
    const startIndent = lines.map((l) => Math.round(l.left - b.left));
    const endIndent = lines.map((l) => Math.round(b.right - l.right));
    const fl = getComputedStyle(p, '::first-letter');
    return {
      lines: lines.length, startIndent, endIndent,
      float: fl.float, initialLetter: fl.initialLetter, color: fl.color,
    };
  });
}

/** Resolved colour of a token in the page's context. */
async function tokenColor(page, token, within = 'article') {
  return page.locator(within).first().evaluate((el, t) => {
    const probe = document.createElement('i');
    probe.style.color = `var(${t})`;
    el.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, token);
}

const EXPECTED_CAP_COLOR = { '': '--color-primary', organic: '--color-primary', editorial: '--color-primary', swiss: '--color-text' };

for (const theme of ['', 'organic', 'swiss', 'editorial']) {
  for (const mode of ['light', 'dark']) {
    for (const dir of ['ltr', 'rtl']) {
      test(`data-drop-cap: ${theme || 'default'} ${mode} ${dir}`, async ({ page }) => {
        await load(page, `
          <article id="with" data-drop-cap><p>${PARA}</p></article>
          <article id="without"><p>${PARA}</p></article>
          <style>#with, #without { inline-size: 26rem; max-inline-size: 26rem; }</style>`, { theme, mode, dir });
        const cap = await capBox(page, '#with > p');
        const plain = await capBox(page, '#without > p');
        const capSide = dir === 'ltr' ? cap.startIndent : cap.endIndent;
        const plainSide = dir === 'ltr' ? plain.startIndent : plain.endIndent;
        expect(cap.lines).toBeGreaterThan(4);
        // The cap pushes the first lines (not just the first) in from the inline start…
        expect(capSide[1]).toBeGreaterThan(15);
        // …and later lines run flush again.
        expect(Math.abs(capSide[cap.lines - 1])).toBeLessThan(3);
        // Without the attribute no theme adds a cap: the second line starts flush.
        expect(Math.abs(plainSide[1])).toBeLessThan(3);
        expect(plain.float).toBe('none');
        // initial-letter path: no physical float from the theme.
        expect(cap.initialLetter).not.toBe('normal');
        expect(cap.float).toBe('none');
        // Painted colour follows the theme's hook in this mode.
        expect(cap.color).toBe(await tokenColor(page, EXPECTED_CAP_COLOR[theme], '#with'));
      });
    }
  }
}

test('data-drop-cap: --drop-cap-lines and fallback float are logical', async ({ page }) => {
  await load(page, `
    <article id="two" data-drop-cap class="two"><p>${PARA}</p></article>
    <style>.two { --drop-cap-lines: 2; }</style>`);
  const two = await page.locator('#two > p').evaluate((p) => getComputedStyle(p, '::first-letter').initialLetter);
  expect(two.startsWith('2')).toBe(true);
});

/* ------------------------------------------------------------------- prose */

const IMG = '<img src="/src/assets/placeholders/photo-article-prose-1-300x200.svg" alt="Meadow" width="300" height="200">';
const PROSE_TEXT = 'The alpine meadows above the treeline host an extraordinary diversity of wildflowers during the brief summer season, and botanists have catalogued hundreds of species there.';

for (const dir of ['ltr', 'rtl']) {
  test(`data-prose floats an image that shares its paragraph with text (${dir})`, async ({ page }) => {
    await load(page, `<article data-prose><p id="p">${IMG} ${PROSE_TEXT}</p></article>`, { dir });
    await page.locator('#p img').evaluate((img) => img.decode());
    const m = await page.locator('#p').evaluate((p) => {
      const img = p.querySelector('img');
      const i = img.getBoundingClientRect();
      const b = p.getBoundingClientRect();
      const text = [...p.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
      const r = document.createRange();
      r.selectNodeContents(text);
      const first = r.getClientRects()[0];
      return { float: getComputedStyle(img).float, i: { l: i.left, r: i.right, w: i.width }, b: { l: b.left, r: b.right, w: b.width }, firstLine: { l: first.left, r: first.right, top: first.top }, imgTop: i.top };
    });
    expect(m.float).not.toBe('none');
    expect(m.i.w).toBeLessThanOrEqual(m.b.w / 2 + 1);
    if (dir === 'ltr') {
      expect(Math.abs(m.i.r - m.b.r)).toBeLessThan(2); // image at the inline end
      expect(m.firstLine.r).toBeLessThanOrEqual(m.i.l + 1); // text wraps beside it
    } else {
      expect(Math.abs(m.i.l - m.b.l)).toBeLessThan(2);
      expect(m.firstLine.l).toBeGreaterThanOrEqual(m.i.r - 1);
    }
  });
}

test('data-prose floats stop at the next heading and the footer', async ({ page }) => {
  await load(page, `<article data-prose><p id="p">${IMG} Short.</p><h2 id="h">Next</h2><footer id="f">End</footer></article>`);
  await page.locator('#p img').evaluate((img) => img.decode());
  const [img, h] = await page.evaluate(() => ['#p img', '#h'].map((s) => document.querySelector(s).getBoundingClientRect()));
  expect(h.top).toBeGreaterThanOrEqual(img.bottom - 1);
});

test('data-prose type step-up follows the column, not the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await load(page, `
    <article id="wide" data-prose><p>${PROSE_TEXT}</p></article>
    <aside class="narrow"><article id="narrow" data-prose><p>${PROSE_TEXT}</p></article></aside>
    <style>.narrow { inline-size: 18rem; }</style>`);
  const size = (sel) => page.locator(sel).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const root = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  const l = await page.evaluate(() => {
    const i = document.createElement('i');
    i.style.fontSize = 'var(--font-size-l)';
    document.body.append(i);
    const v = parseFloat(getComputedStyle(i).fontSize);
    i.remove();
    return v;
  });
  expect(l).toBeGreaterThan(root);
  expect(await size('#wide')).toBe(l);
  expect(await size('#narrow')).toBeLessThan(l);
});

/* ---------------------------------------------------------------- ornament */

for (const mode of ['light', 'dark']) {
  test(`hr[data-ornament] without a value paints the default glyph (${mode})`, async ({ page }) => {
    await load(page, `
      <p>a</p><hr id="bare" data-ornament><p>b</p>
      <hr id="custom" data-ornament="❧">
      <hr id="token" data-ornament class="tok"><style>.tok { --hr-ornament: "❦"; }</style>`, { mode });
    const read = (sel) => page.locator(sel).evaluate((hr) => ({
      h: hr.getBoundingClientRect().height,
      content: getComputedStyle(hr, '::before').content,
      color: getComputedStyle(hr, '::before').color,
    }));
    const bare = await read('#bare');
    expect(bare.h).toBeGreaterThan(8);
    expect(bare.content).toContain('⁂');
    expect(bare.color).toBe(await tokenColor(page, '--color-text-muted', 'main'));
    expect((await read('#custom')).content).toContain('❧');
    expect((await read('#token')).content).toContain('❦');
    // Still a separator for assistive tech; the glyph has empty alt text.
    const snap = await page.locator('main').ariaSnapshot();
    expect(snap).not.toContain('⁂');
    expect(snap).toContain('separator');
  });
}
