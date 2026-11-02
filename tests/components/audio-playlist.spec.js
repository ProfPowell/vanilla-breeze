/**
 * `.audio-standalone` playlist utility (src/utils/audio-playlist-init.js).
 *
 * Tests the WORKING TREE: /src/** is served from disk and the fixture page
 * is routed on a fake URL, so these don't depend on a fresh build snapshot.
 * Media is generated silent PCM WAV; "short" files are 1s long so `ended`
 * fires for real.
 */
import { test, expect } from 'playwright/test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Silent 16-bit mono PCM WAV of the given length. */
function silentWav(seconds, sampleRate = 8000) {
  const dataLen = seconds * sampleRate * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataLen, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataLen, 40);
  return buf;
}

const LONG = silentWav(30);
const SHORT = silentWav(1);

/** Serve a WAV with byte-range support; `missing` paths 404. */
function serveWav(route) {
  const url = route.request().url();
  if (url.includes('missing')) return route.fulfill({ status: 404, body: '' });
  const wav = url.includes('short') ? SHORT : LONG;
  const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers()['range'] || '');
  if (!range) {
    return route.fulfill({ status: 200, contentType: 'audio/wav', headers: { 'accept-ranges': 'bytes' }, body: wav });
  }
  const start = Number(range[1]);
  const end = range[2] ? Math.min(Number(range[2]), wav.length - 1) : wav.length - 1;
  return route.fulfill({
    status: 206,
    contentType: 'audio/wav',
    headers: { 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${wav.length}` },
    body: wav.subarray(start, end + 1),
  });
}

async function load(page, body) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/src/**', (route) => {
    const path = join(REPO, new URL(route.request().url()).pathname);
    try {
      route.fulfill({ body: readFileSync(path), contentType: path.endsWith('.css') ? 'text/css' : 'text/javascript' });
    } catch {
      route.fulfill({ status: 404, body: '' });
    }
  });
  await page.route('**/__media/*.wav', serveWav);
  const url = `/__audio-playlist-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <script type="module" src="/src/utils/audio-playlist-init.js"></script>
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('.audio-standalone[data-audio-playlist-init]');
  return errors;
}

const playlist = (tracks) => `
  <section class="audio-standalone">
    <audio controls><source src="/__media/${tracks[0]}.wav" type="audio/wav"></audio>
    <details open>
      <summary>Track Listing</summary>
      <ol class="track-list">
        ${tracks.map((t, i) => `<li${i ? '' : ' data-audio-active'}><a href="/__media/${t}.wav">${t}</a></li>`).join('')}
      </ol>
    </details>
  </section>`;

/** [played, active] flags per track. */
const flags = (page) => page.evaluate(() => [...document.querySelectorAll('.track-list li')]
  .map((li) => [li.hasAttribute('data-audio-played'), li.hasAttribute('data-audio-active')]));

test('clicking a track loads it, marks it active and plays it', async ({ page }) => {
  await load(page, playlist(['one', 'two', 'three']));
  await page.click('text=two');
  await page.waitForFunction(() => !document.querySelector('audio').paused);
  expect(await page.evaluate(() => document.querySelector('audio').src)).toMatch(/\/__media\/two\.wav$/);
  expect(await flags(page)).toEqual([[false, false], [false, true], [false, false]]);
  // The link did not navigate
  expect(page.url()).toContain('__audio-playlist-');
});

test('a track that ends is marked played, stays active until the next one starts, and auto-advances', async ({ page }) => {
  await load(page, playlist(['short-a', 'short-b']));
  await page.click('text=short-a');
  // a ends → b becomes active and plays
  await page.waitForFunction(() => document.querySelector('audio').src.endsWith('short-b.wav'), null, { timeout: 5000 });
  expect(await flags(page)).toEqual([[true, false], [false, true]]);
  // b (the last track) ends → playback stops and b stays active
  await page.waitForFunction(() => document.querySelector('audio').ended, null, { timeout: 5000 });
  expect(await flags(page)).toEqual([[true, false], [true, true]]);
  expect(await page.evaluate(() => document.querySelector('audio').src)).toMatch(/short-b\.wav$/);
});

test('a play() rejection from an unloadable track is caught', async ({ page }) => {
  const errors = await load(page, playlist(['one', 'missing']));
  await page.click('text=missing');
  await page.waitForFunction(() => document.querySelector('audio').error);
  await page.waitForTimeout(200);
  expect(errors).toEqual([]);
  expect(await flags(page)).toEqual([[false, false], [false, true]]);
});

test('containers added later are enhanced once', async ({ page }) => {
  await load(page, playlist(['one', 'two']));
  await page.evaluate((html) => document.body.insertAdjacentHTML('beforeend', html), playlist(['three', 'four']).replace('audio-standalone', 'audio-standalone late'));
  await page.waitForSelector('.late[data-audio-playlist-init]');
  await page.click('.late >> text=four');
  await page.waitForFunction(() => document.querySelector('.late audio').src.endsWith('four.wav'));
  // The first player is untouched
  expect(await page.evaluate(() => document.querySelector('audio').src)).toBe('');
});
