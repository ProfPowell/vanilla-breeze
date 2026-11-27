# <site-map>

Dual-mode sitemap: a lightweight static-sitemap enhancer (nav-enhance) or an interactive information-architecture tree with badges and an org-chart visual mode (ia-tree)

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/site-map/
- Vanilla Breeze 0.7.4

## Example

```html
<site-map>
  <nav aria-label="Full site map">
    <ul>
      <li>
        <details>
          <summary><a href="/docs/">Documentation</a></summary>
          <ul>
            <li><a href="/docs/quick-start/">Quick Start</a></li>
            <li>
              <details>
                <summary><a href="/docs/elements/">Elements</a></summary>
                <ul>
                  <li><a href="/docs/elements/native/">Native</a></li>
                  <li><a href="/docs/elements/web-components/">Web Components</a></li>
                </ul>
              </details>
            </li>
          </ul>
        </details>
      </li>
      <li><a href="/about/">About</a></li>
      <li><a href="/blog/">Blog</a></li>
    </ul>
  </nav>
</site-map>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `mode` | `nav-enhance`, `ia-tree` | `nav-enhance` | Behavior mode: nav-enhance (static sitemap enhancer) or ia-tree (interactive IA tree) |
| `current` | string |  | [nav-enhance] Pathname of the current page |
| `src` | string |  | URL to JSON data (nav-enhance: { children: [{ title, href, children }] }, ia-tree: { title, pages }). Strings render as text; only http(s), relative and fragment hrefs become links. |
| `data-label-expand` | string | `Expand all` | [nav-enhance] Text of the expand-all button |
| `data-label-collapse` | string | `Collapse all` | [nav-enhance] Text of the collapse-all button |
| `data-label-controls` | string | `Sitemap controls` | [nav-enhance] Accessible name of the controls landmark |
| `title` | string |  | [ia-tree] Site map heading and tree name. Changing it rebuilds the tree. |
| `collapsed` | boolean |  | [ia-tree] Start all nodes collapsed. Changing it rebuilds the tree. |
| `compact` | boolean |  | [ia-tree] Reduced spacing variant (CSS only) |
| `data-view` | `visual` |  | [ia-tree] Set to "visual" for the SVG org-chart visualization. Changing it rebuilds. |
| `data-orientation` | `vertical`, `horizontal` | `vertical` | [ia-tree visual] Layout orientation. The toolbar flips it; setting it re-renders the chart. |
| `data-detail` | `0`, `1`, `2`, `3`, `4` | `2` | [ia-tree visual] Node detail: 0 shape, 1 title, 2 full, 3 full + status, 4 wireframe. The toolbar slider sets it; setting it re-renders the chart. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-page-type` | li | string |  | [ia-tree] Page type: layout \| section \| dashboard \| page \| modal \| redirect |
| `data-template` | li | string |  | [ia-tree] Template or view name shown as a badge |
| `data-status` | li | string |  | [ia-tree] Page status: draft \| ready \| live \| deprecated |
| `data-sitemap` | nav | boolean |  | [nav-enhance] Marks a sitemap nav for the outline styling outside a <site-map> (inside one, the child nav is styled without it) |
| `data-sitemap-section` | li | boolean |  | [nav-enhance] A top-level item that is a headed block: an <h2> followed by a <ul> of groups laid out side by side |
| `data-sitemap-leaves` | ul | boolean |  | [nav-enhance] A long run of leaf pages that flows into columns |
| `data-sitemap-label` | span | boolean |  | [nav-enhance] Label of a branch that has no page of its own |
| `data-sitemap-updated` | small | boolean |  | [nav-enhance] A muted note of when a page, branch or section last changed |

## Structure

| Child | Description |
| --- | --- |
| `<nav>` | The sitemap: nested <ul>/<li><a> (ia-tree) or <details>/<summary> sections (nav-enhance) |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `site-map:ready` | `{ nodeCount, depth }` | [ia-tree] Fired after the tree (or visual chart) is built |
| `site-map:select` | `{ href, pageType, template }` | [ia-tree] A node or its link was clicked |
| `site-map:pages-changed` | `{ pages, source: 'property' }` | [ia-tree] Fired after assigning the pages property rebuilds the tree |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `pages` | `Array<{ label, href?, pageType?, template?, status?, children? }>` | [ia-tree] Get the page tree as data, or assign one to rebuild (collapse state resets) |

## Accessibility

- Pattern: Native details/summary (default mode); Tree view (ia-tree mode)
- You provide: A <nav> with an aria-label wrapping nested lists of links, grouped with <details> in the default mode
- The component manages: `role="tree"`, `role="treeitem"`, `role="group"`, `aria-expanded`, `aria-current`, `aria-label`, `aria-hidden`, `aria-activedescendant`, `aria-selected`, `aria-level`, `aria-setsize`, `aria-posinset`, `aria-valuetext`, `tabindex roving`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Open or close a group | Native behaviour of summary (default mode) |
| `ArrowDown` | Move to the next visible node | ia-tree mode, focus on a tree item |
| `ArrowUp` | Move to the previous visible node | ia-tree mode, focus on a tree item |
| `ArrowRight` | Expand a collapsed node, or move to the first child of an expanded node (reversed in right-to-left) | ia-tree mode, focus on a tree item |
| `ArrowLeft` | Collapse an expanded node, or move to the parent node (reversed in right-to-left) | ia-tree mode, focus on a tree item |
| `Enter` | Follow the node's link, or toggle a node that has no link | ia-tree mode, focus on a tree item |
| `Space` | Toggle a node that has children, or follow the link of a leaf node | ia-tree mode, focus on a tree item |
| `Home` | Move to the first node | ia-tree mode, focus on a tree item |
| `End` | Move to the last visible node | ia-tree mode, focus on a tree item |
| `ArrowDown` | Move to the first child of the active node | ia-tree mode with data-view="visual", vertical orientation (default), focus on the diagram |
| `ArrowUp` | Move to the parent of the active node | ia-tree mode with data-view="visual", vertical orientation (default), focus on the diagram |
| `ArrowRight` | Move to the next sibling | ia-tree mode with data-view="visual", vertical orientation (default), focus on the diagram |
| `ArrowLeft` | Move to the previous sibling | ia-tree mode with data-view="visual", vertical orientation (default), focus on the diagram |
| `ArrowRight` | Move to the first child of the active node | ia-tree mode with data-view="visual" and data-orientation="horizontal", focus on the diagram |
| `ArrowLeft` | Move to the parent of the active node | ia-tree mode with data-view="visual" and data-orientation="horizontal", focus on the diagram |
| `ArrowDown` | Move to the next sibling | ia-tree mode with data-view="visual" and data-orientation="horizontal", focus on the diagram |
| `ArrowUp` | Move to the previous sibling | ia-tree mode with data-view="visual" and data-orientation="horizontal", focus on the diagram |
| `Enter` | Follow the active node's link, or expand or collapse a node that has no link | ia-tree mode with data-view="visual", focus on the diagram |
| `Space` | Expand or collapse the active node | ia-tree mode with data-view="visual", focus on the diagram |
| `Home` | Move to the root node | ia-tree mode with data-view="visual", focus on the diagram |
| `End` | Move to the last visible node | ia-tree mode with data-view="visual", focus on the diagram |
