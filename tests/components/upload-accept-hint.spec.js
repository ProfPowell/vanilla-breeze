/**
 * data-upload accept hint: friendly labels instead of upper-cased tokens.
 * Extensions upper-case (.pdf -> PDF), MIME wildcards read as words
 * (image/* -> images, localisable with data-label-images/-audio/-video),
 * plain exact subtypes upper-case (application/pdf -> PDF), anything else
 * as written in lower case; duplicates collapse. "IMAGE/*" was the bug.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__upload-hint-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/utils/upload-init.js'; window.__ready = true;</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready);
  await page.waitForSelector('.upload-zone');
}

const hint = (page, id) => page.locator(`#${id}`).locator('xpath=ancestor::*[contains(@class,"upload-zone")]').locator('small');

test('accept tokens render as friendly labels', async ({ page }) => {
  await load(page, `
    <label for="a">A</label><input type="file" id="a" data-upload accept="image/*">
    <label for="b">B</label><input type="file" id="b" data-upload accept=".pdf,application/pdf,.DOCX">
    <label for="c">C</label><input type="file" id="c" data-upload accept="audio/*,video/*,text/*">
    <label for="d">D</label><input type="file" id="d" data-upload accept="image/svg+xml,application/vnd.ms-excel">`);
  await expect(hint(page, 'a')).toHaveText('images');
  await expect(hint(page, 'b')).toHaveText('PDF, DOCX');
  await expect(hint(page, 'c')).toHaveText('audio, video, text/*');
  await expect(hint(page, 'd')).toHaveText('image/svg+xml, application/vnd.ms-excel');
});

test('wildcard words are localisable with data-label-*', async ({ page }) => {
  await load(page, `<label for="a">A</label>
    <input type="file" id="a" data-upload accept="image/*,video/*" data-label-images="Bilder" data-label-video="Videos">`);
  await expect(hint(page, 'a')).toHaveText('Bilder, Videos');
});
