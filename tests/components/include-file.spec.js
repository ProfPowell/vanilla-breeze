/**
 * Include File Web Component Behavior Tests
 *
 * Tests fetch loading, error handling, insertion modes,
 * and event dispatch for the include-file component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/include-file-basic.html';

test.describe('include-file', () => {

  test('loads and injects remote HTML content', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // The demo's src points to /docs/ which may 404 on dev server.
    // Create a fresh element with a known-good path to test loading.
    const content = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.createElement('include-file');
        el.addEventListener('include-file:load', () => {
          resolve(el.innerHTML.trim());
        });
        el.setAttribute('src', '/demos/examples/demos/_include-fragment.html');
        document.body.appendChild(el);
        setTimeout(() => resolve(''), 5000);
      });
    });
    expect(content.length).toBeGreaterThan(0);
  });

  test('sets data-loaded attribute on success', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const state = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.createElement('include-file');
        el.addEventListener('include-file:load', () => {
          resolve({
            hasLoaded: el.hasAttribute('data-loaded'),
            hasLoading: el.hasAttribute('data-loading'),
          });
        });
        el.setAttribute('src', '/demos/examples/demos/_include-fragment.html');
        document.body.appendChild(el);
        setTimeout(() => resolve({ hasLoaded: false, hasLoading: true, timeout: true }), 5000);
      });
    });
    expect(state.hasLoaded).toBe(true);
    expect(state.hasLoading).toBe(false);
  });

  test('sets data-error attribute on fetch failure', async ({ page }) => {
    await page.goto(demoPage);
    // Both include-files in demo will error since /docs/ path 404s on dev server
    await page.waitForSelector('include-file[data-error]', { timeout: 5000 });

    const hasError = await page.evaluate(() => {
      return document.querySelector('include-file[data-error]') !== null;
    });
    expect(hasError).toBe(true);
  });

  test('fires include-file:load event on success', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const eventFired = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.createElement('include-file');
        el.addEventListener('include-file:load', (e) => {
          resolve({ src: e.detail.src, hasHtml: !!e.detail.html });
        });
        el.setAttribute('src', '/demos/examples/demos/_include-fragment.html');
        document.body.appendChild(el);
        setTimeout(() => resolve(null), 5000);
      });
    });

    expect(eventFired).toBeTruthy();
    expect(eventFired.hasHtml).toBe(true);
  });

  test('fires include-file:error event on failure', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const eventFired = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.createElement('include-file');
        el.addEventListener('include-file:error', (e) => {
          resolve({ src: e.detail.src, error: e.detail.error });
        });
        el.setAttribute('src', '/nonexistent-file-404.html');
        document.body.appendChild(el);
        setTimeout(() => resolve(null), 5000);
      });
    });

    expect(eventFired).toBeTruthy();
    expect(eventFired.error).toBeTruthy();
  });

  test('replace mode clears existing content', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.createElement('include-file');
        el.innerHTML = '<p class="fallback-test">Original content</p>';
        el.addEventListener('include-file:load', () => {
          resolve({ hasFallback: el.querySelector('.fallback-test') !== null });
        });
        el.setAttribute('src', '/demos/examples/demos/_include-fragment.html');
        document.body.appendChild(el);
        setTimeout(() => resolve({ hasFallback: true, timeout: true }), 5000);
      });
    });

    expect(result.hasFallback).toBe(false);
  });

  test('append mode preserves existing content', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.createElement('include-file');
        el.setAttribute('data-mode', 'append');
        el.innerHTML = '<p class="original-test">Original</p>';
        el.addEventListener('include-file:load', () => {
          resolve({
            hasOriginal: el.querySelector('.original-test') !== null,
            childCount: el.children.length,
          });
        });
        el.setAttribute('src', '/demos/examples/demos/_include-fragment.html');
        document.body.appendChild(el);
        setTimeout(() => resolve({ hasOriginal: false, childCount: 0, timeout: true }), 5000);
      });
    });

    expect(result.hasOriginal).toBe(true);
    expect(result.childCount).toBeGreaterThan(1);
  });

  test('does nothing without src attribute', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(() => {
      const el = document.createElement('include-file');
      el.innerHTML = '<p>Fallback</p>';
      document.body.appendChild(el);
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            hasLoading: el.hasAttribute('data-loading'),
            hasLoaded: el.hasAttribute('data-loaded'),
            hasError: el.hasAttribute('data-error'),
            content: el.innerHTML,
          });
        }, 300);
      });
    });

    expect(result.hasLoading).toBe(false);
    expect(result.hasLoaded).toBe(false);
    expect(result.hasError).toBe(false);
    expect(result.content).toContain('Fallback');
  });

});
