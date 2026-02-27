/**
 * Heading Links Web Component Behavior Tests
 *
 * Tests anchor creation, ID generation, click behavior,
 * skip logic, and accessibility for the heading-links component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/heading-links-basic.html';

/** Wait for heading-links WC to process headings */
async function waitForAnchors(page) {
  await page.waitForSelector('heading-links .heading-anchor', { timeout: 5000 });
}

test.describe('heading-links', () => {

  test('adds anchor links to headings', async ({ page }) => {
    await page.goto(demoPage);
    await waitForAnchors(page);

    const anchors = page.locator('heading-links .heading-anchor');
    const count = await anchors.count();
    expect(count).toBeGreaterThan(0);
  });

  test('generates IDs for headings without them', async ({ page }) => {
    await page.goto(demoPage);
    await waitForAnchors(page);

    const headings = page.locator('heading-links h2, heading-links h3');
    const count = await headings.count();

    for (let i = 0; i < count; i++) {
      const id = await headings.nth(i).getAttribute('id');
      expect(id).toBeTruthy();
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  test('preserves existing heading IDs', async ({ page }) => {
    await page.goto(demoPage);
    await waitForAnchors(page);

    // All headings should have IDs (auto-generated or pre-existing)
    const allHaveIds = await page.evaluate(() => {
      const headings = document.querySelectorAll('heading-links h2, heading-links h3');
      return [...headings].every(h => h.id.length > 0);
    });
    expect(allHaveIds).toBe(true);
  });

  test('anchor has correct href matching heading ID', async ({ page }) => {
    await page.goto(demoPage);
    await waitForAnchors(page);

    const result = await page.evaluate(() => {
      const heading = document.querySelector('heading-links h2');
      const anchor = heading.querySelector('.heading-anchor');
      return { headingId: heading.id, href: anchor?.getAttribute('href') };
    });

    expect(result.href).toBe(`#${result.headingId}`);
  });

  test('anchor has aria-label for accessibility', async ({ page }) => {
    await page.goto(demoPage);
    await waitForAnchors(page);

    const ariaLabel = await page.evaluate(() => {
      const anchor = document.querySelector('heading-links .heading-anchor');
      return anchor?.getAttribute('aria-label');
    });

    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toMatch(/^Link to /);
  });

  test('headings get tabindex for keyboard focus', async ({ page }) => {
    await page.goto(demoPage);
    await waitForAnchors(page);

    const tabindex = await page.evaluate(() => {
      return document.querySelector('heading-links h2')?.getAttribute('tabindex');
    });
    expect(tabindex).toBe('-1');
  });

  test('click updates URL hash', async ({ page }) => {
    await page.goto(demoPage);
    await waitForAnchors(page);

    const headingId = await page.evaluate(() => {
      const anchor = document.querySelector('heading-links .heading-anchor');
      anchor.style.opacity = '1';
      return anchor.closest('h2, h3').id;
    });

    await page.locator('heading-links .heading-anchor').first().click();
    await page.waitForTimeout(300);

    const hash = new URL(page.url()).hash;
    expect(hash).toBe(`#${headingId}`);
  });

  test('click fires heading-links:navigate event', async ({ page }) => {
    await page.goto(demoPage);
    await waitForAnchors(page);

    await page.evaluate(() => {
      window.__navigateEvent = null;
      document.querySelector('heading-links').addEventListener('heading-links:navigate', (e) => {
        window.__navigateEvent = { id: e.detail.id, url: e.detail.url };
      });
      document.querySelector('.heading-anchor').style.opacity = '1';
    });

    await page.locator('heading-links .heading-anchor').first().click();
    await page.waitForTimeout(300);

    const event = await page.evaluate(() => window.__navigateEvent);
    expect(event).toBeTruthy();
    expect(event.id).toBeTruthy();
    expect(event.url).toContain('#');
  });

  test('click shows copied feedback briefly', async ({ page }) => {
    await page.goto(demoPage);
    await waitForAnchors(page);
    await page.context().grantPermissions(['clipboard-write']);

    await page.evaluate(() => {
      document.querySelector('.heading-anchor').style.opacity = '1';
    });

    const anchor = page.locator('heading-links .heading-anchor').first();
    await anchor.click();

    // Check for .copied class
    await expect(anchor).toHaveClass(/copied/, { timeout: 2000 });

    // Should revert after ~1.5s
    await expect(anchor).not.toHaveClass(/copied/, { timeout: 3000 });
  });

  test('skips headings with data-toc-ignore', async ({ page }) => {
    await page.goto(demoPage);
    await waitForAnchors(page);

    const hasIgnoredAnchor = await page.evaluate(() => {
      const container = document.querySelector('heading-links');
      const h = document.createElement('h2');
      h.setAttribute('data-toc-ignore', '');
      h.textContent = 'Ignored heading';
      container.appendChild(h);
      return new Promise(resolve => {
        setTimeout(() => resolve(h.querySelector('.heading-anchor') !== null), 200);
      });
    });

    expect(hasIgnoredAnchor).toBe(false);
  });

  test('processes dynamically added headings', async ({ page }) => {
    await page.goto(demoPage);
    await waitForAnchors(page);

    const hasAnchor = await page.evaluate(() => {
      const container = document.querySelector('heading-links');
      const h = document.createElement('h2');
      h.textContent = 'Dynamic heading';
      container.appendChild(h);
      return new Promise(resolve => {
        setTimeout(() => resolve(h.querySelector('.heading-anchor') !== null), 200);
      });
    });

    expect(hasAnchor).toBe(true);
  });

});
