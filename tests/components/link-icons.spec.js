/**
 * Auto-detected link icons and abbr affordances (vanilla-breeze-kafb).
 *
 * The A-element review found: a download link to a .pdf showed the PDF
 * badge instead of the download arrow; header/footer/nav and a.button only
 * suppressed some auto-icons; an authored <icon-wc> got a second glyph;
 * glyphs were read aloud; <abbr> without title still looked expandable.
 */
import { test, expect } from 'playwright/test';

async function load(page, body) {
  const url = `/__links-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/cdn/vanilla-breeze.css"></head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const pseudo = (page, sel, which) => page.locator(sel).evaluate(
  (el, w) => getComputedStyle(el, w).content, which);

test('download link to a PDF shows the download arrow, not the PDF badge', async ({ page }) => {
  await load(page, `<main>
    <a id="dl" href="/r.pdf" download>Report</a>
    <a id="pdf" href="/r.pdf">Report</a></main>`);
  expect(await pseudo(page, '#dl', '::after')).toContain('↓');
  expect(await pseudo(page, '#pdf', '::after')).toContain('PDF');
});

test('nav, header, footer and a.button suppress every auto-icon', async ({ page }) => {
  const links = `<a class="x" href="https://e.com">e</a><a class="x" href="/f.pdf">f</a>
    <a class="x" href="/f.zip" download>d</a><a class="b" href="mailto:a@b.c">m</a><a class="b" href="tel:1">t</a>`;
  await load(page, `<header>${links}</header><nav>${links}</nav><footer>${links}</footer>
    <main><p>
      <a class="button x" href="https://e.com">e</a><a class="button x" href="/f.pdf">f</a>
      <a class="button b" href="mailto:a@b.c">m</a><a class="button b" href="tel:1">t</a>
    </p></main>`);
  const after = await page.locator('a.x').evaluateAll((els) => els.map((e) => getComputedStyle(e, '::after').content));
  const before = await page.locator('a.b').evaluateAll((els) => els.map((e) => getComputedStyle(e, '::before').content));
  expect(after.every((c) => c === 'none')).toBe(true);
  expect(before.every((c) => c === 'none')).toBe(true);
});

test('an authored icon-wc replaces the auto glyph', async ({ page }) => {
  await load(page, `<main><a id="m" href="mailto:a@b.c"><icon-wc name="mail"></icon-wc> Mail</a>
    <a id="plain" href="mailto:a@b.c">Mail</a></main>`);
  expect(await pseudo(page, '#m', '::before')).toBe('none');
  expect(await pseudo(page, '#plain', '::before')).not.toBe('none');
});

test('decorative glyphs carry empty alternative text', async ({ page }) => {
  await load(page, '<main><a id="ext" href="https://e.com">Example</a></main>');
  expect(await pseudo(page, '#ext', '::after')).toMatch(/"↗"\s*\/\s*""/);
});

test('abbr is only underlined when it has a title', async ({ page }) => {
  await load(page, `<main><p><abbr id="t" title="HyperText Markup Language">HTML</abbr>
    <abbr id="n">CSS</abbr> <abbr id="p" data-variant="plain" title="x">X</abbr></p></main>`);
  const deco = (sel) => page.locator(sel).evaluate((el) => [getComputedStyle(el).textDecorationLine, getComputedStyle(el).cursor]);
  expect(await deco('#t')).toEqual(['underline', 'help']);
  expect(await deco('#n')).not.toContain('help');
  expect((await deco('#n'))[0]).toBe('none');
  expect((await deco('#p'))[0]).toBe('none');
});
