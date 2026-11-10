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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

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

/* ── Behaviour after a reconnect ───────────────────────────────────────────
 *
 * The structural check above misses the other half of the bug class: a
 * DOM-build guard ("already built" / data-decorated / parentNode === this)
 * that also skips the listen() wiring. listen() listeners are released on
 * disconnect, so the component comes back looking right but inert (poll-wc,
 * reaction-bar, version-switcher, time-picker all shipped like that).
 *
 * Each case below loads a demo from the WORKING TREE (/src and the demo
 * pages are served from disk, the built autoload bundle is swapped for
 * /src/main.js and the component's logic.js is imported explicitly), removes
 * and reinserts the host twice, then performs one representative interaction
 * and asserts its effect — usually "the event fired exactly once", which
 * also catches doubled listeners. The descendant count must not change.
 *
 * `run` is the body of an async function evaluated in the page with `el`
 * (the host) and these helpers in scope:
 *   q(root, sel)              querySelector that throws when missing
 *   fired(target, type, act)  runs act(), returns how many `type` events fired
 *   key(target, key, init)    dispatches a bubbling, cancelable keydown
 *   tick(ms)                  waits
 */

const HELPERS = `
  const tick = (ms = 50) => new Promise((r) => setTimeout(r, ms));
  const q = (root, sel) => {
    const n = root.querySelector(sel);
    if (!n) throw new Error('missing ' + sel);
    return n;
  };
  const key = (target, k, init = {}) => target.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, composed: true, ...init }));
  const fired = async (target, type, act) => {
    let n = 0;
    const h = () => { n++; };
    target.addEventListener(type, h);
    try { await act(); await tick(150); } finally { target.removeEventListener(type, h); }
    return n;
  };
`;

/**
 * @type {{name: string, demo: string, selector: string, run: string, expected: unknown}[]}
 */
const BEHAVIOUR = [
  { name: 'accordion-wc', demo: 'examples/demos/accordion-basic.html', selector: 'accordion-wc',
    run: `return fired(el, 'accordion-wc:toggle', () => q(el, 'summary').click());`, expected: 1 },
  { name: 'calendar-wc', demo: 'examples/demos/calendar-wc-basic.html', selector: 'calendar-wc',
    run: `return fired(el, 'calendar:navigate', () => q(el, 'button[aria-label="Next month"]').click());`, expected: 1 },
  { name: 'carousel-wc', demo: 'examples/demos/carousel-basic.html', selector: 'carousel-wc',
    run: `return fired(el, 'carousel-wc:change', () => q(el, '.carousel-next').click());`, expected: 1 },
  { name: 'chat-input', demo: 'examples/demos/chat-input-basic.html', selector: 'chat-input',
    run: `const ta = q(el, 'textarea'); ta.value = 'hello'; ta.dispatchEvent(new Event('input', { bubbles: true }));
          return fired(el, 'chat-input:send', () => q(el, '[data-send]').click());`, expected: 1 },
  { name: 'color-picker', demo: 'examples/demos/color-picker-basic.html', selector: 'color-picker',
    run: `return fired(el, 'color-picker:open', () => q(el, '.color-trigger').click());`, expected: 1 },
  { name: 'combo-box', demo: 'examples/demos/combobox-basic.html', selector: 'combo-box',
    run: `const input = q(el, 'input');
          return fired(el, 'combo-box:open', () => { input.focus(); key(input, 'ArrowDown'); });`, expected: 1 },
  { name: 'command-palette', demo: 'examples/demos/command-palette-basic.html', selector: 'command-palette',
    run: `return fired(el, 'command-palette:open', () => key(document.body, 'k', /Mac|iPhone|iPad/.test(navigator.platform) ? { metaKey: true } : { ctrlKey: true }));`, expected: 1 },
  { name: 'comment-box', demo: 'examples/demos/comment-box-basic.html', selector: 'comment-box',
    run: `const ta = q(el, 'textarea'); ta.value = 'A comment'; ta.dispatchEvent(new Event('input', { bubbles: true }));
          await tick();
          return fired(el, 'comment-box:submit', () => q(el, '.comment-box-submit').click());`, expected: 1 },
  { name: 'comment-thread', demo: 'examples/demos/comment-thread-issue.html', selector: 'comment-thread',
    run: `const before = el.querySelectorAll('comment-box').length;
          [...el.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Reply').click();
          await tick();
          return el.querySelectorAll('comment-box').length - before;`, expected: 1 },
  { name: 'compare-surface', demo: 'examples/demos/compare-surface-basic.html', selector: 'compare-surface',
    run: `return fired(el, 'compare-surface:change', () => key(q(el, '[role="slider"]'), 'ArrowRight'));`, expected: 1 },
  { name: 'consent-banner', demo: 'snippets/demos/consent-banner-granular.html', selector: 'consent-banner',
    run: `return fired(el, 'consent-banner:change', () => q(el, 'button[value="accept"]').click());`, expected: 1 },
  { name: 'content-lens', demo: 'examples/demos/content-lens.html', selector: 'content-lens',
    run: `return fired(el, 'content-lens:change', () => q(el, 'input[value="author"]').click());`, expected: 1 },
  { name: 'context-menu', demo: 'examples/demos/context-menu-basic.html', selector: 'context-menu',
    run: `return fired(el, 'context-menu:open', () => q(el, '[data-trigger]').dispatchEvent(
            new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 })));`, expected: 1 },
  { name: 'data-table', demo: 'examples/demos/data-table-basic.html', selector: 'data-table',
    run: `return fired(el, 'data-table:sort', () => q(el, '[data-sort-button]').click());`, expected: 1 },
  { name: 'date-picker', demo: 'examples/demos/date-picker-basic.html', selector: 'date-picker',
    run: `return fired(el, 'date-picker:open', () => q(el, '.date-trigger-icon').click());`, expected: 1 },
  { name: 'drag-surface', demo: 'examples/demos/drag-surface-basic.html', selector: 'drag-surface',
    run: `const item = q(el, '[draggable="true"]'); item.focus();
          return fired(el, 'drag-surface:reorder', () => { key(item, ' '); key(item, 'ArrowDown'); key(item, ' '); });`, expected: 1 },
  { name: 'drop-down', demo: 'examples/demos/dashboard-analytics.html', selector: 'drop-down',
    run: `return fired(el, 'drop-down:open', () => q(el, '[data-trigger]').click());`, expected: 1 },
  { name: 'emoji-picker', demo: 'examples/demos/emoji-picker-basic.html', selector: 'emoji-picker',
    run: `return fired(el, 'emoji-picker:open', () => q(el, '[data-trigger]').click());`, expected: 1 },
  { name: 'glossary-index', demo: 'examples/demos/glossary.html', selector: 'glossary-index',
    run: `return fired(el, 'glossary-index:filter', async () => {
            const input = q(el, 'input[type="search"]'); input.value = 'attr';
            input.dispatchEvent(new Event('input', { bubbles: true })); await tick(400); });`, expected: 1 },
  { name: 'heading-links', demo: 'examples/demos/heading-links-basic.html', selector: 'heading-links',
    run: `return fired(el, 'heading-links:navigate', () => q(el, '.heading-anchor').click());`, expected: 1 },
  { name: 'image-gallery', demo: 'examples/demos/image-gallery-basic.html', selector: 'image-gallery',
    run: `q(el, 'a').click(); await tick(300);
          return document.querySelectorAll('dialog[open]').length;`, expected: 1 },
  { name: 'markdown-editor', demo: 'examples/demos/markdown-editor-basic.html', selector: 'markdown-editor',
    run: `return fired(el, 'markdown-editor:input', () => {
            const ta = q(el, 'textarea'); ta.value += '!'; ta.dispatchEvent(new Event('input', { bubbles: true })); });`, expected: 1 },
  { name: 'notification-wc', demo: 'examples/demos/notification-banner.html', selector: 'notification-wc',
    run: `return fired(el, 'notification-wc:dismiss', () => q(el, 'button[value="dismiss"]').click());`, expected: 1 },
  { name: 'page-toc', demo: 'examples/demos/page-toc-basic.html', selector: 'page-toc',
    run: `return fired(el, 'page-toc:navigate', () => q(el, 'a[href="#usage"]').click());`, expected: 1 },
  { name: 'pager-wc', demo: 'snippets/demos/pager-wc-basic.html', selector: 'pager-wc',
    run: `return fired(el, 'pager-wc:navigate', () => q(el, '[data-paged-target="2"][data-paged-action="page"]').click());`, expected: 1 },
  // Switching a single-choice vote emits remove (old) + add (new).
  { name: 'poll-wc', demo: 'examples/demos/poll-wc-launch-date.html', selector: 'poll-wc',
    run: `return fired(el, 'poll-wc:vote', () => q(el, '[data-option="friday"]').click());`, expected: 2 },
  { name: 'pop-over', demo: 'examples/demos/pop-over-basic.html', selector: 'pop-over#pop-default',
    run: `return fired(el, 'pop-over:show', () => q(document, '[popovertarget="pop-default"]').click());`, expected: 1 },
  { name: 'progress-tracker', demo: 'examples/demos/progress-tracker-wizard.html', selector: 'progress-tracker',
    run: `return fired(el, 'progress-tracker:step', () => q(el, 'button.pt-body').click());`, expected: 1 },
  { name: 'reaction-bar', demo: 'examples/demos/reaction-bar-comment.html', selector: 'reaction-bar',
    run: `return fired(el, 'reaction-bar:toggle', () => q(el, ':scope > button[data-reaction]').click());`, expected: 1 },
  // Inside selection-menu share-wc renders one icon button; a reconnect used to append another.
  { name: 'share-wc', demo: 'examples/demos/article-reader-tools.html', selector: 'selection-menu share-wc',
    run: `return el.querySelectorAll('button').length;`, expected: 1 },
  { name: 'site-index', demo: 'examples/demos/site-index.html', selector: 'site-index',
    run: `return [el.querySelectorAll('[data-index-controls]').length,
                  el.querySelectorAll('[data-index-expand]').length === el.querySelectorAll('section:has(> [data-index-expand])').length];`,
    expected: [1, true] },
  { name: 'site-search', demo: 'examples/demos/site-search-basic.html', selector: 'site-search',
    run: `return fired(el, 'site-search:open', () => q(el, '[data-trigger]').click());`, expected: 1 },
  { name: 'slide-accept', demo: 'examples/demos/slide-accept-basic.html', selector: 'slide-accept',
    run: `return fired(el, 'slide-accept:accept', async () => {
            const h = q(el, '[role="slider"]'); key(h, 'End'); await tick(); 
            h.dispatchEvent(new KeyboardEvent('keyup', { key: 'End', bubbles: true })); await tick(600); });`, expected: 1 },
  { name: 'split-surface', demo: 'examples/demos/split-surface-basic.html', selector: 'split-surface',
    run: `return fired(el, 'split-surface:resize', () => key(q(el, '[role="separator"]'), 'ArrowRight'));`, expected: 1 },
  // rating:change comes from the rating effect on the inner fieldset; the
  // host's listen() wiring must sync the value exactly once.
  { name: 'star-rating', demo: 'examples/demos/rating-basic.html', selector: 'star-rating',
    run: `const n = await fired(el, 'rating:change', () => q(el, 'input[value="4"]').click());
          return [n, el.value, el.querySelectorAll('[data-rating-live]').length];`, expected: [1, 4, 1] },
  // status-wc used to wrap its own dot + label in a new label on every setup().
  { name: 'status-wc', demo: 'examples/demos/status-wc-variants.html', selector: 'status-wc',
    run: `const n = await fired(el, 'status-wc:change', () => { el.variant = 'offline'; });
          return [n, el.querySelectorAll('.status-dot').length, el.querySelectorAll('.status-label').length,
                  el.querySelectorAll('.status-label .status-label').length];`, expected: [1, 1, 1, 0] },
  { name: 'stepper-wc', demo: 'examples/demos/stepper-wc-modes.html', selector: 'stepper-wc#px',
    run: `return fired(el, 'change', () => q(el, '.stepper-inc').click());`, expected: 1 },
  { name: 'tab-set', demo: 'examples/demos/dashboard-analytics.html', selector: 'tab-set',
    // exactly one tab-set:change per activation (from the opening tab)
    run: `const n = await fired(el, 'tab-set:change', () => el.querySelectorAll('summary')[1].click());
          return [n, el.querySelectorAll('summary')[1].getAttribute('aria-expanded')];`, expected: [1, 'true'] },
  { name: 'time-index', demo: 'examples/demos/timeline-changelog.html', selector: 'time-index',
    run: `const order = q(el, '[data-timeline-order]');
          const first = () => (el.querySelector('.changelog-entries > :is(li, article, section)') || {}).textContent;
          const before = first();
          order.value = 'oldest'; order.dispatchEvent(new Event('change', { bubbles: true })); await tick();
          return [el.querySelectorAll('[data-timeline-order]').length, first() !== before];`, expected: [1, true] },
  { name: 'time-picker', demo: 'examples/demos/time-picker-basic.html', selector: 'time-picker',
    run: `q(el, '.time-trigger-icon').click(); await tick();
          return q(el, '.time-input').getAttribute('aria-expanded');`, expected: 'true' },
  { name: 'tool-tip', demo: 'examples/demos/interestfor-basic.html', selector: 'tool-tip',
    run: `return fired(el, 'tool-tip:show', () => el.show());`, expected: 1 },
  { name: 'version-switcher', demo: 'examples/demos/version-switcher-actions.html', selector: 'version-switcher',
    run: `const n = await fired(el, 'version-switcher:open', () => q(el, '.version-switcher-trigger').click());
          return [n, q(el, '.version-switcher-trigger').getAttribute('aria-expanded')];`, expected: [1, 'true'] },
  // Shadow controls AND the light-DOM <video> media listeners must re-wire
  // (they used to sit behind a first-connect guard): one speed event, one
  // play event and the state reflected from the media element.
  { name: 'video-player', demo: 'examples/demos/video-player-basic.html', selector: 'video-player',
    run: `const speed = await fired(el, 'video-player:speed', () => q(el.shadowRoot, '.speed-btn').click());
          const play = await fired(el, 'video-player:play', () => q(el, 'video').dispatchEvent(new Event('play')));
          return [speed, play, el.getAttribute('state'), q(el.shadowRoot, '.play-btn').getAttribute('aria-label')];`,
    expected: [1, 1, 'playing', 'Pause'] },
  { name: 'week-view', demo: 'examples/demos/week-view-basic.html', selector: 'week-view',
    run: `return fired(el, 'week-view:event-click', () => q(el, 'calendar-event').click());`, expected: 1 },
];

/**
 * Serve /src and the demo pages from the working tree.
 * @param {import('playwright/test').Page} page
 * @param {string} component  tag whose logic.js is imported explicitly
 */
async function routeWorkingTree(page, component) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route(/\/docs\/(examples|snippets)\/demos\/[^?#]+\.html/, (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/docs\//, '');
    let html = readFileSync(join(REPO, 'demos', path), 'utf8');
    html = html.replaceAll('/cdn/vanilla-breeze-autoload.js', '/src/main.js');
    html = html.replace('</body>', `<script type="module">import '/src/web-components/${component}/logic.js';</script></body>`);
    return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
  });
}

for (const { name, demo, selector, run, expected } of BEHAVIOUR) {
  test(`${name} still responds after a reconnect`, async ({ page }) => {
    await routeWorkingTree(page, name);
    await page.goto(`/docs/${demo}`);
    await page.waitForSelector(`${selector}[data-upgraded]`, { state: 'attached' });

    const result = await page.evaluate(async ({ sel, body, helpers }) => {
      const el = document.querySelector(`${sel}[data-upgraded]`);
      if (!el) return { error: 'no upgraded element' };
      const count = () => el.querySelectorAll('*').length;
      const before = count();
      for (let i = 0; i < 2; i++) {
        const parent = el.parentNode;
        const next = el.nextSibling;
        parent.removeChild(el);
        // drag-surface keeps its live region as its next sibling and removes
        // it in teardown(), so the old next sibling may be gone.
        parent.insertBefore(el, next?.parentNode === parent ? next : null);
      }
      await new Promise((r) => setTimeout(r, 50));
      const after = count();
      // eslint-disable-next-line no-new-func
      const act = new Function('el', `${helpers}\nreturn (async () => {\n${body}\n})();`);
      try {
        return { before, after, value: await act(el) };
      } catch (e) {
        return { error: String(e) };
      }
    }, { sel: selector, body: run, helpers: HELPERS });

    expect(result.error).toBeUndefined();
    expect(result.after).toBe(result.before);
    expect(result.value).toEqual(expected);
  });
}

/* ── Effects after a REAL removal ──────────────────────────────────────────
 *
 * The loop above reinserts synchronously, which VB's effect observer treats
 * as a move (no cleanup). A real removal — remove, let the observer run,
 * reinsert — runs the effect's cleanup(); the effect must then be wired
 * again. The rating effect used to stay inert (init-marker attribute guard
 * plus VB's data-effect-processed marker surviving cleanup).
 */
test('rating effect (star-rating and plain fieldset) re-wires after a real removal', async ({ page }) => {
  await routeWorkingTree(page, 'star-rating');
  await page.goto('/docs/examples/demos/rating-basic.html');
  await page.waitForSelector('star-rating[name="wc-rating"][data-upgraded]', { state: 'attached' });
  await page.waitForSelector('#js-rating [data-rating-live]', { state: 'attached' });

  const result = await page.evaluate(async () => {
    const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = {};
    for (const [label, el] of [
      ['star-rating', document.querySelector('star-rating[name="wc-rating"]')],
      ['fieldset', document.getElementById('js-rating')],
    ]) {
      const parent = el.parentNode;
      const next = el.nextSibling;
      el.remove();
      await frames();
      parent.insertBefore(el, next);
      await frames();
      const values = [];
      const h = (e) => values.push(e.detail.value);
      el.addEventListener('rating:change', h);
      const radio = el.querySelector('input[value="3"]');
      radio.click(); await wait(40);
      radio.click(); await wait(40); // same star again: clear
      el.removeEventListener('rating:change', h);
      out[label] = { values, live: el.querySelectorAll('[data-rating-live]').length };
    }
    return out;
  });

  expect(result).toEqual({
    'star-rating': { values: [3, 0], live: 1 },
    fieldset: { values: [3, 0], live: 1 },
  });
});

/* ── Stateful hosts: live content across a reconnect ──────────────────────
 *
 * toast-msg keeps its toasts in the DOM; a reconnect used to strand them
 * (timers cleared, never auto-dismissed, not counted against max). The
 * tool-tip card variant moved its [data-content] into a pop-over that
 * teardown() then deleted, so a reconnect left an upgraded-looking but
 * empty, inert card.
 */
test('toast-msg keeps live toasts working across a reconnect', async ({ page }) => {
  await routeWorkingTree(page, 'toast-msg');
  await page.goto('/docs/examples/demos/toast-basic.html');
  await page.waitForSelector('toast-msg[data-upgraded]', { state: 'attached' });

  const result = await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = /** @type {any} */ (document.querySelector('toast-msg'));
    el.setAttribute('max', '1');
    el.show({ message: 'timed', duration: 400 });
    el.show({ message: 'queued', duration: 0 });
    for (let i = 0; i < 2; i++) {
      const parent = el.parentNode;
      const next = el.nextSibling;
      parent.removeChild(el);
      parent.insertBefore(el, next);
    }
    const afterMove = el.queue.map((t) => t.state);
    await wait(1000);
    const afterTimer = el.queue.map((t) => `${t.message}:${t.state}`);
    return { afterMove, afterTimer, toasts: el.querySelectorAll('.toast').length };
  });

  expect(result.afterMove).toEqual(['visible', 'queued']);
  expect(result.afterTimer).toEqual(['queued:visible']);
  expect(result.toasts).toBe(1);
});

test('tool-tip card keeps its content and re-wires after a reconnect', async ({ page }) => {
  await routeWorkingTree(page, 'tool-tip');
  await page.goto('/docs/examples/demos/tooltip-cards.html');
  await page.waitForSelector('tool-tip[variant="card"][data-upgraded]', { state: 'attached' });

  const result = await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = /** @type {any} */ (document.querySelector('tool-tip[variant="card"]'));
    const text = () => el.querySelector('pop-over.hover-card')?.textContent.trim() ?? '';
    const before = { count: el.querySelectorAll('*').length, text: text() };
    for (let i = 0; i < 2; i++) {
      const parent = el.parentNode;
      const next = el.nextSibling;
      parent.removeChild(el);
      parent.insertBefore(el, next);
    }
    let shows = 0;
    el.addEventListener('tool-tip:show', () => shows++);
    el.show();
    await wait(100);
    return {
      before,
      after: { count: el.querySelectorAll('*').length, text: text() },
      upgraded: el.hasAttribute('data-upgraded'),
      shows,
      visible: el.isVisible,
    };
  });

  expect(result.upgraded).toBe(true);
  expect(result.after).toEqual(result.before);
  expect(result.before.text).toContain('Jane Smith');
  expect(result.shows).toBe(1);
  expect(result.visible).toBe(true);
});
