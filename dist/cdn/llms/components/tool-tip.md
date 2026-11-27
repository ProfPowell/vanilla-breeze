# <tool-tip>

Tooltip or hover card composed on <pop-over>: hover/focus with delay, interestfor where available, Escape and outside dismiss

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/tooltip/
- Vanilla Breeze 0.7.4

## Example

```html
<!-- No JS: native browser tooltip shows "This is a tooltip!" -->
<!-- With JS: title removed, styled popover tooltip created -->
<button title="This is a tooltip!" data-tooltip>Hover me</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `content` | string |  | Plain-text tooltip content (a <template data-tooltip> child wins; the trigger's title is the last fallback) |
| `position` | `top`, `bottom`, `left`, `right` |  | Placement; tooltips default to top, cards to bottom |
| `delay` | number |  | Hover show delay in ms on the JS path (default 200; cards 300) |
| `variant` | `card` |  | Omit for a text tooltip; card for an interactive hover card |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-tooltip` | template | boolean |  | Rich tooltip content (HTML) for the default variant |
| `data-trigger` | * | boolean |  | Card variant: the element that opens the card |
| `data-content` | * | boolean |  | Card variant: the card body. Moved into the card while upgraded and put back on disconnect |
| `title` | * | string |  | On the trigger: tooltip text fallback. Removed while upgraded (kept as aria-label when it was the trigger's only name) and restored on disconnect |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `tool-tip:show` |  | Fired (bubbles) as the tooltip or card opens |
| `tool-tip:hide` |  | Fired (bubbles) as the tooltip or card closes |

## Methods

| Method | Description |
| --- | --- |
| `show()` | Open now (no delay) |
| `hide()` | Close now |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `isVisible` | `boolean` | Read-only. True while the tooltip or card is open |

## Accessibility

- Pattern: Tooltip
- You provide: A focusable trigger as the first child, and the tip text in a template, the content attribute or the trigger's title
- The component manages: `role="tooltip"`, `aria-describedby`, `aria-label`, `aria-controls`, `aria-expanded`, `aria-hidden`, `popover`, `interestfor`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Escape` | Hide the tooltip or card; from inside a card, return focus to the trigger | Tooltip or card showing, focus anywhere on the page |
