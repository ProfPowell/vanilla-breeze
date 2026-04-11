---
title: "Glossary WC Specification"
component: glossary-wc
version: 1.0.0
status: stable
---

# Glossary WC

HTML-first searchable glossary using a native `<dl>` definition list with progressive enhancement.

## Purpose

Progressively enhances a semantic `<dl>` into a searchable, categorized, cross-linked glossary with alphabet navigation. Without JavaScript, users see a standard definition list. With JavaScript, the component adds search filtering, collapsible category groups, an A-Z jump bar, and term count badges.

Part of the **UX Planning Pack**.

## Static HTML Form

```html
<glossary-wc title="Project Glossary" searchable>
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
| `title` | string | — | Glossary heading |
| `src` | string | — | JSON data URL |
| `searchable` | boolean | — | Enables search input |
| `compact` | boolean | — | Reduced spacing |

### Child Attributes (on `<div>` inside `<dl>`)

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-category` | string | Category label for grouping |
| `data-term-id` | string | Unique ID, becomes fragment anchor |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `glossary-wc:ready` | `{ termCount, categories }` | After setup |
| `glossary-wc:search` | `{ query, matchCount }` | On search input |

## Failure Modes

- **No JavaScript:** Definition list renders normally as native `<dl>`.
- **No CSS:** Definition list renders as default HTML.
- **Keyboard Only:** Tab navigates search, jump bar, and category toggles.
- **Screen Reader:** Native `<dl>`/`<dt>`/`<dd>` semantics preserved; live region announces search results.

## Accessibility

- Native `<dl>`, `<dt>`, `<dd>` semantics preserved in enhanced view
- Search input has `aria-label` for screen readers
- Category toggles use `aria-expanded` for collapsible state
- `aria-live="polite"` region announces search match count
- Jump bar letters use `aria-disabled` for inactive letters
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
