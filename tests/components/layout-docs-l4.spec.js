/**
 * Layout element docs, batch L4 (imposter, reel, switcher, columns, text,
 * canvas, card): the claims the doc pages make, checked against the demos
 * they embed.
 *
 * Covers: element and attribute forms render the same (switcher, reel,
 * columns, prose, canvas); the switcher's threshold is its own width; the
 * imposter badge names its count on the button; canvas data-padding survives
 * the mobile breakpoint; card subgrid alignment in both grid forms; every
 * reel demo is a named, focusable scroller.
 *
 * Tests the working tree: /src and the snippet demos are served from disk,
 * not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function serveFromDisk(page) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/docs/snippets/demos/**', (route) => {
    const { pathname } = new URL(route.request().url());
    return route.fulfill({
      path: join(REPO, 'demos/snippets/demos', decodeURIComponent(pathname.replace('/docs/snippets/demos/', ''))),
    });
  });
}

async function demo(page, name) {
  await serveFromDisk(page);
  await page.goto(`/docs/snippets/demos/${name}`, { waitUntil: 'load' });
}

async function load(page, body, { width = 1200 } = {}) {
  await page.setViewportSize({ width, height: 800 });
  await serveFromDisk(page);
  const url = `/__layout-docs-l4-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Top offsets of each child, relative to the parent. */
function childTops(page, selector) {
  return page.locator(selector).evaluate((el) => {
    const top = el.getBoundingClientRect().top;
    return [...el.children].map((c) => Math.round(c.getBoundingClientRect().top - top));
  });
}

test.describe('switcher', () => {
  test('element and attribute forms lay out identically, row then column', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await demo(page, 'switcher-forms.html');
    const el = await childTops(page, 'layout-switcher');
    const attr = await childTops(page, 'section[data-layout="switcher"]');
    expect(el).toEqual([0, 0]);
    expect(attr).toEqual(el);

    await page.setViewportSize({ width: 500, height: 800 });
    const elNarrow = await childTops(page, 'layout-switcher');
    const attrNarrow = await childTops(page, 'section[data-layout="switcher"]');
    // Both forms stack; exact offsets depend on how each demo's text wraps
    // (font metrics differ between macOS and the Linux CI runner).
    expect(elNarrow[0]).toBe(0);
    expect(elNarrow[1]).toBeGreaterThan(0);
    expect(attrNarrow[0]).toBe(0);
    expect(attrNarrow[1]).toBeGreaterThan(0);
  });

  test('threshold is the switcher\'s own width, not the viewport', async ({ page }) => {
    await load(page, `
      <aside id="narrow" style="inline-size: 20rem">
        <layout-switcher id="sw"><span>One</span><span>Two</span></layout-switcher>
      </aside>
      <layout-switcher id="wide"><span>One</span><span>Two</span></layout-switcher>`);
    expect((await childTops(page, '#sw'))[1]).toBeGreaterThan(0);
    expect(await childTops(page, '#wide')).toEqual([0, 0]);
  });

  test('form-actions demo uses the attribute form on the footer', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await demo(page, 'switcher-form-actions.html');
    const footer = page.locator('footer[data-layout="switcher"]');
    await expect(footer).toHaveCSS('display', 'flex');
    expect(await childTops(page, 'footer[data-layout="switcher"]')).toEqual([0, 0]);
  });
});

test.describe('reel', () => {
  test('element and attribute forms give the same item widths', async ({ page }) => {
    await demo(page, 'reel-forms.html');
    const widths = (sel) => page.locator(sel).evaluate((el) =>
      [...el.children].map((c) => Math.round(c.getBoundingClientRect().width)));
    const el = await widths('layout-reel');
    expect(el[0]).toBeGreaterThan(200);
    expect(await widths('section[data-layout="reel"]')).toEqual(el);
    await expect(page.locator('layout-reel')).toHaveAttribute('role', 'region');
  });

  for (const name of ['reel-forms.html', 'reel-item-widths.html', 'reel-padding-align.html']) {
    test(`${name}: every reel is named and focusable`, async ({ page }) => {
      await demo(page, name);
      const reels = await page.locator('layout-reel, [data-layout="reel"]').evaluateAll((els) =>
        els.map((r) => ({ label: r.getAttribute('aria-label'), tabindex: r.getAttribute('tabindex') })));
      expect(reels.length).toBeGreaterThan(0);
      for (const r of reels) {
        expect(r.label).toBeTruthy();
        expect(r.tabindex).toBe('0');
      }
    });
  }

  test('item-widths demo shows s, m, l, xl and full', async ({ page }) => {
    await demo(page, 'reel-item-widths.html');
    const values = await page.locator('[data-layout="reel"]').evaluateAll((els) =>
      els.map((r) => r.getAttribute('data-layout-item-width')));
    expect(values).toEqual(['s', 'm', 'l', 'xl', 'full']);
    const xl = await page.locator('[data-layout-item-width="xl"] > :first-child').evaluate((c) =>
      c.getBoundingClientRect().width / parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(xl).toBeCloseTo(30, 0);
  });

  test('padding-align demo: start alignment keeps items at their own height', async ({ page }) => {
    await demo(page, 'reel-padding-align.html');
    const heights = await page.locator('[data-layout-align="start"]').evaluate((el) =>
      [...el.children].map((c) => Math.round(c.getBoundingClientRect().height)));
    expect(new Set(heights).size).toBeGreaterThan(1);
    const pad = await page.locator('[data-layout-padding="l"]').evaluate((el) => getComputedStyle(el).paddingInlineStart);
    const sizeL = await page.evaluate(() => {
      const probe = document.createElement('p');
      probe.style.paddingInlineStart = 'var(--size-l)';
      document.body.append(probe);
      return getComputedStyle(probe).paddingInlineStart;
    });
    expect(pad).toBe(sizeL);
  });
});

test.describe('imposter', () => {
  test('notification badge: the button names the count, the badge is hidden from AT', async ({ page }) => {
    await demo(page, 'imposter-notification-badge.html');
    await expect(page.getByRole('button', { name: 'Notifications, 3 unread' })).toBeVisible();
    await expect(page.locator('.badge')).toHaveAttribute('aria-hidden', 'true');
    expect(await page.locator('figure').count()).toBe(0);
    // Pinned to the top-end corner of the button's wrapper
    const r = await page.evaluate(() => {
      const anchor = document.querySelector('.badge-anchor').getBoundingClientRect();
      const imp = document.querySelector('layout-imposter').getBoundingClientRect();
      return { right: Math.round(anchor.right - imp.right), top: Math.round(imp.top - anchor.top) };
    });
    expect(r).toEqual({ right: 0, top: 0 });
  });

  test('card status: the card is the positioned box', async ({ page }) => {
    await demo(page, 'imposter-card-status.html');
    expect(await page.locator('figure').count()).toBe(0);
    const r = await page.evaluate(() => {
      const card = document.querySelector('layout-card').getBoundingClientRect();
      const imp = document.querySelector('layout-imposter').getBoundingClientRect();
      return { inside: imp.right <= card.right + 0.5 && imp.top >= card.top - 0.5, nearTop: imp.top - card.top < 40 };
    });
    expect(r).toEqual({ inside: true, nearTop: true });
  });
});

test.describe('text and columns', () => {
  test('layout-text and data-layout="prose" compute the same measure and rhythm; data-measure has no rhythm', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await demo(page, 'layout-text-forms.html');
    const metrics = (sel) => page.locator(sel).evaluate((el) => ({
      max: getComputedStyle(el).maxInlineSize,
      h3Gap: getComputedStyle(el.querySelector('h3')).marginBlockStart,
    }));
    const el = await metrics('layout-text');
    const prose = await metrics('article[data-layout="prose"]');
    const measure = await metrics('article[data-measure]');
    expect(prose).toEqual(el);
    expect(measure.max).toBe(el.max);
    expect(measure.h3Gap).not.toBe(el.h3Gap);
  });

  test('blog post demo uses the prose attribute form, no wrappers', async ({ page }) => {
    await demo(page, 'layout-text-blog-post.html');
    expect(await page.locator('layout-center, layout-text').count()).toBe(0);
    await expect(page.locator('article[data-layout="prose"][data-layout-centered]')).toHaveCount(1);
  });

  test('layout-columns element and attribute forms use the same column count', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await demo(page, 'layout-columns-forms.html');
    const cols = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).columnCount);
    expect(await cols('layout-columns')).toBe('2');
    expect(await cols('article[data-layout="columns"]')).toBe('2');
  });
});

test.describe('canvas', () => {
  test('below 37.5rem an explicit data-padding is kept; the default drops to --size-m', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await demo(page, 'layout-canvas-padding.html');
    const sizes = await page.evaluate(() => {
      const probe = document.createElement('p');
      document.body.append(probe);
      const read = (v) => { probe.style.paddingInlineStart = v; return getComputedStyle(probe).paddingInlineStart; };
      return { s: read('var(--size-s)'), xl: read('var(--size-xl)'), m: read('var(--size-m)') };
    });
    const pad = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).paddingInlineStart);
    expect(await pad('[data-padding="s"]')).toBe(sizes.s);
    expect(await pad('[data-padding="xl"]')).toBe(sizes.xl);

    await load(page, '<article data-canvas><p>Default</p></article>', { width: 400 });
    expect(await pad('[data-canvas]')).toBe(sizes.m);
  });

  test('attribute and element forms paint the same surface', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await demo(page, 'layout-canvas-forms.html');
    const surface = (sel) => page.locator(sel).evaluate((el) => {
      const cs = getComputedStyle(el);
      return [cs.backgroundColor, cs.borderRadius, cs.boxShadow, cs.paddingInlineStart];
    });
    expect(await surface('layout-canvas')).toEqual(await surface('article[data-canvas]'));
  });

  test('data-canvas combines with a data-layout on the same element', async ({ page }) => {
    await load(page, '<article data-canvas data-layout="stack"><p>One</p><p>Two</p></article>');
    const a = page.locator('article');
    await expect(a).toHaveCSS('display', 'flex');
    await expect(a).toHaveCSS('flex-direction', 'column');
    expect(await a.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  });
});

test.describe('card', () => {
  test('subgrid demo: footers line up in both grid forms', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await demo(page, 'layout-card-subgrid.html');
    for (const sel of ['layout-grid[data-layout-subgrid]', 'section[data-layout="grid"][data-layout-subgrid]']) {
      const tops = await page.locator(`${sel} > layout-card > footer`).evaluateAll((els) =>
        els.map((f) => Math.round(f.getBoundingClientRect().top)));
      expect(tops).toHaveLength(3);
      expect(new Set(tops).size, `${sel} footers aligned`).toBe(1);
    }
  });
});
