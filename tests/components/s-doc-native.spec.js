/**
 * S-review: native script / style / slot / section / source / svg.
 *
 * Covers the CSS fixes (svg colour classes keep stroke icons as outlines,
 * spin/pulse stop under reduced motion, section data-angle mirrors in RTL and
 * pads by the container, .alt keeps a border in forced colors, the hero-bleed
 * header gets its surface back on data-scrolled) and the new doc demos
 * (script order, declarative-shadow slot, picture source fallback).
 *
 * Tests the working tree: /src and the demo files are served from disk, not
 * the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function routeSrc(page) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
}

async function load(page, body, { dir = 'ltr', head = '' } = {}) {
  await routeSrc(page);
  const url = `/__s-doc-native-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Serve a demo file from the working tree at a fake URL. */
async function loadDemo(page, file) {
  await routeSrc(page);
  const url = `/__s-doc-native-demo/${file}`;
  await page.route(`**${url}`, (route) => route.fulfill({
    path: join(REPO, 'demos', 'snippets', 'demos', file),
    contentType: 'text/html; charset=utf-8',
  }));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'load' });
  return errors;
}

const STROKE = '<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" />';

test.describe('svg colour classes', () => {
  test('stroke icons stay outlines; fill icons are filled', async ({ page }) => {
    await load(page, `
      <p id="p">
        <svg id="stroke" class="l currentcolor" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${STROKE}</svg>
        <svg id="fill" class="l currentcolor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
        <svg id="int" class="l interactive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${STROKE}</svg>
        <svg id="intfill" class="l interactive" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
        <svg id="muted" class="l muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${STROKE}</svg>
        <span id="probe-int" style="color: var(--color-interactive)">x</span>
        <span id="probe-muted" style="color: var(--color-text-muted)">x</span>
      </p>`);
    const r = await page.evaluate(() => {
      const cs = (sel) => getComputedStyle(document.querySelector(sel));
      return {
        text: cs('#p').color,
        int: cs('#probe-int').color,
        muted: cs('#probe-muted').color,
        strokeSvgFill: cs('#stroke').fill,
        strokeCircleFill: cs('#stroke circle').fill,
        strokeCircleStroke: cs('#stroke circle').stroke,
        fillCircleFill: cs('#fill circle').fill,
        intCircleFill: cs('#int circle').fill,
        intCircleStroke: cs('#int circle').stroke,
        intFillCircleFill: cs('#intfill circle').fill,
        mutedCircleFill: cs('#muted circle').fill,
        mutedCircleStroke: cs('#muted circle').stroke,
      };
    });
    expect(r.strokeSvgFill).toBe('none');
    expect(r.strokeCircleFill).toBe('none');
    expect(r.strokeCircleStroke).toBe(r.text);
    expect(r.fillCircleFill).toBe(r.text);
    expect(r.intCircleFill).toBe('none');
    expect(r.intCircleStroke).toBe(r.int);
    expect(r.intFillCircleFill).toBe(r.int);
    expect(r.mutedCircleFill).toBe('none');
    expect(r.mutedCircleStroke).toBe(r.muted);
  });

  test('svg.full fills its container; .responsive is gone', async ({ page }) => {
    await load(page, `
      <figure id="f" style="inline-size: 400px; margin: 0">
        <svg id="s" class="full" viewBox="0 0 400 100"><rect width="400" height="100" /></svg>
      </figure>`);
    const box = await page.locator('#s').boundingBox();
    expect(Math.round(box.width)).toBe(400);
    expect(Math.round(box.height)).toBe(100);
    const css = await page.evaluate(() => fetch('/src/native-elements/svg/styles.css').then((r) => r.text()));
    expect(css).not.toContain('svg.responsive');
  });
});

test.describe('svg animations and reduced motion', () => {
  const ICONS = `
    <svg id="spin" class="m spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
    <svg id="pulse" class="m pulse" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>`;
  const names = (page) => page.evaluate(() => ['#spin', '#pulse']
    .map((s) => getComputedStyle(document.querySelector(s)).animationName));

  test('animate by default', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await load(page, ICONS);
    expect(await names(page)).toEqual(['svg-spin', 'svg-pulse']);
  });

  test('stop under prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await load(page, ICONS);
    expect(await names(page)).toEqual(['none', 'none']);
  });

  test('stop under the data-motion-reduced switch', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await load(page, ICONS);
    await page.evaluate(() => document.documentElement.setAttribute('data-motion-reduced', ''));
    expect(await names(page)).toEqual(['none', 'none']);
  });
});

test.describe('section', () => {
  const ANGLED = `<main><section id="s" data-angle="down" data-padding style="background: Canvas">
      <h2>Angled</h2><p>Text</p></section>
    <section id="u" data-angle="up-strong" data-padding style="background: Canvas"><h2>Up</h2></section></main>`;

  const before = (page, sel) => page.evaluate((s) => {
    const cs = getComputedStyle(document.querySelector(s), '::before');
    return { transform: cs.transform, origin: cs.transformOrigin };
  }, sel);

  test('data-angle mirrors under RTL', async ({ page }) => {
    await load(page, ANGLED);
    const ltr = await before(page, '#s');
    const ltrUp = await before(page, '#u');
    await load(page, ANGLED, { dir: 'rtl' });
    const rtl = await before(page, '#s');
    const rtlUp = await before(page, '#u');
    // matrix(a, b, c, d, e, f): b carries the skewY tangent.
    const b = (m) => Number(m.transform.match(/matrix\(([^)]+)\)/)[1].split(',')[1]);
    expect(b(ltr)).toBeLessThan(0);
    expect(b(rtl)).toBeCloseTo(-b(ltr), 5);
    expect(b(rtlUp)).toBeCloseTo(-b(ltrUp), 5);
    // origin: inline-end edge → right in LTR, left (0px) in RTL
    const x = (m) => parseFloat(m.origin.split(' ')[0]);
    expect(x(ltr)).toBeGreaterThan(0);
    expect(x(rtl)).toBe(0);
  });

  test('data-angle padding compensates by the container, not the viewport', async ({ page }) => {
    await load(page, `<article style="inline-size: 500px">
      <section id="s" data-angle="down" style="background: Canvas"><h2>A</h2></section></article>`);
    const r = await page.evaluate(() => {
      const s = document.getElementById('s');
      const normal = getComputedStyle(s).getPropertyValue('--section-padding-normal');
      const probe = document.createElement('p');
      probe.style.paddingBlockStart = normal;
      s.after(probe);
      return {
        pad: parseFloat(getComputedStyle(s).paddingBlockStart),
        normal: parseFloat(getComputedStyle(probe).paddingBlockStart),
      };
    });
    expect(r.pad - r.normal).toBeCloseTo(500 * 0.052, 0);
  });

  test('.alt keeps a visible border in forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, '<section id="a" class="alt"><h2>Alt</h2></section>');
    const r = await page.evaluate(() => {
      const cs = getComputedStyle(document.getElementById('a'));
      return [cs.borderBlockStartStyle, cs.borderBlockEndStyle];
    });
    expect(r).toEqual(['solid', 'solid']);
  });

  test('.alt has no border outside forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'none' });
    await load(page, '<section id="a" class="alt"><h2>Alt</h2></section>');
    const style = await page.evaluate(() => getComputedStyle(document.getElementById('a')).borderBlockStartStyle);
    expect(style).toBe('none');
  });

  test('hero bleed: header transparent, surface back on data-scrolled', async ({ page }) => {
    await load(page, `<header id="h"><p>Site</p></header>
      <main><section class="hero" data-bleed><h1>Hero</h1></section></main>`);
    const bg = () => page.evaluate(() => getComputedStyle(document.getElementById('h')).backgroundColor);
    expect(await bg()).toBe('rgba(0, 0, 0, 0)');
    await page.evaluate(() => document.documentElement.setAttribute('data-scrolled', ''));
    await expect.poll(bg).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('hairline hr pins to the section edge', async ({ page }) => {
    await load(page, `<section id="s" data-padding><hr id="t" data-position="top" /><h2>A</h2>
      <hr id="b" data-position="bottom" /></section>`);
    const r = await page.evaluate(() => {
      const s = document.getElementById('s').getBoundingClientRect();
      const t = document.getElementById('t').getBoundingClientRect();
      const b = document.getElementById('b').getBoundingClientRect();
      return { sTop: s.top, sBottom: s.bottom, tTop: t.top, bBottom: b.bottom, tW: t.width, sW: s.width };
    });
    expect(Math.round(r.tTop)).toBe(Math.round(r.sTop));
    expect(Math.round(r.bBottom)).toBe(Math.round(r.sBottom));
    expect(Math.round(r.tW)).toBe(Math.round(r.sW));
  });

  test('a section in a content-sized flex row collapses unless container-type: normal', async ({ page }) => {
    await load(page, `<nav style="display: flex">
        <section id="c"><h2>Collapsed</h2></section>
        <section id="o" style="container-type: normal"><h2>Opted out</h2></section>
      </nav>`);
    const w = await page.evaluate(() => ['c', 'o'].map((id) => document.getElementById(id).getBoundingClientRect().width));
    expect(w[0]).toBe(0);
    expect(w[1]).toBeGreaterThan(0);
  });
});

test.describe('demos', () => {
  test('script-order runs classic, classic, module, DOMContentLoaded', async ({ page }) => {
    const errors = await loadDemo(page, 'script-order.html');
    const lines = await page.locator('#log li').allTextContents();
    expect(lines[0]).toContain('Classic script in <head>');
    expect(lines[1]).toContain('Classic script at end of <body>');
    expect(lines[2]).toContain('type="module"');
    expect(lines[2]).toContain('document parsed: true');
    expect(lines[3]).toBe('DOMContentLoaded');
    expect(lines[4]).toContain('JSON-LD data blocks found: 1');
    expect(errors).toEqual([]);
  });

  test('style-layers: unlayered rule beats the layered one', async ({ page }) => {
    await loadDemo(page, 'style-layers.html');
    const [a, b] = await page.locator('mark.layer-demo').evaluateAll((els) =>
      els.map((e) => getComputedStyle(e).backgroundColor));
    expect(a).not.toBe(b);
  });

  test('slot demo: declarative shadow root with named, default and fallback slots', async ({ page }) => {
    const errors = await loadDemo(page, 'slot-declarative-shadow.html');
    const r = await page.evaluate(() => [...document.querySelectorAll('article')].map((a) => {
      const sr = a.shadowRoot;
      if (!sr) return null;
      const assigned = (sel) => sr.querySelector(sel).assignedElements().map((e) => e.textContent.trim());
      return {
        name: assigned('slot[name="name"]'),
        role: assigned('slot[name="role"]'),
        def: assigned('slot:not([name])'),
        roleFallback: sr.querySelector('slot[name="role"]').assignedElements({ flatten: true })
          .map((e) => e.textContent.trim()),
      };
    }));
    expect(r[0]).toEqual({
      name: ['Ada Lovelace'], role: ['Analyst'],
      def: ['Unnamed children go to the default slot.'], roleFallback: ['Analyst'],
    });
    expect(r[1].role).toEqual([]);
    expect(r[1].roleFallback).toEqual(['No role given']);
    expect(errors).toEqual([]);
  });

  test('source-picture: unsupported type is skipped; art direction follows the viewport', async ({ page }) => {
    await loadDemo(page, 'source-picture.html');
    const imgs = page.locator('picture img');
    await expect.poll(() => imgs.nth(0).evaluate((i) => i.currentSrc)).toContain('photo-id-20-');
    const wide = (page.viewportSize().width / 16) >= 40;
    await expect.poll(() => imgs.nth(1).evaluate((i) => i.currentSrc))
      .toContain(wide ? 'photo-winter-camp-1200x600' : 'photo-winter-camp-600x340');
    const broken = await imgs.evaluateAll((els) => els.filter((i) => !i.complete || i.naturalWidth === 0).length);
    expect(broken).toBe(0);
  });

  for (const file of ['svg-sizes.html', 'svg-colors.html', 'svg-animations.html', 'svg-responsive.html',
    'svg-in-context.html', 'section-padded.html', 'section-full.html', 'section-contained.html',
    'section-padding.html', 'section-bleed.html', 'section-angle.html', 'section-hairline.html']) {
    test(`${file} loads and has no filled stroke icons`, async ({ page }) => {
      const errors = await loadDemo(page, file);
      const filled = await page.evaluate(() => [...document.querySelectorAll('svg[fill="none"]')]
        .filter((s) => getComputedStyle(s).fill !== 'none').length);
      expect(filled).toBe(0);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('source codec strings in the docs', () => {
  test('documented WebM codec strings are playable; bare av01 is not', async ({ page }) => {
    await load(page, '<p>codecs</p>');
    const r = await page.evaluate(() => {
      const v = document.createElement('video');
      return {
        vp9: v.canPlayType('video/webm; codecs="vp9, opus"'),
        av1: v.canPlayType('video/webm; codecs="av01.0.05M.08"'),
        bare: v.canPlayType('video/webm; codecs=av01'),
      };
    });
    expect(r.vp9).toBe('probably');
    expect(r.av1).toBe('probably');
    expect(r.bare).toBe('');
  });
});
