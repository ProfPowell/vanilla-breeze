/**
 * Shapes (section edges, data-clip, data-cutout, data-border-shape,
 * data-morph) — style-review fixes.
 *
 * Covers: edge padding and clip share one length (no clipped content on a
 * narrow, tall section); every start/end pair composes; unknown values add
 * nothing; diagonal / badge-corner / asymmetric clips mirror in RTL; clips
 * bleed past straight sides so focus rings survive; badge-corner is a
 * concave bite; border-shape draws a real inset frame that follows focus;
 * morph is finite by default, loops only on opt-in and pauses/stops;
 * forced-colours and print drop clips.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', css = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__shapes-k3-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <style>.bg { background: rgb(200 220 255); } ${css}</style>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const clip = (page, sel) => page.$eval(sel, (el) => getComputedStyle(el).clipPath);

/** True when the point (fractions of the element box) hits the element itself. */
const hits = (page, sel, fx, fy) => page.$eval(sel, (el, [x, y]) => {
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width * x, r.top + r.height * y);
  return hit === el || el.contains(hit);
}, [fx, fy]);

const LONG = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(30);

test.describe('section edges', () => {
  test('padding matches the clip depth: last line is clear of the edge at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await load(page, `<section id="s" class="bg tight" data-shape-end="chevron"><p>${LONG}</p><p id="last">Last line</p></section>`,
      { css: '.tight { padding: 4px; }' });
    const m = await page.evaluate(() => {
      const s = document.getElementById('s');
      const cs = getComputedStyle(s);
      return {
        depth: parseFloat(cs.getPropertyValue('--shape-depth')),
        padEnd: parseFloat(cs.paddingBlockEnd),
        padStart: parseFloat(cs.paddingBlockStart),
        sBottom: s.getBoundingClientRect().bottom,
        lastBottom: document.getElementById('last').getBoundingClientRect().bottom,
        height: s.getBoundingClientRect().height,
      };
    });
    expect(m.depth).toBe(48);
    expect(m.padStart).toBe(4); // unshaped side keeps author padding
    expect(m.padEnd).toBeGreaterThanOrEqual(48 + 16); // depth + --size-l, beats author padding
    expect(m.height).toBeGreaterThan(600); // tall section: % depth would have clipped here
    expect(m.lastBottom).toBeLessThanOrEqual(m.sBottom - m.depth);
    // The last line is actually painted (not clipped): hit test its centre.
    await page.$eval('#last', (el) => el.scrollIntoView({ block: 'center' }));
    expect(await hits(page, '#last', 0.5, 0.5)).toBe(true);
  });

  test('--shape-depth is a length and --shape-edge-padding tunes the gap', async ({ page }) => {
    await load(page, `<section id="s" class="bg x" data-shape-start="wave"><p>Hi</p></section>`,
      { css: '.x { --shape-depth: 2rem; --shape-edge-padding: 0px; }' });
    const pad = await page.$eval('#s', (el) => getComputedStyle(el).paddingBlockStart);
    expect(pad).toBe('32px');
  });

  test('mixed start and end shapes both apply', async ({ page }) => {
    await load(page, `<section id="s" class="bg" data-shape-start="chevron" data-shape-end="scallop"><p>x</p></section>`);
    const c = await clip(page, '#s');
    expect(c).toContain('line to 50% 0%'); // chevron top
    expect(c).toContain('with 91.66% 100%'); // scallop bottom
    const pads = await page.$eval('#s', (el) => {
      const probe = document.createElement('i');
      probe.style.paddingTop = 'calc(48px + var(--size-l))';
      el.append(probe);
      const expected = getComputedStyle(probe).paddingTop;
      probe.remove();
      return { start: getComputedStyle(el).paddingBlockStart, end: getComputedStyle(el).paddingBlockEnd, expected };
    });
    expect(pads.start).toBe(pads.expected);
    expect(pads.end).toBe(pads.expected);
  });

  test('every start/end pair has a composed rule', async ({ page }) => {
    const shapes = ['wave', 'chevron', 'scallop', 'diagonal'];
    const body = shapes.flatMap((s) => shapes.map((e) =>
      `<section class="bg pair" data-shape-start="${s}" data-shape-end="${e}"></section>`)).join('');
    await load(page, body);
    const clips = await page.$$eval('.pair', (els) => els.map((el) => getComputedStyle(el).clipPath));
    // Top is never the flat bleed line (-16px) and bottom is never the flat bleed line.
    for (const c of clips) {
      expect(c.startsWith('shape(from calc(0% - 16px) calc(0% - 16px)')).toBe(false);
      expect(c).not.toContain('calc(100% + 16px) calc(100% + 16px)');
    }
    expect(new Set(clips).size).toBe(16);
  });

  test('unknown values add no clip and no padding', async ({ page }) => {
    await load(page, `<section id="s" class="bg" data-shape-end="none" data-shape-start="bogus"><p>x</p></section>`);
    const r = await page.$eval('#s', (el) => ({ c: getComputedStyle(el).clipPath, p: getComputedStyle(el).paddingBlock }));
    expect(r).toEqual({ c: 'none', p: '0px' });
  });

  test('diagonal mirrors in RTL', async ({ page }) => {
    await load(page, `<section id="a" class="bg" data-shape-start="diagonal"></section>
      <section id="b" class="bg" data-shape-start="diagonal" data-shape-end="wave"></section>`, { dir: 'rtl' });
    expect(await clip(page, '#a')).toMatch(/^shape\(from calc\(0% - 16px\) 0%, line to 0% 0%, line to 100% 48px/);
    const b = await clip(page, '#b');
    expect(b).toMatch(/^shape\(from calc\(0% - 16px\) 0%/);
    expect(b).toContain('curve to 75% 100%'); // the wave bottom survives the RTL rule
  });

  test('clip bleeds past the straight sides so the element focus ring survives', async ({ page }) => {
    await load(page, `<section id="s" class="bg ring" data-shape-end="wave"><p>x</p></section>`,
      { css: '.ring { margin: 2rem; outline: 4px solid rgb(255 0 0); outline-offset: 2px; }' });
    const box = await page.$eval('#s', (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, h: r.height };
    });
    // Strip left of the section, where the outline is drawn.
    const shot = await page.screenshot({ clip: { x: box.x - 8, y: box.y + 4, width: 8, height: Math.min(40, box.h / 2) } });
    const sharp = (await import('sharp')).default;
    const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
    let red = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i] > 200 && data[i + 1] < 60 && data[i + 2] < 60) red++;
    }
    expect(red).toBeGreaterThan(20);
  });
});

test.describe('data-clip', () => {
  test('figure clips a direct picture > img, not the caption', async ({ page }) => {
    await load(page, `<figure data-clip="hexagon"><picture><img id="i" alt="x" width="100" height="100"
      src="/src/assets/placeholders/photo-hex-400x400.svg"></picture><figcaption id="c">Cap</figcaption></figure>`);
    expect(await clip(page, '#i')).toContain('shape(');
    expect(await clip(page, '#c')).toBe('none');
  });

  test('asymmetric clips mirror in RTL', async ({ page }) => {
    const body = `<img id="i" data-clip="swoosh" alt="x" width="100" height="100" src="/src/assets/placeholders/photo-hex-400x400.svg">`;
    await load(page, body);
    const ltr = await clip(page, '#i');
    await load(page, body, { dir: 'rtl' });
    const rtl = await clip(page, '#i');
    expect(ltr).toMatch(/^shape\(from 0% 0%/);
    expect(rtl).toMatch(/^shape\(from 100% 0%/);
  });
});

test.describe('data-cutout', () => {
  const tile = (v, id = 't') => `<p id="${id}" class="bg sq" data-cutout="${v}"></p>`;
  const css = '.sq { inline-size: 200px; block-size: 200px; margin: 2rem; }';

  test('badge-corner is a concave bite out of the inline-end corner', async ({ page }) => {
    await load(page, tile('badge-corner'), { css });
    expect(await hits(page, '#t', 0.97, 0.03)).toBe(false);
    expect(await hits(page, '#t', 0.85, 0.15)).toBe(false); // inside the bite, not just a rounded corner
    expect(await hits(page, '#t', 0.6, 0.4)).toBe(true);
    expect(await hits(page, '#t', 0.15, 0.15)).toBe(true);
  });

  test('badge-corner mirrors in RTL', async ({ page }) => {
    await load(page, tile('badge-corner'), { css, dir: 'rtl' });
    expect(await hits(page, '#t', 0.15, 0.15)).toBe(false);
    expect(await hits(page, '#t', 0.85, 0.15)).toBe(true);
  });

  test('circle hole is round and the outer clip bleeds for focus rings', async ({ page }) => {
    await load(page, tile('circle'), { css });
    expect(await hits(page, '#t', 0.5, 0.5)).toBe(false);
    expect(await hits(page, '#t', 0.5 + 0.28 * Math.SQRT1_2, 0.5 + 0.28 * Math.SQRT1_2)).toBe(false); // on a 45deg ray, inside r=30%
    expect(await hits(page, '#t', 0.5 + 0.33 * Math.SQRT1_2, 0.5 + 0.33 * Math.SQRT1_2)).toBe(true);
    expect(await clip(page, '#t')).toMatch(/^shape\(evenodd from calc\(0% - 16px\) calc\(0% - 16px\)/);
  });
});

test.describe('data-border-shape', () => {
  const body = `<span id="w" data-border-shape="hexagon"><a id="a" href="#x"><img id="i" alt="x" width="200" height="200"
    src="/src/assets/placeholders/photo-bhex-200x200.svg"></a></span>`;

  test('child is clipped inside a coloured ::before frame; wrapper is not clipped', async ({ page }) => {
    await load(page, body);
    const r = await page.evaluate(() => {
      const w = document.getElementById('w');
      const a = document.getElementById('a');
      const before = getComputedStyle(w, '::before');
      return {
        wrapper: getComputedStyle(w).clipPath,
        child: getComputedStyle(a).clipPath,
        before: before.clipPath,
        bg: before.backgroundColor,
        primary: (() => { const p = document.createElement('i'); p.style.color = 'var(--color-primary)'; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; })(),
        margin: getComputedStyle(a).marginTop,
        display: getComputedStyle(a).display,
      };
    });
    expect(r.wrapper).toBe('none');
    expect(r.child).toContain('shape(');
    expect(r.before).toBe(r.child);
    expect(r.bg).toBe(r.primary);
    expect(r.margin).toBe('4px');
    expect(r.display).toBe('block');
    // Hexagon corner of the child box is clipped away; the frame band shows ::before
    // (hit testing ignores pseudo-elements, so check the child is clipped at its corner).
    expect(await hits(page, '#a', 0.02, 0.02)).toBe(false);
    expect(await hits(page, '#a', 0.5, 0.5)).toBe(true);
  });

  test('frame turns to the focus-ring colour when the child has keyboard focus', async ({ page }) => {
    await load(page, `<button id="first">first</button>${body}`);
    const before = () => page.$eval('#w', (el) => getComputedStyle(el, '::before').backgroundColor);
    const idle = await before();
    await page.focus('#first');
    await page.keyboard.press('Tab');
    await expect(page.locator('#a')).toBeFocused();
    const focused = await before();
    const ring = await page.evaluate(() => { const p = document.createElement('i'); p.style.color = 'var(--color-focus-ring)'; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; });
    expect(focused).toBe(ring);
    expect(idle).toBeTruthy();
  });
});

test.describe('data-morph', () => {
  test('finite by default, loops only with data-morph-loop', async ({ page }) => {
    await load(page, `<section id="a" class="bg" data-morph="wave">A</section>
      <section id="b" class="bg" data-morph="pulse" data-morph-loop>B</section>`);
    const r = await page.evaluate(() => ['a', 'b'].map((id) => {
      const cs = getComputedStyle(document.getElementById(id));
      return { n: cs.animationIterationCount, d: parseFloat(cs.animationDuration), pad: cs.paddingTop };
    }));
    expect(r[0].n).toBe('1');
    expect(r[0].n === '1' && r[0].d <= 5).toBe(true);
    expect(r[1].n).toBe('infinite');
    expect(r[0].pad).toBe('12px'); // content inset by the morph depth
  });

  test('a loop pauses on hover and under data-paused; focus inside stops it', async ({ page }) => {
    await load(page, `<section id="hov" class="bg" data-morph="wave" data-morph-loop>H</section>
      <section data-paused><p id="p" class="bg" data-morph="wave" data-morph-loop>P</p></section>
      <section id="f" class="bg" data-morph="wave" data-morph-loop><a id="link" href="#x">link</a></section>`);
    const state = (sel) => page.$eval(sel, (el) => getComputedStyle(el).animationPlayState);
    expect(await state('#p')).toBe('paused');
    expect(await state('#hov')).toBe('running');
    await page.hover('#hov');
    expect(await state('#hov')).toBe('paused');
    await page.focus('#link');
    const f = await page.$eval('#f', (el) => ({ name: getComputedStyle(el).animationName, clip: getComputedStyle(el).clipPath }));
    expect(f).toEqual({ name: 'none', clip: 'none' });
  });

  test('yields to a static shape on the same element', async ({ page }) => {
    await load(page, `<img id="i" data-clip="hexagon" data-morph="pulse" alt="x" width="100" height="100"
      src="/src/assets/placeholders/photo-hex-400x400.svg">`);
    const r = await page.$eval('#i', (el) => ({ name: getComputedStyle(el).animationName, clip: getComputedStyle(el).clipPath }));
    expect(r.name).toBe('none');
    expect(r.clip).toContain('shape(from 50% 0%');
  });

  test('reduced motion turns it off', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await load(page, `<section id="a" class="bg" data-morph="wave" data-morph-loop>A</section>`);
    expect(await page.$eval('#a', (el) => getComputedStyle(el).animationName)).toBe('none');
  });
});

test.describe('forced colours and print', () => {
  const body = `<section id="e" class="bg" data-shape-start="wave"><p>x</p></section>
    <p id="c" class="bg" data-cutout="circle">c</p>
    <section id="m" class="bg" data-morph="wave" data-morph-loop>m</section>
    <span id="w" data-border-shape="arch"><img alt="x" width="50" height="50" src="/src/assets/placeholders/photo-barch-200x200.svg"></span>`;

  test('forced colours drops clips and draws the shaped border in CanvasText', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, body);
    expect(await clip(page, '#e')).toBe('none');
    expect(await clip(page, '#c')).toBe('none');
    expect(await page.$eval('#m', (el) => getComputedStyle(el).animationName)).toBe('none');
    const fca = await page.$eval('#w', (el) => getComputedStyle(el, '::before').forcedColorAdjust);
    expect(fca).toBe('none');
  });

  test('print drops edge and cutout clips and keeps the border colour', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    await load(page, body);
    expect(await clip(page, '#e')).toBe('none');
    expect(await clip(page, '#c')).toBe('none');
    expect(await page.$eval('#m', (el) => getComputedStyle(el).animationName)).toBe('none');
    expect(await page.$eval('#w', (el) => getComputedStyle(el, '::before').printColorAdjust)).toBe('exact');
  });
});
