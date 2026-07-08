/**
 * Chat Window Web Component Behavior Tests
 *
 * Tests participant resolution, empty state, transport seam,
 * error handling, and model sync.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/chat-window-basic.html';

test.describe('chat-window — baseline', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('chat-window[data-upgraded]');

    const chatWindow = page.locator('chat-window');
    await expect(chatWindow).toBeVisible();
  });

  test('has chat-thread and chat-input children', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('chat-window[data-upgraded]');

    const thread = page.locator('chat-window chat-thread');
    const input = page.locator('chat-window chat-input');

    await expect(thread).toHaveCount(1);
    await expect(input).toHaveCount(1);
  });
});

test.describe('chat-window — empty state', () => {

  test('shows empty message when no messages exist', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('chat-window[data-upgraded]');

    const hasEmpty = await page.evaluate(() => {
      const cw = document.querySelector('chat-window');
      const thread = cw.querySelector('chat-thread');
      const hasMessages = thread.querySelector('chat-message') !== null;
      const emptyEl = cw.querySelector('[data-chat-empty]');
      return { hasMessages, hasEmpty: !!emptyEl };
    });

    // If no messages, empty state should be shown
    if (!hasEmpty.hasMessages) {
      expect(hasEmpty.hasEmpty).toBe(true);
    }
  });

  test('empty state clears when message is added', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('chat-window[data-upgraded]');

    const result = await page.evaluate(() => {
      const cw = document.querySelector('chat-window');
      // Use public API to add a message
      cw.appendMessage('user', 'Hello', 'user');
      const emptyEl = cw.querySelector('[data-chat-empty]');
      return { hasEmpty: !!emptyEl };
    });

    expect(result.hasEmpty).toBe(false);
  });
});

test.describe('chat-window — participant resolution', () => {

  test('resolves participant labels for existing messages', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('chat-window[data-upgraded]');

    const result = await page.evaluate(() => {
      const cw = document.querySelector('chat-window');
      cw.appendMessage('user', 'Test message', 'user');

      const msg = cw.querySelector('chat-message[data-from="user"]');
      return {
        hasFromLabel: msg?.hasAttribute('data-from-label'),
        label: msg?.getAttribute('data-from-label'),
      };
    });

    expect(result.hasFromLabel).toBe(true);
    expect(result.label).toBeTruthy();
  });

  test('user messages get data-from="user"', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('chat-window[data-upgraded]');

    const result = await page.evaluate(() => {
      const cw = document.querySelector('chat-window');
      cw.appendMessage('user', 'Hello world', 'user');

      const msg = cw.querySelector('chat-message[data-role="user"]');
      return {
        from: msg?.getAttribute('data-from'),
        role: msg?.getAttribute('data-role'),
      };
    });

    expect(result.from).toBe('user');
    expect(result.role).toBe('user');
  });
});

test.describe('chat-window — custom transport', () => {

  test('dispatches chat-window:send when no endpoint is set', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('chat-window[data-upgraded]');

    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const cw = document.querySelector('chat-window');

        // Remove endpoint to test custom transport path
        cw.removeAttribute('endpoint');

        cw.addEventListener('chat-window:send', (e) => {
          resolve({
            fired: true,
            hasMessage: !!e.detail.message,
            hasTypingElement: !!e.detail.typingElement,
          });
        });

        // Simulate sending a message via chat-input event
        const textarea = cw.querySelector('textarea');
        if (textarea) {
          textarea.value = 'Custom transport test';
          cw.dispatchEvent(new CustomEvent('chat-input:send', {
            bubbles: true,
            detail: { message: 'Custom transport test' },
          }));
        }

        setTimeout(() => resolve({ fired: false }), 2000);
      });
    });

    expect(result.fired).toBe(true);
    expect(result.hasMessage).toBe(true);
    expect(result.hasTypingElement).toBe(true);
  });
});

test.describe('chat-window — public API', () => {

  test('appendMessage adds a message to the thread', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('chat-window[data-upgraded]');

    const msgCount = await page.evaluate(() => {
      const cw = document.querySelector('chat-window');
      cw.appendMessage('agent', 'Hello from agent', 'assistant');
      return cw.querySelectorAll('chat-message').length;
    });

    expect(msgCount).toBeGreaterThan(0);
  });

  test('clearThread removes all messages', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('chat-window[data-upgraded]');

    const result = await page.evaluate(() => {
      const cw = document.querySelector('chat-window');
      cw.appendMessage('user', 'Test 1', 'user');
      cw.appendMessage('agent', 'Reply 1', 'assistant');

      const before = cw.querySelectorAll('chat-message').length;
      cw.clearThread();
      const after = cw.querySelectorAll('chat-message').length;

      return { before, after };
    });

    expect(result.before).toBeGreaterThan(0);
    expect(result.after).toBe(0);
  });

  test('model property syncs with attribute', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('chat-window[data-upgraded]');

    const result = await page.evaluate(() => {
      const cw = document.querySelector('chat-window');
      cw.model = 'test-model';

      return {
        property: cw.model,
        attribute: cw.getAttribute('model'),
      };
    });

    expect(result.property).toBe('test-model');
    expect(result.attribute).toBe('test-model');
  });
});
