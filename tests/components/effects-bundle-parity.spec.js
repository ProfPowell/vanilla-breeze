/**
 * Effects runtime parity on the BUILT bundles (needs `npm run build`).
 *
 * Every bundle that carries the VB effects runtime must register every
 * built-in data-trigger and data-transition preset. Before this, only
 * vanilla-breeze.js and the autoload bundle did: on core, core+extras (the
 * production docs) and the effects pack, every data-trigger did nothing and
 * every preset fell back to an unnamed view-transition-name.
 *
 * Source-level twin: tests/unit/effects-bundle-parity.test.js.
 */
import { test, expect } from 'playwright/test';

const TRIGGERS = ['scroll', 'hover', 'click', 'time', 'intersect', 'media', 'event', 'vt', 'view-progress', 'scroll-progress'];
const TRANSITIONS = ['morph', 'slide', 'fade', 'scale', 'stagger', 'none', 'effect'];

const BUNDLES = {
  core: { css: ['/cdn/vanilla-breeze-core.css'], js: ['/cdn/vanilla-breeze-core.js'] },
  'core + extras': { css: ['/cdn/vanilla-breeze-core.css'], js: ['/cdn/vanilla-breeze-core.js', '/cdn/vanilla-breeze-extras.js'] },
  full: { css: ['/cdn/vanilla-breeze.css'], js: ['/cdn/vanilla-breeze.js'] },
  autoload: { css: ['/cdn/vanilla-breeze.css'], js: ['/cdn/vanilla-breeze-autoload.js'] },
  'effects pack alone': { css: [], js: ['/cdn/packs/effects.full.js'] },
  'kawaii pack alone': { css: [], js: ['/cdn/packs/kawaii.full.js'] },
};

async function load(page, { css, js }, body) {
  const url = `/__effects-parity-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      ${css.map((h) => `<link rel="stylesheet" href="${h}">`).join('')}
      ${js.map((s) => `<script type="module" src="${s}"></script>`).join('')}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => Boolean(globalThis.__vbEffectsRuntime?._triggers?.size));
}

for (const [label, bundle] of Object.entries(BUNDLES)) {
  test(`${label}: registers every built-in trigger and transition preset`, async ({ page }) => {
    await load(page, bundle, `
      <button id="b" type="button" data-effect="pulse" data-trigger="click">x</button>
      <section id="s" data-transition="slide">y</section>`);
    const got = await page.evaluate(() => {
      const VB = /** @type {any} */ (globalThis).__vbEffectsRuntime;
      return { triggers: [...VB._triggers.keys()], transitions: [...VB._transitions.keys()] };
    });
    expect(got.triggers).toEqual(expect.arrayContaining(TRIGGERS));
    expect(got.transitions).toEqual(expect.arrayContaining(TRANSITIONS));

    // And the wiring reaches the page: the click trigger arms + toggles, the
    // slide preset sets its class.
    await expect(page.locator('#b')).toHaveAttribute('data-effect-armed', '');
    await page.locator('#b').dispatchEvent('click');
    await expect(page.locator('#b')).toHaveAttribute('data-effect-active', '');
    await expect.poll(() => page.locator('#s').evaluate((el) => el.style.viewTransitionClass)).toMatch(/^slide-/);
  });
}

test('core stylesheet carries the data-stagger delay rule (its runtime is in core JS)', async ({ page }) => {
  await load(page, BUNDLES.core, `
    <ul data-stagger="120ms"><li id="a">a</li><li id="b">b</li><li id="c">c</li></ul>`);
  await expect.poll(() => page.locator('#c').evaluate((el) => getComputedStyle(el).getPropertyValue('--vb-delay').replace(/\s+/g, ''))).not.toBe('');
  const delay = await page.locator('#c').evaluate((el) => {
    const probe = document.createElement('i');
    probe.style.transitionDelay = 'var(--vb-delay)';
    el.append(probe);
    return getComputedStyle(probe).transitionDelay;
  });
  expect(delay).toBe('0.24s');
});
