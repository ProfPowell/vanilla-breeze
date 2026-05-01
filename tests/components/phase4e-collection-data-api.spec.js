/**
 * Phase 4e — accordion-wc, tab-set, carousel-wc dual-mode contracts.
 *
 * All three are HTML-first <details>/<summary> or div-based collections;
 * this verifies the new property setters rebuild the children from a
 * plain data array and emit source-tagged events.
 */

import { test, expect } from 'playwright/test';

test('accordion-wc: .panels setter rebuilds <details> children', async ({ page }) => {
  await page.goto('/docs/examples/demos/accordion-basic.html');
  await page.waitForSelector('accordion-wc[data-upgraded]');

  const result = await page.evaluate(() => {
    const acc = document.querySelector('accordion-wc');
    const fired = [];
    acc.addEventListener('accordion-wc:panels-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.panels.length });
    });
    acc.panels = [
      { id: 'p1', summary: 'First',  content: '<p>Alpha</p>', open: true },
      { id: 'p2', summary: 'Second', content: '<p>Beta</p>' },
      { id: 'p3', summary: 'Third',  content: '<p>Gamma</p>' },
    ];
    const details = [...acc.querySelectorAll(':scope > details')];
    return {
      fired,
      count: details.length,
      ids: details.map(d => d.id),
      firstOpen: details[0]?.hasAttribute('open'),
      labels: details.map(d => d.querySelector('summary')?.textContent),
    };
  });

  expect(result.fired).toEqual([{ source: 'property', count: 3 }]);
  expect(result.count).toBe(3);
  expect(result.ids).toEqual(['p1', 'p2', 'p3']);
  expect(result.firstOpen).toBe(true);
  expect(result.labels).toEqual(['First', 'Second', 'Third']);
});

test('tab-set: .tabs setter rebuilds with one tab open', async ({ page }) => {
  await page.goto('/docs/examples/demos/tabs-basic.html');
  await page.waitForSelector('tab-set[data-upgraded]');

  const result = await page.evaluate(() => {
    const ts = document.querySelector('tab-set');
    const fired = [];
    ts.addEventListener('tab-set:tabs-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.tabs.length });
    });
    ts.tabs = [
      { label: 'One',   content: 'A' },
      { label: 'Two',   content: 'B', active: true },
      { label: 'Three', content: 'C' },
    ];
    const details = [...ts.querySelectorAll(':scope > details')];
    return {
      fired,
      count: details.length,
      openIndex: details.findIndex(d => d.hasAttribute('open')),
      labels: details.map(d => d.querySelector('summary')?.textContent),
    };
  });

  expect(result.fired).toEqual([{ source: 'property', count: 3 }]);
  expect(result.count).toBe(3);
  expect(result.openIndex).toBe(1);
  expect(result.labels).toEqual(['One', 'Two', 'Three']);
});

test('carousel-wc: .slides setter rebuilds slide children', async ({ page }) => {
  await page.goto('/docs/examples/demos/carousel-basic.html');
  await page.waitForSelector('carousel-wc[data-upgraded]');

  const result = await page.evaluate(() => {
    const car = document.querySelector('carousel-wc');
    const fired = [];
    car.addEventListener('carousel-wc:slides-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.slides.length });
    });
    car.slides = [
      { id: 's1', html: '<p>Slide A</p>' },
      { id: 's2', html: '<p>Slide B</p>' },
    ];
    const slides = [...car.querySelectorAll('.carousel-track > *')];
    return { fired, count: slides.length, ids: slides.map(s => s.id) };
  });

  expect(result.fired).toEqual([{ source: 'property', count: 2 }]);
  expect(result.count).toBe(2);
  expect(result.ids).toEqual(['s1', 's2']);
});
