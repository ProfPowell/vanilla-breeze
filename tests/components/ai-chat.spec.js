/**
 * <ai-chat> — reconnect idempotency, one-request-at-a-time, Escape-to-stop,
 * the visible Stop button, aria-busy on the streaming message, endpoint
 * conversation history (messages[], spec v1.1), the {content} deep-link
 * token, context-ribbon refresh and the abort signal on LanguageModel.create.
 *
 * The shared server serves a build snapshot, so `/src/**` is routed to the
 * working tree and the fixture page is served from a fake URL. The Chrome
 * LanguageModel global is removed so the `endpoint` provider always wins,
 * unless a test installs a fake via `opts.init`.
 */
import { test, expect } from 'playwright/test';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENDPOINT = '/__ai-chat-endpoint';

async function load(page, body, { init, ready = 'ready' } = {}) {
  await page.addInitScript(() => {
    delete globalThis.LanguageModel;
    window.__opened = [];
    window.open = (url) => { window.__opened.push(String(url)); return null; };
    window.__userMessages = 0;
    document.addEventListener('ai-chat:message', (e) => {
      if (e.detail.role === 'user') window.__userMessages++;
    });
  });
  if (init) await page.addInitScript(init);
  await page.route('**/src/**', (r) => r.fulfill({
    path: join(REPO, decodeURIComponent(new URL(r.request().url()).pathname)),
  }));
  const url = `/__ai-chat-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/chat-input/logic.js';
        import '/src/web-components/chat-window/logic.js';
        import '/src/web-components/ai-chat/logic.js';
      </script></head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await expect(page.locator('ai-chat')).toHaveAttribute('data-state', ready);
}

const FIXTURE = `<main><section id="a"><ai-chat endpoint="${ENDPOINT}">
  <template data-role="starters">
    First starter
    Second starter
  </template>
</ai-chat></section><section id="b"></section></main>`;

/** Route the endpoint so each request waits for an explicit release. */
async function gatedEndpoint(page) {
  const state = { count: 0, releases: [] };
  await page.route(`**${ENDPOINT}`, async (r) => {
    state.count++;
    await new Promise((res) => state.releases.push(res));
    try {
      await r.fulfill({ status: 200, contentType: 'text/plain', body: `Reply ${state.count}` });
    } catch { /* request was aborted */ }
  });
  return state;
}

async function send(page, text) {
  const ta = page.locator('chat-input textarea');
  await ta.fill(text);
  await ta.press('Enter');
}

test('moving the element twice keeps exactly one shell and no doubled listeners', async ({ page }) => {
  let requests = 0;
  await page.route(`**${ENDPOINT}`, (r) => {
    requests++;
    return r.fulfill({ status: 200, contentType: 'text/plain', body: 'Hello back' });
  });
  await load(page, FIXTURE);

  await page.evaluate(() => {
    const el = document.querySelector('ai-chat');
    document.getElementById('b').append(el);
    document.getElementById('a').append(el);
  });
  const host = page.locator('ai-chat');
  await expect(host).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('ai-chat > chat-window')).toHaveCount(1);
  await expect(page.locator('ai-chat > .ai-chat-ribbon')).toHaveCount(1);
  await expect(page.locator('ai-chat > .ai-chat-notice')).toHaveCount(1);
  await expect(page.locator('ai-chat > .ai-chat-starters')).toHaveCount(1);
  await expect(page.locator('.ai-chat-starter')).toHaveCount(2);
  await expect(page.locator('chat-input textarea')).toHaveCount(1);
  await expect(page.locator('select.ai-chat-provider')).toHaveValue('endpoint');

  await send(page, 'Hi');
  await expect(page.locator('chat-message[data-role="agent"] chat-bubble')).toHaveText('Hello back');
  expect(requests).toBe(1);
  expect(await page.evaluate(() => window.__userMessages)).toBe(1);
  await expect(page.locator('chat-message[data-role="user"]')).toHaveCount(1);
});

test('a second send while streaming is ignored, and Escape stops the stream', async ({ page }) => {
  const ep = await gatedEndpoint(page);
  await load(page, FIXTURE);
  const host = page.locator('ai-chat');

  await send(page, 'one');
  await expect(host).toHaveAttribute('data-state', 'streaming');
  const typing = page.locator('chat-message[data-role="agent"]');
  await expect(typing).toHaveAttribute('aria-busy', 'true');

  await send(page, 'two');
  await page.waitForTimeout(150);
  expect(ep.count).toBe(1);
  await expect(page.locator('chat-message[data-role="user"]')).toHaveCount(1);
  await expect(page.locator('chat-message[data-role="agent"]')).toHaveCount(1);
  // The dropped message is put back in the textarea, not lost.
  await expect(page.locator('chat-input textarea')).toHaveValue('two');

  // Escape (focus is still in the textarea) aborts the in-flight request.
  await page.locator('chat-input textarea').press('Escape');
  await expect(host).toHaveAttribute('data-state', 'ready');
  await expect(typing.locator('chat-bubble')).toHaveText('(stopped)');
  await expect(typing).not.toHaveAttribute('aria-busy', /.*/);
  ep.releases.forEach((r) => r());

  // The controller was released, so the next send goes through.
  await send(page, 'three');
  await expect.poll(() => ep.count).toBe(2);
  ep.releases.forEach((r) => r());
  await expect(page.locator('chat-message[data-role="agent"]').nth(1).locator('chat-bubble')).toHaveText('Reply 2');
  await expect(host).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('chat-message[aria-busy]')).toHaveCount(0);
});

test('a visible Stop button replaces Send while streaming and aborts the reply', async ({ page }) => {
  const ep = await gatedEndpoint(page);
  await load(page, FIXTURE);
  const host = page.locator('ai-chat');
  const sendBtn = page.locator('chat-input [data-send]');
  const stopBtn = page.locator('chat-input [data-stop]');

  await expect(sendBtn).toBeVisible();
  await expect(stopBtn).toBeHidden();

  await send(page, 'one');
  await expect(host).toHaveAttribute('data-state', 'streaming');
  await expect(stopBtn).toBeVisible();
  await expect(stopBtn).toHaveAccessibleName('Stop generating');
  await expect(sendBtn).toBeHidden();

  await stopBtn.click();
  await expect(host).toHaveAttribute('data-state', 'ready');
  const typing = page.locator('chat-message[data-role="agent"]');
  await expect(typing.locator('chat-bubble')).toHaveText('(stopped)');
  await expect(typing).not.toHaveAttribute('aria-busy', /.*/);
  await expect(stopBtn).toBeHidden();
  await expect(sendBtn).toBeVisible();
  // Focus lands back in the textarea, not on <body>.
  await expect(page.locator('chat-input textarea')).toBeFocused();
  ep.releases.forEach((r) => r());
});

test('endpoint requests carry prior turns as messages[]; reset() clears them', async ({ page }) => {
  const bodies = [];
  await page.route(`**${ENDPOINT}`, (r) => {
    bodies.push(r.request().postDataJSON());
    return r.fulfill({ status: 200, contentType: 'text/plain', body: `Reply ${bodies.length}` });
  });
  await load(page, FIXTURE);
  const agent = page.locator('chat-message[data-role="agent"] chat-bubble');

  await send(page, 'first question');
  await expect(agent.nth(0)).toHaveText('Reply 1');
  await expect(page.locator('ai-chat')).toHaveAttribute('data-state', 'ready');
  await send(page, 'second question');
  await expect(agent.nth(1)).toHaveText('Reply 2');

  expect(bodies[0]).toMatchObject({ prompt: 'first question', mode: 'chat', messages: [] });
  expect(bodies[1]).toMatchObject({
    prompt: 'second question',
    mode: 'chat',
    messages: [
      { role: 'user', content: 'first question' },
      { role: 'assistant', content: 'Reply 1' },
    ],
  });

  await page.evaluate(() => document.querySelector('ai-chat').reset());
  await send(page, 'fresh start');
  await expect.poll(() => bodies.length).toBe(3);
  expect(bodies[2]).toMatchObject({ prompt: 'fresh start', messages: [] });
});

test('deep-link: {content} carries the capped, encoded context and Send says it opens a new tab', async ({ page }) => {
  const words = Array.from({ length: 800 }, (_, i) => `word${i}`).join(' ');
  await load(page, `<main><article id="art"><p>Intro &amp; more. ${words}</p></article>
    <ai-chat context="#art" fallback-url="https://x.example/new?c={content}&amp;q={prompt}"></ai-chat></main>`);
  await expect(page.locator('chat-input [data-send]')).toHaveAccessibleName('Send (opens in new tab)');

  await send(page, 'hello');
  await expect.poll(() => page.evaluate(() => window.__opened.length)).toBe(1);
  const opened = new URL(await page.evaluate(() => window.__opened[0]));
  const c = opened.searchParams.get('c');
  expect(c.startsWith('Intro & more. word0 word1')).toBe(true);
  expect(c.length).toBeLessThanOrEqual(1500);
  expect(c.endsWith('…')).toBe(true);
  expect(opened.searchParams.get('q')).toContain('User: hello');
});

test('deep-link without a context attribute sends no page text in {content}', async ({ page }) => {
  await load(page, `<main><article><p>Private body text.</p></article>
    <ai-chat fallback-url="https://x.example/new?c={content}"></ai-chat></main>`);
  await send(page, 'hello');
  await expect.poll(() => page.evaluate(() => window.__opened.length)).toBe(1);
  const opened = new URL(await page.evaluate(() => window.__opened[0]));
  expect(opened.searchParams.get('c')).toBe('');
});

test('the context ribbon re-measures when focus enters the chat', async ({ page }) => {
  await page.route(`**${ENDPOINT}`, (r) => r.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' }));
  await load(page, `<main><article id="art"><p>Short.</p></article>
    <button type="button" id="outside">outside</button>
    <ai-chat context="#art" endpoint="${ENDPOINT}"></ai-chat></main>`);
  const ribbon = page.locator('.ai-chat-ribbon-lead');
  await expect(ribbon).toContainText('6 chars');

  // Content arrives late (lazy section, client render).
  await page.evaluate(() => {
    document.querySelector('#art').insertAdjacentHTML('beforeend', `<p>${'x'.repeat(7000)}</p>`);
  });
  await page.locator('#outside').focus();
  await page.locator('chat-input textarea').focus();
  await expect(ribbon).toContainText('7,006 chars');
  await expect(page.locator('ai-chat')).toHaveAttribute('data-context-state', 'large');
});

test('local provider: LanguageModel.create gets the abort signal, so Stop cancels a pending create', async ({ page }) => {
  await load(page, FIXTURE, {
    init: () => {
      window.__createSignals = [];
      globalThis.LanguageModel = {
        availability: async () => 'available',
        create: (opts) => {
          window.__createSignals.push(opts.signal instanceof AbortSignal);
          // Never resolves on its own; rejects when aborted, like the real API.
          return new Promise((_, reject) => {
            opts.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          });
        },
      };
    },
  });
  await expect(page.locator('select.ai-chat-provider')).toHaveValue('local');
  await send(page, 'hi');
  await expect(page.locator('ai-chat')).toHaveAttribute('data-state', 'streaming');
  expect(await page.evaluate(() => window.__createSignals)).toEqual([true]);

  await page.locator('chat-input [data-stop]').click();
  await expect(page.locator('ai-chat')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('chat-message[data-role="agent"] chat-bubble')).toHaveText('(stopped)');
});
