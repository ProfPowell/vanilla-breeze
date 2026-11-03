---
title: "Glossary WC Specification"
component: glossary-wc
version: 1.0.0
status: stable
---

# Glossary WC

HTML-first searchable glossary using a native `<dl>` definition list with progressive enhancement.

## Purpose

Progressively enhances a semantic `<dl>` into a searchable, categorized, cross-linked glossary with letter navigation. Without JavaScript, users see a standard definition list. With JavaScript, the component adds search filtering, collapsible category groups, a letter jump bar, and term count badges.

Part of the **UX Planning Pack**.

## Static HTML Form

```html
<glossary-wc data-title="Project Glossary" searchable>
  <dl>
    <div data-category="Domain" data-term-id="velocity">
      <dt>Velocity</dt>
      <dd>The amount of work a team can complete in a sprint.</dd>
    </div>
    <div data-category="Technical" data-term-id="api-gateway">
      <dt>API Gateway</dt>
      <dd>Single entry point for all client requests.</dd>
    </div>
  </dl>
</glossary-wc>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-title` | string | — | Glossary heading (rendered as a heading; `title` is not used) |
| `data-heading-level` | number | `2` | Heading level 1–6 |
| `src` | string | — | JSON data URL, fetched once per URL; inline `<dl>` is the fallback |
| `searchable` | boolean | — | Enables search input (in a `<search>` landmark) |
| `compact` | boolean | — | Reduced spacing |
| `data-state` | read-only | — | `src` mode: `loading` / `ready` / `error` |
| `data-label-*` | string | — | UI strings: `search`, `search-placeholder`, `terms`, `alphabet`, `found-<plural>`, `all-<plural>`, `uncategorized`, `see-also`, `error` |

### Child Attributes (on `<div>` inside `<dl>`)

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-category` | string | Category label for grouping |
| `data-term-id` | string | Unique ID, becomes fragment anchor |

## Properties

| Property | Description |
|----------|-------------|
| `terms` | Get `{ id, term, definition, category, seeAlso? }[]`; assign records (JSON format below) to rebuild |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `glossary-wc:ready` | `{ termCount, categories }` | After every render (not while `src` is loading) |
| `glossary-wc:search` | `{ query, matchCount }` | After the debounced search is applied |
| `glossary-wc:terms-changed` | `{ terms, source: 'property' }` | After `terms` assignment |
| `glossary-wc:error` | `{ url, error }` | When `src` fails to load |

## Failure Modes

- **No JavaScript:** Definition list renders normally as native `<dl>`.
- **No CSS:** Definition list renders as default HTML.
- **Keyboard Only:** Tab navigates search, jump bar, and category toggles.
- **Screen Reader:** Native `<dl>`/`<dt>`/`<dd>` semantics preserved; live region announces search results.

## Accessibility

- Native `<dl>`, `<dt>`, `<dd>` semantics preserved in enhanced view
- Search input sits in a `<search>` landmark with an `aria-label`
- Category toggles use `aria-expanded` / `aria-controls`; matches in collapsed categories are revealed while searching
- One `aria-live="polite"` region announces the match count (and the total when cleared); count badges are `aria-hidden`
- Jump-bar letters are derived from the terms with `Intl.Collator` for the element's `lang` (digits/symbols under `#`), are ≥24px targets, and are `aria-disabled` while no visible term starts with them
- `prefers-reduced-motion: reduce` disables transitions
- Print styles hide search and jump bar, show all terms

## CSS Custom Properties

Inherits design tokens from the Vanilla Breeze system. No component-specific custom properties required.

## JSON Schema

```json
{
  "title": "Project Glossary",
  "terms": [
    {
      "id": "velocity",
      "term": "Velocity",
      "definition": "The amount of work a team can complete in a sprint.",
      "category": "Domain",
      "seeAlso": ["epic", "sprint"]
    }
  ]
}
```

`definition` is rendered as text. `definitionHtml` (optional) is an explicit opt-in for formatted definitions, passed through `src/lib/sanitize-html.js` and used instead of `definition`. `seeAlso` links are labelled with the target term's text.
