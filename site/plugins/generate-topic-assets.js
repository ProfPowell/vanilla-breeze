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

const SORT_SCRIPT = `(function enhanceTopicSort() {
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
    updated: 'Sorted by recently updated.',
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

const TOPIC_INDEX_CSS = `/* Topic index — sort controls + topic list. Selectors target data-* and
   native elements only; no class names. Loaded from /css/topic-index.css. */

[data-sort-controls] {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  border: 0;
  padding: 0;
  margin-block-end: 1rem;
}

[data-sort-controls] legend {
  font-weight: 600;
  margin-inline-end: 0.5rem;
}

[data-sort-controls] button {
  font: inherit;
  background: var(--color-surface, #fff);
  color: inherit;
  border: 1px solid var(--color-border, #d0d7de);
  border-radius: var(--radius-sm, 0.25rem);
  padding: 0.35rem 0.75rem;
  cursor: pointer;
}

[data-sort-controls] button[aria-pressed="true"] {
  background: var(--color-accent, #0969da);
  color: var(--color-on-accent, #fff);
  border-color: var(--color-accent, #0969da);
}

[data-sort-controls] button:hover:not([aria-pressed="true"]) {
  background: var(--color-surface-hover, #f6f8fa);
}

ul[data-topic-index] {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.25rem;
}

ul[data-topic-index] > li {
  border-block-end: 1px solid var(--color-border-subtle, #eaeef2);
}

ul[data-topic-index] > li > a {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 1rem;
  justify-content: space-between;
  padding: 0.6rem 0.25rem;
  text-decoration: none;
  color: inherit;
}

ul[data-topic-index] > li > a:hover {
  background: var(--color-surface-hover, #f6f8fa);
}

[data-topic-label] {
  font-weight: 600;
}

[data-topic-meta] {
  display: inline-flex;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-subtle, #57606a);
}

[data-topic-as-of] {
  font-size: 0.875rem;
  color: var(--color-text-subtle, #57606a);
  font-style: italic;
  margin-block-end: 0.5rem;
}

/* Topic detail page — relations and article list */

[data-topic-relations] p {
  font-size: 0.95rem;
  color: var(--color-text-subtle, #57606a);
}

[data-topic-content] {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1.25rem;
}

[data-topic-content] article > h3 {
  margin-block: 0 0.25rem;
}

[data-topic-content] article > time {
  display: block;
  font-size: 0.875rem;
  color: var(--color-text-subtle, #57606a);
  margin-block-end: 0.25rem;
}

[data-topic-content] article > p {
  margin-block: 0;
}

/* Article footer tag list — appears after page-info on guide/docs layouts */

footer[data-article-tags] {
  margin-block-start: 1.5rem;
  padding-block-start: 1rem;
  border-block-start: 1px solid var(--color-border-subtle, #eaeef2);
}

footer[data-article-tags] ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

footer[data-article-tags] li > a {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-border, #d0d7de);
  border-radius: var(--radius-sm, 0.25rem);
  font-size: 0.875rem;
  text-decoration: none;
  color: inherit;
}

footer[data-article-tags] li > a:hover {
  background: var(--color-surface-hover, #f6f8fa);
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
