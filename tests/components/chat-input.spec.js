/**
 * chat-input — review fixes (vanilla-breeze-1fvo, 5ac4, i89g).
 *
 * IME-safe Enter, real form participation (button + Enter submit the form,
 * FormData carries the message), a visible focus ring, parse-time and
 * fieldset disabled, maxlength blocking the send, a fallback accessible
 * name, and a single binding after reconnect.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__chat-input-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/chat-input/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('chat-input'));
  await page.waitForSelector('chat-input[data-upgraded]', { state: 'attached' });
}

const INPUT = (attrs = '', taAttrs = 'aria-label="Message"') => `
  <chat-input name="message" ${attrs}>
    <textarea data-grow rows="1" ${taAttrs}></textarea>
    <footer><button type="submit" data-send aria-label="Send">Send</button></footer>
  </chat-input>`;

/** Count chat-input:send events on window.__sent. */
async function trackSends(page) {
  await page.evaluate(() => {
    window.__sent = [];
    document.addEventListener('chat-input:send', (e) => window.__sent.push(e.detail));
  });
}

test('Enter during IME composition does not send', async ({ page }) => {
  await load(page, INPUT());
  await trackSends(page);
  const r = await page.evaluate(() => {
    const ta = document.querySelector('chat-input textarea');
    ta.value = 'にほ';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    const composing = new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true });
    ta.dispatchEvent(composing);
    const legacy = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true, cancelable: true });
    ta.dispatchEvent(legacy);
    return { sent: window.__sent.length, value: ta.value, prevented: composing.defaultPrevented || legacy.defaultPrevented };
  });
  expect(r).toEqual({ sent: 0, value: 'にほ', prevented: false });
});

test('Shift+Enter inserts a newline and does not send', async ({ page }) => {
  await load(page, INPUT());
  await trackSends(page);
  const ta = page.locator('chat-input textarea');
  await ta.click();
  await ta.pressSequentially('line one');
  await ta.press('Shift+Enter');
  await ta.pressSequentially('line two');
  await expect(ta).toHaveValue('line one\nline two');
  expect(await page.evaluate(() => window.__sent.length)).toBe(0);
});

test('standalone Enter sends { message } once and clears', async ({ page }) => {
  await load(page, INPUT());
  await trackSends(page);
  const ta = page.locator('chat-input textarea');
  await ta.fill('  hello  ');
  await ta.press('Enter');
  expect(await page.evaluate(() => window.__sent)).toEqual([{ message: 'hello' }]);
  await expect(ta).toHaveValue('');
});

const FORM = `<form id="f" method="dialog">${INPUT()}</form>`;

async function trackSubmits(page, { prevent }) {
  await page.evaluate((prevent) => {
    window.__submits = [];
    document.getElementById('f').addEventListener('submit', (e) => {
      if (prevent) e.preventDefault();
      window.__submits.push(new FormData(e.target).get('message'));
    });
  }, prevent);
}

test('send button inside a form submits it with the message in FormData', async ({ page }) => {
  await load(page, FORM);
  await trackSends(page);
  await trackSubmits(page, { prevent: true });
  await page.locator('chat-input textarea').fill('from the button');
  await page.locator('[data-send]').click();
  expect(await page.evaluate(() => window.__submits)).toEqual(['from the button']);
  expect(await page.evaluate(() => window.__sent.length)).toBe(0);
  // preventDefault() = the page owns the outcome; the text stays.
  await page.waitForTimeout(50);
  await expect(page.locator('chat-input textarea')).toHaveValue('from the button');
});

test('Enter inside a form submits it with the message in FormData', async ({ page }) => {
  await load(page, FORM);
  await trackSubmits(page, { prevent: true });
  const ta = page.locator('chat-input textarea');
  await ta.fill('from enter');
  await ta.press('Enter');
  expect(await page.evaluate(() => window.__submits)).toEqual(['from enter']);
});

test('an unprevented form submit clears the input afterwards', async ({ page }) => {
  await load(page, FORM);
  await trackSubmits(page, { prevent: false });
  const ta = page.locator('chat-input textarea');
  await ta.fill('clear me');
  await ta.press('Enter');
  expect(await page.evaluate(() => window.__submits)).toEqual(['clear me']);
  await expect(ta).toHaveValue('');
});

test('empty message does not submit the form', async ({ page }) => {
  await load(page, FORM);
  await trackSubmits(page, { prevent: true });
  await page.locator('[data-send]').click();
  await page.locator('chat-input textarea').press('Enter');
  expect(await page.evaluate(() => window.__submits.length)).toBe(0);
});

test('keyboard focus on the textarea shows a focus ring', async ({ page }) => {
  await load(page, INPUT());
  await page.keyboard.press('Tab');
  await expect(page.locator('chat-input textarea')).toBeFocused();
  const ring = await page.locator('chat-input').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  expect(ring.style).not.toBe('none');
  expect(ring.width).toBeGreaterThan(0);
});

test('disabled at parse time disables the textarea and button', async ({ page }) => {
  await load(page, INPUT('disabled'));
  const r = await page.evaluate(() => {
    const ci = document.querySelector('chat-input');
    return {
      ta: ci.querySelector('textarea').disabled,
      btn: ci.querySelector('[data-send]').disabled,
      pointer: getComputedStyle(ci).pointerEvents,
    };
  });
  expect(r).toEqual({ ta: true, btn: true, pointer: 'auto' });
});

test('disabled toggles at runtime and via an ancestor fieldset', async ({ page }) => {
  await load(page, `<form><fieldset>${INPUT()}</fieldset></form>`);
  const r = await page.evaluate(() => {
    const ci = document.querySelector('chat-input');
    const ta = ci.querySelector('textarea');
    const btn = ci.querySelector('[data-send]');
    const out = {};
    ci.disabled = true;
    out.prop = [ta.disabled, btn.disabled];
    ci.disabled = false;
    out.propOff = [ta.disabled, btn.disabled];
    document.querySelector('fieldset').disabled = true;
    out.fieldset = [ci.matches(':disabled'), btn.disabled];
    return out;
  });
  expect(r).toEqual({ prop: [true, true], propOff: [false, false], fieldset: [true, true] });
});

test('maxlength blocks sending, standalone and in a form', async ({ page }) => {
  await load(page, `${INPUT('maxlength="5"')}<form id="f" method="dialog">${INPUT('maxlength="5"')}</form>`);
  await trackSends(page);
  await trackSubmits(page, { prevent: true });
  const [solo, inForm] = [page.locator('chat-input').first(), page.locator('#f chat-input')];
  await solo.locator('textarea').fill('way too long');
  await solo.locator('textarea').press('Enter');
  await solo.locator('[data-send]').click();
  await inForm.locator('textarea').fill('way too long');
  await inForm.locator('textarea').press('Enter');
  await inForm.locator('[data-send]').click();
  expect(await page.evaluate(() => ({ sent: window.__sent.length, submits: window.__submits.length }))).toEqual({ sent: 0, submits: 0 });
  await expect(solo.locator('textarea')).toHaveValue('way too long');
  expect(await solo.evaluate((el) => el.validity.tooLong)).toBe(true);
});

test('a textarea without a label gets aria-label="Message"; authored labels are kept', async ({ page }) => {
  await load(page, `${INPUT('id="a"', '')}${INPUT('id="b"', 'aria-label="Reply"')}
    <label for="t">Note</label>${INPUT('id="c"', 'id="t"')}`);
  const r = await page.evaluate(() => ['a', 'b', 'c'].map((id) => document.querySelector(`#${id} textarea`).getAttribute('aria-label')));
  expect(r).toEqual(['Message', 'Reply', null]);
});

test('reconnecting binds Enter once', async ({ page }) => {
  await load(page, `${INPUT()}<aside aria-label="Elsewhere"></aside>`);
  await trackSends(page);
  await page.evaluate(() => {
    const ci = document.querySelector('chat-input');
    document.querySelector('aside').append(ci);
  });
  const ta = page.locator('chat-input textarea');
  await ta.fill('once');
  await ta.press('Enter');
  expect(await page.evaluate(() => window.__sent.length)).toBe(1);
});
