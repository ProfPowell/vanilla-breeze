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

  test('nested [data-icon] without its own name does not inherit ancestor icon', async ({ page: p }) => {
    // Sets outer's --vb-icon directly (not via the enhancer) so this proves the
    // CSS guard alone, independent of whether the enhancer has run.
    const nestedPage = `<!doctype html><html data-icon-path="/cdn/icons"><head>
<link rel="stylesheet" href="/src/main.css"></head><body>
<i id="outer" data-icon="star" style="--vb-icon:url('/cdn/icons/lucide/star.svg')"><i id="inner" data-icon="" style="display:inline-block"></i></i>
</body></html>`;
    await p.route('**/nested.html', r => r.fulfill({ contentType: 'text/html', body: nestedPage }));
    await p.goto('https://vb.test/nested.html');
    const mask = await p.locator('#inner').evaluate(el =>
      (getComputedStyle(el, '::before').maskImage || getComputedStyle(el, '::before').webkitMaskImage));
    expect(mask).not.toContain('star.svg');
    expect(mask).toContain('svg');
  });
});
