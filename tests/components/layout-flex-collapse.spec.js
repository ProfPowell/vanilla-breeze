/**
 * Semantic-section children must keep their intrinsic size in flex/grid layouts.
 *
 * layout-attributes.css makes every main/article/section/aside an inline-size
 * container. Size containment zeroes a flex/grid item's intrinsic inline size,
 * so a bare <section> placed directly in a content-sized flex/grid layout
 * collapses to zero width and vanishes (memory: container_type_flex_item_collapse).
 * The central `container-type: normal` antidote in layout-attributes.css undoes
 * that for the at-risk layouts; this test pins the behaviour.
 *
 * The fixtures are pure CSS (the layout-* rules apply by selector, no component
 * upgrade needed), so they are served as a routed page linking the built
 * bundle. Each item is a bare <section> with a background and no width/padding,
 * so a collapse shows up unambiguously as width 0.
 */

import { test, expect } from 'playwright/test';

/* Every flex/grid layout that can hold semantic-section children. `collapses`
 * marks the layouts the antidote is load-bearing for — cluster, reel and centered
 * cover (align-items: center makes items content-sized) collapse without it; the rest give their items a definite size and
 * survive regardless, so they are deliberately NOT in the antidote (see
 * layout-attributes.css). The test asserts non-zero width for all of them
 * either way, which keeps the survivors honest too. */
const LAYOUTS = [
  { label: 'layout-cluster element', markup: '<layout-cluster>', collapses: true },
  { label: 'data-layout=cluster', markup: '<section data-layout="cluster">', collapses: true },
  { label: 'layout-reel element', markup: '<layout-reel>', collapses: true },
  { label: 'layout-switcher element', markup: '<layout-switcher>', collapses: false },
  { label: 'data-layout=switcher', markup: '<section data-layout="switcher">', collapses: false },
  { label: 'layout-cover element', markup: '<layout-cover>', collapses: false },
  { label: 'centered layout-cover element', markup: '<layout-cover data-layout-centered>', collapses: true },
  { label: 'centered data-layout=cover', markup: '<section data-layout="cover" data-layout-centered>', collapses: true },
  { label: 'data-layout=media', markup: '<section data-layout="media">', collapses: false },
  { label: 'data-layout=split', markup: '<section data-layout="split">', collapses: false },
  { label: 'layout-sidebar element', markup: '<layout-sidebar>', collapses: false },
];

async function render(page, openTag) {
  const closeTag = openTag.startsWith('<layout-')
    ? `</${openTag.slice(1).split(/[\s>]/)[0]}>`
    : '</section>';
  const url = '/__flex-collapse-fixture.html';
  await page.route(`**${url}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body:
        `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
        `<link rel="stylesheet" href="/cdn/vanilla-breeze.css">` +
        `<style>body{inline-size:900px}.item{background:#333}</style></head><body>` +
        `${openTag}<section class="item">Alpha</section>` +
        `<section class="item">Beta content</section>${closeTag}</body></html>`,
    }),
  );
  await page.goto(url, { waitUntil: 'load' });
}

test.describe('flex/grid layouts keep section children sized', () => {
  for (const { label, markup } of LAYOUTS) {
    test(`${label}: section children have non-zero width`, async ({ page }) => {
      await render(page, markup);
      const widths = await page.evaluate(() =>
        [...document.querySelectorAll('.item')].map((el) =>
          Math.round(el.getBoundingClientRect().width),
        ),
      );
      for (const w of widths) expect(w).toBeGreaterThan(0);
    });
  }

  test('centered cover: a principal section keeps its content width (vanilla-breeze-vwez)', async ({ page }) => {
    // The collapse here is not to zero: a contained, content-sized section
    // shrinks to its longest word, so a sentence wraps one word per line.
    const url = '/__cover-centered-fixture.html';
    await page.route(`**${url}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body:
          `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
          `<link rel="stylesheet" href="/cdn/vanilla-breeze.css">` +
          `<style>body{inline-size:900px}</style></head><body>` +
          `<layout-cover data-layout-centered><section data-layout-principal>` +
          `<p id="lead">The principal content is vertically centered</p></section></layout-cover>` +
          `</body></html>`,
      }),
    );
    await page.goto(url, { waitUntil: 'load' });
    const lines = await page.evaluate(() => {
      const p = document.getElementById('lead');
      return Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight));
    });
    expect(lines).toBe(1);
  });

  test('an explicit [data-container] child still establishes a container', async ({ page }) => {
    // The antidote's specificity (0,0,2) sits below [data-container] (0,1,0), so
    // an author who deliberately wants container queries on a flex child keeps
    // them.
    const url = '/__flex-container-optin.html';
    await page.route(`**${url}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body:
          `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
          `<link rel="stylesheet" href="/cdn/vanilla-breeze.css"></head><body>` +
          `<layout-cluster><section data-container id="c">x</section></layout-cluster>` +
          `</body></html>`,
      }),
    );
    await page.goto(url, { waitUntil: 'load' });
    const ct = await page.evaluate(
      () => getComputedStyle(document.getElementById('c')).containerType,
    );
    expect(ct).toBe('inline-size');
  });
});
