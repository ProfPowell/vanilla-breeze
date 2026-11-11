/**
 * Topics index (/topics/): the sort control and list emitted by
 * site/plugins/generate-topics.js + generate-topic-assets.js.
 *
 * Runs against the built page. The pressed sort button takes the
 * interactive colour (it used --color-accent, which is coral in the default
 * theme and read as an error state), the list is one grid so the columns
 * line up, and sorting reorders the rows.
 */
import { test, expect } from 'playwright/test';

test.describe('topics index', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/topics/');
    await page.waitForSelector('[data-sort-controls]:not([hidden])');
  });

  test('the pressed sort button is tinted with the interactive colour', async ({ page }) => {
    const r = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--color-interactive)';
      document.body.append(probe);
      const interactive = getComputedStyle(probe).color;
      probe.style.color = 'var(--color-accent)';
      const accent = getComputedStyle(probe).color;
      probe.remove();
      const pressed = getComputedStyle(document.querySelector('[data-sort][aria-pressed="true"]'));
      return { interactive, accent, border: pressed.borderTopColor, background: pressed.backgroundColor };
    });
    expect(r.border).toBe(r.interactive);
    expect(r.background).not.toBe(r.accent);
  });

  test('sort label sits on the row with its buttons, which share one line', async ({ page, viewport }) => {
    const r = await page.evaluate(() => {
      const mid = (el) => { const b = el.getBoundingClientRect(); return Math.round(b.top + b.height / 2); };
      const buttons = [...document.querySelectorAll('[data-sort]:not([hidden])')];
      return { legend: mid(document.querySelector('[data-sort-controls] legend')), buttons: buttons.map(mid) };
    });
    expect(new Set(r.buttons).size).toBe(1);
    if ((viewport?.width ?? 0) >= 600) expect(Math.abs(r.legend - r.buttons[0])).toBeLessThanOrEqual(2);
  });

  test('rows share columns and each carries a summary', async ({ page, viewport }) => {
    const r = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('ul[data-topic-index] > li')];
      const left = (sel) => rows.map((li) => Math.round(li.querySelector(sel).getBoundingClientRect().left));
      return {
        rows: rows.length,
        about: left('[data-topic-about]'),
        count: rows.map((li) => Math.round(li.querySelector('[data-topic-count]').getBoundingClientRect().right)),
        summaries: rows.filter((li) => li.querySelector('[data-topic-about]').textContent.trim()).length,
      };
    });
    expect(r.rows).toBeGreaterThan(1);
    expect(r.summaries).toBe(r.rows);
    expect(new Set(r.about).size).toBe(1);
    if ((viewport?.width ?? 0) >= 800) expect(new Set(r.count).size).toBe(1);
  });

  test('sorting reorders the rows and moves the pressed state', async ({ page }) => {
    await page.click('[data-sort="count"]');
    await expect(page.locator('[data-sort="count"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-sort="alpha"]')).toHaveAttribute('aria-pressed', 'false');
    const counts = await page.evaluate(() =>
      [...document.querySelectorAll('ul[data-topic-index] > li')].map((li) => Number(li.dataset.count)));
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    await expect(page.locator('[data-sort-status]')).toHaveText('Sorted by most articles.');
  });

  test('a topic page lists its related topics as one sentence of links', async ({ page }) => {
    await page.goto('/topics/content-lens/');
    const r = await page.evaluate(() => {
      const p = document.querySelector('[data-topic-relations] p');
      const links = [...p.querySelectorAll('a')];
      return {
        links: links.length,
        padding: links.map((a) => getComputedStyle(a).paddingBlockStart),
        // A sentence of a few links is a line or two, not one block per link
        lines: Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight)),
      };
    });
    expect(r.links).toBeGreaterThan(1);
    expect(new Set(r.padding)).toEqual(new Set(['0px']));
    expect(r.lines).toBeLessThan(r.links);
    // Article summaries come from page descriptions that already hold
    // entities; they must not be escaped a second time.
    expect(await page.locator('[data-topic-content]').innerText()).not.toMatch(/&(lt|gt|amp|quot);/);
  });
});
