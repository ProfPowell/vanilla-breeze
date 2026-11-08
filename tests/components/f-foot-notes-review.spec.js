/**
 * foot-notes — F-review fixes (vanilla-breeze-4rtb, -ihgb).
 *
 * Covers: fragment links stay on the page under <base href> (foot-notes,
 * glossary-wc, site-index); notes read once (content moved into the list,
 * reference named "Footnote N", no describedby duplication, no hidden tab
 * stops); DPUB-ARIA roles; nodes moved not copied (unique ids, listeners
 * kept); repeat citations via data-ref with a/b backlinks; preview popover
 * (keyboard + Escape); print hides backlinks; reconnect renumbers in place.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join, extname } from 'node:path';
import { readFile } from 'node:fs/promises';

const REPO = join(import.meta.dirname, '..', '..');

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

async function load(page, body, { base = '', modules = ['foot-notes'], ready = 'foot-notes[data-upgraded]' } = {}) {
  // Anything that escapes to the <base> host lands here — tests assert we never do.
  // (Registered first: later routes win, so /src/ on the base host still hits disk.)
  await page.route('https://cdn.example/**', (route) => route.fulfill({
    status: 200, contentType: 'text/html', body: '<!doctype html><title>escaped</title><p>escaped</p>',
  }));
  // Under <base href> the /src/ URLs resolve to the base host — cross-origin
  // module scripts need CORS.
  await page.route('**/src/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(REPO, decodeURIComponent(pathname));
    try {
      await route.fulfill({
        status: 200,
        body: await readFile(file),
        contentType: TYPES[extname(file)] ?? 'application/octet-stream',
        headers: { 'access-control-allow-origin': '*' },
      });
    } catch {
      await route.fulfill({ status: 404, body: '' });
    }
  });
  const url = `/__f-foot-notes-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '/src/web-components/${m}/logic.js';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      ${base ? `<base href="${base}">` : ''}
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">${imports}</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  if (ready) await page.waitForSelector(ready);
  return url;
}

const BASIC = `
  <article>
    <p id="p1">The Web was invented<foot-note>Tim Berners-Lee at <a id="cern" href="https://home.cern/">CERN</a>, 1989.</foot-note> for scientists.</p>
    <p id="p2">HTML gives structure<foot-note>HyperText Markup Language.</foot-note> to documents.</p>
    <p style="margin-block-end: 200vh">Spacer</p>
  </article>
  <foot-notes></foot-notes>`;

test.describe('base href: fragment links stay on the page', () => {
  test('foot-notes reference and backlink', async ({ page }) => {
    const url = await load(page, BASIC, { base: 'https://cdn.example/' });
    await page.locator('#p1 a[role="doc-noteref"]').click();
    expect(page.url()).toContain(url);
    expect(new URL(page.url()).hash).toBe('#fn-1-1');
    await expect(page.locator('#fn-1-1')).toBeFocused();
    expect(await page.locator('#fn-1-1').evaluate((el) => el.matches(':target'))).toBe(true);

    await page.locator('#fn-1-1 [data-backref]').click();
    expect(new URL(page.url()).hash).toBe('#fnref-1-1');
    await expect(page.locator('#fnref-1-1')).toBeFocused();
    expect(page.url()).toContain(url);
  });

  test('keyboard Enter on a reference stays on the page', async ({ page }) => {
    const url = await load(page, BASIC, { base: 'https://cdn.example/' });
    await page.locator('#p2 a[role="doc-noteref"]').focus();
    await page.keyboard.press('Enter');
    expect(page.url()).toContain(url);
    expect(new URL(page.url()).hash).toBe('#fn-1-2');
  });

  test('glossary-wc jump bar', async ({ page }) => {
    const url = await load(page, `
      <glossary-wc>
        <dl>
          <div data-term-id="alpha" data-category="A"><dt>Alpha</dt><dd>First.</dd></div>
          <div data-term-id="zulu" data-category="Z"><dt>Zulu</dt><dd>Last. <a href="#alpha">Alpha</a></dd></div>
        </dl>
      </glossary-wc>`, { base: 'https://cdn.example/', modules: ['glossary-wc'], ready: 'glossary-wc[data-upgraded]' });
    const letter = page.locator('.gloss-jump-letter[data-active]').last();
    const href = await letter.getAttribute('href');
    expect(href).toMatch(/^#/);
    await letter.click();
    expect(page.url()).toContain(url);
    expect(new URL(page.url()).hash).toBe(href);
    // Authored see-also link inside the glossary too
    await page.locator('dd a[href="#alpha"]').click();
    expect(page.url()).toContain(url);
    expect(new URL(page.url()).hash).toBe('#alpha');
  });

  test('site-index jump nav', async ({ page }) => {
    const url = await load(page, `
      <site-index>
        <nav aria-label="Site index">
          <section id="index-a"><h2>A</h2><ul><li><a href="/a">Apple</a></li></ul></section>
          <section id="index-b"><h2>B</h2><ul><li><a href="/b">Banana</a></li></ul></section>
        </nav>
      </site-index>`, { base: 'https://cdn.example/', modules: ['site-index'], ready: 'site-index[data-upgraded]' });
    const link = page.locator('.index-jump a[href="#index-b"]');
    await link.click();
    expect(page.url()).toContain(url);
    expect(new URL(page.url()).hash).toBe('#index-b');
    await expect(page.locator('#index-b')).toBeFocused();
  });
});

test('notes are read once: paragraph excludes note text, ref named "Footnote 1"', async ({ page }) => {
  await load(page, BASIC);
  const snap = await page.locator('#p1').ariaSnapshot();
  expect(snap).not.toContain('Berners-Lee');
  expect(snap).toContain('Footnote 1');
  const ref = page.locator('#p1 a[role="doc-noteref"]');
  await expect(ref).toHaveAccessibleName('Footnote 1');
  expect(await ref.getAttribute('aria-describedby')).toBeNull();
  // No clipped spans left inside the reference
  expect(await page.locator('#p1 foot-note > :not(a)').count()).toBe(0);
});

test('no hidden focusable links: every tab stop is visible', async ({ page }) => {
  await load(page, BASIC);
  const hidden = await page.evaluate(() => [...document.querySelectorAll('a[href], [tabindex]:not([tabindex="-1"])')]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return !el.closest('[inert]') && (r.width <= 1 || r.height <= 1);
    }).map((el) => el.outerHTML));
  expect(hidden).toEqual([]);
  // The authored link inside the note now lives in the visible list
  await expect(page.locator('foot-notes #cern')).toBeVisible();
});

test('DPUB-ARIA roles and labelled endnotes section', async ({ page }) => {
  await load(page, BASIC);
  expect(await page.locator('a[role="doc-noteref"]').count()).toBe(2);
  expect(await page.locator('foot-notes a[role="doc-backlink"]').count()).toBe(2);
  const section = page.locator('foot-notes > section[role="doc-endnotes"]');
  await expect(section).toHaveAccessibleName('Notes');
  // Heading is visually hidden by default
  const box = await section.locator('h2').boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(1);
  // Back glyph uses text presentation
  expect(await page.locator('#fn-1-1 [data-backref]').textContent()).toBe('↩︎');
  // Host carries no internal attributes
  const hostAttrs = await page.locator('foot-notes').evaluate((el) => el.getAttributeNames().sort());
  expect(hostAttrs).toEqual(['data-upgraded']);
});

test('authored heading child labels the section; labels are observed', async ({ page }) => {
  await load(page, `<p>Text<foot-note>Note.</foot-note></p>
    <foot-notes data-label-ref="Note {n}"><h2>References</h2></foot-notes>`);
  await expect(page.locator('[role="doc-endnotes"]')).toHaveAccessibleName('References');
  await expect(page.locator('a[role="doc-noteref"]')).toHaveAccessibleName('Note 1');
  await page.locator('foot-notes').evaluate((el) => {
    el.setAttribute('data-label-ref', 'Endnote {n}');
    el.setAttribute('data-label-back', 'Return');
  });
  await expect(page.locator('a[role="doc-noteref"]')).toHaveAccessibleName('Endnote 1');
  await expect(page.locator('[data-backref]')).toHaveAccessibleName('Return');
  expect(await page.locator('foot-notes h2').count()).toBe(1);
  expect(await page.locator('foot-notes li').count()).toBe(1);
});

test('content nodes are moved: ids unique, listeners preserved', async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('cern')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.__clicked = (window.__clicked || 0) + 1;
      });
    });
  });
  await load(page, BASIC);
  expect(await page.locator('[id="cern"]').count()).toBe(1);
  await page.locator('#cern').click();
  expect(await page.evaluate(() => window.__clicked)).toBe(1);
  // Ids generated are fn-1-N / fnref-1-N
  expect(await page.locator('#fn-1-2').count()).toBe(1);
  expect(await page.locator('a#fnref-1-2').count()).toBe(1);
});

test('repeat citations (data-ref) share one note with a/b backlinks', async ({ page }) => {
  await load(page, `
    <p id="a">First<foot-note id="src">Shared source.</foot-note>.</p>
    <p id="b">Other<foot-note>Other note.</foot-note>.</p>
    <p id="c">Again<foot-note data-ref="src"></foot-note>.</p>
    <foot-notes></foot-notes>`);
  expect(await page.locator('foot-notes li').count()).toBe(2);
  await expect(page.locator('#c a[role="doc-noteref"]')).toHaveAccessibleName('Footnote 1');
  expect(await page.locator('#c a[role="doc-noteref"]').getAttribute('href')).toBe('#fn-1-1');
  expect(await page.locator('#c a[role="doc-noteref"]').getAttribute('id')).toBe('fnref-1-1-b');
  const backs = page.locator('#fn-1-1 [data-backref]');
  expect(await backs.count()).toBe(2);
  await expect(backs.nth(0)).toHaveAccessibleName('Back to content (a)');
  await expect(backs.nth(1)).toHaveAccessibleName('Back to content (b)');
  expect(await backs.nth(1).getAttribute('href')).toBe('#fnref-1-1-b');
  // Author id stays on the source foot-note
  expect(await page.locator('#src').evaluate((el) => el.localName)).toBe('foot-note');
});

test('preview popover: keyboard focus shows it, Escape hides it', async ({ page }) => {
  await load(page, BASIC);
  await page.locator('h1, body').first().click({ position: { x: 1, y: 1 } }).catch(() => {});
  await page.keyboard.press('Tab');
  const ref = page.locator('#p1 a[role="doc-noteref"]');
  await expect(ref).toBeFocused();
  const preview = page.locator('foot-notes > .fn-preview');
  await expect(preview).toHaveJSProperty('inert', true);
  expect(await preview.evaluate((el) => el.matches(':popover-open'))).toBe(true);
  await expect(preview).toContainText('Berners-Lee');
  expect(await preview.getAttribute('aria-hidden')).toBe('true');
  expect(await preview.locator('[id]').count()).toBe(0);
  await page.keyboard.press('Escape');
  expect(await preview.evaluate((el) => el.matches(':popover-open'))).toBe(false);
  await expect(ref).toBeFocused();
});

test('preview popover: hover shows, leaving hides; data-preview=false disables', async ({ page }) => {
  await load(page, BASIC);
  const ref = page.locator('#p2 a[role="doc-noteref"]');
  await ref.hover();
  const preview = page.locator('foot-notes > .fn-preview');
  await expect.poll(() => preview.evaluate((el) => el.matches(':popover-open'))).toBe(true);
  await expect(preview).toContainText('HyperText');
  await page.mouse.move(0, 0);
  await expect.poll(() => preview.evaluate((el) => el.matches(':popover-open'))).toBe(false);

  await page.locator('foot-notes').evaluate((el) => el.setAttribute('data-preview', 'false'));
  await page.locator('#p2 a[role="doc-noteref"]').hover();
  await page.waitForTimeout(300);
  expect(await page.locator('foot-notes > .fn-preview').count()).toBe(0);
});

test('print: backlinks hidden, refs plain superscript numbers', async ({ page }) => {
  await load(page, BASIC);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#fn-1-1 [data-backref]')).toBeHidden();
  const ref = await page.locator('#p1 a[role="doc-noteref"]').evaluate((el) => ({
    va: getComputedStyle(el).verticalAlign,
    before: getComputedStyle(el, '::before').content,
    text: el.textContent,
  }));
  expect(ref.va).toBe('super');
  expect(ref.before).toBe('none');
  expect(ref.text).toBe('1');
  await expect(page.locator('foot-notes li').first()).toBeVisible();
});

test('reconnect: notes inserted meanwhile are numbered in place, one list', async ({ page }) => {
  await load(page, BASIC);
  const r = await page.evaluate(() => {
    const fns = document.querySelector('foot-notes');
    const parent = fns.parentNode;
    fns.remove();
    const p = document.createElement('p');
    p.id = 'p0';
    p.innerHTML = 'Earlier<foot-note>Inserted note.</foot-note>';
    document.querySelector('article').prepend(p);
    parent.append(fns);
    return {
      lists: fns.querySelectorAll('ol').length,
      items: [...fns.querySelectorAll('li')].map((li) => li.firstChild.textContent.trim()),
      refs: [...document.querySelectorAll('a[role="doc-noteref"]')].map((a) => a.textContent),
      cernCount: document.querySelectorAll('[id="cern"]').length,
      ids: [...fns.querySelectorAll('li')].map((li) => li.id),
    };
  });
  expect(r.lists).toBe(1);
  expect(r.items[0]).toBe('Inserted note.');
  expect(r.refs).toEqual(['1', '2', '3']);
  expect(r.cernCount).toBe(1);
  expect(r.ids).toEqual(['fn-1-1', 'fn-1-2', 'fn-1-3']);
});

test('sidenotes: aside role=note, data-side=false goes to the list', async ({ page }) => {
  await load(page, `
    <p id="s1">Side<foot-note>Margin note.</foot-note>.</p>
    <p id="s2">Listed<foot-note data-side="false">List note.</foot-note>.</p>
    <foot-notes data-mode="sidenotes"></foot-notes>`);
  const aside = page.locator('#s1 aside.sidenote');
  expect(await aside.getAttribute('role')).toBe('note');
  await expect(aside).toContainText('Margin note.');
  await expect(page.locator('#s1 a[role="doc-noteref"]')).toHaveAccessibleName('Footnote 1');
  expect(await page.locator('foot-notes li').count()).toBe(1);
  await expect(page.locator('foot-notes li')).toContainText('List note.');
  expect(await page.locator('#s2 foot-note').getAttribute('data-side')).toBe('false');
  expect(await page.locator('#s1 foot-note').getAttribute('data-side')).toBeNull();
});
