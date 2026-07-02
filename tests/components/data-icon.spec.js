/**
 * [data-icon] CSS mask rule (Task 2 of the icon architecture).
 * Serves a tiny page that loads VB core CSS and sets --vb-icon by hand,
 * isolating the static CSS rule from the enhancer (Task 3 covers that).
 */

import { test, expect } from 'playwright/test';

const page = `<!doctype html><html data-icon-path="/cdn/icons"><head>
<link rel="stylesheet" href="/src/main.css"></head><body>
<i data-icon="star" style="--vb-icon:url('/cdn/icons/lucide/star.svg')"></i>
<i id="bare" data-icon="star"></i>
</body></html>`;

test.describe('[data-icon] CSS rule', () => {
  test('[data-icon]::before paints a currentColor-tinted em box', async ({ page: p }) => {
    await p.route('**/x.html', (route) => route.fulfill({ contentType: 'text/html', body: page }));
    await p.goto('https://vb.test/x.html');
    const star = p.locator('i[data-icon="star"]').first();
    const box = await star.evaluate((el) => {
      const cs = getComputedStyle(el, '::before');
      return {
        content: cs.content,
        w: cs.width,
        mask: cs.maskImage || cs.webkitMaskImage,
        bg: cs.backgroundColor,
      };
    });
    expect(box.content).toBe('""');
    expect(box.mask).toContain('star.svg');
    // 1em box; default font-size 16px
    expect(box.w).toBe('16px');
  });

  test('unresolved [data-icon] renders no visible square', async ({ page: p }) => {
    await p.route('**/x.html', (route) => route.fulfill({ contentType: 'text/html', body: page }));
    await p.goto('https://vb.test/x.html');
    const mask = await p.locator('#bare').evaluate((el) => {
      const cs = getComputedStyle(el, '::before');
      return cs.maskImage || cs.webkitMaskImage;
    });
    // @property initial value is an empty SVG -> effectively invisible, not "none"
    expect(mask).not.toBe('none');
    expect(mask).toContain('svg');
  });
});

/**
 * No-JS generated-stylesheet path (Important #2 of the whole-feature review).
 * The generated per-set stylesheet (scripts/gen-icon-css.js output) only wins
 * over the layered `[data-icon]:not([data-icon=""]) { --vb-icon: initial; }`
 * reset because it is linked UNLAYERED: unlayered CSS always beats layered
 * CSS regardless of specificity. This reproduces that page shape directly
 * (an unlayered <style> after main.css) WITHOUT loading the enhancer script,
 * proving the no-JS guarantee holds on CSS alone.
 */
const noJsPage = `<!doctype html><html data-icon-path="/cdn/icons"><head>
<link rel="stylesheet" href="/src/main.css">
<style>[data-icon="star"]{--vb-icon:url("/cdn/icons/lucide/star.svg")}</style>
</head><body>
<i id="star" data-icon="star"></i>
</body></html>`;

test.describe('[data-icon] no-JS generated stylesheet path', () => {
  test('unlayered generated rule wins over the layered --vb-icon:initial reset, with no enhancer loaded', async ({ page: p }) => {
    await p.route('**/nojs.html', r => r.fulfill({ contentType: 'text/html', body: noJsPage }));
    await p.goto('https://vb.test/nojs.html');
    const mask = await p.locator('#star').evaluate((el) => {
      const cs = getComputedStyle(el, '::before');
      return cs.maskImage || cs.webkitMaskImage;
    });
    expect(mask).toContain('star.svg');
  });
});

/**
 * [data-icon] enhancer (Task 3 of the icon architecture).
 * Loads the real icon-wc.js bundle (core-loaded) and asserts it sets
 * --vb-icon on every [data-icon] element, without fetching/injecting SVG.
 */
const appPage = `<!doctype html><html data-icon-path="/cdn/icons"><head>
<link rel="stylesheet" href="/src/main.css">
<script type="module" src="/src/web-components/icon-wc/icon-wc.js"></script></head><body>
<i id="a" data-icon="star"></i>
<button id="b" data-icon="x">Close</button>
<span id="c" data-icon="home" data-icon-set="phosphor"></span>
</body></html>`;

test.describe('[data-icon] enhancer', () => {
  test('enhancer sets --vb-icon from name + resolved set', async ({ page: p }) => {
    await p.route('**/app.html', r => r.fulfill({ contentType: 'text/html', body: appPage }));
    await p.goto('https://vb.test/app.html');
    const a = await p.locator('#a').evaluate(el => el.style.getPropertyValue('--vb-icon'));
    const c = await p.locator('#c').evaluate(el => el.style.getPropertyValue('--vb-icon'));
    expect(a).toContain('/cdn/icons/lucide/star.svg');
    expect(c).toContain('/cdn/icons/phosphor/home.svg');
  });

  test('icon coexists with button text', async ({ page: p }) => {
    await p.route('**/app.html', r => r.fulfill({ contentType: 'text/html', body: appPage }));
    await p.goto('https://vb.test/app.html');
    await expect(p.locator('#b')).toHaveText('Close');
    const mask = await p.locator('#b').evaluate(el =>
      (getComputedStyle(el, '::before').maskImage || getComputedStyle(el, '::before').webkitMaskImage));
    expect(mask).toContain('x.svg');
  });

  test('dynamically added [data-icon] is enhanced', async ({ page: p }) => {
    await p.route('**/app.html', r => r.fulfill({ contentType: 'text/html', body: appPage }));
    await p.goto('https://vb.test/app.html');
    const val = await p.evaluate(async () => {
      const i = document.createElement('i');
      i.setAttribute('data-icon', 'search');
      document.body.appendChild(i);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return i.style.getPropertyValue('--vb-icon');
    });
    expect(val).toContain('/cdn/icons/lucide/search.svg');
  });

  test('live data-icon mutation to empty clears stale --vb-icon', async ({ page: p }) => {
    const mutPage = `<!doctype html><html data-icon-path="/cdn/icons"><head>
<link rel="stylesheet" href="/src/main.css">
<script type="module" src="/src/web-components/icon-wc/icon-wc.js"></script></head><body>
<i id="m" data-icon="star"></i>
</body></html>`;
    await p.route('**/mut.html', r => r.fulfill({ contentType: 'text/html', body: mutPage }));
    await p.goto('https://vb.test/mut.html');
    const before = await p.locator('#m').evaluate(el => el.style.getPropertyValue('--vb-icon'));
    expect(before).toContain('/cdn/icons/lucide/star.svg');
    const after = await p.evaluate(async () => {
      const el = document.getElementById('m');
      el.setAttribute('data-icon', '');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return el.style.getPropertyValue('--vb-icon');
    });
    expect(after).toBe('');
  });

  test('live data-icon-set switch on <html> re-resolves descendants', async ({ page: p }) => {
    const setSwitchPage = `<!doctype html><html data-icon-path="/cdn/icons" data-icon-set="lucide"><head>
<link rel="stylesheet" href="/src/main.css">
<script type="module" src="/src/web-components/icon-wc/icon-wc.js"></script></head><body>
<i id="s" data-icon="star"></i>
</body></html>`;
    await p.route('**/setswitch.html', r => r.fulfill({ contentType: 'text/html', body: setSwitchPage }));
    await p.goto('https://vb.test/setswitch.html');
    const before = await p.locator('#s').evaluate(el => el.style.getPropertyValue('--vb-icon'));
    expect(before).toContain('lucide/star.svg');
    const after = await p.evaluate(async () => {
      document.documentElement.setAttribute('data-icon-set', 'tabler');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return document.getElementById('s').style.getPropertyValue('--vb-icon');
    });
    expect(after).toContain('tabler/star.svg');
  });

  test('nested [data-icon] without its own name does not inherit ancestor icon', async ({ page: p }) => {
    // Sets outer's --vb-icon directly (not via the enhancer) so this proves the
    // CSS guard alone, independent of whether the enhancer has run. Inner uses
    // a non-empty (but unresolved, since the enhancer isn't loaded on this
    // page) icon name -- a bare/empty data-icon is the boolean-marker case
    // and is intentionally excluded from the icon rules altogether.
    const nestedPage = `<!doctype html><html data-icon-path="/cdn/icons"><head>
<link rel="stylesheet" href="/src/main.css"></head><body>
<i id="outer" data-icon="star" style="--vb-icon:url('/cdn/icons/lucide/star.svg')"><i id="inner" data-icon="pending" style="display:inline-block"></i></i>
</body></html>`;
    await p.route('**/nested.html', r => r.fulfill({ contentType: 'text/html', body: nestedPage }));
    await p.goto('https://vb.test/nested.html');
    const mask = await p.locator('#inner').evaluate(el =>
      (getComputedStyle(el, '::before').maskImage || getComputedStyle(el, '::before').webkitMaskImage));
    expect(mask).not.toContain('star.svg');
    expect(mask).toContain('svg');
  });
});

/**
 * Bare/empty `data-icon` marker collision (selector-collision fix).
 * `data-icon` is also used elsewhere as a boolean marker attribute with an
 * empty value (e.g. status-message's icon slot: `& > [data-icon]` matched
 * against `<icon-wc data-icon>`). The icon rules in icon-attributes.css must
 * only paint a ::before box when data-icon has a non-empty value, otherwise
 * every bare marker gets an invisible-but-1em-wide generated box that shifts
 * layout.
 */
const collisionPage = `<!doctype html><html><head>
<link rel="stylesheet" href="/src/main.css"></head><body>
<span id="bare-no-value" data-icon></span>
<span id="bare-empty-value" data-icon=""></span>
<i id="valued" data-icon="star" style="--vb-icon:url('/cdn/icons/lucide/star.svg')"></i>
</body></html>`;

test.describe('[data-icon] bare marker does not collide with icon rules', () => {
  test('bare data-icon (no value) generates no ::before content', async ({ page: p }) => {
    await p.route('**/collision.html', r => r.fulfill({ contentType: 'text/html', body: collisionPage }));
    await p.goto('https://vb.test/collision.html');
    const content = await p.locator('#bare-no-value').evaluate((el) => getComputedStyle(el, '::before').content);
    expect(content).toBe('none');
  });

  test('empty data-icon="" generates no ::before content', async ({ page: p }) => {
    await p.route('**/collision.html', r => r.fulfill({ contentType: 'text/html', body: collisionPage }));
    await p.goto('https://vb.test/collision.html');
    const content = await p.locator('#bare-empty-value').evaluate((el) => getComputedStyle(el, '::before').content);
    expect(content).toBe('none');
  });

  test('valued data-icon="star" still generates a ::before box', async ({ page: p }) => {
    await p.route('**/collision.html', r => r.fulfill({ contentType: 'text/html', body: collisionPage }));
    await p.goto('https://vb.test/collision.html');
    const content = await p.locator('#valued').evaluate((el) => getComputedStyle(el, '::before').content);
    expect(content).toBe('""');
  });
});
