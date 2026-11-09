/**
 * nav.steps[data-labels="below"] — even distribution + connector extent.
 *
 * Regression: the last step was content-sized (flex: 0 0 auto) while the
 * others were flex: 1, so markers were spaced unevenly and the last
 * connector (inset -50% of its own, wider step) ran past the final marker.
 * Every step is now an equal column; each connector must start after its
 * marker and stop before the next one.
 *
 * Markers and connectors are pseudo-elements, so the spec measures them
 * from the step box (the marker is centred in its column) and from the
 * resolved px offsets of the absolutely positioned ::after.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const LABELS = ['Account', 'Details', 'Preferences', 'Review and confirm', 'Done'];

/** @param {number} n @param {string} [extra] */
const steps = (n, extra = '') => `
  <nav class="steps" data-labels="below" ${extra} aria-label="Progress ${n}">
    <ol>${LABELS.slice(0, n).map((l, i) =>
      `<li${i === 0 ? ' data-completed' : ''}${i === 1 ? ' aria-current="step"' : ''}>${l}</li>`).join('')}
    </ol>
  </nav>`;

/** @param {import('playwright/test').Page} page @param {string} body */
async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__nav-steps-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css"></head>
      <body style="padding:1rem">${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Physical marker extents and connector extents, ordered by DOM step. */
function measure(page, n) {
  return page.evaluate((label) => {
    const nav = document.querySelector(`nav[aria-label="${label}"]`);
    return [...nav.querySelectorAll('li')].map((li, i, all) => {
      const r = li.getBoundingClientRect();
      const before = getComputedStyle(li, '::before');
      const size = parseFloat(before.width);
      const centre = r.left + r.width / 2;
      const after = getComputedStyle(li, '::after');
      const connector = i < all.length - 1 && after.content !== 'none'
        ? { left: r.left + parseFloat(after.left), right: r.left + parseFloat(after.left) + parseFloat(after.width) }
        : null;
      return { centre, start: centre - size / 2, end: centre + size / 2, connector };
    });
  }, `Progress ${n}`);
}

for (const width of [360, 800, 1200]) {
  for (const n of [3, 4, 5]) {
    for (const dir of ['ltr', 'rtl']) {
      test(`labels-below ${n} steps, ${width}px, ${dir}: even markers, bounded connectors`, async ({ page }) => {
        await page.setViewportSize({ width, height: 600 });
        await load(page, steps(n, dir === 'rtl' ? 'dir="rtl"' : ''));
        const m = await measure(page, n);
        // Visual order: RTL lays steps right-to-left.
        const visual = dir === 'rtl' ? [...m].reverse() : m;

        // Markers evenly spaced.
        const gaps = visual.slice(1).map((s, i) => s.centre - visual[i].centre);
        for (const g of gaps) expect(Math.abs(g - gaps[0])).toBeLessThanOrEqual(1);

        // Connectors: one per gap, each strictly between its two markers.
        for (let i = 0; i < m.length - 1; i++) {
          const c = m[i].connector;
          expect(c, `step ${i + 1} connector`).not.toBeNull();
          const [a, b] = [m[i], m[i + 1]].sort((x, y) => x.centre - y.centre);
          expect(c.left).toBeGreaterThanOrEqual(a.end - 0.5);
          expect(c.right).toBeLessThanOrEqual(b.start + 0.5);
          expect(c.right - c.left).toBeGreaterThan(0);
        }
        expect(m.at(-1).connector).toBeNull();

        // Nothing extends beyond the first and last markers.
        const lo = visual[0].start;
        const hi = visual.at(-1).end;
        for (const s of m) {
          if (!s.connector) continue;
          expect(s.connector.left).toBeGreaterThanOrEqual(lo);
          expect(s.connector.right).toBeLessThanOrEqual(hi);
        }
      });
    }
  }
}

/* ---- Default (labels beside) variant at narrow widths ----
 * Labels beside markers overflowed sideways in narrow containers (4 steps
 * at 360px ran ~230px past the edge). Below a 36rem container the stepper
 * takes the labels-below layout, so nothing may overflow and every label
 * stays visible; wide containers keep labels beside the markers. */

/** @param {number} n @param {string} [extra] */
const beside = (n, extra = '') => `
  <nav class="steps" ${extra} aria-label="Progress ${n}">
    <ol>${LABELS.slice(0, n).map((l, i) =>
      `<li${i === 0 ? ' data-completed' : ''}${i === 1 ? ' aria-current="step"' : ''}>${l}</li>`).join('')}
    </ol>
  </nav>`;

for (const width of [320, 360]) {
  for (const n of [3, 4, 5]) {
    for (const dir of ['ltr', 'rtl']) {
      test(`labels-beside ${n} steps, ${width}px, ${dir}: no overflow, labels visible`, async ({ page }) => {
        await page.setViewportSize({ width, height: 600 });
        await load(page, beside(n, dir === 'rtl' ? 'dir="rtl"' : ''));
        const r = await page.evaluate((label) => {
          const nav = document.querySelector(`nav[aria-label="${label}"]`);
          const box = nav.getBoundingClientRect();
          const ol = nav.querySelector('ol');
          const texts = [...nav.querySelectorAll('li')].map((li) => {
            const range = document.createRange();
            range.selectNodeContents(li);
            const t = range.getBoundingClientRect();
            return { text: li.textContent.trim(), left: t.left, right: t.right, width: t.width };
          });
          return {
            navLeft: box.left, navRight: box.right,
            olOverflow: ol.scrollWidth - ol.clientWidth,
            navOverflow: nav.scrollWidth - nav.clientWidth,
            docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            texts,
          };
        }, `Progress ${n}`);
        expect(r.olOverflow).toBeLessThanOrEqual(0);
        expect(r.navOverflow).toBeLessThanOrEqual(0);
        expect(r.docOverflow).toBeLessThanOrEqual(0);
        for (const t of r.texts) {
          expect(t.width, `${t.text} rendered`).toBeGreaterThan(0);
          expect(t.left, `${t.text} inside nav`).toBeGreaterThanOrEqual(r.navLeft - 0.5);
          expect(t.right, `${t.text} inside nav`).toBeLessThanOrEqual(r.navRight + 0.5);
        }
        // Narrow fallback is the labels-below geometry: evenly spaced markers.
        const m = await measure(page, n);
        const visual = dir === 'rtl' ? [...m].reverse() : m;
        const gaps = visual.slice(1).map((s, i) => s.centre - visual[i].centre);
        for (const g of gaps) expect(Math.abs(g - gaps[0])).toBeLessThanOrEqual(1);
      });
    }
  }
}

test('labels-beside stays beside in a wide container', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 600 });
  await load(page, beside(4));
  const rows = await page.evaluate(() => [...document.querySelectorAll('nav.steps li')].map((li) => {
    const marker = parseFloat(getComputedStyle(li, '::before').height);
    return { dir: getComputedStyle(li).flexDirection, height: li.getBoundingClientRect().height, marker };
  }));
  for (const r of rows) {
    expect(r.dir).toBe('row');
    expect(r.height).toBeLessThanOrEqual(r.marker + 1);
  }
});
