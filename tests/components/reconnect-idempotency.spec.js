/**
 * Reconnect idempotency for VBElement components.
 *
 * VBElement.disconnectedCallback clears data-upgraded and runs teardown(), so
 * connectedCallback runs setup() again on the next connect. A setup() that
 * builds DOM without a teardown() to remove it or an "already built" guard
 * therefore duplicates that DOM every time the element is moved in the tree —
 * the same class of bug fixed earlier for theme-picker / settings-panel /
 * site-search / carousel-wc.
 *
 * The check is structural and generic: upgrade the component, snapshot the
 * child element count, remove-and-reinsert the host (a real reparent, exactly
 * what a layout move or a framework re-render does), then assert the count is
 * unchanged. Duplicated triggers / popovers / banners show up immediately as a
 * higher count.
 */

import { test, expect } from 'playwright/test';

/** @type {{demo: string, selector: string}[]} */
const CASES = [
  { demo: 'version-switcher-modes.html', selector: 'version-switcher' },
  { demo: 'time-picker-basic.html', selector: 'time-picker' },
  { demo: 'reaction-bar-comment.html', selector: 'reaction-bar' },
];

for (const { demo, selector } of CASES) {
  test(`${selector} does not duplicate DOM across a reconnect`, async ({ page }) => {
    await page.goto(`/docs/examples/demos/${demo}`);
    await page.waitForSelector(`${selector}[data-upgraded]`);

    const result = await page.evaluate((sel) => {
      const el = document.querySelector(`${sel}[data-upgraded]`);
      if (!el) return { error: 'no upgraded element' };

      const count = (node) => node.querySelectorAll('*').length;
      const before = count(el);

      // A genuine reparent: remove from the tree, then reinsert. This fires
      // disconnectedCallback then connectedCallback, re-running setup().
      const parent = el.parentNode;
      const next = el.nextSibling;
      parent.removeChild(el);
      parent.insertBefore(el, next);

      return { before, upgradedAfter: el.hasAttribute('data-upgraded'), after: count(el) };
    }, selector);

    expect(result.error).toBeUndefined();
    // Re-upgraded cleanly...
    expect(result.upgradedAfter).toBe(true);
    // ...and produced no extra descendants.
    expect(result.after).toBe(result.before);
  });
}
