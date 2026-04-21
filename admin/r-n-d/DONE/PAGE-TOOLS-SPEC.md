# Page Tools
## Specification for Vanilla Breeze

A configurable container component that aggregates page-level utilities — print,
share, text reader, reading stats, page info, highlights, reader view — into a
cohesive toolbar. Designed as a hybrid: a positioning container that auto-discovers
its children while offering optional orchestration through `data-*` attributes.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Design Decisions](#design-decisions)
- [Progressive Enhancement Layers](#progressive-enhancement-layers)
- [HTML API](#html-api)
- [The `page-stats` Custom Element](#the-page-stats-custom-element)
- [Discovery and Registration](#discovery-and-registration)
- [Positioning Model](#positioning-model)
- [Mobile Collapse: FAB + Popover](#mobile-collapse-fab--popover)
- [CSS Architecture](#css-architecture)
- [Tool Catalog](#tool-catalog)
- [Integration Points](#integration-points)
- [Build Order](#build-order)
- [Open Questions](#open-questions)

---

## Problem Statement

Content-oriented sites commonly offer a set of per-page utilities: print this
page, share it, listen to it, check reading time, view provenance. These tools
share a positioning problem (sticky sidebar, floating bar, mobile adaptation)
but are otherwise independent features.

Without a container, each tool either:

- Reinvents its own positioning logic
- Gets placed ad hoc by the site author, leading to inconsistent layouts
- Disappears on mobile because there's no shared collapse strategy

`<page-tools>` solves the positioning and responsive collapse problem once,
while staying agnostic about which tools are actually used. Sites that want
print + share get exactly that. Sites that want the full suite slot everything
in.

---

## Design Decisions

Decisions made during planning, recorded for future reference.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Container role | Hybrid: positioning container + optional orchestration via `data-*` | Pure slot container lacks responsive collapse; pure orchestrator over-couples |
| Positioning | Configurable via `data-position` (inline, sticky, fixed) | Different page layouts need different strategies |
| Orientation | Vertical in sidebar, horizontal when inline; configurable via `data-orientation` | Matches spatial context |
| Mobile collapse | FAB that opens a popover/drawer | Preserves access without consuming layout space |
| FAB icon | Author-configurable via `data-fab-icon` | No tool is universally "primary" |
| Reading stats | Separate lightweight `page-stats` custom element | Avoids coupling to `page-info` provenance/signing machinery |
| Tool discovery | Auto-scan children on `connectedCallback` | Minimal author ceremony; just slot children in |
| Events | Each tool handles its own events; `page-tools` is hands-off | Keeps container decoupled from tool internals |

---

## Progressive Enhancement Layers

### Layer 1: Native HTML

The custom element tags are used from the start. `<page-tools>` lives inside
the `<aside>` that already exists in the site's grid layout — it does not
replace or become the landmark.

```html
<aside>
  <page-toc></page-toc>
  <page-tools>
    <page-stats>
      <time data-reading-time datetime="PT5M">5 min read</time>
    </page-stats>
    <a href="javascript:window.print()" aria-label="Print page">Print</a>
  </page-tools>
</aside>
```

Before CSS or JS, `<page-tools>` and `<page-stats>` are undefined custom
elements — inline by default, semantically neutral. The content is visible
and the print link works. Reading stats are SSR-rendered text inside the
`<page-stats>` tag. The `<aside>` provides the landmark.

### Layer 2: CSS Styling

CSS targets the custom element selectors directly. No classes needed on the
elements themselves.

```css
@layer web-components {
  page-tools {
    display: flex;
    flex-direction: column;
    gap: var(--size-s);
    align-items: center;
  }

  page-stats {
    display: block;
    font-size: var(--font-size-s);
    color: var(--color-text-muted);
  }
}
```

### Layer 3: Enhanced HTML Structure

Not applicable for `page-tools` itself — the enhancement is in its children
(e.g., `<details>`/`<summary>` for collapsible stats panels).

### Layer 4: Web Component

`<page-tools>` registers, auto-discovers children, manages responsive collapse
to FAB, and handles orientation switching.

```html
<page-tools data-position="sticky" data-fab-icon="ellipsis">
  <print-page></print-page>
  <share-page></share-page>
  <text-reader for="article-content"></text-reader>
  <page-stats data-for="article-content"></page-stats>
</page-tools>
```

---

## HTML API

### `<page-tools>` Element

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-position` | `inline` \| `sticky` \| `fixed` | `sticky` | Positioning strategy |
| `data-orientation` | `vertical` \| `horizontal` \| `auto` | `auto` | Tool strip direction. `auto` resolves to vertical for sticky/fixed, horizontal for inline |
| `data-fab-icon` | Any `icon-wc` name | `ellipsis-vertical` | Icon shown in the mobile FAB trigger |
| `data-fab-label` | string | `"Page tools"` | Accessible label for the FAB button |
| `data-breakpoint` | CSS length value | `48rem` | Viewport width below which the toolbar collapses to FAB |
| `data-gap` | VB size token | `s` | Gap between tool items |
| `aria-label` | string | `"Page tools"` | Accessible label for the toolbar group |

### Minimal Example

```html
<page-tools>
  <print-page></print-page>
</page-tools>
```

### Full Example

```html
<page-tools
  data-position="sticky"
  data-orientation="vertical"
  data-fab-icon="menu"
  data-fab-label="Article tools"
  data-breakpoint="60rem"
  aria-label="Article tools"
>
  <page-stats data-for="article-content"></page-stats>
  <print-page></print-page>
  <share-page></share-page>
  <text-reader for="article-content"></text-reader>
  <page-info data-compact></page-info>
</page-tools>
```

### SSR-Only Example (No JS)

```html
<aside>
  <page-tools>
    <page-stats>
      <time data-reading-time datetime="PT5M">5 min read</time>
      <span data-word-count>1,240 words</span>
    </page-stats>
    <a href="javascript:window.print()" aria-label="Print page">
      <svg aria-hidden="true"><!-- printer icon --></svg>
    </a>
  </page-tools>
</aside>
```

---

## The `page-stats` Custom Element

A lightweight alternative to `page-info` for sites that only need reading
statistics. No provenance, no signing, no verification — just numbers.

### Progressive Enhancement

**Layer 1 — SSR static markup:**

```html
<page-stats>
  <time data-reading-time datetime="PT5M">5 min read</time>
</page-stats>
```

The SSG computes reading time at build and renders it inside the `<page-stats>`
tag. Works without JS — the undefined custom element is inline and the content
is visible. The `<time>` element with `datetime` is machine-readable.

**Layer 4 — Web component:**

```html
<page-stats data-for="article-content"></page-stats>
```

When JS is available, the component:

1. Counts words in the target element (`data-for` references an `id`)
2. Computes reading time (configurable WPM via `data-wpm`, default `238`)
3. Renders the stats into its light DOM
4. Observes the target via `MutationObserver` for dynamic content changes

### `page-stats` Attributes

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-for` | element ID | — | Target content element to analyze |
| `data-wpm` | number | `238` | Words per minute for reading time calculation |
| `data-show` | comma-separated: `reading-time`, `word-count`, `last-modified` | `reading-time` | Which stats to display |

### `page-stats` Rendered Markup

When enhanced, the component renders into its own light DOM:

```html
<page-stats data-for="article-content" data-show="reading-time,word-count">
  <dl class="page-stats-list">
    <div>
      <dt class="sr-only">Reading time</dt>
      <dd><time datetime="PT5M">5 min read</time></dd>
    </div>
    <div>
      <dt class="sr-only">Word count</dt>
      <dd>1,240 words</dd>
    </div>
  </dl>
</page-stats>
```

### SSR Pre-rendering

11ty can compute the same values at build time:

```html
<!-- 11ty template -->
<page-stats data-for="article-content" data-show="reading-time,word-count">
  <dl class="page-stats-list">
    <div>
      <dt class="sr-only">Reading time</dt>
      <dd><time datetime="PT{{ readingTime }}M">{{ readingTime }} min read</time></dd>
    </div>
    <div>
      <dt class="sr-only">Word count</dt>
      <dd>{{ wordCount | commaNumber }} words</dd>
    </div>
  </dl>
</page-stats>
```

When the component connects and finds existing `<dl>` content, it adopts it
rather than re-rendering — the "wrap, don't replace" principle.

### `last-modified` stat

When `data-show` includes `last-modified`, the component reads
`document.lastModified` or `meta[name="last-modified"]` and renders a
relative time display:

```html
<div>
  <dt class="sr-only">Last updated</dt>
  <dd><time datetime="2026-03-15" data-relative>2 weeks ago</time></dd>
</div>
```

---

## Discovery and Registration

### Auto-discovery

On `connectedCallback`, `page-tools` scans its direct children and categorizes
them:

```javascript
get tools() {
  return Array.from(this.children).filter(
    el => !el.matches('[data-page-tools-internal]')
  );
}
```

The FAB trigger button and popover panel are marked `data-page-tools-internal`
and excluded from the tool list.

### What counts as a "tool"

Any direct child element. `page-tools` does not maintain a registry of known
tool types. It treats all children equally for layout purposes. This means
authors can slot in custom tools without any registration:

```html
<page-tools>
  <print-page></print-page>
  <my-custom-tool></my-custom-tool>  <!-- works fine -->
  <button data-copy="https://example.com/page">Copy link</button>  <!-- also fine -->
</page-tools>
```

### MutationObserver

After initial discovery, a `MutationObserver` watches for added/removed
children to handle dynamic tool insertion (e.g., a tool that only appears
after a user action).

```javascript
#observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type === 'childList') {
      this.#updateToolCount();
      this.#syncPopover();
    }
  }
});
```

---

## Positioning Model

### `data-position="sticky"` (default)

The component uses `position: sticky` with `top` offset. Designed to live
inside a sidebar column (`layout-sidebar`, `layout-grid`, or any CSS grid
with a sidebar track).

```css
page-tools[data-position="sticky"] {
  position: sticky;
  top: var(--page-tools-offset, var(--size-xl));
  align-self: start;
}
```

### `data-position="fixed"`

Fixed to the viewport edge. Used for the Medium-style floating bar pattern.
The component positions itself on the inline-end edge by default.

```css
page-tools[data-position="fixed"] {
  position: fixed;
  inset-block-start: 50%;
  inset-inline-end: var(--page-tools-offset, var(--size-m));
  transform: translateY(-50%);
  z-index: var(--layer-sticky);
}
```

### `data-position="inline"`

No special positioning — flows in the document. Orientation defaults to
horizontal. Useful for placing tools above or below an article.

```css
page-tools[data-position="inline"] {
  /* defaults to horizontal via data-orientation="auto" */
}
```

### Orientation Resolution

When `data-orientation="auto"` (default):

| Position | Resolved Orientation |
|----------|---------------------|
| `sticky` | `vertical` |
| `fixed` | `vertical` |
| `inline` | `horizontal` |

Authors can override with an explicit `data-orientation` value.

---

## Mobile Collapse: FAB + Popover

Below the `data-breakpoint` threshold, the tool strip collapses into a
floating action button that opens a popover containing the tools.

### Markup Generated by the Component

```html
<page-tools data-position="sticky" data-fab-icon="ellipsis-vertical">
  <!-- Original children are moved into the popover on small viewports -->

  <!-- FAB trigger (injected, hidden on desktop) -->
  <button
    data-page-tools-internal
    class="page-tools-fab"
    popovertarget="page-tools-popover"
    aria-label="Page tools"
  >
    <icon-wc name="ellipsis-vertical" size="md"></icon-wc>
  </button>

  <!-- Popover panel (injected, hidden on desktop) -->
  <div
    data-page-tools-internal
    id="page-tools-popover"
    popover
    class="page-tools-popover"
  >
    <!-- Tools are moved here on small viewports -->
  </div>
</page-tools>
```

### Implementation Strategy

The component uses native `<popover>` for the drawer. No dialog, no modal —
light dismiss behavior out of the box.

**Desktop → Mobile transition:**

1. A `matchMedia` listener watches the breakpoint
2. When below threshold: tools are moved into the popover `<div>`, FAB becomes visible
3. When above threshold: tools are moved back to the component root, FAB is hidden

This is a DOM move, not a clone — event listeners on tool children are preserved.

**FAB positioning on mobile:**

```css
.page-tools-fab {
  position: fixed;
  inset-block-end: var(--page-tools-fab-bottom, var(--size-l));
  inset-inline-end: var(--page-tools-fab-end, var(--size-m));
  z-index: var(--layer-sticky);
  /* ... button styling ... */
}
```

**Popover panel:**

```css
.page-tools-popover {
  /* Anchored to FAB via CSS Anchor Positioning where supported */
  position: fixed;
  inset-block-end: calc(var(--page-tools-fab-bottom, var(--size-l)) + 3.5rem);
  inset-inline-end: var(--page-tools-fab-end, var(--size-m));
  /* Fallback positioning for browsers without anchor positioning */
}
```

### Popover Orientation

Inside the popover, tools always render vertically regardless of the
`data-orientation` value — horizontal layout doesn't work in a narrow
floating panel.

---

## CSS Architecture

### Layer Placement

```css
@layer web-components {
  /* page-tools styles */
}
```

### Custom Properties

```css
page-tools {
  /* Layout */
  --page-tools-gap: var(--size-s);
  --page-tools-offset: var(--size-xl);        /* sticky/fixed offset */
  --page-tools-padding: var(--size-xs);

  /* FAB */
  --page-tools-fab-size: 3rem;
  --page-tools-fab-bottom: var(--size-l);
  --page-tools-fab-end: var(--size-m);
  --page-tools-fab-bg: var(--color-surface-raised);
  --page-tools-fab-shadow: var(--shadow-m);
  --page-tools-fab-radius: 50%;

  /* Popover */
  --page-tools-popover-bg: var(--color-surface-raised);
  --page-tools-popover-border: var(--border-width-thin) solid var(--color-border);
  --page-tools-popover-radius: var(--radius-m);
  --page-tools-popover-shadow: var(--shadow-l);
  --page-tools-popover-padding: var(--size-s);
  --page-tools-popover-gap: var(--size-xs);
}
```

### Print Behavior

`page-tools` hides itself when printing. This is already handled by the
existing VB print stylesheet which hides interactive web components, but
the component also applies its own guard:

```css
@media print {
  page-tools {
    display: none !important;
  }
}
```

### `:not(:defined)` Behavior

Unlike components that are meaningless without JS, `page-tools` has useful
Layer 2 CSS styling. It should **not** hide when undefined — the flex layout
and SSR content (reading stats, print links) should remain visible.

```css
/* No display:none on :not(:defined) — Layer 2 CSS handles layout */
page-tools:not(:defined) {
  /* Optionally suppress FAB-specific styles that only make sense after upgrade */
}
```

Individual JS-required tool children (like `<text-reader>`, `<share-page>`)
already use their own `:not(:defined) { display: none }` rules, so they
self-hide when JS isn't available. `page-tools` doesn't need to manage this.

---

## Tool Catalog

Known tools that can be slotted into `<page-tools>`. None are required.

### Existing VB Components

| Tool | Tag | JS Required | Notes |
|------|-----|-------------|-------|
| Print | `<print-page>` | Yes | Exists. Triggers `window.print()` with optional raw toggle |
| Text Reader | `<text-reader>` | Yes | Exists. TTS via Web Speech API. Uses `for` attribute |
| Theme Picker | `<theme-picker>` | Yes | Exists. May want a compact/icon-only variant for page-tools context |
| Page Info | `<page-info>` | Yes | Exists (spec). Add `data-compact` variant for toolbar display |
| Highlights | `data-highlight-notes` | Yes | Exists. The toolbar is selection-triggered, not a page-tool per se |

### New Components (to be built)

| Tool | Tag | JS Required | Notes |
|------|-----|-------------|-------|
| Share | `<share-page>` | Yes | `navigator.share()` with fallback URL copy. Spec exists (`share-wc-spec.md`) |
| Reading Stats | `<page-stats>` | No (SSR) / Yes (CSR) | Defined in this spec. Lightweight reading time/word count |
| Reader View | `<reader-view>` | Yes | Distraction-free mode. Spec exists (`READER-VIEW-SPEC.md`) |
| Copy Link | `<button data-copy>` | Yes | Already exists as `data-copy` attribute behavior |

### Custom / Third-Party Tools

Any element works as a tool. Authors can slot in:

```html
<page-tools>
  <!-- A plain link -->
  <a href="/pdf/this-page.pdf" class="page-tools-button">
    <icon-wc name="file-text" size="sm"></icon-wc>
    <span class="sr-only">Download PDF</span>
  </a>

  <!-- A custom web component -->
  <bookmark-button data-slug="this-page"></bookmark-button>
</page-tools>
```

---

## Integration Points

### With `layout-sidebar`

The most natural placement. `page-tools` lives in the sidebar column:

```html
<layout-sidebar data-side="right" data-sticky>
  <main>
    <article id="article-content">...</article>
  </main>
  <aside>
    <page-toc data-levels="h2,h3"></page-toc>
    <page-tools data-position="sticky">
      <page-stats data-for="article-content"></page-stats>
      <print-page></print-page>
      <share-page></share-page>
    </page-tools>
  </aside>
</layout-sidebar>
```

### With `page-info`

`page-info` is a valid child of `page-tools`. When used together, `page-info`
handles provenance/trust and `page-stats` handles reading metrics. They
don't overlap:

```html
<page-tools>
  <page-stats data-for="article-content" data-show="reading-time"></page-stats>
  <page-info data-compact></page-info>
  <print-page></print-page>
</page-tools>
```

If a site uses `page-info` with `data-reading-time` computation, and also
slots in `page-stats`, there's a duplication risk. The recommendation is:
use one or the other, not both for reading time. `page-stats` is the
lightweight path; `page-info` is the full-featured path.

### With the Manifest System

The site manifest (`SITE-MANIFEST.md`) can declare which tools are available
site-wide, and the page manifest (`PAGE-MANIFEST.md`) can override per page:

```json
{
  "pageTools": {
    "tools": ["page-stats", "print-page", "share-page"],
    "position": "sticky",
    "fabIcon": "ellipsis-vertical"
  }
}
```

This enables `data-auto` rendering where the component reads the manifest
and self-populates — useful for sites where tool selection is a site-level
setting, not a per-page authoring decision.

### With SSG (11ty)

The `eleventy.after` hook or a transform can:

1. Compute word count and reading time at build
2. Inject `page-stats` with pre-rendered `<dl>` content
3. Add `data-last-modified` from git or front matter

This gives the SSR baseline that the web component adopts on hydration.

---

## Build Order

### Phase 1: Container + `page-stats`

1. **`page-stats` custom element** — SSR-adoptable, word count + reading time
2. **`page-tools` CSS** — Layout, orientation, sticky/fixed/inline positioning
3. **`page-tools` web component** — Auto-discovery, `matchMedia` breakpoint listener
4. **FAB + popover collapse** — Native `<popover>`, DOM move strategy

### Phase 2: Mobile Polish

5. **CSS Anchor Positioning** for popover-to-FAB alignment (with fallback)
6. **Transition/animation** for FAB and popover appearance
7. **Touch gesture** — swipe-to-dismiss on the popover (optional, via existing gesture system)

### Phase 3: Ecosystem Integration

8. **`share-page`** — Build from existing spec
9. **`reader-view`** — Build from existing spec
10. **`page-info data-compact`** — Compact variant for toolbar context
11. **`theme-picker` compact variant** — Icon-only mode for page-tools
12. **11ty plugin** — SSR pre-rendering of `page-stats`

---

## Open Questions

### Architectural

1. **Should `page-tools` use Shadow DOM for its FAB/popover infrastructure?**
   Shadow DOM would cleanly isolate the FAB button and popover from the
   tool children (which remain in light DOM). But it adds complexity and
   breaks the "light DOM preference" principle. Current lean: light DOM
   with `data-page-tools-internal` markers.

2. **Unique ID generation for popover.** Multiple `page-tools` on one page
   (e.g., one sticky, one inline at article end) need unique `id` values
   for the popover. Use `crypto.randomUUID()` or a counter?

3. **Should the FAB show a tool count badge?** e.g., a small "4" indicating
   how many tools are available. Useful for discoverability, but adds
   visual noise.

### Behavioral

4. **Scroll-aware FAB visibility.** Should the FAB hide while the user
   is actively scrolling and reappear on pause? Reduces visual clutter
   but adds interaction complexity. Related: should it hide when the
   desktop toolbar is visible in the viewport?

5. **Tool ordering.** Auto-discovery preserves DOM order. Should `page-tools`
   support `data-order` on children for reordering, or is DOM order
   sufficient?

6. **Popover dismissal.** Native popover has light dismiss. Should ESC
   also close it? (It does by default with `popover`.) Should focus
   return to the FAB on close?

### Compatibility

7. **`popover` browser support.** Baseline 2024. For older browsers,
   should the component fall back to a `<dialog>` or just leave tools
   in their original position (no collapse)?

8. **CSS Anchor Positioning** is Baseline 2025 (Chromium 125+, Firefox 131+,
   Safari pending). The popover positioning should work without it via
   fixed positioning fallback.

---

## Cross-References

- `share-wc-spec.md` — Share button component
- `READER-VIEW-SPEC.md` — Distraction-free reading mode
- `page-info-provenance-spec.md` — Full provenance and content trust
- `PAGE-MANIFEST.md` — Per-page runtime declarations
- `SITE-MANIFEST.md` — Site-wide configuration
- `BUNDLE-SYSTEM.md` — CSS/JS bundle architecture
