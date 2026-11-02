/**
 * content-swap — B-review fixes (vanilla-breeze-1fvo / i89g / pohq / 25vi / ra3u).
 *
 * Covers: explicit [data-swap] trigger detection, whole-element mode using a
 * real toggle button instead of role=button on the container, the no-JS
 * fallback (faces stacked, not overlapping), externally-set `swapped`,
 * host-only [data-swap] styling and the view-transition-class hook.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ js?: boolean }} [opts]
 */
async function load(page, body, { js = true } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__content-swap-${Math.random().toString(36).slice(2)}.html`;
  const script = js
    ? `<script type="module">import '/src/web-components/content-swap/logic.js';</script>`
    : '';
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${script}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  if (js) await page.waitForFunction(() => customElements.get('content-swap'));
}

const nextSwap = (page, sel = 'content-swap') => page.evaluate((s) => new Promise((resolve) => {
  document.querySelector(s).addEventListener('content-swap:swap',
    (e) => resolve(/** @type {CustomEvent} */ (e).detail), { once: true });
}), sel);

const EXPLICIT = `
  <content-swap transition="fade" id="cs">
    <section data-face="front">
      <h2>Question</h2>
      <p id="front-text">What does inert do?</p>
      <button type="button" data-swap id="show">Show answer</button>
    </section>
    <section data-face="back">
      <h2>Answer</h2>
      <p>It removes content from interaction.</p>
      <button type="button" data-swap id="hide">Back to question</button>
    </section>
  </content-swap>`;

const WHOLE = `
  <content-swap transition="fade" id="cs">
    <section data-face="front">
      <h2>Front heading</h2>
      <p id="front-text">Front body with <a href="#somewhere" id="link">a link</a>.</p>
    </section>
    <section data-face="back">
      <h2>Back heading</h2>
      <p>Back body.</p>
    </section>
  </content-swap>`;

test.describe('explicit [data-swap] triggers', () => {
  test('are detected: container is not a click/keyboard target', async ({ page }) => {
    await load(page, EXPLICIT);
    const cs = page.locator('#cs');
    await expect(cs).toHaveAttribute('data-upgraded', '');
    await expect(cs).not.toHaveAttribute('role', /./);
    await expect(cs).not.toHaveAttribute('tabindex', /./);
    await expect(cs.locator('> [data-swap-toggle]')).toHaveCount(0);

    // Clicking face text (not a trigger) must not swap
    await page.locator('#front-text').click();
    await page.waitForTimeout(100);
    await expect(cs).not.toHaveAttribute('swapped', '');

    const swapped = nextSwap(page, '#cs');
    await page.locator('#show').click();
    expect(await swapped).toEqual({ swapped: true, source: 'pointer' });
    await expect(page.locator('[data-face="front"]')).toHaveJSProperty('inert', true);
  });

  test('keyboard trigger moves focus into the incoming face', async ({ page }) => {
    await load(page, EXPLICIT);
    await page.locator('#show').focus();
    const swapped = nextSwap(page, '#cs');
    await page.keyboard.press('Enter');
    expect(await swapped).toEqual({ swapped: true, source: 'keyboard' });
    await expect(page.locator('#hide')).toBeFocused();
  });

  test('attribute form detects its explicit triggers', async ({ page }) => {
    await load(page, `
      <article data-swap data-transition="fade" id="host">
        <section data-face="front"><p id="front-text">Front</p><button type="button" data-swap id="show">Flip</button></section>
        <section data-face="back"><p>Back</p><button type="button" data-swap>Unflip</button></section>
      </article>`);
    const host = page.locator('#host');
    await expect(host).toHaveAttribute('data-swap-init', '');
    await expect(host).not.toHaveAttribute('role', /./);
    await page.locator('#front-text').click();
    await page.waitForTimeout(100);
    await expect(host).not.toHaveAttribute('data-swapped', '');
    await page.locator('#show').click();
    await expect(host).toHaveAttribute('data-swapped', '');
  });
});

test.describe('whole-element mode', () => {
  test('uses a real toggle button, never role=button on the container', async ({ page }) => {
    await load(page, WHOLE);
    const cs = page.locator('#cs');
    await expect(cs).toHaveAttribute('data-upgraded', '');
    await expect(cs).not.toHaveAttribute('role', /./);
    await expect(cs).not.toHaveAttribute('aria-label', /./);
    await expect(cs).not.toHaveAttribute('tabindex', /./);

    const toggle = cs.locator('> button[data-swap-toggle]');
    await expect(toggle).toHaveCount(1);
    await expect(toggle).toHaveAttribute('type', 'button');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    // Face content stays exposed: heading + link are reachable by role
    await expect(page.getByRole('heading', { name: 'Front heading' })).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'a link' })).toHaveCount(1);
  });

  test('keyboard: Tab reaches the toggle, Enter swaps, focus stays', async ({ page }) => {
    await load(page, WHOLE);
    const toggle = page.locator('#cs > [data-swap-toggle]');
    await toggle.focus();
    await expect(toggle).toBeVisible();
    const swapped = nextSwap(page, '#cs');
    await page.keyboard.press('Enter');
    expect(await swapped).toEqual({ swapped: true, source: 'keyboard' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toBeFocused();
  });

  test('surface click swaps; clicks on links do not', async ({ page }) => {
    await load(page, WHOLE);
    const cs = page.locator('#cs');
    await page.locator('#link').click();
    await page.waitForTimeout(100);
    await expect(cs).not.toHaveAttribute('swapped', '');
    const swapped = nextSwap(page, '#cs');
    await page.locator('#front-text').click({ position: { x: 2, y: 2 } });
    expect(await swapped).toEqual({ swapped: true, source: 'pointer' });
  });

  test('reconnect reuses the toggle instead of duplicating it', async ({ page }) => {
    await load(page, WHOLE);
    const count = await page.evaluate(() => {
      const cs = document.getElementById('cs');
      const parent = cs.parentElement;
      parent.append(cs);
      parent.append(cs);
      return cs.querySelectorAll(':scope > [data-swap-toggle]').length;
    });
    expect(count).toBe(1);
  });
});

test.describe('progressive enhancement', () => {
  test('without JS, faces flow stacked instead of overlapping', async ({ page }) => {
    await load(page, `${WHOLE}
      <article data-swap id="host">
        <section data-face="front"><p>Attr front</p></section>
        <section data-face="back"><p>Attr back</p></section>
      </article>`, { js: false });
    const overlap = await page.evaluate(() => ['#cs', '#host'].map((s) => {
      const host = document.querySelector(s);
      const f = host.querySelector('[data-face="front"]').getBoundingClientRect();
      const b = host.querySelector('[data-face="back"]').getBoundingClientRect();
      const bt = getComputedStyle(host.querySelector('[data-face="back"]')).transform;
      return { stacked: b.top >= f.bottom, transform: bt };
    }));
    for (const o of overlap) {
      expect(o.stacked).toBe(true);
      expect(o.transform).toBe('none');
    }
  });

  test('upgraded, faces share one cell', async ({ page }) => {
    await load(page, WHOLE);
    const sameTop = await page.evaluate(() => {
      const host = document.getElementById('cs');
      const f = host.querySelector('[data-face="front"]').getBoundingClientRect();
      const b = host.querySelector('[data-face="back"]').getBoundingClientRect();
      return Math.abs(f.top - b.top) < 1;
    });
    expect(sameTop).toBe(true);
  });
});

test.describe('state sync', () => {
  test('setting/removing `swapped` externally keeps inert in step', async ({ page }) => {
    await load(page, WHOLE);
    const read = () => page.evaluate(() => {
      const cs = document.getElementById('cs');
      return {
        front: cs.querySelector('[data-face="front"]').inert,
        back: cs.querySelector('[data-face="back"]').inert,
        pressed: cs.querySelector('[data-swap-toggle]')?.getAttribute('aria-pressed'),
      };
    });
    await page.evaluate(() => document.getElementById('cs').setAttribute('swapped', ''));
    expect(await read()).toEqual({ front: true, back: false, pressed: 'true' });
    await page.evaluate(() => document.getElementById('cs').removeAttribute('swapped'));
    expect(await read()).toEqual({ front: false, back: true, pressed: 'false' });
  });

  test('attribute form: data-swapped set externally keeps inert in step', async ({ page }) => {
    await load(page, `
      <article data-swap id="host">
        <section data-face="front"><p>Front</p></section>
        <section data-face="back"><p>Back</p></section>
      </article>`);
    await page.evaluate(() => document.getElementById('host').setAttribute('data-swapped', ''));
    await expect(page.locator('#host [data-face="front"]')).toHaveJSProperty('inert', true);
    await expect(page.locator('#host [data-face="back"]')).toHaveJSProperty('inert', false);
  });
});

test.describe('styling', () => {
  test('[data-swap] trigger buttons do not get host styles', async ({ page }) => {
    await load(page, EXPLICIT);
    const s = await page.evaluate(() => {
      const cs = getComputedStyle(document.getElementById('show'));
      return { display: cs.display, perspective: cs.perspective };
    });
    expect(s.display).not.toBe('grid');
    expect(s.perspective).toBe('none');
  });

  test('view transitions target the content-swap class', async ({ page }) => {
    await load(page, WHOLE);
    const r = await page.evaluate(() => {
      const selectors = [];
      const walk = (rules) => {
        for (const rule of rules) {
          if (rule.selectorText) selectors.push(rule.selectorText);
          if (rule.styleSheet) walk(rule.styleSheet.cssRules);
          if (rule.cssRules) walk(rule.cssRules);
        }
      };
      for (const sheet of document.styleSheets) {
        try { walk(sheet.cssRules); } catch { /* cross-origin */ }
      }
      return {
        hasRule: selectors.some((s) => s.includes('::view-transition-old(*.content-swap)')),
        cls: getComputedStyle(document.getElementById('cs')).getPropertyValue('view-transition-class'),
        name: document.getElementById('cs').style.viewTransitionName,
      };
    });
    expect(r.hasRule).toBe(true);
    expect(r.cls.trim()).toBe('content-swap');
    expect(r.name).toMatch(/^content-swap-\d+$/);
  });
});
