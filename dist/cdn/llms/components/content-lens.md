# <content-lens>

Universal switchable host for VB lens components; JS API: activeLens (read-only), setLens(name)

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/content-lens/
- Vanilla Breeze 0.7.4

## Example

```html
<content-lens data-lens-default="trust" data-lens-src="/pages.json">
  <time-index   data-lens-name="time">…</time-index>
  <author-index data-lens-name="author"></author-index>
  <topic-map    data-lens-name="topic"></topic-map>
  <trust-filter data-lens-name="trust"></trust-filter>
</content-lens>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-lens-default` | string |  | Lens name to show on first load |
| `data-lens-controls` | string |  | "on" (default) \| "off" — render reader controls |
| `data-lens-src` | string |  | Shared JSON source URL forwarded to lens children lacking their own data-lens-src/src (order-independent; already-upgraded children are re-initialised) |
| `data-lens-storage` | string |  | Key for sessionStorage persistence (default: pathname) |
| `data-active-lens` | string |  | Reflects the currently active lens |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-lens-name` | direct lens child | string |  | Registers the child as a switchable lens; value used by data-lens-default, setLens() and the event detail |
| `data-lens-label` | direct lens child | string |  | Chip text (default: humanised data-lens-name) |

## Slots

| Slot | Description |
| --- | --- |
| `default` | Lens components, each with data-lens-name |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `content-lens:change` | `{ lens: string }` | Fires when the reader or setLens() changes the active lens; not on the initial/restored selection |

## Methods

| Method | Description |
| --- | --- |
| `setLens(name)` | Switch to the named lens (ignored if unknown). Persists the choice; fires content-lens:change only when the lens actually changes. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `activeLens` | `string` | data-lens-name of the visible lens ('' before upgrade). |

## Accessibility

- Pattern: Native form controls
- You provide: A data-lens-label on each lens when its data-lens-name does not read well as a radio label
- The component manages: `hidden`
