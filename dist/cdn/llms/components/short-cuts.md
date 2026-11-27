# <short-cuts>

Keyboard shortcuts help overlay: a modal dialog listing the command registry ([data-command][data-shortcut]) and data-hotkey actions, toggled by ? (remappable or off) or show()/toggle().

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/shortcuts/
- Vanilla Breeze 0.7.4

## Example

```html
<!-- Place once per page, typically in your layout -->
<short-cuts></short-cuts>

<!-- A visible way in for pointer and touch users -->
<button type="button" id="open-shortcuts">Keyboard shortcuts</button>
<script type="module">
  document.getElementById('open-shortcuts')
    .addEventListener('click', () => document.querySelector('short-cuts').show());
</script>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `hotkey` | string | `shift+?` | Key combo that toggles the dialog; "none" disables the character-key shortcut (WCAG 2.1.4). A character-key combo also stops firing, and unscoped character-key shortcuts are left out of the dialog, while <html data-char-shortcuts="off"> is set (settings-panel Single-Key Shortcuts preference). Observed. |
| `data-label-title` | string | `Keyboard shortcuts` | Dialog heading and accessible name |
| `data-label-general` | string | `General` | Group holding the component's own shortcut |
| `data-label-self` | string | `Show keyboard shortcuts` | Label of the component's own shortcut |
| `data-label-close` | string | `Close` | Close button accessible name |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-shortcut` | [data-command] (anywhere in the page) | string |  | Command-registry source: label from data-command, group from data-command-group |
| `data-hotkey` | any non-kbd element (anywhere in the page) | string |  | Hotkey-action source: label from data-hotkey-label or text, group from data-hotkey-group (default "Page Actions") |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `short-cuts:shortcuts-changed` | `{ shortcuts: Record<string, Array<{ label, shortcut }>> \| null, source: 'property' }` | The shortcuts property was set |

## Methods

| Method | Description |
| --- | --- |
| `show` | Open the dialog (rebuilds the list from the current sources) |
| `close` | Close the dialog |
| `toggle` | Open when closed, close when open |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `shortcuts` | `Record<string, Array<{ label: string, shortcut: string }>> \| null` | Override list keyed by group name; replaces the registry sources (the component's own hotkey is still listed). null restores the registries. |
| `open` | `boolean` | Whether the dialog is open |
| `hotkey` | `string \| null` | Active combo, or null when hotkey="none" |

## Accessibility

- Pattern: Native dialog
- The component manages: `aria-labelledby`, `aria-label`, `aria-hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `?` | Open or close the shortcuts dialog (the key is set by the hotkey attribute) | Focus anywhere on the page except in a form field, while character shortcuts are enabled |
| `Escape` | Close the dialog | Native behaviour of dialog |
