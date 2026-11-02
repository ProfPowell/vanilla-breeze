/**
 * chat-window + chat-message/chat-bubble/chat-thread — review fixes
 * (vanilla-breeze-pohq, 25vi, ra3u).
 *
 * User text is never parsed as HTML, the messages setter replaces the
 * whole thread, typing placeholders announce via real text and resolve
 * through resolveTyping(), the empty thread stays in the accessibility
 * tree, teardown aborts an in-flight request, and one send per reconnect.
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
  const url = `/__chat-window-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/chat-input/logic.js';
        import '/src/web-components/chat-window/logic.js';
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('chat-window') && customElements.get('chat-input'));
  await page.waitForSelector('chat-window[data-upgraded]', { state: 'attached' });
}

const WINDOW = (attrs = '', thread = '') => `
  <chat-window ${attrs}>
    <script type="application/json" data-participants>
      { "user": { "name": "You", "role": "user" }, "bot": { "name": "Bot", "role": "agent" } }
    </script>
    <header><h2>Chat</h2></header>
    <chat-thread role="log" aria-label="Conversation" aria-live="polite">${thread}</chat-thread>
    <chat-input name="message">
      <textarea data-grow rows="1" aria-label="Message"></textarea>
      <footer><button type="submit" data-send aria-label="Send">Send</button></footer>
    </chat-input>
  </chat-window>`;

const SSR = `
  <chat-message data-role="agent" data-from="bot"><chat-bubble><p>Server one</p></chat-bubble></chat-message>
  <chat-message data-role="user" data-from="user" id="keep"><chat-bubble><p>Server two</p></chat-bubble></chat-message>`;

test('user text containing markup is inserted as text', async ({ page }) => {
  await load(page, WINDOW());
  const ta = page.locator('chat-input textarea');
  await ta.fill('<b>bold</b> <img src=x onerror="window.__xss=1">');
  await ta.press('Enter');
  const r = await page.evaluate(() => {
    const bubble = document.querySelector('chat-message[data-role="user"] chat-bubble');
    return {
      b: bubble.querySelector('b, img') !== null,
      text: bubble.textContent,
      xss: window.__xss ?? 0,
    };
  });
  expect(r.b).toBe(false);
  expect(r.text).toBe('<b>bold</b> <img src=x onerror="window.__xss=1">');
  expect(r.xss).toBe(0);
});

test('appendMessage: user content is text, agent content is sanitized HTML', async ({ page }) => {
  await load(page, WINDOW());
  const r = await page.evaluate(() => {
    const cw = document.querySelector('chat-window');
    const u = cw.appendMessage('user', '<b>hi</b>', 'user');
    const a = cw.appendMessage('agent', '<p><b>hi</b><script>window.__x=1</script></p>', 'bot');
    return {
      userB: !!u.querySelector('b'),
      userText: u.textContent.trim(),
      agentB: !!a.querySelector('b'),
      agentScript: !!a.querySelector('script'),
    };
  });
  expect(r).toEqual({ userB: false, userText: '<b>hi</b>', agentB: true, agentScript: false });
});

test('messages setter replaces server-rendered messages (keeping a matching id)', async ({ page }) => {
  await load(page, WINDOW('', SSR));
  const r = await page.evaluate(() => {
    const cw = document.querySelector('chat-window');
    const kept = document.getElementById('keep');
    cw.messages = [
      { id: 'keep', role: 'user', content: 'Server two' },
      { id: 'n1', role: 'agent', content: 'New reply' },
    ];
    const first = [...cw.querySelectorAll('chat-thread > chat-message')].map((m) => m.textContent.trim());
    const sameNode = document.getElementById('keep') === kept;
    cw.messages = [];
    return {
      first,
      sameNode,
      afterEmpty: cw.querySelectorAll('chat-thread > chat-message').length,
      emptyShown: !!cw.querySelector('chat-thread > [data-chat-empty]'),
      getter: cw.messages,
    };
  });
  expect(r.first).toEqual(['Server two', 'New reply']);
  expect(r.sameNode).toBe(true);
  expect(r.afterEmpty).toBe(0);
  expect(r.emptyShown).toBe(true);
  expect(r.getter).toEqual([]);
});

test('messages round-trip: user content comes back as text', async ({ page }) => {
  await load(page, WINDOW());
  const r = await page.evaluate(() => {
    const cw = document.querySelector('chat-window');
    cw.messages = [{ id: 'u', role: 'user', content: 'a < b & <i>c</i>' }];
    return cw.messages[0].content;
  });
  expect(r).toBe('a < b & <i>c</i>');
});

test('reconnecting sends once', async ({ page }) => {
  await load(page, `${WINDOW()}<aside aria-label="Elsewhere"></aside>`);
  await page.evaluate(() => {
    window.__sends = 0;
    document.addEventListener('chat-window:send', () => window.__sends++);
    document.querySelector('aside').append(document.querySelector('chat-window'));
  });
  await page.waitForSelector('chat-window[data-upgraded]', { state: 'attached' });
  const ta = page.locator('chat-input textarea');
  await ta.fill('once');
  await ta.press('Enter');
  await page.waitForTimeout(50);
  const r = await page.evaluate(() => ({
    sends: window.__sends,
    users: document.querySelectorAll('chat-message[data-role="user"]').length,
    typing: document.querySelectorAll('chat-message[data-status="typing"]').length,
  }));
  expect(r).toEqual({ sends: 1, users: 1, typing: 1 });
});

test('typing placeholder announces via text and resolveTyping() finishes it', async ({ page }) => {
  await load(page, WINDOW());
  const r = await page.evaluate(async () => {
    const cw = document.querySelector('chat-window');
    const typing = await new Promise((resolve) => {
      cw.addEventListener('chat-window:send', (e) => resolve(e.detail.typingElement), { once: true });
      cw.querySelector('chat-input').value = 'hi';
      cw.querySelector('chat-input textarea').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    });
    const bubble = typing.querySelector('chat-bubble');
    const before = {
      ariaLabel: typing.getAttribute('aria-label'),
      label: bubble.textContent,
      dots: getComputedStyle(bubble, '::after').backgroundImage !== 'none',
    };
    cw.resolveTyping(typing, '<p>Answer</p>');
    return {
      before,
      after: {
        status: typing.getAttribute('data-status'),
        text: bubble.textContent,
        dots: getComputedStyle(bubble, '::after').backgroundImage !== 'none',
      },
    };
  });
  expect(r.before).toEqual({ ariaLabel: null, label: 'Bot is typing', dots: true });
  expect(r.after).toEqual({ status: null, text: 'Answer', dots: false });
});

test('typing dots stop once the bubble has content, even with data-status left on', async ({ page }) => {
  await load(page, `<chat-thread role="log" aria-label="t">
    <chat-message data-role="agent" data-status="typing"><chat-bubble></chat-bubble></chat-message>
    <chat-message data-role="agent" data-status="typing"><chat-bubble><p>Streamed</p></chat-bubble></chat-message>
  </chat-thread>${WINDOW()}`);
  const dots = await page.evaluate(() => [...document.querySelectorAll('chat-thread[aria-label="t"] chat-bubble')]
    .map((b) => getComputedStyle(b, '::after').backgroundImage !== 'none'));
  expect(dots).toEqual([true, false]);
});

test('empty thread stays rendered with the placeholder inside it', async ({ page }) => {
  await load(page, WINDOW());
  const r = await page.evaluate(() => {
    const thread = document.querySelector('chat-thread');
    return { hidden: thread.hidden, display: getComputedStyle(thread).display, empty: !!thread.querySelector(':scope > [data-chat-empty]') };
  });
  expect(r).toEqual({ hidden: false, display: 'flex', empty: true });
  const snap = await page.locator('chat-window').ariaSnapshot();
  expect(snap).toContain('log "Conversation"');
});

test('user sender label is visually hidden but still rendered for AT', async ({ page }) => {
  await load(page, WINDOW('', SSR));
  const r = await page.evaluate(() => {
    const m = document.getElementById('keep');
    const cs = getComputedStyle(m, '::before');
    return { label: m.getAttribute('data-from-label'), display: cs.display, content: cs.content, width: cs.width };
  });
  expect(r.label).toBe('You');
  expect(r.display).not.toBe('none');
  expect(r.content).toBe('"You"');
  expect(r.width).toBe('1px');
});

test('disconnecting aborts an in-flight endpoint request', async ({ page }) => {
  await load(page, WINDOW('endpoint="/__never"'));
  const aborted = await page.evaluate(async () => {
    let signal;
    window.fetch = (url, opts) => {
      signal = opts.signal;
      return new Promise((_, reject) => opts.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
    };
    const cw = document.querySelector('chat-window');
    cw.querySelector('chat-input').value = 'hi';
    cw.querySelector('chat-input textarea').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 20));
    let errors = 0;
    cw.addEventListener('chat-window:error', () => errors++);
    cw.remove();
    await new Promise((r) => setTimeout(r, 20));
    return { aborted: !!signal?.aborted, errors, typing: cw.querySelectorAll('[data-status="typing"]').length };
  });
  expect(aborted).toEqual({ aborted: true, errors: 0, typing: 0 });
});
