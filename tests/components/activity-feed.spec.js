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
      <button id="after">after</button>
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

    // From a link inside an entry, arrows are left alone (SR browse mode /
    // scrolling) but the APG Page keys still navigate.
    await entries.nth(1).locator('a').focus();
    await expect(entries.nth(1)).toHaveAttribute('tabindex', '0');
    await page.keyboard.press('ArrowDown');
    await expect(entries.nth(1).locator('a')).toBeFocused();
    await page.keyboard.press('PageDown');
    await expect(entries.nth(2)).toBeFocused();
  });

  test('PageDown / PageUp move exactly one article; Ctrl+End / Ctrl+Home leave the feed', async ({ page }) => {
    const many = Array.from({ length: 8 }, (_, i) => entry(0, `e${i}`, 20 - i)).join('');
    await load(page, '', many);
    const entries = page.locator('#feed > article[data-activity]');
    await entries.nth(0).focus();
    await page.keyboard.press('PageDown');
    await expect(entries.nth(1)).toBeFocused();
    await page.keyboard.press('PageDown');
    await expect(entries.nth(2)).toBeFocused();
    await page.keyboard.press('PageUp');
    await expect(entries.nth(1)).toBeFocused();

    await page.keyboard.press('Control+End');
    await expect(page.locator('#after')).toBeFocused();
    await entries.nth(3).locator('a').focus();
    await page.keyboard.press('Control+Home');
    await expect(page.locator('#before')).toBeFocused();
  });

  test('a11y tree: feed children are all articles, labelled + described', async ({ page }) => {
    await load(page, 'data-group="day" data-infinite', entry(0, 'a', 9) + entry(1, 'b'));
    const feed = page.locator('#feed');
    await expect(feed).toHaveAttribute('role', 'feed');
    // Headings + sentinel are DOM children but hidden from AT.
    const exposed = await feed.evaluate((f) => [...f.children]
      .filter((c) => c.getAttribute('aria-hidden') !== 'true')
      .map((c) => c.localName));
    expect(exposed).toEqual(['article', 'article']);
    const heading = feed.locator('> [data-activity-heading]').first();
    await expect(heading).not.toHaveAttribute('role', /.*/);

    const first = feed.locator('> article').first();
    const labelId = await first.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    await expect(page.locator(`[id="${labelId}"]`)).toContainText('a did a thing');
    await expect(first).toHaveAccessibleName(/a did a thing/);
    const described = (await first.getAttribute('aria-describedby') || '').split(' ');
    expect(described).toContain(await heading.getAttribute('id'));
    await expect(first).toHaveAccessibleDescription(/Today/);

    // Empty feed: role flips to group so the empty-state text is a valid child.
    await feed.evaluate((f) => f.clear());
    await expect(feed).toHaveAttribute('role', 'group');
    await expect(feed.locator('> .activity-empty')).toBeVisible();
    await feed.evaluate((f) => f.addEntry({ time: new Date().toISOString(), html: 'back' }));
    await expect(feed).toHaveAttribute('role', 'feed');
  });

  test('aria-setsize is -1 while infinite, the real count otherwise', async ({ page }) => {
    await load(page, 'data-infinite', entry(0, 'a') + entry(1, 'b') + entry(2, 'c'));
    const entries = page.locator('#feed > article[data-activity]');
    await expect(entries.nth(0)).toHaveAttribute('aria-setsize', '-1');
    await expect(entries.nth(2)).toHaveAttribute('aria-posinset', '3');
    // Ending the feed (removing data-infinite) restores the real count.
    await page.locator('#feed').evaluate((f) => f.removeAttribute('data-infinite'));
    await expect(entries.nth(0)).toHaveAttribute('aria-setsize', '3');
    await expect(page.locator('#feed > .activity-sentinel')).toHaveCount(0);
  });

  test('non-infinite feed reports the real aria-setsize', async ({ page }) => {
    await load(page, '', entry(0, 'a') + entry(1, 'b'));
    await expect(page.locator('#feed > article').first()).toHaveAttribute('aria-setsize', '2');
  });

  test('load-more sets aria-busy and done() clears it; entries also clear it', async ({ page }) => {
    await page.addInitScript(() => {
      window.__loads = [];
      document.addEventListener('activity-feed:load-more', (e) => { window.__loads.push(e.detail); });
    });
    await load(page, 'data-infinite', entry(0, 'a'));
    const feed = page.locator('#feed');
    // Sentinel is in view on load → one request, feed busy, no duplicate.
    await expect.poll(() => page.evaluate(() => window.__loads.length)).toBe(1);
    await expect(feed).toHaveAttribute('aria-busy', 'true');
    expect(await feed.evaluate((f) => f.loading)).toBe(true);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.__loads.length)).toBe(1);

    // done() with nothing appended clears busy and re-arms (sentinel still
    // visible → a fresh request).
    await page.evaluate(() => window.__loads[0].done());
    await expect.poll(() => page.evaluate(() => window.__loads.length)).toBe(2);
    await expect(feed).toHaveAttribute('aria-busy', 'true');

    // A stale done() from the first request must not end the second.
    await page.evaluate(() => window.__loads[0].done());
    await expect(feed).toHaveAttribute('aria-busy', 'true');

    // Ending the feed (removing data-infinite) also ends the busy state.
    await feed.evaluate((f) => { f.removeAttribute('data-infinite'); });
    await expect(feed).toHaveAttribute('aria-busy', 'false');
  });

  test('appended entries clear aria-busy without done()', async ({ page }) => {
    await load(page, 'data-infinite', entry(0, 'a'));
    const feed = page.locator('#feed');
    await expect(feed).toHaveAttribute('aria-busy', 'true');
    // Read aria-busy right after the MutationObserver callback (a microtask),
    // before the re-armed IntersectionObserver can request again.
    const busyAfterAppend = await feed.evaluate(async (f) => {
      f.addEntry({ time: new Date().toISOString(), html: 'more' });
      await Promise.resolve();
      return f.getAttribute('aria-busy');
    });
    expect(busyAfterAppend).toBe('false');
  });

  test('authored <time datetime> is upgraded to relative text (no data-time needed)', async ({ page }) => {
    const when = iso(0, new Date().getHours() - 2 < 0 ? 0 : new Date().getHours() - 2);
    await load(page, 'data-group="day"',
      `<article data-activity><a href="#x">Ada</a> commented <time datetime="${when}">${when}</time></article>` +
      entry(1, 'legacy'));
    const first = page.locator('#feed > article').first();
    const time = first.locator('> time.activity-time');
    await expect(time).toHaveCount(1);
    await expect(time).toHaveAttribute('datetime', when);
    await expect(time).not.toHaveText(when);
    await expect(time).toHaveAttribute('title', /.+/);
    await expect(first).toHaveAttribute('data-time', when);
    // Only one time per entry, and data-time entries still work.
    await expect(first.locator('time')).toHaveCount(1);
    await expect(page.locator('#feed > article').nth(1).locator('> time.activity-time')).toHaveCount(1);
    await expect(page.locator('#feed > [data-activity-heading]')).toHaveCount(2);
  });
});
