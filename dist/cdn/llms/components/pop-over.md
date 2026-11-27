# <pop-over>

General-purpose popover container with CSS Anchor Positioning. Wraps the native Popover API, binds an anchor element (appending to its anchor-name list), and re-asserts display:none under VB's cascade layers. Trigger via the standard popovertarget attribute. The host has no role: authors supply the semantics.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/pop-over/
- Vanilla Breeze 0.7.4

## Example

```html
<button popovertarget="prefs">Preferences</button>
<pop-over id="prefs" data-position="bottom-start">
  <p>Pop content here.</p>
</pop-over>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-mode` | `auto`, `manual`, `hint` | `auto` | Popover type: 'auto' (default, light-dismiss + Escape, closes other auto popovers), 'manual' (script-only), 'hint' (light-dismiss without closing open auto popovers; falls back to 'auto' where popover="hint" is unsupported). Hover opening is not wired (use interestfor or tool-tip). Changes after upgrade re-apply the popover attribute; an authored popover attribute wins at upgrade. |
| `data-anchor` | string |  | ID (or CSS selector) of the anchor element to position against. If omitted, the component uses the first element whose popovertarget points at this pop-over. Changes after upgrade re-wire the anchor. |
| `data-position` | `top`, `bottom`, `left`, `right`, `top-start`, `top-end`, `bottom-start`, `bottom-end`, `left-start`, `left-end`, `right-start`, `right-end` | `bottom` | Where to place the popover relative to the anchor; -start/-end are logical (mirror in RTL). Flips to the opposite side instead of overflowing the viewport. Default: 'bottom'. |
| `data-offset` | `none`, `xs`, `s`, `m`, `l` | `xs` | Gap between popover and anchor, mapped to --size-* tokens. Default: 'xs'. |
| `data-anchor-name` | string |  | Set by the runtime when an anchor is bound with CSS Anchor Positioning: the dashed-ident appended to the anchor's anchor-name and used as this host's position-anchor. Absent when there is no anchor or no anchor-positioning support. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `pop-over:show` | `{ state: 'open' }` | Fired (bubbles, composed) on beforetoggle as the popover opens, whether by popovertarget, show() or showPopover(). |
| `pop-over:hide` | `{ state: 'closed' }` | Fired (bubbles, composed) on beforetoggle as the popover closes, including light-dismiss and Escape. |

## Methods

| Method | Description |
| --- | --- |
| `show()` | Open the popover (no-op if already open). |
| `hide()` | Close the popover (no-op if already closed). |
| `toggle()` | Open if closed, close if open. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `open` | `boolean` | Read-only. True while the popover is open (:popover-open). |

## Accessibility

- Pattern: Native popover
- You provide: A trigger button with popovertarget set to the element's id
- The component manages: `popover`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Escape` | Close the popover | Native behaviour of popover in auto and hint modes |
