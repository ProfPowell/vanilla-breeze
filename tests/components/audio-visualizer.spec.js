/**
 * <audio-visualizer> lifecycle and Web Audio wiring.
 *
 * Tests the WORKING TREE: /src/** is served from disk and the fixture page
 * is routed on a fake URL. Media is a generated silent PCM WAV. Web Audio is
 * observed through prototype spies installed before the page loads, so no
 * test-only API is added to the component.
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

/** Runs in the page before any script: count the calls we care about. */
function installSpies() {
  const spy = (window.__spy = {
    observe: 0, mqAdd: 0, mqRemove: 0, sources: 0, analysers: [], toDestination: 0, fromAnalyser: 0,
    getContext: 0, computed: 0, clears: 0, widthWrites: 0, timeReads: [], freqBuffers: new Set(), timeBuffers: new Set(),
  });
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...a) { spy.getContext++; return gc.apply(this, a); };
  const gcs = window.getComputedStyle;
  window.getComputedStyle = function (...a) { if (a[0]?.localName === 'audio-visualizer') spy.computed++; return gcs.apply(this, a); };
  const clear = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function (...a) { spy.clears++; return clear.apply(this, a); };
  const width = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');
  Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
    ...width, set(v) { spy.widthWrites++; width.set.call(this, v); },
  });
  const td = AnalyserNode.prototype.getByteTimeDomainData;
  AnalyserNode.prototype.getByteTimeDomainData = function (arr) {
    spy.timeReads.push([arr.length, this.fftSize]); spy.timeBuffers.add(arr); return td.call(this, arr);
  };
  const fd = AnalyserNode.prototype.getByteFrequencyData;
  AnalyserNode.prototype.getByteFrequencyData = function (arr) { spy.freqBuffers.add(arr); return fd.call(this, arr); };
  const io = IntersectionObserver.prototype.observe;
  IntersectionObserver.prototype.observe = function (...a) { spy.observe++; return io.apply(this, a); };
  const add = MediaQueryList.prototype.addEventListener;
  MediaQueryList.prototype.addEventListener = function (t, ...a) { if (t === 'change') spy.mqAdd++; return add.call(this, t, ...a); };
  const rem = MediaQueryList.prototype.removeEventListener;
  MediaQueryList.prototype.removeEventListener = function (t, ...a) { if (t === 'change') spy.mqRemove++; return rem.call(this, t, ...a); };
  const ctxProto = AudioContext.prototype;
  const cmes = ctxProto.createMediaElementSource;
  ctxProto.createMediaElementSource = function (...a) { spy.sources++; return cmes.apply(this, a); };
  const ca = BaseAudioContext.prototype.createAnalyser;
  BaseAudioContext.prototype.createAnalyser = function () { const n = ca.call(this); spy.analysers.push(n); return n; };
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...a) {
    if (dest instanceof AudioDestinationNode) spy.toDestination++;
    if (this instanceof AnalyserNode) spy.fromAnalyser++;
    return connect.call(this, dest, ...a);
  };
}

async function load(page, body, { reducedMotion = 'no-preference' } = {}) {
  const errors = [];
  await page.emulateMedia({ reducedMotion });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(installSpies);
  await page.route('**/src/**', (route) => {
    const path = join(REPO, new URL(route.request().url()).pathname);
    try {
      route.fulfill({ body: readFileSync(path), contentType: path.endsWith('.css') ? 'text/css' : 'text/javascript' });
    } catch {
      route.fulfill({ status: 404, body: '' });
    }
  });
  // Same-origin and (via localhost vs 127.0.0.1) cross-origin media
  await page.route('**/__media/*.wav', (route) => route.fulfill({
    status: 200, contentType: 'audio/wav', headers: { 'accept-ranges': 'none' }, body: WAV,
  }));
  const url = `/__audio-visualizer-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module" src="/src/web-components/audio-visualizer/logic.js"></script>
      </head><body><button id="gesture">gesture</button>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => [...document.querySelectorAll('audio-visualizer')].every((v) => v.hasAttribute('data-upgraded')));
  return errors;
}

/** Start playback from a real user gesture (autoplay / AudioContext policy). */
async function play(page, id = 'a') {
  await page.evaluate((id) => {
    document.getElementById('gesture').addEventListener('click', () => document.getElementById(id).play(), { once: true });
  }, id);
  await page.click('#gesture');
  await page.waitForFunction((id) => !document.getElementById(id).paused, id);
}

const SAME = '<audio id="a" src="/__media/one.wav"></audio>';
const spy = (page) => page.evaluate(() => {
  const s = window.__spy;
  return {
    ...s,
    analysers: s.analysers.map((n) => n.fftSize),
    timeReads: s.timeReads.slice(-3),
    freqBuffers: s.freqBuffers.size,
    timeBuffers: s.timeBuffers.size,
  };
});

test('re-observes visibility and re-registers the motion listener after a DOM move', async ({ page }) => {
  await load(page, `${SAME}<section id="one"><audio-visualizer for="a"></audio-visualizer></section><section id="two"></section>`);
  const before = await spy(page);
  expect(before.observe).toBe(1);
  // Two media-query listeners per connect: reduced motion + colour scheme
  expect(before.mqAdd).toBe(2);

  await page.evaluate(() => document.getElementById('two').append(document.querySelector('audio-visualizer')));
  const after = await spy(page);
  expect(after.observe).toBe(2);
  // Old listeners removed, fresh ones added — no leak across moves
  expect(after.mqRemove).toBe(2);
  expect(after.mqAdd).toBe(4);

  await page.evaluate(() => document.querySelector('audio-visualizer').remove());
  expect((await spy(page)).mqRemove).toBe(4);
});

test('draw loop resumes after a move once playing', async ({ page }) => {
  await load(page, `${SAME}<section id="one"><audio-visualizer for="a"></audio-visualizer></section><section id="two"></section>`);
  await play(page);
  // Count canvas draws: every frame starts with clearRect
  await page.evaluate(() => document.getElementById('two').append(document.querySelector('audio-visualizer')));
  const n0 = (await spy(page)).clears;
  await expect.poll(async () => (await spy(page)).clears, { timeout: 3000 }).toBeGreaterThan(n0 + 5);
});

test('two visualizers on one <audio> route it to the destination once', async ({ page }) => {
  await load(page, `${SAME}<audio-visualizer for="a"></audio-visualizer><audio-visualizer for="a" data-mode="waveform"></audio-visualizer>`);
  await play(page);
  await expect.poll(async () => (await spy(page)).analysers.length).toBe(2);
  const s = await spy(page);
  expect(s.sources).toBe(1);
  expect(s.toDestination).toBe(1);
  expect(s.fromAnalyser).toBe(0);
});

test('cross-origin audio without crossorigin is not hooked (stays audible)', async ({ page }) => {
  const warnings = [];
  page.on('console', (m) => { if (m.type() === 'warning' && m.text().includes('audio-visualizer')) warnings.push(m.text()); });
  await load(page, '<audio id="a" src="http://localhost:8123/__media/xo.wav"></audio><audio-visualizer for="a"></audio-visualizer>');
  await play(page);
  await expect(page.locator('audio-visualizer')).toHaveAttribute('data-state', 'cross-origin');
  // Pause + play again: still not hooked, warning not repeated
  await page.evaluate(() => document.getElementById('a').pause());
  await play(page);
  const s = await spy(page);
  expect(s.sources).toBe(0);
  expect(warnings).toHaveLength(1);
  expect(await page.evaluate(() => document.getElementById('a').paused)).toBe(false);
});

test('an invalid data-fft-size is clamped to a power of two instead of throwing', async ({ page }) => {
  const errors = await load(page, `${SAME}<audio-visualizer for="a" data-fft-size="100"></audio-visualizer><audio-visualizer for="a" data-fft-size="nope"></audio-visualizer><audio-visualizer for="a" data-fft-size="999999"></audio-visualizer>`);
  await play(page);
  await expect.poll(async () => (await spy(page)).analysers.length).toBe(3);
  expect((await spy(page)).analysers).toEqual([128, 256, 32768]);
  expect(errors).toEqual([]);
});

test('frames reuse the cached context, colours, canvas size and sample buffer', async ({ page }) => {
  await load(page, `${SAME}<audio-visualizer for="a"></audio-visualizer>`);
  await play(page);
  const s0 = await spy(page);
  await expect.poll(async () => (await spy(page)).clears, { timeout: 3000 }).toBeGreaterThan(s0.clears + 20);
  const s1 = await spy(page);
  expect(s1.getContext - s0.getContext).toBe(0);
  expect(s1.computed - s0.computed).toBe(0);
  expect(s1.widthWrites - s0.widthWrites).toBe(0);
  expect(s1.freqBuffers).toBe(1);
});

test('resizing the element resizes the canvas backing store', async ({ page }) => {
  await load(page, `${SAME}<audio-visualizer for="a"></audio-visualizer>`);
  const width = () => page.evaluate(() => document.querySelector('audio-visualizer').shadowRoot.querySelector('canvas').width);
  await page.evaluate(() => { document.querySelector('audio-visualizer').style.inlineSize = '200px'; });
  await expect.poll(width).toBe(200 * await page.evaluate(() => devicePixelRatio));
});

test('waveform reads fftSize time-domain samples into a buffer of that size', async ({ page }) => {
  await load(page, `${SAME}<audio-visualizer for="a" data-mode="waveform" data-fft-size="512"></audio-visualizer>`);
  await play(page);
  await expect.poll(async () => (await spy(page)).timeReads.length).toBeGreaterThan(2);
  const s = await spy(page);
  for (const [len, fft] of s.timeReads) expect([len, fft]).toEqual([512, 512]);
  expect(s.timeBuffers).toBe(1);
});

test('data-mode changes after start switch the drawing mode', async ({ page }) => {
  await load(page, `${SAME}<audio-visualizer for="a"></audio-visualizer>`);
  await play(page);
  await expect.poll(async () => (await spy(page)).freqBuffers).toBe(1);
  expect((await spy(page)).timeReads).toHaveLength(0);
  await page.evaluate(() => document.querySelector('audio-visualizer').setAttribute('data-mode', 'waveform'));
  await expect.poll(async () => (await spy(page)).timeReads.length).toBeGreaterThan(0);
});

test('reduced motion draws a static frame instead of a blank box, and does not animate', async ({ page }) => {
  await load(page, `${SAME}<audio-visualizer for="a"></audio-visualizer>`, { reducedMotion: 'reduce' });
  // A baseline frame is painted before playback...
  await expect.poll(async () => (await spy(page)).clears).toBeGreaterThan(0);
  const painted = await page.evaluate(() => {
    const c = document.querySelector('audio-visualizer').shadowRoot.querySelector('canvas');
    const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < px.length; i += 4) if (px[i]) return true;
    return false;
  });
  expect(painted).toBe(true);
  // ...and playing does not start a draw loop
  await play(page);
  await expect.poll(async () => (await spy(page)).analysers.length).toBe(1);
  const n0 = (await spy(page)).clears;
  await page.waitForTimeout(500);
  expect((await spy(page)).clears - n0).toBeLessThanOrEqual(1);
});

test('changing `for` after start rebinds to the new audio', async ({ page }) => {
  await load(page, `${SAME}<audio id="b" src="/__media/two.wav"></audio><audio-visualizer for="a"></audio-visualizer>`);
  await play(page);
  await expect.poll(async () => (await spy(page)).sources).toBe(1);
  await page.evaluate(() => {
    document.getElementById('a').pause();
    document.querySelector('audio-visualizer').setAttribute('for', 'b');
  });
  await play(page, 'b');
  await expect.poll(async () => (await spy(page)).sources).toBe(2);
  expect((await spy(page)).analysers).toHaveLength(2);
  // Still drawing from the new analyser
  const n0 = (await spy(page)).clears;
  await expect.poll(async () => (await spy(page)).clears, { timeout: 3000 }).toBeGreaterThan(n0 + 5);
});
