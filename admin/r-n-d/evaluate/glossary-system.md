# Vanilla Breeze Glossary System

> **Status: Adopted (2026-04-27).** See [decisions.md](./decisions.md). Implementation is tracked in sequence beads S1 (SKOS Foundation) and S2 (SKOS Glossary).

A platform-native glossary pattern for content-oriented websites. This system uses standard HTML elements, JSON-LD structured data, `rel` attributes, and `data-*` attributes to create a semantically rich, progressively enhanced glossary that is derived from a SKOS-based site vocabulary.

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Architecture Overview](#architecture-overview)
- [Data Layer: vocabulary.json](#data-layer-vocabularyjson)
- [Data Layer: definitions.json](#data-layer-definitionsjson)
- [Glossary Page Markup](#glossary-page-markup)
- [Inline Term References](#inline-term-references)
- [Progressive Enhancement: Definition Popover](#progressive-enhancement-definition-popover)
- [Glossary Search Filter](#glossary-search-filter)
- [Structured Data and Head Metadata](#structured-data-and-head-metadata)
- [Analytics Integration](#analytics-integration)
- [SSG Build Steps](#ssg-build-steps)
- [CSS Conventions](#css-conventions)
- [Accessibility Requirements](#accessibility-requirements)
- [File Structure](#file-structure)
- [Extension Points](#extension-points)

## Design Philosophy

The glossary system follows the Vanilla Breeze progressive enhancement model. Every layer must degrade cleanly to the layer below it.

1. **Vocabulary data** is a static JSON-LD file using SKOS concepts. It is the single source of truth for all terms, definitions, and concept relationships.
2. **HTML output** uses only native elements: `<dl>`, `<dt>`, `<dd>`, `<dfn>`, `<a>`, `<nav>`. No custom elements are needed for the core glossary.
3. **Semantic attributes** use `rel` for standard web relationships and `data-*` for SKOS-specific semantics that the platform does not natively express.
4. **JavaScript enhancement** is optional. Without it, every term is a working link to the glossary page. With it, definitions appear in a native popover anchored to the term.
5. **Custom elements** are introduced only when interactive behavior exceeds what a small script can handle, such as a full vocabulary editor or interactive concept tree.

No frameworks, no build-time CSS processing, and no npm packages are required. The SSG (11ty or Astro) reads the vocabulary file and generates the HTML at build time.

## Architecture Overview

```
vocabulary.json          ← single source of truth (SKOS ConceptScheme)
       │
       ├──▸ definitions.json     ← lightweight subset for client-side popover
       ├──▸ /glossary/index.html ← full glossary page (<dl> with all terms)
       ├──▸ /concepts/[slug]     ← concept hub pages (optional)
       ├──▸ <head> metadata      ← <link rel="glossary">, JSON-LD on every page
       └──▸ inline <dfn> links   ← terms in article content link to glossary
                │
                └──▸ popover.js  ← progressive enhancement, shows definition inline
```

The vocabulary file flows downward through the build. Nothing flows upward. The glossary page, the definitions file, the head metadata, and the inline term links are all derived artifacts.

## Data Layer: vocabulary.json

This is the site's concept vocabulary expressed as a SKOS ConceptScheme in JSON-LD. It lives at the project root or in a `_data` / `src/data` directory depending on the SSG.

```json
{
  "@context": {
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "schema": "https://schema.org/",
    "@base": "https://example.com/concepts/"
  },
  "@type": "skos:ConceptScheme",
  "@id": "https://example.com/vocabulary",
  "skos:prefLabel": "Site Vocabulary",
  "skos:hasTopConcept": ["web-development", "design", "accessibility"],
  "concepts": [
    {
      "@id": "web-development",
      "@type": "skos:Concept",
      "skos:prefLabel": "Web Development",
      "skos:altLabel": ["webdev", "web dev"],
      "skos:definition": "The practice of building websites and web applications using standard web technologies.",
      "skos:narrower": ["progressive-enhancement", "semantic-html", "css-architecture"],
      "skos:related": ["design"]
    },
    {
      "@id": "progressive-enhancement",
      "@type": "skos:Concept",
      "skos:prefLabel": "Progressive Enhancement",
      "skos:altLabel": ["PE"],
      "skos:definition": "A strategy that emphasizes core content first, then layers on presentation and behavior as the client supports them.",
      "skos:broader": "web-development",
      "skos:related": ["accessibility", "semantic-html"]
    },
    {
      "@id": "semantic-html",
      "@type": "skos:Concept",
      "skos:prefLabel": "Semantic HTML",
      "skos:definition": "Using HTML elements according to their meaning rather than their appearance.",
      "skos:broader": "web-development",
      "skos:related": ["accessibility", "progressive-enhancement"]
    },
    {
      "@id": "accessibility",
      "@type": "skos:Concept",
      "skos:prefLabel": "Accessibility",
      "skos:altLabel": ["a11y"],
      "skos:definition": "The practice of making web content usable by everyone, regardless of ability or circumstance.",
      "skos:broader": "web-development",
      "skos:related": ["semantic-html", "progressive-enhancement"]
    },
    {
      "@id": "design",
      "@type": "skos:Concept",
      "skos:prefLabel": "Design",
      "skos:definition": "The intentional arrangement of visual and interactive elements to serve user needs.",
      "skos:related": ["web-development", "accessibility"]
    },
    {
      "@id": "css-architecture",
      "@type": "skos:Concept",
      "skos:prefLabel": "CSS Architecture",
      "skos:definition": "Organizing CSS with layers, custom properties, and naming conventions to create maintainable stylesheets.",
      "skos:broader": "web-development",
      "skos:related": ["design"]
    }
  ]
}
```

### Vocabulary File Rules

- Every concept has a unique `@id` that doubles as a URL slug.
- `skos:prefLabel` is the canonical display name.
- `skos:altLabel` contains synonyms and abbreviations used for search matching and auto-linking.
- `skos:definition` is the human-readable definition shown in the glossary and popover.
- `skos:broader`, `skos:narrower`, and `skos:related` express the concept graph topology.
- The file is human-editable, version-controllable, and portable across SSGs.

## Data Layer: definitions.json

A lightweight subset of vocabulary.json generated at build time. This file is fetched client-side by the popover enhancement script. It contains only what the popover needs: term, definition, and a link back to the glossary.

```json
{
  "web-development": {
    "term": "Web Development",
    "definition": "The practice of building websites and web applications using standard web technologies.",
    "href": "/glossary#term-web-development"
  },
  "progressive-enhancement": {
    "term": "Progressive Enhancement",
    "definition": "A strategy that emphasizes core content first, then layers on presentation and behavior as the client supports them.",
    "href": "/glossary#term-progressive-enhancement"
  },
  "semantic-html": {
    "term": "Semantic HTML",
    "definition": "Using HTML elements according to their meaning rather than their appearance.",
    "href": "/glossary#term-semantic-html"
  },
  "accessibility": {
    "term": "Accessibility",
    "definition": "The practice of making web content usable by everyone, regardless of ability or circumstance.",
    "href": "/glossary#term-accessibility"
  },
  "design": {
    "term": "Design",
    "definition": "The intentional arrangement of visual and interactive elements to serve user needs.",
    "href": "/glossary#term-design"
  },
  "css-architecture": {
    "term": "CSS Architecture",
    "definition": "Organizing CSS with layers, custom properties, and naming conventions to create maintainable stylesheets.",
    "href": "/glossary#term-css-architecture"
  }
}
```

### Generation Rule

The build step iterates over `vocabulary.json` concepts and outputs a flat object keyed by concept `@id` with only `term` (from `skos:prefLabel`), `definition` (from `skos:definition`), and `href` (constructed as `/glossary#term-{@id}`).

## Glossary Page Markup

The glossary page is the canonical rendering of the full vocabulary. It uses `<dl>` (definition list) as the root structure. Terms are grouped alphabetically by first letter.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Glossary — Site Name</title>
  <meta name="description" content="Definitions of key terms and concepts used across the site.">
  <link rel="canonical" href="/glossary">
  <link rel="alternate" type="application/ld+json" href="/vocabulary.json">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "name": "Site Name Glossary",
    "url": "/glossary",
    "hasDefinedTerm": [
      {
        "@type": "DefinedTerm",
        "@id": "/concepts/accessibility",
        "name": "Accessibility",
        "description": "The practice of making web content usable by everyone, regardless of ability or circumstance.",
        "inDefinedTermSet": "/vocabulary"
      },
      {
        "@type": "DefinedTerm",
        "@id": "/concepts/css-architecture",
        "name": "CSS Architecture",
        "description": "Organizing CSS with layers, custom properties, and naming conventions to create maintainable stylesheets.",
        "inDefinedTermSet": "/vocabulary"
      }
    ]
  }
  </script>

  <link rel="stylesheet" href="/css/glossary.css">
</head>
<body>
  <main>
    <h1>Glossary</h1>

    <!-- Alphabetical index navigation -->
    <nav aria-label="Glossary index">
      <ul>
        <li><a href="#letter-A">A</a></li>
        <li><a href="#letter-C">C</a></li>
        <li><a href="#letter-D">D</a></li>
        <li><a href="#letter-P">P</a></li>
        <li><a href="#letter-S">S</a></li>
        <li><a href="#letter-W">W</a></li>
      </ul>
    </nav>

    <!-- Search filter — hidden by default, revealed by JS -->
    <input type="search"
           aria-label="Filter glossary terms"
           placeholder="Filter terms..."
           data-glossary-filter
           hidden>

    <!-- The glossary definition list -->
    <dl data-glossary>

      <div id="letter-A" data-glossary-group="A">
        <dt id="term-accessibility">
          <dfn>
            <a href="/concepts/accessibility"
               data-concept="accessibility">Accessibility</a>
          </dfn>
        </dt>
        <dd>
          <p>The practice of making web content usable by everyone,
             regardless of ability or circumstance.</p>
          <p data-relations>
            <small>
              Also known as: a11y ·
              Broader:
                <a href="/concepts/web-development"
                   rel="up"
                   data-relation="skos:broader">Web Development</a> ·
              Related:
                <a href="/concepts/semantic-html"
                   rel="related"
                   data-relation="skos:related">Semantic HTML</a>,
                <a href="/concepts/progressive-enhancement"
                   rel="related"
                   data-relation="skos:related">Progressive Enhancement</a>
            </small>
          </p>
        </dd>
      </div>

      <div id="letter-C" data-glossary-group="C">
        <dt id="term-css-architecture">
          <dfn>
            <a href="/concepts/css-architecture"
               data-concept="css-architecture">CSS Architecture</a>
          </dfn>
        </dt>
        <dd>
          <p>Organizing CSS with layers, custom properties, and naming
             conventions to create maintainable stylesheets.</p>
          <p data-relations>
            <small>
              Broader:
                <a href="/concepts/web-development"
                   rel="up"
                   data-relation="skos:broader">Web Development</a> ·
              Related:
                <a href="/concepts/design"
                   rel="related"
                   data-relation="skos:related">Design</a>
            </small>
          </p>
        </dd>
      </div>

      <!-- Additional letter groups follow the same pattern -->

    </dl>
  </main>

  <script src="/js/glossary-filter.js"></script>
</body>
</html>
```

### Glossary Markup Rules

- The root container is `<dl data-glossary>`.
- Each letter group is a `<div>` with `id="letter-{X}"` and `data-glossary-group="{X}"`.
- Each term entry uses `<dt>` containing `<dfn>` containing `<a>`. The anchor links to the concept page and carries `data-concept` for analytics.
- The `<dt>` has `id="term-{concept-id}"` so inline references can deep-link to it.
- Each `<dd>` contains the definition paragraph and an optional relations paragraph with `data-relations`.
- Alternate labels ("also known as") are displayed when `skos:altLabel` exists.
- Broader and related concept links use `rel="up"` and `rel="related"` respectively, plus `data-relation` for the SKOS-specific relationship type.

## Inline Term References

When a glossary term appears in article or page content, it is linked to the glossary using standard HTML elements.

### First (Defining) Use

The first use of a term in a document is wrapped in `<dfn>` to mark it as the defining instance:

```html
<p>We use <dfn><a href="/glossary#term-progressive-enhancement"
   data-concept="progressive-enhancement">progressive enhancement</a></dfn>
   to ensure content is available before scripts load.</p>
```

### Subsequent Uses

Later mentions use a plain anchor without `<dfn>`:

```html
<p>This <a href="/glossary#term-progressive-enhancement"
   data-concept="progressive-enhancement">progressive enhancement</a>
   approach also benefits search engine indexing.</p>
```

### Auto-Linking (Build-Time)

The SSG build step can optionally scan article content for terms that match vocabulary entries (by `skos:prefLabel` or `skos:altLabel`) and automatically wrap the first occurrence in `<dfn><a>` and subsequent occurrences in `<a>`. This is an optional build-time enrichment. The rules are:

- Only match whole words, case-insensitive.
- Only auto-link if the term is not already inside an `<a>`, `<code>`, `<pre>`, or `<dfn>` element.
- First match in the document gets `<dfn>` wrapping. Subsequent matches get `<a>` only.
- Auto-linking can be disabled per-page via frontmatter: `autolink: false`.
- A maximum link density should be respected: do not link more than one instance per paragraph to avoid visual noise.

## Progressive Enhancement: Definition Popover

When JavaScript is available and the browser supports the Popover API, clicking an inline term link shows the definition in a popover anchored to the term instead of navigating to the glossary page.

### Behavior Specification

- The script queries for all `dfn > a[data-concept]` and `a[data-concept]` elements on the page.
- On first interaction, it fetches `/definitions.json` and caches the result in `sessionStorage` under the key `vb:definitions`.
- A single shared `<div popover>` element is created and appended to `document.body`.
- Clicking a term link calls `preventDefault()`, populates the popover with the term name, definition, and a "View in glossary" link, then shows it positioned near the clicked element.
- The popover is positioned below the term by default. If insufficient viewport space exists below, it flips above. If it would overflow the right edge, it shifts left.
- The Popover API natively handles dismissal via `Escape` key and light dismiss (clicking outside).
- Middle-click, right-click, and modifier-key clicks (Ctrl+click, Cmd+click) are not intercepted. The original `<a href>` remains functional for these cases.

### Popover HTML Structure

The script creates this element dynamically:

```html
<div id="dfn-popover" popover>
  <p data-dfn-term></p>
  <p data-dfn-definition></p>
  <a data-dfn-link>View in glossary →</a>
</div>
```

### Popover Script

```js
(async function enhanceDefinitions() {
  if (!HTMLElement.prototype.hasOwnProperty('popover')) return;

  const dfnLinks = document.querySelectorAll('a[data-concept]');
  if (!dfnLinks.length) return;

  let definitions;
  try {
    const cached = sessionStorage.getItem('vb:definitions');
    if (cached) {
      definitions = JSON.parse(cached);
    } else {
      const res = await fetch('/definitions.json');
      definitions = await res.json();
      sessionStorage.setItem('vb:definitions', JSON.stringify(definitions));
    }
  } catch {
    return;
  }

  const popover = document.createElement('div');
  popover.id = 'dfn-popover';
  popover.setAttribute('popover', '');
  popover.innerHTML = `
    <p data-dfn-term></p>
    <p data-dfn-definition></p>
    <a data-dfn-link>View in glossary →</a>
  `;
  document.body.append(popover);

  const termEl = popover.querySelector('[data-dfn-term]');
  const defEl = popover.querySelector('[data-dfn-definition]');
  const linkEl = popover.querySelector('[data-dfn-link]');

  dfnLinks.forEach(link => {
    const concept = link.dataset.concept;
    const entry = definitions[concept];
    if (!entry) return;

    link.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();

      termEl.textContent = entry.term;
      defEl.textContent = entry.definition;
      linkEl.href = entry.href;

      popover.style.position = 'fixed';
      popover.showPopover();

      const rect = link.getBoundingClientRect();
      const popRect = popover.getBoundingClientRect();

      let top = rect.bottom + 8;
      let left = rect.left;

      if (top + popRect.height > window.innerHeight) {
        top = rect.top - popRect.height - 8;
      }
      if (left + popRect.width > window.innerWidth) {
        left = window.innerWidth - popRect.width - 16;
      }

      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
    });
  });
})();
```

### Feature Detection

The script guards on `HTMLElement.prototype.hasOwnProperty('popover')`. If the Popover API is not available, the script exits silently and all term links behave as standard navigation links to the glossary page.

## Glossary Search Filter

The glossary page includes a search input that filters visible terms. It is hidden by default and revealed by JavaScript.

### Behavior Specification

- The `<input type="search" data-glossary-filter hidden>` element is present in the static HTML but hidden.
- When JS runs, it removes the `hidden` attribute to reveal the input.
- On each `input` event, the script iterates all `<dt> dfn` text within `<dl data-glossary>` and toggles the `hidden` attribute on each letter group `<div>` based on whether any of its terms match the query.
- Matching is case-insensitive and checks against the visible term text.
- When the input is cleared, all groups are shown again.

### Filter Script

```js
(function enhanceGlossaryFilter() {
  const filter = document.querySelector('[data-glossary-filter]');
  const glossary = document.querySelector('dl[data-glossary]');
  if (!filter || !glossary) return;

  filter.hidden = false;

  const entries = glossary.querySelectorAll('[data-glossary-group]');

  filter.addEventListener('input', () => {
    const query = filter.value.toLowerCase().trim();

    entries.forEach(group => {
      if (!query) {
        group.hidden = false;
        return;
      }

      const terms = group.querySelectorAll('dt dfn');
      const match = Array.from(terms).some(dfn =>
        dfn.textContent.toLowerCase().includes(query)
      );
      group.hidden = !match;
    });
  });
})();
```

### Promotion Criteria

If the filter needs to grow beyond simple text matching (fuzzy search, showing relationship context in results, keyboard navigation through matches), it should be promoted to a `<vb-glossary-search>` web component. Until then, this script is sufficient.

## Structured Data and Head Metadata

Every page on the site carries metadata that connects it to the vocabulary.

### On All Pages

```html
<head>
  <link rel="glossary" href="/glossary">
</head>
```

This declares that the site has a glossary. Browsers, crawlers, and assistive tools can discover it.

### On Content Pages (Articles, Topics)

```html
<head>
  <meta name="concept" content="progressive-enhancement">
  <link rel="glossary" href="/glossary">
  <link rel="up" href="/concepts/web-development">
  <link rel="tag" href="/concepts/progressive-enhancement">
  <link rel="alternate" type="application/ld+json" href="/concepts/progressive-enhancement.json">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "name": "Progressive Enhancement in Practice",
    "about": {
      "@type": "DefinedTerm",
      "name": "Progressive Enhancement",
      "inDefinedTermSet": "/vocabulary"
    }
  }
  </script>
</head>
```

### On the Glossary Page

```html
<head>
  <link rel="canonical" href="/glossary">
  <link rel="alternate" type="application/ld+json" href="/vocabulary.json">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "name": "Site Name Glossary",
    "url": "/glossary",
    "hasDefinedTerm": [ ... ]
  }
  </script>
</head>
```

## Analytics Integration

The glossary system participates in the site-wide concept-aware analytics model. No separate analytics code is needed for the glossary. The existing site analytics script reads `data-concept` and `data-relation` attributes from any link on any page.

### Events Emitted

The site analytics script listens for clicks on any `a[data-relation]` or `a[data-concept]` element and dispatches a structured event:

```js
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-relation], a[data-concept]');
  if (!link) return;

  const page = document.querySelector('[data-concept]');
  const detail = {
    from: page?.dataset.concept || document.title,
    to: link.dataset.concept || new URL(link.href, location.origin).pathname,
    relation: link.dataset.relation || 'reference',
    source: 'glossary'
  };

  // Send to analytics endpoint
  navigator.sendBeacon?.('/analytics', JSON.stringify(detail));
});
```

### What This Captures

- Which glossary terms users look up (popover opens or click-throughs).
- Which concept relationships users traverse from the glossary (broader, narrower, related).
- Which inline term references in articles users interact with.
- Which parts of the vocabulary are unused or under-served.

## SSG Build Steps

The SSG reads `vocabulary.json` at build time and generates all derived artifacts. The following steps describe what the build must do. Implementation details vary between 11ty and Astro.

### Step 1: Load Vocabulary

Read `vocabulary.json` and make it available as global data to all templates.

### Step 2: Generate definitions.json

Iterate over the concepts array and output `/definitions.json` containing only `term`, `definition`, and `href` for each concept. This file is placed in the build output as a static asset.

### Step 3: Generate the Glossary Page

Sort concepts alphabetically by `skos:prefLabel`. Group by first letter. Render the `<dl data-glossary>` markup pattern described in the glossary page markup section. Include the JSON-LD `DefinedTermSet` in the head. Include the alphabetical index `<nav>`. Include the hidden search filter input.

### Step 4: Inject Head Metadata into Content Pages

For each content page that declares a concept association (via frontmatter `concept: progressive-enhancement`), inject the appropriate `<link>`, `<meta>`, and JSON-LD into the `<head>`.

### Step 5: Auto-Link Terms (Optional)

If enabled, scan rendered article HTML for terms matching vocabulary entries and wrap them in `<dfn><a>` or `<a>` as described in the auto-linking section.

### Step 6: Copy Static Assets

Copy `glossary-filter.js`, `definition-popover.js`, and `glossary.css` to the output directory.

## CSS Conventions

The glossary uses minimal CSS. All selectors target `data-*` attributes or native elements within the glossary context to avoid class name dependencies.

```css
/* Glossary page layout */
dl[data-glossary] > div {
  border-block-end: 1px solid light-dark(#e0e0e0, #333);
  padding-block: 0.75rem;
}

dl[data-glossary] dt {
  font-weight: 700;
}

dl[data-glossary] dd {
  margin-inline-start: 0;
}

dl[data-glossary] dd p[data-relations] {
  margin-block-start: 0.25rem;
  color: light-dark(#555, #aaa);
}

/* Scroll margin for deep links */
dl[data-glossary] [id^="term-"] {
  scroll-margin-block-start: 2rem;
}

dl[data-glossary] [id^="letter-"] {
  scroll-margin-block-start: 2rem;
}

/* Inline term links — dotted underline signals "has definition" */
dfn > a[data-concept],
a[data-concept] {
  text-decoration-style: dotted;
  text-underline-offset: 0.15em;
}

/* Definition popover */
#dfn-popover {
  max-width: 32ch;
  padding: 0.75rem 1rem;
  border: 1px solid light-dark(#ccc, #555);
  border-radius: 0.375rem;
  background: light-dark(#fff, #1a1a1a);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
  margin: 0;
}

#dfn-popover [data-dfn-term] {
  font-weight: 700;
  margin: 0;
}

#dfn-popover [data-dfn-definition] {
  margin-block: 0.375rem 0.5rem;
}

#dfn-popover [data-dfn-link] {
  font-size: 0.85em;
}

/* Glossary filter input */
[data-glossary-filter] {
  display: block;
  width: 100%;
  max-width: 30ch;
  padding: 0.375rem 0.5rem;
  margin-block-end: 1rem;
  border: 1px solid light-dark(#ccc, #555);
  border-radius: 0.25rem;
  font: inherit;
}
```

## Accessibility Requirements

- The glossary page's `<dl>` structure is natively understood by screen readers.
- The alphabetical index `<nav>` has `aria-label="Glossary index"`.
- The search filter input has `aria-label="Filter glossary terms"`.
- The `<dfn>` element marks the defining instance of a term, which screen readers announce.
- The popover uses the native Popover API, which handles focus management, `Escape` to dismiss, and light dismiss.
- Inline term links use `data-concept` rather than relying on visual-only cues. The dotted underline is a visual hint, but the link itself is the accessible affordance.
- All broader/narrower/related links in the glossary use `rel` attributes that browsers and assistive tools can interpret.
- Color is not used as the sole means of conveying information. The dotted underline style distinguishes glossary links from regular links visually, but both are announced as links by screen readers.

## File Structure

```
project/
├── _data/                     # 11ty data directory (or src/data for Astro)
│   └── vocabulary.json        # Source of truth
├── _includes/                 # Templates
│   ├── glossary-head.njk      # <head> metadata partial for glossary page
│   └── content-head.njk       # <head> metadata partial for content pages
├── glossary/
│   └── index.njk              # Glossary page template
├── js/
│   ├── definition-popover.js  # Popover enhancement script
│   └── glossary-filter.js     # Search filter script
├── css/
│   └── glossary.css           # Glossary styles
└── _build/                    # Build scripts
    └── generate-definitions.js # Generates definitions.json from vocabulary.json
```

## Extension Points

These are identified areas where the system can grow without violating the progressive enhancement model.

### Concept Hub Pages

Each concept in the vocabulary can have a dedicated page at `/concepts/{slug}` that aggregates all content tagged with that concept. The SSG generates these from the vocabulary. They show the definition, broader/narrower/related links, and a list of articles tagged with the concept. This is a build-time generation step, not a runtime feature.

### Vocabulary Editor

A `<vb-vocab-editor>` web component for visually editing `vocabulary.json`. This is a development tool, not a user-facing feature. It would render the concept graph as an editable tree/form and output updated JSON-LD. This is a legitimate custom element use case because it requires interactive form behavior, drag-and-drop, and state management that HTML cannot express.

### Gap Analysis Tool

A `<vb-gap-analysis>` web component that compares the vocabulary against actual site content and reports orphaned concepts (in vocabulary but no content references them), untagged content (pages that reference no concepts), and dead branches (concepts with no narrower terms and no content). This is editorial tooling that requires computation and interactive display.

### Cross-Site Vocabulary Mapping

Using `skos:exactMatch` and `skos:closeMatch` to declare equivalences between this site's vocabulary and external vocabularies. This is a data-level extension to `vocabulary.json` and requires no new markup patterns or scripts.

### Multi-Language Glossary

SKOS natively supports language-tagged labels via `@language`. The vocabulary file can carry `skos:prefLabel` in multiple languages, and the SSG can generate language-specific glossary pages. The markup patterns remain identical; only the content changes.
