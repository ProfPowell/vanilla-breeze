/**
 * data-transition presets work without the opt-in stylesheet (vanilla-breeze-4rgo).
 *
 * data-transition="slide|fade|scale|none" sets a view-transition-class, but
 * the ::view-transition rules that animate those classes lived only in
 * utils/view-transitions.css, which the main bundle doesn't import, so every
 * preset fell back to the browser's plain crossfade. The presets, duration
 * tokens and reduced-motion rule now ship in vt-keyframes.css (always on);
 * the cross-document @view-transition opt-in stays out of the main bundle.
 */
import { test, expect } from 'playwright/test';

async function load(page, body = '') {
  const url = `/__vt-presets-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/cdn/vanilla-breeze.css"></head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Every rule's cssText in the page, flattened through @layer/@media/@import. */
const allRuleText = (page) => page.evaluate(() => {
  const out = [];
  const walk = (rules) => {
    for (const r of rules) {
      if (r.styleSheet) { try { walk(r.styleSheet.cssRules); } catch { /* cross-origin */ } }
      // CSSStyleRule also has cssRules (nesting), so test the grouping type.
      else if (r instanceof CSSGroupingRule && !(r instanceof CSSStyleRule)) {
        out.push(r.cssText.split('{')[0]);
        walk(r.cssRules);
      } else out.push(r.cssText);
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules); } catch { /* cross-origin (web fonts) */ }
  }
  return out;
});

test('main bundle animates every data-transition preset class', async ({ page }) => {
  await load(page);
  const rules = (await allRuleText(page)).join('\n');
  for (const cls of ['slide-left', 'slide-right', 'scale', 'fade', 'none']) {
    expect(rules, `::view-transition-new(*.${cls})`).toContain(`::view-transition-new(*.${cls})`);
  }
});

test('main bundle carries the duration tokens and the reduced-motion rule', async ({ page }) => {
  await load(page);
  const duration = await page.evaluate(() => getComputedStyle(document.documentElement)
    .getPropertyValue('--view-transition-duration').trim());
  expect(duration).toMatch(/^0?\.3s$/); // minifier drops the leading zero
  const rules = await allRuleText(page);
  expect(rules.some((r) => r.includes('::view-transition-group(*)') && r.includes('0.01ms'))).toBe(true);
});

test('main bundle does not opt into cross-document transitions', async ({ page }) => {
  await load(page);
  const rules = await allRuleText(page);
  expect(rules.filter((r) => r.startsWith('@view-transition'))).toEqual([]);
});

// The runtime self-boots and processes [data-transition] before
// vb-transitions.js registers the presets; VB.transition() re-wires them.
test('data-transition="slide" gets the slide-left class', async ({ page }) => {
  await load(page, '<section id="s" data-transition="slide">x</section><script type="module" src="/cdn/vanilla-breeze.js"></script>');
  await expect.poll(() => page.locator('#s').evaluate((el) => el.style.viewTransitionClass)).toBe('slide-left');
});

/* ── Core and core+extras (effects review e2, bundle parity) ─────────────────
 * The presets used to be registered only by vanilla-breeze.js / autoload, so
 * on core and core+extras pages (the production docs) every preset got an
 * unnamed fallback and `stagger` named nothing. Needs a build.
 */
async function loadWith(page, css, scripts, body) {
  const url = `/__vt-presets-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="${css}"></head><body>${body}
      ${scripts.map((s) => `<script type="module" src="${s}"></script>`).join('')}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

for (const [label, scripts] of [
  ['core', ['/cdn/vanilla-breeze-core.js']],
  ['core + extras', ['/cdn/vanilla-breeze-core.js', '/cdn/vanilla-breeze-extras.js']],
]) {
  test(`${label}: slide and stagger presets apply`, async ({ page }) => {
    await loadWith(page, '/cdn/vanilla-breeze-core.css', scripts, `
      <section id="s" data-transition="slide">x</section>
      <ul id="l" data-transition="stagger"><li>a</li><li>b</li><li>c</li></ul>`);
    await expect.poll(() => page.locator('#s').evaluate((el) => el.style.viewTransitionClass)).toMatch(/^slide-(left|right)$/);
    await expect.poll(() => page.locator('#l li').evaluateAll((lis) => lis.map((li) => li.style.viewTransitionClass)))
      .toEqual(['fade vt-stagger-0', 'fade vt-stagger-1', 'fade vt-stagger-2']);
    const names = await page.locator('#l li').evaluateAll((lis) => lis.map((li) => li.style.viewTransitionName));
    expect(new Set(names).size).toBe(3);
    expect(names.every(Boolean)).toBe(true);
    // The delay-ladder rules ship in the core stylesheet.
    const rules = (await allRuleText(page)).join('\n');
    expect(rules).toContain('::view-transition-group(*.vt-stagger-1)');
  });
}
