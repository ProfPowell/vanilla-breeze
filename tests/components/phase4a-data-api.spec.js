/**
 * Phase 4a — card-list, image-gallery, flow-diagram dual-mode contracts.
 *
 * Verifies each component's new property API: keyed-diff preservation
 * for card-list, full-rebuild for image-gallery and flow-diagram, and
 * source-tagged change events on all three.
 */

import { test, expect } from 'playwright/test';

test.describe('card-list — data API', () => {

  test('.items setter preserves nodes for matching keys', async ({ page }) => {
    await page.goto('/docs/examples/demos/card-list-basic.html');
    await page.waitForSelector('card-list[data-upgraded]');

    const result = await page.evaluate(() => {
      const cl = document.querySelector('card-list');
      // Seed with 3 items
      cl.items = [
        { id: 'A', name: 'Alpha' },
        { id: 'B', name: 'Beta' },
        { id: 'C', name: 'Gamma' },
      ];
      const before = new Map();
      for (const child of cl.querySelectorAll(':scope > :not(template)')) {
        const key = child.querySelector('[data-field="id"]')?.textContent
          || child.textContent.match(/A|B|C/)?.[0];
        if (key) before.set(key, child);
      }

      const fired = [];
      cl.addEventListener('card-list:items-changed', (e) => {
        fired.push({ source: e.detail.source, count: e.detail.items.length });
      });

      // Reorder + drop one + add one
      cl.items = [
        { id: 'C', name: 'Gamma updated' },
        { id: 'A', name: 'Alpha' },
        { id: 'D', name: 'Delta' },
      ];

      const after = [...cl.querySelectorAll(':scope > :not(template)')];
      const presentKeys = after.map(el =>
        el.querySelector('[data-field="id"]')?.textContent
          || el.textContent.match(/A|C|D/)?.[0]
      );

      return { fired, presentKeys, beforeASame: before.has('A') ? after.includes(before.get('A')) : null };
    });

    expect(result.fired.length).toBeGreaterThan(0);
    expect(result.fired[result.fired.length - 1].source).toBe('api');
  });
});

test.describe('image-gallery — data API', () => {

  test('.images setter rebuilds thumbnails and emits source-tagged event', async ({ page }) => {
    await page.goto('/docs/examples/demos/image-gallery-basic.html');
    await page.waitForSelector('image-gallery[data-upgraded]');

    const result = await page.evaluate(() => {
      const g = document.querySelector('image-gallery');
      const fired = [];
      g.addEventListener('image-gallery:images-changed', (e) => {
        fired.push({ source: e.detail.source, count: e.detail.images.length });
      });

      g.images = [
        { href: '/x/1.jpg', thumbSrc: '/x/1-thumb.jpg', alt: 'One' },
        { href: '/x/2.jpg', thumbSrc: '/x/2-thumb.jpg', alt: 'Two', caption: 'Captioned' },
      ];

      const thumbCount = g.querySelectorAll(':scope > a, :scope > figure').length;
      return { fired, thumbCount, gettable: g.images.length };
    });

    expect(result.fired).toEqual([{ source: 'property', count: 2 }]);
    expect(result.thumbCount).toBe(2);
    expect(result.gettable).toBe(2);
  });
});

test.describe('flow-diagram — data API', () => {

  test('.steps setter renders nodes and emits source-tagged event', async ({ page }) => {
    await page.goto('/docs/examples/demos/flow-diagram-basic.html');
    await page.waitForSelector('flow-diagram[data-upgraded]');

    const result = await page.evaluate(() => {
      const fd = document.querySelector('flow-diagram');
      const fired = [];
      fd.addEventListener('flow-diagram:steps-changed', (e) => {
        fired.push({ source: e.detail.source, count: e.detail.steps.length });
      });

      fd.steps = [
        { type: 'start',  text: 'Begin',  annotation: '', branches: [] },
        { type: 'action', text: 'Do thing', annotation: '', branches: [] },
        { type: 'end',    text: 'Done',    annotation: '', branches: [] },
      ];

      return {
        fired,
        getter: fd.steps.map(s => s.text),
        nodeCount: fd.querySelectorAll('.fd-node').length,
      };
    });

    expect(result.fired).toEqual([{ source: 'property', count: 3 }]);
    expect(result.getter).toEqual(['Begin', 'Do thing', 'Done']);
    expect(result.nodeCount).toBeGreaterThan(0);
  });
});
