/**
 * Shapes K4 — data-callout (one callout primitive, shared with
 * markdown-viewer) and data-bubble (token fix, RTL tails, error border side,
 * announced typing bubble, forced-colours/print frames, theme hooks).
 *
 * Asserts PAINTED colours (canvas-resolved sRGB), not custom-property values.
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', head = '', theme = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__shapes-k4-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Resolve any CSS colour string to painted sRGB via a canvas. */
const PAINT = `
  window.__rgb = (c) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1);
    return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3);
  };
  window.__contrast = (a, b) => {
    const L = ([r, g, bl]) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
    };
    const [hi, lo] = [L(a), L(b)].sort((p, q) => q - p);
    return (hi + 0.05) / (lo + 0.05);
  };`;

async function paint(page) { await page.evaluate(PAINT); }

// ── data-callout ──────────────────────────────────────────────────────────

test('callout kinds paint their status colours (accent border + subtle fill)', async ({ page }) => {
  await load(page, `
    <aside id="w" data-callout="warning"><p>w</p></aside>
    <aside id="d" data-callout="danger"><p>d</p></aside>
    <aside id="n" data-callout><p>n</p></aside>
    <i id="pw" style="color: var(--color-warning); background: var(--color-warning-subtle)">x</i>
    <i id="pd" style="color: var(--color-error); background: var(--color-error-subtle)">x</i>
    <i id="pn" style="background: var(--color-surface-raised)">x</i>`);
  await paint(page);
  const r = await page.evaluate(() => {
    const cs = (id) => getComputedStyle(document.getElementById(id));
    const rgb = /** @type {any} */ (window).__rgb;
    return {
      wBorder: rgb(cs('w').borderInlineStartColor), wBorderWant: rgb(cs('pw').color),
      wBg: rgb(cs('w').backgroundColor), wBgWant: rgb(cs('pw').backgroundColor),
      dBorder: rgb(cs('d').borderInlineStartColor), dBorderWant: rgb(cs('pd').color),
      nBg: rgb(cs('n').backgroundColor), nBgWant: rgb(cs('pn').backgroundColor),
      width: cs('w').borderInlineStartWidth,
    };
  });
  expect(r.wBorder).toEqual(r.wBorderWant);
  expect(r.wBg).toEqual(r.wBgWant);
  expect(r.dBorder).toEqual(r.dBorderWant);
  expect(r.nBg).toEqual(r.nBgWant);
  expect(r.width).toBe('4px');
});

test('markdown-viewer :::kind renders the same data-callout primitive as hand-written HTML', async ({ page }) => {
  await load(page, `
    <markdown-viewer id="v"><script type="text/markdown">
:::warning Careful
Cannot be undone.
:::
</script></markdown-viewer>
    <aside id="hand" data-callout="warning" role="note"><p data-callout-title><strong>Careful</strong></p><p>Cannot be undone.</p></aside>`,
  { head: `<script type="module">import '/src/web-components/markdown-viewer/logic.js';</script>` });
  const md = page.locator('#v aside[data-callout="warning"]');
  await expect(md).toHaveCount(1);
  await expect(md).toHaveAttribute('role', 'note');
  await expect(md.locator('> p[data-callout-title] > strong')).toHaveText('Careful');
  expect(await page.locator('#v .callout, #v [data-kind]').count()).toBe(0);
  const same = await page.evaluate(() => {
    const a = getComputedStyle(document.querySelector('#v aside[data-callout]'));
    const b = getComputedStyle(document.getElementById('hand'));
    return ['backgroundColor', 'borderInlineStartColor', 'borderInlineStartWidth', 'paddingInlineStart']
      .every((k) => a[k] === b[k]);
  });
  expect(same).toBe(true);
});

test('shaped callouts paint the shape on ::before and never clip themselves or a focus ring', async ({ page }) => {
  await load(page, `
    <blockquote id="s" data-callout="speech" style="inline-size: 220px"><p>Long speech text that wraps over several lines in a narrow column to make it tall.</p></blockquote>
    <aside id="n" data-callout="tip notched"><p><a id="lnk" href="#x">Link</a></p></aside>`);
  const r = await page.evaluate(() => {
    const s = document.getElementById('s');
    const n = document.getElementById('n');
    const before = (el) => getComputedStyle(el, '::before');
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const sizeM = parseFloat(getComputedStyle(s).paddingBlockStart);
    return {
      sClip: getComputedStyle(s).clipPath,
      nClip: getComputedStyle(n).clipPath,
      sBefore: before(s).clipPath,
      nBefore: before(n).clipPath,
      sPadEnd: parseFloat(getComputedStyle(s).paddingBlockEnd),
      want: sizeM + rootPx, // --size-m + 1rem tail: a fixed length, not % of width
      nBorder: getComputedStyle(n).borderInlineStartWidth,
      sBorder: getComputedStyle(s).borderInlineStartWidth,
    };
  });
  expect(r.sClip).toBe('none');
  expect(r.nClip).toBe('none');
  expect(r.sBefore).toContain('shape(');
  expect(r.nBefore).toContain('shape(');
  expect(Math.abs(r.sPadEnd - r.want)).toBeLessThan(0.5);
  expect(r.nBorder).toBe('4px');
  expect(r.sBorder).toBe('0px');
  await page.locator('#lnk').focus();
  expect(await page.locator('#lnk').evaluate((a) => getComputedStyle(a).outlineStyle)).not.toBe('none');
});

test('callouts mirror in RTL: accent on the right, square there, rounded on the left, shape flipped', async ({ page }) => {
  await load(page, `
    <aside id="t" data-callout="tip"><p>t</p></aside>
    <aside id="n" data-callout="notched"><p>n</p></aside>`, { dir: 'rtl' });
  const r = await page.evaluate(() => {
    const t = getComputedStyle(document.getElementById('t'));
    return {
      right: t.borderRightWidth, left: t.borderLeftWidth,
      tr: t.borderTopRightRadius, tl: t.borderTopLeftRadius,
      scale: getComputedStyle(document.getElementById('n'), '::before').scale,
    };
  });
  expect(r).toMatchObject({ right: '4px', left: '0px', tr: '0px' });
  expect(r.tl).not.toBe('0px');
  expect(r.scale).toBe('-1 1');
});

test('forced colours: callouts get a CanvasText frame and stop painting the shape', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, `<blockquote id="s" data-callout="speech"><p>s</p></blockquote>`);
  const r = await page.evaluate(() => {
    const s = document.getElementById('s');
    return {
      top: getComputedStyle(s).borderTopWidth,
      start: getComputedStyle(s).borderInlineStartWidth,
      before: getComputedStyle(s, '::before').display,
    };
  });
  expect(r).toEqual({ top: '1px', start: '4px', before: 'none' });
});

test('print: callouts keep a visible frame without backgrounds', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await load(page, `<aside id="n" data-callout="info notched"><p>n</p></aside>`);
  const r = await page.evaluate(() => ({
    top: getComputedStyle(document.getElementById('n')).borderTopStyle,
    before: getComputedStyle(document.getElementById('n'), '::before').display,
  }));
  expect(r).toEqual({ top: 'solid', before: 'none' });
});

test('theme hooks: kawaii paints its gradient inside the speech shape, not as a rectangle', async ({ page }) => {
  await load(page, `<blockquote id="s" data-callout="speech"><p>s</p></blockquote>`,
    { theme: 'kawaii', head: '<link rel="stylesheet" href="/src/tokens/themes/_extreme-kawaii.css">' });
  const r = await page.evaluate(() => {
    const s = document.getElementById('s');
    return {
      host: getComputedStyle(s).backgroundImage,
      before: getComputedStyle(s, '::before').backgroundImage,
    };
  });
  expect(r.host).toBe('none');
  expect(r.before).toContain('linear-gradient');
});

// ── data-bubble ───────────────────────────────────────────────────────────

const CHAT = `
  <section id="c" style="display: flex; flex-direction: column; inline-size: 600px">
    <p id="in" data-bubble="incoming">Hello there</p>
    <p id="out" data-bubble="outgoing">Outgoing message text</p>
    <p id="err" data-bubble="error">Failed</p>
    <p id="typ" data-bubble="typing" role="status"><span id="lbl" class="visually-hidden">Alice is typing</span><span></span><span></span><span></span></p>
  </section>`;

test('outgoing bubble text meets AA against the painted primary fill', async ({ page }) => {
  await load(page, CHAT);
  await paint(page);
  const ratio = await page.evaluate(() => {
    const el = document.getElementById('out');
    const w = /** @type {any} */ (window);
    return w.__contrast(w.__rgb(getComputedStyle(el).color), w.__rgb(getComputedStyle(el, '::before').backgroundColor));
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test('bubbles paint tails on ::before and mirror them in RTL', async ({ page }) => {
  await load(page, CHAT, { dir: 'rtl' });
  const r = await page.evaluate(() => {
    const c = document.getElementById('c').getBoundingClientRect();
    const box = (id) => document.getElementById(id).getBoundingClientRect();
    const inn = document.getElementById('in');
    const err = getComputedStyle(document.getElementById('err'));
    return {
      hostClip: getComputedStyle(inn).clipPath,
      beforeClip: getComputedStyle(inn, '::before').clipPath,
      scale: getComputedStyle(inn, '::before').scale,
      inAtRight: Math.abs(box('in').right - c.right) < 1,
      outAtLeft: Math.abs(box('out').left - c.left) < 1,
      errRight: err.borderRightWidth, errLeft: err.borderLeftWidth,
      errSquareRight: err.borderTopRightRadius, errRoundLeft: err.borderTopLeftRadius,
    };
  });
  expect(r.hostClip).toBe('none');
  expect(r.beforeClip).toContain('shape(');
  expect(r.scale).toBe('-1 1');
  expect(r.inAtRight).toBe(true);
  expect(r.outAtLeft).toBe(true);
  expect(r).toMatchObject({ errRight: '3px', errLeft: '0px', errSquareRight: '0px' });
  expect(r.errRoundLeft).not.toBe('0px');
});

test('typing bubble: the label is announced text, only empty spans become dots', async ({ page }) => {
  await load(page, CHAT);
  const r = await page.evaluate(() => {
    const spans = [...document.querySelectorAll('#typ > span')];
    return spans.map((s) => ({ w: s.getBoundingClientRect().width, delay: getComputedStyle(s).animationDelay }));
  });
  expect(r[0].w).toBeLessThanOrEqual(1);
  expect(r.slice(1).map((s) => s.w)).toEqual([8, 8, 8]);
  expect(r.slice(1).map((s) => s.delay)).toEqual(['0s', '0.2s', '0.4s']);
  await expect(page.getByRole('status')).toHaveText(/Alice is typing/);
});

test('forced colours: bubbles get a frame with a thick edge on the tail side', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, CHAT);
  const r = await page.evaluate(() => {
    const cs = (id) => getComputedStyle(document.getElementById(id));
    return {
      inTop: cs('in').borderTopWidth, inStart: cs('in').borderInlineStartWidth,
      outEnd: cs('out').borderInlineEndWidth, outStart: cs('out').borderInlineStartWidth,
      before: getComputedStyle(document.getElementById('in'), '::before').display,
    };
  });
  expect(r).toEqual({ inTop: '1px', inStart: '4px', outEnd: '4px', outStart: '1px', before: 'none' });
});

test('range inputs keep data-bubble as the value tooltip, untouched by chat styling', async ({ page }) => {
  await load(page, `<input id="r" type="range" data-range data-bubble>`);
  const r = await page.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('r'));
    return { maxWidth: cs.maxWidth, position: cs.position };
  });
  expect(r.maxWidth).not.toBe('75%');
});
