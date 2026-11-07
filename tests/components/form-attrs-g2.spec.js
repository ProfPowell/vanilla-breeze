/**
 * Form attributes — data-upload, data-toggle-tags, data-strength, data-accept
 * (form-attr review f2 fixes).
 *
 * Covers: upload drop path honours accept + multiple and announces rejected
 * files, one tab stop with a visible zone focus ring, prompt/accept built as
 * text, Intl sizes + data-label-*, reset clears the list, clones re-wire;
 * toggle-tags data-max keeps options focusable (aria-disabled), leaves
 * author-disabled options alone, announces the limit, follows data-max
 * changes and resets, forced-colors checked state; strength meter
 * valuetext + described rules + polite announcer, prefilled/reset values
 * evaluated, Unicode rules, opt-in data-strength-min validity, AA level
 * colours in light and dark; accept reset, Unicode classes, clones.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { lang = 'en', mode = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__form-attrs-g2-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"${mode ? ` data-mode="${mode}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/form-field/logic.js';
        import '/src/utils/upload-init.js';
        import '/src/utils/toggle-tags-init.js';
        import '/src/utils/accept-init.js';
        import { initFormFieldEnhancements } from '/src/lib/form-field-enhancements.js';
        initFormFieldEnhancements();
        window.__ready = true;
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready);
}

/** Drop files (name/type/size) on an upload zone. */
async function drop(page, selector, files) {
  await page.evaluate(({ selector, files }) => {
    const zone = document.querySelector(selector).closest('.upload-zone');
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(new File(['x'.repeat(f.size ?? 1)], f.name, { type: f.type }));
    zone.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, { selector, files });
}

const fileNames = (page, selector) => page.evaluate(
  (s) => Array.from(document.querySelector(s).files).map(f => f.name), selector);

/* ------------------------------------------------------------------ upload */

test.describe('data-upload', () => {
  const FORM = `
    <form id="f">
      <label for="doc">Document</label>
      <input type="file" id="doc" name="doc" data-upload accept=".pdf,image/*">
      <label for="many">Photos</label>
      <input type="file" id="many" name="many" data-upload accept="image/png" multiple>
      <button type="reset">Reset</button>
    </form>`;

  test('drop honours accept and multiple, and announces what it dropped', async ({ page }) => {
    await load(page, FORM);

    await drop(page, '#many', [
      { name: 'a.png', type: 'image/png' },
      { name: 'b.png', type: 'image/png' },
      { name: 'evil.exe', type: 'application/x-msdownload' },
    ]);
    expect(await fileNames(page, '#many')).toEqual(['a.png', 'b.png']);
    const manyZone = page.locator('#many').locator('xpath=..');
    await expect(manyZone.locator('.upload-status')).toHaveText(/Not accepted: evil\.exe/);
    await expect(manyZone.locator('.upload-status')).toHaveAttribute('role', 'status');
    await expect(manyZone.locator('.upload-file-list li')).toHaveCount(2);

    // Not multiple: only the first accepted file is kept, and that is said.
    await drop(page, '#doc', [
      { name: 'one.pdf', type: 'application/pdf' },
      { name: 'two.JPG', type: 'image/jpeg' },
    ]);
    expect(await fileNames(page, '#doc')).toEqual(['one.pdf']);
    await expect(page.locator('#doc').locator('xpath=..').locator('.upload-status'))
      .toHaveText('Only one file allowed. Kept one.pdf.');

    // All rejected: the earlier selection stays.
    await drop(page, '#doc', [{ name: 'x.txt', type: 'text/plain' }]);
    expect(await fileNames(page, '#doc')).toEqual(['one.pdf']);
  });

  test('one tab stop, a visible zone focus ring, and the prompt describes the input', async ({ page }) => {
    await load(page, `<button id="before">Before</button>${FORM}`);
    const zone = page.locator('#doc').locator('xpath=..');
    await expect(zone).toHaveClass('upload-zone');
    await expect(zone.locator('button, [tabindex]')).toHaveCount(0);

    await page.focus('#before');
    await page.keyboard.press('Tab');
    await expect(page.locator('#doc')).toBeFocused();
    const outline = await zone.evaluate(el => getComputedStyle(el).outlineStyle);
    expect(outline).toBe('solid');

    const promptId = await page.locator('#doc').getAttribute('aria-describedby');
    await expect(page.locator(`#${promptId}`)).toHaveText(/Drag a file here or\s*browse\s*PDF, IMAGE\/\*/);
    await expect(page.locator('#many').locator('xpath=..').locator('.upload-prompt')).toContainText('Drag files here or');
  });

  test('accept is rendered as text, never parsed as markup', async ({ page }) => {
    await load(page, `<input type="file" id="x" data-upload accept='.png,<img src=x onerror="window.__pwned=1">'>`);
    await expect(page.locator('.upload-prompt img')).toHaveCount(0);
    expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  });

  test('sizes use Intl with the closest lang, strings take data-label-*', async ({ page }) => {
    await load(page, `<section lang="de"><input type="file" id="de" data-upload multiple
        data-label-prompt="Dateien hierher ziehen oder" data-label-browse="durchsuchen"
        data-label-files="Ausgewählte Dateien"></section>`);
    await expect(page.locator('.upload-prompt')).toContainText('Dateien hierher ziehen oder durchsuchen');
    await expect(page.locator('.upload-file-list')).toHaveAttribute('aria-label', 'Ausgewählte Dateien');
    await drop(page, '#de', [{ name: 'big.bin', type: '', size: 1500 }]);
    await expect(page.locator('.upload-file-size')).toHaveText('1,5 kB');
  });

  test('form reset clears the list and the status', async ({ page }) => {
    await load(page, FORM);
    await drop(page, '#many', [{ name: 'a.png', type: 'image/png' }, { name: 'z.gif', type: 'image/gif' }]);
    const zone = page.locator('#many').locator('xpath=..');
    await expect(zone.locator('.upload-file-list li')).toHaveCount(1);
    await page.click('button[type="reset"]');
    await expect(zone.locator('.upload-file-list')).toBeHidden();
    await expect(zone.locator('.upload-status')).toHaveText('');
  });

  test('a cloned zone is re-wired without duplicating its markup', async ({ page }) => {
    await load(page, FORM);
    await page.evaluate(() => {
      const zone = document.querySelector('#many').closest('.upload-zone');
      const copy = zone.cloneNode(true);
      copy.querySelector('input').id = 'copy';
      document.querySelector('main').append(copy);
    });
    await page.waitForFunction(() => document.querySelector('#copy'));
    await drop(page, '#copy', [{ name: 'c.png', type: 'image/png' }]);
    const zone = page.locator('#copy').locator('xpath=..');
    await expect(zone.locator('.upload-prompt')).toHaveCount(1);
    await expect(zone.locator('.upload-file-list li')).toHaveText(/c\.png/);
  });
});

/* ------------------------------------------------------------- toggle-tags */

test.describe('data-toggle-tags', () => {
  const TAGS = `
    <form id="f">
      <fieldset data-toggle-tags data-max="2" id="fs">
        <legend>Pick up to 2</legend>
        <label><input type="checkbox" name="s" value="a" id="a" checked> A</label>
        <label><input type="checkbox" name="s" value="b" id="b"> B</label>
        <label><input type="checkbox" name="s" value="c" id="c"> C</label>
        <label><input type="checkbox" name="s" value="d" id="d" disabled> D (sold out)</label>
      </fieldset>
      <button type="reset">Reset</button>
    </form>`;

  test('at the limit options stay focusable, are blocked and the limit is announced', async ({ page }) => {
    await load(page, TAGS);
    await page.click('label:has(#b)');
    await expect(page.locator('#c')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('#c')).toHaveJSProperty('disabled', false);
    await expect(page.locator('#fs .toggle-tags-status')).toHaveText(/Limit reached: 2 selected/);

    // Keyboard reaches the blocked option, Space does not check it.
    await page.focus('#b');
    await page.keyboard.press('Tab');
    await expect(page.locator('#c')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.locator('#c')).not.toBeChecked();
    // Playwright treats aria-disabled as not actionable; click anyway.
    await page.click('label:has(#c)', { force: true });
    await expect(page.locator('#c')).not.toBeChecked();

    // Below the limit: unblocked; the author-disabled option stays disabled.
    await page.click('label:has(#a)');
    await expect(page.locator('#c')).not.toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('#d')).toBeDisabled();
    await expect(page.locator('#d')).not.toHaveAttribute('data-max-blocked', '');
    await expect(page.locator('#fs .toggle-tags-status')).toHaveText('');
  });

  test('form reset and data-max changes re-sync the limit', async ({ page }) => {
    await load(page, TAGS);
    await page.click('label:has(#b)');
    await expect(page.locator('#c')).toHaveAttribute('aria-disabled', 'true');
    await page.click('button[type="reset"]');
    await expect(page.locator('#b')).not.toBeChecked();
    await expect(page.locator('#c')).not.toHaveAttribute('aria-disabled', 'true');

    await page.evaluate(() => { document.getElementById('fs').dataset.max = '1'; });
    await expect(page.locator('#b')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('#fs .toggle-tags-status')).toHaveText(/Limit reached: 1 selected/);
  });

  test('forced colours still distinguish a checked chip', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, TAGS);
    const bg = (id) => page.locator(`label:has(#${id})`).evaluate(el => getComputedStyle(el).backgroundColor);
    expect(await bg('a')).not.toBe(await bg('b'));
  });

  test('checked chip text is the auto-contrast token, not a hardcoded white', async ({ page }) => {
    await load(page, TAGS);
    const css = await page.evaluate(async () => (await fetch('/src/web-components/_shared/form-enhancements.css')).text());
    const rule = css.slice(css.indexOf('[data-toggle-tags] label:has(:checked) {'));
    expect(rule.slice(0, rule.indexOf('}'))).toContain('--color-text-on-interactive-auto');
  });
});

/* ---------------------------------------------------------------- strength */

test.describe('data-strength', () => {
  const field = (attrs = '', value = '') => `
    <form id="f">
      <form-field id="ff">
        <label for="pw">Password</label>
        <input type="password" id="pw" name="pw" data-strength
          data-rules="length:8,uppercase,lowercase,number,special" ${attrs}${value ? ` value="${value}"` : ''}>
      </form-field>
      <button type="reset">Reset</button>
    </form>`;

  test('meter value text, described rules list with met state, polite announcer', async ({ page }) => {
    await load(page, field());
    const meter = page.locator('#ff .strength-meter meter');
    await expect(meter).toHaveAttribute('aria-valuetext', 'No password entered');
    await page.fill('#pw', 'abcdefgh');
    await expect(meter).toHaveAttribute('aria-valuetext', 'Fair');
    await expect(page.locator('#ff .strength-label')).toHaveText('Fair');

    const describedBy = await page.locator('#pw').getAttribute('aria-describedby');
    const rulesId = await page.locator('#ff .strength-rules').getAttribute('id');
    expect(describedBy.split(' ')).toContain(rulesId);
    await expect(page.locator('#ff li[data-rule="length"]')).toHaveText('At least 8 characters: met');
    await expect(page.locator('#ff li[data-rule="number"]')).toHaveText('One number: not met');

    await expect(page.locator('#ff .strength-status')).toHaveAttribute('role', 'status');
    await expect(page.locator('#ff .strength-status')).toHaveText('Password strength: Fair');
  });

  test('prefilled values are evaluated at setup, and again after reset', async ({ page }) => {
    // 7 chars: upper + lower + number met, length + special not = 3/5
    await load(page, field('', 'Secret1'));
    const wrap = page.locator('#ff .strength-meter');
    await expect(wrap).toHaveAttribute('data-level', 'fair');
    await expect(wrap.locator('meter')).toHaveJSProperty('value', 3);
    await page.fill('#pw', '');
    await expect(wrap).toHaveAttribute('data-level', '');
    await page.click('button[type="reset"]');
    await expect(wrap).toHaveAttribute('data-level', 'fair');
  });

  test('rules are Unicode-aware; unknown rules are skipped with a warning', async ({ page }) => {
    const warnings = [];
    page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
    await load(page, `<form-field id="ff"><label for="pw">Password</label>
      <input type="password" id="pw" data-strength data-rules="uppercase,lowercase,number,special,emoji"></form-field>`);
    await expect(page.locator('#ff .strength-rules li')).toHaveCount(4);
    expect(warnings.some(w => w.includes('Unknown rule "emoji"'))).toBe(true);

    await page.fill('#pw', 'Пароль1');
    await expect(page.locator('#ff li[data-rule="uppercase"]')).toHaveAttribute('data-met', '');
    await expect(page.locator('#ff li[data-rule="number"]')).toHaveAttribute('data-met', '');
    await expect(page.locator('#ff li[data-rule="special"]')).not.toHaveAttribute('data-met', '');
    await page.fill('#pw', 'école');
    await expect(page.locator('#ff li[data-rule="lowercase"]')).toHaveAttribute('data-met', '');
    await expect(page.locator('#ff li[data-rule="uppercase"]')).not.toHaveAttribute('data-met', '');
  });

  test('advisory by default; data-strength-min makes weaker passwords invalid', async ({ page }) => {
    await load(page, `${field()}
      <form-field id="ff2"><label for="pw2">Password</label>
        <input type="password" id="pw2" data-strength data-strength-min="good"
          data-rules="length:8,uppercase,lowercase,number"></form-field>`);
    await page.fill('#pw', 'a');
    expect(await page.locator('#pw').evaluate(el => el.validity.valid)).toBe(true);

    const valid = () => page.locator('#pw2').evaluate(el => el.validity.customError);
    expect(await valid()).toBe(false); // empty: left to required
    await page.fill('#pw2', 'abc');
    expect(await valid()).toBe(true);
    await page.fill('#pw2', 'Abcdefgh');
    expect(await valid()).toBe(false); // 3 of 4 = good
  });

  test('doc samples run: Events reader and a field added from script', async ({ page }) => {
    await load(page, `<form id="f"><form-field><label for="password">Password</label>
      <input type="password" id="password" data-strength data-rules="length:8,uppercase,lowercase,number,special"></form-field></form>`);
    const seen = await page.evaluate(() => {
      const out = [];
      const input = document.querySelector('#password');
      const field = input.closest('form-field');
      field.addEventListener('input', () => {
        const wrap = field.querySelector('.strength-meter');
        const meter = wrap.querySelector('meter');
        out.push([wrap.dataset.level, meter.value, meter.max]);
      });
      input.value = 'Abcdefg1';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return out;
    });
    expect(seen).toEqual([['good', 4, 5]]);

    await page.evaluate(() => {
      const field = document.createElement('form-field');
      field.innerHTML = `
        <label for="new-pw">Password</label>
        <input type="password" id="new-pw" name="password" autocomplete="new-password"
          data-strength data-rules="length:8,uppercase,number">`;
      document.querySelector('form').append(field);
    });
    const added = page.locator('form-field:has(#new-pw)');
    await expect(added.locator('.strength-meter meter')).toHaveCount(1);
    await expect(added.locator('.password-toggle')).toHaveCount(1);
  });

  for (const mode of ['light', 'dark']) {
    test(`level text meets 4.5:1 against the surface (${mode})`, async ({ page }) => {
      await load(page, field(), { mode });
      const toRgb = `
        const c = document.createElement('canvas'); c.width = c.height = 1;
        const x = c.getContext('2d', { willReadFrequently: true });
        const rgb = (color) => { x.clearRect(0, 0, 1, 1); x.fillStyle = color; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3); };
        const lum = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
        const ratio = (a, b) => { const [h, l] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p); return (h + 0.05) / (l + 0.05); };`;
      for (const [value, level] of [['a', 'weak'], ['abcdefgh', 'fair'], ['Abcdefg1', 'good'], ['Abcdefg1!', 'strong']]) {
        await page.fill('#pw', value);
        await expect(page.locator('#ff .strength-meter')).toHaveAttribute('data-level', level);
        const result = await page.evaluate(new Function(`${toRgb}
          const label = document.querySelector('#ff .strength-label');
          const token = (name) => { const p = document.createElement('i'); p.style.color = 'var(' + name + ')'; label.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
          const color = getComputedStyle(label).color;
          return Math.min(ratio(color, token('--color-surface')), ratio(color, token('--color-background')));`));
        expect(result, `${level} in ${mode}`).toBeGreaterThanOrEqual(4.5);
      }
      // Meter fills (non-text UI) need 3:1 against the surface.
      const fills = await page.evaluate(new Function(`${toRgb}
        const meter = document.querySelector('#ff .strength-meter meter');
        const token = (name) => { const p = document.createElement('i'); p.style.color = 'var(' + name + ')'; meter.parentElement.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
        return ['--meter-fill-even-less-good', '--meter-fill-suboptimum', '--meter-fill-optimum']
          .map(n => [n, Math.min(ratio(token(n), token('--color-surface')), ratio(token(n), token('--color-background')))]);`));
      for (const [name, r] of fills) expect(r, `${name} in ${mode}`).toBeGreaterThanOrEqual(3);
    });
  }
});

/* ------------------------------------------------------------------ accept */

test.describe('data-accept', () => {
  test('form reset re-filters the restored default value', async ({ page }) => {
    await load(page, `<form id="f"><label for="d">Digits</label>
      <input id="d" data-accept="digits" value="12ab34"><button type="reset">Reset</button></form>`);
    await expect(page.locator('#d')).toHaveValue('1234');
    await page.fill('#d', '99');
    await page.click('button[type="reset"]');
    await expect(page.locator('#d')).toHaveValue('1234');
  });

  test('letters preset and custom classes are Unicode-aware', async ({ page }) => {
    await load(page, `<label for="l">Name</label><input id="l" data-accept="letters">
      <label for="e">Mood</label><input id="e" data-accept="[😀a]">`);
    await page.locator('#l').pressSequentially('Zoë-Ж 1');
    await expect(page.locator('#l')).toHaveValue('ZoëЖ');
    await page.locator('#e').evaluate((el) => {
      el.value = 'a😀b';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('#e')).toHaveValue('a😀');
  });

  test('a cloned input is wired too', async ({ page }) => {
    await load(page, `<label for="d">Digits</label><input id="d" data-accept="digits">`);
    await page.evaluate(() => {
      const copy = document.getElementById('d').cloneNode(true);
      copy.id = 'copy';
      document.querySelector('main').append(copy);
    });
    await page.locator('#copy').pressSequentially('a1b2');
    await expect(page.locator('#copy')).toHaveValue('12');
  });
});
