/**
 * Generic [popover] behaviour under VB's cascade (vanilla-breeze-q6vs).
 *
 * - A closed popover is display:none on every element, even ones VB gives
 *   a display (nav, section, article, aside, form, figure, header, footer,
 *   menu, dl, search): reset-layer !important, like [hidden].
 * - Open sectioning popovers size to their content (no container-type).
 * - A bare popover is centred (UA margin:auto, which the reset zeroes).
 * - <dialog popover> and modal dialogs still open.
 * - The dashboard nav[popover] still renders in flow as a grid column.
 * - Hint timing lives on the invoker ([interestfor]), where native
 *   interest invokers and VB's polyfill read it.
 * - A role="tooltip" popover opened by popovertarget sits at its invoker.
 * - kbd/code in a plain hint take the hint surface's colours.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { width = 1280 } = {}) {
  await page.setViewportSize({ width, height: 800 });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__popover-layer-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" data-mode="light"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module" src="/src/main.js"></script>
      </head>${body.startsWith('<body') ? body : `<body>${body}</body>`}</html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  // main.js is a module graph; wait for the core runtime to have run.
  await page.waitForFunction(() => customElements.get('pop-over') !== undefined);
}

const TAGS = ['nav', 'section', 'article', 'aside', 'form', 'figure', 'header', 'footer', 'menu', 'dl', 'search', 'div', 'p'];

test('closed popovers are display:none on every element', async ({ page }) => {
  await load(page, `<main>${TAGS.map((t) => `<${t} id="p-${t}" popover>Popover ${t}</${t}>`).join('')}</main>`);
  const displays = await page.evaluate((tags) => Object.fromEntries(
    tags.map((t) => [t, getComputedStyle(document.getElementById(`p-${t}`)).display]),
  ), TAGS);
  for (const t of TAGS) expect(displays[t], t).toBe('none');
});

test('open popovers get their element display back', async ({ page }) => {
  await load(page, `<main>${TAGS.map((t) => `<${t} id="p-${t}" popover="manual">Popover ${t}</${t}>`).join('')}</main>`);
  const displays = await page.evaluate((tags) => Object.fromEntries(tags.map((t) => {
    const el = document.getElementById(`p-${t}`);
    el.showPopover();
    return [t, getComputedStyle(el).display];
  })), TAGS);
  for (const t of TAGS) expect(displays[t], t).not.toBe('none');
});

test('open sectioning popovers size to their content', async ({ page }) => {
  const text = 'A popover with a sentence of content in it';
  await load(page, `<main>${['section', 'article', 'aside', 'div'].map((t) => `<${t} id="p-${t}" popover="manual">${text}</${t}>`).join('')}</main>`);
  const widths = await page.evaluate(() => Object.fromEntries(['section', 'article', 'aside', 'div'].map((t) => {
    const el = document.getElementById(`p-${t}`);
    el.showPopover();
    const w = el.getBoundingClientRect().width;
    el.hidePopover();
    return [t, { w, ct: getComputedStyle(el).containerType }];
  })));
  for (const t of ['section', 'article', 'aside']) {
    expect(widths[t].ct, t).toBe('normal');
    expect(Math.abs(widths[t].w - widths.div.w), t).toBeLessThan(2);
    expect(widths[t].w, t).toBeGreaterThan(150);
  }
});

test('a bare popover is centred in the viewport', async ({ page }) => {
  await load(page, '<main><button popovertarget="bare">Open</button><p id="bare" popover>Centred popover</p></main>');
  await page.click('button[popovertarget="bare"]');
  const r = await page.evaluate(() => {
    const b = document.getElementById('bare').getBoundingClientRect();
    return { cx: b.left + b.width / 2, cy: b.top + b.height / 2, vw: innerWidth, vh: innerHeight };
  });
  expect(Math.abs(r.cx - r.vw / 2)).toBeLessThan(2);
  expect(Math.abs(r.cy - r.vh / 2)).toBeLessThan(2);
});

test('<dialog popover> and modal dialogs still open', async ({ page }) => {
  await load(page, `<main>
    <dialog id="dp" popover><p>Dialog popover</p></dialog>
    <dialog id="dm" popover><p>Modal dialog that also has popover</p></dialog>
    <dialog id="plain"><p>Plain</p></dialog></main>`);
  const r = await page.evaluate(() => {
    const closed = getComputedStyle(document.getElementById('dp')).display;
    document.getElementById('dp').showPopover();
    const dp = getComputedStyle(document.getElementById('dp')).display;
    document.getElementById('dp').hidePopover();
    document.getElementById('dm').showModal();
    const dm = getComputedStyle(document.getElementById('dm')).display;
    document.getElementById('dm').close();
    document.getElementById('plain').showModal();
    const plain = getComputedStyle(document.getElementById('plain')).display;
    return { closed, dp, dm, plain };
  });
  expect(r.closed).toBe('none');
  expect(r.dp).not.toBe('none');
  expect(r.dm).not.toBe('none');
  expect(r.plain).not.toBe('none');
});

test('dashboard nav[popover] still renders in flow at desktop width', async ({ page }) => {
  await load(page, `<body data-page-layout="dashboard">
    <header><button data-nav-toggle popovertarget="side">Menu</button></header>
    <nav id="side" popover aria-label="Side"><ul><li><a href="#">Link</a></li></ul></nav>
    <main><p>Main</p></main></body>`);
  const r = await page.evaluate(() => {
    const nav = document.getElementById('side');
    const b = nav.getBoundingClientRect();
    return { display: getComputedStyle(nav).display, w: b.width, h: b.height };
  });
  expect(r.display).not.toBe('none');
  expect(r.w).toBeGreaterThan(50);
});

test('dashboard nav[popover] stays an off-canvas drawer on small screens', async ({ page }) => {
  await load(page, `<body data-page-layout="dashboard">
    <header><button data-nav-toggle popovertarget="side">Menu</button></header>
    <nav id="side" popover aria-label="Side"><ul><li><a href="#">Link</a></li></ul></nav>
    <main><p>Main</p></main></body>`, { width: 375 });
  const closed = await page.evaluate(() => getComputedStyle(document.getElementById('side')).visibility);
  expect(closed).toBe('hidden');
  await page.click('[data-nav-toggle]');
  await expect.poll(() => page.evaluate(() => {
    const nav = document.getElementById('side');
    return nav.matches(':popover-open') && getComputedStyle(nav).visibility === 'visible'
      && Math.round(nav.getBoundingClientRect().left) === 0;
  })).toBe(true);
});

test('color-picker panel is hidden closed and fades out on close', async ({ page }) => {
  await load(page, '<main><label for="cc">Colour</label><color-picker><input type="color" id="cc" name="c" value="#3366cc"/></color-picker></main>');
  await page.waitForSelector('color-picker .color-panel[popover]', { state: 'attached' });
  const panel = page.locator('color-picker .color-panel');
  expect(await panel.evaluate((el) => getComputedStyle(el).display)).toBe('none');
  await page.click('color-picker .color-trigger');
  await expect.poll(() => panel.evaluate((el) => el.matches(':popover-open') && getComputedStyle(el).display)).toBe('flex');
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  // Mid-exit the panel is still rendered (display/overlay transition), then gone.
  expect(await panel.evaluate((el) => !el.matches(':popover-open') && getComputedStyle(el).display)).toBe('flex');
  await expect.poll(() => panel.evaluate((el) => getComputedStyle(el).display)).toBe('none');
});

test('hint timing is set on the invoker and honoured', async ({ page }) => {
  await load(page, `<main><p style="padding-block-start:6rem">
    <button id="inv" interestfor="hint">Hover</button></p>
    <p id="hint" popover="hint">Hint text</p></main>`);
  const r = await page.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('inv'));
    return {
      native: cs.getPropertyValue('interest-delay-start').trim(),
      custom: cs.getPropertyValue('--interest-delay').trim(),
    };
  });
  // The polyfill's custom property is what the polyfill path reads; the
  // native property only exists where interest invokers are native.
  expect(r.custom).toBe('200ms 100ms');
  if (r.native) expect(['200ms', '0.2s']).toContain(r.native);

  await page.hover('#inv');
  // Default delay is 500ms; VB's 200ms must open it well before then.
  await page.waitForTimeout(380);
  expect(await page.evaluate(() => document.getElementById('hint').matches(':popover-open'))).toBe(true);
});

test('a plain hint on a <section> is hidden closed and placed at its invoker open', async ({ page }) => {
  await load(page, `<main><p style="padding-block-start:8rem;padding-inline-start:6rem">
    <button id="inv" interestfor="sec">Hover</button></p>
    <section id="sec" popover="hint"><p>Section hint with some text</p></section></main>`);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('sec')).display)).toBe('none');
  await page.hover('#inv');
  await expect.poll(() => page.evaluate(() => document.getElementById('sec').matches(':popover-open'))).toBe(true);
  const r = await page.evaluate(() => {
    const i = document.getElementById('inv').getBoundingClientRect();
    const s = document.getElementById('sec').getBoundingClientRect();
    return { i: { top: i.top, cx: i.left + i.width / 2 }, s: { bottom: s.bottom, cx: s.left + s.width / 2, w: s.width } };
  });
  expect(r.s.w).toBeGreaterThan(100);
  expect(r.s.bottom).toBeLessThanOrEqual(r.i.top + 1);
  expect(r.i.top - r.s.bottom).toBeLessThan(24);
  expect(Math.abs(r.s.cx - r.i.cx)).toBeLessThan(4);
});

test('role=tooltip popover opened by popovertarget sits at its invoker', async ({ page }) => {
  await load(page, `<main><p style="padding-block-start:10rem;padding-inline-start:24rem">
    <button id="inv" popovertarget="tip">Info</button></p>
    <p id="tip" popover role="tooltip">Click tooltip text</p></main>`);
  await page.click('#inv');
  await page.waitForTimeout(250);
  const r = await page.evaluate(() => {
    const i = document.getElementById('inv').getBoundingClientRect();
    const t = document.getElementById('tip').getBoundingClientRect();
    return { i: { top: i.top, cx: i.left + i.width / 2 }, t: { top: t.top, bottom: t.bottom, cx: t.left + t.width / 2 } };
  });
  expect(r.t.top).toBeGreaterThan(20);
  expect(r.t.bottom).toBeLessThanOrEqual(r.i.top + 1);
  expect(r.i.top - r.t.bottom).toBeLessThan(24);
  expect(Math.abs(r.t.cx - r.i.cx)).toBeLessThan(4);
});

test('kbd and code inside a plain hint use the hint surface colours', async ({ page }) => {
  await load(page, `<main><p id="out"><kbd>Esc</kbd> <code>x</code></p><button id="inv" interestfor="h">Save</button>
    <p id="h" popover="hint">Save <kbd>Ctrl</kbd>+<kbd>S</kbd> or <code>save()</code></p></main>`);
  const r = await page.evaluate(() => {
    const h = document.getElementById('h');
    h.showPopover();
    const out = document.getElementById('out');
    const kbd = getComputedStyle(h.querySelector('kbd'));
    const code = getComputedStyle(h.querySelector('code'));
    return {
      hint: getComputedStyle(h).color,
      kbd: kbd.color, code: code.color,
      kbdBg: kbd.backgroundColor, codeBg: code.backgroundColor,
      outKbdBg: getComputedStyle(out.querySelector('kbd')).backgroundColor,
      outCodeBg: getComputedStyle(out.querySelector('code')).backgroundColor,
    };
  });
  expect(r.kbd).toBe(r.hint);
  expect(r.code).toBe(r.hint);
  // The page's light key-cap / code fill is replaced by a tint of the hint text.
  expect(r.kbdBg).not.toBe(r.outKbdBg);
  expect(r.codeBg).not.toBe(r.outCodeBg);
});
