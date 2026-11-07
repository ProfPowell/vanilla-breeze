/**
 * Layout element docs (stack, cluster, sidebar, center, cover, grid) —
 * demos added/changed by the layout-docs pass.
 *
 * - Every "Element and attribute forms" demo renders the same layout in both
 *   forms: same computed layout properties on the host and the same child
 *   geometry (relative to the host), at a wide and a narrow viewport.
 * - Demo fixes: accessible overlap avatar group, 404 cover on <main> with a
 *   link, attribute-form hero header, endorsed --layout-min one-offs.
 *
 * Tests the working tree: /src and the demo files are served from disk, not
 * the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const DEMOS = join(REPO, 'demos', 'snippets', 'demos');

async function load(page, file) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__l3-demos/**', (route) => {
    const name = decodeURIComponent(new URL(route.request().url()).pathname).split('/').pop();
    return route.fulfill({ path: join(DEMOS, name), contentType: 'text/html; charset=utf-8' });
  });
  await page.goto(`/__l3-demos/${file}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
}

/** Computed layout of a host plus its children's boxes relative to it. */
function snapshot(page, selector) {
  return page.evaluate((sel) => {
    const host = document.querySelector(sel);
    const cs = getComputedStyle(host);
    const box = host.getBoundingClientRect();
    const props = [
      'display', 'flexDirection', 'flexWrap', 'rowGap', 'columnGap',
      'alignItems', 'justifyContent', 'gridTemplateColumns',
      'maxInlineSize', 'paddingInlineStart', 'paddingInlineEnd',
      'paddingBlockStart', 'minBlockSize', 'textAlign',
    ];
    const style = Object.fromEntries(props.map((p) => [p, cs[p]]));
    const kids = [...host.children].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.left - box.left),
        y: Math.round(r.top - box.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    return { style, w: Math.round(box.width), h: Math.round(box.height), kids };
  }, selector);
}

const FORMS = ['stack', 'cluster', 'sidebar', 'center', 'cover', 'grid'];

for (const width of [1100, 420]) {
  for (const name of FORMS) {
    test(`${name}-forms: element and attribute forms match at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await load(page, `${name}-forms.html`);
      await expect(page.locator(`#${name}-element`)).toBeVisible();
      const el = await snapshot(page, `#${name}-element`);
      const attr = await snapshot(page, `#${name}-attribute`);

      expect(attr.style).toEqual(el.style);
      expect(attr.w).toBe(el.w);
      if (name === 'center') {
        // Element form wraps an <article>; the attribute form is the article.
        expect(attr.h).toBeGreaterThan(0);
      } else if (name === 'cluster') {
        // Attribute form wraps each badge in an <li> (a block with a line
        // box), so heights differ; the inline flow must match exactly.
        expect(attr.kids.map(({ x, w }) => ({ x, w }))).toEqual(el.kids.map(({ x, w }) => ({ x, w })));
      } else {
        expect(attr.h).toBe(el.h);
        expect(attr.kids).toEqual(el.kids);
      }
      // Nothing collapsed to zero width.
      for (const k of el.kids) expect(k.w).toBeGreaterThan(0);
    });
  }
}

test('sidebar-forms: both forms wrap together in a narrow container', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 900 });
  await load(page, 'sidebar-forms.html');
  for (const id of ['#sidebar-element', '#sidebar-attribute']) {
    const { kids } = await snapshot(page, id);
    expect(kids[1].y, `${id} content wraps below the nav`).toBeGreaterThan(kids[0].y);
  }
});

test('cluster-overlap: avatar groups are labelled lists with a named +N chip', async ({ page }) => {
  await load(page, 'cluster-overlap.html');
  const groups = page.locator('ul[data-layout="cluster"][data-layout-overlap]');
  await expect(groups).toHaveCount(4);
  for (const ul of await groups.all()) {
    const labelledby = await ul.getAttribute('aria-labelledby');
    expect(labelledby).toBeTruthy();
    await expect(page.locator(`#${labelledby}`)).toHaveCount(1);
    // Every direct child is an <li>.
    expect(await ul.evaluate((n) => [...n.children].every((c) => c.localName === 'li'))).toBe(true);
  }
  await expect(page.getByRole('img', { name: '3 more members' })).toHaveCount(1);
  // Overlap sizes: xs/s/m/l pull later items back by 0.25/0.5/0.75/1rem.
  const margins = await page.evaluate(() => [...document.querySelectorAll('ul[data-layout-overlap]')]
    .map((ul) => getComputedStyle(ul.children[1]).marginInlineStart));
  expect(margins).toEqual(['-8px', '-4px', '-12px', '-16px']);
});

test('cover-error: attribute form on <main> with a link, principal centred', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await load(page, 'cover-error.html');
  const main = page.locator('main[data-layout="cover"]');
  await expect(main).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Go Home' })).toHaveCount(1);
  await expect(page.getByRole('button')).toHaveCount(0);
  const { mainH, top, bottom } = await page.evaluate(() => {
    const m = document.querySelector('main').getBoundingClientRect();
    const p = document.querySelector('[data-layout-principal]').getBoundingClientRect();
    return { mainH: m.height, top: p.top - m.top, bottom: m.bottom - p.bottom };
  });
  expect(mainH).toBeGreaterThanOrEqual(599); // xl = 100dvh
  expect(Math.abs(top - bottom)).toBeLessThan(2);
});

test('cover-hero: header carries the cluster layout and spans the full width', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  await load(page, 'cover-hero.html');
  const { header, cover } = await page.evaluate(() => ({
    header: document.querySelector('layout-cover > header[data-layout="cluster"]')?.getBoundingClientRect().width,
    cover: document.querySelector('layout-cover').clientWidth,
  }));
  expect(header).toBeGreaterThan(cover * 0.8);
});

test('one-off --layout-min inline style wins over the token (cover and grid)', async ({ page }) => {
  await load(page, 'cover-height-variants.html');
  const coverMin = await page.evaluate(() => getComputedStyle(
    document.querySelector('layout-cover[style*="--layout-min"]')).minBlockSize);
  expect(coverMin).toBe('144px');

  await page.setViewportSize({ width: 1100, height: 900 });
  await load(page, 'grid-min-width.html');
  const tracks = await page.evaluate(() => {
    const g = document.querySelector('layout-grid[style*="--layout-min"]');
    // auto-fit collapses the empty repeated tracks to 0px; keep the used ones.
    return getComputedStyle(g).gridTemplateColumns.split(' ').map(parseFloat).filter((t) => t > 0);
  });
  // 12rem = 192px minimum: every track is at least that wide.
  for (const t of tracks) expect(t).toBeGreaterThanOrEqual(192);
  expect(tracks.length).toBeGreaterThan(1);
});

test('grid-subgrid: 2-row attribute form aligns body rows across cards', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await load(page, 'grid-subgrid.html');
  const tops = await page.evaluate(() => [...document.querySelectorAll('[data-layout-subgrid="2"] > li > p')]
    .map((p) => Math.round(p.getBoundingClientRect().top)));
  expect(tops.length).toBe(3);
  expect(new Set(tops).size).toBe(1);
});

test('grid-subgrid: article children align on subgrid (container-type antidote)', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await load(page, 'grid-subgrid.html');
  const result = await page.evaluate(() => {
    const arts = [...document.querySelectorAll('layout-grid[data-layout-subgrid="2"] > article')];
    return {
      containerTypes: arts.map((a) => getComputedStyle(a).containerType),
      tops: arts.map((a) => Math.round(a.querySelector('p').getBoundingClientRect().top)),
    };
  });
  expect(result.tops.length).toBe(3);
  expect(result.containerTypes).toEqual(['normal', 'normal', 'normal']);
  expect(new Set(result.tops).size).toBe(1);
});

test('new demos render without collapsed hosts', async ({ page }) => {
  for (const file of ['cluster-nowrap.html', 'center-gap.html', 'cover-gap-centered.html', 'sidebar-splitter.html']) {
    await load(page, file);
    const widths = await page.evaluate(() => [...document.querySelectorAll(
      'layout-cluster, layout-center, layout-cover, [data-layout]')].map((n) => n.getBoundingClientRect().width));
    expect(widths.length, file).toBeGreaterThan(0);
    for (const w of widths) expect(w, file).toBeGreaterThan(0);
  }
  // nowrap keeps one line
  await load(page, 'cluster-nowrap.html');
  const rows = await page.evaluate(() => [...document.querySelectorAll('[data-layout-nowrap] > button')]
    .map((b) => Math.round(b.getBoundingClientRect().top)));
  expect(new Set(rows).size).toBe(1);
  // splitter injects its divider
  await load(page, 'sidebar-splitter.html');
  await expect(page.locator('[data-splitter] [role="separator"]')).toHaveCount(1);
});
