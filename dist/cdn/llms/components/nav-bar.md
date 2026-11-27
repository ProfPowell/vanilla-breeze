# <nav-bar>

Top-level site/app navigation primitive. HTML-first wrap or JSON-first .items setter; auto aria-current sync via URL matching (origin + normalised pathname) on popstate and Navigation API entry changes.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/nav-bar/
- Vanilla Breeze 0.7.4

## Example

```html
<nav-bar aria-label="Main">
  <a href="/">Home</a>
  <a href="/docs/">Docs</a>
  <a href="/docs/elements/">Elements</a>
  <a href="/changelog/">Changelog</a>
</nav-bar>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `aria-label` | string |  | Accessible name for the navigation region. |
| `data-match` | `exact` |  | Pathname matching strictness. 'exact' requires exact match. Default: exact wins, longest prefix breaks ties, first-in-DOM-order breaks remaining ties. |
| `data-label-new-tab` | string |  | Screen-reader suffix appended to external .items links. Default: '(opens in new tab)'. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `href` | a | string |  | Standard anchor href. Resolved against the document base URL and matched by origin + normalised pathname (trailing slash, query and hash ignored). |
| `data-route` | a | string |  | Optional .current target. Falls back to href when absent. |
| `data-nav-link` | a | boolean |  | Marks a descendant <a> as a candidate for active-state matching when the link list is wrapped (e.g. inside <li> or <drop-down>). When any descendant carries this attribute, those replace 'direct children' as the candidate set. When none of them matches the location but a link nested beside one does (a menu item in the same <drop-down> or <li>), that one gets aria-current="true" as the current section. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `nav-bar:upgraded` |  | Fired after every connect, including reconnects after a move. |
| `nav-bar:items-changed` | `{ items, source: 'property' }` | Fired after .items is assigned a new (not deep-equal) value. |
| `nav-bar:current-changed` | `{ current, previous, source: 'property' \| 'popstate' \| 'navigation' \| 'pathname' }` | Fired when the active link changes. |

## Methods

| Method | Description |
| --- | --- |
| `releaseCurrent()` | Drop explicit ownership of .current and re-run URL matching. |
| `refresh()` | Re-run URL matching manually (for routers that change the URL without popstate or the Navigation API). No-op while .current is explicitly owned. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `items` | `Array<{ href, label, route?, icon?, external?, badge? }>` | Read returns the last assigned array, else { href, label } inferred from the managed links. Assigning replaces the direct <a> children with the default renderer (deep-equal assignment is a no-op). Only http(s) and relative hrefs render as links. |
| `current` | `string \| null` | Read returns the active route (data-route or href of the aria-current link, or the explicit value). Assigning takes ownership: URL sync stops until releaseCurrent(). |

## Accessibility

- Pattern: Landmark navigation
- You provide: An aria-label on the host, or on the wrapped <nav>, that names the navigation
- The component manages: `role="navigation"`, `aria-current`
