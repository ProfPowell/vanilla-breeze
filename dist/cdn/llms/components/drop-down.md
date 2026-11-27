# <drop-down>

Accessible dropdown: an APG menu button for actions, or (with hover) an APG disclosure for navigation links

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/dropdown/
- Vanilla Breeze 0.7.4

## Example

```html
<drop-down>
  <button data-trigger>Options</button>
  <menu>
    <li><button>Edit</button></li>
    <li><button>Duplicate</button></li>
    <li><button>Share</button></li>
    <li role="separator"></li>
    <li><button class="danger">Delete</button></li>
  </menu>
</drop-down>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `position` | `bottom-start`, `bottom-end`, `top-start`, `top-end` | `bottom-start` | Menu position relative to the trigger. start/end are logical, so they mirror in RTL |
| `hover` | boolean |  | Navigation disclosure: no menu roles, links stay in the Tab order, a <button aria-expanded> toggles the list (generated next to a link trigger). Opens on mouse hover or toggle activation, not on focus |
| `no-flip` | boolean |  | Keep the requested position instead of flipping to the opposite side when the menu overflows the viewport |
| `open` | boolean |  | Reflected state — set by open()/close()/toggle() methods, not intended as initial markup |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-trigger` | button \| a | boolean |  | Marks the element that opens the menu. Falls back to the first direct <button> if absent. |
| `data-disabled` | button, a | boolean |  | Disabled item: aria-disabled="true", stays in the arrow-key order, cannot be activated |
| `data-value` | button, a | string |  | Value reported in drop-down:select detail.value and the items property |

## Structure

| Child | Description |
| --- | --- |
| `<button data-trigger> or <a data-trigger>` | Trigger element that opens the menu. Action mode: aria-haspopup="menu" + aria-expanded. Navigation mode: a link trigger stays a plain link |
| `<button data-dropdown-toggle>` | Navigation mode with a link trigger: the submenu toggle (aria-expanded, aria-controls). Generated with aria-label "<link text> submenu" when absent; author one to set your own label |
| `<menu>` | Menu container with <li> items holding <button> or <a> actions. Only rows whose nearest menu is this one belong to it (nested drop-downs keep their own) |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `drop-down:open` |  | Fired when the menu opens |
| `drop-down:close` |  | Fired when the menu closes |
| `drop-down:select` | `{ item, value }` | Fired when one of this menu's items is activated by click or keyboard (not for disabled items or a nested drop-down's trigger row) |
| `drop-down:items-changed` | `{ items, source: 'property' }` | Fired after the items property rebuilds the menu |

## Methods

| Method | Description |
| --- | --- |
| `open()` | Open the menu |
| `close()` | Close the menu |
| `toggle()` | Toggle the menu |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `items` | `Array<{ label, value?, href?, disabled? } \| { separator: true }>` | Get the menu as data, or assign to rebuild it (href → <a>, otherwise <button type="button">; disabled → data-disabled + aria-disabled) |
| `isOpen` | `boolean` | Read-only. Whether the menu is open |

## Accessibility

- Pattern: Menu button
- You provide: A trigger with a text label and a <menu> of buttons or links; in hover (navigation) mode the list keeps link semantics and a toggle button is generated beside a link trigger
- The component manages: `role="menu"`, `role="menuitem"`, `role="none"`, `role="separator"`, `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-disabled`, `aria-label`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Open the menu and focus the first item | Native behaviour of button (the trigger) |
| `ArrowDown` | Open the menu and focus the first item | Focus on the trigger, action mode |
| `ArrowUp` | Open the menu and focus the last item | Focus on the trigger, action mode |
| `ArrowDown` | Move to the next item, wrapping to the first | Focus in the menu, action mode |
| `ArrowUp` | Move to the previous item, wrapping to the last | Focus in the menu, action mode |
| `Home` | Move to the first item | Focus in the menu, action mode |
| `End` | Move to the last item | Focus in the menu, action mode |
| `Enter` / `Space` | Activate the focused item and close the menu | Focus in the menu, action mode |
| `Printable character` | Move to the next item whose label starts with the typed characters | Focus in the menu, action mode |
| `Tab` | Close the menu | Focus in the menu, action mode |
| `Escape` | Close the menu and return focus to the trigger or toggle button |  |
