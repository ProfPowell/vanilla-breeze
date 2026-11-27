# <context-menu>

Right-click (and Shift+F10 / ContextMenu key) menu with keyboard navigation and shortcut bindings

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/context-menu/
- Vanilla Breeze 0.7.4

## Example

```html
<context-menu>
  <p data-trigger>Right-click anywhere here</p>
  <menu>
    <li><button>Cut</button></li>
    <li><button>Copy</button></li>
    <li><button>Paste</button></li>
    <li role="separator"></li>
    <li><button class="danger">Delete</button></li>
  </menu>
</context-menu>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-open` | boolean |  | Reflected when context menu is visible. Uses data-open because the host is not a native dialog/details — open would be semantically misleading. |
| `data-label-available` | string | `Context menu available` | Description (aria-description) set on a trigger that is not a control, so screen readers announce that a menu exists. Not used when the trigger has its own aria-description or aria-describedby. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-trigger` | * | boolean |  | Element defining the right-click target area |
| `data-group` | li | boolean |  | Group label row. It and the items after it (up to the next label or separator) are wrapped in role="group" named by the label |
| `data-shortcut` | button, a | string |  | Keyboard shortcut bound page-wide (hotkey-bind, preventDefault) and shown as a badge, e.g. 'f2' or 'shift+d'. Never use clipboard combos. |
| `data-disabled` | button, a | boolean |  | Disabled item: aria-disabled="true", stays in the arrow-key order, cannot be activated |
| `data-value` | button, a | string |  | Value reported in context-menu:select detail.value and the items property |

## Structure

| Child | Description |
| --- | --- |
| `any element with data-trigger` | Right-click target area. Made focusable (tabindex="0") when it is not already. A control (button, link, or a focusable element with a widget role) gets aria-haspopup="menu", aria-expanded and aria-controls; any other trigger gets an aria-description instead. These are removed on disconnect |
| `<menu>` | Context menu with <li> items holding <button> or <a> actions; <li data-group> labels and <li role="separator"> rows |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `context-menu:open` |  | Fired when the menu opens |
| `context-menu:close` |  | Fired when the menu closes |
| `context-menu:select` | `{ item, value }` | Fired when an item is activated by click, keyboard or its shortcut (not for disabled items) |
| `context-menu:items-changed` | `{ items, source: 'property' }` | Fired after the items property rebuilds the menu |

## Methods

| Method | Description |
| --- | --- |
| `close()` | Close the menu |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `items` | `Array<{ label, value?, href?, shortcut?, disabled? } \| { group } \| { separator: true }>` | Get the menu as data, or assign to rebuild it |
| `isOpen` | `boolean` | Read-only. Whether the menu is open |

## Accessibility

- Pattern: Menu
- You provide: A trigger element and a <menu> of buttons or links with text labels
- The component manages: `role="menu"`, `role="menuitem"`, `role="none"`, `role="separator"`, `role="group"`, `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-description`, `aria-disabled`, `aria-keyshortcuts`, `aria-labelledby`, `aria-hidden`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ContextMenu` / `Shift+F10` | Open the menu at the trigger and focus the first item | Focus on the trigger or on anything inside it |
| `ArrowDown` | Move to the next item, wrapping to the first |  |
| `ArrowUp` | Move to the previous item, wrapping to the last |  |
| `Home` | Move to the first item |  |
| `End` | Move to the last item |  |
| `Enter` / `Space` | Activate the focused item and close the menu |  |
| `Tab` | Close the menu |  |
| `Escape` | Close the menu and return focus to the trigger | Native behaviour of popover |
