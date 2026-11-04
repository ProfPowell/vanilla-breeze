/**
 * video / video-player — U–Y review fixes.
 *
 * video-player: shortcuts never hijack the player's own sliders/buttons or
 * modifier chords; per-slider arrow behaviour; host role/name/keyshortcuts;
 * mute aria-pressed; slider value text; auto-hide never hides focused
 * controls; the invisible overlay is inert; fullscreen state is per player;
 * reconnect re-wires media listeners; autoplay skipped under reduced motion
 * and not replayed on move; data-label-* + locale digits; LTR controls.
 * Native video: aspect classes letterbox, .cover/.ultrawide; chapter-list
 * aria-current + data-label.
 *
 * Tests the working tree: /src is served from disk, not the build. Media
 * timing is stubbed per instance (no real decoding needed).
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const MOD = process.platform === 'darwin' ? 'Meta' : 'Control';

async function load(page, body, { dir = 'ltr', lang = 'en', modules = ['/src/web-components/video-player/logic.js'] } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__u3-assets/**', (route) => route.fulfill({
    path: join(REPO, 'demos/snippets/demos/assets', new URL(route.request().url()).pathname.split('/').pop()),
    contentType: 'text/vtt',
  }));
  const url = `/__uy-video-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${modules.map((m) => `<script type="module">import '${m}';</script>`).join('\n')}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Stub currentTime/duration/fullscreen on the inner video so seeks are observable. */
async function stubMedia(page, sel = 'video-player') {
  await page.evaluate((s) => {
    for (const el of document.querySelectorAll(s)) {
      const v = el.querySelector('video');
      let t = 0;
      Object.defineProperty(v, 'duration', { configurable: true, get: () => 200 });
      Object.defineProperty(v, 'currentTime', {
        configurable: true,
        get: () => t,
        set: (x) => { t = x; v.dispatchEvent(new Event('timeupdate')); },
      });
      el.__fs = 0;
      el.requestFullscreen = () => { el.__fs++; return Promise.resolve(); };
    }
  }, sel);
}

const PLAYER = (attrs = '', inner = '') => `
  <video-player ${attrs}>
    <video controls preload="none">${inner}</video>
  </video-player>`;

async function ready(page) {
  await page.waitForSelector('video-player[data-upgraded]', { state: 'attached' });
}

test.describe('video-player keyboard', () => {
  test('arrows on the volume slider change volume and never seek', async ({ page }) => {
    await load(page, PLAYER());
    await ready(page);
    await stubMedia(page);
    await page.evaluate(() => {
      const el = document.querySelector('video-player');
      el.querySelector('video').currentTime = 50;
      el.shadowRoot.querySelector('.volume').focus();
    });
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    const r = await page.evaluate(() => {
      const el = document.querySelector('video-player');
      const v = el.querySelector('video');
      return { t: v.currentTime, vol: Math.round(v.volume * 100) };
    });
    expect(r.t).toBe(50);
    expect(r.vol).toBe(90);
  });

  test('arrows on the seek slider seek 5s and never change volume', async ({ page }) => {
    await load(page, PLAYER());
    await ready(page);
    await stubMedia(page);
    await page.evaluate(() => document.querySelector('video-player').shadowRoot.querySelector('.timeline').focus());
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowUp');
    const r = await page.evaluate(() => {
      const el = document.querySelector('video-player');
      const v = el.querySelector('video');
      return { t: v.currentTime, vol: v.volume, vt: el.shadowRoot.querySelector('.timeline').getAttribute('aria-valuetext') };
    });
    expect(r).toEqual({ t: 10, vol: 1, vt: '0:10 of 3:20' });
  });

  test('space on a focused control does not toggle playback via the host shortcut', async ({ page }) => {
    await load(page, PLAYER());
    await ready(page);
    const calls = await page.evaluate(() => {
      const el = document.querySelector('video-player');
      const v = el.querySelector('video');
      let n = 0;
      v.play = () => { n++; return Promise.resolve(); };
      const mute = el.shadowRoot.querySelector('.mute-btn');
      mute.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true, cancelable: true }));
      return n;
    });
    expect(calls).toBe(0);
  });

  test('host shortcuts: arrows seek 10s / change volume', async ({ page }) => {
    await load(page, PLAYER());
    await ready(page);
    await stubMedia(page);
    await page.locator('video-player').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    const r = await page.evaluate(() => {
      const v = document.querySelector('video-player video');
      return { t: v.currentTime, vol: Math.round(v.volume * 100) };
    });
    expect(r).toEqual({ t: 10, vol: 95 });
  });

  test('modifier chords (Ctrl/Cmd+F, Ctrl/Cmd+C) do not trigger fullscreen or captions', async ({ page }) => {
    await load(page, PLAYER('', '<track kind="captions" src="/__u3-assets/track-captions-en.vtt" srclang="en" label="English">'));
    await ready(page);
    await stubMedia(page);
    await page.locator('video-player').focus();
    await page.keyboard.press(`${MOD}+f`);
    await page.keyboard.press(`${MOD}+c`);
    const r = await page.evaluate(() => {
      const el = document.querySelector('video-player');
      return { fs: el.__fs, captions: el.hasAttribute('captions') };
    });
    expect(r).toEqual({ fs: 0, captions: false });
    // Plain F still works
    await page.keyboard.press('f');
    expect(await page.evaluate(() => document.querySelector('video-player').__fs)).toBe(1);
  });
});

test.describe('video-player a11y', () => {
  test('host is a named group with keyshortcuts; mute exposes aria-pressed', async ({ page }) => {
    await load(page, PLAYER());
    await ready(page);
    const host = page.locator('video-player');
    await expect(host).toHaveAttribute('role', 'group');
    await expect(host).toHaveAttribute('aria-label', 'Video player');
    await expect(host).toHaveAttribute('aria-keyshortcuts', /Space.*M F C/);
    const mute = host.locator('.mute-btn');
    await expect(mute).toHaveAttribute('aria-pressed', 'false');
    await host.focus();
    await page.keyboard.press('m');
    await expect(mute).toHaveAttribute('aria-pressed', 'true');
    await mute.click();
    await expect(mute).toHaveAttribute('aria-pressed', 'false');
  });

  test('authored <video muted> is reflected', async ({ page }) => {
    await load(page, `<video-player><video controls muted preload="none"></video></video-player>`);
    await ready(page);
    await expect(page.locator('video-player')).toHaveAttribute('muted', '');
    await expect(page.locator('video-player .mute-btn')).toHaveAttribute('aria-pressed', 'true');
  });

  test('slider value text: "0:05 of 3:20" and volume "37%"', async ({ page }) => {
    await load(page, PLAYER());
    await ready(page);
    await stubMedia(page);
    const r = await page.evaluate(async () => {
      const el = document.querySelector('video-player');
      const v = el.querySelector('video');
      v.currentTime = 5;
      v.volume = 0.37;
      await new Promise((res) => setTimeout(res, 50));
      return {
        seek: el.shadowRoot.querySelector('.timeline').getAttribute('aria-valuetext'),
        vol: el.shadowRoot.querySelector('.volume').getAttribute('aria-valuetext'),
      };
    });
    expect(r).toEqual({ seek: '0:05 of 3:20', vol: '37%' });
  });

  test('auto-hide never hides controls that contain focus', async ({ page }) => {
    await load(page, PLAYER());
    await ready(page);
    const r = await page.evaluate(async () => {
      const el = document.querySelector('video-player');
      el.querySelector('video').dispatchEvent(new Event('play'));
      el.shadowRoot.querySelector('.play-btn').focus();
      el.shadowRoot.querySelector('.player').dispatchEvent(new MouseEvent('mouseleave'));
      await new Promise((res) => setTimeout(res, 800));
      const focused = el.hasAttribute('controls');
      el.shadowRoot.querySelector('.play-btn').blur();
      el.shadowRoot.querySelector('.player').dispatchEvent(new MouseEvent('mouseleave'));
      await new Promise((res) => setTimeout(res, 800));
      return { focused, blurred: el.hasAttribute('controls') };
    });
    expect(r).toEqual({ focused: true, blurred: false });
  });

  test('the invisible play overlay is inert outside idle/ended', async ({ page }) => {
    await load(page, PLAYER());
    await ready(page);
    const r = await page.evaluate(() => {
      const el = document.querySelector('video-player');
      const o = el.shadowRoot.querySelector('.play-overlay');
      const idle = o.inert;
      el.querySelector('video').dispatchEvent(new Event('play'));
      const playing = o.inert;
      el.querySelector('video').dispatchEvent(new Event('pause'));
      return { idle, playing, paused: o.inert };
    });
    expect(r).toEqual({ idle: false, playing: true, paused: true });
  });

  test('controls stay LTR in an RTL page', async ({ page }) => {
    await load(page, PLAYER(), { dir: 'rtl', lang: 'ar' });
    await ready(page);
    const dir = await page.evaluate(() =>
      getComputedStyle(document.querySelector('video-player').shadowRoot.querySelector('.controls')).direction);
    expect(dir).toBe('ltr');
  });
});

test.describe('video-player state', () => {
  test('fullscreen state is per player (no cross-talk)', async ({ page }) => {
    await load(page, PLAYER('id="a"') + PLAYER('id="b"'));
    await page.waitForFunction(() => document.querySelectorAll('video-player[data-upgraded]').length === 2);
    const r = await page.evaluate(() => {
      const a = document.getElementById('a');
      const b = document.getElementById('b');
      let bEvents = 0;
      b.addEventListener('video-player:fullscreen', () => bEvents++);
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => a });
      document.dispatchEvent(new Event('fullscreenchange'));
      return {
        a: a.hasAttribute('data-fullscreen'),
        b: b.hasAttribute('data-fullscreen'),
        bEvents,
        aLabel: a.shadowRoot.querySelector('.fullscreen-btn').getAttribute('aria-label'),
      };
    });
    expect(r).toEqual({ a: true, b: false, bEvents: 0, aLabel: 'Exit fullscreen' });
  });

  test('media listeners re-attach when the <video> is swapped while disconnected', async ({ page }) => {
    await load(page, PLAYER());
    await ready(page);
    const r = await page.evaluate(async () => {
      const el = document.querySelector('video-player');
      const parent = el.parentNode;
      el.remove();
      el.querySelector('video').replaceWith(Object.assign(document.createElement('video'), { preload: 'none' }));
      parent.append(el);
      await new Promise((res) => setTimeout(res, 50));
      let plays = 0;
      el.addEventListener('video-player:play', () => plays++);
      el.querySelector('video').dispatchEvent(new Event('play'));
      return { plays, state: el.getAttribute('state'), controls: el.querySelector('video').hasAttribute('controls') };
    });
    expect(r).toEqual({ plays: 1, state: 'playing', controls: false });
  });

  test('autoplay runs once, is not replayed on move', async ({ page }) => {
    await page.addInitScript(() => {
      window.__plays = 0;
      HTMLMediaElement.prototype.play = function () { window.__plays++; return Promise.resolve(); };
    });
    await load(page, PLAYER('autoplay'));
    await ready(page);
    const plays = await page.evaluate(async () => {
      const el = document.querySelector('video-player');
      const parent = el.parentNode;
      el.remove(); parent.append(el);
      el.remove(); parent.append(el);
      await new Promise((res) => setTimeout(res, 50));
      return window.__plays;
    });
    expect(plays).toBe(1);
  });

  test('autoplay is skipped under prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      window.__plays = 0;
      HTMLMediaElement.prototype.play = function () { window.__plays++; return Promise.resolve(); };
    });
    await load(page, PLAYER('autoplay'));
    await ready(page);
    expect(await page.evaluate(() => window.__plays)).toBe(0);
  });
});

test.describe('video-player i18n', () => {
  test('data-label-* overrides labels and value text', async ({ page }) => {
    await load(page, PLAYER('data-label-play="Lire" data-label-player="Lecteur vidéo" data-label-time-of="{current} sur {duration}"'), { lang: 'fr' });
    await ready(page);
    await stubMedia(page);
    await page.evaluate(() => { document.querySelector('video-player video').currentTime = 65; });
    const host = page.locator('video-player');
    await expect(host).toHaveAttribute('aria-label', 'Lecteur vidéo');
    await expect(host.locator('.play-btn')).toHaveAttribute('aria-label', 'Lire');
    await expect(host.locator('.timeline')).toHaveAttribute('aria-valuetext', '1:05 sur 3:20');
  });

  test('time display uses the closest [lang] numbering system', async ({ page }) => {
    await load(page, PLAYER('lang="ar-EG"'));
    await ready(page);
    await stubMedia(page);
    await page.evaluate(() => { document.querySelector('video-player video').currentTime = 5; });
    const text = await page.locator('video-player .current-time').textContent();
    expect(text).toBe('٠:٠٥');
  });
});

test.describe('native video', () => {
  test('aspect classes letterbox; .cover opts in; .ultrawide is 21:9', async ({ page }) => {
    await load(page, `
      <video id="w" class="widescreen"></video>
      <video id="c" class="widescreen cover"></video>
      <video id="u" class="ultrawide"></video>`, { modules: [] });
    const r = await page.evaluate(() => ({
      w: getComputedStyle(document.getElementById('w')).objectFit,
      c: getComputedStyle(document.getElementById('c')).objectFit,
      u: getComputedStyle(document.getElementById('u')).aspectRatio,
    }));
    expect(r).toEqual({ w: 'contain', c: 'cover', u: '21 / 9' });
  });

  test('chapter list marks the active chapter with aria-current and honours data-label', async ({ page }) => {
    await load(page, `
      <video preload="none">
        <track kind="chapters" src="/__u3-assets/track-chapters-en.vtt" srclang="en" default data-chapter-list data-label="Chapitres">
      </video>`, { modules: ['/src/utils/chapter-list-init.js'], lang: 'fr' });
    await page.waitForSelector('.chapter-list button');
    const r = await page.evaluate(() => {
      const v = document.querySelector('video');
      Object.defineProperty(v, 'currentTime', { configurable: true, get: () => 2 });
      v.dispatchEvent(new Event('timeupdate'));
      const buttons = [...document.querySelectorAll('.chapter-list button')];
      return {
        label: document.querySelector('.chapter-list').getAttribute('aria-label'),
        current: buttons.map((b) => b.getAttribute('aria-current')),
      };
    });
    expect(r).toEqual({ label: 'Chapitres', current: [null, 'true', null] });
  });
});
