/**
 * Social Embed Web Component Behavior Tests
 *
 * Tests upgrade lifecycle, fallback preservation, click activation,
 * state management, reconnect safety, and error recovery.
 *
 * Note: providers register after the custom element definition, so
 * elements already in the DOM at parse time get state=unsupported.
 * Tests that need click-mode behavior inject elements dynamically
 * after providers are loaded.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/social-embed.html';

test.describe('social-embed', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('social-embed[data-upgraded]');

    const upgraded = page.locator('social-embed[data-upgraded]');
    await expect(upgraded.first()).toBeVisible();
  });

  test('shows fallback content initially (click mode)', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('social-embed[data-upgraded]');

    // Inject a social-embed dynamically so providers are already loaded
    await page.evaluate(() => {
      const el = document.createElement('social-embed');
      el.setAttribute('url', 'https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w');
      el.innerHTML = '<a href="https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w">View post on Bluesky</a>';
      document.body.appendChild(el);
    });

    const el = page.locator('social-embed[state="idle"]');
    await expect(el.first()).toBeVisible();

    // Fallback link should be visible inside the component
    const link = el.first().locator('a');
    await expect(link.first()).toBeVisible();
  });

  test('has the authored link visible before activation', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('social-embed[data-upgraded]');

    // Inject a click-mode embed dynamically
    await page.evaluate(() => {
      const el = document.createElement('social-embed');
      el.setAttribute('url', 'https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w');
      el.innerHTML = '<a href="https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w">View post on Bluesky</a>';
      document.body.appendChild(el);
    });

    const el = page.locator('social-embed[state="idle"]').first();
    const link = el.locator('a[href*="bsky.app"]');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    expect(href).toContain('bsky.app');
  });

  test('state attribute is set (idle initially for click mode)', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('social-embed[data-upgraded]');

    // Inject element dynamically so provider is found
    await page.evaluate(() => {
      const el = document.createElement('social-embed');
      el.setAttribute('url', 'https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w');
      el.innerHTML = '<a href="https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w">View post</a>';
      document.body.appendChild(el);
    });

    const el = page.locator('social-embed[state="idle"]').first();
    await expect(el).toHaveAttribute('state', 'idle');
    await expect(el).toHaveAttribute('data-upgraded', '');
  });

  test('unsupported URL gets state=unsupported', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('social-embed[data-upgraded]');

    const el = page.locator('social-embed[url="https://example.com/unknown-thing"]');
    await expect(el).toHaveAttribute('state', 'unsupported');
    await expect(el).toHaveAttribute('data-upgraded', '');
  });

  test('click-mode element has button role and tabindex', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('social-embed[data-upgraded]');

    // Inject element dynamically
    await page.evaluate(() => {
      const el = document.createElement('social-embed');
      el.setAttribute('url', 'https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w');
      el.innerHTML = '<a href="https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w">View post</a>';
      document.body.appendChild(el);
    });

    const el = page.locator('social-embed[state="idle"]').first();
    await expect(el).toHaveAttribute('role', 'button');
    await expect(el).toHaveAttribute('tabindex', '0');
    await expect(el).toHaveAttribute('aria-label', 'Load embed');
  });

  test('reconnect does not duplicate activation wiring', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(demoPage);
    await page.waitForSelector('social-embed[data-upgraded]');

    // Use the unsupported URL embed — it upgrades without network calls
    const el = page.locator('social-embed[url="https://example.com/unknown-thing"]');
    await expect(el).toHaveAttribute('data-upgraded', '');

    // Count children before disconnect
    const childCountBefore = await el.evaluate(node => node.childElementCount);

    // Remove and reinsert
    await el.evaluate(node => {
      const parent = node.parentElement;
      const next = node.nextSibling;
      node.remove();
      parent.insertBefore(node, next);
    });

    // Wait for re-upgrade
    await page.waitForSelector('social-embed[url="https://example.com/unknown-thing"][data-upgraded]');

    // Should still have state=unsupported
    await expect(el).toHaveAttribute('state', 'unsupported');

    // Child count should not grow on reconnect
    const childCountAfter = await el.evaluate(node => node.childElementCount);
    expect(childCountAfter).toBe(childCountBefore);

    expect(errors).toEqual([]);
  });

  test('reconnect of click-mode element preserves fallback', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(demoPage);
    await page.waitForSelector('social-embed[data-upgraded]');

    // Inject element dynamically so it gets idle state
    await page.evaluate(() => {
      const el = document.createElement('social-embed');
      el.id = 'reconnect-test';
      el.setAttribute('url', 'https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w');
      el.innerHTML = '<a href="https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w">View post on Bluesky</a>';
      document.body.appendChild(el);
    });

    const el = page.locator('#reconnect-test');
    await expect(el).toHaveAttribute('state', 'idle');

    // Remove and reinsert
    await el.evaluate(node => {
      const parent = node.parentElement;
      const next = node.nextSibling;
      node.remove();
      parent.insertBefore(node, next);
    });

    // Wait for re-upgrade after reconnect
    await page.waitForSelector('#reconnect-test[data-upgraded]');

    // Should still be idle and have button role
    await expect(el).toHaveAttribute('state', 'idle');
    await expect(el).toHaveAttribute('role', 'button');

    // The fallback link should still be present
    const link = el.locator('a');
    await expect(link.first()).toBeVisible();
    const text = await link.first().textContent();
    expect(text).toBe('View post on Bluesky');

    expect(errors).toEqual([]);
  });

  test('data-upgraded is removed on disconnect', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('social-embed[data-upgraded]');

    const el = page.locator('social-embed[data-upgraded]').first();

    const hasUpgradedAfterRemove = await el.evaluate(node => {
      node.remove();
      return node.hasAttribute('data-upgraded');
    });

    expect(hasUpgradedAfterRemove).toBe(false);
  });

  test('error state restores the original fallback', async ({ page }) => {
    // Intercept oEmbed requests to force an error
    await page.route('**/oembed**', route => route.abort());

    await page.goto(demoPage);
    await page.waitForSelector('social-embed[data-upgraded]');

    // Inject element dynamically so provider is found and we get click mode
    await page.evaluate(() => {
      const el = document.createElement('social-embed');
      el.id = 'error-test';
      el.setAttribute('url', 'https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w');
      el.innerHTML = '<a href="https://bsky.app/profile/bsky.app/post/3lb55bvibcs2w">View post on Bluesky</a>';
      document.body.appendChild(el);
    });

    const el = page.locator('#error-test');
    await expect(el).toHaveAttribute('state', 'idle');

    // Capture the fallback link text before clicking
    const fallbackText = await el.locator('a').first().textContent();

    // Click to activate — the fetch will fail due to route abort
    await el.click();

    // Should transition to error state
    await expect(el).toHaveAttribute('state', 'error');

    // Original fallback link should be restored
    const restoredLink = el.locator('a');
    await expect(restoredLink.first()).toBeVisible();
    const restoredText = await restoredLink.first().textContent();
    expect(restoredText).toBe(fallbackText);
  });

});
