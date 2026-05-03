/**
 * CustomStateSet batch — vanilla-breeze-9i5k
 *
 * Five jdsv survey candidates landed setState calls. These tests verify
 * that the component is upgraded AND that :state() round-trips correctly
 * via manual setState — proving the wiring (helper + selector) works on
 * each component. The trigger sites (pointerdown, mouseleave, input
 * debounce, etc.) are reviewable in the source; integration coverage of
 * those triggers is left to the existing component test suites where
 * synthetic events behave reliably.
 *
 * Drag-surface candidates were rolled back: their attributes have CSS
 * rules in two stylesheets (drag-surface/styles.css AND
 * native-elements/draggable/styles.css), making the migration multi-file
 * and outside the "improve and don't change" scope of this batch.
 */

import { test, expect } from 'playwright/test';

/**
 * Verify a component upgrade + round-trip a custom :state() flag through
 * the live element. Confirms the helper is reachable AND the selector
 * matches as expected for the given component instance.
 */
async function verifyStateRoundTrip(page, demoUrl, selector, stateName) {
  await page.goto(demoUrl);
  await page.waitForSelector(`${selector}[data-upgraded]`);

  return page.evaluate(({ sel, name }) => {
    const el = document.querySelector(sel);
    const before = el.matches(`:state(${name})`);
    el.setState(name, true);
    const during = el.matches(`:state(${name})`);
    el.setState(name, false);
    const after = el.matches(`:state(${name})`);
    return { before, during, after };
  }, { sel: selector, name: stateName });
}

test('split-surface :state(divider-dragging) round-trip', async ({ page }) => {
  const r = await verifyStateRoundTrip(
    page,
    '/docs/examples/demos/split-surface-basic.html',
    'split-surface',
    'divider-dragging',
  );
  expect(r.before).toBe(false);
  expect(r.during).toBe(true);
  expect(r.after).toBe(false);
});

test('tool-tip :state(show-pending) round-trip', async ({ page }) => {
  const r = await verifyStateRoundTrip(
    page,
    '/docs/examples/demos/interestfor-basic.html',
    'tool-tip',
    'show-pending',
  );
  expect(r.before).toBe(false);
  expect(r.during).toBe(true);
  expect(r.after).toBe(false);
});

test('drop-down :state(hover-grace-pending) round-trip', async ({ page }) => {
  const r = await verifyStateRoundTrip(
    page,
    '/docs/examples/demos/dropdown-basic.html',
    'drop-down',
    'hover-grace-pending',
  );
  expect(r.before).toBe(false);
  expect(r.during).toBe(true);
  expect(r.after).toBe(false);
});

test('site-search :state(input-debounce-pending) round-trip', async ({ page }) => {
  const r = await verifyStateRoundTrip(
    page,
    '/docs/examples/demos/site-search-basic.html',
    'site-search',
    'input-debounce-pending',
  );
  expect(r.before).toBe(false);
  expect(r.during).toBe(true);
  expect(r.after).toBe(false);
});

test('emoji-picker :state(search-pending) round-trip', async ({ page }) => {
  const r = await verifyStateRoundTrip(
    page,
    '/docs/examples/demos/emoji-basic.html',
    'emoji-picker',
    'search-pending',
  );
  expect(r.before).toBe(false);
  expect(r.during).toBe(true);
  expect(r.after).toBe(false);
});
