/**
 * View-transition keyframes ship in the main bundles (vanilla-breeze-g7nl).
 *
 * tab-set, accordion-wc and carousel-wc animate their data-transition modes
 * with vt-* keyframes that used to exist only in utils/view-transitions.css,
 * which neither bundle imports, so those transitions silently did nothing.
 * A CSS animation is only created when its keyframes name resolves, so an
 * element animated with each name proves the keyframes are present.
 */
import { test, expect } from 'playwright/test';

const NAMES = ['vt-slide-out-left', 'vt-slide-in-left', 'vt-slide-out-right', 'vt-slide-in-right',
  'vt-scale-down', 'vt-scale-up', 'vt-fade-out', 'vt-fade-in'];

for (const bundle of ['vanilla-breeze.css', 'vanilla-breeze-core.css']) {
  test(`${bundle} defines every vt-* keyframe components use`, async ({ page }) => {
    const url = `/__vt-keyframes-${bundle}.html`;
    await page.route(`**${url}`, (route) => route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
        <link rel="stylesheet" href="/cdn/${bundle}"></head><body>
        ${NAMES.map((n) => `<p style="animation: ${n} 10s linear">${n}</p>`).join('')}
        </body></html>`,
    }));
    await page.goto(url, { waitUntil: 'load' });
    const running = await page.evaluate(() => document.getAnimations().map((a) => a.animationName).sort());
    expect(running).toEqual([...NAMES].sort());
  });

  test(`${bundle} does not opt the page into cross-document transitions`, async ({ page }) => {
    const css = await (await page.request.get(`/cdn/${bundle}`)).text();
    expect(css).not.toContain('@view-transition');
  });
}
