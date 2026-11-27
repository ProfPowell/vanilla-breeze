# <compare-surface>

Before/after comparison slider: two overlaid children with a draggable, keyboard-operable divider (side by side without JS)

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/comparison/
- Vanilla Breeze 0.7.4

## Example

```html
<compare-surface>
  <img src="before.jpg" alt="Before" />
  <img src="after.jpg" alt="After" />
</compare-surface>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `position` | number |  | Divider position 0-100 measured from the inline-start edge (right in RTL), default 50. Observed; user drags and key presses reflect the integer value back. |
| `label` | string |  | Accessible name for the slider handle, default "Comparison slider". Observed. |
| `aria-label` |  |  | Used as the slider handle's accessible name when label is absent. A host with aria-label or aria-labelledby and no role of its own gets role="group" |

## Structure

| Child | Description |
| --- | --- |
| `First child (any element)` | Shown on the inline-start side of the divider (the "before" view) |
| `Second child (any element)` | Shown on the inline-end side of the divider (the "after" view). Further children are hidden once upgraded. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `compare-surface:change` | `{ position: number }` | Fired when the user drags or uses the keyboard and the integer position changes. Not fired on upgrade or for attribute/property writes. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `position` | `number` | Get or set the integer position (0-100). Setting clamps, rounds and reflects to the attribute without firing compare-surface:change. |

## Accessibility

- Pattern: Slider
- You provide: Two child elements to compare, each with its own text alternative, and a label attribute when the default slider name does not fit
- The component manages: `role="slider"`, `role="group"`, `tabindex`, `aria-label`, `aria-orientation`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowRight` | Increase the position by 1% (reversed in right-to-left) | Focus on the divider |
| `ArrowLeft` | Decrease the position by 1% (reversed in right-to-left) | Focus on the divider |
| `ArrowUp` | Increase the position by 1% | Focus on the divider |
| `ArrowDown` | Decrease the position by 1% | Focus on the divider |
| `Shift+ArrowRight` / `Shift+ArrowLeft` / `Shift+ArrowUp` / `Shift+ArrowDown` | Change the position by 10% instead of 1% | Focus on the divider |
| `PageUp` | Increase the position by 10% | Focus on the divider |
| `PageDown` | Decrease the position by 10% | Focus on the divider |
| `Home` | Set the position to 0% | Focus on the divider |
| `End` | Set the position to 100% | Focus on the divider |
