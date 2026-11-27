# <command-palette>

Command palette / Cmd+K launcher (modal dialog, combobox + listbox)

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/command-palette/
- Vanilla Breeze 0.7.4

## Example

```html
<command-palette hotkey="meta+k">
  <command-group label="Navigation">
    <command-item value="home" data-hotkey="shift+h">
      Go Home
    </command-item>
    <command-item value="settings">
      Settings
    </command-item>
  </command-group>
  <command-group label="Actions">
    <command-item value="theme">Toggle Dark Mode</command-item>
    <command-item value="copy">Copy Current URL</command-item>
  </command-group>
</command-palette>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `hotkey` | string | `meta+k` | Global keyboard shortcut that toggles the palette (fires even in text fields) |
| `placeholder` | string | `Type a command...` | Search input placeholder text |
| `label` | string | `Command palette` | Accessible name of the dialog |
| `discover` | (no value), `auto` |  | Present: add commands from [data-command] / [commandfor] elements. "auto": also scan nav links and headings |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | command-group | string |  | Group header text |
| `value` | command-item | string |  | Value passed in command-palette:select detail.value |
| `data-hotkey` | command-item | string |  | Shortcut shown as a badge and bound page-wide while connected; fires command-palette:select without opening the palette (not in text fields) |
| `slot` | command-item > * | `icon` |  | slot="icon" marks the item's icon (cloned into the option) |

## Structure

| Child | Description |
| --- | --- |
| `<command-group>` | Group of commands; rendered as a role="group" named by its label |
| `<command-item>` | One command inside a <command-group>; its text is the label, an element with slot="icon" the icon |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `command-palette:select` | `{ value }` | Fired when a declared command is chosen from the list or by its data-hotkey |
| `command-palette:open` |  | Fired when the palette opens |
| `command-palette:close` |  | Fired once whenever the dialog closes (close(), selection, Escape, backdrop click) |
| `command-palette:commands-changed` | `{ commands, source: 'property' }` | Fired after the commands property rebuilds the palette |

## Methods

| Method | Description |
| --- | --- |
| `open()` | Open the palette and focus the search input |
| `close()` | Close the palette |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `commands` | `Array<{ value, label, hotkey?, group?, icon? }>` | Get the declared commands as data, or assign to rebuild the groups |
| `isOpen` | `boolean` | Read-only. Whether the dialog is open |

## Accessibility

- Pattern: Combobox
- You provide: A label for each command; a label attribute when the default "Command palette" does not describe the dialog
- The component manages: `role="combobox"`, `role="listbox"`, `role="group"`, `role="option"`, `aria-label`, `aria-labelledby`, `aria-autocomplete`, `aria-controls`, `aria-expanded`, `aria-activedescendant`, `aria-selected`, `aria-keyshortcuts`, `aria-hidden`, `tabindex`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Meta+k` / `Ctrl+k` | Open or close the palette (Meta on macOS, Ctrl elsewhere; set by the hotkey attribute) | Anywhere on the page |
| `ArrowDown` | Move to the next command, wrapping to the first | Palette open |
| `ArrowUp` | Move to the previous command, wrapping to the last | Palette open |
| `Enter` | Run the active command and close the palette | Palette open |
| `Escape` | Close the palette | Palette open |
