# Document Provenance

> Metadata display, change tracking, and content trust indicators for the AI authorship era.

## Status: R&D

**Last updated:** 2026-02-23

---

## Problem

The web has three provenance gaps that compound each other:

1. **No metadata surface.** Documents carry rich metadata (author, dates, revision history) but display none of it. Readers see the content but not its lineage.
2. **Unused change tracking.** HTML has `<ins>` and `<del>` — purpose-built elements for editorial changes — but almost nobody uses them because the default rendering is ugly and there's no tooling to make them useful.
3. **No trust signal.** AI-generated and AI-assisted content is now pervasive. There is no standard, machine-readable way to declare *how* content was produced or *what review it received*.

These three problems are actually one problem: **document provenance**. Who wrote it, what changed, and how much should you trust it.

## Design Principles

- **CSS-first.** Trust indicators and change styling work without JavaScript.
- **Native HTML.** Build on `<ins>`, `<del>`, `<time>`, `<address>` — not replacements for them.
- **Progressive.** The `<page-meta>` component enhances metadata that already exists in the document. Without JS, the raw content is still meaningful.
- **Machine-readable.** JSON-LD structured data makes provenance accessible to search engines, aggregators, and AI tools.

---

## 1. `data-trust` Attribute System

The simplest piece ships first because it's pure CSS.

### Token Vocabulary

| Token | Meaning | Visual Treatment |
|-------|---------|-----------------|
| `human` | Written entirely by a human | No indicator (the default assumption) |
| `ai-assisted` | Human-written with AI tooling | Subtle icon or border accent |
| `ai-generated` | Primarily AI-generated content | Distinct background tint + icon |
| `editor-reviewed` | Reviewed and approved by editor | Checkmark indicator |
| `draft` | Unreviewed work in progress | Dashed border + muted text |

### Usage

Applied to any block element — sections, articles, paragraphs, or the entire page:

```html
<!-- Whole-page trust level -->
<article data-trust="ai-assisted">
  <h1>Migration Guide</h1>
  <p>This guide was written with AI assistance and reviewed by the docs team.</p>

  <!-- Section-level override -->
  <section data-trust="human">
    <h2>When to Migrate</h2>
    <p>Written from direct experience with the 2.0 upgrade...</p>
  </section>

  <section data-trust="ai-generated">
    <h2>API Reference</h2>
    <p>Auto-generated from the OpenAPI spec...</p>
  </section>
</article>
```

Compound values for content that has been both generated and reviewed:

```html
<section data-trust="ai-generated editor-reviewed">
  <h2>Release Notes</h2>
  <p>AI-drafted from commit history, reviewed and approved by the release manager.</p>
</section>
```

### CSS Implementation

```css
/* --- Trust indicators (CSS-only) --- */

[data-trust] {
  --trust-color: var(--color-text-muted);
  --trust-border: var(--border-width-thin) solid var(--trust-color);
  position: relative;
}

/* Human is the default — no visual noise */
[data-trust="human"] {
  --trust-color: transparent;
}

/* AI-assisted: subtle accent */
[data-trust~="ai-assisted"] {
  --trust-color: oklch(65% 0.15 250);
  border-inline-start: var(--size-3xs) solid var(--trust-color);
  padding-inline-start: var(--size-s);
}

/* AI-generated: visible background tint */
[data-trust~="ai-generated"] {
  --trust-color: oklch(65% 0.18 290);
  background: oklch(65% 0.18 290 / 0.05);
  border-inline-start: var(--size-3xs) solid var(--trust-color);
  padding-inline-start: var(--size-s);
}

/* Editor-reviewed: approval indicator */
[data-trust~="editor-reviewed"] {
  border-inline-start-color: oklch(60% 0.18 145);
}

/* Draft: work-in-progress styling */
[data-trust~="draft"] {
  --trust-color: oklch(70% 0.15 75);
  border: var(--border-width-thin) dashed var(--trust-color);
  padding: var(--size-s);
  opacity: 0.85;
}

/* Trust badge via ::before (opt-in with .labeled) */
[data-trust~="ai-assisted"].labeled::before {
  content: "AI-Assisted";
}

[data-trust~="ai-generated"].labeled::before {
  content: "AI-Generated";
}

[data-trust~="editor-reviewed"].labeled::before {
  content: "Reviewed ✓";
}

[data-trust~="draft"].labeled::before {
  content: "Draft";
}

[data-trust].labeled::before {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--trust-color);
  padding: var(--size-3xs) var(--size-2xs);
  border: var(--border-width-thin) solid var(--trust-color);
  border-radius: var(--radius-s);
  margin-block-end: var(--size-xs);
}
```

### Why `data-trust` Instead of a Class

- **Queryable.** `document.querySelectorAll('[data-trust~="ai-generated"]')` finds all AI content.
- **Composable.** Space-separated tokens (`data-trust="ai-generated editor-reviewed"`) matched by `~=` selector.
- **Semantic.** Data attributes declare *what the content is*, not *how it looks*.
- **Machine-readable.** Crawlers and tools can extract trust signals without understanding CSS classes.

---

## 2. Enhanced `<ins>` / `<del>` CSS

VB already styles `<ins>` and `<del>` (see `inline-semantics/styles.css`). This extends them for block-level change tracking and annotated edits.

### Block Variant

```html
<!-- Block-level deletion (entire paragraph removed) -->
<del class="block" cite="https://github.com/org/repo/pull/42" datetime="2026-02-20">
  <p>The old API endpoint accepts XML payloads. Send requests to /api/v1/upload.</p>
</del>

<!-- Block-level insertion (replacement paragraph) -->
<ins class="block" cite="https://github.com/org/repo/pull/42" datetime="2026-02-20">
  <p>The new API accepts JSON payloads. Send requests to /api/v2/ingest.</p>
</ins>
```

### Annotated Changes

The native `cite` and `datetime` attributes are joined by optional `data-*` attributes for richer context:

```html
<ins datetime="2026-02-20"
     data-author="tpowell"
     data-reason="accuracy"
     data-ticket="VB-1234">
  corrected migration path
</ins>
```

### CSS

```css
/* --- Block-level changes --- */

del.block,
ins.block {
  display: block;
  padding: var(--size-s);
  margin-block: var(--size-xs);
  border-radius: var(--radius-s);
}

del.block {
  background: oklch(55% 0.2 25 / 0.08);
  border-inline-start: var(--size-3xs) solid oklch(55% 0.2 25);
  text-decoration: line-through;
  text-decoration-color: oklch(55% 0.2 25 / 0.5);
}

ins.block {
  background: oklch(60% 0.18 145 / 0.08);
  border-inline-start: var(--size-3xs) solid oklch(60% 0.18 145);
  text-decoration: none;
}

/* --- Annotated changes --- */

/* Show author on hover via ::after */
ins[data-author]::after,
del[data-author]::after {
  content: " — " attr(data-author);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  opacity: 0;
  transition: opacity 200ms ease;
}

ins[data-author]:hover::after,
del[data-author]:hover::after {
  opacity: 1;
}

/* Reason tags */
ins[data-reason]::before,
del[data-reason]::before {
  content: attr(data-reason);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-inline-end: var(--size-2xs);
}

/* Print: always show annotations */
@media print {
  ins[data-author]::after,
  del[data-author]::after {
    opacity: 1;
  }
}
```

### Relationship to `data-trust`

Change tracking and trust are complementary layers:

```html
<article data-trust="ai-assisted">
  <p>
    The migration requires
    <del datetime="2026-02-15" data-author="claude" data-reason="correction">
      Node.js 16
    </del>
    <ins datetime="2026-02-15" data-author="tpowell" data-reason="review">
      Node.js 20 LTS
    </ins>
    or later.
  </p>
</article>
```

Here `data-trust="ai-assisted"` declares the authorship model, while `<ins>`/`<del>` show the *specific edits* — including that a human corrected an AI suggestion. The provenance is traceable at both the document level and the individual change level.

---

## 3. `<change-set>` Element

An interactive wrapper that groups related `<ins>` and `<del>` elements into a reviewable unit.

### Rationale

A single edit often involves multiple insertions and deletions across a paragraph or section. Grouping them lets readers:

- Toggle visibility of changes (show final text vs. show tracked changes)
- Navigate between change groups
- See the overall scope of an edit at a glance

### HTML Structure

```html
<change-set id="pr-42" datetime="2026-02-20" data-author="tpowell">
  <p>
    The API now accepts
    <del>XML payloads via /api/v1/upload</del>
    <ins>JSON payloads via /api/v2/ingest</ins>
    and returns
    <del>plain text</del>
    <ins>structured JSON</ins>
    responses.
  </p>
</change-set>
```

### Behavior

| State | What's Visible | How to Toggle |
|-------|---------------|---------------|
| Default (tracking on) | Both `<ins>` and `<del>` with their respective styles | — |
| Final text | Only `<ins>` content; `<del>` hidden | `data-view="final"` |
| Original text | Only `<del>` content; `<ins>` hidden | `data-view="original"` |

### CSS States (No JS Required for Basic Display)

```css
change-set {
  display: block;
  position: relative;
  border-inline-start: var(--size-3xs) solid var(--color-border);
  padding-inline-start: var(--size-s);
  margin-block: var(--size-xs);
}

/* Final-text view: hide deletions, normalize insertions */
change-set[data-view="final"] del {
  display: none;
}

change-set[data-view="final"] ins {
  text-decoration: none;
  background: none;
  border: none;
}

/* Original-text view: hide insertions, normalize deletions */
change-set[data-view="original"] ins {
  display: none;
}

change-set[data-view="original"] del {
  text-decoration: none;
  background: none;
  border: none;
}
```

### JavaScript Enhancement

```js
class ChangeSet extends HTMLElement {
  static tagName = 'change-set';

  connectedCallback() {
    // Add toggle controls if not already present
    if (!this.querySelector('[data-controls]')) {
      this.#addControls();
    }
  }

  #addControls() {
    const controls = document.createElement('nav');
    controls.setAttribute('data-controls', '');
    controls.setAttribute('aria-label', 'Change view controls');
    controls.innerHTML = `
      <button type="button" data-action="tracking" aria-pressed="true">
        Tracking
      </button>
      <button type="button" data-action="final" aria-pressed="false">
        Final
      </button>
      <button type="button" data-action="original" aria-pressed="false">
        Original
      </button>
    `;
    this.prepend(controls);

    controls.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      if (action === 'tracking') {
        this.removeAttribute('data-view');
      } else {
        this.dataset.view = action;
      }

      // Update pressed states
      for (const btn of controls.querySelectorAll('button')) {
        const isActive = btn.dataset.action === action;
        btn.setAttribute('aria-pressed', isActive);
      }

      this.dispatchEvent(new CustomEvent('change-set:view', {
        detail: { view: action },
        bubbles: true
      }));
    });
  }

  get view() {
    return this.dataset.view ?? 'tracking';
  }

  set view(value) {
    if (value === 'tracking') {
      this.removeAttribute('data-view');
    } else {
      this.dataset.view = value;
    }
  }
}
```

### Without JavaScript

The `data-view` attribute is CSS-only. A server or static site generator can set the default view:

```html
<!-- Render the final version by default; JS not needed -->
<change-set data-view="final">
  <p><del>old text</del><ins>new text</ins></p>
</change-set>
```

---

## 4. `<page-meta>` Web Component

Displays document metadata in a structured, styled block. Designed for the top or bottom of articles, documentation pages, and blog posts.

### HTML Structure

```html
<page-meta>
  <dl>
    <dt>Author</dt>
    <dd><address><a href="/team/tpowell" rel="author">T. Powell</a></address></dd>

    <dt>Published</dt>
    <dd><time datetime="2026-01-15">January 15, 2026</time></dd>

    <dt>Updated</dt>
    <dd><time datetime="2026-02-20">February 20, 2026</time></dd>

    <dt>Version</dt>
    <dd>2.1.0</dd>

    <dt>Trust</dt>
    <dd data-trust="ai-assisted">AI-Assisted</dd>

    <dt>Keywords</dt>
    <dd>
      <ul>
        <li>provenance</li>
        <li>metadata</li>
        <li>trust</li>
      </ul>
    </dd>
  </dl>
</page-meta>
```

### Why a `<dl>` Inside

- **Semantic.** A definition list is the correct structure for key-value metadata.
- **Accessible.** Screen readers announce "Author: T. Powell" naturally.
- **Styleable.** CSS grid on the `<dl>` handles the two-column layout.
- **Degradable.** Without JS or CSS, the `<dl>` renders as a readable list of terms and definitions.

### CSS

```css
page-meta {
  display: block;
  padding: var(--size-m);
  background: var(--color-surface-raised);
  border-radius: var(--radius-m);
  border: var(--border-width-thin) solid var(--color-border);
  margin-block: var(--size-l);
  font-size: var(--font-size-sm);
}

page-meta dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--size-2xs) var(--size-m);
  margin: 0;
}

page-meta dt {
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-size: var(--font-size-xs);
  letter-spacing: 0.05em;
  align-self: baseline;
}

page-meta dd {
  margin: 0;
  align-self: baseline;
}

page-meta dd ul {
  display: flex;
  flex-wrap: wrap;
  gap: var(--size-2xs);
  list-style: none;
  padding: 0;
  margin: 0;
}

page-meta dd li {
  background: var(--color-surface);
  padding: var(--size-3xs) var(--size-2xs);
  border-radius: var(--radius-s);
  font-size: var(--font-size-xs);
}

/* Compact variant for inline use */
page-meta.compact {
  padding: var(--size-s);
}

page-meta.compact dl {
  display: flex;
  flex-wrap: wrap;
  gap: var(--size-2xs) var(--size-m);
}

page-meta.compact dt {
  text-transform: none;
  font-size: inherit;
}

page-meta.compact dt::after {
  content: ":";
}
```

### JavaScript Enhancement

```js
class PageMeta extends HTMLElement {
  static tagName = 'page-meta';

  connectedCallback() {
    // Generate JSON-LD from the visible metadata
    this.#injectStructuredData();
  }

  #injectStructuredData() {
    const data = this.#extractMetadata();
    if (!data.author && !data.datePublished) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      ...data
    });
    this.append(script);
  }

  #extractMetadata() {
    const meta = {};
    const pairs = this.querySelectorAll('dt');

    for (const dt of pairs) {
      const dd = dt.nextElementSibling;
      if (!dd || dd.tagName !== 'DD') continue;

      const key = dt.textContent.trim().toLowerCase();
      switch (key) {
        case 'author':
          meta.author = {
            '@type': 'Person',
            name: dd.textContent.trim(),
            url: dd.querySelector('a')?.href
          };
          break;
        case 'published':
          meta.datePublished = dd.querySelector('time')?.dateTime;
          break;
        case 'updated':
          meta.dateModified = dd.querySelector('time')?.dateTime;
          break;
        case 'version':
          meta.version = dd.textContent.trim();
          break;
        case 'keywords':
          meta.keywords = [...dd.querySelectorAll('li')]
            .map(li => li.textContent.trim())
            .join(', ');
          break;
      }
    }

    return meta;
  }
}
```

### Version History Extension

For documents that track revision history, `<page-meta>` supports an expandable history section:

```html
<page-meta>
  <dl>
    <dt>Author</dt>
    <dd><address>T. Powell</address></dd>

    <dt>Version</dt>
    <dd>2.1.0</dd>

    <dt>History</dt>
    <dd>
      <details>
        <summary>3 revisions</summary>
        <ol reversed>
          <li>
            <time datetime="2026-02-20">Feb 20</time> —
            v2.1.0: Updated API examples
          </li>
          <li>
            <time datetime="2026-01-30">Jan 30</time> —
            v2.0.0: Rewrote for new architecture
          </li>
          <li>
            <time datetime="2026-01-15">Jan 15</time> —
            v1.0.0: Initial publication
          </li>
        </ol>
      </details>
    </dd>
  </dl>
</page-meta>
```

The `<details>` element keeps the history collapsed by default — no JS needed for the toggle.

---

## 5. JSON-LD Structured Data

Machine-readable provenance using Schema.org vocabulary.

### Auto-generated by `<page-meta>`

The component reads its `<dl>` content and emits a `<script type="application/ld+json">` block. But the same JSON-LD can be authored manually in the `<head>` for pages without the component.

### Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Migration Guide",
  "author": {
    "@type": "Person",
    "name": "T. Powell",
    "url": "https://example.com/team/tpowell"
  },
  "datePublished": "2026-01-15",
  "dateModified": "2026-02-20",
  "version": "2.1.0",
  "keywords": "provenance, metadata, trust",
  "creativeWorkStatus": "Published",
  "creditText": "AI-Assisted — Written with AI tooling, reviewed by author"
}
```

### Trust Mapping to Schema.org

Schema.org doesn't have a `trust` field, but several properties carry the same information:

| `data-trust` token | Schema.org property | Value |
|---------------------|-------------------|-------|
| `human` | `creditText` | `"Written by {author}"` |
| `ai-assisted` | `creditText` | `"AI-Assisted — Written with AI tooling, reviewed by {author}"` |
| `ai-generated` | `creditText` | `"AI-Generated — Produced by {tool}"` |
| `editor-reviewed` | `creativeWorkStatus` | `"Published"` |
| `draft` | `creativeWorkStatus` | `"Draft"` |

### Full Page Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Migration Guide — Acme Docs</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "Migration Guide",
    "author": {
      "@type": "Person",
      "name": "T. Powell"
    },
    "datePublished": "2026-01-15",
    "dateModified": "2026-02-20",
    "version": "2.1.0",
    "creditText": "AI-Assisted — Written with AI tooling, reviewed by author",
    "creativeWorkStatus": "Published"
  }
  </script>
</head>
<body>
  <article data-trust="ai-assisted">
    <h1>Migration Guide</h1>

    <page-meta>
      <dl>
        <dt>Author</dt>
        <dd><address><a href="/team/tpowell" rel="author">T. Powell</a></address></dd>
        <dt>Published</dt>
        <dd><time datetime="2026-01-15">January 15, 2026</time></dd>
        <dt>Updated</dt>
        <dd><time datetime="2026-02-20">February 20, 2026</time></dd>
        <dt>Trust</dt>
        <dd data-trust="ai-assisted">AI-Assisted</dd>
      </dl>
    </page-meta>

    <section>
      <h2>Before You Start</h2>
      <p>
        Ensure you have
        <del datetime="2026-02-15" data-author="tpowell" data-reason="correction">
          Node.js 16
        </del>
        <ins datetime="2026-02-15" data-author="tpowell" data-reason="review">
          Node.js 20 LTS
        </ins>
        installed.
      </p>
    </section>

    <change-set datetime="2026-02-20" data-author="tpowell">
      <section>
        <h2>API Endpoint</h2>
        <p>
          Send requests to
          <del>/api/v1/upload</del>
          <ins>/api/v2/ingest</ins>
          with a
          <del>Content-Type: application/xml</del>
          <ins>Content-Type: application/json</ins>
          header.
        </p>
      </section>
    </change-set>
  </article>
</body>
</html>
```

---

## 6. Delivery Plan

### Phase 1 — CSS Foundation (No JS)

| Deliverable | Layer | Depends On |
|-------------|-------|------------|
| `data-trust` attribute styles | `native-elements` | Nothing |
| `del.block` / `ins.block` CSS | `native-elements` | Nothing |
| `data-author`, `data-reason` annotation CSS | `native-elements` | Nothing |
| `page-meta` base CSS (layout only) | `components` | Nothing |
| `change-set` base CSS (view states) | `components` | Nothing |

Everything in Phase 1 works without JavaScript. A static site using only VB's CSS gets trust indicators, block-level change tracking, and metadata display.

### Phase 2 — Web Components

| Deliverable | Depends On |
|-------------|------------|
| `<page-meta>` component (JSON-LD injection) | Phase 1 CSS |
| `<change-set>` component (view toggle controls) | Phase 1 CSS |
| Component registration in `index.js` | — |
| Doc page: `/docs/elements/web-components/page-meta/` | Component |
| Doc page: `/docs/elements/web-components/change-set/` | Component |
| Demo: `/docs/examples/document-provenance/` | Both components |

### Phase 3 — JSON-LD and Tooling

| Deliverable | Depends On |
|-------------|------------|
| JSON-LD template helper for 11ty | Phase 2 |
| `data-trust` conformance rule | Phase 1 |
| Trust badge `<icon-wc>` integration | Phase 1 |
| Doc page: `/docs/content-trust/` | All above |

### What's Explicitly Out of Scope

- **Server-side change tracking** — VB is a CSS/JS framework, not a CMS. The `<ins>`/`<del>` markup is authored by the user or their build tool.
- **Diff computation** — Calculating what changed between two versions is an application concern. `<change-set>` displays changes, it doesn't compute them.
- **Authentication or signing** — `data-trust` is a *declaration*, not a *proof*. Cryptographic content signing is a different problem.
- **W3C Verifiable Credentials / C2PA** — Worth monitoring as standards mature, but too complex and unsettled to build on today.

---

## Open Questions

1. **Should `data-trust` live on `<html>` as a page-level default?** Currently it's on `<article>` or section elements. A page-level default would reduce repetition but might be too broad.

2. **Print styles for trust indicators.** Should printed pages show trust badges? The annotation CSS already handles print for `<ins>`/`<del>`, but `data-trust` badges might be noise on paper.

3. **Interaction with `<foot-notes>`.** Change annotations (`data-author`, `data-reason`, `data-ticket`) could link to footnotes for detailed rationale. Worth exploring the integration pattern.

4. **Multiple authors.** The current `data-author` is a single value. Collaborative edits might need `data-authors` (comma-separated) or a different approach.

5. **`creditText` adoption.** Schema.org's `creditText` is the best fit for AI trust signals today, but it's a free-text field. If a more structured property emerges (there's ongoing discussion in the Schema.org community), the JSON-LD mapping should adopt it.
