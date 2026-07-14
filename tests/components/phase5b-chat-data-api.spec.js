/**
 * Phase 5b — chat-window, chat-input dual-mode contracts.
 *
 * review-surface coverage was removed: the component moved out of core to
 * the external vb-project-planning pack (commit 1b859a60).
 */

import { test, expect } from 'playwright/test';

test('chat-window: .messages setter renders <chat-message> children with keyed-diff preservation', async ({ page }) => {
  await page.goto('/docs/examples/demos/chat-window-basic.html');
  await page.waitForFunction(() => document.querySelector('chat-window[data-upgraded]'));

  const result = await page.evaluate(() => {
    const cw = document.querySelector('chat-window');
    const fired = [];
    cw.addEventListener('chat-window:messages-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.messages.length });
    });

    cw.messages = [
      { id: 'm1', role: 'user',  content: 'Hi there' },
      { id: 'm2', role: 'agent', content: 'Hello! How can I help?' },
      { id: 'm3', role: 'user',  content: 'Tell me a joke.' },
    ];

    const before = new Map();
    for (const m of cw.querySelectorAll('chat-message')) {
      if (m.id) before.set(m.id, m);
    }

    // Reorder + drop one + add one
    cw.messages = [
      { id: 'm2', role: 'agent', content: 'Hello! How can I help?' },
      { id: 'm1', role: 'user',  content: 'Hi there' },
      { id: 'm4', role: 'agent', content: 'Why did the chicken...' },
    ];

    const after = new Map();
    for (const m of cw.querySelectorAll('chat-message')) {
      if (m.id) after.set(m.id, m);
    }

    return {
      fired,
      preservedM1: after.get('m1') === before.get('m1'),
      preservedM2: after.get('m2') === before.get('m2'),
      droppedM3: !after.has('m3'),
      addedM4: after.has('m4'),
      finalIds: [...cw.querySelectorAll('chat-message')].map(m => m.id),
    };
  });

  expect(result.fired.length).toBe(2);
  expect(result.fired.every(f => f.source === 'property')).toBe(true);
  expect(result.preservedM1).toBe(true);
  expect(result.preservedM2).toBe(true);
  expect(result.droppedM3).toBe(true);
  expect(result.addedM4).toBe(true);
  expect(result.finalIds).toEqual(['m2', 'm1', 'm4']);
});

test('chat-input: idempotent .value emits chat-input:change with source: "api"', async ({ page }) => {
  await page.goto('/docs/examples/demos/chat-input-basic.html');
  await page.waitForFunction(() => document.querySelector('chat-input[data-upgraded]'));

  const result = await page.evaluate(() => {
    const ci = document.querySelector('chat-input');
    const fired = [];
    ci.addEventListener('chat-input:change', (e) => {
      fired.push({ source: e.detail.source, value: e.detail.value });
    });
    ci.value = 'hello';
    ci.value = 'hello'; // idempotent — no second event
    ci.value = 'world';
    return { fired, current: ci.value };
  });

  expect(result.fired.length).toBe(2);
  expect(result.fired.every(f => f.source === 'api')).toBe(true);
  expect(result.fired[0].value).toBe('hello');
  expect(result.fired[1].value).toBe('world');
  expect(result.current).toBe('world');
});
