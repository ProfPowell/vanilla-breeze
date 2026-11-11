/**
 * @file generate-topic-assets.js
 * @description After-pass Cook plugin. Ships the topic-index sort script and
 * stylesheet, and writes a debug snapshot of topic-index.json so consumers
 * (and humans) can inspect the data the build derived.
 *
 * Outputs:
 *   site/dist/pages/topic-index.json              ← debug snapshot of build data
 *   site/dist/pages/js/topic-sort.js              ← client-side sort enhancement
 *   site/dist/pages/css/topic-index.css           ← list / sort-control styles
 *
 * Pairs with site/plugins/generate-topics.js (before-pass) which produces the
 * /topics/ source pages and stashes the aggregated index on this.data.topicIndex.
 *
 * Spec: admin/shipped/topic-index-system.md
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const SORT_SCRIPT = `(function enhanceTopicSort() {
  var controls = document.querySelector('[data-sort-controls]');
  var list = document.querySelector('ul[data-topic-index]');
  if (!controls || !list) return;

  function items() {
    return Array.prototype.slice.call(list.querySelectorAll(':scope > li'));
  }
  var statusEl = document.querySelector('[data-sort-status]');

  var hasViews = items().some(function (li) {
    return parseInt(li.dataset.views, 10) > 0;
  });
  var viewsButton = controls.querySelector('[data-sort="views"]');
  if (!hasViews && viewsButton) viewsButton.hidden = true;

  controls.hidden = false;

  var sortFns = {
    alpha: function (a, b) {
      return a.dataset.label.localeCompare(b.dataset.label, undefined, { sensitivity: 'base' });
    },
    count: function (a, b) {
      return parseInt(b.dataset.count, 10) - parseInt(a.dataset.count, 10);
    },
    views: function (a, b) {
      return parseInt(b.dataset.views, 10) - parseInt(a.dataset.views, 10);
    },
    updated: function (a, b) {
      return (b.dataset.updated || '').localeCompare(a.dataset.updated || '');
    },
    created: function (a, b) {
      return (a.dataset.created || '').localeCompare(b.dataset.created || '');
    }
  };

  var statusMessages = {
    alpha: 'Sorted alphabetically.',
    count: 'Sorted by most articles.',
    views: 'Sorted by most read.',
    updated: 'Sorted by latest update.',
    created: 'Sorted by oldest first.'
  };

  function applySort(key) {
    var fn = sortFns[key];
    if (!fn) return;
    items().slice().sort(fn).forEach(function (li) { list.appendChild(li); });
    var buttons = controls.querySelectorAll('button[data-sort]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].dataset.sort === key));
    }
    if (statusEl) statusEl.textContent = statusMessages[key] || 'Sorted by ' + key + '.';
    document.dispatchEvent(new CustomEvent('vb:sort', { detail: { index: 'topics', sort: key } }));
  }

  controls.addEventListener('click', function (e) {
    var button = e.target.closest && e.target.closest('button[data-sort]');
    if (!button) return;
    applySort(button.dataset.sort);
  });
})();
`;

export const TOPIC_INDEX_CSS = `/* Topic index — sort controls + topic list. Selectors target data-* and
   native elements only; no class names. Loaded from /css/topic-index.css.
   Colours come from the semantic tokens, so every theme and both schemes
   apply (the pressed sort button is the interactive colour, not the accent). */

/* Sort: a label and one joined row of toggle buttons */
[data-sort-controls] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--size-2xs) var(--size-s);
  border: 0;
  padding: 0;
  margin: 0;
  min-inline-size: 0;
}

/* Floated, the legend stops being the fieldset's caption box and lines up
   as the first item of the row. */
[data-sort-controls] legend {
  float: inline-start;
  padding: 0;
  margin: 0;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-muted);
}

[data-sort-controls] button {
  font: inherit;
  font-size: var(--font-size-s);
  line-height: 1.2;
  min-block-size: 2rem;
  padding: var(--size-2xs) var(--size-s);
  margin: 0;
  background: transparent;
  color: var(--color-text-muted);
  border: var(--border-width-thin, 1px) solid var(--color-border);
  border-radius: 0;
  box-shadow: none;
  cursor: pointer;
}

/* Joined: shared edges collapse, the two ends are rounded */
[data-sort-options] {
  display: inline-flex;
  flex-wrap: wrap;
  row-gap: var(--size-2xs);
}

[data-sort-controls] button + button {
  margin-inline-start: calc(var(--border-width-thin, 1px) * -1);
}

[data-sort-controls] button:first-of-type {
  border-start-start-radius: var(--radius-m);
  border-end-start-radius: var(--radius-m);
}

[data-sort-controls] button:not([hidden]):last-of-type {
  border-start-end-radius: var(--radius-m);
  border-end-end-radius: var(--radius-m);
}

[data-sort-controls] button:hover:not([aria-pressed="true"]) {
  background: color-mix(in oklch, currentColor 10%, transparent);
  color: var(--color-text);
}

[data-sort-controls] button[aria-pressed="true"] {
  position: relative;
  background: color-mix(in oklch, var(--color-interactive) 16%, transparent);
  color: var(--color-text);
  border-color: var(--color-interactive);
  font-weight: var(--font-weight-medium, 500);
}

[data-sort-controls] button:focus-visible {
  position: relative;
  outline: var(--border-width-medium, 2px) solid var(--color-interactive);
  outline-offset: 2px;
}

/* The list is one grid, so name, summary, count and date line up in columns
   down the page; each row is a single link. */
ul[data-topic-index] {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: minmax(8rem, max-content) minmax(0, 1fr) max-content max-content;
  column-gap: var(--size-l);
  border-block-start: var(--border-width-thin, 1px) solid var(--color-border);
}

ul[data-topic-index] > li,
ul[data-topic-index] > li > a {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  margin: 0;
}

ul[data-topic-index] > li {
  border-block-end: var(--border-width-thin, 1px) solid var(--color-border);
}

ul[data-topic-index] > li > a {
  align-items: baseline;
  padding: var(--size-s) var(--size-xs);
  text-decoration: none;
  color: inherit;
}

ul[data-topic-index] > li > a:hover {
  background: color-mix(in oklch, currentColor 6%, transparent);
}

ul[data-topic-index] > li > a:hover [data-topic-label] {
  color: var(--color-interactive);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

[data-topic-label] {
  font-weight: var(--font-weight-semibold, 600);
}

/* What the topic means: one line, trimmed (the topic page has it in full) */
[data-topic-about] {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--font-size-s);
  color: var(--color-text-muted);
}

[data-topic-count],
[data-topic-updated] {
  font-size: var(--font-size-s);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
  white-space: nowrap;
}

[data-topic-count] {
  text-align: end;
}

/* Narrow: name with its count and date on one line, the summary beneath */
@media (width < 48rem) {
  ul[data-topic-index] {
    grid-template-columns: minmax(0, 1fr) max-content max-content;
    column-gap: var(--size-s);
  }

  [data-topic-about] {
    grid-column: 1 / -1;
    grid-row: 2;
    white-space: normal;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}

@media (width < 30rem) {
  ul[data-topic-index] {
    grid-template-columns: minmax(0, 1fr) max-content;
  }

  [data-topic-updated] {
    display: none;
  }
}

[data-topic-as-of] {
  font-size: var(--font-size-s);
  color: var(--color-text-muted);
  font-style: italic;
  margin: 0;
}

/* Topic detail page — relations and article list */

[data-topic-relations] p {
  margin: 0;
  font-size: var(--font-size-s);
  color: var(--color-text-muted);
}

/* The relations sit in a <nav>, whose links are block items with padding by
   default; here they are words in a sentence. */
[data-topic-relations] a {
  display: inline;
  padding: 0;
  color: var(--color-interactive);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

[data-topic-relations] a:hover {
  background: none;
  color: var(--color-interactive-hover, var(--color-interactive));
}

section:has(> [data-topic-content]) > h2 {
  margin-block: 0 var(--size-m);
  font-size: var(--font-size-xl);
}

[data-topic-content] {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1.25rem;
}

[data-topic-content] article > h3 {
  margin-block: 0 var(--size-3xs);
  font-size: var(--font-size-l);
  line-height: 1.3;
}

[data-topic-content] article > time {
  display: block;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-block-end: 0.25rem;
}

[data-topic-content] article > p {
  margin-block: 0;
}

/* Article footer tag list — appears after page-info on guide/docs layouts */

footer[data-article-tags] {
  margin-block-start: 1.5rem;
  padding-block-start: 1rem;
  border-block-start: 1px solid var(--color-border);
}

/* Layout comes from data-layout="cluster" on the <ul>, which also resets
   the li + li flow spacing that offset the second chip. */
footer[data-article-tags] ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

footer[data-article-tags] li > a {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-s, 0.25rem);
  font-size: 0.875rem;
  text-decoration: none;
  color: inherit;
}

footer[data-article-tags] li > a:hover {
  background: color-mix(in oklch, currentColor 8%, transparent);
}
`;

export class GenerateTopicAssets {
  constructor({ data }) {
    this.data = data;
  }

  async init() {
    const cwd = process.cwd();
    const distDir = resolve(cwd, 'dist/pages');
    if (!existsSync(distDir)) return;

    /* topic-index.json snapshot — debug/inspection. The runtime contract is
       the per-li data-* attributes, not this file. */
    const index = this.data?.topicIndex;
    if (index) {
      await writeFile(
        resolve(distDir, 'topic-index.json'),
        JSON.stringify(index, null, 2) + '\n',
        'utf-8'
      );
      console.log(`  ✓ Generated topic-index.json (${index.count} topics)`);
    }

    /* Sort script + CSS. */
    const jsDir = resolve(distDir, 'js');
    const cssDir = resolve(distDir, 'css');
    await mkdir(jsDir, { recursive: true });
    await mkdir(cssDir, { recursive: true });
    await writeFile(resolve(jsDir, 'topic-sort.js'), SORT_SCRIPT, 'utf-8');
    await writeFile(resolve(cssDir, 'topic-index.css'), TOPIC_INDEX_CSS, 'utf-8');
    console.log('  ✓ Generated topic-sort.js + topic-index.css');
  }
}
