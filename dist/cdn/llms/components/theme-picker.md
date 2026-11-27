# <theme-picker>

Theme selection: color mode and theme (a select of every theme, or a short list as swatches), as a popover or inline panel

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/theme-picker/
- Vanilla Breeze 0.7.4

## Example

```html
<theme-picker>
  <button data-trigger>
    <icon-wc name="palette"></icon-wc>
    Theme
  </button>
</theme-picker>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `popover`, `inline` | `popover` | popover: trigger + floating panel; inline: always-visible panel |
| `themes` | string |  | Space-separated theme ids to offer, in that order (default: every theme). Unknown ids are ignored; the visitor's current theme is added if it is not listed |
| `swatches` | boolean |  | Theme chooser is a grid of colour swatches instead of a <select>; meant for a short themes list |
| `open` | boolean |  | Reflected state only — set by open()/close()/toggle(), not intended as initial markup (popover variant only) |
| `data-label-panel` | string | `Theme settings` | Panel aria-label (i18n override) |
| `data-label-trigger` | string | `Theme settings` | Generated trigger icon label (i18n override) |
| `data-label-mode` | string | `Color Mode` | Color mode legend and radiogroup label (i18n override) |
| `data-label-theme` | string | `Theme` | Visible label and accessible name of the theme select; legend of the swatch groups with swatches |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-trigger` | button | boolean |  | Marks the popover trigger (else the first child <button>; else a generated type=button icon trigger) |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `theme-picker:open` | `null` | Popover opened |
| `theme-picker:close` | `null` | Popover closed |

## Methods

| Method | Description |
| --- | --- |
| `open()` | Open the popover and move focus into it (popover variant only) |
| `close()` | Close the popover |
| `toggle()` | Open or close the popover |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `isOpen` | `boolean` | Whether the popover is open |

## Accessibility

- Pattern: Non-modal dialog with native form controls
- You provide: Optionally a trigger button with an accessible name; a labelled palette button is generated when none is authored
- The component manages: `role="dialog"`, `role="group"`, `role="radiogroup"`, `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-label`, `aria-labelledby`, `aria-busy`, `aria-hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Escape` | Close the panel and move focus to the trigger | Popover variant with the panel open, focus anywhere on the page |
