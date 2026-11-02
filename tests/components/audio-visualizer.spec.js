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
  });
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

async function load(page, body) {
  const errors = [];
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
async function play(page) {
  await page.evaluate(() => {
    document.getElementById('gesture').addEventListener('click', () => document.getElementById('a').play(), { once: true });
  });
  await page.click('#gesture');
  await page.waitForFunction(() => !document.getElementById('a').paused);
}

const SAME = '<audio id="a" src="/__media/one.wav"></audio>';
const spy = (page) => page.evaluate(() => {
  const s = window.__spy;
  return { ...s, analysers: s.analysers.map((n) => n.fftSize) };
});

test('re-observes visibility and re-registers the motion listener after a DOM move', async ({ page }) => {
  await load(page, `${SAME}<section id="one"><audio-visualizer for="a"></audio-visualizer></section><section id="two"></section>`);
  const before = await spy(page);
  expect(before.observe).toBe(1);
  expect(before.mqAdd).toBe(1);

  await page.evaluate(() => document.getElementById('two').append(document.querySelector('audio-visualizer')));
  const after = await spy(page);
  expect(after.observe).toBe(2);
  // Old listener removed, a fresh one added — no leak across moves
  expect(after.mqRemove).toBe(1);
  expect(after.mqAdd).toBe(2);

  await page.evaluate(() => document.querySelector('audio-visualizer').remove());
  expect((await spy(page)).mqRemove).toBe(2);
});

test('draw loop resumes after a move once playing', async ({ page }) => {
  await load(page, `${SAME}<section id="one"><audio-visualizer for="a"></audio-visualizer></section><section id="two"></section>`);
  await play(page);
  // Count canvas draws: the loop calls getContext('2d') every frame
  await page.evaluate(() => {
    window.__frames = 0;
    const gc = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...a) { window.__frames++; return gc.apply(this, a); };
    document.getElementById('two').append(document.querySelector('audio-visualizer'));
  });
  const n0 = await page.evaluate(() => window.__frames);
  await expect.poll(() => page.evaluate(() => window.__frames), { timeout: 3000 }).toBeGreaterThan(n0 + 5);
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
