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

/**
 * `demo` is a path under /docs/. Most reconnect demos live in examples/demos;
 * the selection-menu one is a snippet demo.
 *
 * @type {{demo: string, selector: string}[]}
 */
const CASES = [
  { demo: 'examples/demos/version-switcher-modes.html', selector: 'version-switcher' },
  { demo: 'examples/demos/time-picker-basic.html', selector: 'time-picker' },
  { demo: 'examples/demos/reaction-bar-comment.html', selector: 'reaction-bar' },
  // 3pyj: the two components the September re-audit caught duplicating live,
  // plus comment-wc, which had the same unguarded append. It is extras-only,
  // so this case also proves the autoloader upgrades it on a built page (aynl).
  { demo: 'examples/demos/content-lens.html', selector: 'content-lens' },
  { demo: 'examples/demos/timeline-changelog.html', selector: 'time-index' },
  { demo: 'snippets/demos/selection-menu-basic.html', selector: 'comment-wc' },
];

for (const { demo, selector } of CASES) {
  test(`${selector} does not duplicate DOM across a reconnect`, async ({ page }) => {
    await page.goto(`/docs/${demo}`);
    // Attached, not visible: the check is structural, and comment-wc sits in
    // a manual-mode pop-over that stays hidden until text is selected.
    await page.waitForSelector(`${selector}[data-upgraded]`, { state: 'attached' });

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
