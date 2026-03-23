# Navigation & Content Reference Patterns
## Specification for Vanilla Breeze

Four interrelated site-wide navigation and reference patterns. Each follows the Vanilla Breeze philosophy: semantic HTML first, CSS-only where possible, web component wrapper for progressive enhancement, CMS data model last.

---

## Table of Contents

- [Glossary](#glossary)
- [Site Index (Keyword Index)](#site-index)
- [Timeline / Changelog](#timeline--changelog)
- [Sitemap](#sitemap)
- [Shared Concerns](#shared-concerns)

---

## Glossary

### The HTML Semantic Stack

The glossary uses a precise, layered set of HTML elements that most developers underuse:

| Element | Role |
|---------|------|
| `<dl>` | The glossary list container |
| `<dt>` | The term (with `id` for deep-linking) |
| `<dd>` | The definition |
| `<dfn>` | Marks the *defining instance* of a term in running prose |
| `<abbr title="...">` | Abbreviation that references a glossary entry |

The critical insight: `<dfn>` belongs **in the glossary**, not just in prose. When used in prose, `<dfn>` marks where a term is first explained. The `id` on `<dt>` creates the deep-link target.

### Raw Markup

#### Glossary page structure

```html
<main>
  <h1>Glossary</h1>

  <!-- Jump navigation — CSS-only via anchor links -->
  <nav class="glossary-jump" aria-label="Jump to letter">
    <ol class="inline">
      <li><a href="#glossary-a">A</a></li>
      <li><a href="#glossary-b">B</a></li>
      <!-- ... generated for letters with entries -->
      <li><span aria-disabled="true">X</span></li> <!-- no entries -->
    </ol>
  </nav>

  <!-- Letter sections -->
  <section id="glossary-a" aria-labelledby="glossary-heading-a">
    <h2 id="glossary-heading-a">A</h2>

    <dl>
      <dt id="term-api">
        <dfn>API</dfn>
        <!-- Optionally: full form as abbr -->
        <small>(Application Programming Interface)</small>
      </dt>
      <dd>
        A defined interface allowing two software systems to communicate.
        See also: <a href="#term-endpoint">endpoint</a>, <a href="#term-rest">REST</a>.
      </dd>

      <dt id="term-attribute">
        <dfn>attribute</dfn>
      </dt>
      <dd>
        A name–value pair declared in HTML markup that configures element
        behaviour or provides metadata. Example: <code>data-variant="primary"</code>.
      </dd>
    </dl>
  </section>

  <section id="glossary-b" aria-labelledby="glossary-heading-b">
    <h2 id="glossary-heading-b">B</h2>
    <dl>
      <!-- terms... -->
    </dl>
  </section>
</main>
```

#### In-context usage (running prose in any page)

```html
<p>
  A <dfn><a href="/glossary#term-web-component">web component</a></dfn>
  is a custom element with encapsulated behaviour.
  Use <abbr title="Application Programming Interface">API</abbr> calls
  to fetch the data — see the <a href="/glossary#term-api">glossary entry</a>.
</p>
```

The `<dfn>` in prose signals "this is where I'm explaining this concept here" — it's an inline definition, not a duplicate of the glossary. Only one place should be the canonical `<dfn>` with an `id`; the glossary is that place.

### CSS Patterns

```css
/* glossary.css */
@layer components {

  /* Jump nav — compact alpha strip */
  .glossary-jump ol {
    font-variant-numeric: tabular-nums;
    font-size: var(--font-size-sm);
  }

  .glossary-jump [aria-disabled] {
    color: var(--color-text-disabled);
    pointer-events: none;
  }

  /* Letter heading — sticky as user scrolls */
  .glossary-section h2 {
    position: sticky;
    top: 0;
    background: var(--color-surface);
    padding-block: var(--size-xs);
    border-block-end: var(--border-width-thin) solid var(--color-border);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
    z-index: 1;
  }

  /* Term — prominent, linkable */
  dl dt {
    display: flex;
    align-items: baseline;
    gap: var(--size-xs);
    scroll-margin-top: var(--size-xl); /* clear sticky header */
  }

  dl dt dfn {
    font-size: var(--font-size-lg);
    font-style: normal;
    font-weight: var(--font-weight-semibold);
  }

  /* Highlight when navigated to via anchor */
  dl dt:target,
  dl dt:target + dd {
    background: oklch(from var(--color-interactive) l c h / 0.08);
    border-radius: var(--radius-s);
    outline: var(--border-width-medium) solid var(--color-interactive);
    outline-offset: var(--size-xs);
  }

  /* "See also" cross-reference links */
  dl dd a {
    font-style: italic;
    font-size: var(--font-size-sm);
  }
}
```

### Web Component: `glossary-index`

Wraps the static `<main>` to add:

- **Live search/filter** — hides non-matching `<section>` elements, no page reload
- **Active letter tracking** — highlights current letter in jump nav via scroll-spy
- **Deep-link toast** — copies anchor URL on `<dt>` click with `heading-links` pattern

```html
<glossary-index data-search-label="Filter terms…">
  <main>
    <!-- static glossary HTML above -->
  </main>
</glossary-index>
```

**Component behaviour:**
- No-JS: fully readable, jump nav works, anchor links work
- With JS: adds `<input type="search">` before `<main>`, filters by `<dt>` text content
- Scroll-spy sets `aria-current="true"` on the active letter in jump nav

### CMS Data Model

```yaml
# glossary-term.yaml
term: API                          # <dt> text content
slug: api                          # generates id="term-api"
fullForm: Application Programming Interface  # <small> expansion
definition: >                      # <dd> content (markdown → HTML)
  A defined interface allowing two software systems to communicate.
category: architecture             # optional grouping
seeAlso:
  - endpoint
  - rest
relatedPages:
  - /docs/api-reference
updatedAt: 2025-01-15
```

**CMS responsibilities:**
- Generate alphabetical grouping automatically from slugs
- Produce the jump nav (only include letters with entries)
- Enable "what pages link to this term?" backlink query
- Auto-insert `<abbr title="...">` in page content when glossary terms appear

---

## Site Index

A keyword/topic index aggregated from page taxonomy. The print-era concept of a book index, adapted for the web.

### HTML Semantics

The index is fundamentally a `<nav>` containing a structured list of terms, each linking to the pages where that topic appears. It differs from the glossary: the glossary *defines* terms; the index *locates* them.

```html
<main>
  <h1>Index</h1>

  <!-- Letter filter nav -->
  <nav class="index-jump" aria-label="Jump to letter">
    <ol class="inline">
      <li><a href="#index-a">A</a></li>
      <!-- ... -->
    </ol>
  </nav>

  <!-- Index body — nav for the list of terms -->
  <nav aria-label="Site index">

    <section id="index-a">
      <h2>A</h2>
      <ul>
        <li>
          <span class="index-term">accessibility</span>
          <ul class="index-refs">
            <li><a href="/docs/forms#accessibility">Forms — Accessibility</a></li>
            <li><a href="/docs/components/button#aria">Button — ARIA patterns</a></li>
            <li><a href="/blog/colour-contrast">Colour contrast in practice</a>
              <small>blog</small>
            </li>
          </ul>
        </li>

        <li>
          <span class="index-term">animation</span>
          <ul class="index-refs">
            <li><a href="/docs/tokens/motion">Motion tokens</a></li>
          </ul>
        </li>
      </ul>
    </section>

    <section id="index-b">
      <h2>B</h2>
      <!-- ... -->
    </section>

  </nav>
</main>
```

### Layout variants

**Single column** — default, mobile-first  
**Multi-column** — CSS `columns` property on the `<nav>` for wider viewports

```css
@layer components {

  .index-refs {
    margin-block-start: var(--size-3xs);
    padding-inline-start: var(--size-m);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    list-style: none;
  }

  .index-refs li {
    display: flex;
    align-items: baseline;
    gap: var(--size-xs);
    padding-block: var(--size-3xs);
  }

  .index-refs small {
    font-size: var(--font-size-xs);
    color: var(--color-text-disabled);
    background: var(--color-surface-raised);
    padding-inline: var(--size-2xs);
    border-radius: var(--radius-full);
  }

  /* Multi-column at wider viewports */
  @media (min-width: 60rem) {
    nav[aria-label="Site index"] {
      columns: 2;
      column-gap: var(--size-2xl);
    }

    nav[aria-label="Site index"] section {
      break-inside: avoid;
    }
  }
}
```

### Web Component: `site-index`

Adds filtering and can optionally load data from a JSON endpoint.

```html
<!-- Static HTML mode (recommended) -->
<site-index data-search-label="Filter index…">
  <nav aria-label="Site index">
    <!-- pre-rendered index HTML -->
  </nav>
</site-index>

<!-- Or: data-driven, hydrated from endpoint -->
<site-index data-src="/index.json">
  <!-- rendered by component -->
</site-index>
```

### CMS Data Model

Each page contributes index entries via its frontmatter:

```yaml
# page frontmatter
title: Building Accessible Forms
keywords:
  - accessibility
  - forms
  - ARIA
  - validation
  - input
tags:
  - tutorial
  - components
```

The CMS aggregates all `keywords` across all pages, sorts them alphabetically, deduplicates, and generates the index page. This is a **build-time** operation for static sites, or a **query** for server-rendered CMS.

---

## Timeline / Changelog

Time-organised content: site changelog, release notes, article history, or a content timeline.

### HTML Semantics

`<time datetime="">` is the semantic anchor. The `datetime` attribute provides machine-readable ISO 8601 dates — critical for RSS, microformats, and search engines.

```html
<main>
  <h1>Changelog</h1>

  <!-- Year grouping -->
  <section aria-labelledby="year-2025">
    <h2 id="year-2025">2025</h2>

    <!-- Month grouping -->
    <section aria-labelledby="month-2025-03">
      <h3 id="month-2025-03">
        <time datetime="2025-03">March 2025</time>
      </h3>

      <!-- Individual entry -->
      <article id="changelog-2025-03-15">
        <header>
          <time datetime="2025-03-15" class="datetime">15 March 2025</time>
          <h4>
            <a href="#changelog-2025-03-15">
              Glossary component released
            </a>
          </h4>
          <!-- Change type badges -->
          <ul class="inline change-badges" aria-label="Change types">
            <li><mark class="success">new</mark></li>
          </ul>
        </header>

        <div class="entry-body">
          <p>The <code>glossary-index</code> web component is now available,
          providing client-side filtering for definition lists.</p>

          <!-- Optional: specific changes as dl -->
          <dl class="change-list">
            <dt>Added</dt>
            <dd><ins>glossary-index web component</ins></dd>
            <dd><ins>CSS glossary jump navigation</ins></dd>

            <dt>Changed</dt>
            <dd>
              <del>dl[data-striped] zebra striping</del>
              <ins>dl[data-striped] now supports div-wrapped items</ins>
            </dd>
          </dl>
        </div>

        <footer>
          <a href="/docs/components/glossary" rel="related">
            View documentation →
          </a>
        </footer>
      </article>

    </section>
  </section>
</main>
```

### Key `<time>` patterns

```html
<!-- Full date -->
<time datetime="2025-03-15">15 March 2025</time>

<!-- Month only -->
<time datetime="2025-03">March 2025</time>

<!-- Year only -->
<time datetime="2025">2025</time>

<!-- Date + time -->
<time datetime="2025-03-15T14:30:00Z">15 March 2025 at 14:30 UTC</time>

<!-- Duration (e.g. "2 weeks ago") — rendered by JS, value stays accessible -->
<time datetime="2025-03-15" data-relative>2025-03-15</time>
```

### Last Updated Indicators

"Last updated" is a page-level metadata pattern — it belongs in the page itself, not only in the changelog. It makes the same `<time>` element do double duty: machine-readable for search engines and CMS queries, human-readable for users.

#### On individual pages

The canonical location is the page `<footer>`, inside an `<address>` or a `<p>`. `<address>` is the right element when the metadata relates to the document's authorship context.

```html
<!-- In the page <footer> — minimal -->
<footer>
  <p>
    <small>
      Last updated
      <time datetime="2025-03-15" data-relative>15 March 2025</time>
    </small>
  </p>
</footer>

<!-- With more context — author, version -->
<footer>
  <address>
    <small>
      Updated by <a rel="author" href="/team/jane">Jane Doe</a>
      on <time datetime="2025-03-15" data-relative>15 March 2025</time>
      — <a href="#page-history">view history</a>
    </small>
  </address>
</footer>

<!-- With version tag inline -->
<footer>
  <small>
    <time datetime="2025-03-15">15 March 2025</time>
    <span aria-hidden="true">·</span>
    <a href="/changelog#v1-4-0" class="version-tag">v1.4.0</a>
  </small>
</footer>
```

The `data-relative` attribute on `<time>` is picked up by the shared `time-relative.js` utility (see Shared Concerns) — no per-page JS needed.

#### Feeding the time-index

Pages expose their `lastModified` date via a `<meta>` tag and via the page footer `<time>`. The `time-index` web component on the changelog can optionally render a "Recently updated pages" feed sourced from a `/recently-updated.json` endpoint generated at build time.

```html
<!-- In <head> of every page -->
<meta name="last-modified" content="2025-03-15">

<!-- Schema.org for search engines -->
<script type="application/ld+json">
{
  "@type": "WebPage",
  "dateModified": "2025-03-15"
}
</script>
```

#### "Recently Updated" feed in the timeline

```html
<!-- A supplementary section at the top of the changelog page -->
<section aria-labelledby="recent-pages-heading">
  <h2 id="recent-pages-heading">Recently Updated Pages</h2>
  <ul class="recent-pages">
    <li>
      <a href="/docs/components/button">Button Component</a>
      <time datetime="2025-03-14" data-relative>14 March 2025</time>
    </li>
    <li>
      <a href="/docs/tokens/colour">Colour Tokens</a>
      <time datetime="2025-03-10" data-relative>10 March 2025</time>
    </li>
  </ul>
</section>
```

---

### Version-Tagged Grouping

Versions are a *classification layer* on top of the date timeline. A semver tag groups one or more dated entries into a named release. This creates two valid views of the same data: chronological (date-first) and release-oriented (version-first).

#### Version as a section anchor

```html
<main>
  <h1>Changelog</h1>

  <!-- Version jump nav — semantic complement to the date nav -->
  <nav aria-label="Jump to version">
    <ol class="inline version-list" reversed>
      <li><a href="#v1-4-0">v1.4.0</a></li>
      <li><a href="#v1-3-0">v1.3.0</a></li>
      <li><a href="#v1-2-1">v1.2.1</a></li>
      <li><a href="#v1-2-0">v1.2.0</a></li>
    </ol>
  </nav>

  <!-- Version-grouped section -->
  <section id="v1-4-0" aria-labelledby="version-1-4-0-heading">
    <header class="version-header">
      <hgroup>
        <h2 id="version-1-4-0-heading">
          <a href="#v1-4-0">v1.4.0</a>
        </h2>
        <p>
          Released <time datetime="2025-03-15">15 March 2025</time>
        </p>
      </hgroup>
      <ul class="inline change-badges" aria-label="What changed">
        <li><mark class="new">new</mark></li>
        <li><mark class="change">changed</mark></li>
      </ul>
    </header>

    <!-- Entries within this version, each still anchored by date -->
    <div class="changelog-entries">

      <article id="changelog-2025-03-15-glossary">
        <header>
          <time datetime="2025-03-15" class="datetime">15 March 2025</time>
          <h3><a href="#changelog-2025-03-15-glossary">Glossary component</a></h3>
          <mark class="new">new</mark>
        </header>
        <p>The <code>glossary-index</code> web component is now available.</p>
      </article>

      <article id="changelog-2025-03-12-dl-item">
        <header>
          <time datetime="2025-03-12" class="datetime">12 March 2025</time>
          <h3><a href="#changelog-2025-03-12-dl-item">dl-item web component</a></h3>
          <mark class="change">changed</mark>
        </header>
        <p>Striped variant now supports <code>div</code>-wrapped items.</p>
      </article>

    </div>
  </section>

  <section id="v1-3-0" aria-labelledby="version-1-3-0-heading">
    <!-- ... -->
  </section>
</main>
```

#### Per-page version history

Individual documentation pages can embed their own lightweight version history. This is the "small changes under a tag by date" pattern — not the full changelog, just a page-scoped record of what changed in this page's content and when.

```html
<!-- In the page body, typically near the footer or in an aside -->
<aside aria-labelledby="page-history-heading">
  <details id="page-history">
    <summary id="page-history-heading">
      Page history
    </summary>

    <ol reversed class="page-version-list">

      <li id="page-v1-4-0">
        <header>
          <a href="/changelog#v1-4-0" class="version-tag">v1.4.0</a>
          <time datetime="2025-03-15" data-relative>15 March 2025</time>
        </header>
        <p>Added <code>data-search-label</code> attribute documentation and live demo.</p>
      </li>

      <li id="page-v1-2-0">
        <header>
          <a href="/changelog#v1-2-0" class="version-tag">v1.2.0</a>
          <time datetime="2025-01-10">10 January 2025</time>
        </header>
        <p>Initial documentation page.</p>
      </li>

    </ol>
  </details>
</aside>
```

Key decisions here:
- `<ol reversed>` — list renders latest-first visually, but the DOM order (oldest-first) is preserved for screen readers following the logical sequence. Or swap: DOM latest-first, no `reversed`, depending on CMS output order preference.
- Each `<li>` has its own `id` (`page-v1-4-0`) enabling deep links from the main changelog to this page's specific version entry.
- The `<details>` is collapsed by default — this is supplementary metadata, not primary content.
- Version tags link *back* to the main changelog entry, creating bidirectional navigation.

#### Version badge CSS

```css
@layer components {

  /* Version number chip */
  .version-tag {
    display: inline-flex;
    align-items: center;
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-interactive);
    background: oklch(from var(--color-interactive) l c h / 0.1);
    padding-inline: var(--size-xs);
    padding-block: var(--size-3xs);
    border-radius: var(--radius-full);
    text-decoration: none;
    border: var(--border-width-thin) solid oklch(from var(--color-interactive) l c h / 0.25);
  }

  .version-tag:hover {
    background: oklch(from var(--color-interactive) l c h / 0.18);
  }

  /* Version section header */
  .version-header {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: var(--size-m);
    padding-block: var(--size-m);
    border-block-end: var(--border-width-medium) solid var(--color-border);
    margin-block-end: var(--size-m);
  }

  .version-header hgroup h2 {
    font-size: var(--font-size-2xl);
    font-family: var(--font-mono);
  }

  .version-header hgroup p {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin-block-start: var(--size-3xs);
  }

  /* Per-page version list */
  .page-version-list {
    list-style: none;
    padding-inline-start: 0;
    margin-block-start: var(--size-s);
    display: flex;
    flex-direction: column;
    gap: var(--size-s);
  }

  .page-version-list li {
    padding-block: var(--size-s);
    border-block-start: var(--border-width-thin) solid var(--color-border);
  }

  .page-version-list header {
    display: flex;
    align-items: center;
    gap: var(--size-s);
    margin-block-end: var(--size-xs);
  }

  .page-version-list time {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  /* Deep-linked version entry highlight */
  .page-version-list li:target {
    padding-inline: var(--size-m);
    background: oklch(from var(--color-interactive) l c h / 0.05);
    border-radius: var(--radius-s);
    scroll-margin-top: var(--size-xl);
  }
}
```

---

### CSS: Timeline visual

The timeline line is a pure CSS `::before` pseudo-element — no wrapper divs needed.

```css
@layer components {

  /* Timeline container */
  .changelog-entries {
    position: relative;
    padding-inline-start: var(--size-xl);
  }

  /* Vertical rule */
  .changelog-entries::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: calc(var(--size-s) - 1px);
    border-inline-start: var(--border-width-medium) solid var(--color-border);
  }

  /* Each entry */
  .changelog-entries article {
    position: relative;
    padding-block: var(--size-m);
  }

  /* Timeline dot */
  .changelog-entries article::before {
    content: "";
    position: absolute;
    inset-inline-start: calc(-1 * var(--size-xl) + var(--size-xs));
    inset-block-start: calc(var(--size-m) + var(--size-xs));
    width: var(--size-s);
    height: var(--size-s);
    border-radius: 50%;
    background: var(--color-interactive);
    border: var(--border-width-medium) solid var(--color-surface);
    outline: var(--border-width-thin) solid var(--color-border);
  }

  /* Change type badges */
  mark.new    { background: oklch(from var(--color-success) l c h / 0.15); }
  mark.change { background: oklch(from var(--color-warning) l c h / 0.15); }
  mark.fix    { background: oklch(from var(--color-info)    l c h / 0.15); }
  mark.remove { background: oklch(from var(--color-error)   l c h / 0.15); }

  /* Anchor highlight for deep-linked entries */
  article:target {
    background: oklch(from var(--color-interactive) l c h / 0.05);
    border-radius: var(--radius-m);
    padding-inline: var(--size-m);
    scroll-margin-top: var(--size-xl);
  }

  /* Sticky year/month headers */
  .changelog-year h2,
  .changelog-month h3 {
    position: sticky;
    top: 0;
    background: var(--color-surface);
    padding-block: var(--size-xs);
    z-index: 1;
  }
}
```

### Web Component: `time-index`

```html
<time-index data-group-by="month">
  <!-- static entries -->
</time-index>
```

**Behaviours:**
- `data-relative` on `<time>` elements: renders relative dates ("3 days ago"), updates on interval
- Year/month filter via `<select>` or button group
- Version filter: `data-filter-versions` enables a version-jump select
- "Latest first / Oldest first" sort toggle (re-orders `<section>` elements in DOM)
- View toggle: `data-view="date|version"` switches between date-first and version-first grouping
- RSS link generation pointing to `/feed.xml`
- `data-show-page-updates` — includes a "Recently Updated Pages" feed sourced from `data-updates-src`

```html
<!-- Full-featured usage -->
<time-index
  data-group-by="version"
  data-view="version"
  data-show-page-updates
  data-updates-src="/recently-updated.json"
>
  <!-- static pre-rendered HTML — progressive enhancement -->
</time-index>
```

### CMS Data Model

```yaml
# changelog-entry.yaml
title: Glossary component released
date: 2025-03-15                   # sort key, "last updated" for this entry
changeTypes:
  - new                            # new | changed | fixed | removed | deprecated
summary: >
  The glossary-index web component is now available.
body: |                            # markdown to HTML
  Provides client-side filtering for definition lists.
relatedDocs:
  - /docs/components/glossary
version: 1.4.0                     # semver tag - groups entries into a release section
```

```yaml
# version-release.yaml - top-level version record
version: 1.4.0
releaseDate: 2025-03-15            # date of the section header
status: stable                     # stable | beta | deprecated
entries:                           # ordered list of changelog entry IDs in this release
  - changelog-2025-03-15-glossary
  - changelog-2025-03-12-dl-item
notes: >
  First release with full reference navigation system.
```

```yaml
# page.yaml - per-page CMS frontmatter
title: Glossary Component
path: /docs/components/glossary
lastModified: 2025-03-15           # feeds footer time and meta name=last-modified
pageHistory:
  - version: 1.4.0
    date: 2025-03-15
    summary: Added web component usage examples and live demo.
  - version: 1.2.0
    date: 2025-01-10
    summary: Initial documentation page.
```

**CMS responsibilities for versioning:**
- Aggregate all entries per `version` tag to build the version-grouped view
- Generate the version jump nav (sorted by semver descending)
- For each page with `pageHistory`, render the collapsible `<aside>` version list
- Build `/recently-updated.json` at build time: pages sorted by `lastModified` desc
- Backlink: from the main changelog `#v1-4-0` entry, link to `page.html#page-v1-4-0` and vice versa

---

## Sitemap

An HTML sitemap (distinct from `sitemap.xml`) gives users and search engines a browsable, hierarchical view of site structure.

### HTML Semantics

Nested `<nav>` + `<ul>` is the correct pattern. For deep hierarchies, `<details>`/`<summary>` enables collapsible sections without JavaScript.

```html
<main>
  <h1>Sitemap</h1>

  <nav aria-label="Full site map">
    <ul>
      <li>
        <a href="/">Home</a>
      </li>

      <li>
        <!-- Collapsible section via details — no JS needed -->
        <details open>
          <summary>Documentation</summary>
          <ul>
            <li><a href="/docs/">Overview</a></li>

            <li>
              <details>
                <summary>Components</summary>
                <ul>
                  <li><a href="/docs/components/button">Button</a></li>
                  <li><a href="/docs/components/form">Form</a></li>
                  <li>
                    <details>
                      <summary>Navigation</summary>
                      <ul>
                        <li><a href="/docs/components/nav">Nav</a></li>
                        <li><a href="/docs/components/breadcrumb">Breadcrumb</a></li>
                      </ul>
                    </details>
                  </li>
                </ul>
              </details>
            </li>

            <li>
              <details>
                <summary>Tokens</summary>
                <ul>
                  <li><a href="/docs/tokens/colour">Colour</a></li>
                  <li><a href="/docs/tokens/spacing">Spacing</a></li>
                  <li><a href="/docs/tokens/typography">Typography</a></li>
                </ul>
              </details>
            </li>
          </ul>
        </details>
      </li>

      <li>
        <details>
          <summary>Blog</summary>
          <ul>
            <li><a href="/blog/">All posts</a></li>
            <li><a href="/blog/tag/tutorial">Tutorials</a></li>
            <li><a href="/blog/tag/release">Releases</a></li>
          </ul>
        </details>
      </li>

      <li><a href="/glossary">Glossary</a></li>
      <li><a href="/index">Index</a></li>
      <li><a href="/changelog">Changelog</a></li>
    </ul>
  </nav>
</main>
```

### CSS: Tree structure

```css
@layer components {

  nav[aria-label="Full site map"] ul {
    list-style: none;
    padding-inline-start: var(--size-m);
    border-inline-start: var(--border-width-thin) solid var(--color-border);
  }

  /* Root level — no indent, no border */
  nav[aria-label="Full site map"] > ul {
    padding-inline-start: 0;
    border-inline-start: none;
  }

  nav[aria-label="Full site map"] li {
    padding-block: var(--size-3xs);
    position: relative;
  }

  /* Connector tick mark */
  nav[aria-label="Full site map"] ul li::before {
    content: "";
    position: absolute;
    inset-inline-start: calc(-1 * var(--size-m));
    inset-block-start: calc(var(--size-m) + var(--size-xs));
    width: var(--size-s);
    border-block-start: var(--border-width-thin) solid var(--color-border);
  }

  /* Collapsible section trigger */
  nav[aria-label="Full site map"] details > summary {
    cursor: pointer;
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
    padding-block: var(--size-2xs);
    list-style: none; /* remove default marker */
    display: flex;
    align-items: center;
    gap: var(--size-xs);
  }

  /* Custom expand indicator */
  nav[aria-label="Full site map"] details > summary::before {
    content: "+";
    display: inline-block;
    width: 1em;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }

  nav[aria-label="Full site map"] details[open] > summary::before {
    content: "−";
  }

  /* Current page indicator */
  nav[aria-label="Full site map"] [aria-current="page"] {
    color: var(--color-interactive);
    font-weight: var(--font-weight-medium);
  }
}
```

### Web Component: `site-map`

```html
<!-- Static HTML enhanced -->
<site-map data-current-page="/docs/components/button">
  <nav aria-label="Full site map">
    <!-- pre-rendered nav HTML -->
  </nav>
</site-map>

<!-- Data-driven from sitemap JSON -->
<site-map data-src="/sitemap.json" data-current-page="/docs/components/button">
</site-map>
```

**Behaviours:**
- Marks `aria-current="page"` on the current page link
- Auto-opens `<details>` ancestors of the current page
- Expand/collapse all buttons
- Optional: live search within the map
- Optional: hydrate from `/sitemap.xml` (parsed client-side)

### CMS Data Model

```yaml
# page frontmatter
title: Button Component
path: /docs/components/button
section: Documentation > Components
order: 1
includeInSitemap: true
lastModified: 2025-03-15
```

The CMS or build tool generates the tree by grouping pages by their `section` path, sorted by `order`, filtered by `includeInSitemap`.

---

## Shared Concerns

### The Four Pages as a System

These four patterns are complementary and cross-link:

| Pattern | Answers | Links to |
|---------|---------|----------|
| Glossary | What does this mean? | Pages where terms are used |
| Index | Where is this topic covered? | Page sections (anchor links) |
| Changelog | What changed and when? | Docs, blog posts, releases |
| Sitemap | What's on this site? | Every page |

All four should be linked from the site footer and from any `<nav>` labelled "Site utilities".

### URL Conventions

```
/glossary               Glossary index
/glossary#term-api      Deep link to specific term
/index                  Site keyword index
/index#index-a          Jump to letter A
/changelog              Full timeline (date view, latest first)
/changelog#v1-4-0       Jump to version section
/changelog#changelog-2025-03-15  Specific dated entry
/sitemap                HTML sitemap
```

Per-page deep links to version history follow the pattern `page-slug#page-vMAJOR-MINOR-PATCH`:

```
/docs/components/button#page-v1-4-0   Specific version entry on a page
```

### Shared CSS layer

Define a `@layer navigation-patterns` for all four pages' styles, loaded only when needed:

```html
<!-- In <head> on each page type -->
<link rel="stylesheet" href="/css/glossary.css">
<link rel="stylesheet" href="/css/timeline.css">
```

### Shared `<time>` component behaviour

All four pages may need relative time rendering. Extract this into a shared behaviour rather than per-component:

```js
// time-relative.js — tiny, shared utility
// Finds all <time data-relative> and updates their textContent
// Runs on DOMContentLoaded and every 60s
```

### `<meta>` and SEO

Each page should declare its `<link rel="...">` relationships:

```html
<!-- On any content page -->
<link rel="glossary" href="/glossary">
<link rel="index" href="/index">
<link rel="sitemap" href="/sitemap.xml" type="application/xml">

<!-- On changelog -->
<link rel="alternate" href="/feed.xml" type="application/rss+xml" title="Changelog feed">
```

### Progressive Enhancement Summary

| Feature | No JS | With JS |
|---------|-------|---------|
| Glossary jump nav | Anchor links | Scroll-spy active state |
| Glossary filtering | Not available | Live `<input>` filter |
| Index multi-column | CSS columns | — |
| Index filtering | Not available | Live filter |
| Timeline dates | Static ISO dates | Relative ("3 days ago") |
| Timeline grouping | Pre-rendered HTML | Filter by year/month or version |
| Version view toggle | Date-first HTML | Switch to version-first grouping |
| Per-page version history | `<details>` collapsed | Deep-link to/from main changelog |
| Last updated | Static `<time>` in footer | Relative rendering via shared utility |
| Sitemap collapse | `<details>` native | Auto-open current section |
| Sitemap current page | Static `aria-current` | Dynamic from `location` |

### Vanilla Breeze Component Naming

Following the `-wc` convention for web component wrappers:

| CSS-only class/attribute | Web Component |
|--------------------------|---------------|
| `dl` + `.glossary-jump` | `glossary-index` |
| `nav[aria-label="Site index"]` | `site-index` |
| `.changelog-entries` | `time-index` |
| `nav[aria-label="Full site map"]` | `site-map` |

The CSS-only styling lives in `src/native-elements/` and `src/custom-elements/`. The web components live in `src/web-components/` following existing patterns.
