/**
 * @file generate-topics.js
 * @description Before-pass Cook plugin. Aggregates concept tags from source
 * pages (frontmatter `concepts: [id, …]`), joins them with vocabulary.json
 * and the optional analytics viewCount snapshot, then writes the topic-index
 * source pages so Cook can render them with the full docs layout treatment.
 *
 * Outputs (into the source tree, gitignored):
 *   site/src/pages/topics/index.html              ← sortable topic index
 *   site/src/pages/topics/{slug}/index.html       ← per-concept detail pages
 *
 * The index page embeds every sort dimension as data-* attributes on its
 * <li> elements; topic-sort.js (shipped by generate-topic-assets.js) reads
 * them at runtime. Detail pages list the articles tagged with the concept,
 * sorted by date descending, with broader/related concept navigation.
 *
 * Spec: admin/r-n-d/evaluate/topic-index-system.md
 * Analytics contract: admin/specs/analytics-viewcount-v1.md
 */

import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = resolve(__dirname, '..');
const PAGES_SRC = resolve(SITE_ROOT, 'src/pages');
const TOPICS_OUT = resolve(SITE_ROOT, 'src/pages/topics');
const VOCAB_PATH = resolve(SITE_ROOT, 'src/_data/vocabulary.json');
const ANALYTICS_PATH = resolve(SITE_ROOT, 'src/_data/views.json');

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseFrontmatter(text) {
  const match = text.match(FRONTMATTER_RE);
  if (!match) return null;
  const fm = {};
  const yaml = match[1];
  for (const rawLine of yaml.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((s) =>
        s.trim().replace(/^["']|["']$/g, '')
      ).filter(Boolean);
    } else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fm[key] = value;
  }
  return fm;
}

async function* walkPages(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'topics') continue; /* don't re-scan our own output */
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkPages(path);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      yield path;
    }
  }
}

function urlFromSrcPath(file) {
  const rel = relative(PAGES_SRC, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  return '/' + rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
}

function pickDate(fm) {
  return fm.published || fm.date || fm.lastModified || '';
}

function fmtDateLong(iso) {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

function fmtDateShort(iso) {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

async function loadJsonIfExists(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(await readFile(path, 'utf-8'));
  } catch {
    return null;
  }
}

function viewsForConcept(analytics, id) {
  if (!analytics) return 0;
  if (analytics.views && typeof analytics.views[id] === 'number') return analytics.views[id];
  if (analytics.viewsByPeriod) {
    const periods = Object.values(analytics.viewsByPeriod);
    if (periods[0]?.views?.[id]) return periods[0].views[id];
  }
  return 0;
}

function aggregateTopicIndex({ vocabulary, pages, analytics }) {
  const conceptById = new Map(
    (vocabulary.concepts || []).map((c) => [c['@id'], c])
  );

  /* concept @id → { contentCount, createdAt, updatedAt, articles: [] } */
  const tally = new Map();
  for (const page of pages) {
    const concepts = Array.isArray(page.concepts) ? page.concepts : [];
    for (const id of concepts) {
      if (!conceptById.has(id)) continue;
      let entry = tally.get(id);
      if (!entry) {
        entry = { contentCount: 0, createdAt: '9999-12-31', updatedAt: '0000-01-01', articles: [] };
        tally.set(id, entry);
      }
      entry.contentCount += 1;
      const date = page.date || '';
      if (date && date < entry.createdAt) entry.createdAt = date;
      if (date && date > entry.updatedAt) entry.updatedAt = date;
      entry.articles.push(page);
    }
  }

  const period = analytics?.period || '30d';

  const topics = [];
  for (const [id, entry] of tally) {
    if (entry.contentCount === 0) continue;
    const concept = conceptById.get(id);
    const label = concept['skos:prefLabel'] || id;
    topics.push({
      id,
      label,
      slug: id,
      href: `/topics/${id}/`,
      contentCount: entry.contentCount,
      viewCount: viewsForConcept(analytics, id),
      viewPeriod: period,
      createdAt: entry.createdAt === '9999-12-31' ? '' : entry.createdAt,
      updatedAt: entry.updatedAt === '0000-01-01' ? '' : entry.updatedAt,
      broader: concept['skos:broader'] || '',
      group: label.charAt(0).toUpperCase(),
      definition: concept['skos:definition'] || '',
      related: Array.isArray(concept['skos:related']) ? concept['skos:related'] : [],
      narrower: Array.isArray(concept['skos:narrower']) ? concept['skos:narrower'] : [],
      articles: entry.articles
        .slice()
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    });
  }

  topics.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

  const generated = new Date().toISOString();
  return {
    '@version': 1,
    generated,
    period,
    periodStart: analytics?.periodStart || '',
    periodEnd: analytics?.periodEnd || '',
    source: analytics?.source || '',
    count: topics.length,
    topics
  };
}

function renderTopicIndexBody(index, conceptById) {
  const items = index.topics.map((t) => {
    const updatedAttr = t.updatedAt || '';
    const createdAttr = t.createdAt || '';
    const updatedHuman = updatedAttr ? fmtDateShort(updatedAttr) : '';
    const updatedTime = updatedHuman
      ? `<time data-topic-updated datetime="${escHtml(updatedAttr)}">Updated ${escHtml(updatedHuman)}</time>`
      : '';
    return `        <li data-concept="${escHtml(t.id)}"
            data-label="${escHtml(t.label)}"
            data-count="${t.contentCount}"
            data-views="${t.viewCount}"
            data-created="${escHtml(createdAttr)}"
            data-updated="${escHtml(updatedAttr)}"
            data-group="${escHtml(t.group)}">
          <a href="${escHtml(t.href)}" data-concept="${escHtml(t.id)}">
            <span data-topic-label>${escHtml(t.label)}</span>
            <span data-topic-meta>
              <span data-topic-count>${t.contentCount} ${t.contentCount === 1 ? 'article' : 'articles'}</span>
              ${updatedTime}
            </span>
          </a>
        </li>`;
  }).join('\n');

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Topics',
    description: 'Browse all topics covered on the site.',
    url: '/topics/',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: index.topics.length,
      itemListElement: index.topics.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: t.href,
        name: t.label
      }))
    }
  };

  const ldJson = JSON.stringify(itemListLd, null, 2)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026');

  const dataAsOf = index.periodEnd
    ? `<p data-topic-as-of>Popularity data as of ${escHtml(fmtDateShort(index.periodEnd))} (${escHtml(index.period)} window).</p>`
    : '';

  return `<template slot="extraHead">
<script type="application/ld+json">
${ldJson}
</script>
</template>

<section data-layout="center" data-layout-max="wide" data-layout-gap="l">
  <h1>Topics</h1>
  <p class="lead">Every concept the documentation covers, with article counts and recency. Sort by name, popularity, or date.</p>

  <fieldset data-sort-controls hidden>
    <legend>Sort by</legend>
    <button type="button" data-sort="alpha" aria-pressed="true">A–Z</button>
    <button type="button" data-sort="count" aria-pressed="false">Most written</button>
    <button type="button" data-sort="views" aria-pressed="false">Most read</button>
    <button type="button" data-sort="updated" aria-pressed="false">Recently updated</button>
    <button type="button" data-sort="created" aria-pressed="false">Oldest first</button>
  </fieldset>

  <p aria-live="polite" data-sort-status class="visually-hidden">
    Sorted alphabetically.
  </p>

  ${dataAsOf}

  <nav aria-label="Topics">
    <ul data-topic-index>
${items}
    </ul>
  </nav>
</section>
`;
}

function renderTopicDetailBody(topic, conceptById) {
  const articleListItems = topic.articles.map((a) => {
    const dateAttr = a.date || '';
    const dateHuman = dateAttr ? fmtDateLong(dateAttr) : '';
    const time = dateHuman
      ? `<time datetime="${escHtml(dateAttr)}">${escHtml(dateHuman)}</time>`
      : '';
    const description = a.description ? `<p>${escHtml(a.description)}</p>` : '';
    return `      <li>
        <article>
          <h3><a href="${escHtml(a.url)}">${escHtml(a.title || a.url)}</a></h3>
          ${time}
          ${description}
        </article>
      </li>`;
  }).join('\n');

  const broaderLink = topic.broader && conceptById.has(topic.broader)
    ? `<a href="/topics/${escHtml(topic.broader)}/" rel="up" data-relation="skos:broader" data-concept="${escHtml(topic.broader)}">${escHtml(conceptById.get(topic.broader)['skos:prefLabel'])}</a>`
    : '';

  const relatedLinks = topic.related
    .filter((id) => conceptById.has(id))
    .map((id) => {
      const c = conceptById.get(id);
      return `<a href="/topics/${escHtml(id)}/" rel="related" data-relation="skos:related" data-concept="${escHtml(id)}">${escHtml(c['skos:prefLabel'])}</a>`;
    });

  const narrowerLinks = topic.narrower
    .filter((id) => conceptById.has(id))
    .map((id) => {
      const c = conceptById.get(id);
      return `<a href="/topics/${escHtml(id)}/" data-relation="skos:narrower" data-concept="${escHtml(id)}">${escHtml(c['skos:prefLabel'])}</a>`;
    });

  const relationsParts = [];
  if (broaderLink) relationsParts.push(`Part of: ${broaderLink}`);
  if (narrowerLinks.length) relationsParts.push(`Includes: ${narrowerLinks.join(', ')}`);
  if (relatedLinks.length) relationsParts.push(`Related: ${relatedLinks.join(', ')}`);
  const relationsBlock = relationsParts.length
    ? `<nav aria-label="Related topics" data-topic-relations>
    <p>${relationsParts.join(' · ')}</p>
  </nav>`
    : '';

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: topic.label,
    description: `Articles tagged with ${topic.label}.`,
    url: topic.href,
    about: {
      '@type': 'DefinedTerm',
      name: topic.label,
      termCode: topic.id,
      inDefinedTermSet: '/vocabulary.json'
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: topic.articles.length,
      itemListElement: topic.articles.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: a.url,
        name: a.title || a.url
      }))
    }
  };

  const ldJson = JSON.stringify(itemListLd, null, 2)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026');

  return `<template slot="extraHead">
<link rel="up" href="/topics/">
<link rel="tag" href="/topics/${escHtml(topic.id)}/">
<script type="application/ld+json">
${ldJson}
</script>
</template>

<section data-layout="center" data-layout-max="wide" data-layout-gap="l">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ol>
      <li><a href="/topics/" rel="up">Topics</a></li>
      <li><span aria-current="page">${escHtml(topic.label)}</span></li>
    </ol>
  </nav>

  <h1>${escHtml(topic.label)}</h1>

  ${topic.definition
    ? `<p data-topic-definition class="lead">${escHtml(topic.definition)} <a href="/glossary/#term-${escHtml(topic.id)}" data-concept="${escHtml(topic.id)}">See glossary →</a></p>`
    : `<p class="lead"><a href="/glossary/#term-${escHtml(topic.id)}" data-concept="${escHtml(topic.id)}">See glossary →</a></p>`}

  ${relationsBlock}

  <section aria-label="Articles about ${escHtml(topic.label)}">
    <h2>Articles (${topic.articles.length})</h2>
    <ol data-topic-content reversed>
${articleListItems}
    </ol>
  </section>
</section>
`;
}

function indexFrontmatter(label) {
  return `---
layout: docs
title: "Topics"
description: "Every concept the Vanilla Breeze documentation covers, with article counts and recency. Sort by name, popularity, or date."
currentSection: explore
currentPath: /topics/
author: "Thomas A. Powell"
authorUrl: "/team/tpowell/"
published: "2026-04-27"
lastModified: "2026-04-27"
keywords: ["topics", "concepts", "navigation", "skos"]
license: "CC BY 4.0"
licenseUrl: "https://creativecommons.org/licenses/by/4.0/"
provenance: "human"
review: "editor-reviewed"
status: "published"
concepts: ["content-lens"]
---
`;
}

function detailFrontmatter(topic) {
  const description = `Articles in the Vanilla Breeze documentation tagged with ${topic.label}.`;
  return `---
layout: docs
title: "${topic.label}"
description: "${description.replace(/"/g, '\\"')}"
currentSection: explore
currentPath: /topics/${topic.slug}/
author: "Thomas A. Powell"
authorUrl: "/team/tpowell/"
published: "2026-04-27"
lastModified: "2026-04-27"
keywords: ["${topic.label.replace(/"/g, '\\"')}", "topic", "concepts"]
license: "CC BY 4.0"
licenseUrl: "https://creativecommons.org/licenses/by/4.0/"
provenance: "human"
review: "editor-reviewed"
status: "published"
concepts: ["${topic.id}"]
---
`;
}

export class GenerateTopics {
  constructor({ data }) {
    this.data = data;
  }

  async init() {
    /* 1. Load vocabulary. */
    if (!existsSync(VOCAB_PATH)) {
      console.log('  ! generate-topics: vocabulary.json not found, skipping');
      return;
    }
    const vocabulary = JSON.parse(await readFile(VOCAB_PATH, 'utf-8'));

    /* 2. Scan source pages for frontmatter concepts:[]. */
    const pages = [];
    for await (const file of walkPages(PAGES_SRC)) {
      let raw;
      try {
        raw = await readFile(file, 'utf-8');
      } catch {
        continue;
      }
      const fm = parseFrontmatter(raw);
      if (!fm) continue;
      const concepts = Array.isArray(fm.concepts) ? fm.concepts : [];
      if (!concepts.length) continue;
      pages.push({
        url: urlFromSrcPath(file),
        title: fm.title || '',
        description: fm.description || '',
        date: pickDate(fm),
        concepts
      });
    }

    /* 3. Optional analytics. */
    const analytics = await loadJsonIfExists(ANALYTICS_PATH);

    /* 4. Aggregate. */
    const index = aggregateTopicIndex({ vocabulary, pages, analytics });

    /* Stash on data context for the after-pass plugin. */
    this.data.topicIndex = index;

    /* 5. Reset and rewrite the topics output dir. */
    if (existsSync(TOPICS_OUT)) {
      await rm(TOPICS_OUT, { recursive: true, force: true });
    }
    await mkdir(TOPICS_OUT, { recursive: true });

    /* 6. Write /topics/index.html. */
    const conceptById = new Map(
      (vocabulary.concepts || []).map((c) => [c['@id'], c])
    );
    const indexBody = renderTopicIndexBody(index, conceptById);
    await writeFile(
      join(TOPICS_OUT, 'index.html'),
      indexFrontmatter() + '\n' + indexBody,
      'utf-8'
    );

    /* 7. Write /topics/{slug}/index.html for each concept-with-content. */
    for (const topic of index.topics) {
      const dir = join(TOPICS_OUT, topic.slug);
      await mkdir(dir, { recursive: true });
      const body = renderTopicDetailBody(topic, conceptById);
      await writeFile(
        join(dir, 'index.html'),
        detailFrontmatter(topic) + '\n' + body,
        'utf-8'
      );
    }

    console.log(`  ✓ Generated topics index + ${index.topics.length} detail pages`);
  }
}
