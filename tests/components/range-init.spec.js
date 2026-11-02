/**
 * data-range — deterministic bubble/label placement (vanilla-breeze-tn0j).
 *
 * The bubble and datalist labels used to be placed in px from a one-shot
 * layout read (bubble at init, labels in a rAF), so anything that changed
 * the slider's box afterwards — a theme stylesheet landing, a resize — left
 * them stale, and screenshots depended on timing. They are now positioned
 * in CSS from --range-frac. Also covers the [data-bubble] attribute
 * collision: the chat-bubble shape rule (padding, max-width: 75%) no longer
 * lands on the slider.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 */
async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__range-init-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <style>main { inline-size: 480px; }</style>
      <script type="module">import '/src/utils/range-init.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('input[data-range-init]', { state: 'attached' });
}

/* The compendium 'labels' variant */
const LABELS = `<label>Price range
  <input type="range" min="0" max="1000" step="100" value="500" list="prices" data-range data-bubble data-prefix="$" data-markers>
</label>
<datalist id="prices">
  <option value="0" label="$0">
  <option value="500" label="$500">
  <option value="1000" label="$1000">
</datalist>`;

/**
 * Centre x of the bubble and each label, and where the thumb centre sits for
 * each of their values, relative to the input's left edge.
 * @param {import('playwright/test').Page} page
 */
function geometry(page) {
  return page.evaluate(() => {
    const input = /** @type {HTMLInputElement} */ (document.querySelector('input[data-range]'));
    const ib = input.getBoundingClientRect();
    const thumb = parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.25;
    const min = Number(input.min), max = Number(input.max);
    const thumbAt = (/** @type {number} */ v) => thumb / 2 + ((v - min) / (max - min)) * (ib.width - thumb);
    const centre = (/** @type {Element} */ el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2 - ib.left; };
    const bubble = /** @type {Element} */ (document.querySelector('.range-bubble'));
    return {
      inputWidth: ib.width,
      wrapperWidth: /** @type {HTMLElement} */ (input.parentElement).getBoundingClientRect().width,
      padding: getComputedStyle(input).paddingInlineStart,
      bubbleText: bubble.textContent,
      bubble: [centre(bubble), thumbAt(Number(input.value))],
      labels: Array.from(document.querySelectorAll('.range-labels span'), (s, i) =>
        [centre(s), thumbAt(Number(/** @type {HTMLDataListElement} */ (document.getElementById('prices')).options[i].value))]),
    };
  });
}

test('bubble and labels sit on the thumb centre, synchronously at init', async ({ page }) => {
  await load(page, LABELS);
  const g = await geometry(page);
  /* chat-bubble shape rule no longer shrinks or pads the slider */
  expect(g.inputWidth).toBe(g.wrapperWidth);
  expect(g.padding).toBe('0px');
  expect(g.bubbleText).toBe('$500');
  expect(Math.abs(g.bubble[0] - g.bubble[1])).toBeLessThan(1);
  expect(g.labels).toHaveLength(3);
  for (const [at, want] of g.labels) expect(Math.abs(at - want)).toBeLessThan(1);
});

test('positions follow layout changes and input without re-measuring', async ({ page }) => {
  await load(page, LABELS);
  /* A late layout change (what a theme stylesheet landing used to break) */
  await page.addStyleTag({ content: 'main { inline-size: 300px; }' });
  await page.locator('input[data-range]').evaluate((/** @type {HTMLInputElement} */ el) => {
    el.value = '800';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const g = await geometry(page);
  expect(g.inputWidth).toBe(300);
  expect(g.bubbleText).toBe('$800');
  expect(Math.abs(g.bubble[0] - g.bubble[1])).toBeLessThan(1);
  for (const [at, want] of g.labels) expect(Math.abs(at - want)).toBeLessThan(1);
});
