/**
 * <activity-feed> — regression tests for the observer loop, sentinel
 * duplication on move, and roving-tabindex keyboard navigation.
 *
 * Tests the WORKING TREE: /src/** is served from disk so the spec does not
 * depend on the state of the built site snapshot.
 */
import { test, expect } from 'playwright/test';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const iso = (daysAgo, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

async function load(page, feedAttrs, entries) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__activity-feed-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css"></head><body>
      <button id="before">before</button>
      <activity-feed id="feed" ${feedAttrs}>${entries}</activity-feed>
      <section id="other"></section>
      <script type="module">
        await import('/src/web-components/activity-feed/logic.js');
        window.__ready = true;
      </script></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true);
  await expect(page.locator('#feed')).toHaveAttribute('data-upgraded', '');
}

const entry = (daysAgo, text, hour) =>
  `<article data-activity data-time="${iso(daysAgo, hour)}"><a href="#${text}">${text}</a> did a thing</article>`;

/** Count childList mutations over a window to prove the observer settled. */
async function mutationsDuring(page, fn, ms = 300) {
  return page.evaluate(async ({ body, ms }) => {
    const feed = document.getElementById('feed');
    let count = 0;
    const mo = new MutationObserver((recs) => { count += recs.length; });
    mo.observe(feed, { childList: true });
    new Function('feed', body)(feed);
    await new Promise((r) => setTimeout(r, 50));
    count = 0; // ignore the settle-down burst, then watch for a runaway loop
    await new Promise((r) => setTimeout(r, ms));
    mo.disconnect();
    return count;
  }, { body: fn, ms });
}

test.describe('activity-feed', () => {
  test('grouped feed: addEntry / append / remove / clear terminate', async ({ page }) => {
    await load(page, 'data-group="day"', entry(0, 'a', 9) + entry(1, 'b') + entry(3, 'c'));
    const headings = page.locator('#feed > [data-activity-heading]');
    await expect(headings).toHaveCount(3);

    // addEntry on an existing day → still 3 headings, no runaway mutations.
    expect(await mutationsDuring(page, `feed.addEntry({ time: ${JSON.stringify(iso(0, 11))}, html: 'x' }, { prepend: true });`)).toBe(0);
    await expect(headings).toHaveCount(3);
    await expect(page.locator('#feed > article[data-activity]')).toHaveCount(4);

    // addEntry on a new day → 4 headings.
    expect(await mutationsDuring(page, `feed.addEntry({ time: ${JSON.stringify(iso(5))}, html: 'y' });`)).toBe(0);
    await expect(headings).toHaveCount(4);

    // Direct append.
    expect(await mutationsDuring(page, `const a = document.createElement('article'); a.setAttribute('data-activity', ''); a.dataset.time = ${JSON.stringify(iso(7))}; a.textContent = 'z'; feed.appendChild(a);`)).toBe(0);
    await expect(headings).toHaveCount(5);

    // removeEntry, then clear.
    expect(await mutationsDuring(page, `feed.removeEntry(feed.entries.at(-1));`)).toBe(0);
    await expect(headings).toHaveCount(4);
    expect(await mutationsDuring(page, `feed.clear();`)).toBe(0);
    await expect(headings).toHaveCount(0);
    await expect(page.locator('#feed > .activity-empty')).toHaveCount(1);

    // Week grouping too.
    await page.locator('#feed').evaluate((f) => f.setAttribute('data-group', 'week'));
    expect(await mutationsDuring(page, `feed.addEntry({ time: ${JSON.stringify(iso(0))}, html: 'w' });`)).toBe(0);
    await expect(headings).toHaveCount(1);
  });

  test('moving the element twice leaves exactly one sentinel, kept last', async ({ page }) => {
    await load(page, 'data-infinite data-group="day"', entry(0, 'a') + entry(1, 'b'));
    const sentinels = page.locator('#feed > .activity-sentinel');
    await expect(sentinels).toHaveCount(1);

    await page.evaluate(() => {
      const feed = document.getElementById('feed');
      document.getElementById('other').append(feed);
      document.body.append(feed);
    });
    await expect(page.locator('#feed')).toHaveAttribute('data-upgraded', '');
    await expect(sentinels).toHaveCount(1);

    // Entries appended directly must not land after the sentinel.
    await page.evaluate(() => {
      const feed = document.getElementById('feed');
      const a = document.createElement('article');
      a.setAttribute('data-activity', '');
      a.dataset.time = new Date().toISOString();
      a.textContent = 'late';
      feed.appendChild(a);
    });
    await expect(page.locator('#feed > article[data-activity]')).toHaveCount(3);
    expect(await page.locator('#feed').evaluate((f) => f.lastElementChild?.className)).toBe('activity-sentinel');
  });

  test('Tab into the feed, then arrows move between entries (roving tabindex)', async ({ page }) => {
    await load(page, '', entry(0, 'a') + entry(1, 'b') + entry(2, 'c'));
    const entries = page.locator('#feed > article[data-activity]');
    await expect(entries.nth(0)).toHaveAttribute('tabindex', '0');
    await expect(entries.nth(1)).toHaveAttribute('tabindex', '-1');

    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    await expect(entries.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(entries.nth(1)).toBeFocused();
    await expect(entries.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(entries.nth(0)).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('End');
    await expect(entries.nth(2)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(entries.nth(0)).toBeFocused();

    // From a link inside an entry, arrows still navigate.
    await entries.nth(1).locator('a').focus();
    await expect(entries.nth(1)).toHaveAttribute('tabindex', '0');
    await page.keyboard.press('ArrowDown');
    await expect(entries.nth(2)).toBeFocused();
  });
});
