/**
 * T-review fixes: theme-picker, text-reader, text-divider.
 *
 * theme-picker: per-instance radio groups, keyboard never auto-dismisses,
 * async-init reconnect race, sibling a11y/extension sync, authored a11y
 * tokens kept, teardown resets open state, generated trigger type, labels.
 * text-reader: one control bar across reconnects (slot icons reused), no
 * speech-queue cancel before setup / when idle, focus follows Play/Pause,
 * highlight offsets on indented + inline-element HTML, content lang,
 * aria-hidden descendants skipped, icon toolbar placement + Escape,
 * reduced-motion scroll, data-label-*.
 * text-divider: border lines (forced colors), empty divider has no gap.
 *
 * Tests the working tree: /src is served from disk, not the build.
 * speechSynthesis is replaced with a deterministic recorder.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ modules?: string[], htmlAttrs?: string, fakeSpeech?: boolean }} [opts]
 */
async function load(page, body, { modules = [], htmlAttrs = '', fakeSpeech = false } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  if (fakeSpeech) await page.addInitScript(installFakeSpeech);
  const url = `/__t-theme-text-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '/src/${m}';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${htmlAttrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">${imports}</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/* Runs in the page before any script. */
function installFakeSpeech() {
  const w = /** @type {any} */ (window);
  w.__calls = [];
  w.__utts = [];
  const voices = [
    { name: 'English', lang: 'en-US', voiceURI: 'en', default: true, localService: true },
    { name: 'Français', lang: 'fr-FR', voiceURI: 'fr', default: false, localService: true },
  ];
  const synth = Object.assign(new EventTarget(), {
    speaking: false,
    paused: false,
    pending: false,
    current: null,
    getVoices: () => voices,
    speak(u) { w.__calls.push('speak'); this.current = u; this.speaking = true; w.__utts.push(u); },
    cancel() {
      w.__calls.push('cancel');
      const u = this.current;
      this.current = null;
      this.speaking = false;
      if (u?.onerror) setTimeout(() => u.onerror({ error: 'interrupted' }));
    },
    pause() { w.__calls.push('pause'); this.paused = true; },
    resume() { w.__calls.push('resume'); this.paused = false; },
  });
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  w.SpeechSynthesisUtterance = class {
    constructor(text) { this.text = text; this.lang = ''; this.voice = null; this.rate = 1; }
  };
}

/* ------------------------------------------------------------------ */
/* theme-picker                                                        */
/* ------------------------------------------------------------------ */

const TP = ['web-components/theme-picker/logic.js'];
const upgraded = (page, n = 1) => page.waitForFunction(
  (count) => document.querySelectorAll('theme-picker[data-upgraded] .panel').length >= count, n,
);

test.describe('theme-picker', () => {
  test('two pickers have separate radio groups; both show the mode', async ({ page }) => {
    await load(page, `
      <theme-picker id="a"></theme-picker>
      <theme-picker id="b" variant="inline"></theme-picker>`, { modules: TP });
    await upgraded(page, 2);
    const r = await page.evaluate(() => {
      const names = (id) => [...new Set([...document.querySelectorAll(`#${id} input[type=radio]`)].map((i) => i.name))];
      const checked = (id) => document.querySelector(`#${id} input[data-field=mode]:checked`)?.value ?? null;
      return { a: names('a'), b: names('b'), ca: checked('a'), cb: checked('b') };
    });
    expect(r.a.some((n) => r.b.includes(n))).toBe(false);
    expect(r.ca).not.toBeNull();
    expect(r.cb).toBe(r.ca);
  });

  test('arrow keys browse without dismissing; pointer pick dismisses', async ({ page }) => {
    await load(page, '<theme-picker id="p"></theme-picker>', { modules: TP });
    await upgraded(page);
    await page.locator('#p [data-trigger]').click();
    await expect(page.locator('#p')).toHaveAttribute('open', '');
    const checkedMode = page.locator('#p input[data-field=mode]:checked');
    await expect(checkedMode).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    await expect(page.locator('#p')).toHaveAttribute('open', '');
    // Pointer selection still auto-dismisses
    await page.locator('#p label.seg', { has: page.locator('input[value="light"]') }).click();
    await expect(page.locator('#p')).not.toHaveAttribute('open', '');
  });

  test('remove/reinsert during async init renders exactly one panel', async ({ page }) => {
    await load(page, '<section id="host"></section>', { modules: TP });
    await page.waitForFunction(() => customElements.get('theme-picker'));
    const r = await page.evaluate(async () => {
      const host = document.getElementById('host');
      const a = document.createElement('theme-picker');
      a.setAttribute('variant', 'inline');
      host.append(a);
      a.remove();
      host.append(a); // reconnect before the first init resolved
      const b = document.createElement('theme-picker');
      b.setAttribute('variant', 'inline');
      host.append(b);
      b.remove(); // disconnected for good before init resolved
      await new Promise((res) => setTimeout(res, 500));
      return { a: a.querySelectorAll('.panel').length, b: b.querySelectorAll('.panel').length };
    });
    expect(r).toEqual({ a: 1, b: 0 });
  });

  test('two controls only: mode and theme; nothing settings-panel owns', async ({ page }) => {
    await load(page, `
      <theme-picker id="a" variant="inline"></theme-picker>
      <theme-picker id="b" variant="inline" swatches></theme-picker>`, { modules: TP });
    await upgraded(page, 2);
    for (const id of ['a', 'b']) {
      await expect(page.locator(`#${id} fieldset`)).toHaveCount(2);
      await expect(page.locator(`#${id} input[data-field=mode]`)).toHaveCount(3);
      await expect(page.locator(`#${id} :is([data-a11y-theme], [data-extension], [data-field=accent], [data-field=fluid], select[name*=accent], select[name*=fluid], a[download])`)).toHaveCount(0);
    }
    // Default: every theme in one grouped select. swatches: the same themes as radios.
    const options = await page.locator('#a select option').evaluateAll((els) => els.map((e) => e.value));
    const swatches = await page.locator('#b input[data-field=brand]').evaluateAll((els) => els.map((e) => e.value));
    expect(options.length).toBeGreaterThan(40);
    expect(swatches).toEqual(options);
    expect(await page.locator('#a select optgroup').count()).toBeGreaterThan(3);
    await expect(page.locator('#a input[data-field=brand]')).toHaveCount(0);
    await expect(page.locator('#b select')).toHaveCount(0);
  });

  test('themes limits and orders the list; unknown ids dropped; current theme kept', async ({ page }) => {
    await load(page, `
      <theme-picker id="a" variant="inline" themes="swiss default nope organic swiss"></theme-picker>
      <theme-picker id="b" variant="inline" themes="swiss default organic" swatches></theme-picker>
      <theme-picker id="c" variant="inline" themes="nope"></theme-picker>`, { modules: TP });
    await upgraded(page, 3);
    const values = (sel) => page.locator(sel).evaluateAll((els) => els.map((e) => e.value));
    expect(await values('#a select option')).toEqual(['swiss', 'default', 'organic']);
    await expect(page.locator('#a select optgroup')).toHaveCount(0);
    expect(await values('#b input[data-field=brand]')).toEqual(['swiss', 'default', 'organic']);
    // Nothing valid listed: every theme
    expect((await values('#c select option')).length).toBeGreaterThan(40);

    // A visitor already on a theme that is not listed still sees it selected
    await page.evaluate(async () => {
      const { ThemeManager } = await import('/src/lib/theme-manager.js');
      await ThemeManager.setBrand('nord');
      const a = document.getElementById('a');
      const host = a.parentElement;
      a.remove();
      host.prepend(a);
    });
    await expect(page.locator('#a select')).toHaveValue('nord');
    expect(await values('#a select option')).toEqual(['swiss', 'default', 'organic', 'nord']);
    // ...and a theme set elsewhere while the picker is live is added too
    await page.evaluate(async () => {
      const { ThemeManager } = await import('/src/lib/theme-manager.js');
      await ThemeManager.setBrand('dracula');
    });
    await expect(page.locator('#a select')).toHaveValue('dracula');
  });

  test('a pick in one picker shows in the other; swatches name the theme', async ({ page }) => {
    await load(page, `
      <theme-picker id="a" variant="inline" swatches></theme-picker>
      <theme-picker id="b" variant="inline"></theme-picker>`, { modules: TP });
    await upgraded(page, 2);
    await expect(page.locator('#a .theme-name')).toHaveText('Default');
    await expect(page.locator('#b .theme-name')).toHaveCount(0);
    await page.locator('#b select').selectOption('swiss');
    await expect(page.locator('html')).toHaveAttribute('data-theme', /swiss/);
    await expect(page.locator('#a input[data-field=brand][value=swiss]')).toBeChecked();
    await expect(page.locator('#a .theme-name')).toHaveText('Swiss');
    // Hovering a swatch names it; leaving the list names the current theme again
    await page.locator('#a label.swatch-cell', { has: page.locator('input[value=brutalist]') }).hover();
    await expect(page.locator('#a .theme-name')).toHaveText('Brutalist');
    await page.locator('#a legend').first().hover();
    await expect(page.locator('#a .theme-name')).toHaveText('Swiss');
  });

  test('authored and stored a11y-* tokens on <html> survive init and a theme change', async ({ page }) => {
    await load(page, '<theme-picker variant="inline"></theme-picker>', {
      modules: TP, htmlAttrs: 'data-theme="a11y-large-text"',
    });
    await upgraded(page);
    await page.waitForTimeout(200);
    await expect(page.locator('html')).toHaveAttribute('data-theme', /a11y-large-text/);
    await page.locator('theme-picker select').selectOption('swiss');
    await expect(page.locator('html')).toHaveAttribute('data-theme', /swiss/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', /a11y-large-text/);
  });

  test('popover fits a small viewport: no page overflow, panel inside the window', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await load(page, '<p style="text-align:end"><theme-picker id="p"></theme-picker></p>', { modules: TP });
    await upgraded(page);
    await page.locator('#p [data-trigger]').click();
    await expect(page.locator('#p')).toHaveAttribute('open', '');
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const b = document.querySelector('#p .panel').getBoundingClientRect();
      return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, w: innerWidth, h: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(r.overflow).toBe(false);
    expect(r.left).toBeGreaterThanOrEqual(0);
    expect(r.right).toBeLessThanOrEqual(r.w);
    expect(r.bottom).toBeLessThanOrEqual(r.h);
    // Mode buttons and a select: a small panel
    expect(r.bottom - r.top).toBeLessThan(240);
  });

  test('teardown resets open state; generated trigger is type=button; labels', async ({ page }) => {
    await load(page, '<form id="f"><theme-picker id="p" data-label-mode="Farbmodus" data-label-panel="Darstellung"></theme-picker></form>', { modules: TP });
    await upgraded(page);
    const trigger = page.locator('#p [data-trigger]');
    await expect(trigger).toHaveAttribute('type', 'button');
    await expect(page.locator('#p .panel')).toHaveAttribute('aria-label', 'Darstellung');
    await expect(page.locator('#p legend').first()).toHaveText('Farbmodus');
    await trigger.click();
    await expect(page.locator('#p')).toHaveAttribute('open', '');
    await page.evaluate(() => { const p = document.getElementById('p'); const f = p.parentElement; p.remove(); f.append(p); });
    await upgraded(page);
    await expect(page.locator('#p')).not.toHaveAttribute('open', '');
    await expect(page.locator('#p [data-trigger]')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#p [data-trigger]')).toHaveCount(1);
    expect(await page.evaluate(() => document.getElementById('p').isOpen)).toBe(false);
  });

  test('every radio set is a radiogroup; tabbing out closes the popover', async ({ page }) => {
    await load(page, '<theme-picker id="p"></theme-picker><button id="after">After</button>', { modules: TP });
    await upgraded(page);
    const orphanRadios = await page.evaluate(() =>
      [...document.querySelectorAll('#p input[type=radio]')].filter((i) => !i.closest('[role=radiogroup]')).length);
    expect(orphanRadios).toBe(0);
    await page.locator('#p [data-trigger]').click();
    await expect(page.locator('#p')).toHaveAttribute('open', '');
    await page.locator('#after').focus();
    await expect(page.locator('#p')).not.toHaveAttribute('open', '');
  });
});

/* ------------------------------------------------------------------ */
/* text-reader                                                         */
/* ------------------------------------------------------------------ */

const TR = ['web-components/text-reader/logic.js'];
const ARTICLE = `
  <article id="art">
    <p>
      Hello <a href="#x">big</a> <em>wide</em> world again.
    </p>
    <p>Read <span aria-hidden="true">ICON</span>this too.</p>
  </article>`;
const readerReady = (page, sel = 'text-reader') => page.waitForSelector(`${sel}[data-upgraded]`);

test.describe('text-reader', () => {
  test('reconnect keeps one control bar and reuses slotted icons', async ({ page }) => {
    await load(page, `${ARTICLE}
      <text-reader id="r" for="art">
        <b slot="icon-play" id="ip">P</b>
      </text-reader>`, { modules: TR, fakeSpeech: true });
    await readerReady(page);
    const r = await page.evaluate(() => {
      const el = document.getElementById('r');
      for (let i = 0; i < 3; i++) { el.remove(); document.body.append(el); }
      return {
        bars: el.querySelectorAll('[part="controls"]').length,
        iconInPlay: !!el.querySelector('[part~="play"] #ip'),
        calls: [...window.__calls],
      };
    });
    expect(r.bars).toBe(1);
    expect(r.iconInPlay).toBe(true);
    // Idle reader never touched the global queue: not on upgrade, not on teardown
    expect(r.calls).toEqual([]);
  });

  test('icon variant: toolbar follows trigger in DOM, one per reconnect, Escape returns focus', async ({ page }) => {
    await load(page, `${ARTICLE}<text-reader id="r" for="art" variant="icon"></text-reader>`, { modules: TR, fakeSpeech: true });
    await readerReady(page);
    await page.evaluate(() => { const el = document.getElementById('r'); el.remove(); document.body.append(el); });
    await readerReady(page);
    const r = await page.evaluate(() => {
      const el = document.getElementById('r');
      const trig = el.querySelector('[part="trigger"]');
      return {
        triggers: el.querySelectorAll('[part="trigger"]').length,
        toolbars: document.querySelectorAll('[data-text-reader-toolbar]').length,
        afterTrigger: trig?.nextElementSibling?.hasAttribute('data-text-reader-toolbar'),
      };
    });
    expect(r).toEqual({ triggers: 1, toolbars: 1, afterTrigger: true });
    await page.locator('#r [part="trigger"]').focus();
    await page.keyboard.press('Enter'); // starts reading, shows toolbar
    const toolbar = page.locator('#r [data-text-reader-toolbar]');
    await expect(toolbar).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(toolbar.locator('[part~="pause"]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toolbar).toBeHidden();
    await expect(page.locator('#r [part="trigger"]')).toBeFocused();
  });

  test('focus follows Play → Pause → Play, and Stop hands focus to Play', async ({ page }) => {
    await load(page, `${ARTICLE}<text-reader id="r" for="art"></text-reader>`, { modules: TR, fakeSpeech: true });
    await readerReady(page);
    const play = page.locator('#r [part~="play"]');
    const pause = page.locator('#r [part~="pause"]');
    const stop = page.locator('#r [part~="stop"]');
    await play.focus();
    await page.keyboard.press('Enter');
    await expect(pause).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(play).toBeFocused();
    await stop.focus();
    await page.keyboard.press('Enter');
    await expect(play).toBeFocused();
    await expect(stop).toBeDisabled();
  });

  test('highlight lands on the spoken word in indented, inline-element HTML; aria-hidden skipped', async ({ page }) => {
    await load(page, `${ARTICLE}<text-reader id="r" for="art"></text-reader>`, { modules: TR, fakeSpeech: true });
    await readerReady(page);
    const r = await page.evaluate(() => {
      document.getElementById('r').play();
      const u = window.__utts.at(-1);
      const words = {};
      for (const w of ['big', 'wide', 'world', 'this']) {
        const charIndex = u.text.indexOf(w);
        u.onboundary({ name: 'word', charIndex, charLength: w.length });
        const range = [...CSS.highlights.get('text-reader-word')][0];
        words[w] = range?.toString();
      }
      return { text: u.text, words };
    });
    expect(r.text).not.toContain('ICON');
    expect(r.words).toEqual({ big: 'big', wide: 'wide', world: 'world', this: 'this' });
  });

  test('content lang drives utterance lang and voice order', async ({ page }) => {
    await load(page, `
      <article id="fr" lang="fr"><p>Bonjour tout le monde.</p></article>
      <text-reader id="r" for="fr"></text-reader>`, { modules: TR, fakeSpeech: true });
    await readerReady(page);
    await page.waitForFunction(() => document.querySelector('#r select option[data-voice-uri]'));
    const r = await page.evaluate(() => {
      const sel = document.querySelector('#r select');
      document.getElementById('r').play();
      const u = window.__utts.at(-1);
      return { first: sel.options[0].dataset.voiceUri, selected: sel.selectedOptions[0].dataset.voiceUri, lang: u.lang, voice: u.voice?.voiceURI };
    });
    expect(r).toEqual({ first: 'fr', selected: 'fr', lang: 'fr', voice: 'fr' });
  });

  test('data-label-* overrides generated strings', async ({ page }) => {
    await load(page, `${ARTICLE}<text-reader id="r" for="art" data-label-play="Lire" data-label-reader="Lecteur" data-label-voice="Voix" data-label-speed="Vitesse"></text-reader>`, { modules: TR, fakeSpeech: true });
    await readerReady(page);
    await expect(page.locator('#r [part~="play"]')).toHaveAttribute('aria-label', 'Lire');
    await expect(page.locator('#r [part="controls"]')).toHaveAttribute('aria-label', 'Lecteur');
    await expect(page.locator('#r select')).toHaveAttribute('aria-label', 'Voix');
    await expect(page.locator('#r input[type=range]')).toHaveAttribute('aria-label', 'Vitesse');
  });

  test('auto-scroll is instant under prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await load(page, `<text-reader id="r" for="art"></text-reader>
      <article id="art"><p>Top paragraph.</p><p id="far">Far away words.</p></article>`, { modules: TR, fakeSpeech: true });
    await readerReady(page);
    const behavior = await page.evaluate(() => {
      document.getElementById('far').style.marginBlockStart = '300vh';
      let seen = null;
      Element.prototype.scrollIntoView = function (opts) { seen = opts?.behavior; };
      document.getElementById('r').play();
      const u = window.__utts.at(-1);
      u.onboundary({ name: 'word', charIndex: u.text.indexOf('away'), charLength: 4 });
      return seen;
    });
    expect(behavior).toBe('auto');
  });
});

/* ------------------------------------------------------------------ */
/* text-divider                                                        */
/* ------------------------------------------------------------------ */

test.describe('text-divider', () => {
  test('lines are borders (survive forced colors); empty divider has no gap', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, '<text-divider id="t">or</text-divider><text-divider id="e"></text-divider>');
    const r = await page.evaluate(() => {
      const b = getComputedStyle(document.getElementById('t'), '::before');
      return {
        style: b.borderTopStyle,
        width: parseFloat(b.borderTopWidth),
        emptyGap: getComputedStyle(document.getElementById('e')).columnGap,
      };
    });
    expect(r.style).toBe('solid');
    expect(r.width).toBeGreaterThan(0);
    expect(r.emptyGap).toBe('0px');
  });
});
