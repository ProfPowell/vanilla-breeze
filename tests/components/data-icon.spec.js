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
