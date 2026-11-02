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

async function load(page, body, { waitMetadata = true } = {}) {
  await page.route('**/src/**', (route) => {
    const path = join(REPO, new URL(route.request().url()).pathname);
    try {
      route.fulfill({ body: readFileSync(path), contentType: path.endsWith('.css') ? 'text/css' : 'text/javascript' });
    } catch {
      route.fulfill({ status: 404, body: '' });
    }
  });
  await page.route('**/__media/*.wav', (route) => (route.request().url().includes('missing')
    ? route.fulfill({ status: 404, body: '' })
    : serveWav(route)));
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
  if (waitMetadata) await page.waitForFunction(() => document.querySelector('audio-player audio').readyState >= 1);
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

const shadow = (page, sel, fn) => page.evaluate(
  ([sel, fn]) => (0, eval)(fn)(document.querySelector('audio-player').shadowRoot.querySelector(sel)),
  [sel, fn.toString()],
);

test.describe('audio-player accessibility', () => {
  test('seek slider speaks the position as "m:ss of m:ss"', async ({ page }) => {
    await load(page, PLAYLIST);
    const valuetext = () => shadow(page, 'input.timeline', (el) => el.getAttribute('aria-valuetext'));
    await expect.poll(valuetext).toBe('0:00 of 0:30');
    await page.evaluate(() => { document.querySelector('audio-player audio').currentTime = 65 / 5; });
    await expect.poll(valuetext).toBe('0:13 of 0:30');
  });

  test('mute button toggles aria-pressed and keeps the label "Mute"', async ({ page }) => {
    await load(page, PLAYLIST);
    const btn = () => shadow(page, '.mute-btn', (el) => ({ pressed: el.getAttribute('aria-pressed'), label: el.getAttribute('aria-label') }));
    expect(await btn()).toEqual({ pressed: 'false', label: 'Mute' });
    await shadow(page, '.mute-btn', (el) => el.click());
    expect(await btn()).toEqual({ pressed: 'true', label: 'Mute' });
    await expect(page.locator('audio-player')).toHaveAttribute('muted', '');
    // The M shortcut and programmatic changes stay in sync too
    await page.locator('audio-player').focus();
    await page.keyboard.press('m');
    expect(await btn()).toEqual({ pressed: 'false', label: 'Mute' });
    await page.evaluate(() => { document.querySelector('audio-player audio').muted = true; });
    await expect.poll(btn).toEqual({ pressed: 'true', label: 'Mute' });
  });

  test('the focusable host is a named group', async ({ page }) => {
    await load(page, PLAYLIST);
    const host = page.locator('audio-player');
    await expect(host).toHaveAttribute('tabindex', '0');
    await expect(host).toHaveAttribute('role', 'group');
    await expect(host).toHaveAttribute('aria-label', 'Audio player');
  });
});

test.describe('audio-player scrubbing', () => {
  test('timeupdate does not move the slider while :state(scrub-active)', async ({ page }) => {
    await load(page, PLAYLIST);
    const sliderValue = () => shadow(page, 'input.timeline', (el) => Number(el.value));
    await shadow(page, 'input.timeline', (el) => el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    await page.evaluate(() => { document.querySelector('audio-player audio').currentTime = 15; });
    // The readout follows playback...
    await expect.poll(() => shadow(page, '.current-time', (el) => el.textContent)).toBe('0:15');
    // ...but the slider under the pointer is left alone
    expect(await sliderValue()).toBe(0);
    const scrubbing = () => page.evaluate(() => document.querySelector('audio-player').matches(':state(scrub-active)'));
    expect(await scrubbing()).toBe(true);
    await shadow(page, 'input.timeline', (el) => el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
    expect(await scrubbing()).toBe(false);
    await page.evaluate(() => { document.querySelector('audio-player audio').currentTime = 6; });
    await expect.poll(sliderValue).toBe(20);
  });
});

test.describe('audio-player load errors', () => {
  test('a failing src sets data-state="error" and shows a polite message', async ({ page }) => {
    await load(page, '<audio-player><audio controls src="/__media/missing.wav"></audio></audio-player>', { waitMetadata: false });
    await expect(page.locator('audio-player')).toHaveAttribute('data-state', 'error');
    const msg = await shadow(page, '.error', (el) => ({ hidden: el.hidden, role: el.getAttribute('role'), text: el.textContent }));
    expect(msg.hidden).toBe(false);
    expect(msg.role).toBe('status');
    expect(msg.text).toContain('could not be loaded');
  });

  test('all <source> children failing is an error too; a good src clears it', async ({ page }) => {
    await load(page, '<audio-player><audio controls><source src="/__media/missing.wav" type="audio/wav"></audio></audio-player>', { waitMetadata: false });
    await expect(page.locator('audio-player')).toHaveAttribute('data-state', 'error');
    await page.evaluate(() => { document.querySelector('audio-player').src = '/__media/good.wav'; });
    await expect(page.locator('audio-player')).not.toHaveAttribute('data-state', 'error');
    expect(await shadow(page, '.error', (el) => el.hidden)).toBe(true);
  });
});

test.describe('audio-player src property', () => {
  test('setting src refreshes the title (filename fallback)', async ({ page }) => {
    await load(page, '<audio-player><audio controls src="/__media/one.wav"></audio></audio-player>');
    const title = () => shadow(page, '.track-title', (el) => el.textContent);
    expect(await title()).toBe('one');
    await page.evaluate(() => { document.querySelector('audio-player').src = '/__media/second_song.wav'; });
    expect(await title()).toBe('second song');
  });

  test('in playlist mode src moves data-audio-active to the matching track', async ({ page }) => {
    await load(page, PLAYLIST);
    await page.evaluate(() => { document.querySelector('audio-player').src = '/__media/two.wav'; });
    expect(await shadow(page, '.track-title', (el) => el.textContent)).toBe('02. Two');
    expect(await page.locator('li[data-audio-active]').textContent()).toContain('02. Two');
  });
});

const LIST = (attrs, n) => `
  <audio-player ${attrs}>
    <audio controls><source src="/__media/t0.wav" type="audio/wav"></audio>
    <details><summary>Tracks</summary><ol class="track-list">
      ${Array.from({ length: n }, (_, i) => `<li${i ? '' : ' data-audio-active'}><a href="/__media/t${i}.wav">Track ${i}</a></li>`).join('')}
    </ol></details>
  </audio-player>`;

/** Fire `ended` n times; return the active track index after each. */
const endTimes = (page, n) => page.evaluate((n) => {
  const audio = document.querySelector('audio-player audio');
  const items = [...document.querySelectorAll('.track-list li')];
  const seq = [];
  for (let i = 0; i < n; i++) {
    audio.dispatchEvent(new Event('ended'));
    seq.push(items.findIndex((li) => li.hasAttribute('data-audio-active')));
  }
  return seq;
}, n);

test.describe('audio-player playlist advance', () => {
  test('ended marks the track played, keeps it active, and advances', async ({ page }) => {
    await load(page, PLAYLIST);
    await page.evaluate(() => document.querySelector('audio-player audio').dispatchEvent(new Event('ended')));
    const flags = await page.evaluate(() => [...document.querySelectorAll('.track-list li')]
      .map((li) => [li.hasAttribute('data-audio-played'), li.hasAttribute('data-audio-active')]));
    expect(flags).toEqual([[true, false], [false, true]]);
    // At the end of the list (no loop) the last track stays active
    expect(await endTimes(page, 1)).toEqual([1]);
  });

  test('shuffle without loop plays each track once, never back-to-back, then stops', async ({ page }) => {
    await load(page, LIST('shuffle', 4));
    for (let round = 0; round < 5; round++) {
      await page.evaluate(() => {
        const items = [...document.querySelectorAll('.track-list li')];
        items.forEach((li, i) => li.toggleAttribute('data-audio-active', i === 0));
        const ap = document.querySelector('audio-player');
        ap.removeAttribute('shuffle'); ap.setAttribute('shuffle', ''); // fresh cycle
      });
      const seq = await endTimes(page, 4);
      // Three advances cover the remaining tracks, the fourth ended stops
      expect(new Set([0, ...seq.slice(0, 3)]).size).toBe(4);
      expect(seq[3]).toBe(seq[2]);
    }
  });

  test('shuffle with loop starts a new cycle without repeating the last track', async ({ page }) => {
    await load(page, LIST('shuffle loop', 3));
    const seq = [0, ...await endTimes(page, 30)];
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
    // Each cycle of three is a permutation
    for (let c = 0; c + 3 <= seq.length; c += 3) expect(new Set(seq.slice(c, c + 3)).size).toBe(3);
  });
});
