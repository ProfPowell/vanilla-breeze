/**
 * Markdown Viewer Behavior Tests
 *
 * Tests content slot resolution, render lifecycle, events, GFM support,
 * theme propagation, custom parser, and progressive enhancement.
 */

import { test, expect } from 'playwright/test';

const basicPage = '/docs/examples/demos/markdown-viewer-basic.html';
const srcPage = '/docs/examples/demos/markdown-viewer-src.html';
const themePage = '/docs/examples/demos/markdown-viewer-theme.html';

const RENDER_TIMEOUT = 10000;

async function waitForViewer(page, selector = 'markdown-viewer') {
  await page.waitForSelector(`${selector}[data-upgraded]`, { timeout: RENDER_TIMEOUT });
}

async function waitForRendered(page, selector = 'markdown-viewer') {
  await page.waitForSelector(`${selector}[data-rendered]`, { timeout: RENDER_TIMEOUT });
}

// ── Initialization ────────────────────────────────────────────

test.describe('markdown-viewer — initialization', () => {
  test('component gets data-upgraded attribute', async ({ page }) => {
    await page.goto(basicPage);
    await waitForViewer(page);
    const viewer = page.locator('markdown-viewer').first();
    await expect(viewer).toHaveAttribute('data-upgraded', '');
  });

  test('creates .md-content child after render', async ({ page }) => {
    await page.goto(basicPage);
    await waitForRendered(page);
    const content = page.locator('markdown-viewer .md-content').first();
    await expect(content).toBeVisible();
  });
});

// ── Content slot: pre ─────────────────────────────────────────

test.describe('markdown-viewer — pre slot', () => {
  test('renders markdown from pre element', async ({ page }) => {
    await page.goto(basicPage);
    await waitForRendered(page);
    const viewer = page.locator('markdown-viewer').first();
    const h1 = viewer.locator('.md-content h1');
    await expect(h1).toHaveText('Hello from a pre slot');
  });

  test('hides pre element after render', async ({ page }) => {
    await page.goto(basicPage);
    await waitForRendered(page);
    const pre = page.locator('markdown-viewer').first().locator(':scope > pre');
    await expect(pre).toBeHidden();
  });

  test('renders bold and italic text', async ({ page }) => {
    await page.goto(basicPage);
    await waitForRendered(page);
    const content = page.locator('markdown-viewer .md-content').first();
    await expect(content.locator('strong')).toHaveText('bold');
    await expect(content.locator('em')).toHaveText('italic');
  });
});

// ── Content slot: script ──────────────────────────────────────

test.describe('markdown-viewer — script slot', () => {
  test('renders markdown from script[type="text/markdown"]', async ({ page }) => {
    await page.goto(basicPage);
    const viewer = page.locator('markdown-viewer').nth(1);
    await waitForRendered(page, 'markdown-viewer:nth-of-type(2)');
    const h1 = viewer.locator('.md-content h1');
    await expect(h1).toHaveText('Hello from a script slot');
  });

  test('renders blockquote from script slot', async ({ page }) => {
    await page.goto(basicPage);
    const viewer = page.locator('markdown-viewer').nth(1);
    await waitForRendered(page, 'markdown-viewer:nth-of-type(2)');
    await expect(viewer.locator('.md-content blockquote')).toBeVisible();
  });
});

// ── Content slot: template ────────────────────────────────────

test.describe('markdown-viewer — template slot', () => {
  test('renders markdown from template[data-md]', async ({ page }) => {
    await page.goto(basicPage);
    const viewer = page.locator('markdown-viewer').nth(2);
    await waitForRendered(page, 'markdown-viewer:nth-of-type(3)');
    const h1 = viewer.locator('.md-content h1');
    await expect(h1).toHaveText('Hello from a template slot');
  });

  test('renders GFM table from template slot', async ({ page }) => {
    await page.goto(basicPage);
    const viewer = page.locator('markdown-viewer').nth(2);
    await waitForRendered(page, 'markdown-viewer:nth-of-type(3)');
    await expect(viewer.locator('.md-content table')).toBeVisible();
    await expect(viewer.locator('.md-content th').first()).toHaveText('Name');
  });
});

// ── Content slot: src ─────────────────────────────────────────

test.describe('markdown-viewer — src attribute', () => {
  test('fetches and renders external markdown file', async ({ page }) => {
    await page.goto(srcPage);
    await waitForRendered(page, 'markdown-viewer:first-of-type');
    const viewer = page.locator('markdown-viewer').first();
    const h1 = viewer.locator('.md-content h1');
    await expect(h1).toHaveText('Sample Markdown Document');
  });

  test('sets data-rendered after fetch completes', async ({ page }) => {
    await page.goto(srcPage);
    await waitForRendered(page, 'markdown-viewer:first-of-type');
    const viewer = page.locator('markdown-viewer').first();
    await expect(viewer).toHaveAttribute('data-rendered', '');
  });

  test('sets data-error on fetch failure', async ({ page }) => {
    await page.goto(srcPage);
    await page.waitForSelector('#error-demo[data-error]', { timeout: RENDER_TIMEOUT });
    const errorViewer = page.locator('#error-demo');
    await expect(errorViewer).toHaveAttribute('data-error', '');
  });

  test('fires markdown-viewer:error event on fetch failure', async ({ page }) => {
    await page.goto(srcPage);
    await page.waitForSelector('#error-demo[data-error]', { timeout: RENDER_TIMEOUT });

    // Drive the contract directly: the demo's inline listener can attach
    // after the component's initial fast-failing fetch already fired the
    // event, so listen ourselves and re-trigger via the src attribute
    const detail = await page.evaluate(() => new Promise((resolve, reject) => {
      const el = document.getElementById('error-demo');
      el.addEventListener('markdown-viewer:error', (e) => resolve(e.detail ?? {}), { once: true });
      el.setAttribute('src', '/definitely-missing-' + Math.random().toString(36).slice(2) + '.md');
      setTimeout(() => reject(new Error('markdown-viewer:error never fired')), 5000);
    }));
    expect(detail).toBeDefined();
  });
});

// ── Events ────────────────────────────────────────────────────

test.describe('markdown-viewer — events', () => {
  test('fires markdown-viewer:rendered event with node detail', async ({ page }) => {
    // Set up listener before page scripts run to avoid race condition
    await page.addInitScript(() => {
      window._mdRenderedEvents = [];
      document.addEventListener('markdown-viewer:rendered', (e) => {
        window._mdRenderedEvents.push({ hasNode: !!e.detail.node });
      });
    });
    await page.goto(basicPage);
    await waitForRendered(page);

    const events = await page.evaluate(() => window._mdRenderedEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].hasNode).toBe(true);
  });

  test('fires markdown-viewer:highlight for code blocks', async ({ page }) => {
    await page.addInitScript(() => {
      window._mdHighlightLangs = [];
      document.addEventListener('markdown-viewer:highlight', (e) => {
        window._mdHighlightLangs.push(e.detail.language);
      });
    });
    await page.goto(themePage);
    await page.waitForSelector('markdown-viewer[highlight][data-rendered]', { timeout: RENDER_TIMEOUT });

    const languages = await page.evaluate(() => window._mdHighlightLangs);
    expect(languages).toContain('javascript');
    expect(languages).toContain('css');
  });
});

// ── GFM support ───────────────────────────────────────────────

test.describe('markdown-viewer — GFM', () => {
  test('renders GFM tables', async ({ page }) => {
    await page.goto(srcPage);
    await waitForRendered(page, 'markdown-viewer:first-of-type');
    const table = page.locator('markdown-viewer').first().locator('.md-content table');
    await expect(table).toBeVisible();
  });

  test('renders task lists', async ({ page }) => {
    await page.goto(srcPage);
    await waitForRendered(page, 'markdown-viewer:first-of-type');
    const content = page.locator('markdown-viewer').first().locator('.md-content');
    const checked = content.locator('input[type="checkbox"][checked]');
    const unchecked = content.locator('input[type="checkbox"]:not([checked])');
    expect(await checked.count()).toBeGreaterThan(0);
    expect(await unchecked.count()).toBeGreaterThan(0);
  });

  test('renders strikethrough', async ({ page }) => {
    await page.goto(srcPage);
    await waitForRendered(page, 'markdown-viewer:first-of-type');
    const del = page.locator('markdown-viewer').first().locator('.md-content del');
    await expect(del).toHaveText('strikethrough');
  });

  test('renders fenced code blocks with language class', async ({ page }) => {
    await page.goto(srcPage);
    await waitForRendered(page, 'markdown-viewer:first-of-type');
    const code = page.locator('markdown-viewer').first().locator('.md-content code.language-javascript');
    await expect(code).toBeVisible();
  });
});

// ── Theme propagation ─────────────────────────────────────────

test.describe('markdown-viewer — theme', () => {
  test('propagates data-theme to .md-content', async ({ page }) => {
    await page.goto(themePage);
    await waitForRendered(page, 'markdown-viewer[data-theme="brutalist"]');
    const content = page.locator('markdown-viewer[data-theme="brutalist"] .md-content');
    await expect(content).toHaveAttribute('data-theme', 'brutalist');
  });

  test('inherits data-theme from ancestor', async ({ page }) => {
    await page.goto(themePage);
    await waitForRendered(page, 'section[data-theme="brutalist"] markdown-viewer');
    const content = page.locator('section[data-theme="brutalist"] markdown-viewer .md-content');
    await expect(content).toHaveAttribute('data-theme', 'brutalist');
  });
});

// ── Custom parser ─────────────────────────────────────────────

test.describe('markdown-viewer — custom parser', () => {
  test('uses custom parser when set via property', async ({ page }) => {
    await page.goto(basicPage);
    await waitForRendered(page);

    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        const viewer = document.createElement('markdown-viewer');
        viewer.parser = (md) => `<p class="custom-parsed">${md.trim()}</p>`;
        const pre = document.createElement('pre');
        pre.textContent = 'test content';
        viewer.appendChild(pre);

        viewer.addEventListener('markdown-viewer:rendered', () => {
          const custom = viewer.querySelector('.custom-parsed');
          resolve(custom ? custom.textContent : null);
        }, { once: true });

        document.body.appendChild(viewer);
      });
    });

    expect(result).toBe('test content');
  });
});

// ── Progressive enhancement ───────────────────────────────────

test.describe('markdown-viewer — progressive enhancement', () => {
  test('pre content is visible before JS renders', async ({ page }) => {
    // Block all JS to test the no-JS fallback
    await page.route('**/*.js', (route) => route.abort());
    await page.goto(basicPage, { waitUntil: 'domcontentloaded' });

    const pre = page.locator('markdown-viewer > pre').first();
    await expect(pre).toBeVisible();
    await expect(pre).toContainText('Hello from a pre slot');
  });
});
