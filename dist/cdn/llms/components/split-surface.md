# <split-surface>

Resizable split panel with drag, keyboard, collapse, and persistence support. The injected .split-divider is a focusable role="separator" with aria-valuenow/-valuetext

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/splitter/
- Vanilla Breeze 0.7.4

## Example

```html
<!-- Light JS — auto-injected divider -->
<section data-layout="sidebar" data-splitter>
  <nav aria-label="Sidebar">Sidebar content</nav>
  <main>Main content</main>
</section>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `direction` | `horizontal`, `vertical` | `horizontal` | Split axis. Observed |
| `position` | number | `50` | Default split position as a percentage (0–100). A persisted value wins over it on load. Observed (changes apply), not reflected: read the live value from the position property |
| `min` | number | `10` | Minimum panel size percentage. Observed |
| `max` | number | `90` | Maximum panel size percentage. Observed |
| `persist` | string |  | VBStore key suffix under namespace 'layout' (vb:layout:split:{key}); stores { position, collapsed } after user resizes and wins over the position attribute on load |
| `collapsible` | boolean |  | Enter or double-click on the divider collapses / expands the first panel (collapsed panel is inert; aria-valuemin becomes 0). Observed |
| `data-label-resize` | string | `Resize panels` | Accessible name of the divider |
| `data-label-collapsed` | string | `Collapsed` | Divider aria-valuetext while the first panel is collapsed (otherwise "{n}%") |

## Structure

| Child | Description |
| --- | --- |
| `first child` | First panel content (the one the divider resizes and collapses) |
| `second child` | Second panel content — divider is auto-created between them |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `split-surface:resize` | `{ position, source }` | Fired when the split changes; source is 'pointer', 'keyboard', 'api' or 'attribute'. Not fired on initial load / reconnect |
| `split-surface:collapse` | `{ collapsed, source }` | Fired when the first panel is collapsed or expanded |

## Methods

| Method | Description |
| --- | --- |
| `reset()` | Expand, return to the position attribute (or 50), and clear the persisted value |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `position` | `number` | Live split percentage (0 while collapsed). Settable; non-numeric values are ignored. Safe to set before the element finishes initialising (queued) |
| `collapsed` | `boolean` | Whether the first panel is collapsed. Settable (queued before init) |

## Custom states

| State | Description |
| --- | --- |
| `:state(divider-dragging)` | The divider is being dragged |
| `:state(collapsed)` | The first panel is collapsed |

## Accessibility

- Pattern: Window splitter
- You provide: Two child panels; set data-label-resize when the default "Resize panels" name does not fit
- The component manages: `role="separator"`, `aria-controls`, `aria-orientation`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`, `aria-label`, `tabindex`, `inert`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowLeft` | Shrink the first panel by 1% (reversed in right-to-left) | Focus on the divider, side-by-side panels |
| `ArrowRight` | Grow the first panel by 1% (reversed in right-to-left) | Focus on the divider, side-by-side panels |
| `ArrowUp` | Shrink the first panel by 1% | Focus on the divider, direction="vertical" |
| `ArrowDown` | Grow the first panel by 1% | Focus on the divider, direction="vertical" |
| `Shift+ArrowLeft` / `Shift+ArrowRight` / `Shift+ArrowUp` / `Shift+ArrowDown` | Resize in 10% steps in the direction of the arrow | Focus on the divider |
| `Home` | Shrink the first panel to its minimum size | Focus on the divider |
| `End` | Grow the first panel to its maximum size | Focus on the divider |
| `Enter` | Collapse the first panel, or restore it when collapsed | Focus on the divider, collapsible attribute set |
