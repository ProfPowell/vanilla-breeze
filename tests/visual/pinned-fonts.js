/**
 * Pinned web fonts for screenshot suites (vanilla-breeze-saei).
 *
 * Themes load Google Fonts through the css2 API, which resolves to versioned
 * woff2 URLs. When Google ships a new build, every glyph shifts and themed
 * baselines fail until they're regenerated: on Google's schedule, not ours.
 *
 * This fixture intercepts fonts.googleapis.com and fonts.gstatic.com and
 * serves a committed copy from tests/visual/font-cache/. The cached css2
 * response keeps pointing at the same versioned woff2 URLs, so a cache
 * entry never changes once recorded. A miss is fetched live once and
 * written to the cache; commit the new files with the baselines they
 * produced.
 *
 *   VB_FONT_CACHE=refresh  re-fetch everything (then regenerate baselines)
 *   VB_FONT_CACHE=strict   fail on a miss instead of fetching (CI-style check)
 *
 * Usage: import { test, expect } from './pinned-fonts.js' instead of
 * 'playwright/test'. The fixture is automatic.
 */
import { test as base, expect } from 'playwright/test';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CACHE_DIR = join(import.meta.dirname, 'font-cache');
const MODE = process.env.VB_FONT_CACHE || '';

const TYPES = {
  css: 'text/css; charset=utf-8',
  woff2: 'font/woff2',
  woff: 'font/woff',
  ttf: 'font/ttf',
};

/** @param {string} contentType @param {string} url */
function extFor(contentType, url) {
  if (contentType.includes('css')) return 'css';
  const fromUrl = /\.(woff2|woff|ttf)(?:$|\?)/.exec(url)?.[1];
  if (fromUrl) return fromUrl;
  if (contentType.includes('woff2')) return 'woff2';
  if (contentType.includes('woff')) return 'woff';
  return 'ttf';
}

/** Cache path for a URL, whatever extension it was recorded with. */
function cachedFile(url) {
  const key = createHash('sha1').update(url).digest('hex').slice(0, 16);
  for (const ext of Object.keys(TYPES)) {
    const file = join(CACHE_DIR, `${key}.${ext}`);
    if (existsSync(file)) return { key, file, ext };
  }
  return { key, file: null, ext: null };
}

/** @param {import('playwright/test').Page} page */
export async function pinWebFonts(page) {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, async (route) => {
    const url = route.request().url();
    let { key, file, ext } = cachedFile(url);

    if (!file || MODE === 'refresh') {
      if (MODE === 'strict') {
        throw new Error(`pinned-fonts: no cached copy of ${url} (run without VB_FONT_CACHE=strict to record it)`);
      }
      let res;
      try {
        res = await route.fetch();
      } catch {
        return; // page closed mid-fetch (test already finished); nothing to serve
      }
      if (!res.ok()) return route.fulfill({ response: res });
      ext = extFor(res.headers()['content-type'] || '', url);
      mkdirSync(CACHE_DIR, { recursive: true });
      file = join(CACHE_DIR, `${key}.${ext}`);
      writeFileSync(file, await res.body());
    }

    await route.fulfill({
      status: 200,
      body: readFileSync(file),
      headers: {
        'content-type': TYPES[ext],
        'access-control-allow-origin': '*',
        'cache-control': 'max-age=31536000',
      },
    });
  });
}

export const test = base.extend({
  pinnedFonts: [async ({ page }, use) => {
    await pinWebFonts(page);
    await use();
    // A test can finish while a font request is still in flight; don't let
    // the handler throw into teardown.
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }, { auto: true }],
});

export { expect };
