/**
 * <audio-player> keyboard + loop behaviour.
 *
 * Tests the WORKING TREE: /src/** is served from disk and the fixture page
 * is routed on a fake URL, so these don't depend on a fresh build snapshot.
 * Media is a generated silent PCM WAV (no network audio).
 */
import { test, expect } from 'playwright/test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Silent 16-bit mono PCM WAV of the given length. */
function silentWav(seconds = 30, sampleRate = 8000) {
  const dataLen = seconds * sampleRate * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataLen, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataLen, 40);
  return buf;
}

const WAV = silentWav();

/** Serve the WAV with byte-range support — media seeking needs a 206. */
function serveWav(route) {
  const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers()['range'] || '');
  if (!range) {
    return route.fulfill({ status: 200, contentType: 'audio/wav', headers: { 'accept-ranges': 'bytes' }, body: WAV });
  }
  const start = Number(range[1]);
  const end = range[2] ? Math.min(Number(range[2]), WAV.length - 1) : WAV.length - 1;
  return route.fulfill({
    status: 206,
    contentType: 'audio/wav',
    headers: { 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${WAV.length}` },
    body: WAV.subarray(start, end + 1),
  });
}

async function load(page, body) {
  await page.route('**/src/**', (route) => {
    const path = join(REPO, new URL(route.request().url()).pathname);
    try {
      route.fulfill({ body: readFileSync(path), contentType: path.endsWith('.css') ? 'text/css' : 'text/javascript' });
    } catch {
      route.fulfill({ status: 404, body: '' });
    }
  });
  await page.route('**/__media/*.wav', serveWav);
  const url = `/__audio-player-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module" src="/src/web-components/audio-player/logic.js"></script>
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('audio-player[data-upgraded]');
  // Wait for metadata so duration is known (seek clamps to it)
  await page.waitForFunction(() => document.querySelector('audio-player audio').readyState >= 1);
}

const PLAYLIST = `
  <audio-player>
    <audio controls><source src="/__media/one.wav" type="audio/wav"></audio>
    <details>
      <summary>Track Listing</summary>
      <ol class="track-list">
        <li data-audio-active><a href="/__media/one.wav">01. One</a></li>
        <li><a href="/__media/two.wav">02. Two</a></li>
      </ol>
    </details>
  </audio-player>`;

const state = (page) => page.evaluate(() => {
  const a = document.querySelector('audio-player audio');
  return { volume: a.volume, time: a.currentTime, paused: a.paused };
});

test.describe('audio-player keyboard', () => {
  test('ArrowLeft on the volume slider changes volume, not position', async ({ page }) => {
    await load(page, PLAYLIST);
    await page.evaluate(() => {
      const a = document.querySelector('audio-player audio');
      a.currentTime = 15;
    });
    await page.waitForFunction(() => document.querySelector('audio-player audio').currentTime === 15);
    await page.evaluate(() => document.querySelector('audio-player').shadowRoot.querySelector('input.volume').focus());
    const before = await state(page);
    await page.keyboard.press('ArrowLeft');
    const after = await state(page);
    expect(after.volume).toBeLessThan(before.volume);
    expect(after.time).toBe(before.time);
  });

  test('arrow keys on the seek slider keep their native step', async ({ page }) => {
    await load(page, PLAYLIST);
    const prevented = await page.evaluate(() => {
      const tl = document.querySelector('audio-player').shadowRoot.querySelector('input.timeline');
      tl.focus();
      const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true, cancelable: true });
      tl.dispatchEvent(ev);
      return ev.defaultPrevented;
    });
    expect(prevented).toBe(false);
  });

  test('Space on the playlist <summary> toggles it and does not play', async ({ page }) => {
    await load(page, PLAYLIST);
    await page.locator('audio-player summary').focus();
    await page.keyboard.press(' ');
    expect(await page.locator('audio-player details').evaluate((d) => d.open)).toBe(true);
    expect((await state(page)).paused).toBe(true);
    expect(await page.locator('audio-player').getAttribute('state')).not.toBe('playing');
  });

  test('Space and ArrowRight on the focused host still act as shortcuts', async ({ page }) => {
    await load(page, PLAYLIST);
    await page.locator('audio-player').focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(async () => (await state(page)).time).toBe(10);
    await page.keyboard.press(' ');
    await expect(page.locator('audio-player')).toHaveAttribute('state', 'playing');
  });
});

test.describe('audio-player loop', () => {
  const SINGLE = (attrs) => `
    <audio-player ${attrs}>
      <audio controls><source src="/__media/one.wav" type="audio/wav"></audio>
    </audio-player>`;

  test('loop on a single track sets audio.loop and follows the attribute', async ({ page }) => {
    await load(page, SINGLE('loop'));
    const loopOf = () => page.evaluate(() => document.querySelector('audio-player audio').loop);
    expect(await loopOf()).toBe(true);
    await page.evaluate(() => document.querySelector('audio-player').removeAttribute('loop'));
    expect(await loopOf()).toBe(false);
    await page.evaluate(() => document.querySelector('audio-player').setAttribute('loop', ''));
    expect(await loopOf()).toBe(true);
  });

  test('without loop, an author <audio loop> is left alone', async ({ page }) => {
    await load(page, `<audio-player><audio controls loop><source src="/__media/one.wav" type="audio/wav"></audio></audio-player>`);
    expect(await page.evaluate(() => document.querySelector('audio-player audio').loop)).toBe(true);
  });

  test('playlist mode leaves audio.loop off (loop wraps the list instead)', async ({ page }) => {
    await load(page, PLAYLIST.replace('<audio-player>', '<audio-player loop>'));
    expect(await page.evaluate(() => document.querySelector('audio-player audio').loop)).toBe(false);
  });
});
