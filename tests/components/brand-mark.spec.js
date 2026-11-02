/**
 * brand-mark — authored content is content (vanilla-breeze-7d4m).
 *
 * The owner's rule: the component never removes, replaces, reorders or
 * flattens author-written children. It may only insert/update/remove the
 * one element it owns (<picture data-brand-mark-img>) from the src
 * attributes; image-only vs wordmark is CSS.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const svg = (w, h, fill) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${fill}"/></svg>`;
const ASSETS = {
  'light.svg': svg(160, 40, '#111'),
  'dark.svg': svg(160, 40, '#eee'),
  'icon.svg': svg(40, 40, '#4f46e5'),
};

const AUTHORED = `<img src="/__bm/icon.svg" alt="" width="40" height="40"> Acme Inc <em>Making things better</em>`;

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__bm/*.svg', (route) => route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    body: ASSETS[new URL(route.request().url()).pathname.split('/').pop()],
  }));
  const url = `/__brand-mark-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/brand-mark/logic.js';</script>
      </head><body><main>${body}</main><aside id="elsewhere"></aside></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('brand-mark'));
  await page.waitForSelector('brand-mark[data-upgraded]', { state: 'attached' });
}

/**
 * Snapshot of the authored children: serialized HTML minus the owned
 * element, plus whether every original node is still the same node in the
 * same order (catches replace-with-identical-copy).
 */
function installProbe(page) {
  return page.evaluate(() => {
    const strip = (el) => {
      const c = el.cloneNode(true);
      c.querySelector(':scope > [data-brand-mark-img]')?.remove();
      return c.innerHTML;
    };
    const bm = document.querySelector('brand-mark');
    const nodes = [...bm.childNodes].filter((n) => !(n instanceof Element && n.hasAttribute('data-brand-mark-img')));
    window.__bm = { html: strip(bm), nodes };
    window.__bmCheck = () => {
      const el = document.querySelector('brand-mark');
      const now = [...el.childNodes].filter((n) => !(n instanceof Element && n.hasAttribute('data-brand-mark-img')));
      return {
        sameHtml: strip(el) === window.__bm.html,
        sameNodes: now.length === window.__bm.nodes.length && now.every((n, i) => n === window.__bm.nodes[i]),
        owned: el.querySelectorAll(':scope > [data-brand-mark-img]').length,
        ariaLabel: el.getAttribute('aria-label'),
      };
    };
  });
}

const check = (page) => page.evaluate(() => window.__bmCheck());

/** Chromium's own computed accessible name for the first link. */
async function axLinkName(page) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const link = nodes.find((n) => n.role?.value === 'link');
  return link?.name?.value;
}

test.describe('authored content is never modified', () => {
  test('without src: upgrade leaves authored img, text and tagline as written', async ({ page }) => {
    await load(page, `<brand-mark>${AUTHORED}</brand-mark>`);
    await installProbe(page);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 50)));
    expect(await check(page)).toEqual({ sameHtml: true, sameNodes: true, owned: 0, ariaLabel: null });
    // Original markup, not just "equal after upgrade": the authored <img> is still there.
    expect(await page.locator('brand-mark > img').count()).toBe(1);
    expect(await page.locator('brand-mark > em').textContent()).toBe('Making things better');
  });

  test('with src: authored content kept, one owned picture prepended', async ({ page }) => {
    await load(page, `<brand-mark src="/__bm/light.svg">${AUTHORED}</brand-mark>`);
    const r = await page.evaluate(() => {
      const bm = document.querySelector('brand-mark');
      return {
        first: bm.firstElementChild?.matches('picture[data-brand-mark-img]'),
        authoredImg: bm.querySelectorAll(':scope > img').length,
        em: bm.querySelector(':scope > em')?.textContent,
        text: bm.textContent.includes('Acme Inc'),
      };
    });
    expect(r).toEqual({ first: true, authoredImg: 1, em: 'Making things better', text: true });
  });

  test('move/reconnect keeps authored nodes and does not duplicate the owned image', async ({ page }) => {
    await load(page, `<brand-mark src="/__bm/light.svg">${AUTHORED}</brand-mark>`);
    await installProbe(page);
    await page.evaluate(() => {
      const bm = document.querySelector('brand-mark');
      document.getElementById('elsewhere').append(bm);
      document.querySelector('main').append(bm);
    });
    await page.waitForSelector('brand-mark[data-upgraded]', { state: 'attached' });
    expect(await check(page)).toEqual({ sameHtml: true, sameNodes: true, owned: 1, ariaLabel: null });
  });

  test('setting then removing src only adds/removes the owned image', async ({ page }) => {
    await load(page, `<brand-mark>${AUTHORED}</brand-mark>`);
    await installProbe(page);

    await page.evaluate(() => document.querySelector('brand-mark').setAttribute('src', '/__bm/light.svg'));
    expect(await check(page)).toEqual({ sameHtml: true, sameNodes: true, owned: 1, ariaLabel: null });

    await page.evaluate(() => document.querySelector('brand-mark').setAttribute('src', '/__bm/dark.svg'));
    expect(await check(page)).toEqual({ sameHtml: true, sameNodes: true, owned: 1, ariaLabel: null });
    expect(await page.locator('[data-brand-mark-img] img').getAttribute('src')).toBe('/__bm/dark.svg');

    await page.evaluate(() => document.querySelector('brand-mark').removeAttribute('src'));
    expect(await check(page)).toEqual({ sameHtml: true, sameNodes: true, owned: 0, ariaLabel: null });
  });
});

test.describe('image-only vs wordmark presentation', () => {
  test('image only: text stays in the DOM, visually hidden, and names the link', async ({ page }) => {
    await load(page, `<a href="/"><brand-mark src="/__bm/light.svg">Acme Inc <em>Tagline</em></brand-mark></a>`);
    await page.waitForFunction(() => document.querySelector('[data-brand-mark-img] img')?.complete);
    const r = await page.evaluate(() => {
      const bm = document.querySelector('brand-mark');
      const img = bm.querySelector('[data-brand-mark-img] img');
      const host = bm.getBoundingClientRect();
      const em = bm.querySelector('em').getBoundingClientRect();
      return {
        alt: img.getAttribute('alt'),
        text: bm.textContent.includes('Acme Inc'),
        hostW: Math.round(host.width),
        imgW: Math.round(img.getBoundingClientRect().width),
        emW: Math.round(em.width),
      };
    });
    expect(r.alt).toBe('');
    expect(r.text).toBe(true);
    expect(r.hostW).toBe(r.imgW); // the hidden text adds no width
    expect(r.emW).toBeLessThanOrEqual(1);
    await expect(page.locator('a')).toHaveAccessibleName('Acme Inc Tagline');
    expect((await axLinkName(page))?.replace(/\s+/g, ' ').trim()).toBe('Acme Inc Tagline');
  });

  test('wordmark toggles with src unchanged; authored text becomes visible', async ({ page }) => {
    await load(page, `<brand-mark src="/__bm/icon.svg">Acme Inc</brand-mark>`);
    const widthOf = () => page.evaluate(() => Math.round(document.querySelector('brand-mark').getBoundingClientRect().width));
    await page.waitForFunction(() => document.querySelector('[data-brand-mark-img] img')?.complete);
    const imageOnly = await widthOf();
    await page.evaluate(() => document.querySelector('brand-mark').setAttribute('wordmark', ''));
    const withWordmark = await widthOf();
    expect(withWordmark).toBeGreaterThan(imageOnly + 30);
    await page.evaluate(() => document.querySelector('brand-mark').removeAttribute('wordmark'));
    expect(await widthOf()).toBe(imageOnly);
  });

  test('no aria-label is ever put on the host', async ({ page }) => {
    await load(page, `<brand-mark src="/__bm/light.svg">Acme Inc</brand-mark>`);
    await page.evaluate(() => {
      const bm = document.querySelector('brand-mark');
      bm.setAttribute('alt', 'Acme');
      bm.setAttribute('wordmark', '');
      bm.removeAttribute('wordmark');
    });
    expect(await page.locator('brand-mark').getAttribute('aria-label')).toBeNull();
  });
});

test.describe('alt attribute', () => {
  test('image only + alt: alt is the single accessible name', async ({ page }) => {
    await load(page, `<a href="/"><brand-mark src="/__bm/light.svg" alt="Acme logo">Acme Inc</brand-mark></a>`);
    expect(await page.locator('[data-brand-mark-img] img').getAttribute('alt')).toBe('Acme logo');
    // Chromium's own name computation. (Playwright's toHaveAccessibleName
    // heuristic stops descending at the visibility:hidden host and misses the
    // visibility:visible image inside it, so it is not used here.)
    expect((await axLinkName(page))?.trim()).toBe('Acme logo');
    // Authored text is still in the DOM.
    expect(await page.locator('brand-mark').textContent()).toContain('Acme Inc');
  });

  test('wordmark + alt: visible text is the name, image decorative', async ({ page }) => {
    await load(page, `<a href="/"><brand-mark src="/__bm/icon.svg" alt="Acme logo" wordmark>Acme Inc</brand-mark></a>`);
    expect(await page.locator('[data-brand-mark-img] img').getAttribute('alt')).toBe('');
    await expect(page.locator('a')).toHaveAccessibleName('Acme Inc');
  });

  test('no authored text: alt names the image; alt changes apply with src unchanged', async ({ page }) => {
    await load(page, `<a href="/"><brand-mark src="/__bm/light.svg" alt="Acme" wordmark></brand-mark></a>`);
    const img = page.locator('[data-brand-mark-img] img');
    expect(await img.getAttribute('alt')).toBe('Acme');
    await page.evaluate(() => document.querySelector('brand-mark').setAttribute('alt', 'Acme Corp'));
    expect(await img.getAttribute('alt')).toBe('Acme Corp');
    await expect(page.locator('a')).toHaveAccessibleName('Acme Corp');
  });
});

test('height attribute sets the rendered logo height, also when src is unchanged', async ({ page }) => {
  await load(page, `<brand-mark src="/__bm/light.svg" height="40">Acme Inc</brand-mark>`);
  const h = () => page.evaluate(() => Math.round(document.querySelector('[data-brand-mark-img] img').getBoundingClientRect().height));
  expect(await h()).toBe(40);
  await page.evaluate(() => document.querySelector('brand-mark').setAttribute('height', '56'));
  expect(await h()).toBe(56);
  await page.evaluate(() => document.querySelector('brand-mark').setAttribute('height', '3rem'));
  expect(await h()).toBe(48);
  await page.evaluate(() => document.querySelector('brand-mark').removeAttribute('height'));
  expect(await h()).toBe(32); // --brand-mark-height default 2rem
});

test('src-dark follows <html data-mode> reactively', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await load(page, `<brand-mark src="/__bm/light.svg" src-dark="/__bm/dark.svg">Acme Inc</brand-mark>`);
  const src = () => page.locator('[data-brand-mark-img] img').getAttribute('src');
  expect(await src()).toBe('/__bm/light.svg');

  await page.evaluate(() => document.documentElement.setAttribute('data-mode', 'dark'));
  await expect.poll(src).toBe('/__bm/dark.svg');
  await page.evaluate(() => document.documentElement.setAttribute('data-mode', 'light'));
  await expect.poll(src).toBe('/__bm/light.svg');

  // Still reactive after a move (observers re-armed by setup()).
  await page.evaluate(() => {
    const bm = document.querySelector('brand-mark');
    document.getElementById('elsewhere').append(bm);
  });
  await page.evaluate(() => document.documentElement.setAttribute('data-mode', 'dark'));
  await expect.poll(src).toBe('/__bm/dark.svg');
  expect(await page.locator('[data-brand-mark-img]').count()).toBe(1);
});

test('src-compact switches to the compact logo below the breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await load(page, `<brand-mark src="/__bm/light.svg" src-compact="/__bm/icon.svg">Acme Inc</brand-mark>`);
  const current = () => page.evaluate(() => {
    const img = document.querySelector('[data-brand-mark-img] img');
    return img.complete ? new URL(img.currentSrc).pathname : '';
  });
  await expect.poll(current).toBe('/__bm/light.svg');
  await page.setViewportSize({ width: 500, height: 800 });
  await expect.poll(current).toBe('/__bm/icon.svg');

  // compact-media overrides the breakpoint.
  await page.evaluate(() => document.querySelector('brand-mark').setAttribute('compact-media', '(width < 400px)'));
  await expect.poll(current).toBe('/__bm/light.svg');

  await page.evaluate(() => document.querySelector('brand-mark').removeAttribute('src-compact'));
  expect(await page.locator('[data-brand-mark-img] source').count()).toBe(0);
});
