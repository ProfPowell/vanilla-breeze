/**
 * Utility review fixes (V2): shared announcer, data-copy, data-select-all,
 * data-hotkey actions (+ <short-cuts> / settings-panel character-key
 * preference), data-spoiler, data-effect="animate-image", data-sortable
 * list controls, data-paged labels.
 *
 * Tests the working tree: /src and the demo GIFs are served from disk.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const GIF = '/docs/examples/demos/assets/robot-arm.gif';

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ modules?: string[], lang?: string, head?: string }} [opts]
 */
async function load(page, body, { modules = [], lang = 'en', head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/docs/examples/demos/assets/**', (route) => route.fulfill({
    path: join(REPO, 'demos/examples/demos/assets', new URL(route.request().url()).pathname.split('/').pop()),
  }));
  const url = `/__util-v2-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '${m}';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      <script type="module">${imports}\nwindow.__ready = true;</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => /** @type {any} */ (window).__ready === true);
}

/** Text of the shared live region (polite unless stated) once written. */
async function announced(page, politeness = 'polite') {
  const region = page.locator(`body > [data-vb-announcer="${politeness}"]`);
  await expect(region).not.toBeEmpty();
  return region.textContent();
}

/* ───────────────────────── announce ───────────────────────── */

test.describe('announce()', () => {
  test('one body-level region, repeated message re-announced', async ({ page }) => {
    await load(page, '<p>x</p>', { modules: ['/src/lib/announce.js'] });
    const result = await page.evaluate(async () => {
      const { announce } = await import('/src/lib/announce.js');
      const a = announce('Hello');
      await new Promise((r) => setTimeout(r, 80));
      const first = a?.textContent;
      const b = announce('Hello');
      const cleared = b?.textContent;
      await new Promise((r) => setTimeout(r, 80));
      return {
        same: a === b, first, cleared, second: b?.textContent,
        parent: a?.parentElement?.tagName, count: document.querySelectorAll('[data-vb-announcer]').length,
        role: a?.getAttribute('role'),
      };
    });
    expect(result).toEqual({ same: true, first: 'Hello', cleared: '', second: 'Hello', parent: 'BODY', count: 1, role: 'status' });
  });
});

/* ───────────────────────── data-copy ───────────────────────── */

test.describe('data-copy', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('announcer lives outside the button; namespaced event; name unchanged', async ({ page }) => {
    await load(page, `<button id="b" data-copy="npm i vanilla-breeze">Copy install command</button>`,
      { modules: ['/src/utils/copy-init.js'] });
    await page.evaluate(() => {
      /** @type {any} */ (window).events = [];
      document.addEventListener('copy:done', (e) => /** @type {any} */ (window).events.push(['copy:done', /** @type {CustomEvent} */ (e).detail.text]));
      // A page-level native copy handler must not receive our event.
      document.addEventListener('copy', () => /** @type {any} */ (window).events.push(['native']));
    });
    await page.click('#b');
    await expect(page.locator('#b')).toHaveAttribute('data-state', 'copied');
    expect(await announced(page)).toBe('Copied to clipboard');
    expect(await page.locator('#b [role=status], #b [data-vb-announcer]').count()).toBe(0);
    await expect(page.locator('#b')).toHaveAccessibleName('Copy install command');
    expect(await page.evaluate(() => /** @type {any} */ (window).events)).toEqual([['copy:done', 'npm i vanilla-breeze']]);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('npm i vanilla-breeze');
  });

  test('cloned buttons work (no per-button processed flag)', async ({ page }) => {
    await load(page, `<button id="b" data-copy="cloned text">Copy</button>`, { modules: ['/src/utils/copy-init.js'] });
    await page.evaluate(() => {
      const clone = /** @type {HTMLElement} */ (document.getElementById('b').cloneNode(true));
      clone.id = 'c';
      clone.dataset.copy = 'from clone';
      document.querySelector('main').append(clone);
    });
    await page.click('#c');
    await expect(page.locator('#c')).toHaveAttribute('data-state', 'copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('from clone');
  });

  test('failure: data-state=failed, copy:error, failure announced, source selected', async ({ page }) => {
    await load(page, `<pre id="src">secret</pre><button id="b" data-copy-target="#src" data-label-copy-failed="Kopieren fehlgeschlagen">Copy</button>`,
      { modules: ['/src/utils/copy-init.js'] });
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } });
      document.execCommand = () => false;
      document.addEventListener('copy:error', () => { /** @type {any} */ (window).failed = true; });
    });
    await page.click('#b');
    await expect(page.locator('#b')).toHaveAttribute('data-state', 'failed');
    expect(await announced(page, 'assertive')).toBe('Kopieren fehlgeschlagen');
    expect(await page.evaluate(() => /** @type {any} */ (window).failed)).toBe(true);
    expect(await page.evaluate(() => String(window.getSelection()))).toBe('secret');
  });

  test('paste fires paste:done (not native paste) and localised announcement', async ({ page }) => {
    await load(page, `<section data-label-pasted="Eingefügt"><input id="dest"><button id="p" data-paste-target="#dest">Paste</button></section>`,
      { modules: ['/src/utils/copy-init.js'] });
    await page.evaluate(() => navigator.clipboard.writeText('from clipboard'));
    await page.evaluate(() => document.addEventListener('paste:done', () => { /** @type {any} */ (window).pasted = true; }));
    await page.click('#p');
    await expect(page.locator('#dest')).toHaveValue('from clipboard');
    expect(await announced(page)).toBe('Eingefügt');
    expect(await page.evaluate(() => /** @type {any} */ (window).pasted)).toBe(true);
  });
});

/* ───────────────────────── data-select-all ───────────────────────── */

const SELECT_ALL = `
  <form id="f">
    <fieldset data-select-all-scope>
      <legend>Files</legend>
      <label><input type="checkbox" id="all" data-select-all=".item"> All</label>
      <label><input type="checkbox" class="item" value="1"> One</label>
      <label><input type="checkbox" class="item" value="2"> Two</label>
      <label><input type="checkbox" class="item" value="3" disabled> Three (locked)</label>
      <output id="count" data-selected-count>0</output>
    </fieldset>
    <button type="reset" id="reset">Reset</button>
  </form>`;

test.describe('data-select-all', () => {
  test('skips disabled targets; master reaches "all" with a disabled item unchecked', async ({ page }) => {
    await load(page, SELECT_ALL, { modules: ['/src/utils/select-all-init.js'] });
    await page.check('#all');
    await expect(page.locator('.item[value="3"]')).not.toBeChecked();
    await expect(page.locator('.item[value="1"]')).toBeChecked();
    await expect(page.locator('#count')).toHaveText('2');
    expect(await page.$eval('#all', (el) => /** @type {HTMLInputElement} */ (el).indeterminate)).toBe(false);
    await expect(page.locator('#all')).toBeChecked();
  });

  test('re-syncs after form reset and when rows are added', async ({ page }) => {
    await load(page, SELECT_ALL, { modules: ['/src/utils/select-all-init.js'] });
    await page.check('#all');
    await page.click('#reset');
    await expect(page.locator('#all')).not.toBeChecked();
    await expect(page.locator('#count')).toHaveText('0');

    await page.check('.item[value="1"]');
    await page.check('.item[value="2"]');
    await expect(page.locator('#all')).toBeChecked();
    await page.evaluate(() => {
      const label = document.createElement('label');
      label.innerHTML = '<input type="checkbox" class="item" value="4"> Four';
      document.querySelector('fieldset').append(label);
    });
    await expect.poll(() => page.$eval('#all', (el) => /** @type {HTMLInputElement} */ (el).indeterminate)).toBe(true);
  });

  test('a cloned master works on its own', async ({ page }) => {
    await load(page, SELECT_ALL, { modules: ['/src/utils/select-all-init.js'] });
    await page.evaluate(() => {
      const fs = /** @type {HTMLElement} */ (document.querySelector('fieldset').cloneNode(true));
      fs.id = 'copy';
      document.querySelector('main').append(fs);
    });
    await page.check('#copy #all');
    await expect(page.locator('#copy .item[value="1"]')).toBeChecked();
    await expect(page.locator('#f .item[value="1"]')).not.toBeChecked();
  });

  test('nearest scope wins (table inside a [data-select-all-scope])', async ({ page }) => {
    await load(page, `<section data-select-all-scope>
      <table><tbody><tr><td><input type="checkbox" id="m" data-select-all=".r" aria-label="All rows"></td></tr>
      <tr><td><input type="checkbox" class="r" aria-label="Row"></td></tr></tbody></table>
      <input type="checkbox" class="r" id="outside" aria-label="Outside">
    </section>`, { modules: ['/src/utils/select-all-init.js'] });
    await page.check('#m');
    await expect(page.locator('#outside')).not.toBeChecked();
  });
});

/* ───────────────────────── data-hotkey actions ───────────────────────── */

const HOTKEYS = `
  <button id="help" data-hotkey="?" data-hotkey-label="Help">Help</button>
  <button id="play" data-hotkey="space">Play</button>
  <button id="close" data-hotkey="esc">Close</button>
  <button id="save" data-hotkey="meta+s">Save <kbd data-hotkey>meta+s</kbd></button>
  <input id="search" data-hotkey="/" data-hotkey-action="focus" aria-label="Search">
  <section id="editor" tabindex="-1"><button id="bold" data-hotkey="b" data-hotkey-scope="#editor">Bold</button></section>
  <p id="out">Output</p>`;

const HOTKEY_MODULES = ['/src/utils/hotkey-action-init.js', '/src/utils/hotkey-init.js'];

async function trackClicks(page) {
  await page.evaluate(() => {
    /** @type {any} */ (window).clicks = [];
    document.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => /** @type {any} */ (window).clicks.push(b.id)));
  });
}

test.describe('data-hotkey actions', () => {
  test('aliases (?, space, esc) and shifted punctuation fire', async ({ page }) => {
    await load(page, HOTKEYS, { modules: HOTKEY_MODULES });
    await trackClicks(page);
    await page.locator('#out').click();
    await page.keyboard.press('Shift+Slash'); // "?"
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => /** @type {any} */ (window).clicks)).toEqual(['help', 'play', 'close']);
  });

  test('aria-keyshortcuts set; dialog label excludes the kbd hint', async ({ page }) => {
    await load(page, HOTKEYS, { modules: HOTKEY_MODULES });
    await expect(page.locator('#help')).toHaveAttribute('aria-keyshortcuts', '?');
    await expect(page.locator('#play')).toHaveAttribute('aria-keyshortcuts', 'Space');
    await expect(page.locator('#close')).toHaveAttribute('aria-keyshortcuts', 'Escape');
    const label = await page.evaluate(() => {
      const map = /** @type {any} */ (window).__hotkeyActionRegistry.getHotkeyActions();
      return [...map.get('Page Actions')].find((e) => e.element.id === 'save').label;
    });
    expect(label).toBe('Save');
  });

  test('removed, hidden and inert targets do not fire; removal unbinds', async ({ page }) => {
    await load(page, HOTKEYS, { modules: HOTKEY_MODULES });
    await trackClicks(page);
    await page.evaluate(() => {
      document.getElementById('help').remove();
      document.getElementById('play').hidden = true;
      document.getElementById('close').inert = true;
    });
    await page.locator('#out').click();
    await page.keyboard.press('Shift+Slash');
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => /** @type {any} */ (window).clicks)).toEqual([]);
    await expect.poll(() => page.evaluate(() => {
      const map = /** @type {any} */ (window).__hotkeyActionRegistry.getHotkeyActions();
      return [...map.values()].flat().map((e) => e.element.id).sort().join(',');
    })).toBe('bold,save,search');
  });

  test('changing data-hotkey rebinds', async ({ page }) => {
    await load(page, HOTKEYS, { modules: HOTKEY_MODULES });
    await trackClicks(page);
    await page.evaluate(() => document.getElementById('help').setAttribute('data-hotkey', 'h'));
    await expect(page.locator('#help')).toHaveAttribute('aria-keyshortcuts', 'H');
    await page.locator('#out').click();
    await page.keyboard.press('Shift+Slash');
    await page.keyboard.press('h');
    expect(await page.evaluate(() => /** @type {any} */ (window).clicks)).toEqual(['help']);
  });

  test('scoped shortcut fires only with focus inside its scope', async ({ page }) => {
    await load(page, HOTKEYS, { modules: HOTKEY_MODULES });
    await trackClicks(page);
    await page.locator('#out').click();
    await page.keyboard.press('b');
    await page.focus('#editor');
    await page.keyboard.press('b');
    expect(await page.evaluate(() => /** @type {any} */ (window).clicks)).toEqual(['bold']);
  });

  test('character-key preference off: unscoped single keys stop, modified + scoped keep working', async ({ page }) => {
    await load(page, HOTKEYS, { modules: HOTKEY_MODULES });
    await trackClicks(page);
    await page.evaluate(async () => {
      const { setCharShortcutsEnabled } = await import('/src/lib/char-shortcuts.js');
      setCharShortcutsEnabled(false);
    });
    await page.locator('#out').click();
    await page.keyboard.press('Shift+Slash');
    await page.keyboard.press('Slash');
    await expect(page.locator('#search')).not.toBeFocused();
    await page.keyboard.press('Escape'); // named key, not a character key
    await page.focus('#editor');
    await page.keyboard.press('b');
    expect(await page.evaluate(() => /** @type {any} */ (window).clicks)).toEqual(['close', 'bold']);
  });

  test('stored preference restored on load', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('vb:settings:extensions', JSON.stringify({ data: { motionFx: true, sounds: false, charShortcuts: false }, timestamp: Date.now() }));
    });
    await load(page, HOTKEYS, { modules: HOTKEY_MODULES });
    await expect(page.locator('html')).toHaveAttribute('data-char-shortcuts', 'off');
    await trackClicks(page);
    await page.locator('#out').click();
    await page.keyboard.press('Shift+Slash');
    expect(await page.evaluate(() => /** @type {any} */ (window).clicks)).toEqual([]);
  });
});

test.describe('short-cuts + settings-panel character-key preference', () => {
  test('dialog omits switched-off character shortcuts; ? no longer opens it', async ({ page }) => {
    await load(page, `${HOTKEYS}<short-cuts id="sc"></short-cuts>`,
      { modules: [...HOTKEY_MODULES, '/src/web-components/short-cuts/logic.js'] });
    await page.waitForSelector('short-cuts[data-upgraded]', { state: 'attached' });
    await page.evaluate(async () => {
      const { setCharShortcutsEnabled } = await import('/src/lib/char-shortcuts.js');
      setCharShortcutsEnabled(false);
    });
    await page.locator('#out').click();
    await page.keyboard.press('Shift+Slash');
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('sc')).open)).toBe(false);
    await page.evaluate(() => /** @type {any} */ (document.getElementById('sc')).show());
    const dialog = page.locator('short-cuts dialog');
    await expect(dialog).toContainText('Save');
    await expect(dialog).toContainText('Bold'); // scoped: still active
    await expect(dialog).not.toContainText('Help');
    await expect(dialog).not.toContainText('Show keyboard shortcuts');
  });

  test('settings-panel toggle sets the root attribute and persists', async ({ page }) => {
    await load(page, `<settings-panel id="sp"></settings-panel>`,
      { modules: ['/src/web-components/settings-panel/logic.js'] });
    await page.waitForSelector('settings-panel[data-upgraded]', { state: 'attached' });
    await page.evaluate(() => /** @type {any} */ (document.getElementById('sp')).open());
    await page.locator('settings-panel summary', { hasText: 'Accessibility' }).click();
    const toggle = page.getByRole('checkbox', { name: 'Single-Key Shortcuts' });
    await expect(toggle).toBeChecked();
    await toggle.uncheck();
    await expect(page.locator('html')).toHaveAttribute('data-char-shortcuts', 'off');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('vb:settings:extensions') || '{}').data?.charShortcuts);
    expect(stored).toBe(false);
    await toggle.check();
    await expect(page.locator('html')).not.toHaveAttribute('data-char-shortcuts', 'off');
  });

  const AUTHORED_OFF = `<script>document.documentElement.setAttribute('data-char-shortcuts', 'off');</script>`;

  test('reset returns to the authored state; theme-picker keeps the preference', async ({ page }) => {
    await load(page, `<theme-picker></theme-picker><settings-panel id="sp"></settings-panel>`, {
      head: AUTHORED_OFF,
      modules: ['/src/web-components/theme-picker/logic.js', '/src/web-components/settings-panel/logic.js'],
    });
    await page.waitForSelector('settings-panel[data-upgraded]', { state: 'attached' });
    await page.waitForSelector('theme-picker[data-upgraded]', { state: 'attached' });
    // theme-picker's own extensions broadcast must not flip the authored "off"
    await expect(page.locator('html')).toHaveAttribute('data-char-shortcuts', 'off');
    await page.evaluate(() => /** @type {any} */ (document.getElementById('sp')).open());
    await page.locator('settings-panel summary', { hasText: 'Accessibility' }).click();
    const toggle = page.getByRole('checkbox', { name: 'Single-Key Shortcuts' });
    await expect(toggle).not.toBeChecked();
    await toggle.check();
    await expect(page.locator('html')).not.toHaveAttribute('data-char-shortcuts', 'off');
    // A theme-picker extension change carries charShortcuts along
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('vb:settings:extensions') || '{}').data?.charShortcuts);
    await expect.poll(stored).toBe(true);
    await page.locator('settings-panel .settings-reset').click();
    await page.locator('settings-panel [data-action="reset-confirm"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-char-shortcuts', 'off');
    await expect(toggle).not.toBeChecked();
  });
});

/* ───────────────────────── data-spoiler ───────────────────────── */

test.describe('data-spoiler', () => {
  test('keyboard reveal moves focus to the content; Escape returns it to the trigger', async ({ page }) => {
    await load(page, `<section id="s" data-spoiler><p>Vader is the father.</p></section>`,
      { modules: ['/src/utils/spoiler-init.js'] });
    const trigger = page.locator('#s > [data-spoiler-trigger]');
    await expect(trigger).toHaveRole('button');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#s > [data-spoiler-content]')).toBeFocused();
    expect(await announced(page)).toBe('Spoiler revealed');
    await expect(page.locator('#s > [data-spoiler-hide]')).toHaveText('Hide spoiler');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('host semantics are kept; inline host gets a span wrapper and a real <button>', async ({ page }) => {
    await load(page, `<ul><li id="li" data-spoiler>Answer</li></ul>
      <p id="p" data-spoiler>Paragraph</p>
      <p>Ends when <span id="inl" data-spoiler>the hero dies</span>.</p>`,
      { modules: ['/src/utils/spoiler-init.js'] });
    await expect(page.locator('#li')).not.toHaveAttribute('role', /.*/);
    await expect(page.locator('#li > [data-spoiler-content]')).toHaveJSProperty('tagName', 'DIV');
    await expect(page.locator('#p > [data-spoiler-content]')).toHaveJSProperty('tagName', 'SPAN');
    await expect(page.locator('#inl')).toHaveAttribute('role', 'group');
    await expect(page.locator('#inl > [data-spoiler-trigger]')).toHaveJSProperty('tagName', 'BUTTON');
  });

  test('clones work; group names with quotes do not throw', async ({ page }) => {
    await load(page, `<section id="a" data-spoiler data-spoiler-group='q"1'>A</section>
      <section id="b" data-spoiler data-spoiler-group='q"1'>B</section>`,
      { modules: ['/src/utils/spoiler-init.js'] });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.click('#a > [data-spoiler-trigger]');
    await page.click('#b > [data-spoiler-trigger]');
    await expect(page.locator('#a')).not.toHaveAttribute('data-spoiler-visible');
    await page.evaluate(() => {
      const clone = /** @type {HTMLElement} */ (document.getElementById('b').cloneNode(true));
      clone.id = 'c';
      clone.removeAttribute('data-spoiler-group');
      document.querySelector('main').append(clone);
    });
    await page.click('#c > [data-spoiler-hide]');
    await expect(page.locator('#c')).not.toHaveAttribute('data-spoiler-visible');
    await page.click('#c > [data-spoiler-trigger]');
    await expect(page.locator('#c')).toHaveAttribute('data-spoiler-visible', '');
    expect(errors).toEqual([]);
  });

  test('localised labels from an ancestor', async ({ page }) => {
    await load(page, `<article data-label-spoiler-reveal="Afficher" data-label-spoiler-hide="Masquer"><section id="s" data-spoiler>x</section></article>`,
      { modules: ['/src/utils/spoiler-init.js'], lang: 'fr' });
    await expect(page.locator('#s [data-spoiler-trigger]')).toHaveText('Afficher');
    await page.click('#s [data-spoiler-trigger]');
    await expect(page.locator('#s [data-spoiler-hide]')).toHaveText('Masquer');
  });

  test('data-spoiler-print="hidden" stays concealed in print', async ({ page }) => {
    await load(page, `<section id="s" data-spoiler data-spoiler-print="hidden">Answer</section>`,
      { modules: ['/src/utils/spoiler-init.js'] });
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#s > [data-spoiler-content]')).toHaveCSS('visibility', 'hidden');
  });
});

/* ───────────────────────── animate-image ───────────────────────── */

const ANIMATE = ['/src/lib/vb.js', '/src/effects/animate-image.js'];

test.describe('data-effect="animate-image"', () => {
  test('stable name + aria-pressed; span wrapper; pause swaps to a still', async ({ page }) => {
    await load(page, `<p><img id="i" src="${GIF}" alt="Robot arm" data-effect="animate-image" width="200" height="150"></p>`,
      { modules: ANIMATE });
    const btn = page.locator('.animate-image-toggle');
    await expect(btn).toHaveAccessibleName('Pause animation: Robot arm');
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.animate-image-wrapper')).toHaveJSProperty('tagName', 'SPAN');
    await page.waitForFunction(() => /** @type {HTMLImageElement} */ (document.getElementById('i')).naturalWidth > 0);
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#i')).toHaveAttribute('src', /^data:image\/png/);
    await btn.click();
    await expect(page.locator('#i')).toHaveAttribute('src', GIF);
  });

  test('cross-origin image without a frame: pause hides it and shows the alt text', async ({ page }) => {
    await page.route('http://other-origin.test/**', (route) => route.fulfill({ path: join(REPO, 'demos/examples/demos/assets/robot-arm.gif') }));
    await load(page, `<img id="i" src="http://other-origin.test/a.gif" alt="Spinning logo" data-effect="animate-image">`,
      { modules: ANIMATE });
    await page.waitForFunction(() => /** @type {HTMLImageElement} */ (document.getElementById('i')).naturalWidth > 0);
    await page.click('.animate-image-toggle');
    await expect(page.locator('#i')).toHaveCSS('visibility', 'hidden');
    await expect(page.locator('.animate-image-placeholder')).toBeVisible();
    await expect(page.locator('.animate-image-placeholder')).toHaveText('Spinning logo');
    await page.click('.animate-image-toggle');
    await expect(page.locator('.animate-image-placeholder')).toBeHidden();
  });

  test('data-poster is the still; <picture> wrapped as a whole, sources restored', async ({ page }) => {
    await load(page, `<picture id="pic"><source srcset="${GIF}" type="image/gif"><img id="i" src="${GIF}" srcset="${GIF} 1x" alt="Arm" data-poster="/docs/examples/demos/assets/bounce.gif" data-effect="animate-image"></picture>`,
      { modules: ANIMATE });
    await expect(page.locator('.animate-image-wrapper > picture > img#i')).toHaveCount(1);
    await page.waitForFunction(() => /** @type {HTMLImageElement} */ (document.getElementById('i')).naturalWidth > 0);
    await page.click('.animate-image-toggle');
    await expect(page.locator('#i')).toHaveAttribute('src', '/docs/examples/demos/assets/bounce.gif');
    await expect(page.locator('#i')).not.toHaveAttribute('srcset', /.+/);
    await expect(page.locator('#pic > source')).not.toHaveAttribute('srcset', /.+/);
    await page.click('.animate-image-toggle');
    await expect(page.locator('#pic > source')).toHaveAttribute('srcset', GIF);
    await expect(page.locator('#i')).toHaveAttribute('srcset', `${GIF} 1x`);
  });

  test('runtime data-motion-reduced pauses, removing it resumes', async ({ page }) => {
    await load(page, `<img id="i" src="${GIF}" alt="Arm" data-effect="animate-image">`, { modules: ANIMATE });
    await page.waitForFunction(() => /** @type {HTMLImageElement} */ (document.getElementById('i')).naturalWidth > 0);
    await page.evaluate(() => document.documentElement.setAttribute('data-motion-reduced', ''));
    await expect(page.locator('.animate-image-toggle')).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => document.documentElement.removeAttribute('data-motion-reduced'));
    await expect(page.locator('.animate-image-toggle')).toHaveAttribute('aria-pressed', 'false');
  });

  test('prefers-reduced-motion starts paused', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await load(page, `<img id="i" src="${GIF}" alt="Arm" data-effect="animate-image">`, { modules: ANIMATE });
    await expect(page.locator('.animate-image-toggle')).toHaveAttribute('aria-pressed', 'true');
  });
});

/* ───────────────────────── data-sortable list mode ───────────────────────── */

test.describe('data-sortable list controls', () => {
  test('a select rendered before its target works once the target arrives', async ({ page }) => {
    await load(page, `<select id="sel" data-sort-target="#feed" aria-label="Sort">
        <option value="">Default</option><option value="name">Name</option><option value="-n">Biggest</option>
      </select><section id="slot"></section>`, { modules: ['/src/utils/data-sortable-init.js'] });
    await page.evaluate(() => {
      document.getElementById('slot').innerHTML = `<ul id="feed" data-sortable data-sort-type="number">
        <li data-sort-name="b" data-sort-n="1,234">B</li><li data-sort-name="a" data-sort-n="$5">A</li><li data-sort-name="c" data-sort-n="12 %">C</li></ul>`;
    });
    await page.selectOption('#sel', '-n');
    await expect(page.locator('#feed > li')).toHaveText(['B', 'C', 'A']);
    expect(await announced(page)).toBe('Sorted: Biggest. 3 items');
  });

  test('button controls reflect the active sort with aria-pressed', async ({ page }) => {
    await load(page, `<button id="az" data-sort-target="#l" data-sort-by="name">A–Z</button>
      <button id="za" data-sort-target="#l" data-sort-by="-name">Z–A</button>
      <ul id="l" data-sortable><li data-sort-name="b">b</li><li data-sort-name="a">a</li></ul>`,
      { modules: ['/src/utils/data-sortable-init.js'] });
    await page.click('#za');
    await expect(page.locator('#za')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#az')).toHaveAttribute('aria-pressed', 'false');
  });
});

/* ───────────────────────── data-paged labels ───────────────────────── */

test.describe('data-paged labels', () => {
  test('data-label-* from an ancestor reach the injected nav; numbered page change announced', async ({ page }) => {
    const items = Array.from({ length: 6 }, (_, i) => `<li>Item ${i + 1}</li>`).join('');
    await load(page, `<section data-label-nav="Seiten" data-label-prev="Zurück" data-label-next="Weiter" data-label-page="Seite {page}" data-label-status="Seite {page} von {total}">
      <ul id="l" data-paged data-paged-size="2">${items}</ul></section>`,
      { modules: ['/src/utils/data-paged-init.js'], lang: 'de' });
    const nav = page.locator('nav[data-paged-nav]');
    await expect(nav).toHaveAttribute('aria-label', 'Seiten');
    await expect(nav.locator('[data-paged-action="prev"]')).toHaveText('Zurück');
    await expect(nav.locator('[data-paged-target="2"][data-paged-action="page"]')).toHaveAccessibleName('Seite 2');
    await nav.locator('[data-paged-target="2"][data-paged-action="page"]').click();
    expect(await announced(page)).toBe('Seite 2 von 3');
  });

  test('load-more announces how many are shown', async ({ page }) => {
    const items = Array.from({ length: 5 }, (_, i) => `<li>Item ${i + 1}</li>`).join('');
    await load(page, `<ul id="l" data-paged data-paged-size="2" data-paged-style="load-more">${items}</ul>`,
      { modules: ['/src/utils/data-paged-init.js'] });
    await page.click('[data-paged-loadmore]');
    expect(await announced(page)).toBe('Showing 4 of 5');
  });
});
