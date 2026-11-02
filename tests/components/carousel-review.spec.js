/**
 * carousel-wc — review fixes (vanilla-breeze-5ac4, -i89g, -25vi, -ra3u).
 *
 * Covers the persistent rotation control (WCAG 2.2.2), live-region
 * politeness while rotating, reduced motion, the `slides` setter before and
 * after connection, item-width lengths, RTL arrow keys, region/indicator
 * naming, and the swipe-import race.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__carousel-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/carousel-wc/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('carousel-wc'));
}

const SLIDES = '<article>One</article><article>Two</article><article>Three</article><article>Four</article>';
const AUTOPLAY = `<h2 id="h">Featured</h2><carousel-wc autoplay loop autoplay-delay="1000" aria-labelledby="h">${SLIDES}</carousel-wc>`;

test.describe('rotation control (autoplay)', () => {
  test('renders a rotation button first, naming the action', async ({ page }) => {
    await page.clock.install();
    await load(page, AUTOPLAY);
    const c = page.locator('carousel-wc');
    await expect(c).toHaveAttribute('data-upgraded', '');
    const first = await c.evaluate((el) => el.firstElementChild.className);
    expect(first).toBe('carousel-rotate');
    await expect(c.locator('.carousel-rotate')).toHaveAttribute('aria-label', 'Pause automatic slide show');
    expect(await c.evaluate((el) => el.playing)).toBe(true);
  });

  test('an explicit pause sticks through hover/focus leave and time', async ({ page }) => {
    await page.clock.install();
    await load(page, `${AUTOPLAY}<button id="out">outside</button>`);
    const c = page.locator('carousel-wc');
    const btn = c.locator('.carousel-rotate');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-label', 'Start automatic slide show');
    // Leave the carousel with mouse and focus — must not resume
    await page.mouse.move(0, 0);
    await page.locator('#out').focus();
    await page.clock.runFor(5000);
    expect(await c.evaluate((el) => ({ playing: el.playing, index: el.currentIndex })))
      .toEqual({ playing: false, index: 0 });

    // Play resumes
    await btn.click();
    await expect(btn).toHaveAttribute('aria-label', 'Pause automatic slide show');
    expect(await c.evaluate((el) => el.playing)).toBe(true);
    await page.clock.runFor(1100);
    expect(await c.evaluate((el) => el.currentIndex)).toBe(1);
  });

  test('hover suspends rotation while playing and resumes on leave', async ({ page }) => {
    await page.clock.install();
    await load(page, AUTOPLAY);
    const c = page.locator('carousel-wc');
    await c.locator('.carousel-track').hover();
    expect(await c.evaluate((el) => el.playing)).toBe(false);
    await expect(c.locator('.carousel-rotate')).toHaveAttribute('aria-label', 'Pause automatic slide show');
    await page.mouse.move(0, 0);
    expect(await c.evaluate((el) => el.playing)).toBe(true);
  });

  test('pause() from script updates the control', async ({ page }) => {
    await page.clock.install();
    await load(page, AUTOPLAY);
    const c = page.locator('carousel-wc');
    await c.evaluate((el) => el.pause());
    await expect(c.locator('.carousel-rotate')).toHaveAttribute('aria-label', 'Start automatic slide show');
  });
});

test.describe('live region', () => {
  test('is off while rotating and polite when paused', async ({ page }) => {
    await page.clock.install();
    await load(page, AUTOPLAY);
    const live = page.locator('carousel-wc .carousel-live');
    await expect(live).toHaveAttribute('aria-live', 'off');
    await page.locator('carousel-wc .carousel-rotate').click();
    await expect(live).toHaveAttribute('aria-live', 'polite');
  });

  test('is polite for a manual carousel', async ({ page }) => {
    await load(page, `<carousel-wc>${SLIDES}</carousel-wc>`);
    await expect(page.locator('carousel-wc .carousel-live')).toHaveAttribute('aria-live', 'polite');
  });
});

test('reduced motion: no autoplay and no rotation control', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await load(page, AUTOPLAY);
  const c = page.locator('carousel-wc');
  await expect(c).toHaveAttribute('data-upgraded', '');
  await page.clock.runFor(5000);
  expect(await c.evaluate((el) => ({
    playing: el.playing,
    index: el.currentIndex,
    rotate: el.querySelectorAll('.carousel-rotate').length,
  }))).toEqual({ playing: false, index: 0, rotate: 0 });
});

test.describe('slides data API', () => {
  const RECORDS = [{ html: '<p>A</p>' }, { html: '<p>B</p>', label: 'Bravo' }];

  test('assigned before connection builds once', async ({ page }) => {
    await load(page, '');
    const r = await page.evaluate(async (records) => {
      const c = document.createElement('carousel-wc');
      c.slides = records;
      document.querySelector('main').append(c);
      let changes = 0;
      c.addEventListener('carousel-wc:change', () => changes++);
      c.querySelector('.carousel-next').click();
      await new Promise((res) => setTimeout(res, 300));
      return {
        count: c.slideCount,
        tracks: c.querySelectorAll('.carousel-track').length,
        prev: c.querySelectorAll('.carousel-prev').length,
        upgraded: c.hasAttribute('data-upgraded'),
        label: c.querySelectorAll('[aria-roledescription="slide"]')[1].getAttribute('aria-label'),
        changes,
      };
    }, RECORDS);
    expect(r).toEqual({ count: 2, tracks: 1, prev: 1, upgraded: true, label: 'Bravo', changes: 1 });
  });

  test('assigned while connected rebuilds and releases old listeners', async ({ page }) => {
    await load(page, `<carousel-wc>${SLIDES}</carousel-wc>`);
    await page.waitForSelector('carousel-wc[data-upgraded]');
    const r = await page.evaluate(async (records) => {
      const c = document.querySelector('carousel-wc');
      const oldTrack = c.querySelector('.carousel-track');
      c.slides = records;
      // A keydown on the detached old track must not drive the carousel
      oldTrack.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
      return {
        count: c.slideCount,
        tracks: c.querySelectorAll('.carousel-track').length,
        upgraded: c.hasAttribute('data-upgraded'),
        index: c.currentIndex,
      };
    }, RECORDS);
    expect(r).toEqual({ count: 2, tracks: 1, upgraded: true, index: 0 });
  });
});

test('item-width accepts a CSS length', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  await load(page, `<carousel-wc item-width="200px">${SLIDES}</carousel-wc>`);
  await page.waitForSelector('carousel-wc[data-upgraded]');
  const width = await page.locator('carousel-wc .carousel-track > *').first()
    .evaluate((el) => el.getBoundingClientRect().width);
  expect(Math.round(width)).toBe(200);
});

test.describe('RTL', () => {
  test('ArrowLeft advances and ArrowRight goes back', async ({ page }) => {
    await load(page, `<carousel-wc>${SLIDES}</carousel-wc>`, { dir: 'rtl' });
    await page.waitForSelector('carousel-wc[data-upgraded]');
    const c = page.locator('carousel-wc');
    await c.locator('.carousel-track').focus();
    await page.keyboard.press('ArrowLeft');
    expect(await c.evaluate((el) => el.currentIndex)).toBe(1);
    await page.keyboard.press('ArrowRight');
    expect(await c.evaluate((el) => el.currentIndex)).toBe(0);
  });

  test('goTo scrolls the target slide into view and chevrons mirror', async ({ page }) => {
    await load(page, `<carousel-wc>${SLIDES}</carousel-wc>`, { dir: 'rtl' });
    await page.waitForSelector('carousel-wc[data-upgraded]');
    const c = page.locator('carousel-wc');
    await c.evaluate((el) => el.goTo(2, false));
    const r = await c.evaluate((el) => {
      const track = el.querySelector('.carousel-track').getBoundingClientRect();
      const slide = el.querySelectorAll('[aria-roledescription="slide"]')[2].getBoundingClientRect();
      return {
        offset: Math.round(Math.abs(slide.right - track.right)),
        prevIcon: getComputedStyle(el.querySelector('.carousel-prev icon-wc')).transform,
      };
    });
    expect(r.offset).toBeLessThanOrEqual(1);
    expect(r.prevIcon).toBe('matrix(-1, 0, 0, 1, 0, 0)');
  });
});

test.describe('naming', () => {
  test('authored aria-labelledby wins; indicators are a named group; track unlabelled', async ({ page }) => {
    await page.clock.install();
    await load(page, AUTOPLAY);
    const c = page.locator('carousel-wc');
    await expect(c).toHaveAttribute('data-upgraded', '');
    expect(await c.getAttribute('aria-label')).toBeNull();
    await expect(c.locator('.carousel-indicators')).toHaveAttribute('role', 'group');
    expect(await c.locator('.carousel-track').getAttribute('aria-label')).toBeNull();
  });

  test('falls back to "Carousel" when unlabelled', async ({ page }) => {
    await load(page, `<carousel-wc>${SLIDES}</carousel-wc>`);
    await expect(page.locator('carousel-wc')).toHaveAttribute('aria-label', 'Carousel');
  });
});

test('swipe import resolving after a reconnect binds swipe once', async ({ page }) => {
  await load(page, '');
  const index = await page.evaluate(async (slides) => {
    const main = document.querySelector('main');
    const c = document.createElement('carousel-wc');
    c.setAttribute('transition', 'fade');
    c.innerHTML = slides;
    main.append(c);
    c.remove();
    main.append(c);
    await import('/src/lib/vb-gestures.js');
    await new Promise((res) => setTimeout(res, 50));
    c.querySelector('.carousel-track').dispatchEvent(new CustomEvent('swipe-left'));
    return c.currentIndex;
  }, SLIDES);
  expect(index).toBe(1);
});

// ── carousel-transitions demo: slide text contrast ──────────────────

/** WCAG relative luminance of an `oklch(L% C H)` / `rgb()` colour string (sRGB, clipped). */
function luminance(str) {
  let rgb;
  const ok = str.match(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/);
  if (ok) {
    const L = Number(ok[1]) / (ok[2] ? 100 : 1);
    const C = Number(ok[3]);
    const h = (Number(ok[4]) * Math.PI) / 180;
    const a = C * Math.cos(h); const b = C * Math.sin(h);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    rgb = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ].map((v) => Math.min(1, Math.max(0, v)));
  } else {
    const [r, g, b] = str.match(/[\d.]+/g).slice(0, 3).map((v) => Number(v) / 255);
    rgb = [r, g, b].map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  }
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

test('carousel-transitions demo: slide text is ≥ 4.5:1 against both gradient stops', async ({ page }) => {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = '/__carousel-transitions-demo.html';
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: readFileSync(join(REPO, 'demos/examples/demos/carousel-transitions.html'), 'utf8'),
  }));
  await page.goto(url, { waitUntil: 'load' });
  const slides = await page.locator('.slide').evaluateAll((els) => els.map((el) => ({
    bg: el.dataset.bg,
    image: getComputedStyle(el).backgroundImage,
    text: [...el.querySelectorAll('h3, p')].map((t) => getComputedStyle(t).color),
  })));
  expect(slides.length).toBeGreaterThan(10);
  const failures = [];
  for (const s of slides) {
    const stops = s.image.match(/oklch\([^)]*\)/g) ?? [];
    expect(stops.length, `${s.bg} gradient stops`).toBe(2);
    for (const stop of stops) {
      for (const fg of s.text) {
        const r = ratio(luminance(stop), luminance(fg));
        if (r < 4.5) failures.push(`${s.bg}: ${fg} on ${stop} = ${r.toFixed(2)}`);
      }
    }
  }
  expect(failures).toEqual([]);
});
