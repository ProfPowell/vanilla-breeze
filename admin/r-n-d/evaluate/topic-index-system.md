# Vanilla Breeze Tag and Topic Index

> **Status: Adopted (2026-04-27).** See [decisions.md](./decisions.md). Implementation is tracked in sequence beads S3 (SKOS Topic Index) and S4 (`topic-map` SKOS upgrade).

A platform-native tag and topic index pattern for content-oriented websites. This system provides sortable, filterable navigation over a site's SKOS vocabulary, with sort dimensions including alphabetical, usage count, popularity (views within a time period), creation date, and last update date. It is a core navigation mechanism that complements the glossary system.

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Relationship to the Glossary System](#relationship-to-the-glossary-system)
- [Architecture Overview](#architecture-overview)
- [Data Layer: topic-index.json](#data-layer-topic-indexjson)
- [Data Sources and Aggregation](#data-sources-and-aggregation)
- [Topic Index Page Markup](#topic-index-page-markup)
- [Sort Controls](#sort-controls)
- [Progressive Enhancement: Client-Side Sorting](#progressive-enhancement-client-side-sorting)
- [Topic Detail Page Markup](#topic-detail-page-markup)
- [Tag Links in Content Pages](#tag-links-in-content-pages)
- [Structured Data and Head Metadata](#structured-data-and-head-metadata)
- [Analytics Integration](#analytics-integration)
- [SSG Build Steps](#ssg-build-steps)
- [CSS Conventions](#css-conventions)
- [Accessibility Requirements](#accessibility-requirements)
- [File Structure](#file-structure)
- [Extension Points](#extension-points)

## Design Philosophy

The tag/topic index is a **navigation pattern**, not a taxonomy browser. Its job is to help users find content by concept. The glossary answers "what does this term mean?" The topic index answers "what can I read about this?"

The same progressive enhancement model applies:

1. **Build time** generates a fully functional, pre-sorted static HTML page. The default sort is alphabetical. No JavaScript is required to use the index.
2. **Data attributes** on each topic entry carry the sort dimensions (usage count, view count, dates) so that client-side re-sorting requires no additional data fetch.
3. **A small script** reads those data attributes and re-orders the DOM when the user changes sort. No framework, no virtual DOM, no state management library.
4. **Custom elements** are not used. The entire pattern is `<nav>`, `<ul>`, `<li>`, `<a>`, `<time>`, and `data-*` attributes. A custom element is warranted only if interactive behavior grows beyond what the sort script provides.

## Relationship to the Glossary System

The glossary and the topic index share `vocabulary.json` as their source of truth. They are two views of the same data.

| Concern | Glossary | Topic Index |
|---------|----------|-------------|
| Primary question | What does this mean? | What content exists about this? |
| Root element | `<dl data-glossary>` | `<ul data-topic-index>` |
| Entry content | Definition, relations | Content count, popularity, dates |
| Links to | Concept page or inline popover | Topic detail page listing content |
| Sort default | Alphabetical only | Alphabetical, switchable |

Both systems reference the same concept identifiers. A concept's `@id` in `vocabulary.json` is the slug used in the glossary (`#term-{id}`), the topic index (`/topics/{id}`), and inline references (`data-concept="{id}"`).

## Architecture Overview

```
vocabulary.json              ← concept definitions, hierarchy, relations
content pages (frontmatter)  ← each page declares its concept tags
analytics data               ← page view counts per concept (optional)
        │
        ├──▸ topic-index.json      ← aggregated metadata per concept
        ├──▸ /topics/index.html    ← sortable topic index page
        ├──▸ /topics/[slug].html   ← topic detail pages (content listings)
        └──▸ <head> metadata       ← <link rel="tag"> on content pages
```

The build step joins vocabulary data with content metadata and optional analytics to produce the topic index. Everything resolves at build time. The client-side script only re-sorts what is already in the DOM.

## Data Layer: topic-index.json

A build-time artifact that aggregates metadata about each concept. This file powers the topic index page and is embedded as `data-*` attributes on each list item. It is not fetched client-side.

```json
{
  "generated": "2026-02-10T12:00:00Z",
  "topics": [
    {
      "id": "progressive-enhancement",
      "label": "Progressive Enhancement",
      "slug": "progressive-enhancement",
      "href": "/topics/progressive-enhancement",
      "contentCount": 12,
      "viewCount": 4350,
      "viewPeriod": "30d",
      "createdAt": "2025-06-15",
      "updatedAt": "2026-02-08",
      "broader": "web-development",
      "group": "P"
    },
    {
      "id": "semantic-html",
      "label": "Semantic HTML",
      "slug": "semantic-html",
      "href": "/topics/semantic-html",
      "contentCount": 8,
      "viewCount": 2100,
      "viewPeriod": "30d",
      "createdAt": "2025-06-15",
      "updatedAt": "2026-01-20",
      "broader": "web-development",
      "group": "S"
    },
    {
      "id": "accessibility",
      "label": "Accessibility",
      "slug": "accessibility",
      "href": "/topics/accessibility",
      "contentCount": 15,
      "viewCount": 6200,
      "viewPeriod": "30d",
      "createdAt": "2025-06-10",
      "updatedAt": "2026-02-09",
      "broader": "web-development",
      "group": "A"
    },
    {
      "id": "css-architecture",
      "label": "CSS Architecture",
      "slug": "css-architecture",
      "href": "/topics/css-architecture",
      "contentCount": 5,
      "viewCount": 980,
      "viewPeriod": "30d",
      "createdAt": "2025-08-01",
      "updatedAt": "2026-01-15",
      "broader": "web-development",
      "group": "C"
    }
  ]
}
```

### Field Definitions

| Field | Source | Description |
|-------|--------|-------------|
| `id` | `vocabulary.json` `@id` | Concept identifier, used as slug |
| `label` | `vocabulary.json` `skos:prefLabel` | Display name |
| `slug` | Derived from `id` | URL path segment |
| `href` | Derived | Full path to topic detail page |
| `contentCount` | Build-time aggregation | Number of content pages tagged with this concept |
| `viewCount` | Analytics data (optional) | Total page views across all content tagged with this concept within the view period |
| `viewPeriod` | Configuration | Time window for view count aggregation (e.g., `30d`, `7d`, `90d`) |
| `createdAt` | Earliest content page date | ISO date of the first published content tagged with this concept |
| `updatedAt` | Latest content page date | ISO date of the most recently updated content tagged with this concept |
| `broader` | `vocabulary.json` `skos:broader` | Parent concept slug, used for optional hierarchy display |
| `group` | Derived from `label` | First letter, used for alphabetical grouping |

### Analytics Data: Required vs Optional

View count data comes from an external analytics source. If analytics data is not available, the `viewCount` field defaults to `0` and the popularity sort option is hidden from the UI. The system must function fully without analytics. The sort script checks for the presence of non-zero view data before showing the popularity sort control.

## Data Sources and Aggregation

The build step joins three data sources to produce `topic-index.json`.

### Source 1: vocabulary.json

Provides concept identifiers, labels, alternate labels, hierarchy, and relations. This is the same file used by the glossary system.

### Source 2: Content Page Frontmatter

Every content page declares its concept associations in frontmatter:

```yaml
---
title: "Progressive Enhancement in Practice"
date: 2026-02-08
concepts:
  - progressive-enhancement
  - semantic-html
---
```

The build step scans all content pages and counts how many reference each concept. It also tracks the earliest `date` (becomes `createdAt`) and the latest `date` (becomes `updatedAt`) for each concept.

### Source 3: Analytics Data (Optional)

A static JSON file or API endpoint that provides view counts per URL or per concept. The format is flexible but must resolve to a count per concept identifier. Example:

```json
{
  "period": "30d",
  "views": {
    "progressive-enhancement": 4350,
    "semantic-html": 2100,
    "accessibility": 6200,
    "css-architecture": 980
  }
}
```

If this file does not exist, the build step proceeds without it and sets all `viewCount` values to `0`.

### Aggregation Logic

For each concept in `vocabulary.json`:

1. Count the number of content pages whose frontmatter `concepts` array includes this concept's `id`. This becomes `contentCount`.
2. Find the minimum `date` among those pages. This becomes `createdAt`.
3. Find the maximum `date` among those pages. This becomes `updatedAt`.
4. Look up the concept's `id` in the analytics data. This becomes `viewCount`.
5. Concepts with `contentCount` of `0` are excluded from the topic index. They exist in the vocabulary but have no content yet. The gap analysis tool (see glossary system extension points) can surface these.

## Topic Index Page Markup

The topic index is a `<nav>` containing a `<ul>`. Each topic is a `<li>` carrying all sort dimensions as `data-*` attributes. The default rendered sort order is alphabetical.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Topics — Site Name</title>
  <meta name="description"
        content="Browse all topics covered on the site. Sort by name, popularity, or recency.">
  <link rel="canonical" href="/topics">
  <link rel="glossary" href="/glossary">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Topics",
    "description": "Browse all topics covered on the site.",
    "url": "/topics",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": 4,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "url": "/topics/accessibility",
          "name": "Accessibility"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "url": "/topics/css-architecture",
          "name": "CSS Architecture"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "url": "/topics/progressive-enhancement",
          "name": "Progressive Enhancement"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "url": "/topics/semantic-html",
          "name": "Semantic HTML"
        }
      ]
    }
  }
  </script>

  <link rel="stylesheet" href="/css/topic-index.css">
</head>
<body>
  <main>
    <h1>Topics</h1>

    <!-- Sort controls — functional only with JS -->
    <fieldset data-sort-controls hidden>
      <legend>Sort by</legend>
      <button data-sort="alpha" aria-pressed="true">A–Z</button>
      <button data-sort="count" aria-pressed="false">Most written</button>
      <button data-sort="views" aria-pressed="false">Most read</button>
      <button data-sort="updated" aria-pressed="false">Recently updated</button>
      <button data-sort="created" aria-pressed="false">Oldest first</button>
    </fieldset>

    <!-- Active sort description for screen readers -->
    <p aria-live="polite" data-sort-status class="visually-hidden">
      Sorted alphabetically.
    </p>

    <!-- The topic list -->
    <nav aria-label="Topics">
      <ul data-topic-index>

        <li data-concept="accessibility"
            data-label="Accessibility"
            data-count="15"
            data-views="6200"
            data-created="2025-06-10"
            data-updated="2026-02-09"
            data-group="A">
          <a href="/topics/accessibility">
            <span data-topic-label>Accessibility</span>
            <span data-topic-meta>
              <span data-topic-count>15 articles</span>
              <time data-topic-updated datetime="2026-02-09">Updated Feb 9</time>
            </span>
          </a>
        </li>

        <li data-concept="css-architecture"
            data-label="CSS Architecture"
            data-count="5"
            data-views="980"
            data-created="2025-08-01"
            data-updated="2026-01-15"
            data-group="C">
          <a href="/topics/css-architecture">
            <span data-topic-label>CSS Architecture</span>
            <span data-topic-meta>
              <span data-topic-count>5 articles</span>
              <time data-topic-updated datetime="2026-01-15">Updated Jan 15</time>
            </span>
          </a>
        </li>

        <li data-concept="progressive-enhancement"
            data-label="Progressive Enhancement"
            data-count="12"
            data-views="4350"
            data-created="2025-06-15"
            data-updated="2026-02-08"
            data-group="P">
          <a href="/topics/progressive-enhancement">
            <span data-topic-label>Progressive Enhancement</span>
            <span data-topic-meta>
              <span data-topic-count>12 articles</span>
              <time data-topic-updated datetime="2026-02-08">Updated Feb 8</time>
            </span>
          </a>
        </li>

        <li data-concept="semantic-html"
            data-label="Semantic HTML"
            data-count="8"
            data-views="2100"
            data-created="2025-06-15"
            data-updated="2026-01-20"
            data-group="S">
          <a href="/topics/semantic-html">
            <span data-topic-label>Semantic HTML</span>
            <span data-topic-meta>
              <span data-topic-count>8 articles</span>
              <time data-topic-updated datetime="2026-01-20">Updated Jan 20</time>
            </span>
          </a>
        </li>

      </ul>
    </nav>
  </main>

  <script src="/js/topic-sort.js"></script>
</body>
</html>
```

### Markup Rules

- The root list is `<ul data-topic-index>` inside a `<nav aria-label="Topics">`.
- Each `<li>` carries all sort dimensions as `data-*` attributes. The data is in the DOM, not in a separate file. The sort script reads the DOM, not a JSON endpoint.
- The `<a>` inside each `<li>` wraps the entire entry so the full row is clickable.
- `<span data-topic-label>` contains the display name.
- `<span data-topic-meta>` contains secondary information: article count and last updated date.
- The `<time>` element uses a machine-readable `datetime` attribute and a human-friendly text content.
- `data-views` is always present but may be `"0"`. The sort script checks for this.
- Sort controls are a `<fieldset>` with `hidden` attribute. JS removes `hidden` to reveal them. Without JS, users see the alphabetical list with no sort controls — a complete, usable page.

### Why Not a Table

A table would be semantically reasonable for a multi-column sortable dataset. However, the topic index is primarily a navigation aid — a list of links — not a data table. The secondary metadata (count, date) supports the navigation decision but is not the primary content. A `<nav>` with `<ul>` is the correct semantic. If the index grows to show many columns of comparable data (views, bounce rate, avg time), a `<table>` variant becomes warranted.

## Sort Controls

### Markup

```html
<fieldset data-sort-controls hidden>
  <legend>Sort by</legend>
  <button data-sort="alpha" aria-pressed="true">A–Z</button>
  <button data-sort="count" aria-pressed="false">Most written</button>
  <button data-sort="views" aria-pressed="false">Most read</button>
  <button data-sort="updated" aria-pressed="false">Recently updated</button>
  <button data-sort="created" aria-pressed="false">Oldest first</button>
</fieldset>
```

### Behavior Rules

- `<fieldset>` starts with `hidden` attribute. The sort script removes it on initialization.
- Each `<button>` has a `data-sort` value that maps to a `data-*` attribute on the `<li>` elements.
- `aria-pressed="true"` indicates the active sort. The script updates this when the user changes sort.
- The "Most read" button (`data-sort="views"`) is only revealed if any `<li>` has a `data-views` value greater than `"0"`. If no analytics data exists, this button remains hidden.
- A live region (`aria-live="polite"`) announces the current sort to screen readers when it changes.

### Sort Dimension Mapping

| Button `data-sort` | `<li>` attribute | Sort type | Direction |
|---------------------|------------------|-----------|-----------|
| `alpha` | `data-label` | String, case-insensitive | Ascending (A→Z) |
| `count` | `data-count` | Numeric | Descending (most first) |
| `views` | `data-views` | Numeric | Descending (most first) |
| `updated` | `data-updated` | Date string (ISO) | Descending (newest first) |
| `created` | `data-created` | Date string (ISO) | Ascending (oldest first) |

## Progressive Enhancement: Client-Side Sorting

The sort script reads `data-*` attributes from the DOM and reorders `<li>` elements within the existing `<ul>`. No data is fetched. No elements are created or destroyed.

### Sort Script

```js
(function enhanceTopicSort() {
  const controls = document.querySelector('[data-sort-controls]');
  const list = document.querySelector('ul[data-topic-index]');
  if (!controls || !list) return;

  const items = () => Array.from(list.querySelectorAll(':scope > li'));
  const statusEl = document.querySelector('[data-sort-status]');

  // Check if views data is available
  const hasViews = items().some(li => parseInt(li.dataset.views, 10) > 0);
  const viewsButton = controls.querySelector('[data-sort="views"]');
  if (!hasViews && viewsButton) {
    viewsButton.hidden = true;
  }

  // Reveal controls
  controls.hidden = false;

  const sortFns = {
    alpha: (a, b) =>
      a.dataset.label.localeCompare(b.dataset.label, undefined, { sensitivity: 'base' }),

    count: (a, b) =>
      parseInt(b.dataset.count, 10) - parseInt(a.dataset.count, 10),

    views: (a, b) =>
      parseInt(b.dataset.views, 10) - parseInt(a.dataset.views, 10),

    updated: (a, b) =>
      b.dataset.updated.localeCompare(a.dataset.updated),

    created: (a, b) =>
      a.dataset.created.localeCompare(b.dataset.created)
  };

  const statusMessages = {
    alpha: 'Sorted alphabetically.',
    count: 'Sorted by most articles.',
    views: 'Sorted by most read.',
    updated: 'Sorted by recently updated.',
    created: 'Sorted by oldest first.'
  };

  function applySort(key) {
    const fn = sortFns[key];
    if (!fn) return;

    const sorted = items().sort(fn);

    // Reorder DOM — no destroy/create, just move
    sorted.forEach(li => list.append(li));

    // Update aria-pressed
    controls.querySelectorAll('button[data-sort]').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.sort === key);
    });

    // Announce to screen readers
    if (statusEl) {
      statusEl.textContent = statusMessages[key] || `Sorted by ${key}.`;
    }
  }

  controls.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-sort]');
    if (!button) return;
    applySort(button.dataset.sort);
  });
})();
```

### Script Design Notes

- The script uses `list.append(li)` to reorder. This moves existing DOM nodes without destroying and recreating them. Event listeners, focus state, and scroll position are preserved.
- Sort functions compare `data-*` attribute values directly. String comparison works for ISO dates because ISO 8601 sorts lexicographically.
- The `items()` function re-queries each time to ensure it always reflects the current DOM order.
- No debounce is needed because sort is triggered by button click, not continuous input.
- The script is approximately 50 lines. If it grows beyond 80 lines (adding features like secondary sort, sort direction toggle, or URL state), it should be promoted to a web component.

## Topic Detail Page Markup

Each topic has a detail page at `/topics/{slug}` that lists all content tagged with that concept. This page is generated at build time from the vocabulary and content frontmatter.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Progressive Enhancement — Topics — Site Name</title>
  <meta name="description"
        content="Articles and resources about progressive enhancement.">
  <meta name="concept" content="progressive-enhancement">
  <link rel="canonical" href="/topics/progressive-enhancement">
  <link rel="up" href="/topics">
  <link rel="glossary" href="/glossary">
  <link rel="tag" href="/concepts/progressive-enhancement">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Progressive Enhancement",
    "description": "Articles and resources about progressive enhancement.",
    "url": "/topics/progressive-enhancement",
    "about": {
      "@type": "DefinedTerm",
      "name": "Progressive Enhancement",
      "inDefinedTermSet": "/vocabulary"
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": 3,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "url": "/articles/progressive-enhancement-in-practice",
          "name": "Progressive Enhancement in Practice"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "url": "/articles/css-only-interactions",
          "name": "CSS-Only Interactions"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "url": "/articles/building-without-javascript",
          "name": "Building Without JavaScript"
        }
      ]
    }
  }
  </script>

  <link rel="stylesheet" href="/css/topic-detail.css">
</head>
<body>
  <main>
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="/topics" rel="up">Topics</a></li>
        <li aria-current="page">Progressive Enhancement</li>
      </ol>
    </nav>

    <h1>Progressive Enhancement</h1>

    <!-- Brief definition from vocabulary — links to glossary for full entry -->
    <p data-topic-definition>
      A strategy that emphasizes core content first, then layers on
      presentation and behavior.
      <a href="/glossary#term-progressive-enhancement">See glossary →</a>
    </p>

    <!-- Concept graph context -->
    <nav aria-label="Related topics" data-topic-relations>
      <p>
        Part of:
          <a href="/topics/web-development"
             rel="up"
             data-relation="skos:broader"
             data-concept="web-development">Web Development</a> ·
        Related:
          <a href="/topics/accessibility"
             rel="related"
             data-relation="skos:related"
             data-concept="accessibility">Accessibility</a>,
          <a href="/topics/semantic-html"
             rel="related"
             data-relation="skos:related"
             data-concept="semantic-html">Semantic HTML</a>
      </p>
    </nav>

    <!-- Content listing, ordered by date descending -->
    <section aria-label="Articles about progressive enhancement">
      <h2>Articles</h2>
      <ol data-topic-content reversed>
        <li>
          <article>
            <h3>
              <a href="/articles/progressive-enhancement-in-practice">
                Progressive Enhancement in Practice
              </a>
            </h3>
            <time datetime="2026-02-08">February 8, 2026</time>
            <p>A hands-on guide to building resilient interfaces
               using the web platform.</p>
          </article>
        </li>
        <li>
          <article>
            <h3>
              <a href="/articles/css-only-interactions">
                CSS-Only Interactions
              </a>
            </h3>
            <time datetime="2026-01-10">January 10, 2026</time>
            <p>Interactive patterns that work without JavaScript using
               modern CSS features.</p>
          </article>
        </li>
        <li>
          <article>
            <h3>
              <a href="/articles/building-without-javascript">
                Building Without JavaScript
              </a>
            </h3>
            <time datetime="2025-11-20">November 20, 2025</time>
            <p>How far can you get with HTML and CSS alone?</p>
          </article>
        </li>
      </ol>
    </section>
  </main>
</body>
</html>
```

### Topic Detail Page Rules

- The page includes a brief definition from `vocabulary.json`, with a link to the glossary for the full entry. This bridges the two systems.
- Concept graph navigation (broader, related) is shown as a `<nav>` with `rel` and `data-relation` attributes, following the same conventions as the glossary.
- Content is listed in reverse chronological order using `<ol reversed>`.
- Each content item is an `<article>` with heading, date, and description.
- The `<meta name="concept">` in the head and `<link rel="tag">` connect this page to the vocabulary, same as any content page.

## Tag Links in Content Pages

Content pages display their concept tags as links to the topic index. These appear at the top or bottom of the article.

### Markup

```html
<footer data-article-tags>
  <h2 class="visually-hidden">Topics</h2>
  <ul>
    <li>
      <a href="/topics/progressive-enhancement"
         rel="tag"
         data-concept="progressive-enhancement">Progressive Enhancement</a>
    </li>
    <li>
      <a href="/topics/semantic-html"
         rel="tag"
         data-concept="semantic-html">Semantic HTML</a>
    </li>
  </ul>
</footer>
```

### Tag Link Rules

- Tags use `rel="tag"` — a standard microformat that browsers and crawlers understand.
- Tags use `data-concept` for analytics integration.
- The list is inside a `<footer>` scoped to the article. The heading is visually hidden but available to screen readers.
- Tags link to the **topic detail page** (`/topics/{slug}`), not to the glossary. The user wants to find more content, not read a definition.

## Structured Data and Head Metadata

### On the Topic Index Page

```html
<head>
  <link rel="canonical" href="/topics">
  <link rel="glossary" href="/glossary">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Topics",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [ ... ]
    }
  }
  </script>
</head>
```

### On Topic Detail Pages

```html
<head>
  <meta name="concept" content="progressive-enhancement">
  <link rel="canonical" href="/topics/progressive-enhancement">
  <link rel="up" href="/topics">
  <link rel="glossary" href="/glossary">
  <link rel="tag" href="/concepts/progressive-enhancement">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "about": {
      "@type": "DefinedTerm",
      "name": "Progressive Enhancement",
      "inDefinedTermSet": "/vocabulary"
    },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [ ... ]
    }
  }
  </script>
</head>
```

### On Content Pages (Article Tags)

```html
<head>
  <link rel="tag" href="/concepts/progressive-enhancement">
  <link rel="tag" href="/concepts/semantic-html">
</head>
```

These `<link rel="tag">` elements in the `<head>` are the machine-readable declaration that this content is about these concepts. They complement the visible tag links in the article footer.

## Analytics Integration

The topic index participates in the same concept-aware analytics as the glossary. No separate analytics script is needed.

### Events Captured

All links in the topic index and topic detail pages carry `data-concept` and/or `data-relation` attributes. The site-wide analytics script captures:

- **Topic index clicks:** Which topics users navigate to from the index. The `data-concept` on each `<li>` identifies the topic.
- **Sort interactions:** Which sort the user selects. The sort script can optionally emit an event:

```js
document.dispatchEvent(new CustomEvent('vb:sort', {
  detail: { index: 'topics', sort: key }
}));
```

- **Topic detail navigation:** Which broader/related topics users navigate to from a topic detail page. Captured via `data-relation` on the concept graph links.
- **Tag clicks from articles:** Which tag links users click from content pages. Captured via `data-concept` on the tag links in the article footer.

### Feeding Back into the Index

View count data collected by analytics feeds back into the build via the analytics data source described in the data sources section. This creates a feedback loop: popular topics surface higher when sorted by "Most read", which drives more discovery, which generates more analytics data. The loop operates on a build cadence (daily, weekly) rather than in real time.

## SSG Build Steps

### Step 1: Load Vocabulary

Read `vocabulary.json` and make it available as global data. Shared with the glossary system.

### Step 2: Scan Content Frontmatter

Iterate all content pages. For each page, read the `concepts` array from frontmatter. Build a map of concept ID → list of content pages (with title, date, description, URL).

### Step 3: Load Analytics Data (Optional)

Read the analytics data file if it exists. Build a map of concept ID → view count.

### Step 4: Generate topic-index.json

For each concept in the vocabulary that has at least one content page, compute `contentCount`, `viewCount`, `createdAt`, and `updatedAt`. Output `topic-index.json`. This file is used by the build templates and is not served as a static asset (unlike `definitions.json` which is served client-side).

### Step 5: Generate Topic Index Page

Render `/topics/index.html` using the topic index template. Sort entries alphabetically for the default render. Embed all sort dimensions as `data-*` attributes on each `<li>`. Include the sort controls with `hidden`. Include the JSON-LD `CollectionPage`.

### Step 6: Generate Topic Detail Pages

For each concept with content, render `/topics/{slug}/index.html`. Include the definition from vocabulary, the concept graph navigation, and the content listing sorted by date descending. Include the JSON-LD `CollectionPage` with `ItemList`.

### Step 7: Inject Tag Links into Content Pages

For each content page, render the article footer tag list from the page's frontmatter `concepts` array, resolved against the vocabulary for display labels.

### Step 8: Copy Static Assets

Copy `topic-sort.js` and `topic-index.css` to the output directory.

## CSS Conventions

All selectors target `data-*` attributes and native elements. No class names are required.

```css
/* Topic index list */
ul[data-topic-index] {
  list-style: none;
  padding: 0;
}

ul[data-topic-index] > li {
  border-block-end: 1px solid light-dark(#e8e8e8, #333);
}

ul[data-topic-index] > li > a {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding-block: 0.625rem;
  text-decoration: none;
  color: inherit;
}

ul[data-topic-index] > li > a:hover {
  background: light-dark(#f5f5f5, #222);
}

ul[data-topic-index] [data-topic-label] {
  font-weight: 600;
}

ul[data-topic-index] [data-topic-meta] {
  display: flex;
  gap: 1rem;
  font-size: 0.85em;
  color: light-dark(#666, #999);
  white-space: nowrap;
}

/* Sort controls */
fieldset[data-sort-controls] {
  border: none;
  padding: 0;
  margin-block-end: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: center;
}

fieldset[data-sort-controls] legend {
  font-weight: 600;
  margin-inline-end: 0.5rem;
  float: left;
}

fieldset[data-sort-controls] button {
  font: inherit;
  font-size: 0.85em;
  padding: 0.25rem 0.625rem;
  border: 1px solid light-dark(#ccc, #555);
  border-radius: 0.25rem;
  background: light-dark(#fff, #1a1a1a);
  cursor: pointer;
}

fieldset[data-sort-controls] button[aria-pressed="true"] {
  background: light-dark(#222, #eee);
  color: light-dark(#fff, #111);
  border-color: light-dark(#222, #eee);
}

/* Article tag links */
footer[data-article-tags] ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

footer[data-article-tags] a {
  display: inline-block;
  font-size: 0.85em;
  padding: 0.125rem 0.5rem;
  border: 1px solid light-dark(#ccc, #555);
  border-radius: 0.25rem;
  text-decoration: none;
  color: inherit;
}

footer[data-article-tags] a:hover {
  background: light-dark(#f0f0f0, #333);
}

/* Topic detail — concept relations */
nav[data-topic-relations] {
  font-size: 0.9em;
  color: light-dark(#555, #aaa);
  margin-block-end: 1.5rem;
}

/* Topic detail — content listing */
ol[data-topic-content] {
  list-style: none;
  padding: 0;
}

ol[data-topic-content] > li {
  border-block-end: 1px solid light-dark(#e8e8e8, #333);
  padding-block: 0.75rem;
}

ol[data-topic-content] time {
  font-size: 0.85em;
  color: light-dark(#666, #999);
}

/* Utility */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Accessibility Requirements

- Sort controls use `<fieldset>` with `<legend>` for grouping. Screen readers announce "Sort by" as the group label.
- Active sort is indicated by `aria-pressed="true"` on the active button.
- Sort changes are announced via `aria-live="polite"` region.
- Sort controls are hidden without JS. The page is fully usable in its default alphabetical order without sort functionality.
- Topic links are full `<a>` elements wrapping the entire row, providing a large click/tap target.
- Tag links use `rel="tag"` which has semantic meaning for assistive tools and crawlers.
- Breadcrumbs on topic detail pages use `aria-label="Breadcrumb"` and `aria-current="page"`.
- Content listing uses `<article>` elements with proper heading hierarchy (`<h2>` for section, `<h3>` for each item).
- The "Most read" sort button is hidden when no analytics data exists, preventing user confusion.

## File Structure

```
project/
├── _data/
│   ├── vocabulary.json          # Shared with glossary system
│   └── analytics.json           # Optional: view count data
├── _includes/
│   ├── topic-index-head.njk     # <head> metadata for index page
│   ├── topic-detail-head.njk    # <head> metadata for detail pages
│   └── article-tags.njk         # Tag links partial for content pages
├── topics/
│   ├── index.njk                # Topic index page template
│   └── [slug].njk               # Topic detail page template (dynamic)
├── js/
│   └── topic-sort.js            # Client-side sort script
├── css/
│   └── topic-index.css          # Topic index and detail styles
└── _build/
    └── generate-topic-index.js  # Builds topic-index.json from sources
```

## Extension Points

### Secondary Sort

Currently each sort dimension is independent. A secondary sort (e.g., alphabetical within same view count) could be added to the sort functions without changing the markup or data attributes. The script grows but the pattern stays the same.

### Sort Direction Toggle

Each sort button could toggle between ascending and descending on repeated clicks. This adds a `data-sort-direction` attribute to the button and flips the comparator. Warranted if users need to see "least written" or "Z-A" orderings.

### URL State for Sort

The active sort could be reflected in the URL hash (`/topics#sort=views`) so that sort preference survives page reloads and can be shared as a link. This is a small addition to the sort script: read `location.hash` on init, update it on sort change.

### Filtered Topic Index

A search/filter input similar to the glossary filter could be added. It would hide `<li>` elements whose `data-label` does not match the query. Same progressive enhancement pattern: hidden input revealed by JS, filtering by toggling `hidden` attribute.

### Hierarchical Topic Index

Instead of a flat list, the index could render a tree reflecting the `skos:broader`/`skos:narrower` hierarchy from the vocabulary. This would use nested `<ul>` elements with `data-broader` attributes. The sort script would need to handle tree reordering, which significantly increases complexity. This is a candidate for promotion to a `<vb-topic-tree>` web component.

### Time Period Selector for Popularity

The view count aggregation period (currently set at build time) could be made selectable by the user. This would require multiple `data-views-*` attributes (e.g., `data-views-7d`, `data-views-30d`, `data-views-90d`) and a control to switch between them. The sort script would read the selected period's attribute. The build step would need to generate counts for each period.

### Integration with Persona Journeys

Topic detail pages could show suggested reading order based on persona journeys defined in the persona/story data. A "junior developer" persona with a journey through progressive-enhancement → semantic-html → accessibility would surface as a "Suggested path" section on the topic detail page. This is a build-time template addition, not a runtime feature.
