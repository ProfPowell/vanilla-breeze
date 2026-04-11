# `<site-map-wc>`

Information architecture tree component for visualizing site structure.

## Overview

A Light DOM web component (extends VBElement) that progressively enhances a nested `<nav>` with `<ul>`/`<li>` structure into an interactive IA tree. Features page-type badges, expand/collapse toggles, template labels, status indicators, and keyboard navigation.

Without JS the nested list renders normally as a readable site hierarchy.

## Usage

```html
<site-map-wc title="My Site Architecture">
  <nav>
    <ul>
      <li data-page-type="layout" data-template="app-shell">
        <a href="/">Home</a>
        <ul>
          <li data-page-type="page" data-template="detail">
            <a href="/about">About</a>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</site-map-wc>
```

## Attributes

| Attribute   | Type    | Description                     |
|-------------|---------|---------------------------------|
| `title`     | string  | Site map heading                |
| `src`       | string  | URL to JSON data                |
| `collapsed` | boolean | Start all nodes collapsed       |
| `compact`   | boolean | Reduced spacing variant         |

## Child Attributes (on `<li>`)

| Attribute        | Type   | Values                                              |
|------------------|--------|-----------------------------------------------------|
| `data-page-type` | string | layout, section, dashboard, page, modal, redirect   |
| `data-template`  | string | Template/view name (free text)                      |
| `data-status`    | string | draft, ready, live, deprecated                      |

## Events

| Event               | Detail                          | When                           |
|---------------------|---------------------------------|--------------------------------|
| `site-map-wc:ready` | `{ nodeCount, depth }`          | After component initializes    |
| `site-map-wc:select`| `{ href, pageType, template }`  | Node link clicked              |

## JSON Schema

```json
{
  "title": "Site Map",
  "pages": [
    {
      "label": "Home",
      "href": "/",
      "pageType": "layout",
      "template": "app-shell",
      "children": []
    }
  ]
}
```

## Keyboard

| Key        | Action                                    |
|------------|-------------------------------------------|
| ArrowDown  | Move to next visible node                 |
| ArrowUp    | Move to previous visible node             |
| ArrowRight | Expand node or move to first child        |
| ArrowLeft  | Collapse node or move to parent           |
| Enter      | Toggle expand/collapse                    |
| Space      | Follow link                               |
| Home       | Focus first node                          |
| End        | Focus last visible node                   |

## Pack

Part of the **UX Planning Pack** (`ux-planning`).
