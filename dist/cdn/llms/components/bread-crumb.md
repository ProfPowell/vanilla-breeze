# <bread-crumb>

Hierarchical navigation trail. Wraps existing <ol> markup HTML-first (canonical markup: inside <nav aria-label="Breadcrumb">), or auto-generates from window.location.pathname. Emits BreadcrumbList JSON-LD for SEO.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/bread-crumb/
- Vanilla Breeze 0.7.4

## Example

```html
<nav aria-label="Breadcrumb">
  <bread-crumb>
    <ol>
      <li><a href="/docs/">Docs</a></li>
      <li><a href="/docs/elements/">Elements</a></li>
      <li><span aria-current="page">Bread Crumb</span></li>
    </ol>
  </bread-crumb>
</nav>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-from-pathname` | boolean |  | When present, auto-generates the trail from window.location.pathname. Each path segment is URL-decoded and becomes a crumb (Title-Cased by default; override per segment via the .labels property). A leading Home crumb is always added. |
| `data-current-label` | string |  | Label for the final (current page) crumb when auto-generating. Takes precedence over .labels; if omitted, .labels or the Title-Cased last path segment is used. |
| `data-separator` | string |  | Separator glyph variant: 'chevron', 'arrow', 'dot', 'pipe'. Unset uses the theme's --sep-breadcrumb token (› by default). Drives the --_separator CSS var; separators are decorative (empty CSS alt text) and not announced. |
| `data-collapsed` | boolean |  | Hide middle crumbs, keeping the first crumb, the parent (second-to-last) and the current page. With four or more crumbs the component inserts an ellipsis <button aria-expanded> (accessible name 'Show full path') after the first crumb that reveals the hidden crumbs. |
| `data-jsonld` | string |  | BreadcrumbList JSON-LD emission: 'on' (default) or 'off'. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-truncated` | li | boolean |  | Apply to a crumb <li> to truncate its link/label with an ellipsis (max-inline-size 10rem). The full text is still read by screen readers. |

## Structure

| Child | Description |
| --- | --- |
| `<ol>` | The trail; one <li> per crumb containing an <a> (ancestors) or <span> (current page). Generated in data-from-pathname mode. |
| `<li data-crumb-toggle>` | Injected by data-collapsed: wraps the 'Show full path' <button aria-expanded>. Excluded from aria-current and JSON-LD. |
| `<script type="application/ld+json">` | Appended BreadcrumbList JSON-LD (unless data-jsonld="off"); item URLs are the anchors' resolved hrefs. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `bread-crumb:upgraded` |  | Fired after setup completes |
| `bread-crumb:toggle` | `{ expanded }` | Fired when the data-collapsed toggle button expands or collapses the trail |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `labels` | `Record<string, string>` | Segment → label map for data-from-pathname mode. Keys may be a full pathname ('/docs/elements/'), a pathname without the trailing slash, or a single (decoded or raw) segment; '/' or 'home' relabels the Home crumb. Assigning re-renders the trail. |

## Accessibility

- Pattern: Breadcrumb
- You provide: An <ol> of links, or a <nav aria-label> around the list
- The component manages: `role="navigation"`, `aria-label`, `aria-current`, `aria-expanded`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Show or hide the collapsed crumbs | Native behaviour of <button> (the ellipsis toggle) |
