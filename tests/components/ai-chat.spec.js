/**
 * <ai-chat> — reconnect idempotency, one-request-at-a-time, Escape-to-stop
 * and aria-busy on the streaming message.
 *
 * The shared server serves a build snapshot, so `/src/**` is routed to the
 * working tree and the fixture page is served from a fake URL. The Chrome
 * LanguageModel global is removed so the `endpoint` provider always wins.
 */
import { test, expect } from 'playwright/test';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENDPOINT = '/__ai-chat-endpoint';

async function load(page, body) {
  await page.addInitScript(() => {
    delete globalThis.LanguageModel;
    window.__userMessages = 0;
    document.addEventListener('ai-chat:message', (e) => {
      if (e.detail.role === 'user') window.__userMessages++;
    });
  });
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
  await expect(page.locator('ai-chat')).toHaveAttribute('data-state', 'ready');
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
