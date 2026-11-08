/**
 * topic-map + trust-filter — T review fixes.
 *
 * topic-map: distinct-page counts per subtree, cycle guard, unsafe URL
 * schemes, link-free summaries, plural counts, heading level, labels,
 * surfaced errors, .data + data-changed.
 * trust-filter: unsafe URL schemes, stale selection after reconnect, both
 * signature values = no filter, count-only live region, no ids, labels,
 * "Has signature" naming, no change event on load, token colours.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const VOCAB = {
  'skos:hasTopConcept': ['provenance'],
  concepts: [
    { '@id': 'provenance', 'skos:prefLabel': 'Provenance', 'skos:narrower': ['data-provenance', 'page-info'] },
    { '@id': 'data-provenance', 'skos:prefLabel': 'Data provenance', 'skos:broader': 'provenance' },
    { '@id': 'page-info', 'skos:prefLabel': 'Page info', 'skos:broader': 'provenance' },
  ],
};
const TOPIC_PAGES = [
  { url: '/a/', title: 'A', concepts: ['provenance', 'data-provenance', 'page-info'] },
  { url: '/b/', title: 'B', concepts: ['page-info'] },
  { url: 'javascript:alert(1)', title: 'Evil', concepts: ['page-info'] },
  { url: '/c/', title: 'C', concepts: ['unknown'] },
];

const TRUST_PAGES = [
  { url: '/p1/', title: 'P1', provenance: 'human', review: 'editor-reviewed', status: 'published', signed: true },
  { url: '/p2/', title: 'P2', provenance: 'ai-assisted', review: 'fact-checked', status: 'draft', signed: false },
  { url: '/p3/', title: 'P3', provenance: 'ai-generated translated', review: 'editor-reviewed', status: 'published', signed: false },
  { url: 'javascript:alert(1)', title: 'Evil', provenance: 'human', review: 'unreviewed', status: 'published', signed: false },
];

async function load(page, body, { json = {} } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  for (const [name, payload] of Object.entries(json)) {
    await page.route(`**/__t7-${name}.json`, (route) => (payload === 500
      ? route.fulfill({ status: 500, body: 'nope' })
      : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })));
  }
  const url = `/__t7-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/topic-map/logic.js';
        import '/src/web-components/trust-filter/logic.js';
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('topic-map') && customElements.get('trust-filter'));
}

const TOPIC_JSON = { pages: { pages: TOPIC_PAGES }, vocab: VOCAB };

test.describe('topic-map', () => {
  test('counts distinct pages per subtree, with units', async ({ page }) => {
    await load(page, '<topic-map id="tm" src="/__t7-pages.json" data-vocabulary-src="/__t7-vocab.json" expand-all></topic-map>', { json: TOPIC_JSON });
    const prov = page.locator('[data-topic-node="provenance"] > summary .topic-count');
    /* /a/ is tagged with the parent and both children: counted once. */
    await expect(prov).toHaveText('3 pages');
    await expect(page.locator('[data-topic-node="data-provenance"] > summary .topic-count')).toHaveText('1 page');
    await expect(page.locator('topic-map h2.topic-map-heading')).toContainText('4 pages');
  });

  test('summary holds no link; topic link sits in the body', async ({ page }) => {
    await load(page, '<topic-map src="/__t7-pages.json" data-vocabulary-src="/__t7-vocab.json"></topic-map>', { json: TOPIC_JSON });
    await expect(page.locator('[data-topic-node="provenance"]')).toBeVisible();
    await expect(page.locator('topic-map summary a')).toHaveCount(0);
    await expect(page.locator('[data-topic-node="provenance"] > p.topic-link a')).toHaveAttribute('href', '/topics/provenance/');
    await expect(page.locator('[data-topic-node="provenance"] > p.topic-link a')).toHaveText('Provenance topic page');
  });

  test('unsafe URL schemes are not linked', async ({ page }) => {
    await load(page, '<topic-map src="/__t7-pages.json" data-vocabulary-src="/__t7-vocab.json" expand-all></topic-map>', { json: TOPIC_JSON });
    await expect(page.locator('[data-topic-node="page-info"] .topic-pages li', { hasText: 'Evil' })).toHaveCount(1);
    await expect(page.locator('topic-map a[href^="javascript"]')).toHaveCount(0);
  });

  test('a broader/narrower cycle renders without overflow', async ({ page }) => {
    await load(page, '<topic-map id="tm"></topic-map>');
    const result = await page.evaluate(() => {
      const tm = document.getElementById('tm');
      tm.data = {
        pages: [{ url: '/x/', title: 'X', concepts: ['a', 'b'] }],
        vocabulary: {
          'skos:hasTopConcept': ['a'],
          concepts: [
            { '@id': 'a', 'skos:prefLabel': 'A', 'skos:narrower': ['b'] },
            { '@id': 'b', 'skos:prefLabel': 'B', 'skos:narrower': ['a'] },
          ],
        },
      };
      return {
        nodes: tm.querySelectorAll('[data-topic-node]').length,
        count: tm.querySelector('[data-topic-node="a"] > summary .topic-count')?.textContent,
      };
    });
    expect(result).toEqual({ nodes: 2, count: '1 page' });
  });

  test('heading level 0 omits the heading; labels and level are honoured', async ({ page }) => {
    await load(page, `
      <topic-map id="none" src="/__t7-pages.json" data-vocabulary-src="/__t7-vocab.json" data-heading-level="0"></topic-map>
      <section lang="fr">
        <topic-map id="fr" src="/__t7-pages.json" data-vocabulary-src="/__t7-vocab.json" data-heading-level="4"
          data-label-heading="Sujets" data-label-page="{count} page" data-label-pages="{count} pages (fr)"
          data-label-uncategorized="Non classé"></topic-map>
      </section>`, { json: TOPIC_JSON });
    await expect(page.locator('#fr h4')).toContainText('Sujets');
    await expect(page.locator('#fr [data-topic-node="__uncategorized"] summary .topic-name')).toHaveText('Non classé');
    await expect(page.locator('#none [data-topic-node="provenance"]')).toHaveCount(1);
    await expect(page.locator('#none :is(h1,h2,h3,h4,h5,h6)')).toHaveCount(0);
  });

  test('a failed source shows a generic message and logs the detail', async ({ page }) => {
    const warnings = [];
    page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
    await load(page, '<topic-map src="/__t7-pages.json" data-vocabulary-src="/__t7-vocab.json"></topic-map>', { json: { pages: 500, vocab: VOCAB } });
    await expect(page.locator('[data-topic-map-error]')).toHaveText('Topics could not be loaded.');
    expect(warnings.join(' ')).toContain('__t7-pages.json');
  });

  test('.data fires topic-map:data-changed and survives reconnect', async ({ page }) => {
    await load(page, '<topic-map id="tm"></topic-map><p id="dest"></p>');
    const out = await page.evaluate((args) => {
      const tm = document.getElementById('tm');
      let detail = null;
      tm.addEventListener('topic-map:data-changed', (e) => { detail = e.detail; });
      tm.data = args;
      document.getElementById('dest').append(tm);
      return { source: detail?.source, nodes: tm.querySelectorAll('[data-topic-node]').length };
    }, { pages: TOPIC_PAGES, vocabulary: VOCAB });
    expect(out).toEqual({ source: 'property', nodes: 4 });
  });
});

test.describe('trust-filter', () => {
  const TF = '<trust-filter id="tf" src="/__t7-trust.json"></trust-filter>';
  const TRUST_JSON = { json: { trust: { pages: TRUST_PAGES } } };

  test('unsafe URL schemes are not linked', async ({ page }) => {
    await load(page, TF, TRUST_JSON);
    await expect(page.locator('#tf [data-trust-filter-results] li')).toHaveCount(4);
    await expect(page.locator('#tf a[href^="javascript"]')).toHaveCount(0);
  });

  test('only the count is live; list is a sibling; no ids', async ({ page }) => {
    await load(page, TF, TRUST_JSON);
    const count = page.locator('#tf output[data-trust-filter-count]');
    await expect(count).toHaveText('4 of 4 pages');
    await expect(count).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#tf output ul')).toHaveCount(0);
    await expect(page.locator('#tf ul[data-trust-filter-results]:not([aria-live])')).toHaveCount(1);
    await expect(page.locator('#tf [id], #tf label[for]')).toHaveCount(0);
  });

  test('"Has signature" group: both values means no filter', async ({ page }) => {
    await load(page, TF, TRUST_JSON);
    const group = page.locator('#tf fieldset[data-dim="signed"]');
    await expect(group.locator('legend')).toHaveText('Has signature');
    await group.getByLabel('Yes').check();
    await expect(page.locator('#tf [data-trust-filter-count]')).toHaveText('1 of 4 pages');
    await group.getByLabel('No').check();
    await expect(page.locator('#tf [data-trust-filter-count]')).toHaveText('4 of 4 pages');
    await expect(page.locator('#tf .trust-filter-signature')).toHaveText('has signature');
  });

  test('reconnect clears the stale selection with the controls', async ({ page }) => {
    await load(page, `${TF}<p id="dest"></p>`, TRUST_JSON);
    await page.locator('#tf fieldset[data-dim="review"]').getByLabel('fact checked').check();
    await expect(page.locator('#tf [data-trust-filter-count]')).toHaveText('1 of 4 pages');
    await page.evaluate(() => document.getElementById('dest').append(document.getElementById('tf')));
    await expect(page.locator('#tf [data-trust-filter-count]')).toHaveText('4 of 4 pages');
    await expect(page.locator('#tf input:checked')).toHaveCount(0);
    await expect(page.locator('#tf [data-trust-filter-controls]')).toHaveCount(1);
  });

  test('change fires on user input and reset, not on load', async ({ page }) => {
    await page.addInitScript(() => {
      window.__tfEvents = [];
      document.addEventListener('trust-filter:change', (e) => window.__tfEvents.push(e.detail));
    });
    await load(page, TF, TRUST_JSON);
    await expect(page.locator('#tf [data-trust-filter-count]')).toHaveText('4 of 4 pages');
    expect(await page.evaluate(() => window.__tfEvents.length)).toBe(0);
    await page.locator('#tf fieldset[data-dim="provenance"]').getByLabel('translated').check();
    await page.locator('#tf button[type="reset"]').click();
    const events = await page.evaluate(() => window.__tfEvents);
    expect(events.map((e) => e.count)).toEqual([1, 4]);
    expect(events[0].selected.provenance).toEqual(['translated']);
    await expect(page.locator('#tf input:checked')).toHaveCount(0);
  });

  test('composed provenance gets the token colour', async ({ page }) => {
    await load(page, TF, TRUST_JSON);
    const colours = await page.evaluate(() => {
      const chip = document.querySelector('#tf .trust-filter-prov[data-provenance="ai-generated translated"]');
      const muted = document.querySelector('#tf [data-trust-filter-count]');
      return [getComputedStyle(chip).color, getComputedStyle(muted).color];
    });
    expect(colours[0]).not.toBe(colours[1]);
  });

  test('labels are overridable and plural-aware', async ({ page }) => {
    await load(page, `<trust-filter id="tf" src="/__t7-one.json" data-label-signed="Firma"
      data-label-page="{count} von {total} Seite" data-label-clear="Zurücksetzen"></trust-filter>`,
    { json: { one: { pages: [TRUST_PAGES[0]] } } });
    await expect(page.locator('#tf [data-trust-filter-count]')).toHaveText('1 von 1 Seite');
    await expect(page.locator('#tf fieldset[data-dim="signed"] legend')).toHaveText('Firma');
    await expect(page.locator('#tf button[type="reset"]')).toHaveText('Zurücksetzen');
  });

  test('a failed source shows a generic message', async ({ page }) => {
    await load(page, TF, { json: { trust: 500 } });
    await expect(page.locator('#tf [data-trust-filter-error]')).toHaveText('Pages could not be loaded.');
  });
});
